---
layout: page
title: GaitNet
description: Learning-based acyclic footstep planning for dynamic quadruped locomotion — CNN foothold cost maps + RL gait selection on top of perceptive MPC.
img: assets/img/projects/gaitnet_pipeline.jpg
importance: 2
category: research
---

**GaitNet** is a hybrid learning–control footstep planner for acyclic Unitree Go1 locomotion over irregular terrain, co-developed with Owen Sullivan in the ALMaS Research Group at WPI (advisor: Dr. Mahdi Agheli). Instead of committing to a fixed gait cycle, the planner decides *which* leg to move, *where* to place it, and *how long* the swing should take — step by step, based on the terrain ahead.

<div class="row justify-content-center">
    <div class="col-sm-11 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/gaitnet_pipeline.jpg" title="GaitNet pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The GaitNet pipeline: perception feeds a CNN foothold-cost predictor and an RL gait-selection policy, which drive a model-based perceptive MPC.
</div>

## Why acyclic?

Fixed cyclic gaits (trot, crawl) waste the quadruped's freedom on broken terrain: when footholds are scarce — gaps, missing steps, rubble — the *sequence* of leg movements matters as much as the footholds themselves. GaitNet treats gait selection itself as a learned decision.

## Method

- **ContactNet CNN** predicts leg-specific foothold cost maps from local heightmap patches, trained on footstep tree-search rollouts generated in NVIDIA Isaac Lab.
- **RL gait selection** (actor–critic, masked categorical policy) chooses among per-leg foothold candidates plus a no-op, effectively selecting the next swing leg, its foothold, and swing timing.
- **Model-based execution**: the selected footstep is executed by an OCS2 perceptive MPC with foot-placement and collision constraints, retaining the stability guarantees of model-based quadruped control.

## My role: the deployment stack

I own the simulation deployment side of the project:

- **ROS integration** of the planner with OCS2 perceptive MPC (foot-placement and collision constraints) on a simulated Go1.
- **GPU elevation mapping** from onboard depth sensing (elevation-mapping-cupy + grid_map + RealSense), producing the heightmaps the planner consumes.
- **Terrain-aware footstep candidate generation** from robot state, commanded velocity, and raycast heightmaps — real-time filtering and ranking of feasible leg-selection, foot-displacement, and swing-duration actions.

## Results

Evaluated in NVIDIA Isaac Lab across commanded velocities and missing-step terrain difficulties:

| Planner                          | Survival (no fall into gaps) |
| -------------------------------- | ---------------------------- |
| **GaitNet**                      | **69.4%**                    |
| Single-leg motion-planner baseline | 25.6%                      |

## Status

A manuscript (O. Sullivan, S. Selvaraj, and M. Agheli) is in preparation, targeting *IEEE ICRA*.
