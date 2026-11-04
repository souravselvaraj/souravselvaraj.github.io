---
layout: page
title: SCRUB
description: An armless Unitree Go1 slides a trunk-mounted tool along a wall or column and works out which way the surface faces from the contact.
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
    Hardware video of our Unitree Go1.
</div>

Our armless Unitree Go1 slides a trunk-mounted tool with a force sensor along an unmapped wall or column. I've led SCRUB since August 2025 in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih) at [WPI](https://www.wpi.edu/), advised by Dr. Mahdi Agheli.

To hold a set push, SCRUB estimates which way the surface faces from two contact clues. One is the measured force. Focchi and colleagues used it for a sliding quadruped foot. The other is the sliding tool's velocity, which lies in the surface. Earlier estimators for robot arms used it.

My first estimator assumed the velocity lay in the surface at every instant. But the trunk-mounted tool moved in and out with every step. The estimator read that motion as the surface turning, and the Go1 fell while circling a column. Dropping velocity would leave the tilt along the slide unknown. So I subtracted the commanded inward push and averaged the leftover motion over each gait cycle. In a steady gait, most of it cancels. I also extended the Go1's OCS2 MPC to plan the push with the body's motion.

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_cylinder.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/rescotq_flatwall.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    RViz views of an earlier controller version.
</div>

## Hardware results

We tested on a flat OSB wall and a drywall column at a commanded 12 mm/s with a 10 N target. Each value is the median of five trials. Normal error is measured against a tape-measured model of each surface.

| Surface          | Trials completed | Surface-normal error (RMS) | Force error (RMS) |
| ---------------- | :--------------: | :------------------------: | :---------------: |
| Wall (OSB)       |     **5/5**      |         **2.29°**          |    **2.97 N**     |
| Column (drywall) |     **5/5**      |         **2.48°**          |    **2.06 N**     |

All ten trials finished without a fall. On the column, each ablation got five trials and its own tuning. No orbit completed with the normal frozen at first contact or with either clue removed. Subtracting the push without averaging completed none. Neither did an earlier friction-fitting method, reimplemented in place of the force clue.

Across 8 to 16 mm/s and 5 to 15 N targets, SCRUB completed 89 of 90 trials without retuning. Five trials per condition is a small sample. The commanded speed and the planner's friction setting came from SCRUB's own runs, so they may favor it. SCRUB needs a force sensor and assumes the tool slides.

Submitted to IEEE RA-L (2026): S. Selvaraj, J. P. Espinosa Chessal, and M. Agheli, "SCRUB: Contact-Based Surface-Frame Estimation for Force–Motion Control with an Armless Quadruped."

Video: [youtu.be/R2P-cebOBVM](https://youtu.be/R2P-cebOBVM)
