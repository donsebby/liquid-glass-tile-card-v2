# Liquid Glass Tile Card v2

A custom [Home Assistant](https://www.home-assistant.io/) Lovelace card: one glassmorphic "liquid glass" card that holds **multiple entity rows** (toggle pills, progress bars, or ring gauges), each with a draggable glass lens for adjustable entities.

This is the sequel to [`liquid-glass-tile-card`](https://github.com/donsebby/liquid-glass-tile-card) (one entity per tile). Where v1 is a single square/chip tile per entity, v2 is a **list-style card** — one card, many rows — useful for grouping several related entities (a room's lights, a device's status fields, a room's window sensors) without stacking a dozen separate cards.

Built iteratively in conversation with Claude (Anthropic).

![demo](asset/liquid_glass_tile_v2_collage.png)
![demo_gif](asset/liquid_glass_tile_v2_lamps_outlets.gif)

## Features

- Four row styles:
  - **toggle** — icon + name + status, with a real switch widget for controllable domains (`light`, `switch`, `input_boolean`, `fan`, `siren`); read-only status pill for everything else (`binary_sensor`, plain `sensor`, ...)
  - **bar** — horizontal progress track with a draggable glass lens, for brightness/percentage-style values
  - **gauge** — circular ring gauge with a draggable glass lens, same data model as `bar` in a compact ring form
  - **stat** — number-first tile for counts ("7 open items"): big value, label underneath, small icon top-right and a short accent line in the row color; value 0 dims it
- Rows are draggable (settable) whenever they represent an adjustable value (`light` brightness, `number`/`input_number`) and have no `progress` template — rows with a `progress` template are always read-only, driven entirely by the template
- Per-row JS templates (`[[[ ... ]]]`, with `states`/`hass`/`entity`/`fmt` in scope) for `color`, `progress`, and `state_text` — same template convention as v1
- Live color for dimmable/color lights: reads the current `rgb_color`/`hs_color` straight off live state on every update, same as v1 - no caching, no async lookups, so it can never show a stale color
- Tapping a row's name runs the row's `tap_action` if it has one, otherwise opens Home Assistant's own more-info dialog (color wheel, color temperature, etc.) - dragging the row itself only ever sets brightness/value
- Long-press (½ s) on a toggle pill always opens more-info, even when a tap toggles
- On phones, 2-column grids switch toggle pills to a Control-Center layout (icon and switch on top, name and state on their own line), so names aren't cut to a few letters
- Subtext shows states localized by Home Assistant itself ("Geschlossen", "Beendet", ...)
- `frame: false` (no panel, for pop-ups) and `glow: false` (no colored glows) for calmer placements
- `look: solid` — an opt-in calm, Apple-Home-style tile look (solid surfaces, no glass, the whole tile toggles or slides) instead of the default glass
- Visual editor for title, layout, style (glass/solid), transparency, frame/glow and the rows themselves (templates and `tap_action` stay YAML-only)
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
| `frame` | boolean | `true` | `false` renders no card panel at all (no background, border, blur, shadow, rounding or padding) — the rows sit directly on whatever is behind, e.g. inside a pop-up that already is a glass panel |
| `glow` | boolean | `true` | `false` removes the decorative colored glows (active row/icon glow, switch, bar fill, ring halo, stat accent line) for a calmer look; row colors themselves stay |
| `stat_size` | string | — | `large` makes `stat` rows bigger (44 px numbers, 104 px tiles) for a start page |
| `look` | string | — (theme, else glass) | `solid` switches `toggle` and `bar` rows to calm solid tiles, see *Solid look*. `glass` forces the glass look. Without it the theme decides (`lg-look`), otherwise glass |

### Row

| Option | Type | Description |
|---|---|---|
| `entity` | string | **Required.** Entity ID this row is bound to |
| `type` | string | `toggle` (default), `bar`, `gauge`, or `stat` |
| `name` | string | Display name, defaults to the entity's `friendly_name` |
| `icon` | string | mdi icon, defaults to the entity's own icon |
| `color` | string | Hex color, or `[[[ ]]]` template returning one (or `null`/falsy to fall back to the default) |
| `progress` | string | `[[[ ]]]` template returning 0–100. Presence of this field makes the row **read-only** regardless of domain |
| `state_text` | string | Static text or `[[[ ]]]` template for the subtext line |
| `power_entity` | string | Entity ID of a power sensor; if set, its wattage always wins over `state_text` |
| `min` / `max` | number | Bounds for `number`/`input_number` rows without a `progress` template (default 0–100). On `stat` rows, `max` makes the accent line grow with the value |
| `value` | string | `stat` rows only: number/text or `[[[ ]]]` template for the big value (default: the entity's state) |
| `line` | boolean / string | `stat` rows only: `false` hides the accent line; a `[[[ ]]]` template shows it only when it returns something truthy |
| `hide_track` | boolean | `bar` rows only: hide the track/fill/lens, e.g. for a row that is just a tap-action button |
| `tap_action` | object | Standard-ish action object: `action` (`toggle`/`perform-action`/`navigate`/`more-info`/`none`), `perform_action`, `target`, `data`, and optional `confirmation: { text: "..." }` |

Templates run as `new Function('states', 'hass', 'entity', 'fmt', code)` — `entity` is this row's own state object, `states` is the full states dict, matching v1's template convention. `fmt(entityIdOrStateObj)` returns the state as Home Assistant itself displays it (translated, with unit and display precision), e.g. `[[[ return fmt(entity) ]]]` or `[[[ return fmt('sensor.dishwasher_remaining') + ' left' ]]]`.

### State text

Without `state_text`/`power_entity`, the subtext line shows the state formatted by Home Assistant (`hass.formatEntityState`): translated into your HA language ("Beendet", "Geschlossen", "Ein", "Angedockt" in German), with the entity's unit and display precision. On frontends older than HA 2023.9, which lack that formatter, the card falls back to its previous plain text (raw state + unit, `on`/`off`/`open`/`closed` as German words).

### Entities by label (templates)

There is no dedicated label option, but templates get `hass`, and `hass.entities[id].labels` holds each entity's label IDs. E.g. a `stat` row counting the lights with the label `lampen` that are on:

```yaml
- entity: sun.sun            # any entity; the value comes from the template
  type: stat
  name: Lights on
  icon: mdi:lightbulb-group
  value: >-
    [[[
      const ids = Object.keys(hass.entities).filter((e) => hass.entities[e].labels?.includes('lampen'));
      return ids.filter((e) => states[e]?.state === 'on').length;
    ]]]
```

Use the label's ID (Settings → Labels; usually the lowercased name), not its display name.

### Pop-ups

Inside a pop-up that is already a glass panel, `frame: false` avoids a box in a box, and `glow: false` keeps it calm:

```yaml
type: custom:liquid-glass-tile-card-v2
frame: false
glow: false
rows:
  - entity: vacuum.robbi
  - entity: cover.garage
```

### Solid look

`look: solid` replaces the glass rows with quiet, solid tiles in the spirit of Apple Home / Control Center — neutral when off, clearly lit when on, colour only where something is active:

- **Tiles** (`toggle` and `bar` rows): a solid surface (`--lg-tile-bg`, default a faint mix of the text colour), 64 px tall, no shadows and no glows (whatever `glow` says). When the entity is on, the tile is tinted with the row colour and the icon sits in a circle filled with it.
- **Toggle rows** have no switch: tap anywhere on the tile to toggle (lights, switches, `input_boolean`, fans, sirens); other entities open more-info. A row's own `tap_action` still wins. Long-press (½ s) opens more-info.
- **Bar rows** have no track or lens: the tile background itself fills from the left with the level. Drag horizontally anywhere on the tile to change it — relative to where you started, so the value doesn't jump — while a vertical swipe still scrolls the page or pop-up. The value is shown in the subtext while dragging (e.g. "64 %"). A plain tap toggles the light on/off; long-press opens more-info. Same service calls and update rate as the glass slider. `hide_track` bars are plain tap tiles without the fill.
- `gauge` and `stat` rows keep working next to them, without glass highlights.
- Transitions are switched off for `prefers-reduced-motion`.

The look can also come from the theme for all Liquid Glass cards at once: set `lg-look: solid` in your Home Assistant theme (CSS variable `--lg-look`, `solid` or `glass`). `look:` on a card overrides it for that card, e.g. `look: glass` keeps one card glass on a solid theme. The card re-reads the variable when the theme or dark mode changes, or when the window event `lg-theme-changed` fires. In the visual editor, *Stil: Wie Theme* leaves `look` out.

```yaml
type: custom:liquid-glass-tile-card-v2
look: solid
frame: false
layout: grid
rows:
  - entity: light.living_room
    type: bar
  - entity: light.desk_lamp
  - entity: switch.coffee_machine
    power_entity: sensor.coffee_machine_power
```

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

A pair of `stat` tiles, e.g. for a shopping list and open tasks:

```yaml
type: custom:liquid-glass-tile-card-v2
layout: grid
rows:
  - entity: todo.shopping_list
    type: stat
    name: Shopping
    icon: mdi:cart-outline
    color: "#43A047"
    tap_action: { action: navigate, navigation_path: /lovelace/shopping }
  - entity: todo.chores
    type: stat
    name: Tasks
    icon: mdi:clipboard-check-outline
    color: "#FFA726"
```

## Relationship to v1

`liquid-glass-tile-card` (v1) and this card are separate custom elements (`liquid-glass-tile-card` vs. `liquid-glass-tile-card-v2`) with different config schemas, meant to coexist rather than replace one another — v1 for a single square/chip tile per entity, v2 for grouping several entities into one list-style card. Both can be used side by side on the same dashboard.

## Theme variables

Like the other Liquid Glass cards, this card reads optional CSS variables, so one theme can align all of them (`lg-tile-bg` only matters for `look: solid`):

```yaml
# in your Home Assistant theme
lg-radius: 22px                          # corner radius of the glass panel
lg-backdrop: blur(22px) saturate(180%)   # blur/saturation behind the panel
lg-tile-bg: rgba(40, 44, 52, 0.9)        # tile surface in `look: solid` (a plain colour)
lg-look: solid                           # solid look for all Liquid Glass cards (card `look:` wins)
```

Without them nothing changes. Options set on the card itself (e.g. `blur`) still win.

## Changelog

### Unreleased
- Solid look: tiles take their edge, shadow and backdrop from the theme (`--lg-tile-edge`, `--lg-tile-shadow`, `--lg-tile-backdrop`), so solid tiles can also be made of glass.
- Solid look: the round icon lights up with the level (dim at a low brightness, full at 100 %).

### 2.13.2
- Smoother scrolling in pop-ups: rows only rewrite their name, state text, value and icon when these actually change. Before, every state update in Home Assistant (several per second) replaced the text of every row, which made the browser lay the card out again and could make scrolling stutter and jump, mostly on iOS.

### 2.13.1
- Stat tiles read the Pane family variable `--pane-backdrop` (e.g. `blur(18px)`), so a frosted theme blurs what is behind them like the other cards. Without it nothing changes.

### 2.13.0
- The look can come from the theme: `lg-look: solid` (CSS variable `--lg-look`) switches every card without its own `look` to the solid look; `look: glass` / `look: solid` on a card overrides it. Re-checked on theme/dark-mode changes and on the `lg-theme-changed` window event. Visual editor: new *Stil* choice *Wie Theme*.
- Solid look: read-only rows (sensors, numbers) stay calm – no tinted tile, only a tinted icon – so a coloured tile always means "on".
- New card option `stat_size: large`: bigger, bolder stat numbers (44 px) and labels for a start page; a value of 0 turns number and label to the secondary text colour.
- New `stat` row option `line`: `false` hides the accent line, a template shows it only when it returns something truthy (e.g. only when a task is overdue).
- Stat tiles read the optional CSS variable `--lg-stat-bg` for their background, so a theme or an ambience card can give them a solid surface.
- New card option `look: solid`: calm, solid tiles for `toggle` and `bar` rows instead of glass (see *Solid look*). Solid surface from the optional `--lg-tile-bg`, tinted with the row colour when on, round icon filled with the row colour, larger text (15/13 px), 64 px tiles, no shadows or glows. Without `look` the card renders exactly as before.
- Solid toggle rows: no switch, the whole tile toggles (or runs its `tap_action`); long-press opens more-info.
- Solid bar rows: no track/lens, the tile fills with the level and is dragged horizontally anywhere (relative, axis-locked so vertical swipes still scroll, value shown in the subtext while dragging); a plain tap toggles, long-press opens more-info.
- Gauge rings drop their glass centre highlight and lens in the solid look; transitions respect `prefers-reduced-motion`.
- Visual editor: new "Stil" select (Glas / Solide); only `look: solid` is written.

### 2.12.0
- States are now localized by default: without `state_text`/`power_entity` the subtext uses Home Assistant's own `hass.formatEntityState` (translated, e.g. "Beendet", "Geschlossen", "Ein", "Angedockt", with unit and display precision). Older frontends without it keep the previous text. Note: this changes the default subtext of existing rows (e.g. "An" becomes HA's "Ein", numbers use your locale's decimal separator).
- `power_entity` text is formatted by Home Assistant too (locale decimal separator and the sensor's display precision, e.g. "11,0 W").
- Templates get a 4th parameter `fmt(entityIdOrStateObj)` returning that localized state text, e.g. `[[[ return fmt(entity) ]]]`. The existing `states`/`hass`/`entity` parameters are unchanged.
- New card option `frame: false`: no card panel (background, border, blur, shadow, rounding, padding), for use inside pop-ups.
- New card option `glow: false`: removes the decorative colored glows (active rows/icons, switches, bar fill, ring halo, stat line).
- Visual editor: checkboxes for `frame` and `glow` (only `false` is written to the config).
- README: how to build entity lists from a label inside a template.

### 2.11.0
- New row type `stat`: a number-first tile (big value, label, small icon, short accent line in the row color). The value comes from the entity state or a `value` template; with `max` the accent line grows with it. Value 0 dims the tile. Whole tile is the tap target; long-press opens more-info.

### 2.10.1
- Reads the optional theme variables `--lg-radius` and `--lg-backdrop` (see *Theme variables*).
- Phones: in `layout: grid`, toggle pills narrower than ~430px card width switch to a Control-Center layout (icon + switch on top, name/state full width underneath), so long names are no longer cut to a few characters. Uses a CSS container query; wider cards look exactly as before.
- Long-press (500 ms) on a toggle pill opens more-info (with a haptic tick); moving the finger cancels it, and the tap that ends a long-press no longer also toggles.
- Subtext is truncated with an ellipsis instead of wrapping, and pills no longer trigger text selection/callouts on long-press in iOS.
- Hash navigation (`navigation_path: "#popup"`) uses `history.pushState` + a manual `hashchange`, fixing a brief reload/flash of the dashboard in the iOS Companion App (same fix as liquid-lens-navbar-card 1.5.3).
- Templates are compiled once per template string and cached instead of on every Home Assistant update.

### 2.10.0
- Visual editor (`liquid-glass-tile-card-v2-editor`) for title, layout and `bg_opacity`, plus rows (entity picker, type, name, icon, min/max, `hide_track`) with add/remove/reorder.
- Name tap runs a row's own `tap_action` when one is configured (more-info otherwise); the icon of `toggle` rows is tappable for any row with a `tap_action`, not only lights.
- New `hide_track: true` for `bar` rows.

### 2.9.3
- Fixed: gauge rows (`type: gauge`) now render the inner ring with a translucent glass surface instead of a flat, opaque theme-colored disc. `.ring-inner` previously used `background: var(--card-background-color, ...)`, which read as a solid "milky" circle rather than glass. Now uses a low-opacity white fill (`rgba(255,255,255,0.11)`) with a thin border and top/bottom inset shadows for highlight + depth, matching the round-glass look used elsewhere in the Liquid Glass family (e.g. thermostat-glass-card's `.icon-glass`). Purely visual, no config or behavior changes.

### 2.9.0
- Rewrote row rendering from a full `innerHTML` rebuild on every Home Assistant update to incremental DOM patching (existing row elements are updated in place, never replaced) - matches v1's approach
- Drag protection is now scoped per-row instead of globally: dragging one row's slider/ring no longer freezes every other row's updates
- Icon and tile glow are now plain CSS driven off `var(--c)` instead of JS-computed `color-mix()` strings, so they can never lag behind the row's current color, even mid-drag
- Fixes a bug where a light's tile/icon could briefly (or, in some cases, persistently until the slider was released) show the wrong color after a dashboard view or popup was freshly opened
- Added: tapping a row's name opens the entity's more-info dialog

### 2.8.7 and earlier
- Initial multi-row release (toggle/bar/gauge rows, templates, grid layout, `bg_opacity`)

## License

MIT
