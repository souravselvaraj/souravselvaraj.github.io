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

I've led SCRUB (Surface Contact Regulation Using the Body) since August 2025 in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli. My thesis began as a power tool mounted on a quadruped. The problem kept growing, so I cut it down to the smallest version I thought I could solve: our armless Unitree Go1 crawls sideways, sliding a trunk-mounted tool, with a force sensor inside, along an unmapped surface.

## Which way does the surface face?

To hold a set push, the robot needs the surface normal (the direction the surface faces) at the tool tip. On a wall it stays put; around a column it keeps turning. A soft bumper hides the contact from a camera, so SCRUB estimates the normal from the contact itself. One clue is the force. If friction drags exactly opposite to the motion, the force lies in the plane of the true normal and the direction of travel, so a wrong guess shows up as a part of the measured force perpendicular to the predicted plane, which is zero when the guess is right. In the ideal case this holds for any friction coefficient, so no friction model is needed. Focchi and colleagues estimated the surface under a sliding quadruped foot this way. The force can't reveal every error in the normal, so the tool's velocity, which lies in the surface while it slides, is a second clue, as in earlier estimators for robot arms sliding a tool.

## Why walking got in the way

My first estimator assumed the tool's velocity lay in the surface at every instant. Unlike a sliding foot, the trunk-mounted tool moved into and out of the surface with every step. The estimator read that motion as a change in surface orientation, so the Go1 pushed in the wrong direction and fell while circling a column. I couldn't just drop velocity, because then the tilt along the slide would stay unknown.

So I went back to the physics of the gait. Each footstep compresses the bumper, and the controller pushes the tool slowly inward to hold the force. With that commanded push subtracted, most of the leftover in-and-out motion cancels over each cycle of a steady gait, so SCRUB treats the per-cycle average as lying along the surface. It's like a car on a bumpy road, which bobs on its suspension but, averaged over a few bumps, follows the road. I also extended the Go1's OCS2 model predictive controller to plan the tool's push with the body's motion.

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_cylinder.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_flatwall.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    RViz views of an earlier version of this controller: the tool sliding around a cylinder (left) and along a planar wall (right).
</div>

## Hardware results

We tested SCRUB on a flat OSB wall and a vertical drywall column at a commanded 12 mm/s with a 10 N target, for about 1 m of wall or one full orbit of the column. Each value is the median of five trials; normal error is measured against a tape-measured model of each surface.

| Surface          | Trials completed | Surface-normal error (RMS) | Force error (RMS) |
| ---------------- | :--------------: | :------------------------: | :---------------: |
| Wall (OSB)       |     **5/5**      |         **2.29°**          |    **2.97 N**     |
| Column (drywall) |     **5/5**      |         **2.48°**          |    **2.06 N**     |

All ten trials finished without a fall. On the column, we then changed or removed one piece at a time (five trials per version, each tuned individually). No orbit completed with the normal frozen at first contact or with either clue removed. An earlier method that fits a friction coefficient online, reimplemented in place of the force clue, completed none and fell in all five. Subtracting the commanded push without averaging completed none of five, with two falls.

Without retuning, we then ran both tasks five times at each pairing of 8, 12 and 16 mm/s with 5, 10 and 15 N targets. SCRUB completed 89 of 90 (the fifteen 5 N wall trials were stopped at the wall's usable end, about 0.95 m, and counted complete). The one fall was a column trial at 5 N. Force error was about 20% of the target on the column and 30% on the wall.

Five trials per condition is a small sample, and the commanded speed and the planner's friction setting came from SCRUB's own runs, which ran first, so these choices may favor it.

## Limits and next steps

SCRUB needs a force sensor in the tool and assumes the tool is sliding. Every trial used one crawl gait at up to 16 mm/s, a horizontal path on a near-vertical surface and a hand-placed start, and on the column the normal turned about only one axis. Next, I want to test faster gaits, changing curvature, non-planar paths and different friction, and add a visual surface preview.

## Status

Submitted to IEEE RA-L (2026): S. Selvaraj, J. P. Espinosa Chessal, and M. Agheli, "SCRUB: Contact-Based Surface-Frame Estimation for Force–Motion Control with an Armless Quadruped."

Video: [youtu.be/R2P-cebOBVM](https://youtu.be/R2P-cebOBVM)
