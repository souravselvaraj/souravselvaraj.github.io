---
layout: page
title: Bimanual Lifting
description: Human-like bimanual object lifting and carrying for a Unitree G1 via residual AMP–PPO over a frozen locomotion policy.
img: assets/img/projects/g1_bimanual_lifting.jpg
importance: 4
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-10 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/g1_bimanual_lifting.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Converged policies squatting, grasping, and carrying objects bimanually in MuJoCo.
</div>

Whole-body lifting is a coordination problem: a humanoid must bend its legs, lean its torso, close both arms around an object, and stand back up — without the arms fighting the balance controller. This project trains a **Unitree G1** to squat, grasp, and carry objects bimanually in MuJoCo, structured as a **residual policy over a frozen locomotion actor**: the pretrained locomotion policy keeps the robot balanced and walking, while a residual network adds the manipulation behavior on top.

## Style without imitation traps

An **AMP discriminator** trained on human motion capture acts as a style regularizer — but a *capped* one. The imitation reward is bounded so it can never outpay task completion: the policy is rewarded for lifting like a human, but only after it actually lifts. This ordering matters; uncapped style rewards routinely produce policies that pose beautifully and never pick anything up.

## Training machinery

- **Success-adaptive curriculum** — a virtual "object assist" force helps early training and is annealed away as the success rate climbs.
- **Asymmetric actor–critic** — the critic sees privileged contact forces; the actor sees noisy object-state observations only.
- **Domain randomization** over object mass, friction, center of mass, and external base pushes.
- **Reward-hacking whack-a-mole** — successive exploits (lunging, waist-folding instead of squatting) were closed with gated posture penalties that activate only when the task is being cheated, not during legitimate motion.

## Results (simulation)

Converged policies consistently hold objects at goal height, centered within **3 cm**, with human-like posture — torso pitch stays inside the mocap prior's 2–13° range. This project is simulation-only; no sim-to-real transfer was attempted.

Code: [github.com/shuayyy/humanoid-amp-ppo](https://github.com/shuayyy/humanoid-amp-ppo)
