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

Some demonstrations go around an obstacle on the left, others on the right. A policy that averages them drives into it. Diffusion Policy handles this but uses 100 denoising steps per action chunk. I wanted that flexibility with far fewer steps, so I replaced the denoising loop with Conditional Flow Matching.

Flow matching learns the velocity along straight lines from noise to demonstrated chunks. The learned paths tend to be nearly straight, so a few Euler steps can follow them. They aren't perfectly straight, since many lines cross and the network averages them.

## Setup

I wrote the flow matching policy in [my fork](https://github.com/souravselvaraj/robomimic/tree/flow-matching) of [robomimic](https://github.com/ARISE-Initiative/robomimic). Both policies share the encoder, U-Net and training budget. Only the training objective and sampler differ.

I ran three seeds per method on five simulated robomimic tasks, from low-dimensional state. For both methods, I report the best of ten 20-rollout evaluations per run, which is optimistic.

## Results

| Task      | Flow Matching  | Diffusion Policy | BC-RNN (ref) |
| --------- | :------------: | :--------------: | :----------: |
| Lift      |  100.0 ± 0.0   |   100.0 ± 0.0    |     ~100     |
| Can       |  100.0 ± 0.0   |   100.0 ± 0.0    |     ~100     |
| Square    | **56.7 ± 8.5** |    45.0 ± 7.1    |     ~84      |
| Tool Hang |   75.0 ± 7.1   |  **80.0 ± 7.1**  |     ~67      |
| Transport |   81.7 ± 2.4   |  **86.7 ± 8.5**  |     ~71      |

Success rate in %, mean ± std over 3 seeds. Flow matching uses 10 Euler steps and Diffusion Policy 100 DDPM steps. BC-RNN values are approximate robomimic references, not rerun.

With three seeds, none of the gaps is statistically reliable, so I read success as comparable.

I timed one action chunk on an RTX PRO 6000 over 100 trials.

| Sampler                           | Network passes | ms per chunk | Speedup vs. DDPM-100 |
| --------------------------------- | :------------: | :----------: | :------------------: |
| Flow Matching, Euler 1            |       1        |     3.11     |        94.4×         |
| Flow Matching, Euler 5            |       5        |    13.44     |        21.9×         |
| Flow Matching, Euler 10 (default) |       10       |  **26.68**   |      **11.0×**       |
| Flow Matching, midpoint 5         |       10       |    26.92     |        10.9×         |
| Diffusion Policy, DDIM 10         |       10       |    28.91     |        10.2×         |
| Diffusion Policy, DDPM 100        |      100       |    293.72    |   1.0× (baseline)    |

With 10 Euler steps, flow matching is 11× faster than Diffusion Policy's 100-step DDPM sampler. Diffusion Policy's DDIM-10 sampler costs about the same as Euler 10. I have no success numbers for DDIM-10 or one Euler step.

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
    Flow matching rollouts in simulation: Lift, Can, Square and Tool Hang. The Lift and Tool Hang clips come from single-run models trained before the benchmark.
</div>

The MIT-licensed code is public, with configs for all 30 benchmark runs: [Robomimic-Flowmatching](https://github.com/souravselvaraj/Robomimic-Flowmatching) · [benchmark table](https://github.com/souravselvaraj/Robomimic-Flowmatching/blob/master/README.md)
