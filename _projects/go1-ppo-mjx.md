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
    A policy trained with this setup walking on a real Go1 on a flat lab floor, shown as a qualitative demonstration with no tracking metrics.
</div>

A reinforcement learning policy learns to walk by practicing in simulation and is then moved to the real robot. A simulator never gets friction, masses or sensor noise exactly right, so a policy that has come to depend on those errors will stumble on hardware.

## What is borrowed and what is mine

The task (observations, reward, domain randomization, terrains and PPO settings) is the Go1 joystick environment from DeepMind's MuJoCo Playground, used as is, with the Go1 model from MuJoCo Menagerie.

I moved Playground's flat and rough Go1 joystick tasks into a standalone package, wrote a keyboard viewer for driving trained checkpoints, and ran full-length training on both terrains. I also wrote a note on the environment design (`modeling_section.md`) and prepared the public release. Two collaborators added simulation scripts: [ramellen](https://github.com/ramellen) plotted commanded against achieved velocity, joint angles and gait phases, and [laasyak02](https://github.com/laasyak02) wrote a driver for scripted straight-line and circular paths. I trained the policies in March and April 2026 and released the code in June.

## How the policy learns to walk

MJX is the JAX version of MuJoCo, so physics, rewards and the PPO update compile together on the GPU, and `jax.vmap` steps every simulated robot in one batch. Playground's default configuration, which I kept, trains 8192 Go1s in parallel for 200 million control steps with Brax's PPO. My logs show a full run taking a little over 20 minutes on flat ground and about half an hour on rough ground.

Fifty times a second the policy picks a target angle for each of the 12 joints, as an offset of at most 0.5 rad from a standing pose, and a PD loop (stiffness 35 N·m/rad, damping 0.5 N·m·s/rad) turns that target into torque while the physics runs at 250 Hz.

Each simulated robot starts with a random command of forward speed (up to 1.5 m/s either way), sideways speed (up to 0.8 m/s) and turning rate (up to 1.2 rad/s). During a 20-second episode, at random moments about 5 seconds apart on average, each part of the command may switch to a new value, which for sideways speed is usually zero. The policy sees 48 numbers the robot can measure or estimate: gyro angular velocity, the direction of gravity in the body frame, joint angles and speeds, its previous action, the command, and the body's linear velocity. Every reading gets random noise during training. The real Go1 has no linear velocity sensor, so on hardware that input must come from a state estimate.

The critic, which scores states during training and never runs on the robot, sees 123 numbers, adding noise-free readings and simulation-only quantities such as joint torques, foot velocities and contacts. The idea is that better value estimates give the policy a cleaner learning signal.

Playground's reward mainly pays the robot for matching the commanded velocity and charges it for bouncing, tilting, foot slip, torque, power and abrupt action changes. Swing feet are pulled toward 10 cm of clearance, and while the robot is commanded to move, feet earn a small bonus for swings longer than 0.1 s. With no reference motion, the gait is whatever balances these terms.

## Preparing for the real robot

The README's training commands switch on domain randomization, which makes each simulated robot slightly different. Floor friction is drawn between 0.4 and 1.0. Link masses are scaled by up to 10% either way, the trunk gains or loses up to 1 kg, and its center of mass shifts by up to 5 cm along each axis. Joint friction and rotor inertia vary a little, and each joint's zero angle moves by up to 0.05 rad to stand in for calibration error. A policy that walks on all of these robots is less likely to depend on the simulator's errors. Playground can also push the trunk at random moments, but the saved configurations of both runs reported below show that option switched off. Those files do not record whether randomization was on for the two runs, and the README's training commands at the time did not switch it on.

## Rough ground

`Go1JoystickRoughTerrain`, Playground's rough-terrain variant, replaces the flat floor with a heightfield whose bumps reach 5 cm, half the swing-height target. The reward is unchanged, so whatever the policy learns about bumps comes from the terrain (and the randomization, when enabled). The policy has no height map or camera and feels the ground only through its joints and IMU. I trained it for the same 200 million steps (last checkpoint at 206,438,400) and added terrain selection to my viewer, so both policies run from one script.

## Results and limits

On hardware, the only evidence is the video at the top. In simulation, the numbers come from Brax's evaluation during training: 128 episodes of up to 20 seconds, with training's command sampling and sensor noise and the policy still sampling its actions. A fall means the body tipped past 90 degrees. At the end of the last flat run, which used Playground's default training settings, all 128 episodes lasted the full 20 seconds, and no evaluation from about 138 million steps on had a fall. The rough-terrain policy fell in 26 of 128 episodes at its final evaluation. Falls rose from one at about 46 million steps to 31 at about 69 million, the evaluation where its speed tracking also rose sharply, and stayed between 17 and 31 afterwards.

I have not measured velocity-tracking error or compared against another controller, in simulation or on the robot. The only tracking data is one simulated rollout of about 4 seconds from the flat-ground policy at a constant 0.5 m/s forward command, plotted against that command. The rough-terrain policy has only been shown walking in simulation.

My separate ROS 2 Humble and Ignition Gazebo setup for the Go1 from October 2025 does not run this policy; it uses a scripted gait controller adapted from code by lnotspotl and abutalipovvv.

Code, with training and teleoperation instructions: [github.com/souravselvaraj/unitree-go1-ppo-mjx](https://github.com/souravselvaraj/unitree-go1-ppo-mjx)
