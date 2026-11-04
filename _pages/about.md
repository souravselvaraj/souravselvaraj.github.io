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

I study how legged robots choose where to touch the world and how hard to push. I'm an M.S. student in Robotics Engineering at [Worcester Polytechnic Institute](https://www.wpi.edu/) (expected May 2027), advised by Dr. Mahdi Agheli in the [ALMaS Research Group](https://www.wpi.edu/people/faculty/mmaghelih).

**I am applying to PhD programs for Fall 2027.**

My thesis began as a power tool mounted on a quadruped. The problem kept growing, so I cut it down to the smallest version I thought I could solve: keep a tool sliding along a surface while the robot walks. That became [SCRUB]({{ '/projects/scrub/' | relative_url }}), which I lead. My first estimator assumed the tool only moves along the surface, and our Go1 fell while circling a column, because every footstep pushes the tool in and out. Averaging over each gait cycle fixed it, and SCRUB completed all ten hardware trials on a wall and a column. It's submitted to IEEE RA-L.

In [GaitNet]({{ '/projects/gaitnet/' | relative_url }}), a learned planner picks each step and a model-based controller carries it out. A good foothold only helps if the foot actually lands there, so I fitted a small model of where each controller really puts the foot. That let the frozen planner move to a new controller, where it crossed simulated ground with 40 to 70% holes in 70% of runs (225 of 320), against 38% for the controller's own trot. I'm co-first author with Owen Sullivan, whose master's thesis started GaitNet, and it's to be submitted to L4DC 2027.

I've also taught a simulated Unitree G1 to [ice-skate]({{ '/projects/g1-ice-skating/' | relative_url }}), worked on [bimanual lifting]({{ '/projects/g1-bimanual-lifting/' | relative_url }}) that ran on the real G1, and built a [flow matching policy]({{ '/projects/flow-matching-policies/' | relative_url }}) with success comparable to Diffusion Policy's, sampling in 10 steps instead of the 100 I used for Diffusion Policy.

Neither SCRUB nor GaitNet lets the robot choose a contact that holds a push. When I carry a laundry basket up the stairs, I rest it on my hip to free a hand for the rail. In a PhD, I want legged robots to make that kind of choice, deciding which part of the body takes the load and how hard it pushes there, with model-based control and learning together. I like working out why a robot fails when its model says it shouldn't.

I did my B.Tech in Instrumentation and Control Engineering at [NIT Trichy](https://www.nitt.edu/). My [CV]({{ '/cv/' | relative_url }}) has the details, and my [photography]({{ '/photography/' | relative_url }}) page has some of my photographs.
