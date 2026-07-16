---
layout: page
title: Motion Planning Portfolio
description: Graduate motion-planning coursework — sampling-based, optimal, and kinodynamic planning with OMPL, plus PDDL + OMPL task-and-motion planning on a Franka Panda.
importance: 9
category: projects
---

A portfolio of my graduate motion-planning work (RBE 550 at WPI), progressing from OMPL fundamentals through planner design and benchmarking:

- **Configuration-space sampling**: naive polar vs. area-uniform sampling on a disk, as a custom OMPL sampler.
- **Collision checking and custom planning** for point and square robots, including a custom RTP planner.
- **Compound-state-space planning** for a chain-box robot through narrow passages — custom validity checking, PRM sampler comparisons, and clearance optimization.
- **Kinodynamic planning** for car and pendulum systems, benchmarking KPIECE, SST, EST/RRT, and AO-RRT-style planners.
- **Task-and-motion planning**: PDDL task planning combined with OMPL motion planning for block assembly on a Franka Panda.

All C++/OMPL, with per-project benchmarks, visualizations, and reports.

Code: [github.com/souravselvaraj/RBE550-Motion-Planning](https://github.com/souravselvaraj/RBE550-Motion-Planning)
