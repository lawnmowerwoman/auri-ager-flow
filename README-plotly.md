# Auri Ager Plotly Examples

Optional Plotly cards that visually match the Auri Ager dashboard style.

These examples are not part of the Auri Ager framework itself. They are provided
as dashboard companion snippets for users who want matching price and forecast
graphs.

---

## Dynamic electricity price

```yaml
type: custom:plotly-graph
view_layout:
  grid-area: price
title: Strompreis

entities:
  - entity: sensor.epex_spot_data_total_price
    unit_of_measurement: ct/kWh
    name: dynamischer Preis
    time_offset: 24h
    filters:
      - filter: x > new Date(Date.now()-24*60*60*1000)
      - fn: |-
          ({meta}) => ({
            xs: meta.data.map(({ start_time }) => new Date(start_time)),
            ys: meta.data.map(({ price_per_kwh }) => price_per_kwh * 100)
          })

    yaxis: y1
    showlegend: false
    fill: tozeroy
    fillcolor: rgba(66,145,200,0.28)

    line:
      width: 1.5

  - entity: ""
    name: Now
    yaxis: y9
    showlegend: false

    line:
      width: 2
      dash: dot
      color: red

    x: $ex [Date.now(), Date.now()]

    y:
      - 0
      - 1

layout:
  yaxis9:
    visible: false
    fixedrange: true

  paper_bgcolor: rgba(0,0,0,0)
  plot_bgcolor: rgba(0,0,0,0)

refresh_interval: 300
hours_to_show: 36
time_offset: 24h

config:
  scrollZoom: false
  displayModeBar: false
```

---

## PV Forecast

This example uses Solcast-style forecast attributes with `detailedForecast`.

The dynamic `time_offset` keeps the graph focused on the current day and moves
to the next day automatically at midnight when new forecast data becomes available.

```yaml
type: custom:plotly-graph

view_layout:
  grid-area: forecast

title: PV Prognose

refresh_interval: 300s
hours_to_show: 24

time_offset: |-
  $fn () =>  {
    now = new Date();

    tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0,0,0,0);

    HoursLeftToday =
      (tomorrow.getTime() - now.getTime())
      /1000/3600;

    return HoursLeftToday.toFixed(1) + "h";
  }

config:
  scrollZoom: false
  displayModeBar: false

entities:

  - entity: sensor.solcast_pv_forecast_prognose_heute
    name: Prognose
    unit_of_measurement: kWh

    yaxis: y1
    showlegend: false

    type: scatter
    mode: lines

    line:
      width: 2
      dash: dot
      color: rgba(222,127,88,0.45)

    filters:
      - fn: |-
          ({meta}) => ({
            xs: meta.detailedForecast.map(({ period_start }) => new Date(period_start)),
            ys: meta.detailedForecast.map(({ pv_estimate }) => pv_estimate)
          })

  - entity: sensor.solcast_pv_forecast_prognose_heute
    name: P10

    yaxis: y1
    showlegend: false

    type: scatter
    mode: lines

    line:
      width: 1
      dash: dot
      color: rgba(245,184,46,0.45)

    filters:
      - fn: |-
          ({meta}) => ({
            xs: meta.detailedForecast.map(({ period_start }) => new Date(period_start)),
            ys: meta.detailedForecast.map(({ pv_estimate10 }) => pv_estimate10)
          })

  - entity: sensor.solcast_pv_forecast_prognose_heute
    name: P90

    yaxis: y1
    showlegend: false

    type: scatter
    mode: lines

    line:
      width: 1
      dash: dot
      color: rgba(245,184,46,0.45)

    filters:
      - fn: |-
          ({meta}) => ({
            xs: meta.detailedForecast.map(({ period_start }) => new Date(period_start)),
            ys: meta.detailedForecast.map(({ pv_estimate90 }) => pv_estimate90)
          })

  - entity: sensor.all_pv_power
    name: Ist

    yaxis: y1
    showlegend: false

    type: bar

    marker:
      color: rgba(245,184,46,0.45)

    line:
      color: rgba(245,184,46,0.95)
      width: 1

    statistic: max
    period: 5minute

    filters:
      - multiply: 0.001

  - entity: ""
    name: Jetzt

    yaxis: y9
    showlegend: false

    line:
      width: 2
      dash: dot
      color: deepskyblue

    x: $ex [Date.now(), Date.now()]

    y:
      - 0
      - 1

layout:
  paper_bgcolor: rgba(0,0,0,0)
  plot_bgcolor: rgba(0,0,0,0)

  yaxis:
    title: kWh
    fixedrange: true

  yaxis9:
    visible: false
    fixedrange: true

card_mod:
  style: |
    ha-card {
      border-width: 1;
      background: none;
      box-shadow: none;
      height: 240px;
    }
```
