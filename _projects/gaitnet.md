---
layout: page
title: GaitNet
description: A footstep planner with no fixed gait. Each tick it picks one step, or none, and a model-based controller lands it. Trained once, it runs frozen on a new controller.
img: assets/img/projects/gaitnet_pipeline.jpg
importance: 2
category: research
---

GaitNet plans footsteps for a Unitree Go1 crossing ground full of holes, and a model-based controller carries each step out. I work on it with Owen Sullivan in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli.

<div class="row justify-content-center">
    <div class="col-sm-11 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/gaitnet_pipeline.jpg" title="GaitNet pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    An earlier version of the pipeline, before the candidate attention, motion history and inverse footstep models.
</div>

## Stepping without a gait

A trot lifts diagonal leg pairs on a set schedule. With few holes there's usually safe ground right beside wherever the foot was headed, but with dense holes the scheduled foot may have nowhere to land. Someone crossing a stream on stepping stones pauses when no stone is in reach and moves whichever foot has one nearby. GaitNet learns that kind of acyclic stepping, with no repeating leg order: each tick it picks a leg and a foothold from cells already marked safe, or no step at all.

## Getting the foot where it was sent

Controllers don't always put the foot where they're told. At speed, the controller we trained GaitNet with overshot by a few centimeters, more than the clearance GaitNet keeps around each hole, so a foot sent to a safe cell at a hole's edge could drop in. The offset differs between controllers, so I fit a small inverse footstep model for each from its own logged steps. It returns the command that lands the foot where GaitNet wants it. Pairing a fixed planner with an inverse model refit per setting follows FADA (Xie et al., 2026), which does this for humanoid control.

We train GaitNet with PPO in NVIDIA Isaac Lab, with a convex MPC executing its steps, then run it frozen on OCS2's nonlinear MPC and whole-body controller, refitting only the inverse model.

## Who built what

Owen's master's thesis, "GaitNet: Greedy, Acyclic Quadruped Gait Generation" (WPI, 2025), introduced the one-step-per-tick design. Starting in August 2025 he wrote the original code: the Isaac Lab training environment, candidate sampling, PPO training and the per-candidate network. After the thesis he wrote the first ROS service linking GaitNet to a controller and, in September 2026, the GPU convex MPC our training now uses. He still works on training and the paper, and we share first authorship.

Since joining in November 2025 I've added candidate attention (the best foothold depends on what else is in reach), a motion history and the inverse footstep models, and done most of the OCS2 deployment: routing steps into its perceptive MPC, setting up and tuning GPU elevation mapping, terrain-aware candidate generation and the Gazebo benchmark. In September 2026 I finished the Go1 hardware bring-up, building on another contributor's earlier work, and calibrated the camera mount.

## Results in simulation

In Gazebo, the tile strips have 0 to 70% holes and commanded speeds run from 0.05 to 0.25 m/s. The baseline is OCS2's own perceptive trot with the same terrain, depth pipeline and controller, so only the stepping differs. A run succeeds if the robot reaches the far end in time, upright and on the strip. GaitNet matches the trot on sparse voids, pulls ahead as they get denser, and beats it at each commanded speed we tested.

| Planner                                | Success at 40-70% voids |
| -------------------------------------- | :---------------------: |
| **GaitNet** (one trained checkpoint)   |         **70%**         |
| OCS2 trot                              |           38%           |

The fastest command and densest voids lie outside GaitNet's training range, and the Gazebo tiles are larger than its training cells, so equal void fractions aren't the same ground. We suspect the dense-void lead is the stepping-stone effect, though no test here isolates it.

On held-out steps from the training controller, the inverse model cuts landing error from 2.61 cm to 0.89 cm RMS. In a one-checkpoint ablation, removing it drops success on OCS2 from 83% to 55%, averaged over void levels.

Each new controller needs a logging run to fit its inverse model, and so far we've moved GaitNet from one controller to one other. The safe cells come from hand-written rules that can reject good footholds or admit poor ones.

## Status

To be submitted to L4DC 2027: O. Sullivan\*, S. Selvaraj\*, and M. Agheli, "GaitNet: Learning to Choose the Gait for a Model-Based Locomotion Controller" \*Equal contribution.

In September 2026 we ran an earlier frozen checkpoint on a real Go1 with OCS2 and an onboard depth camera. It was trained in November 2025, before the candidate attention and the inverse model. With a few hand-set deployment rules on top, it stepped acyclically through a field of 40 to 50 mm blocks. These runs are qualitative, and every number on this page comes from simulation.

Code: [github.com/opsullivan85/gaitnet](https://github.com/opsullivan85/gaitnet)
