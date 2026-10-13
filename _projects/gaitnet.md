---
layout: page
title: GaitNet
description: Attention-based acyclic footstep planning for dynamic quadruped locomotion — candidate self-attention, motion history, and inverse footstep dynamics on top of perceptive MPC.
img: assets/img/projects/gaitnet_pipeline.jpg
importance: 2
category: research
---

**GaitNet-T** is an attention-based footstep planner for acyclic Unitree Go1 locomotion over irregular terrain, developed with Owen Sullivan (co-first authors, equal contribution) in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/) (advisor: Dr. Mahdi Agheli). Instead of following a fixed gait cycle, the policy decides _which_ leg to move, _where_ to place it, and _how long_ the swing should take — one footstep at a time.

<div class="row justify-content-center">
    <div class="col-sm-11 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/gaitnet_pipeline.jpg" title="GaitNet pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Original GaitNet system overview. GaitNet-T preserves the same candidate-based decision interface while adding attention across footholds, a one-second motion history, and an inverse footstep model before execution.
</div>

## Why acyclic?

Fixed cyclic gaits (trot, crawl) waste the quadruped's freedom on broken terrain: when footholds are scarce — gaps, missing steps, rubble — the _sequence_ of leg movements matters as much as the footholds themselves. GaitNet treats gait selection itself as a learned decision.

## Method

- **Candidate-based action space.** At each 25 Hz policy tick, the planner samples up to 16 valid footholds for every eligible leg. Together with a no-op, this produces 65 slots. A masked categorical policy selects a slot, while a Gaussian head selects its swing duration.
- **GaitNet-T attention architecture.** A 464k-parameter actor uses two pre-normalized Transformer encoder layers with four attention heads to compare candidate footholds. Its context combines the current robot state with one second of motion and touchdown-error history.
- **Inverse footstep model (IDM).** A learned inverse model maps each desired landing location to the command required by the active controller. This separates _where the policy wants the foot to land_ from _what must be sent to the controller_.
- **Model-based execution.** The selected step is passed to OCS2 perceptive MPC and whole-body control. The policy chooses the gait online; no periodic contact sequence is prescribed.

## My role: attention and inverse dynamics

I implemented the two additions at the center of the current system:

- **GaitNet-T**, including candidate self-attention, the motion-history encoder, masking, weight-preserving conversion from the original GaitNet actor, and memory-efficient PPO training.
- **The IDM pipeline**, including footstep-data collection, hindsight-relabeled inverse-model fitting, integration into training and deployment, and evaluation across controller configurations. The model reduced held-out command-to-landing RMS error from **2.61 cm to 0.89 cm**.
- **Deployment integration** with the ROS GaitNet service, OCS2 perceptive MPC, and camera-based terrain mapping on the simulated Go1.

## Results

The final GaitNet-T policy was evaluated in Isaac Lab and through the complete Gazebo + OCS2 deployment stack:

| Evaluation                                                      |      Success       |
| --------------------------------------------------------------- | :----------------: |
| Isaac Lab, 10–30% void terrain                                  |      **99%**       |
| Isaac Lab, 40% void terrain                                     |      **≈88%**      |
| Isaac Lab, 50% void terrain                                     |      **≈75%**      |
| Gazebo + OCS2, held-out worlds with exact terrain               |  **82%** [70, 89]  |
| Gazebo + OCS2, onboard perception and leg odometry (330 trials) | **80.3%** [76, 84] |

Bracketed values are 95% Wilson confidence intervals.

Although no gait was specified, the learned policy spontaneously coordinated almost every paired swing diagonally, producing a trot from step-by-step decisions.

## Status

Manuscript (2026): O. Sullivan\*, S. Selvaraj\*, and M. Agheli, "GaitNet: Learning-Based Acyclic Footstep Planning for Dynamic Quadruped Locomotion." \*Equal contribution.

Technical documentation: [github.com/souravselvaraj/gaitnet-docs](https://github.com/souravselvaraj/gaitnet-docs)

Code: [github.com/souravselvaraj/gaitnet](https://github.com/souravselvaraj/gaitnet/tree/train-port)
