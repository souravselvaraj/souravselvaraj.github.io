---
layout: page
title: Visuomotor Imitation Learning
description: Behavior Cloning vs. Diffusion Policy on a robosuite pick-and-place task, trained with robomimic.
importance: 8
category: projects
---

A compact training setup for **visuomotor imitation learning** on a robotic pick-and-place task in `robosuite`, using `robomimic`. The project compares two policy classes trained from the same demonstrations:

- **Transformer-based Behavior Cloning**
- **Diffusion Policy** with a 1D U-Net denoising model

<div class="row justify-content-center">
    <div class="col-sm-10 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/diffusion_policy_rollout.mp4" class="img-fluid rounded z-depth-1" controls=true %}
    </div>
</div>
<div class="caption">
    Diffusion Policy rollout on the robosuite pick-and-place task.
</div>

This project was the springboard for my later [Conditional Flow Matching policy work](/projects/flow-matching-policies/), which replaces the diffusion denoising loop with a learned ODE velocity field.

Code: [github.com/souravselvaraj/Visuomotor-Imitation-Learning](https://github.com/souravselvaraj/Visuomotor-Imitation-Learning)
