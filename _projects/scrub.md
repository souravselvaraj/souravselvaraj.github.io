---
layout: page
title: SCRUB
description: Blind force-regulated tool sliding on Unitree Go1 hardware — an armless quadruped presses and slides a body-mounted tool along surfaces it has no model of.
img: assets/img/projects/scrub_thumb.jpg
importance: 1
category: research
---

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
            <iframe
                src="https://www.youtube.com/embed/R2P-cebOBVM"
                title="SCRUB: Contact-Based Surface-Frame Estimation for Force–Motion Control with an Armless Quadruped"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                class="rounded z-depth-1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen></iframe>
        </div>
    </div>
</div>
<div class="caption">
    SCRUB on the Unitree Go1.
</div>

**SCRUB** is my primary graduate research project in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli. The goal: let a quadruped with no arm do useful contact work — pressing a body-mounted tool against a surface and sliding it along while regulating the contact force, all while the robot keeps balancing on four legs.

This is a fundamentally different regime from locomotion or pick-and-place. The contact is persistent rather than intermittent, the interaction force must be actively regulated rather than avoided, and every stance transition of the gait perturbs the tool. Think of wiping a wall, sanding a hull, or inspecting a pillar. SCRUB does this **blind** — with no model of the surface — so the surface normal has to be recovered from the contact itself.

## How it works

- **A friction-independent normal cue.** The out-of-plane component of the sliding drag vanishes exactly at the true surface normal. The cue holds whatever the friction coefficient, so the normal can be found without knowing the friction.
- **Gait-cycle averaging.** Earlier sliding-tool estimators assume the tool's instantaneous velocity lies in the surface. Walking breaks that: the gait presses the tool in and out along the very normal being estimated. Once the commanded press is subtracted, most of that motion cancels over one cycle of a steady gait, so SCRUB averages the tool's velocity per cycle.
- **Surface-frame estimation.** An online estimator combines the averaged velocity with the force cue to track the surface frame at the tool, so the controller can regulate force along the normal and slide along the surface — on a flat wall or around a curved column.
- **Centroidal MPC over whole-body control.** I extended a 100 Hz OCS2 centroidal MPC (SQP) to plan the tool's contact along with the body's motion, running over a 1 kHz whole-body-control QP on a Unitree Go1.

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_cylinder.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_flatwall.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    RViz visualizations of sliding around a column (left) and against a planar wall (right); commanded contact forces shown in magenta.
</div>

## Hardware results

Unitree Go1 hardware, 10 N normal-force target:

| Surface | Trials completed | Surface-normal error | Force RMSE |
| ------- | :--------------: | :------------------: | :--------: |
| Wall    |     **5/5**      |      **2.29°**       | **2.97 N** |
| Column  |     **5/5**      |      **2.48°**       | **2.06 N** |

Baselines with a **fixed normal** or with **friction compensation** completed **0/5** column orbits. The same estimator without per-cycle averaging completed 3/5 and fell twice.

## Status

To be submitted to IEEE RA-L (2026): S. Selvaraj and M. Agheli, "SCRUB: Contact-Based Surface-Frame Estimation for Force–Motion Control with an Armless Quadruped."

Video: [youtu.be/R2P-cebOBVM](https://youtu.be/R2P-cebOBVM)
