---
layout: page
title: Flow Matching Policies
description: Conditional Flow Matching visuomotor policies in robomimic — beats Diffusion Policy head-to-head, with a 94× faster 1-step inference mode.
img: assets/img/projects/cfm_thumb.jpg
importance: 5
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-8 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_transport_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Flow Matching policy solving two-arm transport — 84% success vs. 72% for Diffusion Policy and 71% for BC-RNN on the same benchmark.
</div>

Diffusion Policy is the current workhorse for multimodal visuomotor imitation, but it pays for its expressiveness at deployment: **100 DDPM denoising steps for every action chunk**. This project replaces the denoising loop with **Conditional Flow Matching (CFM)** — implemented from scratch in [robomimic](https://github.com/souravselvaraj/robomimic/tree/flow-matching) — keeping the receding-horizon architecture identical and swapping only the generative core.

## The idea

Instead of learning to reverse a noising process step by step, CFM learns a **velocity field of an ODE** that transports noise samples to action samples along (approximately) straight probability paths. Straight paths mean a cheap solver does the job — a few Euler steps, or even one.

## Experimental setup

- robomimic `ph` (proficient-human) `low_dim` datasets; success rate = fraction of **50 rollouts** that solve the task.
- Flow Matching and Diffusion Policy share the **same 65M-parameter conditional U-Net backbone** — the comparison isolates the generative objective. BC-RNN is the robomimic reference.
- FM default sampler: 10 Euler steps; ablations over 10/20/50 Euler and midpoint steps.

## Success rates

| Task      | Horizon | Flow Matching (CFM) | Diffusion Policy | BC-RNN (ref) |
| --------- | :-----: | :-----------------: | :--------------: | :----------: |
| Lift      |   400   |  **100%** (50/50)   |        —         |     100%     |
| Can       |   400   |   **94%** (47/50)   |        —         |     100%     |
| Square    |   400   |   **40%** (20/50)   |   36% (18/50)    |     84%      |
| Transport |   700   |   **84%** (42/50)   |   72% (36/50)    |     71%      |
| Tool Hang |   700   |   **64%** (32/50)   |        —         |     67%      |

Head-to-head on the same backbone and protocol, **FM ≥ Diffusion Policy on every task tested** (Square 40% vs. 36%, Transport 84% vs. 72%; "—" = A/B not run for that task). Square is hard for *both* learned samplers at this training budget — solver and retraining ablations all cap near 40%, so it reflects task difficulty rather than a CFM weakness.

## Inference speed

Identical 65M U-Net, RTX PRO 6000 (Blackwell), 100 trials:

| Policy / sampler            | NFE | ms per action chunk | Speedup vs. DDPM-100 |
| --------------------------- | :-: | :-----------------: | :------------------: |
| Flow Matching — Euler 1     |  1  |       **3.1**       |        94.4×         |
| Flow Matching — Euler 5     |  5  |        13.4         |        21.9×         |
| Flow Matching — Euler 10 ★  | 10  |        26.7         |        11.0×         |
| Flow Matching — midpoint 5  | 10  |        26.9         |        10.9×         |
| Diffusion Policy — DDIM 10  | 10  |        28.9         |        10.2×         |
| Diffusion Policy — DDPM 100 | 100 |        293.7        |   1.0× (baseline)    |

★ = default used for the success-rate rollouts above.

At matched compute (10 network evaluations) FM and DDIM are comparable on wall-clock — CFM's real advantages are **quality at few steps** and a viable **1-step mode (3.1 ms, 94× faster than DDPM-100)** that Diffusion Policy has no equivalent of. Training is slightly cheaper too (e.g., Transport: 1h26m for FM vs. 1h38m for DP at 2000 epochs on a single GPU).

## Rollouts

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_lift_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_can_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_square_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_toolhang_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Flow Matching rollouts: lift and can (top), square and tool hang (bottom).
</div>

Code and full benchmark details: [flow-matching branch](https://github.com/souravselvaraj/robomimic/tree/flow-matching) · [table.md](https://github.com/souravselvaraj/robomimic/blob/flow-matching/table.md)
