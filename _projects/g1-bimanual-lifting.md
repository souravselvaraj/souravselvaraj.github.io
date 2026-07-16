---
layout: page
title: Bimanual Lifting
description: Human-like bimanual object lifting and carrying for a Unitree G1 via residual AMP–PPO over a frozen locomotion policy.
img: assets/img/projects/g1_bimanual_lifting.jpg
importance: 4
category: projects
---

Trained a **Unitree G1** to squat, grasp, and carry objects bimanually in MuJoCo via a **residual policy over a frozen locomotion actor**, with an **AMP discriminator** on human motion capture acting as a *capped* style regularizer — so imitation reward can never outpay task completion.

<div class="row justify-content-center">
    <div class="col-sm-10 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/g1_bimanual_lifting.mp4" class="img-fluid rounded z-depth-1" controls=true %}
    </div>
</div>
<div class="caption">
    Converged policy squatting, grasping, and carrying an object bimanually with human-like posture.
</div>

## Training machinery

- **Success-adaptive curricula** annealing a virtual object assist as the policy improves.
- **Asymmetric actor–critic** with privileged contact forces (critic-only) and noisy object-state observations for the actor.
- **Domain randomization** over object mass, friction, center of mass, and base pushes.
- Closed successive **reward-hacking exploits** via gated posture penalties.

## Results

Converged policies consistently hold objects at goal height, centered within **3 cm**, with human-like posture — torso pitch inside the mocap prior's 2–13° range.

Code: [github.com/shuayyy/humanoid-amp-ppo](https://github.com/shuayyy/humanoid-amp-ppo)
