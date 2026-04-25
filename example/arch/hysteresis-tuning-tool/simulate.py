#!/usr/bin/env python3
"""Monte Carlo simulator for the hysteresis-ratio experiment in
paper/arch/feature-flag-flap-prevention-policies.

Generates 4 synthetic workload classes (smooth / spiky / bursty / drifting),
runs a hysteresis-breaker simulator at ratios in {1.2, 1.5, 2.0, 2.5, 3.0}
with a fixed trip-water of 10% error rate, and reports per-cell:

  - flap count per hour (state transitions per simulated hour)
  - average trip-detection delay in minutes (from error-rate-exceeding-trip
    to breaker-tripping-into-open)

Pass criteria from the paper's experiment.hypothesis:
  - ratio 1.5x:    ≤1 flap/hour AND avg delay ≤10 min   (must pass)
  - ratio <1.3x:   should fail flap criterion
  - ratio >2.5x:   should fail delay criterion

Deterministic via a fixed RNG seed so results are reproducible.
"""

from __future__ import annotations

import argparse
import math
import random
import statistics
import sys
from dataclasses import dataclass

SAMPLES_PER_HOUR = 60       # 1 sample per minute
HOURS = 24                   # 24h replay
TRIP_WATER = 0.10            # 10% error rate trips the breaker
RATIOS = [1.2, 1.5, 2.0, 2.5, 3.0]
WORKLOADS = ["smooth", "spiky", "bursty", "drifting"]
SEED = 42


def workload_smooth(rng: random.Random, n: int) -> list[float]:
    """Stable error around 5%, gaussian noise σ=2%, occasional 1-sample spikes to 15%."""
    series = []
    for i in range(n):
        v = rng.gauss(0.05, 0.02)
        if rng.random() < 0.005:  # rare spike
            v = max(v, 0.15)
        series.append(max(0.0, min(0.5, v)))
    return series


def workload_spiky(rng: random.Random, n: int) -> list[float]:
    """Baseline 5%, ~5-minute spikes to 12-18% every ~30 minutes."""
    series = []
    in_spike = 0
    for i in range(n):
        if in_spike > 0:
            v = rng.uniform(0.12, 0.18)
            in_spike -= 1
        else:
            v = rng.gauss(0.05, 0.015)
            if i > 0 and i % 30 == 0 and rng.random() < 0.7:
                in_spike = rng.randint(3, 6)
        series.append(max(0.0, min(0.5, v)))
    return series


