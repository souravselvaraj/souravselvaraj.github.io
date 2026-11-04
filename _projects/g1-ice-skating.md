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

When a person walks, a planted foot is supposed to stay put. On skates it keeps moving, and that motion carries the skater forward. I wanted to know whether a humanoid could learn to use a contact meant to slide. I trained a simulated Unitree G1 with reinforcement learning in mjlab (GPU MuJoCo), without motion capture or human reference motion.

## Blade and robot

A blade glides along its length and grips sideways, so a skater pushes off one angled blade while gliding on the other. MuJoCo's standard friction is the same in every direction, so mine is low along each blade and high across it, turning with the blade approximately. The passive blades are flatter and wider than real ones, but sideways balance is still hard.

The critic sees blade velocities the real G1 can't measure; the policy gets only on-board signals like joint and IMU history. I randomize gains, inertia, payload, actuator delay and blade mounting, and command forward speed only, since the G1 lacks a drift-free heading estimate.

## Closing the shortcuts

The reward pays for tracking forward speed, staying upright and gliding on the planted blade, and penalizes sideways slip. Shaping sets the stepping rhythm and foot lift, so the swing-leg style isn't emergent.

Penalizing slip only during contact pays the robot to hop, so my penalty applies within a few centimeters of the ice. Before I paid for gliding, the policy vaulted over each planted blade, walking on skates. An ablation without that reward brought the walking back with the lowest sideways slip of any version, so I read glide and slip together. One policy looked fine in training metrics but jogged when rendered, so I also judge the gait itself.

## Results in simulation

Means of 12 runs per speed: three seeds, each evaluated deterministically on four randomized ice conditions.

| What I measured                         | Result              |
| --------------------------------------- | ------------------- |
| Speed error at 0.6 and 0.9 m/s commands | 0.11 and 0.16 m/s   |
| Sideways blade slip                     | 3 to 4 cm/s         |
| Glide ratio at 0.3, 0.6 and 0.9 m/s     | 0.89, 0.70 and 0.57 |

Glide ratio is the planted blade's along-blade speed over forward body speed (near 0 when walking). At 0.3 m/s, 3 of the 12 runs stalled, too few to tell whether slow commands stall more often.

One policy tracked 0.9 m/s to within 0.09 m/s, on one blade 94 percent of the time with 2 to 4 cm/s sideways slip. The three-seed means are the better guide, and 94 percent exceeds a real skater, who briefly stands on both blades to shift weight. Past about 30 degrees of blade turn, the approximate friction over-grips, giving push real ice wouldn't, and some policies exploited that.

## Where it stands

I've ported the project to Isaac Lab 3.0 with the MuJoCo Warp solver, so the blade contact carries over. There, friction follows the blade at any heading, removing the 30-degree limit. The main recipe rewards following a reference gait from an earlier policy I'd shaped toward a human-like stroke, so it's no longer trained from task rewards alone. Turning and hockey-stop fine-tuning has no results yet. A real G1 is next; push recovery at speed remains open.
