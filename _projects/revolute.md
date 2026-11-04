---
layout: page
title: Revolute
description: "ToastBot, our Revolute 2026 hackathon entry: flow-matching policies for the steps of making toast on a six-joint arm, learned from teleoperation."
img: assets/img/projects/revolute_thumb.jpg
importance: 6
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-8 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/revolute_thumb.jpg" title="Toast task workspace" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Top-camera view of the bread holder, toaster and pan.
</div>

My team, Team Toasted, built ToastBot at the Revolute 2026 hackathon (August 1 and 2, 2026, FabLab Kendall). We split making toast on a Seeed B601 RS arm into three steps: bread into the toaster, pull the lever, toast onto a pan. We trained flow-matching policies from teleoperated demonstrations with [LeRobot](https://github.com/huggingface/lerobot). The repository is mine, from the recording scripts to policy training. I committed all of it over the hackathon weekend.

We had in mind people who can't safely use heating appliances. Without them, nothing they cook comes out crispy.

## Design

With 40 to 50 demonstrations per task, data limited us more than compute. So we trained a separate policy for each step and planned a state machine to chain them. A failure then points to one stage. We decided against a large vision-language-action model because it is impractical on the 8 GB Jetson Orin Nano the event planned for inference.

The arm executes 16 actions (533 ms), then re-plans. I sized the defaults to fit that window on the Orin Nano, using five [flow-matching integration steps]({{ '/projects/flow-matching-policies/' | relative_url }}). Our demonstrations are too few to fine-tune DINOv2-small, so it stays frozen.

## Recording

About a quarter of the placing frames show no motion. The same observation is then followed by motion in some episodes and stillness in others. That can make a policy freeze mid-task. So we trimmed idle frames from the placing and collecting data and trained a second policy on each.

## Status

Policies for placing and collecting have run on the real arm. These runs are qualitative, with no success rates reported yet. No policy has run on the Jetson yet, and the repository has no state machine.

Code: [github.com/souravselvaraj/Revolute](https://github.com/souravselvaraj/Revolute)
