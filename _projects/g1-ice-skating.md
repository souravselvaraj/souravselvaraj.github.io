---
layout: page
title: Humanoid Ice Skating
description: A simulated Unitree G1 humanoid learns to ice-skate with reinforcement learning, on passive blades that glide along their length and grip sideways.
img: assets/img/projects/g1_ice_skating.jpg
importance: 3
category: projects
---

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
            <iframe
                src="https://www.youtube.com/embed/F5EM3TZRRbE"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                class="rounded z-depth-1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen></iframe>
        </div>
    </div>
</div>
<div class="caption">
    A policy from my newer Isaac Lab version, trained toward a human-like stroke and replayed in MuJoCo. The numbers below are from earlier mjlab policies not shaped that way.
</div>

A planted foot is supposed to stay put, but a skate is meant to slide. Can a humanoid learn to use a contact like that? I trained a simulated Unitree G1 with reinforcement learning in mjlab.

## Blade and reward

A blade glides along its length and grips sideways. MuJoCo's standard friction is the same in every direction. I made mine low along each blade and high across it. Past about 30 degrees of blade turn, this approximation over-grips, and some policies exploited that.

The reward pays for tracking speed, staying upright and gliding. It penalizes sideways slip. Before I paid for gliding, the policy vaulted over each planted blade. It was walking on skates. An ablation without the glide reward brought the walking back, with the lowest sideways slip of any version. So I look at glide and slip together.

## Results in simulation

Each value averages 12 runs per speed: three seeds, each on four randomized ice conditions.

| What I measured                         | Result              |
| --------------------------------------- | ------------------- |
| Speed error at 0.6 and 0.9 m/s commands | 0.11 and 0.16 m/s   |
| Sideways blade slip                     | 3 to 4 cm/s         |
| Glide ratio at 0.3, 0.6 and 0.9 m/s     | 0.89, 0.70 and 0.57 |

Glide ratio is the planted blade's speed along its length divided by forward body speed. It's near 0 when walking. At 0.3 m/s, 3 of the 12 runs stalled.

## Where it stands

I've ported the project to Isaac Lab 3.0. The main recipe there rewards following a reference gait from an earlier policy I'd shaped toward a human-like stroke. So it's no longer trained from task rewards alone. A real G1 is next.
