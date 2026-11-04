---
layout: page
title: Go1 PPO Locomotion
description: PPO walking policies for the Unitree Go1, trained in JAX and MuJoCo MJX on MuJoCo Playground's flat and rough joystick tasks, with a demo on a real Go1.
img: assets/img/projects/go1_locomotion.jpg
importance: 8
category: projects
---

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/go1_locomotion.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    A policy trained with this setup walking a real Go1 on a flat lab floor (qualitative only, no tracking metrics).
</div>

## What is borrowed and what is mine

The task is the Go1 joystick environment from DeepMind's MuJoCo Playground, used as is (observations, reward, domain randomization, terrains and PPO settings), with the Go1 model from MuJoCo Menagerie.

I moved Playground's flat and rough tasks into a standalone package, wrote a keyboard viewer for driving checkpoints on either terrain, ran full-length training on both, wrote an environment design note (`modeling_section.md`) and prepared the public release. [ramellen](https://github.com/ramellen) added simulation plots of commanded against achieved velocity, joint angles and gait phases, and [laasyak02](https://github.com/laasyak02) wrote a driver for scripted straight-line and circular paths.

## Training

Playground's default PPO settings, which I kept, train 8192 Go1s in parallel for 200 million control steps. The policy's 48 inputs, noised during training, are things the robot can measure or estimate, including the body's linear velocity, which the real Go1 has no sensor for and must estimate on hardware.

The reward pays for following a random forward, sideways and turning command and charges for bouncing, tilting, foot slip, torque and power. With no reference motion, the gait is whatever balances these terms. The rough variant (`Go1JoystickRoughTerrain`) adds bumps up to 5 cm, half the 10 cm swing-height target, and the policy feels them only through its joints and IMU.

A simulator never gets friction, masses or sensor noise exactly right, and a policy that depends on those errors will stumble on hardware. Domain randomization varies friction, masses, the trunk's center of mass, rotor inertia and joint zero angles across robots to make that less likely. But the README's training commands didn't switch it on at the time, and neither run's saved configuration records whether it was on. Trunk pushes were off in both.

## Results and limits

Simulation numbers are from Brax's in-training evaluation: 128 episodes of up to 20 seconds, with training's commands and sensor noise and the policy still sampling its actions. A fall means the body tipped past 90 degrees.

After the last flat run (Playground's defaults), all 128 episodes lasted the full 20 seconds, and no evaluation from about 138 million steps on had a fall. The rough-terrain policy fell in 26 of 128 episodes at its final evaluation. Its falls rose from one at about 46 million steps to 31 at about 69 million, where its speed tracking also rose sharply, and stayed between 17 and 31 afterwards.

I haven't measured velocity-tracking error or compared against another controller, in simulation or on hardware. The rough-terrain policy has only walked in simulation, and the video is the only hardware evidence.

Code, with training and teleoperation instructions: [github.com/souravselvaraj/unitree-go1-ppo-mjx](https://github.com/souravselvaraj/unitree-go1-ppo-mjx)
