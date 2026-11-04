---
layout: page
title: Go1 PPO Locomotion
description: PPO walking policies for the Unitree Go1, trained in MuJoCo MJX on MuJoCo Playground's flat and rough tasks, with a demo on a real Go1.
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
    A policy from this setup walking a real Go1 on a flat floor (qualitative only).
</div>

I trained PPO walking policies for the Unitree Go1 on flat and rough terrain. I used the Go1 joystick tasks from DeepMind's MuJoCo Playground as is. The Go1 model is from MuJoCo Menagerie. Playground's reward pays for following random forward, sideways and turning commands.

I moved both tasks into a standalone package and wrote a keyboard viewer for driving the trained policies. I ran full-length training on both, wrote an environment design note and prepared the public release. [ramellen](https://github.com/ramellen) plotted velocity, joint angles and gait phases in simulation. [laasyak02](https://github.com/laasyak02) wrote a driver for scripted paths.

## Results and limits

Both results are from simulation. The final flat policy lasted the full 20 seconds in all 128 evaluation episodes. The rough-terrain policy fell in 26 of 128 episodes at its final evaluation.

I haven't measured velocity-tracking error or compared against another controller. The rough-terrain policy has only walked in simulation. The video is the only hardware evidence.

The README's training commands didn't turn on domain randomization at the time. Neither run's saved config records whether it was on.

Code: [github.com/souravselvaraj/unitree-go1-ppo-mjx](https://github.com/souravselvaraj/unitree-go1-ppo-mjx)
