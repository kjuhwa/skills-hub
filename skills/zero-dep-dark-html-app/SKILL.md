---
name: zero-dep-dark-html-app
description: Scaffold a zero-dependency dark-theme HTML+CSS+JS interactive app with canvas charts, tab navigation, and detail panels
category: design
triggers:
  - zero-dep html app
  - dark theme dashboard
  - self-contained html tool
  - vanilla js interactive app
  - canvas visualization app
tags:
  - html
  - css
  - vanilla-js
  - canvas
  - dark-theme
  - zero-dependency
version: 1.0.0
---

# Zero-Dep Dark-Theme HTML App Scaffold

Consistent 3-file structure for building self-contained interactive tools that open directly in a browser with no build step or server required.

## File Structure

```
project/
  index.html   — Shell: header, tab nav, view sections, panels
  style.css    — Dark theme tokens, layout, animations
  app.js       — All logic in a single IIFE
```

## Design Tokens

```css
:root {
  --bg: #0f1117;
  --surface: #1a1d27;
  --surface2: #232733;
  --border: #2e3344;
  --text: #e2e8f0;
  --text-dim: #8892a8;
  --accent: #6ee7b7;
  --accent2: #818cf8;
  --warn: #fbbf24;
  --danger: #f87171;
  --info: #38bdf8;
  --radius: 8px;
}
```

## Entity Color Palette (10 cycling colors)

For color-coding services, nodes, fields, or any categorical entities:

```
#6ee7b7, #818cf8, #38bdf8, #fbbf24, #f87171,
#a78bfa, #fb923c, #f472b6, #34d399, #94a3b8
```

## HTML Shell Pattern

```html
<header class="top-bar">
  <div class="logo">...</div>
  <nav class="tabs">
    <button class="tab active" data-view="view1">View 1</button>
    <button class="tab" data-view="view2">View 2</button>
  </nav>
  <div class="top-right">
    <span class="clock" id="clock"></span>
    <span class="status-dot"></span>
  </div>
</header>
<main>
  <section class="view active" id="view-view1">...</section>
  <section class="view" id="view-view2">...</section>
</main>
```

## JS Architecture

```js
(() => {
'use strict';

// Shared constants and utilities
const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Tab switching
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  views.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('view-' + t.dataset.view).classList.add('active');
}));

// Feature modules as sections within the IIFE
// ...
})();
```

## Common UI Components

- **Detail Panel**: slide-in right panel with key-value rows (`.kv > .k + .v`)
- **Canvas Chart**: padded area with grid lines, data line, fill gradient, threshold line, current-value dot
- **Toolbar**: flex row with buttons, selects, toggle labels
- **Card Grid**: CSS grid of `.metric-card` with header/body/footer
- **Status Badges**: `.alert-badge`, `.frozen-badge` with blink animation

## Verification Checklist

1. `node --check app.js` — syntax valid
2. Serve with `python -m http.server` or open `index.html` directly
3. All tabs switch correctly
4. Canvas elements render (no blank areas)
5. Interactive elements respond (clicks, hovers)
