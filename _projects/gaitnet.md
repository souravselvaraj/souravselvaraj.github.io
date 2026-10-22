---
layout: page
title: GaitNet
description: A footstep planner given no gait. Each tick it picks one step, or none, from safe footholds, and a controller lands it. Trained once, it runs frozen on a new controller.
img: assets/img/projects/gaitnet_pipeline.jpg
importance: 2
category: research
---

GaitNet lets a quadruped choose its own steps. It plans footsteps for a Unitree Go1 crossing ground full of holes, with no gait to follow. At every control tick it decides whether to take a step and, if so, which leg to lift and where to put it down. A model-based controller then carries the step out. I work on GaitNet with Owen Sullivan in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli. The project started as Owen's master's thesis, and I have worked on it since November 2025.

<div class="row justify-content-center">
    <div class="col-sm-11 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/gaitnet_pipeline.jpg" title="GaitNet pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    An earlier version of the GaitNet pipeline: (a) deployment, where the planner scores the cells marked safe and sends the chosen step to the low-level controller; (b) the network; (c) training with PPO in NVIDIA Isaac Lab. The current version adds attention across the candidates, a short motion history, and an execution layer with an inverse footstep model for each controller.
</div>

## Why a fixed gait struggles

Most legged controllers walk with a fixed gait. A trot lifts diagonal leg pairs in turn on a set schedule, and the controller then places each foot. With few holes this costs little, since safe ground is usually right beside wherever the foot was headed. With dense holes, the schedule still says a leg must lift now, and that foot may have nowhere to land.

Someone crossing a stream on stepping stones pauses when no stone is in reach and moves whichever foot has one nearby. Papers on legged robots call this kind of stepping acyclic, non-gaited or free-gait, because no leg order repeats. GaitNet learns which single step to take next, with no gait imposed.

## One step at a time

Every tick, GaitNet looks at a few candidate footholds for each leg. They come only from cells already marked safe, set back from the hole edges, so GaitNet never judges safety itself. It picks one candidate, which fixes both the leg and the landing point, or a no-step option that lets the robot wait.

This one-step-per-tick action space comes from Owen's thesis, "GaitNet: Greedy, Acyclic Quadruped Gait Generation" (WPI, 2025), where a network scored candidates independently and the planner was tested with one controller. GaitNet now compares the candidates against each other through attention before scoring them, since the best foothold depends on what else is in reach. It also keeps a short memory of the robot's recent motion.

## Choosing a step is only half of it

Picking a safe foothold does not mean the foot lands on it. Controllers land a little off target, and the offset differs from one controller to the next. At speed, the controller we trained GaitNet with overshot by a few centimeters, more than the clearance GaitNet keeps around each hole, so a foot sent to a safe cell at a hole's edge could drop in.

My fix is a small inverse footstep model for each controller, fitted from that controller's own logged steps. Given where GaitNet wants the foot, it returns the command that lands the foot there, much as an archer who knows the wind pushes arrows right aims a little left. Pairing a fixed planner with an inverse model refit for each new setting follows FADA (Xie et al., 2026), which does this for humanoid control.

We train GaitNet with PPO in NVIDIA Isaac Lab, with a convex MPC executing its steps, then freeze it and run it on a second controller, OCS2's nonlinear MPC and whole-body controller, with the terrain mapped from a simulated depth camera. Only the inverse footstep model is refit, on OCS2's own steps.

## Who built what

I wrote the attention that compares candidate footholds, the motion history the planner reads, and the controller-specific inverse footstep models. I also did most of the work on the OCS2 deployment: routing GaitNet's steps into OCS2's perceptive MPC, setting up and tuning GPU elevation mapping from depth, terrain-aware candidate generation, and the Gazebo benchmark behind the results below. In September 2026 I finished the Go1 hardware bring-up, building on earlier work by another contributor, and calibrated the camera mount.

Owen wrote the original GaitNet code for his thesis, starting in August 2025: the Isaac Lab training environment, candidate sampling, PPO training and the per-candidate network. After his thesis he wrote the first ROS service linking GaitNet to a controller, and in September 2026 a GPU version of the convex MPC that our training now uses. He still works on training and the paper, and we share first authorship.

## Results in simulation

We tested the frozen GaitNet on OCS2 in Gazebo, on tile strips with 0 to 70% holes and commanded speeds of 0.05 to 0.25 m/s. The baseline is OCS2's own perceptive trot on the same terrain, depth pipeline and controller, so only the stepping differs. A run counts as a success when the robot gets to the far end in time, on its feet and on the strip. GaitNet matches the trot on sparse voids and pulls ahead as they get denser. It also beats the trot at each commanded speed we tested.

| Planner                                | Success at 40-70% voids |
| -------------------------------------- | :---------------------: |
| **GaitNet** (mean of 5 training seeds) |         **71%**         |
| OCS2 trot                              |           38%           |

The fastest command and densest voids lie outside GaitNet's training range, and the Gazebo tiles are larger than its training cells, so equal void fractions are not the same ground. We suspect GaitNet's lead on dense voids is the stepping-stone effect described above, though no test here isolates it.

On held-out steps from the training controller, the inverse footstep model cuts landing error from 2.61 cm to 0.89 cm RMS. In an ablation on one trained checkpoint, removing it drops GaitNet's success on OCS2 from 83% to 55%, averaged over void levels.

So far we have moved GaitNet from one controller to one other, and each new controller needs a logging run to fit its inverse footstep model, a step that online learning could remove. The safe cells come from hand-written rules that can reject good footholds or admit poor ones, and planning directly from depth or a height map might do better there.

## Status

To be submitted to L4DC 2027: O. Sullivan\*, S. Selvaraj\*, and M. Agheli, "GaitNet: Where Do I Step?" \*Equal contribution.

In September 2026 we ran an earlier, frozen GaitNet checkpoint on a real Go1 with OCS2 and an onboard depth camera. With a few hand-set deployment rules on top of the policy, it stepped acyclically through a field of 40 to 50 mm blocks. That checkpoint, trained in November 2025, predates the candidate attention and the inverse footstep model. These runs are qualitative, and every number on this page comes from simulation.

Code: [github.com/opsullivan85/gaitnet](https://github.com/opsullivan85/gaitnet)
