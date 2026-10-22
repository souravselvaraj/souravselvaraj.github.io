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
    Gazebo screen recording of the full sequence: a minimum-jerk climb to (2, 2, 2) m, the roll flip, recovery and hold. The vehicle is small in this wide view.
</div>

Most quadrotor controllers are designed around hover, with the vehicle close to level, and a flip takes it fully upside down. For my Robot Control course (RBE 502) at WPI in Fall 2025, I wrote a controller that flies a simulated Crazyflie through a full roll flip in place and back to hover, then added an adaptive layer that cancels most of the torque its model does not account for. Everything here runs in simulation, in ROS 2 and Gazebo.

## Why a flip is hard

Many flight controllers describe orientation with roll, pitch and yaw angles, which become singular at 90° of pitch, so a pitch-axis flip runs straight through a singularity. A roll flip like mine hits the angle wrap instead, where roll jumps from +180° to -180° (visible in the attitude plot below), so an error computed by subtracting angles can jump mid-maneuver.

Geometric control works with the rotation itself, stored as a 3×3 rotation matrix, so it has no such singularities. I followed the SE(3) tracking controller of Lee, Leok and McClamroch (2010): the position error sets a desired force vector, its direction sets where the thrust should point, and the attitude loop turns the body to match, whether the vehicle is level or upside down. The textbook attitude error fades toward zero near 180° from the target, so a very large error would produce almost no restoring torque. I compute it instead from the quaternion of the relative rotation, which stays non-zero there.

## Flying the flip

The run has four phases, each a mode in the controller. The vehicle climbs along a minimum-jerk trajectory to a hover at (2, 2, 2) m. Once the climb ends and the tracking errors are small, it is commanded to roll 360° about its own x-axis in 0.2 s while the position reference stays fixed, so the flip has zero radius. A recovery mode then levels it and restores its height. When roll and pitch are within 5°, body rates are under 0.5 rad/s and height is within 5 cm, a hold mode keeps it hovering in place. In the plotted run below, the vehicle lagged the commanded roll and finished the rotation early in recovery.

The controller is a single 200 Hz C++ node written for ROS 2 Humble and Gazebo Harmonic. It reads odometry at 100 Hz and IMU angular rates at 500 Hz, computes a thrust and three body torques, and converts them into four rotor-speed commands within saturation limits. The simulated vehicle weighs about 28 g, and its model builds on the Crazyflie description package and meshes from Bitcraze's [crazyflie-simulation](https://github.com/bitcraze/crazyflie-simulation) repository; I changed the package to take direct rotor-speed commands and to publish IMU and odometry data.

## Adding L1 adaptation

The geometric controller assumes its vehicle model is right, so modeling errors and outside pushes show up as torques it did not plan for. Building on Wu et al.'s L1 augmentation of geometric quadrotor control, I added a layer that estimates that torque and subtracts it.

On all three rotation axes, the layer predicts how fast the body should be rotating given the commanded torques. When the vehicle rotates differently, the difference is attributed to an unknown torque and the estimate updates quickly. Only a low-pass filtered version (10 rad/s cutoff) reaches the torque command, so the estimate adapts fast while the correction stays slow enough not to excite the vehicle's fast dynamics. That split is the main idea of L1 control. I bounded the estimate (3.0 mN·m on roll and pitch, 1.5 mN·m on yaw) and paused adaptation when attitude and body-rate errors were below 1.5° and 5 deg/s, so it would not chatter. It runs during the climb, recovery and hold, and I switched it off for the 0.2 s flip itself.

## Results

The plots come from a run logged on 18 December 2025, after I wrote the course report, and the table comes from the report's earlier run. Some settings changed in between, such as the climb time (7 s in the report's run, 10 s in the plotted one), and the report describes its run in Ignition Gazebo, while the published code targets Gazebo Harmonic.

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_position_tracking.png" title="Position tracking" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_attitude_response.png" title="Attitude response" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Left: x, y and z position against the reference through the track, flip, recover and hold phases (shaded). The dip in z is height lost during the flip and recovery. Right: roll, pitch and yaw over the same run. The roll trace jumps between +180° and -180° as the vehicle passes upside down, and the actual roll finishes its rotation just after the flip phase ends.
</div>

To test the L1 layer, I injected a step torque on all three axes from 2.0 to 2.8 s into the climb. The disturbance is matched: it enters through the same torque channels the controller uses, so in principle it can be cancelled completely. I scored each axis as one minus the average size of the leftover torque (injected plus adaptive) over the average size of the injected torque in that window, so 100% means exact cancellation.

<div class="row justify-content-center">
    <div class="col-sm-7 mt-3 mb-3">
        {% include figure.liquid loading="lazy" path="assets/img/projects/crazyflie_l1_disturbance.png" title="L1 disturbance rejection" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Commanded rotor speeds (top), L1 adaptive torque on each axis (middle) and the injected step torque (bottom): 1.0 mN·m on roll, -1.5 mN·m on pitch and 0.8 mN·m on yaw, active from 2.0 to 2.8 s. Roll and pitch adaptive torques swing opposite to the injected torque within a fraction of a second, overshooting it by roughly a quarter to a third. Yaw responds more slowly and only reaches an equal and opposite value near the end of the window. L1 is off during the flip; the larger swings after 10 s are in the recovery phase, as it reacts to the errors the flip leaves.
</div>

| Measure (logged run analyzed in the course report) | Result                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| Position RMSE, x and y                             | 2.2 cm each                                             |
| Position RMSE, z                                   | 7.0 cm                                                  |
| Roll-rate error, RMSE / MAE                        | 152 / 27 deg/s                                          |
| L1 torque cancellation, roll / pitch / yaw         | 94% / 86% / 71%                                         |
| Flip                                               | 360° roll commanded over 0.2 s, then recovered to hover |

The tracking errors cover the whole run, flip included. Height is worse than x and y: the vehicle loses altitude in the flip and climbs back during recovery, and in both runs it also sits several centimetres above the height reference during the climb. The roll-rate RMSE of 152 deg/s comes mostly from the flip, where the commanded roll rate peaks near 2,800 deg/s. The much smaller mean absolute error of 27 deg/s says most of the run is tracked closely.

Yaw cancellation was the lowest of the three. I had tuned yaw more conservatively, with lower attitude gains and the tighter bound, to avoid fighting the motor allocation limits and rotor reaction torques. That bound is still about twice the injected yaw torque, so it does not explain the gap by itself. The score measures how closely the adaptive torque matched the injected one, which is separate from how much tracking improved. With L1 off, the same disturbance produced larger attitude and body-rate errors, but I have not put a number on that comparison.

## Limits and status

These numbers come from one simulated run with a software-injected disturbance. A matched step torque is a favorable case for L1, since it enters exactly where the controller acts, and a real vehicle would add disturbances that are neither matched nor steps. In the plotted flip, the rotor commands hit my controller's cap of six times hover thrust, but Gazebo's motor model limits rotor speed to 2,618 rad/s, about 1.27 times hover thrust, so the simulated rotors delivered far less than commanded. My proposal also planned front and back flips and a cascaded PID baseline; the final report covers only the roll flip, and its one baseline is the same controller without L1, described qualitatively. I have not flown this controller on hardware, although the proposal framed the project as groundwork for real flight tests.

Code: [github.com/souravselvaraj/crazyflie-se3-l1](https://github.com/souravselvaraj/crazyflie-se3-l1)
