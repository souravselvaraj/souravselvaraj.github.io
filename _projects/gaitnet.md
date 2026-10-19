---
layout: page
title: GaitNet
description: A footstep planner given no gait. At every control tick it picks one step, or none, from safe candidate footholds, and a model-based controller lands it. Trained once, it runs frozen on a new controller.
img: assets/img/projects/gaitnet_pipeline.jpg
importance: 2
category: research
---

**GaitNet** is a footstep planner for a Unitree Go1 crossing ground with holes, developed with Owen Sullivan (co-first authors, equal contribution) in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/) (advisor: Dr. Mahdi Agheli). Instead of following a fixed gait cycle, it decides at every control tick whether to take a step and, if so, *which* leg moves and *where* it lands, choosing from a few safe candidate footholds per leg kept away from the holes. A model-based controller executes each step.

<div class="row justify-content-center">
    <div class="col-sm-11 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/gaitnet_pipeline.jpg" title="GaitNet pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    An earlier version of the GaitNet pipeline: (a) deployment, (b) the network, (c) PPO training in NVIDIA Isaac Lab. The current version adds attention across the candidates, a motion-history encoder, and an execution layer with per-controller inverse footstep models.
</div>

## Why acyclic?

Fixed cyclic gaits (trot, crawl) waste the quadruped's freedom on broken terrain: when footholds are scarce — gaps, missing steps, rubble — the *sequence* of leg movements matters as much as the footholds themselves. GaitNet treats gait selection itself as a learned decision.

## Method

- **One step per tick.** GaitNet builds on the one-step-per-tick action space of Owen Sullivan's thesis: each tick, the planner scores every candidate foothold plus a no-step option and issues the best one.
- **Attention across candidates.** Two 4-head attention layers let the candidates compare against each other before they are scored, and a separate encoder adds a short motion history.
- **Execution layer.** Controllers do not always land the foot where they are told. A small inverse footstep model, fitted from each controller's own logged steps, turns the foothold GaitNet wants into the command that lands it there.
- **Train once, run frozen.** GaitNet is trained with PPO in NVIDIA Isaac Lab with a convex MPC in the loop, then runs frozen on OCS2's nonlinear MPC and whole-body controller with a simulated depth camera. Only the inverse footstep model is refit, on OCS2's own steps.

## My role

- The attention that compares candidate footholds (GaitNet-T).
- The controller-specific inverse footstep models at the core of the execution layer.
- The OCS2 deployment stack: ROS integration with OCS2's perceptive MPC, GPU elevation mapping from depth sensing, and terrain-aware candidate generation.

## Results (simulation)

On OCS2 with a simulated depth camera, over 0–70% voids and commanded speeds of 0.05–0.25 m/s, GaitNet matches OCS2's own trot on sparse voids and exceeds it on dense voids and at faster commands.

| Planner       | Success at 40–70% voids |
| ------------- | :---------------------: |
| **GaitNet** (mean of 5 training seeds) |         **71%**         |
| OCS2 trot     |           38%           |

The inverse footstep model cuts held-out landing error from 2.61 cm to 0.89 cm RMS; without it, GaitNet's success on OCS2 falls from 83% to 55%, averaged over void levels. These numbers are from simulation. We have also run the frozen policy on a real Go1 with OCS2, walking acyclically over 40–50 mm blocks.

## Status

To be submitted to L4DC 2027: O. Sullivan\*, S. Selvaraj\*, and M. Agheli, "GaitNet: Where Do I Step?" \*Equal contribution.

Code: [github.com/opsullivan85/gaitnet](https://github.com/opsullivan85/gaitnet)
