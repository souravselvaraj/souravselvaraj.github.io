---
layout: page
title: Humanoid Ice Skating
description: Emergent ice-skating locomotion for a Unitree G1 via blade-contact RL — no motion capture, no imitation data. Skating falls out of the physics.
img: assets/img/projects/g1_ice_skating.jpg
importance: 3
category: projects
---

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
            <iframe
                src="https://www.youtube.com/embed/ghr8AGP4rIg"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                class="rounded z-depth-1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen></iframe>
        </div>
    </div>
</div>
<div class="caption">
    Emergent skating in MuJoCo — glide, push-off, and recovery arise from blade-contact physics alone.
</div>

Can a humanoid learn to *ice-skate* without ever being shown how? This project trains a **Unitree G1** on passive 3 mm knife-edge blades with PPO in MuJoCo, using **no motion capture and no imitation data**. There is no reward term that says "look like a skater" — the skating gait *emerges* from the interaction between the contact physics and a task reward.

## The key idea: let the physics do the talking

Real ice skating exists because a blade is directionally selective: nearly frictionless along its length, and strongly resistant sideways. The simulation captures exactly this with **anisotropic blade–ice contact** — elliptic friction cones aligned with each blade — plus a reward that separates the two directions:

- **Forward glide** along the blade is rewarded.
- **Lateral slip** across the blade is penalized — and the penalty is *ungated* (always active), which closed a family of reward-hacking exploits where the policy "walked" on the blades instead of gliding.

Given only this, PPO discovers push-off, glide, and weight transfer on its own.

## Engineered for hardware transfer

The training setup is built so the policy has a path to the real robot:

- **Asymmetric actor–critic** — the critic sees privileged blade-velocity information; the actor only gets observations available onboard.
- **Staged speed curriculum** from 0.15 m/s up to 1.2 m/s commanded speed.
- **Domain randomization** over PD gains, link inertia, payload, actuator delay, and blade mounting geometry.

## Current results (simulation)

| Metric                             | Result                     |
| ---------------------------------- | -------------------------- |
| Velocity tracking @ 0.9 m/s command | within **0.09 m/s**       |
| Single-support time                | **94%**                    |
| Lateral blade slip                 | **2–4 cm/s**               |
| Glide fraction of stance           | up to **70%**              |

Active project (started July 2026) — hardware transfer is the next milestone.
