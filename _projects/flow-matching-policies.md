---
layout: page
title: Flow Matching Policies
description: Conditional Flow Matching policy for robomimic. Success comparable to Diffusion Policy on five simulated tasks, about 11× faster than its 100-step DDPM sampler.
img: assets/img/projects/cfm_thumb.jpg
importance: 5
category: projects
---

<div class="row justify-content-center">
    <div class="col-sm-8 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_transport_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Flow matching on robomimic's two-arm Transport task, in simulation.
</div>

People don't all demonstrate a task the same way. One reaches around an obstacle on the left, another on the right, and a policy that averages the two drives straight into it. Diffusion Policy handles this by sampling from a learned distribution over action chunks (short sequences of future actions), but each chunk starts as noise and takes 100 denoising steps, one network pass each. I wanted that flexibility with far fewer steps, so I replaced the denoising loop with Conditional Flow Matching (CFM).

## The idea

In flow matching, the network learns a velocity: from any point between noise and an action chunk, which way to move and how fast. Training is plain regression onto the velocity of a straight line from a noise sample to a demonstrated chunk. Every target is straight, so the learned paths tend to be nearly straight, and at run time a few long Euler steps from fresh noise can cover them. They aren't perfectly straight, because many noise and action pairs cross and the network learns their average.

## Setup

I wrote CFM as a new algorithm in [my fork](https://github.com/souravselvaraj/robomimic/tree/flow-matching) of [robomimic](https://github.com/ARISE-Initiative/robomimic), a benchmark for learning from human demonstrations, ran the benchmark there, and later copied the algorithm file into a separate package. Both policies share the observation encoder, a 65M-parameter conditional U-Net and the receding-horizon loop. Only the training objective and the sampler differ, so the comparison isolates the generative model.

I used robomimic's five proficient-human tasks in simulation, from low-dimensional state (no cameras), with the same training budget and three seeds per method (30 runs). Every 100 epochs a run was evaluated with 20 rollouts, so success moves in steps of 5%, and for both methods I report the best of those ten evaluations, which is optimistic.

## Results

| Task      | Flow Matching  | Diffusion Policy | BC-RNN (ref) |
| --------- | :------------: | :--------------: | :----------: |
| Lift      |  100.0 ± 0.0   |   100.0 ± 0.0    |     ~100     |
| Can       |  100.0 ± 0.0   |   100.0 ± 0.0    |     ~100     |
| Square    | **56.7 ± 8.5** |    45.0 ± 7.1    |     ~84      |
| Tool Hang |   75.0 ± 7.1   |  **80.0 ± 7.1**  |     ~67      |
| Transport |   81.7 ± 2.4   |  **86.7 ± 8.5**  |     ~71      |

Success rate in %, mean ± std over 3 seeds, in simulation. Flow matching uses 10 Euler steps (the only setting whose success I report), Diffusion Policy 100 DDPM steps. BC-RNN values are approximate robomimic references, not rerun under this protocol.

Flow matching leads on Square by 11.7 points and trails on Tool Hang and Transport by 5 each, but with three seeds none of these gaps is statistically reliable: 5 points in the mean is, on average, one rollout in 20 per seed. So I read this as comparable success.

For speed, I timed one chunk from a single observation on the same U-Net and an RTX PRO 6000 GPU over 100 trials, using random weights since only the number of network passes matters.

| Sampler                           | Network passes | ms per chunk | Speedup vs. DDPM-100 |
| --------------------------------- | :------------: | :----------: | :------------------: |
| Flow Matching, Euler 1            |       1        |     3.11     |        94.4×         |
| Flow Matching, Euler 5            |       5        |    13.44     |        21.9×         |
| Flow Matching, Euler 10 (default) |       10       |  **26.68**   |      **11.0×**       |
| Flow Matching, midpoint 5         |       10       |    26.92     |        10.9×         |
| Diffusion Policy, DDIM 10         |       10       |    28.91     |        10.2×         |
| Diffusion Policy, DDPM 100        |      100       |    293.72    |   1.0× (baseline)    |

Latency grows almost linearly with passes, roughly 2.7 to 3.1 ms each, so the speedup comes almost entirely from needing fewer of them. The 11× is against DDPM-100, the sampler behind Diffusion Policy's success numbers. DDIM-10 costs about the same as Euler 10, but I have no success numbers for it or for one Euler step, so I can't compare success at those budgets.

## Rollouts and follow-ups

<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_lift_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_can_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="row justify-content-center">
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_square_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
    <div class="col-sm-6 mt-3 mb-3">
        {% include video.liquid path="assets/video/projects/fm_toolhang_rollout.mp4" class="img-fluid rounded z-depth-1" width="100%" controls=true muted=true %}
    </div>
</div>
<div class="caption">
    Flow matching rollouts in simulation: Lift, Can, Square and Tool Hang. The Lift and Tool Hang clips come from single-run models trained before the three-seed benchmark.
</div>

Later I added a transformer backbone and camera images, three seeds per setting; image runs used only 10 rollouts per evaluation, so I treat them as directional. Two camera views gave 93 ± 6% on Square, while Tool Hang from images reached 10 ± 10% against the U-Net's 75% from state, a comparison that changes both backbone and inputs.

The code is public (MIT license), with configs for all 30 benchmark runs.

Code and full benchmark details: [Robomimic-Flowmatching](https://github.com/souravselvaraj/Robomimic-Flowmatching) · [benchmark table](https://github.com/souravselvaraj/Robomimic-Flowmatching/blob/master/README.md)
