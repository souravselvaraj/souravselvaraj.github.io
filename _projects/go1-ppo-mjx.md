---
layout: page
title: Go1 PPO Locomotion
description: PPO locomotion for the Unitree Go1 in JAX/MuJoCo MJX — asymmetric actor-critic, domain randomization, and real-robot deployment.
img: assets/img/projects/go1_locomotion.jpg
importance: 7
category: projects
---

End-to-end **PPO locomotion training for the Unitree Go1** quadruped using JAX, Brax PPO, and MuJoCo MJX, with keyboard teleoperation of trained policies and deployment on the real robot.

<div class="row justify-content-center">
    <div class="col-sm-10 mt-3 mb-3">
        <img src="https://raw.githubusercontent.com/souravselvaraj/unitree-go1-ppo-mjx/main/docs/media/go1_locomotion_demo.gif" alt="Real-world Go1 locomotion demo" class="img-fluid rounded z-depth-1" />
    </div>
</div>
<div class="caption">
    Real-world Go1 walking with the trained policy.
</div>

## Highlights

- **JAX/MJX vectorized training** with `jax.vmap` for high-throughput simulation; Flax networks and Orbax checkpoints.
- **Asymmetric actor–critic**: onboard-realistic policy observations plus privileged critic state.
- **Domain randomization** over friction, inertia, center of mass, and mass for sim-to-real transfer.
- **Gait shaping** with foot clearance, slip, air-time, and energy penalties.
- Flat (`Go1JoystickFlatTerrain`) and rough-terrain (`Go1JoystickRoughTerrain`) environments with vendored MJCF/heightfield assets.

Related: a [ROS 2 Humble + Ignition Gazebo simulation stack](https://github.com/souravselvaraj/Unitree_Go1_Sim) for the Go1.

Code: [github.com/souravselvaraj/unitree-go1-ppo-mjx](https://github.com/souravselvaraj/unitree-go1-ppo-mjx)
