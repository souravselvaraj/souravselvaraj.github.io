---
layout: page
title: SCRUB
description: Blind force-regulated tool sliding on Unitree Go1 hardware — an armless quadruped presses and slides a body-mounted tool along surfaces it has no model of.
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
    The Go1 sliding its body-mounted tool around a column while regulating contact force (RViz visualization; commanded contact forces shown in magenta).
</div>

**SCRUB** (Surface Contact Regulation Using the Body) is my primary graduate research project in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli. The goal: let a quadruped with no arm do useful contact work — pressing a body-mounted tool against a surface and sliding it along while regulating the contact force, all while the robot keeps balancing on four legs.

This is a fundamentally different regime from locomotion or pick-and-place. The contact is persistent rather than intermittent, the interaction force must be actively regulated rather than avoided, and every stance transition of the gait perturbs the tool. Think of wiping a wall, sanding a hull, or inspecting a pillar. SCRUB does this **blind** — with no model of the surface — so the surface normal has to be recovered from the contact itself.

## How it works

- **A friction-independent normal cue.** The out-of-plane component of the sliding drag vanishes exactly at the true surface normal. The cue holds whatever the friction coefficient, so the normal can be found without knowing the friction.
- **Surface-frame estimation.** An online estimator tracks the surface frame at the tool, so the controller can regulate force along the normal and slide along the surface — on a flat wall or around a curved column.
- **Centroidal MPC over whole-body control.** A 100 Hz centroidal MPC (OCS2, SQP) runs over a 1 kHz whole-body-control QP on a Unitree Go1.

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_flatwall.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Sliding against a planar wall (RViz visualization).
</div>

## Hardware results

Unitree Go1 hardware, 10 N normal-force target:

| Surface | Trials completed | Surface-normal error | Force RMSE |
| ------- | :--------------: | :------------------: | :--------: |
| Wall    |     **5/5**      |      **2.29°**       | **2.97 N** |
| Column  |     **5/5**      |      **2.48°**       | **2.06 N** |

Baselines with a **fixed normal** or with **friction compensation** completed **0/5** column orbits (p = 0.008, Fisher exact test).

## Status

Manuscript (2026): S. Selvaraj and M. Agheli, "SCRUB: Surface Contact Regulation Using the Body for Armless Quadruped Force–Motion Control."
