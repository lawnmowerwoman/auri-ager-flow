## Zeitraum-Umschaltung (Heute / Monat / Jahr / Gesamt)

Auri Ager selbst erzwingt keinen Zeitraum.

Stattdessen kann Home Assistant über kleine "Chip"-Schalter zwischen
verschiedenen Ansichten wechseln. Dadurch bleiben die Karten selbst
einfach und die Dashboard-Logik flexibel.

Beispiel:

```yaml
type: custom:mushroom-chips-card
alignment: center
chips:
  - type: template
    icon: mdi:calendar-today
    content: Heute
    tap_action:
      action: call-service
      service: input_select.select_option
      data:
        entity_id: input_select.auri_period
        option: Heute

  - type: template
    icon: mdi:calendar-month
    content: Monat
    tap_action:
      action: call-service
      service: input_select.select_option
      data:
        entity_id: input_select.auri_period
        option: Monat

  - type: template
    icon: mdi:calendar
    content: Jahr
    tap_action:
      action: call-service
      service: input_select.select_option
      data:
        entity_id: input_select.select_option
        option: Jahr

  - type: template
    icon: mdi:calendar-multiple
    content: Gesamt
    tap_action:
      action: call-service
      service: input_select.select_option
      data:
        entity_id: input_select.auri_period
        option: Gesamt
```

Benötigter Helper:

```yaml
input_select:
  auri_period:
    name: Zeitraum
    options:
      - Heute
      - Monat
      - Jahr
      - Gesamt
    initial: Heute
```

Danach können Karten ihre Werte abhängig vom gewählten Zeitraum beziehen.

Beispiel:

Heute:

```yaml
production: sensor.pv_today
feed_in: sensor.feed_in_today
consumption: sensor.house_today
```

Gesamt:

```yaml
production: sensor.pv_total
feed_in: sensor.feed_in_total
consumption: sensor.house_total
```

Die eigentliche Umschaltung kann per Conditional Card, State Switch
oder Template-Sensor erfolgen.

Dadurch bleiben die Auri-Ager-Karten bewusst ruhig:
Die Karten visualisieren.
Das Dashboard entscheidet.
```