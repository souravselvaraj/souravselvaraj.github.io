---
layout: page
title: Acrobatic Quadrotor Flight
description: "Geometric SE(3) control with an L1 adaptive layer for a simulated Crazyflie: a zero-radius roll flip, recovery to hover, and step-torque rejection."
img: assets/img/projects/crazyflie_thumb.jpg
importance: 7
category: projects
---

<div class="row justify-content-center">
    <div class="col-12 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/crazyflie_demo.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Gazebo recording of the climb, roll flip, recovery and hold.
</div>

For my Robot Control course (RBE 502) at WPI in Fall 2025, I wrote a controller in ROS 2 and Gazebo. It flies a simulated Crazyflie through a roll flip in place and back to hover.

In a roll flip, roll wraps from +180° to -180°, where an angle-difference error can jump. The geometric SE(3) controller of Lee, Leok and McClamroch (2010) avoids this. Its textbook attitude error gives almost no restoring torque near 180° from the target, while the quaternion-based error I use stays non-zero there.

Building on Wu et al., I added an L1 adaptive layer. It treats any gap between predicted and actual rotation rate as unknown torque. The estimate updates fast, but the correction is low-pass filtered. The layer is off during the flip.

The plots come from a later run than the table, with some settings changed.

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_position_tracking.png" title="Position tracking" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_attitude_response.png" title="Attitude response" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Position against its reference (left) and attitude (right). The z dip is height lost in the flip and recovery.
</div>

To test L1, I injected a step torque on all three axes from 2.0 to 2.8 s into the climb. The table's score measures how closely L1 matched that torque, where 100% is exact cancellation. It doesn't show how much tracking improved.

<div class="row justify-content-center">
    <div class="col-sm-7 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_l1_disturbance.png" title="L1 disturbance rejection" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Rotor-speed commands (top), L1 torque (middle) and injected torque (bottom). Roll and pitch L1 torques oppose it within a fraction of a second, then overshoot. Yaw reaches equal and opposite only near the window's end.
</div>

| Measure (logged run analyzed in the course report) | Result                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| Position RMSE, x and y                             | 2.2 cm each                                             |
| Position RMSE, z                                   | 7.0 cm                                                  |
| Roll-rate error, RMSE / MAE                        | 152 / 27 deg/s                                          |
| L1 torque cancellation, roll / pitch / yaw         | 94% / 86% / 71%                                         |
| Flip                                               | 360° roll commanded over 0.2 s, then recovered to hover |

These numbers come from one simulated run. A matched step torque is a favorable case for L1. In the plotted flip, the rotors delivered far less than commanded because of Gazebo's rotor speed limit. I haven't flown it on hardware.

The vehicle model builds on files from Bitcraze's [crazyflie-simulation](https://github.com/bitcraze/crazyflie-simulation) repository.

Code: [github.com/souravselvaraj/crazyflie-se3-l1](https://github.com/souravselvaraj/crazyflie-se3-l1)
