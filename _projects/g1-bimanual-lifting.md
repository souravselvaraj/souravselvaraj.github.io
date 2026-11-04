---
layout: page
title: Bimanual Lifting
description: A Unitree G1 learns in MuJoCo to lift a box with both arms, using a residual AMP-PPO policy over a frozen walking controller. A lifting policy later ran on the real G1.
img: assets/img/projects/g1_bimanual_lifting.jpg
importance: 4
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/g1_bimanual_lifting_release.mp4" class="img-fluid rounded z-depth-1" width="100%" autoplay=true loop=true controls=true muted=true %}
    </div>
</div>
<div class="caption">
    My collaborator's August 2026 release in MuJoCo simulation, which drives the joints directly with no residual over the frozen walking policy.
</div>

Reaching for a box shifts your center of mass forward, and you stand back up with the weight in front of you. Here a Unitree G1 learns that two-armed lift in MuJoCo simulation, and a lifting policy from the project later lifted a box on the real G1.

I worked on this with Mohamed Shuaib Nasurudeen ([shuayyy](https://github.com/shuayyy)), whose training stack it is: AMP-PPO on RSL-RL and mjlab, the frozen G1 locomotion policy, the motion clips, the dual-arm environment with its original reach and lift rewards, and the virtual box controller. My part was the residual lift policy: the residual setup, curricula that adapt to the success rate, most of the posture rewards and the posture evaluation tooling, training the residual versions, and a rewritten README.

## Building on the walking policy

Following [ResMimic](https://arxiv.org/abs/2510.05070) (Zhao et al., 2025), a residual network adds to the frozen locomotion policy's actions, so training the lift can't overwrite what the base learned about balance. An adversarial motion prior (AMP) rewards motion that a discriminator can't tell from motion capture. If looking human pays enough, a policy can hold a natural pose and never lift anything, so we capped the style reward near what the robot earns for just standing. Early on, a virtual controller takes some of the box's weight like a spotter at the gym, and I made that help fade only while lift success stays high.

## Why it wouldn't squat

The motion capture squats symmetrically to reach the box, but v5 lunged and later versions folded at the waist with straight legs. I added a posture penalty against each failure, and the policy kept finding a new one. A lunge crossed in half a second cost almost nothing per step, so some penalties became one-time charges on the episode's worst posture.

The actual cause was the action space. The leg residual was scaled so small that the policy could command at most about 0.4 rad of knee bend, while the reference squat bends the knees 1.9 to 2.2 rad. No reward could produce a squat the policy couldn't command. I raised the leg authority, dropped most reach-phase penalties and started a quarter of episodes from motion-capture squat frames, since exploration from standing never found the squat. Whether the style prior alone now shapes a squat was still being tested at my last commit.

## Results

| Setting                               | What we checked                                         | Result                                                 |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| MuJoCo simulation, converged policies | Object position, held at the goal height                | within 3 cm of the target                              |
| MuJoCo simulation, converged policies | Torso pitch while holding the object at the goal height | between 2° and 13°, the range in the human motion data |
| Real Unitree G1                       | Lifting a box                                           | lifting policy run on hardware (qualitative)           |

The 2 to 13° range is what we mean by human-like, and it covers the hold only: during its reach, the person in the motion capture leans to about 50°.

## Status and code

As of my last commit the task was lifting in place, with no carry to a goal and the depth-camera input off by default. The clip at the top comes from my collaborator's [released policy](https://github.com/shuayyy/humanoid-amp-ppo/commit/241cd05), which drops the frozen base, sizes its action ranges from the motion capture and trains with a much heavier, constant style weight. According to its config, it reaches a squat at motion-capture depth.

The code is in [github.com/shuayyy/humanoid-amp-ppo](https://github.com/shuayyy/humanoid-amp-ppo). The residual setup, the v5 checkpoint (from before the squat changes above) and my README are at commit [94f6a93](https://github.com/shuayyy/humanoid-amp-ppo/tree/94f6a93).
