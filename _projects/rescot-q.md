---
layout: page
title: ReSCoT-Q
description: Reference-guided surface-frame control for force-controlled tool sliding on a quadruped — MPC + whole-body control on Unitree Go1 hardware.
importance: 1
category: research
related_publications: false
---

**ReSCoT-Q** (Reference-Guided Surface-Frame Control for Quadruped Robots) is my primary graduate research project in the ALMaS Research Group at WPI, advised by Dr. Mahdi Agheli. The goal: enable a quadruped to interact with the physical world through *sustained contact* — pressing a body-mounted tool against an external surface and sliding it along a reference path while regulating contact force, all while the robot keeps balancing on four legs.

## Approach

- **Surface-frame MPC + weighted whole-body control** (OCS2 SQP, 100 Hz) on a Unitree Go1 with a body-mounted tool and force/torque sensor. Contact is resolved into three surface-frame objectives: normal-force regulation, tangential-slide tracking, and cross-track stabilization.
- **Confidence-gated surface estimation** fuses a nominal surface prior with online contact-wrench and tool-motion measurements, so the controller tolerates significant geometric error in the assumed surface model.
- **A contact-stability supervisor** gates sliding during contact acquisition, force recovery, and gait-induced contact dropouts.

## Hardware results

On a cylindrical test surface, the system demonstrated **109.9 s of sustained contact** spanning a **91.3° arc**, with **0.60 N normal-force RMS** and **18.8 mm tracking RMS error** at a 10 N contact-force target — despite a ~10% radius error in the surface prior.

A first-author manuscript on this work is in preparation, targeting *IEEE Robotics and Automation Letters (RA-L)*.
