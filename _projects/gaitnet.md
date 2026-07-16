---
layout: page
title: GaitNet
description: Learning-based acyclic footstep planning for dynamic quadruped locomotion over irregular terrain — foothold cost maps + RL gait selection + perceptive MPC.
importance: 2
category: research
related_publications: false
---

**GaitNet** is a hybrid learning–control footstep planner for acyclic Unitree Go1 locomotion over irregular terrain, co-developed with Owen Sullivan in the ALMaS Research Group at WPI (advisor: Dr. Mahdi Agheli). Instead of committing to a fixed gait cycle, the planner chooses *which* leg to move, *where* to place it, and *how long* the swing should take, based on the terrain ahead.

## What I built

- **Simulation deployment stack**: ROS integration of the planner with OCS2 perceptive MPC (foot-placement and collision constraints) and GPU elevation mapping from onboard depth sensing.
- **Terrain-aware footstep candidate generation** using robot state, commanded velocity, and raycast heightmaps — enabling real-time filtering and ranking of feasible leg-selection, foot-displacement, and swing-duration actions.

## How it works

The planner combines leg-specific foothold cost-map prediction with reinforcement-learning-based gait selection on top of model-based quadruped control: the network proposes footholds and gait decisions, and the perceptive MPC executes them dynamically.

## Results

Evaluated in NVIDIA Isaac Lab across commanded velocities and missing-step terrain difficulties, GaitNet achieved **69.4% survival** (episodes completed without falling into terrain gaps) versus **25.6%** for a single-leg motion-planner baseline.

A manuscript on this work (O. Sullivan, S. Selvaraj, M. Agheli) is in preparation, targeting *IEEE ICRA*.
