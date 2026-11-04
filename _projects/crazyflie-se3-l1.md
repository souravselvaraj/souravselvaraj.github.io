---
layout: page
title: Acrobatic Quadrotor Flight
description: "Geometric SE(3) control with an L1 adaptive layer for a simulated Crazyflie: a zero-radius roll flip, recovery to hover, and step-torque rejection in ROS 2 and Gazebo."
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
    Gazebo recording of the climb, roll flip, recovery and hold. The vehicle is small in this wide view.
</div>

For my Robot Control course (RBE 502) at WPI in Fall 2025, I wrote a controller that flies a simulated Crazyflie through a roll flip in place and back to hover, then added an adaptive layer for the torque its model misses. Everything ran in ROS 2 and Gazebo.

## Why a flip is hard

Many flight controllers describe orientation with roll, pitch and yaw angles, which become singular at 90° of pitch. A roll flip hits the wrap from +180° to -180° instead, where an angle-difference error can jump. The geometric SE(3) controller of Lee, Leok and McClamroch (2010) uses the rotation matrix and has neither problem, but its textbook attitude error fades toward zero near 180° from the target, so a very large error would get almost no restoring torque. I compute the error from the quaternion of the relative rotation, which stays non-zero there.

## The flip and the L1 layer

The flight has four phases, each a controller mode: a minimum-jerk climb to hover at (2, 2, 2) m, a 360° roll in 0.2 s with the position reference fixed (a zero-radius flip), recovery, and hold. The vehicle model (about 28 g) builds on the Crazyflie description package and meshes from Bitcraze's [crazyflie-simulation](https://github.com/bitcraze/crazyflie-simulation) repository; I changed the package to take rotor-speed commands and publish IMU and odometry.

Building on Wu et al.'s L1 augmentation of geometric quadrotor control, I added a layer that predicts the body's rotation rate from the commanded torques and treats any mismatch as an unknown torque. The estimate updates fast, but only a low-pass filtered version (10 rad/s cutoff) reaches the torque command, so the correction stays slow enough not to excite the vehicle's fast dynamics. It's off during the flip.

## Results and limits

The plots come from a run logged on 18 December 2025, after the course report; the table comes from the report's earlier run. Some settings changed in between, such as the climb time (7 s, then 10 s).

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_position_tracking.png" title="Position tracking" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_attitude_response.png" title="Attitude response" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Position against its reference (left) and attitude (right) with the track, flip, recover and hold phases shaded. The z dip is height lost in the flip and recovery; roll jumps between +180° and -180° upside down and finishes rotating just after the flip phase.
</div>

To test L1, I injected a step torque on all three axes from 2.0 to 2.8 s into the climb. I scored each axis as one minus the average size of the leftover torque (injected plus adaptive) over that of the injected torque in that window, so 100% means exact cancellation.

<div class="row justify-content-center">
    <div class="col-sm-7 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_l1_disturbance.png" title="L1 disturbance rejection" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Rotor-speed commands (top), L1 torque (middle) and injected torque (bottom: 1.0, -1.5 and 0.8 mN·m on roll, pitch and yaw). Roll and pitch oppose it within a fraction of a second, overshooting by roughly a quarter to a third; yaw reaches equal and opposite only near the window's end. Larger swings after 10 s come during recovery.
</div>

| Measure (logged run analyzed in the course report) | Result                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| Position RMSE, x and y                             | 2.2 cm each                                             |
| Position RMSE, z                                   | 7.0 cm                                                  |
| Roll-rate error, RMSE / MAE                        | 152 / 27 deg/s                                          |
| L1 torque cancellation, roll / pitch / yaw         | 94% / 86% / 71%                                         |
| Flip                                               | 360° roll commanded over 0.2 s, then recovered to hover |

The tracking errors cover the whole run, and the flip accounts for most of the 152 deg/s roll-rate RMSE (the commanded roll rate peaks near 2,800 deg/s there). Yaw cancelled least. I'd tuned yaw more conservatively, with a tighter bound on its L1 estimate (1.5 mN·m, against 3.0 on roll and pitch), to avoid fighting the motor allocation limits and rotor reaction torques, but that bound is still about twice the injected yaw torque, so it doesn't explain the gap alone.

These numbers come from one simulated run, and a matched step torque, entering through the controller's own torque channels, is a favorable case for L1; a real vehicle would add disturbances that are neither matched nor steps. The score measures how well the adaptive torque matched the injected one, not how much tracking improved. In the plotted flip, rotor commands hit my controller's cap of six times hover thrust, but Gazebo's motor model limits rotor speed to 2,618 rad/s, about 1.27 times hover thrust, so the rotors delivered far less than commanded. My proposal also planned front and back flips and a cascaded PID baseline; the report covers only the roll flip, and compares against one baseline, the same controller without L1, only qualitatively: errors were larger, but I haven't put a number on that. I haven't flown it on hardware.

Code: [github.com/souravselvaraj/crazyflie-se3-l1](https://github.com/souravselvaraj/crazyflie-se3-l1)
