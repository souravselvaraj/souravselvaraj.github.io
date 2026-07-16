---
layout: page
title: Flow Matching Policies
description: Conditional Flow Matching visuomotor policies in robomimic — 11× faster inference than Diffusion Policy at matched task success.
img: assets/img/projects/cfm_thumb.jpg
importance: 5
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-8 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/diffusion_policy_rollout.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    A Diffusion Policy rollout on the robosuite pick-and-place task from my robomimic training stack — the baseline architecture that CFM accelerates.
</div>

Diffusion Policy is the current workhorse for multimodal visuomotor imitation, but it pays for its expressiveness at deployment: **100 DDPM denoising steps for every action chunk**. This project replaces the denoising loop with **Conditional Flow Matching (CFM)** — implemented from scratch in [robomimic](https://github.com/souravselvaraj/robomimic/tree/flow-matching) — keeping the receding-horizon architecture identical and swapping only the generative core.

## The idea

Instead of learning to reverse a noising process step by step, CFM learns a **velocity field of an ODE** that transports noise samples to action samples along (approximately) straight probability paths. Straight paths mean a cheap solver does the job: the learned field is integrated in just **10 Euler steps**, versus 100 network evaluations for DDPM.

- Same 65M-parameter backbone as the Diffusion Policy baseline — the comparison isolates the generative objective.
- Receding-horizon action chunking preserved, so the policy interface is unchanged.
- Solver ablations: Euler vs. midpoint integration, 10–50 inference steps.

## Results

**26.7 ms per action chunk** at inference — an **11× speedup** over the 100-step DDPM Diffusion Policy on identical hardware and architecture. Benchmarked on 5 robomimic tasks, 3 seeds × 50 rollouts each, matching or beating BC-RNN reference results on 4 of 5 tasks:

| Task              | CFM success rate      |
| ----------------- | --------------------- |
| lift              | **100%**              |
| can               | **94%**               |
| two-arm transport | **84%** (BC-RNN: 71%) |
| tool_hang         | **64%**               |

The takeaway: for visuomotor imitation, flow matching delivers diffusion-class multimodality at a fraction of the inference cost — which matters for real-time control loops.

Code: [github.com/souravselvaraj/robomimic — flow-matching branch](https://github.com/souravselvaraj/robomimic/tree/flow-matching)
