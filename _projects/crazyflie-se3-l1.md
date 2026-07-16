---
layout: page
title: Acrobatic Quadrotor Flight
description: SE(3) geometric control with L1 adaptive augmentation on a Crazyflie 2.1 — zero-radius flips, recovery, and 94% disturbance rejection in ROS 2 simulation.
img: assets/img/projects/crazyflie_thumb.jpg
importance: 6
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-9 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/crazyflie_demo.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Minimum-jerk trajectory, zero-radius flip, recovery, and hold — flown by the SE(3) + L1 controller in Gazebo Harmonic.
</div>

An **SE(3) geometric controller with L1 adaptive augmentation** for the Crazyflie 2.1 micro quadrotor, implemented as a ROS 2 + Gazebo Harmonic simulation stack with a full ROS–Gazebo bridge (odometry, IMU, pose, and motor-command topics).

## Why geometric control

Euler-angle attitude controllers hit singularities exactly where acrobatics live — near ±90° pitch. The SE(3) controller works **directly on the rotation manifold**: attitude error is computed from rotation matrices, so a zero-radius flip is just another trajectory rather than a special case. Thrust and moments are computed from geometric position/velocity/attitude errors, with mode switching across hover, minimum-jerk trajectory tracking, flip, and recovery.

## Why L1 augmentation

Geometric control assumes the model is right. Real vehicles (and imperfect simulators) have unmodeled drag, thrust mismatch, and external pushes. The **L1 adaptive loop** estimates the matched disturbance at high rate through a state predictor, and cancels it through a low-pass filter — keeping the adaptation aggressive without exciting high-frequency dynamics. The controller stays a geometric controller; L1 just makes its model assumption true.

## Results

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_position_tracking.png" title="Position tracking" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_attitude_response.png" title="Attitude response" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Left: position tracking across trajectory, flip, recovery, and hold modes. Right: attitude response through the flip.
</div>

<div class="row justify-content-center">
    <div class="col-sm-7 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_l1_disturbance.png" title="L1 disturbance rejection" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The L1 loop absorbing force-step disturbances at the motor-command level.
</div>

| Metric                        | Result       |
| ----------------------------- | ------------ |
| Position-tracking RMSE        | **2.2 cm**   |
| Force-step disturbance rejection | up to **94%** |
| Maneuvers                     | hover, minimum-jerk tracking, zero-radius flip, recovery |

Code: [github.com/souravselvaraj/crazyflie-se3-l1](https://github.com/souravselvaraj/crazyflie-se3-l1)
