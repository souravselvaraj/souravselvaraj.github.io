---
layout: about
title: about
permalink: /
description: M.S. Robotics Engineering student at WPI studying how legged robots choose where to touch and how hard to push. Applying to PhD programs for Fall 2027.
subtitle: 'M.S. Robotics Engineering, <a href="https://www.wpi.edu/">Worcester Polytechnic Institute</a>.'

profile:
  align: right
  image: prof_pic.jpg
  image_circular: false
  more_info: >
    <p><a href="https://www.wpi.edu/">Worcester Polytechnic Institute</a></p>
    <p>Robotics Engineering</p>
    <p>Worcester, MA, USA</p>

selected_papers: false # includes a list of papers marked as "selected={true}"
social: true

announcements:
  enabled: true # includes a list of news items
  scrollable: false # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder
---

I study how legged robots choose where to touch the world and how hard to push. I am an M.S. student in Robotics Engineering at [Worcester Polytechnic Institute](https://www.wpi.edu/) (expected May 2027), advised by Dr. Mahdi Agheli in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih). My interests are legged robotics, whole-body control and robot learning.

**I am applying to PhD programs for Fall 2027.**

I lead [SCRUB]({{ '/projects/scrub/' | relative_url }}). Our armless Unitree Go1 presses a trunk-mounted tool against an unmapped surface and slides it along, working out which way the surface faces from the contact itself. My first version assumed the tool only ever moved along the surface, and the robot fell while sliding the tool around a column, because each footstep pushed the tool in and out along the direction SCRUB was estimating. Averaging the tool's motion over each gait cycle fixed that. SCRUB then completed all five hardware trials on a flat wall and all five around the column. It has been submitted to IEEE RA-L.

With Owen Sullivan, whose master's thesis started the project, I am co-first author of [GaitNet]({{ '/projects/gaitnet/' | relative_url }}), a reinforcement learning planner that picks a quadruped's steps one at a time, with no fixed gait. I built the part that compares candidate footholds. I also built a small model, fitted to each controller's own steps, that turns the foothold the planner wants into the command that lands the foot there. With only that model refit, the frozen planner ran on a different model-based controller. In simulation, where holes covered 40 to 70% of the ground, it succeeded in 70% of runs (225 of 320) against 38% for that controller's own trot. GaitNet is to be submitted to L4DC 2027.

I have trained a simulated Unitree G1 humanoid to [ice-skate]({{ '/projects/g1-ice-skating/' | relative_url }}), and I worked on a [bimanual lifting project]({{ '/projects/g1-bimanual-lifting/' | relative_url }}) in which a policy lifted a box on the real G1. My [flow matching policy]({{ '/projects/flow-matching-policies/' | relative_url }}) for simulated manipulation has success comparable to Diffusion Policy's over three seeds. It samples each action chunk in 10 steps instead of the 100 I used for Diffusion Policy, which makes it about 11 times faster at inference.

Neither SCRUB nor GaitNet lets the robot choose a contact that holds a push. In a PhD, I want legged robots to choose which part of the body takes a load and control how hard it pushes there, using model-based control and learning together.

I did my B.Tech in Instrumentation and Control Engineering at [NIT Trichy](https://www.nitt.edu/). My [CV]({{ '/cv/' | relative_url }}) has the details, and some of my photographs are on my [photography]({{ '/photography/' | relative_url }}) page.
