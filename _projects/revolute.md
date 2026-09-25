---
layout: page
title: Revolute
description: Flow-matching visuomotor policies for a Seeed B601 RS arm on LeRobot — teleoperated demonstrations, a controlled U-Net vs. transformer comparison, and models sized for a Jetson Orin Nano.
img: assets/img/projects/revolute_thumb.jpg
importance: 6
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-8 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/revolute_thumb.jpg" title="Toast task workspace" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The workspace from the top camera: bread slices in the holder, the toaster, and the pan.
</div>

**Revolute** is an imitation-learning stack for a **Seeed B601 RS** 7-DoF arm, built on [LeRobot](https://github.com/huggingface/lerobot): teleoperated data collection, flow-matching policy training, and on-robot evaluation. The deployment target is a **Jetson Orin Nano 8GB**, and every default — frozen vision backbone, a single observation step, five ODE integration steps — is set by what fits a **533 ms re-plan window** on that device, not by what trains best on a cluster GPU.

## Why flow matching

Rectified flow learns a straight-path velocity field, so sampling an action chunk takes **5 Euler steps** instead of a diffusion policy's ~100 DDPM steps — the reason it was chosen for an edge deployment. (See also [Flow Matching Policies]({{ '/projects/flow-matching-policies/' | relative_url }}) for a benchmark against Diffusion Policy in robomimic.)

## Policies

Four policies are registered as a LeRobot plugin:

| Policy      | Velocity field / head                                                                   |
| ----------- | --------------------------------------------------------------------------------------- |
| `flow_unet` | FiLM-conditioned 1D conv U-Net (the Diffusion Policy backbone)                          |
| `flow_dit`  | DiT transformer with adaLN-Zero and cross-attention into the vision tokens              |
| `act_dino`  | ACT-style transformer decoder with direct chunk regression — the non-generative control |
| `flow_lang` | `flow_dit` plus a frozen text encoder — language-conditioned                            |

`flow_unet` and `flow_dit` share the same frozen DINOv2 encoder, objective, optimizer, and data pipeline — **only the velocity field differs**, so comparing them is a controlled experiment rather than a capacity comparison.

## Sized for the edge

- A frozen `dinov2-small` backbone with a small trainable transformer head per camera — about 40 demonstrations per task cannot fine-tune a ViT.
- One observation step, a 48-step action horizon (1.6 s at 30 fps), and 16 executed actions per re-plan (533 ms).
- Measured off-board, `flow_dit_small` re-plans in 33 ms versus 83 ms for `flow_dit_base`; the larger model is more accurate on replayed episodes (0.200 vs. 0.284 joint units).

## Data

Two teleoperated sessions at 30 fps, recording opposite directions of the same manipulation, plus a third lever-pulling task:

| Task                                                   | Demonstrations | Frames |
| ------------------------------------------------------ | :------------: | :----: |
| Collect toast from the toaster and place it on the pan |       50       | 29,828 |
| Pick up a bread slice and put it in the toaster        |       40       | 23,847 |

The repository also patches a uint8 overflow in LeRobot's dataset statistics that collapsed the image standard deviations, and corrects a task annotation that described the reverse of the recorded demonstrations — harmless for the vision-only policies, but a language-conditioned policy would perform the opposite task.

## Status

Trained `flow_dit` policies have been rolled out on the real arm; no success rates are reported yet. Deployment on the Jetson Orin Nano itself has not been run, and the Orin latency figures in the repository are desk estimates, not measurements.

Code: [github.com/souravselvaraj/Revolute](https://github.com/souravselvaraj/Revolute)
