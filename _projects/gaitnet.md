---
layout: page
title: GaitNet
description: A learned footstep planner with no fixed gait. Each tick it picks one step, or none, and a model-based controller lands it.
img: assets/img/projects/gaitnet_pipeline.jpg
importance: 2
category: research
---

GaitNet is a learned footstep planner for a Unitree Go1 crossing ground full of holes. It has no fixed gait. Each tick it picks a leg and a foothold marked safe, or no step. A model-based controller carries out the step. I work on it with Owen Sullivan in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli.

<div class="row justify-content-center">
    <div class="col-sm-11 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/gaitnet_pipeline.jpg" title="GaitNet pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    An earlier pipeline, before candidate attention, motion history and inverse models.
</div>

We train GaitNet with PPO in NVIDIA Isaac Lab, where a convex MPC executes its steps. Then we run it frozen on OCS2's nonlinear MPC and whole-body controller.

Controllers don't always put the foot where they're told. At speed, our training controller overshot by more than the clearance GaitNet keeps around each hole. So I fit a small inverse model to each controller's logged steps. It returns the command that lands the foot on target. On held-out steps from the training controller, it cuts landing error from 2.61 cm to 0.89 cm RMS. Refitting only this model per controller follows FADA (Xie et al., 2026).

## Who built what

Owen's master's thesis started GaitNet. He wrote the original code and the GPU convex MPC our training now uses. We share first authorship.

I added candidate attention, a motion history and the inverse models. I did most of the OCS2 deployment, including the Gazebo benchmark. I finished the Go1 hardware bring-up, building on another contributor's earlier work.

## Results

In Gazebo simulation, the baseline is OCS2's own perceptive trot with the same terrain, depth pipeline and controller. GaitNet matches the trot on sparse voids and pulls ahead on dense ones.

| Planner                                | Success at 40-70% voids |
| -------------------------------------- | :---------------------: |
| **GaitNet** (one trained checkpoint)   |         **70%**         |
| OCS2 trot                              |           38%           |

The fastest commanded speed and densest voids lie outside GaitNet's training range.

On a real Go1, an earlier checkpoint with a few hand-set deployment rules stepped through 40 to 50 mm blocks with no fixed gait. These runs are qualitative, and every number on this page comes from simulation.

To be submitted to L4DC 2027: O. Sullivan\*, S. Selvaraj\*, and M. Agheli, "GaitNet: Learning to Choose the Gait for a Model-Based Locomotion Controller" \*Equal contribution.

Code: [github.com/opsullivan85/gaitnet](https://github.com/opsullivan85/gaitnet)
