---
layout: page
title: Humanoid Ice Skating
description: Emergent ice-skating locomotion for a Unitree G1 via blade-contact RL — no motion capture, no imitation data.
img: assets/img/projects/g1_ice_skating.jpg
importance: 3
category: projects
---

Training a **Unitree G1 humanoid to ice-skate** on passive 3 mm knife-edge blades with PPO in MuJoCo — with **no motion capture or imitation data**. Skating emerges purely from the physics: **anisotropic blade–ice contact** (elliptic friction cones — near-frictionless along the blade, high resistance across it) and a reward that separates forward glide from penalized lateral slip.

<div class="row justify-content-center">
    <div class="col-sm-10 mt-3 mb-3">
        {% include video.liquid path="https://www.youtube.com/embed/ghr8AGP4rIg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Emergent skating gait in MuJoCo — glide, push-off, and recovery arise from blade-contact physics alone.
</div>

## Engineered for hardware transfer

- **Asymmetric actor–critic** with privileged blade velocities available to the critic only.
- **Staged speed curriculum** from 0.15 to 1.2 m/s.
- **Ungated slip penalties** that close reward-hacking exploits (policies that "walk" on the blades instead of gliding).
- **Domain randomization** over PD gains, inertia, payload, actuator delay, and blade mounting.

## Current results (simulation)

Policies track a 0.9 m/s velocity command within **0.09 m/s** at **94% single-support**, holding lateral blade slip to **2–4 cm/s** and gliding for up to **70% of stance**.
