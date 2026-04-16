---
name: oauth-visualization-pattern
description: Animated sequence-diagram pattern for visualizing multi-party OAuth 2.0 flows on a Canvas element.
category: design
triggers:
  - oauth visualization pattern
tags:
  - auto-loop
version: 1.0.0
---

# oauth-visualization-pattern

Model OAuth participants (User, Client App, Auth Server, Resource Server) as fixed actor columns with vertical lifelines, mirroring UML sequence diagrams. Define each grant type (Authorization Code, Client Credentials, PKCE) as an ordered array of step objects containing `from`/`to` actor indices, a short label, and a human-readable description. Render actors as rounded rectangles at fixed x-positions with dashed lifelines extending downward, then draw horizontal arrows between lifelines at stacked y-offsets to represent each message exchange.

Animate step progression using `requestAnimationFrame` with a linear interpolation variable (`animProgress += 0.025`) that draws a partial arrow from sender to receiver. When the arrow completes (`progress >= 1`), advance to the next step and update a description panel below the canvas. Previously completed steps render as dimmed arrows while the active step highlights in accent color (`#6ee7b7`). This progressive-disclosure animation forces the viewer to absorb each redirect, code exchange, and token return individually rather than seeing the full flow at once.

Support flow switching by cancelling the current animation frame, resetting step index and progress to zero, and restarting the animation loop with the new flow's step array. This pattern scales to any multi-party protocol visualization — add actors to the array and define new step sequences without touching rendering logic. The key constraint is vertical spacing: cap flows at ~8 steps before the canvas needs scrolling or pagination.
