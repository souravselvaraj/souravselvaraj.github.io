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
    The workspace from the top camera: bread slices in the purple holder, the toaster, and the pan.
</div>

At the Revolute 2026 hackathon (August 1 and 2, 2026, at FabLab Kendall), our team, Team Toasted, built ToastBot. We split making toast into three steps on a Seeed B601 RS arm: put a slice of bread in the toaster, pull the lever, and move the toast to a pan. For each step we recorded teleoperated demonstrations and trained a flow-matching policy with [LeRobot](https://github.com/huggingface/lerobot). The repository is mine, from the recording scripts to policy training, and I committed all of it over the hackathon weekend.

## Why toast

We started from people who cannot safely use heating appliances or sharp utensils. Without them, cooking comes down to one pot at one temperature, and nothing comes out crispy. Disability-friendly meals can get boring and repetitive. People end up relying on caregivers and social services. So we asked how a robot arm could make crispy food for someone in that situation. Our baseline was a toasted sandwich with spreads, crispy and smooth at once and a childhood favorite. Toasting the bread is the part the arm does.

## Three short policies

The full sequence is long, with a wait for the toaster in the middle. With 40 to 50 demonstrations per task, data, more than compute, was the limit. So we trained a separate policy for each step and planned a state machine to run them in order. Each policy learns a short episode, and a failure points to one stage.

We decided against a large vision-language-action model. For three fixed tasks, language conditioning could end up as a lookup from instruction to policy, which a state machine would do explicitly. Such a model is also impractical on an 8 GB Jetson Orin Nano. The event's compute notes put inference on the Jetson and warned that a cloud round trip takes about 60 to 150 ms, too slow for a 30 to 50 Hz control loop.

## Why flow matching

Each policy takes images from a fixed top camera and a wrist camera, plus the arm's joint positions, and predicts a chunk of future joint positions. A diffusion policy builds it from random noise, which its standard DDPM sampler removes over about 100 small steps. Flow matching (rectified flow) trains the network to predict a velocity along a straight line from noise to a demonstrated chunk. The learned paths come out close to straight, so our policies sample with only 5 Euler steps. The [Flow Matching Policies]({{ '/projects/flow-matching-policies/' | relative_url }}) page compares the two in simulation.

A chunk holds 48 actions, 1.6 s at 30 fps. The arm executes the first 16 (533 ms) and then re-plans from a fresh observation. A re-plan pauses the loop for one control step, so its latency matters even inside that window.

## Sized for the Jetson

I sized the defaults against that 533 ms re-plan window on the Orin Nano: one observation step where Diffusion Policy uses two, which halves the vision cost, and five integration steps. Data decided how the backbone is trained. Forty demonstrations are too few to fine-tune a vision transformer, so DINOv2-small stays frozen, and only what sits on top of it trains: a small transformer per camera and the network that predicts the velocity.

`flow_dit_small` is the deployment default. On the laptop that drove the arm (an RTX 5060 laptop GPU), it re-plans in 33 ms, against 83 ms for `flow_dit_base`. The base model has lower error on replayed demonstrations (0.200 joint units against 0.284) and comes next once the small one behaves on the arm. Training holds no episodes out, so that comparison measures fit and does not settle whether the base model's trainable parameters, more than twice as many (41.2M against 18.2M), overfit a few dozen demonstrations.

`flow_dit` uses a transformer to predict the velocity. Its twin, `flow_unet`, swaps in Diffusion Policy's 1D convolutional U-Net and keeps everything else, a controlled comparison with no results reported yet.

## What the recordings taught us

We teleoperated with a leader arm and recorded at 30 fps. The two toast tasks are the same manipulation run in opposite directions.

| Task                                                   | Demonstrations | Frames |
| ------------------------------------------------------ | :------------: | :----: |
| Pick up a bread slice and put it in the toaster        |       40       | 23,847 |
| Pull the toaster lever                                 |       40       | 15,986 |
| Collect toast from the toaster and place it on the pan |       50       | 29,828 |

Our toast recordings ran for a fixed 20 seconds, and about a quarter of the placing frames show no motion. Those idle stretches can make a policy freeze mid-task, because the same observation is followed by motion in some episodes and by stillness in others. We trimmed idle frames from both toast datasets and trained a second policy on each trimmed set. The lever demonstrations, recorded later, are shorter, about 13 seconds on average.

Teleoperation sends about 420 CAN frames a second, and with the kernel's default 10-frame transmit queue one USB hiccup could abort an episode. I raised the queue to 1000 frames and capped the Rerun visualizer's memory after its stalls froze the camera and joint streams. The last seven placing episodes came after these fixes.

Both cameras are rigidly mounted and the actions are absolute joint positions, so where things sit in the image matters. We fixed the camera placement and controlled the lighting. Augmentation stayed mild, and we tried to keep the background plain. The wrist camera's auto-exposure gave black frames, so we set its exposure by hand each session.

The recording script's default task string also mislabelled both toast datasets. The collecting set was recorded under the placing instruction, and after I flipped the default, the placing set inherited the collecting one. Our policies never read the string, but a language-conditioned policy would do the opposite task. I corrected both labels, and the script now refuses to record without one. I also patched an 8-bit overflow in LeRobot's image statistics that had zeroed the per-episode image standard deviations in the collecting data.

## Where it stands

Trained `flow_dit` policies have run on the real arm for the placing and collecting tasks, one task per saved rollout. No success rates are reported yet, so these runs are qualitative, and no policy has run on the Jetson yet. The repository has no state machine to chain the policies.

Five `flow_dit_small` checkpoints ship through Git LFS, each trained for 40,000 steps at batch 128 with the same seed: two per toast task (one of each pair on idle-trimmed data) and one for the lever, added last. The repository documents no lever rollout.

Code: [github.com/souravselvaraj/Revolute](https://github.com/souravselvaraj/Revolute)
