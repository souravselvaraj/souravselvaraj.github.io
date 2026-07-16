---
layout: page
title: Flow Matching Policies
description: Conditional Flow Matching visuomotor policies in robomimic — 11× faster inference than Diffusion Policy at matched task success.
img: assets/img/projects/diffusion_policy_rollout.jpg
importance: 5
category: projects
---

Implemented a **Conditional Flow Matching (CFM)** visuomotor policy from scratch in [robomimic](https://github.com/souravselvaraj/robomimic/tree/flow-matching): Diffusion Policy's receding-horizon architecture, with the iterative denoising process replaced by a learned **ODE velocity field integrated in 10 Euler steps**.

## Why flow matching

Diffusion Policy pays for its multimodal action distributions with slow inference — 100 DDPM denoising steps per action chunk. CFM learns a straight-line probability flow instead, so the same architecture needs an order of magnitude fewer integration steps.

## Results

- **26.7 ms per action chunk** at inference — an **11× speedup** over the default 100-step DDPM Diffusion Policy on an identical 65M-parameter backbone.
- Solver and inference-step ablations (Euler/midpoint, 10–50 steps) against Diffusion Policy baselines.
- Benchmarked on **5 robomimic tasks** (3 seeds, 50 rollouts each), matching or beating BC-RNN references on 4/5: **100%** lift, **94%** can, **84% vs. 71%** two-arm transport, **64%** tool_hang.

Code: [github.com/souravselvaraj/robomimic (flow-matching branch)](https://github.com/souravselvaraj/robomimic/tree/flow-matching)