def workload_bursty(rng: random.Random, n: int) -> list[float]:
    """Alternates 30-min calm (3-7%) and 30-min busy (8-14%) periods."""
    series = []
    period = 30
    for i in range(n):
        phase = (i // period) % 2
        if phase == 0:
            v = rng.uniform(0.03, 0.07)
        else:
            v = rng.uniform(0.08, 0.14)
        series.append(v)
    return series


def workload_drifting(rng: random.Random, n: int) -> list[float]:
    """Slow sinusoidal drift between 4% and 13% across the day, plus 1% gaussian noise."""
    series = []
    for i in range(n):
        phase = (i / n) * 2 * math.pi
        base = 0.085 + 0.045 * math.sin(phase)  # oscillates 4%..13%
        v = base + rng.gauss(0, 0.01)
        series.append(max(0.0, min(0.5, v)))
    return series


WORKLOAD_FACTORIES = {
    "smooth": workload_smooth,
    "spiky": workload_spiky,
    "bursty": workload_bursty,
    "drifting": workload_drifting,
}


@dataclass
class CellResult:
    flap_per_hour: float
    avg_detection_delay_min: float
    open_periods: int
    samples_open: int


def simulate(series: list[float], trip_water: float, ratio: float) -> CellResult:
    """Run a hysteresis-breaker over the time-series.

    State machine:
      closed  → open   when error_rate >= trip_water
      open    → closed when error_rate <= trip_water / ratio   (low-water reset)

    Track:
      - state transitions (closed→open count = flap unit; we count transitions to open)
      - delay between first sample exceeding trip_water and the actual trip
        (if we trip immediately, delay = 0; if hysteresis is wide we may not trip
         even when threshold is exceeded once)

    A state is reset by a low-water dip; if we hit trip again afterward, that's a flap.
    """
    reset_water = trip_water / ratio
    state = "closed"
    transitions_to_open = 0
    open_periods = 0
    samples_open = 0
    delays: list[int] = []
    breach_start: int | None = None

    for i, v in enumerate(series):
        if state == "closed":
            if v >= trip_water:
                if breach_start is None:
                    breach_start = i
                # we "trip" once breach has been sustained 1 sample at >= trip_water
                # (single-sample trip — paper's premise is about flap, this is the
                #  simplest implementation; lengthier debounce is a separate axis)
                state = "open"
                transitions_to_open += 1
                open_periods += 1
                if breach_start is not None:
                    delays.append(i - breach_start)
                breach_start = None
            elif breach_start is not None and v < trip_water:
                # error rate fell back without tripping; reset breach tracker
                breach_start = None
        else:  # state == open
            samples_open += 1
            if v <= reset_water:
                state = "closed"

    flap_per_hour = transitions_to_open / HOURS
    avg_delay = statistics.mean(delays) if delays else 0.0
    return CellResult(flap_per_hour, avg_delay, open_periods, samples_open)


def run() -> dict:
    rng = random.Random(SEED)
    n = SAMPLES_PER_HOUR * HOURS

    out: dict[str, dict[float, CellResult]] = {w: {} for w in WORKLOADS}
    for wl in WORKLOADS:
        # Each workload uses its own deterministic seed offset for reproducibility
        sub_rng = random.Random(SEED + hash(wl) % 1000)
        series = WORKLOAD_FACTORIES[wl](sub_rng, n)
        for r in RATIOS:
            out[wl][r] = simulate(series, TRIP_WATER, r)
    return out


def render(results: dict[str, dict[float, "CellResult"]]) -> str:
    lines = []
    lines.append(f"Hysteresis-ratio Monte Carlo — N={SAMPLES_PER_HOUR * HOURS} samples (1/min × {HOURS}h), seed={SEED}, trip_water={TRIP_WATER}")
    lines.append("")
    header = f"{'workload':<12}" + "".join(f" {r:>5.1f}x ({'flap/h':>6}, {'delay-min':>9})" for r in RATIOS)
    lines.append(header)
    lines.append("-" * len(header))

    for wl in WORKLOADS:
        row_parts = [f"{wl:<12}"]
        for r in RATIOS:
            cell = results[wl][r]
            row_parts.append(f"   {cell.flap_per_hour:>6.2f}    {cell.avg_detection_delay_min:>9.2f}")
        lines.append("".join(row_parts))

    lines.append("")
    lines.append("Pass criteria from paper:")
    lines.append("  ratio 1.5x: ≤1 flap/h AND avg delay ≤10 min  (must pass on ALL workloads)")
    lines.append("  ratio <1.3x: should FAIL flap criterion (>1/h) on ≥1 workload")
    lines.append("  ratio >2.5x: should FAIL delay criterion (>10min) on ≥1 workload")
    lines.append("")

    # Verdict per ratio
    verdicts = {}
    for r in RATIOS:
        passes_flap = all(results[wl][r].flap_per_hour <= 1.0 for wl in WORKLOADS)
        passes_delay = all(results[wl][r].avg_detection_delay_min <= 10.0 for wl in WORKLOADS)
        verdicts[r] = (passes_flap, passes_delay)
        verdict = "BOTH PASS"
        if not passes_flap and not passes_delay:
            verdict = "BOTH FAIL"
        elif not passes_flap:
            verdict = "FAIL: flap"
        elif not passes_delay:
            verdict = "FAIL: delay"
        lines.append(f"  ratio {r:>4.1f}x → {verdict}")

    # Premise-supports verdict
    lines.append("")
    lines.append("Premise check:")
    if verdicts[1.5] == (True, True):
        lines.append("  ✓ ratio 1.5x passes both — premise's central claim supported")
    else:
        lines.append("  ✗ ratio 1.5x does NOT pass both — premise's central claim refuted")
    if not verdicts[1.2][0]:
        lines.append("  ✓ ratio 1.2x fails flap (as predicted)")
    else:
        lines.append("  ✗ ratio 1.2x does not fail flap (premise's lower bound off)")
    if not verdicts[3.0][1]:
        lines.append("  ✓ ratio 3.0x fails delay (as predicted)")
    else:
        lines.append("  ✗ ratio 3.0x does not fail delay (premise's upper bound off)")
    return "\n".join(lines)


def main() -> int:
    p = argparse.ArgumentParser()
    args = p.parse_args()
    results = run()
    print(render(results))
    return 0


if __name__ == "__main__":
    sys.exit(main())
