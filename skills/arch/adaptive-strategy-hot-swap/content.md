# Adaptive Strategy Hot-Swap with Hysteresis

## Problem

Any system that chooses a "best" policy from a candidate pool — trading strategies, ranking models, routing rules, caching strategies — tends to face the same failure mode: re-evaluate continuously and you **flap**, swapping between near-equivalent options on each tick and paying transition cost for every swap. Re-evaluate never, and you're stuck on a policy that stopped working months ago.

## Pattern

Decouple *re-evaluation* from *swapping* with three knobs:

1. **Periodic re-analysis**, not continuous. A cron-style cadence (hours to days) re-scores every candidate against a recent window of real data.
2. **Composite score**, not a single metric. Combine multiple axes — reward, risk, drawdown, win-rate, stability — with explicit weights. A single metric is always gameable.
3. **Hysteresis threshold for the swap.** Only switch the active policy when `new_score - incumbent_score > δ`. Set δ large enough to absorb noise, small enough to stay responsive (often 2–10% of score range). This is the anti-flap gate.

Transition cost matters: if swapping is expensive (cancel open orders, invalidate caches, retrain a sub-model), make δ a function of cost, not a constant.

## Example (sanitized)

```java
boolean shouldUpdateStrategy(AnalysisResult old, AnalysisResult fresh) {
    if (old == null) return true;

    double returnDelta  = fresh.best.totalReturn  - old.best.totalReturn;
    double sharpeDelta  = fresh.best.sharpeRatio  - old.best.sharpeRatio;
    double mddDelta     = fresh.best.maxDrawdown  - old.best.maxDrawdown;  // less negative is better

    double composite =
          returnDelta * 0.5
        + sharpeDelta * 0.3
        + mddDelta    * 0.2;

    return composite > 0.02;  // hysteresis: 2% composite improvement
}
```

Pair this with a *performance tracker* that stores the last N scores per managed entity, so you can also detect the inverse case — an incumbent policy that has degraded below a *removal* threshold and should be killed rather than swapped.

## When to Use

- Automated trading / portfolio systems with backtestable strategies.
- Ranking / recommendation systems that periodically pick between trained model checkpoints.
- Routing layers that choose between providers (payment, SMS, LLM backends) based on rolling success metrics.
- Cache / sharding policies that adapt to access patterns but can't afford to thrash.

## Pitfalls

- **δ too small → flapping.** The cure is always a bigger δ, not a smarter metric.
- **δ too large → ossification.** Pair with a `removal_threshold` so a strictly *failing* incumbent doesn't get protected by the anti-swap gate.
- **Weights tuned on in-sample data.** Pick weights from business priorities, not by optimizing on the same data you score on — you'll overfit the weighting.
- **No transition-cost accounting.** If swapping cancels orders or evicts caches, bake that cost into the incumbent's score so the delta is apples-to-apples.
- **Evaluating on stale windows.** If you re-analyze every 24h against 12 months of history, the marginal day barely moves the score — use a rolling window tight enough for the composite to respond.
- **Forgetting the null case.** `old == null` (first activation) should bypass the threshold.
