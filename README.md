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

Auri Ager Flow supports this topology explicitly.

Example:

```yaml
external:
  mode: behind_home
```

This allows the card to show the external source as its own energy input while still correcting the displayed home consumption.

This is one of the core reasons this card exists.

---

## Example Configuration

```yaml
type: custom:auri-ager-flow-card
entities:
  solar: sensor.pv_power
  grid: sensor.active_power
  battery_power: sensor.h_power_battery_all
  battery_soc: sensor.bat_soc_total
  battery_runtime: sensor.pv_runtime
  home: sensor.load
  wallbox: sensor.shellypro3em_ac15187ba180_total_active_power
  heatpump: sensor.e3_load
  autarky: sensor.home_autarkie_heute
  self_consumption: sensor.pv_eigenverbrauch_heute
  external: sensor.sn_3019385095_pv_power_a

external:
  mode: behind_home
  label: Externe Quelle
```

---

## Entity Meaning

| Entity | Description |
|---|---|
| `solar` | Main PV production |
| `external` | Additional external energy source |
| `grid` | Grid power |
| `battery_power` | Battery charge/discharge power |
| `battery_soc` | Battery state of charge |
| `battery_runtime` | Optional runtime string, for example `hh:mm` |
| `home` | Measured home load |
| `wallbox` | Wallbox / EV charger load |
| `heatpump` | Heat pump load |
| `autarky` | Autarky percentage |
| `self_consumption` | Self-consumption percentage |

---

## Power Direction Assumptions

The card currently assumes:

- `battery_power > 0` = battery discharging
- `battery_power < 0` = battery charging
- `grid > 0` = export to grid
- `grid < 0` = import from grid

These assumptions may become configurable in a later version.

---

## Animation Philosophy

The pill animation is intentionally calm and constant.

It does not speed up with higher power values.

Power magnitude is shown by the numeric value.  
Flow state is shown by the animated pill.

This keeps the dashboard readable and prevents visual noise.

---

## Current Status

Current internal maturity: `1.0a`

The card is usable and visually close to the intended design.

Known follow-up work:

- Separate animation DOM from value updates
- Reduce or eliminate animation restart on Home Assistant state updates
- Improve theme support
- Add optional layout polish for smaller cards
- Prepare HACS structure
- Add screenshots
- Add release metadata

---

## Not Included by Design

Auri Ager Flow intentionally avoids excessive configuration.

The card is opinionated.

It does not try to support unlimited custom nodes, arbitrary layouts or dozens of visual styles.

If you need full visual freedom, another power-flow card may be a better fit.

If you want a quiet, structured and Apple-like energy overview, this card may be for you.

---

## Name

`Auri Ager Flow`

The name started as a playful nod to the design inspiration, but the card has since grown into its own thing.

---

## License

Apache License 2.0

---

## Credits

Built with care, iteration and a lot of visual tuning by Steffi and Auri ✨
