---
layout: page
title: Revolute
description: "ToastBot, our Revolute 2026 hackathon entry: flow-matching policies for the steps of making toast on a six-joint arm, learned from teleoperation and sized for a Jetson."
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
    Top-camera view: bread slices in the purple holder, the toaster, and the pan.
</div>

At the Revolute 2026 hackathon (August 1 and 2, 2026, at FabLab Kendall), our team, Team Toasted, built ToastBot. We split making toast into three steps on a Seeed B601 RS arm (bread into the toaster, pull the lever, toast onto a pan) and trained a flow-matching policy for each with [LeRobot](https://github.com/huggingface/lerobot) from teleoperated demonstrations. The repository is mine, from the recording scripts to policy training, and I committed all of it over the hackathon weekend.

We started from people who can't safely use heating appliances. Without those appliances, cooking comes down to one pot at one temperature, and nothing comes out crispy. So we asked how a robot arm could make crispy food for someone in that situation, and toasting the bread is the part ours does.

## Why three small policies

With 40 to 50 demonstrations per task, data, more than compute, was the limit. So we trained a separate policy for each step and planned a state machine to chain them. Each policy learns a short episode, and a failure points to one stage. We decided against a large vision-language-action model. For three fixed tasks, language conditioning could end up as a lookup from instruction to policy, which a state machine does explicitly. The event's compute notes put inference on an 8 GB Jetson Orin Nano, where such a model is impractical, and warned that a cloud round trip takes about 60 to 150 ms, too slow for a 30 to 50 Hz control loop.

## Sizing for the Jetson

The arm executes the first 16 actions (533 ms) of each 48-action chunk, then re-plans, which pauses the loop for one control step. I sized the defaults against that window on the Orin Nano: one observation step where Diffusion Policy uses two, and five integration steps where a standard DDPM sampler takes about 100, which flow matching's near-straight learned paths allow (the [Flow Matching Policies]({{ '/projects/flow-matching-policies/' | relative_url }}) page compares the two in simulation). Forty demonstrations are too few to fine-tune a vision transformer, so DINOv2-small stays frozen and only the networks above it train.

`flow_dit_small`, the deployment default, re-plans in 33 ms on the RTX 5060 laptop GPU that drove the arm, against 83 ms for `flow_dit_base`. The base model's error on replayed demonstrations is lower (0.200 joint units against 0.284), but with no held-out episodes that measures fit and doesn't show whether its 41.2M trainable parameters (against 18.2M) overfit a few dozen demonstrations.

## What recording taught us

The toast recordings ran a fixed 20 seconds, and about a quarter of the placing frames show no motion. The same observation is then followed by motion in some episodes and stillness in others, which can make a policy freeze mid-task, so we trimmed idle frames from both toast datasets and trained a second policy on each.

I raised the kernel's default 10-frame CAN transmit queue to 1000, since teleoperation sends about 420 CAN frames a second and one USB hiccup could abort an episode, and capped the Rerun visualizer's memory after its stalls froze the camera and joint streams. A default task string had swapped the labels of the two toast datasets, and I corrected both. Our policies never read the string, but a language-conditioned one would do the opposite task. I also patched an 8-bit overflow in LeRobot's image statistics that had zeroed the collecting data's per-episode image standard deviations.

## Where it stands

Trained `flow_dit` policies have run on the real arm for placing and collecting, one task per saved rollout. With no success rates reported yet, these runs are qualitative. No policy has run on the Jetson yet, and the repository has no state machine to chain them. Five `flow_dit_small` checkpoints ship through Git LFS: two per toast task (one of each pair on idle-trimmed data) and one for the lever. The repository documents no lever rollout.

Code: [github.com/souravselvaraj/Revolute](https://github.com/souravselvaraj/Revolute)
