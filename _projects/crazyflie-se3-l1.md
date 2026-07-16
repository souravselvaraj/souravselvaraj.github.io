---
layout: page
title: Acrobatic Quadrotor Flight
description: SE(3) geometric control with L1 adaptive augmentation on a Crazyflie 2.1 — hover, zero-radius flips, and disturbance rejection in ROS 2 simulation.
img: assets/img/projects/crazyflie_demo.gif
importance: 6
category: projects
---

An **SE(3) geometric controller with L1 adaptive augmentation** for the Crazyflie 2.1 micro quadrotor, implemented in a ROS 2 + Gazebo Harmonic simulation stack. The geometric controller provides globally-defined attitude control on the rotation manifold (no Euler-angle singularities), enabling aggressive maneuvers; the L1 augmentation estimates and cancels matched disturbances at high rate.

<div class="row justify-content-center">
    <div class="col-sm-8 mt-3 mb-3">
        {% include figure.liquid loading="eager" path="assets/img/projects/crazyflie_demo.gif" title="Crazyflie flip and recovery" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Minimum-jerk trajectory, zero-radius flip, recovery, and hold — flown by the SE(3) + L1 controller in simulation.
</div>

## Flight modes and results

- Hover, minimum-jerk trajectory tracking, **zero-radius flip**, and recovery.
- **2.2 cm position-tracking RMSE** across the trajectory/flip/recovery/hold sequence.
- Rejects up to **94% of force-step disturbances** with the L1 adaptive loop.

<div class="row justify-content-center">
    <div class="col-sm-8 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_position_tracking.png" title="Position tracking" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Position tracking across trajectory, flip, recovery, and hold modes.
</div>

Code: [github.com/souravselvaraj/crazyflie-se3-l1](https://github.com/souravselvaraj/crazyflie-se3-l1)
