# Auri Ager Framework

![Auri Ager Dashboard](Screenshot.png)

A calm, opinionated Home Assistant energy dashboard suite with a shared visual language.

Current release: 1.2.0  
Status: Stable  
License: Apache 2.0

Auri Ager is designed to show energy systems as quiet, readable instruments instead of noisy alarm panels. Motion indicates that energy is flowing. Values show how much energy is flowing.

## Included Cards

The bundled framework file contains these cards:

| Card | Type | Purpose |
|---|---|---|
| Flow | `custom:auri-ager-flow-card` | Live energy flow and current topology |
| Summary | `custom:auri-ager-summary-card` | Energy balance for day, month, year or total |
| Finance | `custom:auri-ager-finance-card` | Energy savings, costs and calculated balance |
| Gauge | `custom:auri-ager-gauge-card` | Small percentage KPI gauge |
| Sun | `custom:auri-ager-sun-card` | Sun position, elevation and daylight visualization |
| Progress | `custom:auri-ager-progress-card` | Compact progress bar with configurable range |
| Thermometer | `custom:auri-ager-thermometer-card` | Temperature gauge with optional fill-from-zero mode |
| Entities | `custom:auri-ager-entities-card` | Tabular entity overview |
| Entity Grid | `custom:auri-ager-entity-grid-card` | Compact grid for status and KPI tiles |
| Load Breakdown | `custom:auri-ager-load-breakdown-card` | Load distribution overview |
| Three Phase | `custom:auri-ager-three-phase-card` | Three-phase electrical values |
| Switch | `custom:auri-ager-switch-card` | Switch-oriented control tile |
| Value | `custom:auri-ager-value-card` | Single value display |
| Control | `custom:auri-ager-control-card` | Entity and multi-entity control card |
| Markdown | `custom:auri-ager-markdown-card` | Markdown text with Auri Ager styling |
| Container | `custom:auri-ager-container-card` | Visual wrapper for nested Lovelace cards |

## Installation

Copy the bundled file to Home Assistant, for example:

```text
/config/www/auri-ager.js
```

Then add it as a Lovelace resource:

```yaml
url: /local/auri-ager.js
type: module
```

After replacing the file, clear the browser cache or reload Home Assistant resources.

## Visual Editors

Visual editors are included for:

- `auri-ager-flow-card`
- `auri-ager-sun-card`
- `auri-ager-summary-card`
- `auri-ager-finance-card`
- `auri-ager-gauge-card`
- `auri-ager-progress-card`
- `auri-ager-thermometer-card`
- `auri-ager-entities-card`
- `auri-ager-entity-grid-card`
- `auri-ager-load-breakdown-card`
- `auri-ager-three-phase-card`
- `auri-ager-switch-card`
- `auri-ager-value-card`
- `auri-ager-control-card`
- `auri-ager-markdown-card`

If a card is wrapped inside another card such as `custom:mod-card`, Home Assistant may show the editor for the wrapper instead of the Auri Ager card. To use the visual editor, edit the Auri Ager card directly.

---

# Flow Card

## Example

```yaml
type: custom:auri-ager-flow-card
theme: auto
hide_zeros: true
entities:
  solar: sensor.pv_power
  external: sensor.sn_3019385095_pv_power_a
  grid: sensor.active_power
  wallbox: sensor.wallbox_power
  heatpump: sensor.heatpump_power
battery:
  entity: sensor.h_power_battery_all
  soc_entity: sensor.bat_soc_total
  capacity: 36.38
  reverse_direction: false
  maximum_soc: number.goodwe_max_soc
  dod: number.goodwe_depth_of_discharge
  has_backup: true
  backup_dod: number.goodwe_depth_of_discharge_backup
load:
  entity: sensor.load
  backup_entity: sensor.back_up_load
  grid_detection_entity: sensor.grid_mode_code
  grid_detection_value: 1
external:
  mode: behind_home
  label: Zusatz-PV
wallbox:
  mode: behind_home
heatpump:
  mode: behind_home
```

## Entity Meaning

| Entity | Description |
|---|---|
| `solar` | Main PV production, live power |
| `external` | Optional additional source, live power |
| `grid` | Grid power, live power |
| `wallbox` | Optional wallbox or EV charger power |
| `heatpump` | Optional heat pump power |

The Flow card calculates current autarky and current self-consumption internally. Separate `autarky` and `self_consumption` sensors are no longer required for the live card.

## Battery Engine

