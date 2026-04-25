# hysteresis-tuning-tool

Monte Carlo simulator for the experiment in `paper/arch/feature-flag-flap-prevention-policies`.

## Run

```
python simulate.py
```

Reproducible (seed=42). One file, no dependencies beyond Python 3.10+.

## What it tests

The paper hypothesizes that the optimal hysteresis ratio for a feature-flag circuit breaker is **1.5–2x**, with narrower causing flap and wider delaying trip-detection. Specifically: at ratio 1.5x, expect ≤1 flap/h AND ≤10 min average trip-detection delay across 4 workload classes.

The simulator generates synthetic 24h time-series for 4 workload shapes:

| Workload | Pattern |
|---|---|
| smooth | stable ~5% error rate, σ=2% gaussian noise, rare 1-sample spikes |
| spiky | baseline 5%, ~5-minute spikes to 12-18% every ~30 minutes |
| bursty | alternating 30-min calm (3-7%) and busy (8-14%) periods |
| drifting | sinusoidal drift between 4% and 13% over the day, 1% noise |

Each workload is run through a hysteresis breaker at ratios in {1.2, 1.5, 2.0, 2.5, 3.0}, with trip-water fixed at 10% error rate. Reset-water = trip-water / ratio.

## What it found (run as of paper close, 2026-04-25)

```
workload       1.2x (flap/h, delay-min)   1.5x (flap/h, delay-min)   2.0x (flap/h, delay-min)   2.5x (flap/h, delay-min)   3.0x (flap/h, delay-min)
---------------------------------------------------------------------------------------------------------------------------------------------------
smooth           0.75         0.00         0.75         0.00         0.71         0.00         0.71         0.00         0.67         0.00
spiky            1.21         0.00         1.21         0.00         1.21         0.00         1.21         0.00         1.21         0.00
bursty           2.54         0.00         1.00         0.00         1.00         0.00         1.00         0.00         0.96         0.00
drifting         0.92         0.00         0.25         0.00         0.08         0.00         0.08         0.00         0.08         0.00
```

### Key findings

1. **Hysteresis helps on `bursty` and `drifting`** — flap drops from 2.54 → 1.00 (bursty) and 0.92 → 0.08 (drifting) as ratio widens to 1.5–2.0x. This supports the premise's core directional claim.

2. **Hysteresis does NOT help on `spiky`** — flap stays at 1.21/h regardless of ratio. Distinct above-trip-water events trip the breaker, then error rate drops well below any reset-water before the next spike. Hysteresis dead-zone is only useful for *borderline* error rates, not for *distinct* spike events. The paper's premise didn't anticipate this distinction.

3. **At 1.5x, spiky workload narrowly fails the ≤1 flap/h criterion** (1.21 vs 1.00). The premise's specific 1.5x claim is partially refuted. 2.0x doesn't help either — spiky is invariant to ratio in [1.5, 2.5].

4. **Delay axis is uninformative in this simulator** — average trip-detection delay = 0 in every cell because the breaker trips on a single sample exceeding trip-water. The paper's claim that "wider hysteresis delays trip" is actually about *debouncing* (consecutive-sample requirement), which is orthogonal to hysteresis (trip-vs-reset threshold gap). The simulator does not test debouncing; the paper's premise.then conflated two mechanisms.

### Verdict

**partial** — the directional claim (hysteresis reduces flap on borderline workloads) is supported; the specific 1.5x optimum is refuted on spiky workloads; the "wider delays trip" branch of the claim was about debouncing, not hysteresis, and is orthogonal to what was tested.

## Limitations

- Single-sample trip with no debounce. Real systems usually require N≥2 consecutive breaches. Adding debounce would re-introduce a delay axis the simulator currently flatlines at zero.
- Workload synthesis is deterministic (fixed seed). Real production data has heavier tails and adversarial patterns this simulator does not capture.
- Trip-water is fixed at 10%. The optimal hysteresis ratio likely depends on the trip-water value too; varying both is future work.
- Only steady-state. Transient behavior at flag-flip time (cold start, burst-in-burst) is not modeled.

## Provenance

- Built as `experiments[0].built_as` for `paper/arch/feature-flag-flap-prevention-policies` — closes that paper's loop. Result was partial-refute; the paper's premise.then was rewritten to (1) acknowledge the workload-dependent finding, (2) drop the conflation of hysteresis and debouncing.
