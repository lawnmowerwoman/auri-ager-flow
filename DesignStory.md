## Design Story

Auri Ager Flow was created because many energy dashboards show a lot of data, but often feel visually nervous.

The goal of this card is not to display every possible energy detail inside one diagram.  
The goal is to provide a calm, structured overview of the current energy state.

The card follows a few simple principles.

### 1. Motion means flow, not magnitude

The animated pill shows that energy is flowing.

It does not speed up when more power is flowing.

Power magnitude belongs to the numeric value, not to animation speed.  
This keeps the card calm even during high PV production or large grid export.

### 2. Values and motion are separate information layers

Motion answers:

> Is something flowing?

The value answers:

> How much is flowing?

Mixing both into animation speed makes the dashboard harder to read and visually stressful.

### 3. The center must stay meaningful

The center of the card is reserved for autarky.

Autarky is the main high-level status of the system, so it gets the strongest visual focus.

Self-consumption is important too, but it is intentionally placed in a smaller secondary ring.  
This keeps the center clean and avoids overloading the main focus area.

### 4. Not every detail belongs into the flow

Auri Ager Flow is not meant to replace all energy statistics.

Daily yield, CO2 savings, emergency reserve, electricity prices, forecasts and historical charts are valuable — but they belong next to the flow, not inside it.

The flow card should answer the current-state question quickly:

> Where is energy coming from, where is it going, and what is the overall state?

### 5. Lines should guide, not decorate

Flow lines are intentionally calm, gray and restrained.

They should guide the eye through the system without competing with values or rings.

The line layout avoids visual “spider legs” and tries to keep paths understandable, balanced and quiet.

### 6. No fake flow

If a value is below the active threshold, the flow line and pill are hidden.

Battery standby does not show an active flow.

If nothing meaningful is flowing, the card should not pretend otherwise.

### 7. Real topology matters

Some installations have additional energy sources located behind the measured home load.

Auri Ager Flow supports this explicitly with the external mode `behind_home`.

This is not just a visual option.  
It models a real electrical topology and helps avoid misleading negative home consumption values.

### 8. Opinionated by design

Auri Ager Flow is intentionally not a fully free-form diagram builder.

It has a designed layout, a defined visual language and a limited set of supported nodes.

This is deliberate.

Too many layout options can make the card flexible, but also visually inconsistent.  
Forks and extensions are welcome, but changes should preserve the calm hierarchy and readable flow model.

---

## Guidance for Forks

If you fork or extend this card, please consider the following before changing the layout or animation model:

- Does the change make the card calmer or noisier?
- Does the center still have one clear purpose?
- Are values and motion still separate?
- Are inactive flows truly hidden?
- Does the layout still explain the energy topology?
- Is the new information better shown inside the flow, or next to it?
- Is the card still readable at a glance?

Auri Ager Flow is meant to feel like a quiet instrument, not a control room alarm panel.