Flow can calculate battery runtime, charge time, backup energy and backup runtime internally from raw values.

Preferred configuration:

```yaml
battery:
  entity: sensor.battery_power
  soc_entity: sensor.battery_soc
  capacity: 36.38
  maximum_soc: 100
  minimum_soc: 10
  has_backup: true
  backup_minimum_soc: 15
```

`maximum_soc`, `minimum_soc` and `backup_minimum_soc` can be fixed numbers or Home Assistant entities.

Some inverter integrations expose depth of discharge instead of minimum SOC. Use `dod` and `backup_dod` for those cases:

```yaml
battery:
  entity: sensor.battery_power
  soc_entity: sensor.battery_soc
  capacity: 36.38
  maximum_soc: number.goodwe_max_soc
  dod: number.goodwe_depth_of_discharge
  has_backup: true
  backup_dod: number.goodwe_depth_of_discharge_backup
```

If both `minimum_soc` and `dod` are configured, `minimum_soc` wins because it is the direct target value. Legacy `battery.power`, `battery.soc`, `battery.backup_power`, `entities.battery_power` and `entities.battery_soc` remain supported for existing dashboards.

## Load And Island Mode

The optional `load` section lets Flow switch between normal load and backup load without a Home Assistant template sensor.

```yaml
load:
  entity: sensor.load
  backup_entity: sensor.back_up_load
  grid_detection_entity: sensor.grid_mode_code
  grid_detection_value: 1
```

If `grid_detection_entity` equals `grid_detection_value`, Flow uses `load.entity`. Otherwise it uses `load.backup_entity` and the central Autarky ring becomes an island mode status indicator.

## Power Direction Assumptions

The card currently assumes:

- `battery_power > 0` = battery discharging
- `battery_power < 0` = battery charging
- `grid > 0` = export to grid
- `grid < 0` = import from grid

If your inverter reports the opposite sign convention, use:

```yaml
grid:
  reverse_direction: true

battery:
  reverse_direction: true
```

## External Source Modes

```yaml
external:
  mode: parallel_pv
```

Shows the external source as its own parallel input.

```yaml
external:
  mode: behind_home
```

Use this when an additional source is physically located behind the measured home load. The card corrects the displayed home consumption so the additional source does not make the home load look artificially low or negative.

```yaml
external:
  mode: addToPV
```

Adds the external source to the PV value and hides the separate external value display.

## Wallbox and Heat Pump Topology

Wallbox and heat pump can be configured independently.

```yaml
wallbox:
  mode: behind_home
```

Use this when the wallbox is part of the measured home load. The card subtracts it from the displayed home base load and shows the wallbox as a split consumer.

```yaml
wallbox:
  mode: separate
```

Use this when the wallbox is measured separately and is not included in the home load.

The same applies to the heat pump:

```yaml
heatpump:
  mode: behind_home
```

or:

```yaml
heatpump:
  mode: separate
```

## Hiding Zero Values

```yaml
hide_zeros: true
```

When enabled, values close to `0 W` are shown as empty text fields. Flow lines and pills are hidden when below threshold.

---

# Summary Card

The Summary card shows an energy balance for a selected period. The period switcher is usually implemented outside the card, for example with Mushroom chips and conditional cards.

## Example: Day

```yaml
type: custom:auri-ager-summary-card
title: Heute
entities:
  production_dc: sensor.today_s_pv_generation
  efficiency: sensor.pv_efficiency
  feed_in: sensor.pv_verkauf_heute
  grid_import: sensor.pv_bezug_heute
  consumption: sensor.home_load_daily
  wallbox: sensor.bev_energie_tag
  heatpump: sensor.e3_energie_tag
```

## AC / DC Production

Preferred explicit configuration:

```yaml
entities:
  production_dc: sensor.pv_generation_dc
  efficiency: sensor.pv_efficiency
```

The card converts DC production into usable AC production using the efficiency value.

If both values are available, use:

```yaml
entities:
  production: sensor.pv_generation_ac
  production_dc: sensor.pv_generation_dc
```

If only `production_dc` is provided and no efficiency entity exists, the card falls back to `96%`.

Legacy fallback: if only `production` plus `efficiency` is provided, `production` is treated as DC and converted to AC. This is supported for compatibility but `production_dc` is clearer.

## Optional Split Consumers

`wallbox` and `heatpump` are optional. If they are omitted, the sub-box under consumption is hidden.

## CO₂ and Tree Factors

Optional factors:

```yaml
factors:
  co2_kg_per_kwh: 0.42
  tree_kg_per_year: 22
```

