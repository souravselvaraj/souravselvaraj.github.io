---
layout: page
title: Go1 PPO Locomotion
description: PPO locomotion for the Unitree Go1 in JAX/MuJoCo MJX — asymmetric actor-critic, domain randomization, rough terrain, and real-robot deployment.
img: assets/img/projects/go1_locomotion.jpg
importance: 7
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-10 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/go1_locomotion.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    The trained policy deployed on the real Go1.
</div>

End-to-end **PPO locomotion training for the Unitree Go1** quadruped using JAX, Brax PPO, and MuJoCo MJX — from vectorized simulation through keyboard-teleoperated deployment on the real robot.

## Training at JAX speed

The entire environment lives inside MJX, so simulation, reward computation, and PPO updates all run on-accelerator with `jax.vmap` across thousands of parallel environments — no CPU–GPU round trips. Flax networks, Orbax checkpointing.

- **Action space**: joint-position offsets (±0.5 rad) around a nominal standing pose at a 50 Hz control rate (0.02 s control step over 0.004 s physics substeps) — the policy shapes posture rather than fighting for raw torques.
- **Observations**: onboard-realistic policy inputs (IMU gyro, gravity vector in body frame, joint states, previous action, velocity command) with a **privileged critic** that additionally sees ground-truth velocities and contact state — asymmetric actor–critic for cleaner value estimates without cheating at deployment.
- **Feet-only contact modeling** keeps the contact problem small and prevents spurious self-collisions from corrupting training.

## Sim-to-real ingredients

- **Domain randomization** over floor friction (μ ∈ [0.4, 1.0]), link inertia, center of mass, and mass.
- **Gait shaping** rewards: foot clearance to a 10 cm swing target, slip and energy penalties, air-time terms — no reference trajectories.
- **Rough-terrain variant** (`Go1JoystickRoughTerrain`): a procedurally generated heightfield (5 cm max feature height) with expanded contact-solver limits; the reward is identical to flat terrain, so robustness comes from the terrain distribution and randomization, not hand-tuned shaping.

## Deployment

Trained policies run through a keyboard teleoperation interface for velocity commands — the video above is the real robot walking with the learned policy. A companion [ROS 2 Humble + Ignition Gazebo simulation stack](https://github.com/souravselvaraj/Unitree_Go1_Sim) supports the same robot.

Code: [github.com/souravselvaraj/unitree-go1-ppo-mjx](https://github.com/souravselvaraj/unitree-go1-ppo-mjx)
