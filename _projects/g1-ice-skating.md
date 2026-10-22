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
    A skating policy from my newer Isaac Lab version, trained toward a human-like stroke, replayed in MuJoCo and path-traced in Blender Cycles. The numbers on this page come from the earlier mjlab policies, which were not shaped toward a human stroke.
</div>

When a person walks, a planted foot is supposed to stay put. On skates, the planted foot keeps moving, and that motion carries the skater forward. I wanted to know whether a humanoid could learn to use a contact that is meant to slide.

I train the 23-DoF Unitree G1 model to skate on thin passive blades with two edges, like a hollow-ground skate blade. The results below come from policies trained with reinforcement learning (PPO) in mjlab, which runs MuJoCo physics on the GPU, with no motion capture, human reference motion or imitation reward. Everything so far is in simulation.

## How a blade works

A skate blade cares about direction. Pushed along its length, it glides. Pushed sideways, its edge bites into the ice. A skater moves forward by angling one blade outward and pushing against that grip while gliding on the other.

MuJoCo's standard friction is the same in every direction, which would make a blade as slippery sideways as forward. I made friction low along each blade and high across it, and I rotate the grippy direction with the blade, approximately, so an angled blade has something to push against. Along the blade, friction falls with sliding speed and shifts with a randomized ice temperature. Each blade is a flat 20 cm strip with edges about 12 mm apart, more forgiving than a hockey or figure blade, which is 3 to 4 mm wide and curved along its length. The blades are passive, so balance comes from the legs and body, and sideways balance is still the hard part.

## What the robot is rewarded for

The reward asks the robot to track a commanded forward speed and stay upright. The planted blade earns reward for gliding along its length at the commanded speed, and a blade near the ice is penalized for slipping sideways. Extra shaping sets a stepping rhythm and asks the free foot to lift clear of the ice. That shaping affects how the gait looks, so I do not count the swing-leg style as emergent.

Several terms close shortcuts. A slip penalty that counts only while a blade touches the ice pays the robot to hop, so mine applies whenever a blade is within a few centimeters of the ice. Before I paid the planted blade for gliding, the policy planted each blade and vaulted over it, walking on skates. Removing that reward in an ablation brought the walking back, with the lowest sideways slip of any version I compared, so I read glide and slip together. One early policy looked fine in training metrics while rendered frames showed it jogging, so I judge policies on a deterministic evaluation and the rendered gait.

## Built with the real robot in mind

During training, a critic network sees each blade's velocity, which the real G1 cannot measure, while the policy sees only on-board signals such as joint and IMU readings over a short history. I randomize PD gains, link inertia, payload, actuator delay and blade mounting so the policy cannot rely on one exact robot. Commands are forward speed only, since the real G1 has no drift-free heading estimate, and the commanded range widens in stages from 0.15 to 1.2 m/s.

As a first check outside training, I ran one exported policy in standard CPU MuJoCo through a separately written deployment loop. On nominal ice with randomization off, it skated at every speed I tested, with single-support time and stride rate close to those in the GPU simulator.

## Results so far

These numbers use the main contact model and reward. I trained three policies with different random seeds and evaluated each one deterministically on four randomized ice conditions per commanded speed, 12 runs per speed. The table shows means.

| What I measured                         | Result              |
| --------------------------------------- | ------------------- |
| Speed error at 0.6 and 0.9 m/s commands | 0.11 and 0.16 m/s   |
| Sideways blade slip                     | 3 to 4 cm/s         |
| Glide ratio at 0.3, 0.6 and 0.9 m/s     | 0.89, 0.70 and 0.57 |

The glide ratio is the planted blade's speed along its length divided by the body's forward speed: near 1 when the blade travels with the body, near 0 when the foot is planted as in walking. At 0.3 m/s, 3 of the 12 runs stalled, too few to tell whether slow commands stall more often than fast ones.

One policy I evaluated tracked a 0.9 m/s command to within 0.09 m/s, with 94 percent of its time on a single blade and 2 to 4 cm/s of sideways slip. The three-seed means are the better guide, and 94 percent is more time on one blade than a human skater spends, since a skater briefly stands on both blades while shifting weight. My early policies did so only 1 to 2 percent of the time, well under the roughly 10 percent the stepping rhythm in the reward allows, because the reward pays for single support and for holding the free foot up.

These policies only skate straight ahead. Their friction direction is approximate, and once a blade turns more than about 30 degrees from straight ahead the model over-grips, giving push that real ice would not. Some policies learned to exploit that.

## Where the project stands

I started the project in July 2026. By late September I had ported it to Isaac Lab 3.0 with the MuJoCo Warp solver, so the blade contact carries over. The new blades are rockered like real ones, and their friction directions follow the blade at any heading, which removes the 30-degree limit. The main recipe there rewards following a reference gait recorded from an earlier policy of mine that I had shaped toward a human-like stroke, so it is no longer trained from task rewards alone. I have started fine-tuning it for turning on command and for a hockey stop, with no results to report yet. Moving a policy onto a real G1 is the next milestone, and push recovery at speed is still open.