Defaults are `0.42 kg CO₂/kWh` and `22 kg CO₂/tree/year`.

---

# Finance Card

The Finance card shows monetary energy values.

## Example: Today

```yaml
type: custom:auri-ager-finance-card
title: Heute
show_cents: true
entities:
  direct_saving: sensor.pv_saving_direct
  feed_in_revenue: sensor.pv_summe_export
  grid_import_cost: sensor.pv_summe_import_real
```

If `battery_saving` is not provided, the card treats `direct_saving` as the available total saving and hides the separate direct and battery rows.

## Example: Total

```yaml
type: custom:auri-ager-finance-card
title: Gesamt
show_cents: false
entities:
  direct_saving: sensor.pv_saving_direct_total
  battery_saving: sensor.pv_saving_battery_total
  feed_in_revenue: sensor.pv_summe_export_total
  grid_import_cost: sensor.pv_summe_import_real_total
  fictional_total: sensor.pv_summe_import_fiktiv
```

## Optional `fictional_total`

If `fictional_total` is provided, the card uses that value. This is useful when historical tariff phases or variable prices make the simple calculation inaccurate.

If it is omitted, the card calculates:

```text
fictional_total = grid_import_cost + total_saving
```

## Optional `battery_saving`

If `battery_saving` exists, the card shows:

- Direct saving
- Battery saving
- Total saving

If `battery_saving` is omitted, the card shows only total saving to avoid misleading labels.

## Cents

```yaml
show_cents: true
```

Shows cents for values below `1000 €`. Larger values stay compact.

---

# Gauge Card

## Example

```yaml
type: custom:auri-ager-gauge-card
title: Eigenverbrauch
entity: sensor.pv_eigenverbrauch_heute
label: Eigenverbrauch
accent_color: "#5aa7d8"
```

A warm orange accent is used by default. `accent_color` can be used for calmer KPI differentiation, for example blue for self-consumption.

---

# Sun Card

## Example

```yaml
type: custom:auri-ager-sun-card
title: false
entities:
  sun: sun.sun
background: /local/k19_3.png
expert:
  solar_arc: true
  daylight_band: true
calibration:
  sunrise_offset_minutes: -95
  sunset_offset_minutes: -45
display_time: true
```

## Visual Editor

The visual editor supports:

- Sun entity
- Display times
- Solar arc
- Daylight band
- Sunrise offset
- Sunset offset

## Background Image

The optional background image is intentionally configured in YAML:

```yaml
background: /local/k19_3.png
```

Home Assistant image/media selectors are not consistent enough for this use case, so the background remains an advanced YAML option.

## Calibration

The sun card is a calm visual projection, not a precise astronomical model. Use calibration offsets to align sunrise and sunset markers visually with a background image or installation-specific reference.

---

# Period Switcher Example

A simple switcher can be built with an `input_select` and conditional cards.

```yaml
input_select:
  energy_summary_period:
    name: Energy Summary Period
    options:
      - Heute
      - Monat
      - Jahr
      - Gesamt
```

Example chips:

```yaml
type: custom:mushroom-chips-card
alignment: center
chips:
  - type: template
    content: Heute
    icon: mdi:calendar-today
    tap_action:
      action: call-service
      service: input_select.select_option
      target:
        entity_id: input_select.energy_summary_period
      data:
        option: Heute
  - type: template
    content: Monat
    icon: mdi:calendar-month
    tap_action:
      action: call-service
      service: input_select.select_option
      target:
        entity_id: input_select.energy_summary_period
      data:
        option: Monat
  - type: template
    content: Jahr
    icon: mdi:calendar
    tap_action:
      action: call-service
      service: input_select.select_option
      target:
        entity_id: input_select.energy_summary_period
      data:
        option: Jahr
  - type: template
    content: Gesamt
    icon: mdi:counter
    tap_action:
      action: call-service
      service: input_select.select_option
      target:
        entity_id: input_select.energy_summary_period
      data:
        option: Gesamt
```

Use Home Assistant conditional cards to show the matching Summary or Finance card for the selected period.

---

# Design Philosophy

Auri Ager avoids visual panic. Animation remains calm. Values carry magnitude. Optional data is treated as optional, not as a reason for configuration failure.

The target is a dashboard that still makes sense when a system has fewer sensors than the original development installation.

## License

Apache License 2.0

## Credits

Built with care, iteration, visual tuning and a lot of field testing by Steffi and Auri ✨
