---
layout: page
title: Bimanual Lifting
description: A Unitree G1 learns to lift a box with both arms in MuJoCo. A lifting policy later ran on the real G1.
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
    My collaborator's August 2026 release, in MuJoCo simulation. It drops the frozen walking policy.
</div>

A Unitree G1 learns to lift a box with both arms in MuJoCo simulation. I worked on this with Mohamed Shuaib Nasurudeen ([shuayyy](https://github.com/shuayyy)). The AMP-PPO training stack, environment and frozen walking policy are his. An adversarial motion prior (AMP) rewards motion that a discriminator can't tell from motion capture.

I set up and trained the residual lift policy. Following [ResMimic](https://arxiv.org/abs/2510.05070) (Zhao et al., 2025), it adds to the frozen policy's actions. I also made the curricula adapt to success rate. I wrote most of the posture rewards and the posture evaluation tooling.

## Why it wouldn't squat

Instead of squatting, the policies lunged or folded at the waist with straight legs. I added a posture penalty for each failure, and the policy kept finding a new one.

The real cause was the action space. The leg residual allowed at most about 0.4 rad of knee bend. The reference squat bends the knees 1.9 to 2.2 rad.

I scaled up the leg residual and dropped most penalties during the reach. I also started a quarter of episodes from motion-capture squat frames. Whether the AMP style prior alone now shapes a squat was still being tested at my last commit.

## Results

| Setting                               | What we checked                                         | Result                                                 |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| MuJoCo simulation, converged policies | Object position, held at the goal height                | within 3 cm of the target                              |
| MuJoCo simulation, converged policies | Torso pitch while holding the object at the goal height | between 2° and 13°, the range in the human motion data |
| Real Unitree G1                       | Lifting a box                                           | lifting policy run on hardware (qualitative)           |

The 2 to 13° range covers the hold only.

## Code

The top clip is from my collaborator's [released policy](https://github.com/shuayyy/humanoid-amp-ppo/commit/241cd05). The code is in [github.com/shuayyy/humanoid-amp-ppo](https://github.com/shuayyy/humanoid-amp-ppo). My residual setup and README are at commit [94f6a93](https://github.com/shuayyy/humanoid-amp-ppo/tree/94f6a93).
