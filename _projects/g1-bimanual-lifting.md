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
    The dual-arm lifting policy from my collaborator's August 2026 release, in MuJoCo simulation. This release drives the joints directly instead of adding a residual to the frozen walking policy (see below).
</div>

Picking a box up off the floor takes your whole body. You bend your legs, lean your torso, pull the box in with both arms and stand back up. A humanoid has to do the same, and its arms cannot fight whatever is keeping it balanced. In this project a Unitree G1 learns in MuJoCo simulation to reach down to a box, grasp it with both arms and lift it, and we later ran a lifting policy from the project on the real G1.

This was a collaboration with Mohamed Shuaib Nasurudeen ([shuayyy](https://github.com/shuayyy)). The training stack is my collaborator's work: AMP-PPO on RSL-RL and mjlab, the G1 locomotion policy used as the frozen base, the motion clips, the dual-arm environment with its original reach and lift rewards, and the virtual box controller described below. My part was the residual version of the lift policy. I added the residual setup over the frozen locomotion policy, made the curricula adapt to the success rate, wrote most of the posture rewards and the posture evaluation tooling, trained the residual versions of the lift policy, and rewrote the README.

## Why lifting is hard for a humanoid

Reaching down shifts the robot's center of mass forward, and with the box in its hands it has to stand up with that weight in front of its body. The lifting reward only pays once both hands are on the box, so separate reach rewards guide the hands there first.

## Keeping the walking policy and learning the rest

We split the problem in two, following [ResMimic](https://arxiv.org/abs/2510.05070) (Zhao et al., 2025). The locomotion policy keeps the G1 balanced, and we froze it. A second, residual network adds its output to the frozen policy's actions and also sees the action the frozen policy just took. A person who already knows how to stand keeps that skill when they pick up a box and adjusts their posture around the load. Because the locomotion weights never change, training the lift cannot overwrite what the base policy learned about balance. Both policies were trained with PPO and run at 50 Hz.

## Moving like a person

For human-like motion we used an adversarial motion prior (AMP): a discriminator learns to tell motion capture from the robot's motion, and the policy earns a style reward for fooling it. I widened the discriminator's input from joint angles alone to joint angles and velocities plus the base's velocity and tilt. If looking human pays enough, a policy can hold a natural pose and never pick anything up, so we capped the style reward near what the robot earns for just standing. After v5 lunged to reach the box, the reach phase got a larger style weight, since task rewards are sparse there, and the cap now applies only after the lift.

## Getting training to converge

Early on, a virtual controller on the box takes some of its weight, like a spotter at the gym. I made its assistance decay only while the lift success rate stays high and return if success collapses, with a growing penalty on whatever assistance the policy still uses. The object observations carry about 1 cm of noise, and we randomized the box's mass (0.7 to 1.5 times nominal), friction and center of mass, the robot's friction and torso center of mass, and pushed the robot at random.

## What the lunge taught us

v5 reaches the box with a lunge where the motion capture squats symmetrically, and later versions folded at the waist with straight legs. I added a posture penalty against each failure, and the policy kept finding a new one. A lunge crossed in half a second cost almost nothing per step, so some penalties became one-time charges on the episode's worst posture.

The actual cause was the action space. The leg residual was scaled so small that the policy could command at most about 0.4 rad of knee bend, while the reference squat bends the knees 1.9 to 2.2 rad. No reward could produce a squat the policy could not command. I raised the leg authority, dropped most of the reach-phase penalties and started a quarter of episodes from motion-capture squat frames, since exploration from standing never found the squat. Whether the style prior alone now shapes a squat was still being tested at my last commit.

## Results

| Setting                               | What we checked                                         | Result                                                 |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| MuJoCo simulation, converged policies | Object position, held at the goal height                | within 3 cm of the target                              |
| MuJoCo simulation, converged policies | Torso pitch while holding the object at the goal height | between 2° and 13°, the range in the human motion data |
| Real Unitree G1                       | Lifting a box                                           | lifting policy run on hardware (qualitative)           |

The 2 to 13° pitch range is what we mean by human-like here, and it covers the hold only. During its reach, the person in the motion capture leans to about 50°.

We have since run a lifting policy from this project on the real Unitree G1, and it lifted a box. That run is qualitative.

## Status

As of my last commit the task was lifting in place, with no carry to a goal, and a depth-camera input was wired up but off by default. The clip at the top shows my collaborator's August release, described next, not this residual line. The larger pre-lift style weight, the one-time posture charges, the squat starts and the raised leg authority all came after v5.

In August 2026 my collaborator committed a [released policy](https://github.com/shuayyy/humanoid-amp-ppo/commit/241cd05) that drops the frozen base. It drives the joints directly, with action ranges sized from the motion capture, and trains with a much heavier, constant style weight. According to its config, it reaches a squat at motion-capture depth, and its discriminator is back to joint angles only.

## Code

The code is in [github.com/shuayyy/humanoid-amp-ppo](https://github.com/shuayyy/humanoid-amp-ppo). The residual setup, the v5 checkpoint and my README are in its history at commit [94f6a93](https://github.com/shuayyy/humanoid-amp-ppo/tree/94f6a93).
