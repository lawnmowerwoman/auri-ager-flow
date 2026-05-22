# Auri Ager Flow

A calm, opinionated Home Assistant energy flow card inspired by modern energy dashboards — but built with its own visual language.

**Auri Ager Flow** is not trying to be the most configurable power-flow card.  
It is designed to be quiet, readable and technically honest.

The animation shows *that* energy is flowing.  
The values show *how much* energy is flowing.

No racing particles. No visual panic. Just flow.

---

## Design Philosophy

Most energy dashboards try to visualize more power by increasing animation speed.  
Auri Ager Flow intentionally does not do that.

Higher power does not mean that energy should visually “race” through the dashboard.  
The flow indicator remains calm and constant, while the numeric values carry the actual magnitude.

The goal is a dashboard that feels like an instrument, not an alarm panel.

---

## Features

- Clean SVG-based Home Assistant custom card
- Calm gray flow lines and pill animations
- Central autarky ring
- Separate self-consumption mini ring
- Battery icon with SOC fill level
- PV, grid, external source, battery, wallbox, heat pump and home consumption nodes
- Optional external source handling
- Support for external sources located “behind” the home load
- Flow lines and pills are hidden when values are below threshold
- Battery standby does not show an active flow
- Optional battery runtime display

---

## Why `external.mode: behind_home` Exists

Some installations have an additional inverter or energy source located behind the measured home load.

In many dashboards this can result in confusing negative home consumption values, because the external source reduces the measured load locally.

Auri Ager Flow supports this topology explicitly:

```yaml
external:
  mode: behind_home
