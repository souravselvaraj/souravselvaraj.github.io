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
    Flow matching policy on robomimic's two-arm Transport task, in simulation. In the three-seed benchmark, flow matching averaged 81.7% success on this task against 86.7% for Diffusion Policy.
</div>

People who demonstrate a task do not all do it the same way. One reaches around an obstacle on the left, another on the right. A policy that averages the two drives straight into the obstacle. Diffusion Policy handles this well. It learns a distribution over short sequences of future actions, called action chunks, and samples one of them. The cost shows up at run time. Each chunk starts as random noise and is cleaned up over 100 denoising steps, one network pass per step. On an RTX PRO 6000 GPU that took 293.72 ms per chunk.

I wanted to keep that flexibility and drop most of those steps. In this project I replaced the denoising loop with Conditional Flow Matching (CFM) and kept the rest of the policy fixed, so the comparison isolates the generative model.

## The idea

Flow matching also starts from noise and ends at an action chunk. The network learns a velocity: for any point between noise and action, which direction to move and how fast. Training is plain regression. I draw a noise sample, pair it with a demonstrated action chunk, pick a point on the straight line between them, and train the network to output the velocity of that line.

At run time the policy starts from fresh noise and follows the learned velocity with a few Euler steps. It helps to picture a field of arrows that carries the sample from noise to an action chunk. Because each training target is a straight line, the learned paths tend to be close to straight, and a nearly straight path can be covered in a few long strides. They are not perfectly straight, because many noise and action pairs cross each other and the network learns their average. I use 10 Euler steps by default, and that is the only setting whose success I report in the three-seed benchmark.

## What I built

I first wrote CFM as a new algorithm in [my fork](https://github.com/souravselvaraj/robomimic/tree/flow-matching) of [robomimic](https://github.com/ARISE-Initiative/robomimic), a framework and benchmark for learning manipulation from human demonstrations, and ran the benchmark there. Afterwards I copied the same algorithm file into a separate package. Importing it registers a `flow_matching` algorithm, and robomimic's own trainer, checkpointing and rollout code run as they are.

The policy uses the same robomimic observation encoder, 65M-parameter conditional U-Net and receding-horizon loop as Diffusion Policy. That loop looks at the last 2 observations, predicts a chunk of 16 actions, executes 8 of them and then predicts again. Only the training objective and the sampler differ.

I compared the two on robomimic's five proficient-human tasks. All runs are in simulation and use low-dimensional state observations, without cameras. Each method got the same training budget (1000 epochs of 100 gradient steps, batch size 256) and three seeds, 30 runs in total. Every 100 epochs a run was evaluated with 20 rollouts, so success moves in steps of 5%. For both methods I report the best of those ten evaluations, which is optimistic.

## Success rate

| Task      | Flow Matching  | Diffusion Policy | BC-RNN (ref) |
| --------- | :------------: | :--------------: | :----------: |
| Lift      |  100.0 ± 0.0   |   100.0 ± 0.0    |     ~100     |
| Can       |  100.0 ± 0.0   |   100.0 ± 0.0    |     ~100     |
| Square    | **56.7 ± 8.5** |    45.0 ± 7.1    |     ~84      |
| Tool Hang |   75.0 ± 7.1   |  **80.0 ± 7.1**  |     ~67      |
| Transport |   81.7 ± 2.4   |  **86.7 ± 8.5**  |     ~71      |

Success rate in %, mean ± std over 3 seeds, in simulation. Flow matching samples with 10 Euler steps and Diffusion Policy with 100 DDPM steps. The BC-RNN column holds approximate reference values from robomimic, included for context and not rerun under this protocol.

Flow matching is ahead on Square by 11.7 points and behind on Tool Hang and Transport by 5 points each. With only three seeds per method, none of these gaps is statistically reliable. A 5-point gap in the mean is, on average, one rollout in 20 per seed. So I read the result as comparable success. BC-RNN's reference on Square (about 84%, from robomimic's own protocol) is higher than either, so Square leaves room for both generative policies.

## How fast it runs

I timed one action chunk for a single observation on the same 65M U-Net on an RTX PRO 6000, over 100 trials after 3 warm-up runs. The weights were random, since timing depends only on the number of network passes.

| Sampler                           | Network passes | ms per chunk | Speedup vs. DDPM-100 |
| --------------------------------- | :------------: | :----------: | :------------------: |
| Flow Matching, Euler 1            |       1        |     3.11     |        94.4×         |
| Flow Matching, Euler 5            |       5        |    13.44     |        21.9×         |
| Flow Matching, Euler 10 (default) |       10       |  **26.68**   |      **11.0×**       |
| Flow Matching, midpoint 5         |       10       |    26.92     |        10.9×         |
| Diffusion Policy, DDIM 10         |       10       |    28.91     |        10.2×         |
| Diffusion Policy, DDPM 100        |      100       |    293.72    |   1.0× (baseline)    |

Latency grows almost linearly with the number of network passes, roughly 2.7 to 3.1 ms each, so the speedup comes almost entirely from needing fewer of them. At its default of 10 Euler steps, flow matching is 11× faster than the DDPM-100 sampler used for Diffusion Policy's success numbers above. Diffusion Policy can also sample with DDIM in 10 steps at about the same cost (28.91 vs. 26.68 ms), but I have no DDIM-10 success numbers, so I cannot compare success at that budget. I have not evaluated success at one Euler step, so that row is a latency figure only.

## Rollouts

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
    Flow matching rollouts in robomimic simulation: Lift and Can (top), Square and Tool Hang (bottom). The Lift and Tool Hang clips come from single-run models trained before the three-seed benchmark.
</div>

## Follow-up experiments

After the benchmark I added a transformer backbone and trained from camera images, three seeds per setting. Runs from state kept 20 rollouts per evaluation. Image runs used 10 rollouts, evaluated every 250 epochs, so I treat those as directional. On Square, growing the transformer from 9.8M to 48.5M parameters, closer to the U-Net's 65M, barely moved its success from state (32 ± 8% to 35 ± 5%). The default-size transformer trained on Square from two camera views reached 93 ± 6%. On Transport, four camera views gave 83 ± 21%, with a wide spread across seeds. On Tool Hang the image policy reached only 10 ± 10%, far below the 75% the U-Net reached from state, although that comparison changes both the backbone and the inputs. A cross-attention variant of the transformer for Square is set up in the repo but has no reported results.

The code is public under the MIT license, with the configs for all 30 runs of the three-seed sweep, a lockfile for the environment and a short CPU test suite.

Code and full benchmark details: [Robomimic-Flowmatching](https://github.com/souravselvaraj/Robomimic-Flowmatching) · [benchmark table](https://github.com/souravselvaraj/Robomimic-Flowmatching/blob/master/README.md)
