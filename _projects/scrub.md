---
layout: page
title: SCRUB
description: An armless Unitree Go1 presses a trunk-mounted tool against a wall or column and slides it along, working out which way the surface faces from the contact itself.
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
    Hardware video of SCRUB on our Unitree Go1.
</div>

I have led SCRUB (Surface Contact Regulation Using the Body) since August 2025 in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli. In SCRUB, our Unitree Go1, a quadruped with no arm, faces an unmapped surface and walks sideways in a slow crawl, pressing a tool against the surface and sliding it along.

## Why this problem

Wiping a wall or sanding a hull takes a controlled push and a steady slide at the same time. When a legged robot simply walks, it touches the world only through brief footsteps. Here the tool stays in contact for the whole task, and every step of the gait shakes it.

The tool sits on the Go1's trunk, with an IIT FT17 force/torque sensor inside and a rounded tip in a soft silicone bumper, so the legs have to push it against the surface while keeping the robot balanced.

## Which way does the surface face?

To hold a set push (10 N in most of our trials), the robot has to know which way the surface faces at the tool tip, a direction called the surface normal. On a flat wall the normal stays put, but around a column it keeps turning as the tool moves. The bumper hides the contact point from a camera, so SCRUB estimates the surface direction from the contact itself.

The force on the tool is one clue. The surface pushes back on the sliding tool and friction drags it backward. If friction acts exactly opposite to the motion, the force lies in the plane of the true normal and the direction of travel. A wrong guess of the normal can predict a different plane, and the measured force then has a part perpendicular to the predicted plane. That part is zero when the guess is right. In the ideal case this holds for any friction coefficient, so the clue needs no friction model. If SCRUB's estimate of the sliding direction is off, friction shows up as a small false tilt. Focchi and colleagues estimated the surface under a sliding quadruped foot this way, and SCRUB applies the idea to a sliding tool.

The force cannot reveal every error in the guess, so the tool's motion is a second clue. A sliding tool's velocity lies in the surface, an idea that earlier estimators for robot arms sliding a tool along an unknown surface already use.

## Why walking got in the way

In my first attempt, the estimator took the tool's velocity to lie in the surface at every instant, and the robot fell while sliding the tool around the column. The gait was the cause. Every footstep compresses the bumper and moves the tool toward or away from the surface, which is the direction SCRUB is estimating. The controller also drives the tool slowly inward on purpose to hold the force.

With that commanded push removed from the measured tool velocity, most of the leftover in-and-out motion cancelled over each cycle of a steady gait. It is a bit like a car on a bumpy road: the suspension moves the body up and down, but averaged over a few bumps the car follows the road. SCRUB treats this per-cycle average as lying along the surface and combines it with the force clue.

I also extended the robot's OCS2 model predictive controller to plan the tool's push together with the body's motion, and a whole-body controller turns that plan into joint torques.

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_cylinder.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_flatwall.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    RViz visualizations from an earlier version of this controller: the tool sliding around a cylindrical surface (left) and along a planar wall (right), with commanded contact forces in magenta.
</div>

## Hardware results

We tested SCRUB on a flat oriented strand board (OSB) wall and a vertical drywall column of radius 0.303 m, sliding the tool horizontally at a commanded 12 mm/s with a 10 N target force. A wall trial was complete after about 1 m and a column trial after one full orbit. Normal error is measured against a tape-measured model of each surface. Each value below is the median of five trials.

| Surface          | Trials completed | Surface-normal error (RMS) | Force error (RMS) |
| ---------------- | :--------------: | :------------------------: | :---------------: |
| Wall (OSB)       |     **5/5**      |         **2.29°**          |    **2.97 N**     |
| Column (drywall) |     **5/5**      |         **2.48°**          |    **2.06 N**     |

All ten trials finished without a fall. On the column, we then changed or removed one piece at a time, five trials per version, each tuned individually. No orbit completed with the normal frozen at first contact or with either clue removed. An earlier method that fits a friction coefficient online, which we reimplemented in place of the force clue, completed none and fell in all five trials. When we kept the subtraction of the commanded push but dropped the averaging, none of the five orbits completed and the robot fell in two.

We then ran both tasks five times at every pairing of 8, 12 and 16 mm/s with 5, 10 and 15 N targets, without retuning. SCRUB completed 89 of the 90 trials (the fifteen 5 N wall trials were stopped at the wall's usable end, about 0.95 m, and counted complete). The one fall was a column trial at 5 N. Force error was about 20% of the target on the column and 30% on the wall.

Five trials per condition is a small sample. The commanded speed and the planner's friction setting also came from SCRUB's own runs, and SCRUB's trials ran first, so these choices may favor it.

## Limits and next steps

SCRUB depends on a force sensor inside the tool, and its estimate assumes the tool is sliding. Every trial used one crawl gait at commanded speeds up to 16 mm/s, followed a horizontal path on a near-vertical surface, and started with the tool placed by hand. On the column the normal turned about only one axis, so the force clue only had to correct a constant vertical tilt. Next, I want to test faster gaits, changing curvature, paths that do not stay in one plane and different friction, and to add a visual preview of the surface.

## Status

Submitted to IEEE RA-L (2026): S. Selvaraj, J. P. Espinosa Chessal, and M. Agheli, "SCRUB: Contact-Based Surface-Frame Estimation for Force–Motion Control with an Armless Quadruped."

Video: [youtu.be/R2P-cebOBVM](https://youtu.be/R2P-cebOBVM)
