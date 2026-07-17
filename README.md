# Liquid Glass Tile Card v2

A custom [Home Assistant](https://www.home-assistant.io/) Lovelace card: one glassmorphic "liquid glass" card that holds **multiple entity rows** (toggle pills, progress bars, or ring gauges), each with a draggable glass lens for adjustable entities.

This is the sequel to [`liquid-glass-tile-card`](https://github.com/donsebby/liquid-glass-tile-card) (one entity per tile). Where v1 is a single square/chip tile per entity, v2 is a **list-style card** — one card, many rows — useful for grouping several related entities (a room's lights, a device's status fields, a room's window sensors) without stacking a dozen separate cards.

Built iteratively in conversation with Claude (Anthropic).

## Features

- Three row styles:
  - **toggle** — icon + name + status, with a real switch widget for controllable domains (`light`, `switch`, `input_boolean`, `fan`, `siren`); read-only status pill for everything else (`binary_sensor`, plain `sensor`, ...)
  - **bar** — horizontal progress track with a draggable glass lens, for brightness/percentage-style values
  - **gauge** — circular ring gauge with a draggable glass lens, same data model as `bar` in a compact ring form
- Rows are draggable (settable) whenever they represent an adjustable value (`light` brightness, `number`/`input_number`) and have no `progress` template — rows with a `progress` template are always read-only, driven entirely by the template
- Per-row JS templates (`[[[ ... ]]]`, with `states`/`hass`/`entity` in scope) for `color`, `progress`, and `state_text` — same template convention as v1
- Live color for dimmable/color lights: reads `rgb_color` while on, remembers the last real color in-memory, and falls back to a one-shot History API lookup for lights that are off and haven't been seen yet this session
- Confirmation dialogs (`tap_action.confirmation`) for destructive actions
- `bg_opacity` (0–1) to control how transparent the card's own backdrop reads, e.g. to match more transparent native cards on the same view
- 2-column grid layout option (`layout: "grid"`) for compact multi-row cards

## Installation

**Manual (recommended, this card isn't in HACS's default store):**

1. Add `liquid-glass-tile-card-v2.js` as a Lovelace resource:
   - Settings → Dashboards → ⋮ → Resources → Add Resource
   - URL: wherever you host the file (`/local/liquid-glass-tile-card-v2.js` if placed in `config/www/`), or add it as a HACS custom repository (category: Lovelace) pointing at this repo
   - Resource type: JavaScript Module

2. Add a card with `type: custom:liquid-glass-tile-card-v2` to any dashboard.

## Configuration

### Card

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | string | — | `custom:liquid-glass-tile-card-v2` |
| `rows` | array | — | **Required.** List of row configs, see below |
| `layout` | string | `list` | `grid` arranges rows in a 2-column grid instead of a vertical list |
| `title` | string | — | Optional card title shown above the rows |
| `bg_opacity` | number | `0.7` | 0–1, controls the card's own background opacity |

### Row

| Option | Type | Description |
|---|---|---|
| `entity` | string | **Required.** Entity ID this row is bound to |
| `type` | string | `toggle` (default), `bar`, or `gauge` |
| `name` | string | Display name, defaults to the entity's `friendly_name` |
| `icon` | string | mdi icon, defaults to the entity's own icon |
| `color` | string | Hex color, or `[[[ ]]]` template returning one (or `null`/falsy to fall back to the default) |
| `progress` | string | `[[[ ]]]` template returning 0–100. Presence of this field makes the row **read-only** regardless of domain |
| `state_text` | string | Static text or `[[[ ]]]` template for the subtext line |
| `power_entity` | string | Entity ID of a power sensor; if set, its wattage always wins over `state_text` |
| `min` / `max` | number | Bounds for `number`/`input_number` rows without a `progress` template (default 0–100) |
| `tap_action` | object | Standard-ish action object: `action` (`toggle`/`perform-action`/`navigate`/`more-info`/`none`), `perform_action`, `target`, `data`, and optional `confirmation: { text: "..." }` |

Templates run as `new Function('states', 'hass', 'entity', code)` — `entity` is this row's own state object, `states` is the full states dict, matching v1's template convention.

### Example

```yaml
type: custom:liquid-glass-tile-card-v2
layout: grid
rows:
  - entity: light.stehlampe
    type: bar
    name: Stehlampe WZ
    icon: mdi:floor-lamp
  - entity: switch.tv_steckdose
    type: toggle
    color: "#ab47bc"
    power_entity: sensor.tv_steckdose_power
  - entity: sensor.geschirrspulmaschine_programmfortschritt
    type: bar
    name: Fortschritt
    progress: "[[[ return Math.max(0, Math.min(100, parseFloat(entity.state) || 0)); ]]]"
    state_text: "[[[ return Math.round(parseFloat(entity.state) || 0) + ' %'; ]]]"
```

## Relationship to v1

`liquid-glass-tile-card` (v1) and this card are separate custom elements (`liquid-glass-tile-card` vs. `liquid-glass-tile-card-v2`) with different config schemas, meant to coexist rather than replace one another — v1 for a single square/chip tile per entity, v2 for grouping several entities into one list-style card. Both can be used side by side on the same dashboard.

## License

MIT
