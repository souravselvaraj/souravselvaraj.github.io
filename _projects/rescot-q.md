---
layout: page
title: ReSCoT-Q
description: Reference-guided surface-frame control for quadrupeds — force-controlled tool sliding on Unitree Go1 hardware with MPC and whole-body control.
img: assets/img/projects/rescotq_thumb.jpg
importance: 1
category: research
---

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_cylinder.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    The surface-frame controller sliding the body-mounted tool along a cylindrical surface while regulating contact force (RViz visualization; commanded contact forces shown in magenta).
</div>

**ReSCoT-Q** (Reference-Guided Surface-Frame Control for Quadruped Robots) is my primary graduate research project in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli. The goal: enable a quadruped to interact with the world through *sustained contact* — pressing a body-mounted tool against an external surface and sliding it along a reference path while regulating contact force, all while the robot keeps balancing on four legs.

This is a fundamentally different regime from locomotion or pick-and-place. The contact is persistent rather than intermittent, the interaction force must be actively regulated rather than avoided, and every stance transition of the gait perturbs the tool. Think of wiping a window, sanding a hull, or inspecting a pipeline — tasks that demand *force-controlled loco-manipulation*.

## How it works

The controller reasons in a **surface frame** attached to the contact point, decomposing the task into three orthogonal objectives:

- **Normal direction** — regulate the pressing force against the surface to a target (e.g., 10 N), with a normal-force lag state inside the MPC model so force dynamics are predicted, not just reacted to.
- **Tangential direction** — track a commanded slide velocity along the reference path.
- **Binormal (cross-track) direction** — stabilize lateral deviation from the path.

Three components make this robust on real hardware:

1. **Surface-frame MPC + weighted whole-body control.** An OCS2 SQP centroidal MPC runs at 100 Hz, feeding a hierarchically weighted WBC that trades off contact objectives, gait execution, and balance on a Unitree Go1 with a body-mounted tool and a force/torque sensor.
2. **Confidence-gated surface estimation.** A reference-guided estimator fuses a *nominal surface prior* (a rough CAD-like guess of the surface) with online contact-wrench and tool-motion measurements. Confidence gating decides when the online evidence should override the prior — the controller tolerates large geometric error in the assumed surface model.
3. **Contact-stability supervisor.** A state machine gates sliding during contact acquisition, force recovery, and gait-induced contact dropouts, so transient force losses don't destabilize the slide.

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_flatwall.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    The same controller generalizes across surface geometry — here sliding against a planar wall.
</div>

## Hardware results

On a cylindrical test surface, with the surface prior deliberately wrong by ~10% in radius (1.0 m prior vs. 0.903 m fitted cylinder):

| Metric                     | Result                        |
| -------------------------- | ----------------------------- |
| Sustained contact duration | **109.9 s**                   |
| Surface coverage           | **91.3° arc** of the cylinder |
| Normal-force RMS error     | **0.60 N** at a 10 N target   |
| Path-tracking RMS error    | **18.8 mm**                   |

## Status

A first-author manuscript (S. Selvaraj and M. Agheli) is in preparation, targeting *IEEE Robotics and Automation Letters (RA-L)*.
