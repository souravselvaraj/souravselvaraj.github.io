---
layout: page
title: CADENCE
description: A learned step planner with no fixed gait. Every 40 ms it picks one step, or none, and a model-based controller lands it.
img: assets/img/projects/gaitnet_pipeline.jpg
importance: 2
category: research
---

CADENCE is a learned step planner for a Unitree Go1 crossing ground full of holes. It has no fixed gait. Every 40 ms it picks a leg and a safe foothold, or no step, and sets a swing time. A model-based controller carries out the step. I work on it with Owen Sullivan in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli.

<div class="row justify-content-center">
    <div class="col-sm-11 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/gaitnet_49void_0.20mps.mp4" class="img-fluid rounded z-depth-1" width="100%" autoplay=true loop=true controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Hardest benchmark setting in simulation: 49% voids at 0.20 m/s.
</div>

We train CADENCE with PPO in NVIDIA Isaac Lab, where a convex MPC executes its steps. Nothing in training prescribes a gait. Then we run it frozen on OCS2's nonlinear MPC and whole-body controller.

Controllers don't always put the foot where they're told. At speed, our training controller overshot by more than the clearance CADENCE keeps around each hole. So I fit a small inverse footstep model (IFM) to each controller's logged steps. It returns the command that lands the foot on target. On flat ground, it cuts OCS2's RMS landing error from 6 cm to 2 cm, about the clearance around each hole. Refitting only this model per controller follows FADA (Xie et al., 2026).

## Who built what

CADENCE builds on GaitNet, Owen's master's thesis. He wrote the original code and the GPU convex MPC our training now uses. We share first authorship.

I added the candidate mixer, a motion history and the inverse footstep models. I did most of the OCS2 deployment, including the Gazebo benchmark. I finished the Go1 hardware bring-up, building on another contributor's earlier work.

## Results

In Gazebo, every planner runs the same 600 trials, with voids covering 26 to 49% of the ground.

| Planner                          | All trials | 49% voids |
| -------------------------------- | :--------: | :-------: |
| **CADENCE** (mean of five seeds) | **85.1%**  | **72.9%** |
| OCS2 trot                        |   67.8%    |   43.0%   |
| OCS2 static walk                 |   65.5%    |   40.0%   |

Even its weakest seed beat the trot by 10.5 points. The baselines are OCS2's stock gaits, untuned. No simpler footstep correction lifted it above the trot.

In the run we analyzed, its gait had no fixed period or stepping order, yet mostly paired diagonal legs. All results are from simulation.

Submitted to L4DC 2027: O. Sullivan\*, S. Selvaraj\*, and M. Agheli, "CADENCE: Learning Acyclic Gaits for Model-Based Quadruped Locomotion" \*Equal contribution.

Paper: [arxiv.org/abs/2611.23102](https://arxiv.org/abs/2611.23102)

Code: [github.com/opsullivan85/gaitnet](https://github.com/opsullivan85/gaitnet)
