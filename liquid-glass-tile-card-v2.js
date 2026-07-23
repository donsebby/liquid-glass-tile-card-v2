const CARD_VERSION = '2.10.0';

// eslint-disable-next-line no-console
console.info(
  `%c LIQUID-GLASS-TILE-CARD-V2 %c v${CARD_VERSION} `,
  'color: white; background: #a78bfa; font-weight: 700;',
  'color: #a78bfa; background: white; font-weight: 700;'
);

const PALETTE = ['#a78bfa', '#d9b45c', '#5ec6c2', '#7bbf6a', '#5ea8d9', '#e0b84a', '#8a95a5', '#e07bc0'];
const TOGGLE_DOMAINS = ['light', 'switch', 'input_boolean', 'fan', 'siren'];
// Modes that mean "this light can actually display a hue", as opposed to
// only brightness or only color temperature (adjustable white). Lights
// without one of these always fall back to the warm default below,
// regardless of whatever rgb_color HA may have derived for them.
const TRUE_COLOR_MODES = ['hs', 'rgb', 'rgbw', 'rgbww', 'xy'];
const WARM_LIGHT_COLOR = '#FFC168';

// hs_color -> rgb() conversion, used as a synchronous fallback when HA's
// derived `rgb_color` attribute isn't (yet) present on the state object
// but `hs_color` already is. Cheap defensive addition - the real fix for
// the "yellow until you release the slider" bug is the incremental
// patching below, not this, but there's no reason to wait on the async
// history API round trip when hs_color already tells us the color.
function hsToRgbCss([h, s]) {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const hue = ((h % 360) + 360) % 360;
  const c = sat, x = c * (1 - Math.abs(((hue / 60) % 2) - 1)), m = 1 - c;
  let r1, g1, b1;
  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const r = Math.round((r1 + m) * 255), g = Math.round((g1 + m) * 255), b = Math.round((b1 + m) * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

// Neutral surfaces are mixed with the theme's own text color instead of a
// hardcoded white, so they stay visible on both dark AND light HA themes
// (a flat rgba(255,255,255,x) all but disappears on a light background).
const INK = 'var(--primary-text-color, #fff)';

const STYLE = `
  :host { display:block; font-family: var(--paper-font-body1_-_font-family, Helvetica, Arial, sans-serif); }
  .card { background: color-mix(in oklch, var(--card-background-color, #17181f) var(--bg-pct, 70%), transparent);
    backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%);
    border: 1px solid color-mix(in srgb, ${INK} 12%, transparent); border-radius: 20px;
    padding: 18px; box-shadow: 0 20px 40px -20px rgba(0,0,0,0.35), inset 0 1px 0 color-mix(in srgb, ${INK} 10%, transparent); }
  .title { color: var(--primary-text-color, rgba(255,255,255,0.9)); font-size: 14px; font-weight: 600; margin-bottom: 14px; opacity: 0.85; }
  .rows { display:flex; flex-direction:column; gap:10px; }
  .rows.grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; align-items:stretch; }
  .pill, .bar-tile { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; box-sizing:border-box;
    background: color-mix(in srgb, ${INK} 7%, transparent); border:1px solid color-mix(in srgb, ${INK} 10%, transparent);
    border-radius:16px; padding:10px 12px; cursor:pointer; }
  .pill.active, .bar-tile.active { box-shadow: inset 0 0 calc(16px + var(--glow, 1) * 12px) -10px color-mix(in srgb, var(--c) calc(15% + var(--glow, 1) * 30%), transparent); }
  .bar-tile { flex-direction:column; align-items:stretch; gap:10px; }
  .bar-tile .left { display:flex; align-items:center; gap:10px; min-width:0; }
  .left { display:flex; align-items:center; gap:10px; min-width:0; }
  .icon-box { width:34px; height:34px; flex:none; border-radius:11px; position:relative; display:flex; align-items:center;
    justify-content:center;
    border: 1px solid color-mix(in srgb, ${INK} 26%, rgba(255,255,255,0.5));
    color: var(--primary-text-color, #fff); cursor:pointer; transition: box-shadow .12s ease, filter .12s ease, background .12s ease;
    background: linear-gradient(155deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.22) 45%, rgba(255,255,255,0.4) 100%);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.28), inset 2px 0 4px rgba(80,200,255,0.28), inset -2px 0 4px rgba(255,90,190,0.25); }
  .icon-box.active { background: linear-gradient(155deg, color-mix(in srgb, var(--c) calc(30% + var(--glow, 1) * 35%), rgba(255,255,255,0.3)) 0%, rgba(255,255,255,0.12) 45%, color-mix(in srgb, var(--c) calc(30% + var(--glow, 1) * 35%), rgba(255,255,255,0.3)) 100%);
    box-shadow: inset 0 0 calc(8px + var(--glow, 1) * 8px) color-mix(in srgb, var(--c) calc(25% + var(--glow, 1) * 35%), white), inset 0 1px 1px rgba(255,255,255,0.5), 0 0 calc(6px + var(--glow, 1) * 12px) -1px color-mix(in srgb, var(--c) calc(35% + var(--glow, 1) * 45%), transparent), 0 3px 8px -3px color-mix(in srgb, var(--c) 45%, transparent), inset 2px 0 4px rgba(80,200,255,0.24), inset -2px 0 4px rgba(255,90,190,0.22);
    filter: brightness(calc(0.95 + var(--glow, 1) * 0.25)) saturate(calc(105% + var(--glow, 1) * 55%)); }
  .icon-box ha-icon { --mdc-icon-size: 18px; }
  .text { min-width:0; }
  .text.center { text-align:center; margin-top:10px; }
  .name { color: var(--primary-text-color, rgba(255,255,255,0.95)); font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sub { color: var(--secondary-text-color, rgba(255,255,255,0.55)); font-size:11.5px; margin-top:2px; }
  .toggle { width:46px; height:26px; flex:none; border-radius:999px; background: color-mix(in srgb, ${INK} 14%, transparent);
    position:relative; cursor:pointer; transition: background .2s ease; }
  .toggle.on { background: linear-gradient(90deg, var(--c) 0%, var(--c) 100%); box-shadow: 0 0 14px -2px var(--c); }
  .toggle .knob { width:20px; height:20px; border-radius:50%; background:#fff; position:absolute; top:3px; left:3px;
    transition:left .2s ease; box-shadow:0 2px 4px rgba(0,0,0,0.3); }
  .toggle.on .knob { left:23px; }
  .track { width:100%; height:8px; border-radius:999px; background: color-mix(in srgb, ${INK} 14%, transparent);
    position:relative; touch-action:none; cursor:grab; }
  .track .fill { position:absolute; top:0; left:0; height:100%; border-radius:999px; background:var(--c); box-shadow:0 0 10px -2px var(--c); }
  .lens { position:absolute; top:50%; width:26px; height:16px; border-radius:999px; transform:translate(-50%,-50%);
    cursor:grab; background: linear-gradient(155deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.28) 100%);
    backdrop-filter: blur(3px) saturate(220%) brightness(1.35); border:1px solid rgba(255,255,255,0.6);
    box-shadow: 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.15),
      inset 2px 0 5px rgba(80,200,255,0.32), inset -2px 0 5px rgba(255,90,190,0.3); }
  .gauge-tile { display:flex; flex-direction:column; align-items:center; cursor:pointer; min-width:0; box-sizing:border-box; }
  .ring { width:74px; height:74px; border-radius:50%; position:relative; display:flex; align-items:center; justify-content:center;
    background: conic-gradient(var(--c) 0deg, var(--pct), transparent 0deg);
    box-shadow:0 0 16px -4px var(--c); touch-action:none; cursor:grab; }
  .ring-inner { width:58px; height:58px; border-radius:50%; background: color-mix(in srgb, var(--card-background-color, #f4f4f6) 90%, ${INK} 10%); border: 1px solid color-mix(in srgb, ${INK} 14%, transparent);
    display:flex; align-items:center; justify-content:center; color: var(--secondary-text-color, rgba(255,255,255,0.7)); cursor:pointer;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); transition: filter .12s ease; }
  .ring-inner.active { filter: brightness(calc(1 + var(--glow, 0) * 0.15)); }
  .ring-inner ha-icon { --mdc-icon-size: 20px; }
  .ring-lens { position:absolute; width:26px; height:16px; border-radius:999px;
    cursor:grab; background: linear-gradient(155deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.28) 100%);
    backdrop-filter: blur(3px) saturate(220%) brightness(1.35); border:1px solid rgba(255,255,255,0.6);
    box-shadow: 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.15),
      inset 2px 0 5px rgba(80,200,255,0.32), inset -2px 0 5px rgba(255,90,190,0.3); }
`;

class LiquidGlassTileCardV2 extends HTMLElement {
  setConfig(config) {
    if (!config.rows || !Array.isArray(config.rows) || !config.rows.length) {
      throw new Error('liquid-glass-tile-card-v2: "rows" (array of entity configs) is required.');
    }
    this._config = config;
    this._lastColor = this._lastColor || {};
    this._build();
    this._buildRows();
    // bg_opacity (0-1, matching v1's convention) controls how solid the
    // card's own backdrop reads - lower values let more of the dashboard
    // background/blur show through, e.g. to match native cards like
    // mushroom-climate-card that sit more transparently on the page.
    if (this._cardEl) {
      if (config.bg_opacity != null) {
        const pct = Math.max(0, Math.min(100, config.bg_opacity * 100));
        this._cardEl.style.setProperty('--bg-pct', pct + '%');
      } else {
        this._cardEl.style.removeProperty('--bg-pct');
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._patchRows();
  }

  getCardSize() { return Math.ceil((this._config?.rows?.length || 1) * 1.1) + 1; }

  static getStubConfig() {
    return {
      type: 'custom:liquid-glass-tile-card-v2',
      title: 'Wohnzimmer',
      layout: 'list',
      rows: [
        { entity: 'switch.tv_steckdose', type: 'toggle' },
      ],
    };
  }

  // Visual editor support. Without this, Home Assistant's dashboard
  // editor falls back to YAML-only. Advanced per-row fields that are JS
  // templates ([[[ ... ]]] for color/progress/state_text) and tap_action
  // stay YAML-only on purpose - a visual builder for arbitrary JS isn't
  // a good trade of effort for value; everything else (entity, type,
  // name, icon, min/max, hide_track) is editable visually, including a
  // live ha-entity-picker for the entity field.
  static getConfigElement() {
    return document.createElement('liquid-glass-tile-card-v2-editor');
  }

  _build() {
    if (this._built) return;
    this._built = true;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="card"><div class="title" hidden></div><div class="rows"></div></div>`;
    this._rowsEl = this.shadowRoot.querySelector('.rows');
    this._titleEl = this.shadowRoot.querySelector('.title');
    this._cardEl = this.shadowRoot.querySelector('.card');

    this.shadowRoot.addEventListener('click', (e) => {
      // Most specific target first: the dedicated toggle switch always
      // just toggles, no matter what tap_action says (it's its one job).
      const t = e.target.closest('[data-action="toggle"]');
      if (t) { this._toggle(t.dataset.entity); return; }

      // Steckdosen (and other non-light toggle domains) deliberately
      // don't toggle from an icon tap - only lights get that shortcut.
      // Swallow the tap here so it can't fall through to the whole-tile
      // fallback below and toggle anyway.
      if (e.target.closest('[data-action="icon-inert"]')) return;

      // Icon tap is a quick shortcut independent of dragging - resolves
      // through the same tap_action logic as everything else.
      const icon = e.target.closest('[data-action="icon-tap"]');
      if (icon) {
        const row = this._config.rows[Number(icon.dataset.i)];
        if (row) this._handleTap(row);
        return;
      }

      // Name tap: a row with an explicit tap_action runs that action.
      // Rows without one keep the original behavior - HA's own more-info
      // dialog, where the color wheel/color-temp slider for lights live
      // (dragging the tile itself sets brightness, not color).
      const nameTap = e.target.closest('[data-action="name-tap"]');
      if (nameTap) {
        const row = this._config.rows[Number(nameTap.dataset.i)];
        if (row) {
          if (row.tap_action) {
            this._handleTap(row);
          } else {
            this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: row.entity } }));
          }
        }
        return;
      }

      // Fallback: tapping anywhere else on a row. For draggable rows
      // (dimmable lights/numbers) this is a no-op - the track/ring
      // pointerdown already owns taps there and sets a value by
      // position, same as v1's slider chips. For everything else
      // (switches, read-only progress/gauge rows, plain sensors) the
      // whole tile is one big tap target, exactly like v1.
      const rowEl = e.target.closest('[data-row-i]');
      if (rowEl) {
        const row = this._config.rows[Number(rowEl.dataset.rowI)];
        if (row && !this._isEditable(row)) this._handleTap(row);
      }
    });
    this.shadowRoot.addEventListener('pointerdown', (e) => {
      const track = e.target.closest('[data-action="drag-bar"]');
      const ring = e.target.closest('[data-action="drag-ring"]');
      if (track) this._startBarDrag(e, track);
      else if (ring) this._startRingDrag(e, ring);
    });
  }

  _domain(entityId) { return entityId.split('.')[0]; }

  // ---------------------------------------------------------------------
  // Templates - `[[[ ... ]]]` runs as a JS expression with `states`,
  // `hass` and `entity` (this row's own state object) in scope. Anything
  // else (a plain string/number) passes straight through unchanged, so
  // existing configs without templates keep working exactly as before.
  // ---------------------------------------------------------------------
  _resolveTemplate(template, entityId) {
    if (template == null) return null;
    if (typeof template !== 'string') return template;
    const match = /^\s*\[\[\[([\s\S]*)\]\]\]\s*$/.exec(template);
    if (!match) return template;
    try {
      const states = this._hass.states;
      const entity = states[entityId];
      // eslint-disable-next-line no-new-func
      const fn = new Function('states', 'hass', 'entity', match[1]);
      return fn(states, this._hass, entity);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('liquid-glass-tile-card-v2: template error', err);
      return null;
    }
  }

  _toggle(entityId) {
    const domain = this._domain(entityId);
    const service = domain === 'switch' ? 'switch' : domain === 'light' ? 'light' : 'homeassistant';
    this._hass.callService(service, 'toggle', { entity_id: entityId });
    this._haptic('light');
  }

  // Runs a tap_action-shaped object. Default resolution (no explicit
  // tap_action on the row) mirrors v1: toggle for switch-like domains,
  // more-info for everything else (sensors, numbers, ...).
  _performAction(action, entityId) {
    if (!action || action.action === 'none') return;
    // A confirmation prompt guards potentially destructive actions (e.g.
    // stopping a running dishwasher/printer) - applies regardless of the
    // underlying action type, same as v1.
    if (action.confirmation) {
      const text = (typeof action.confirmation === 'object' && action.confirmation.text) || 'Bist du sicher?';
      if (!window.confirm(text)) return;
    }
    if (action.action === 'toggle') {
      this._toggle(entityId);
      return; // _toggle already fires its own haptic
    }
    if (action.action === 'more-info') {
      this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId } }));
    } else if (action.action === 'navigate' && action.navigation_path) {
      if (action.navigation_path.startsWith('#')) {
        window.location.hash = action.navigation_path;
      } else {
        window.history.pushState(null, '', action.navigation_path);
        window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
      }
    } else if ((action.action === 'call-service' || action.action === 'perform-action') && (action.service || action.perform_action)) {
      const [svcDomain, service] = (action.service || action.perform_action).split('.');
      this._hass.callService(svcDomain, service, action.service_data || action.data || {}, action.target || {});
    }
    this._haptic('light');
  }

  _handleTap(row) {
    const domain = this._domain(row.entity);
    const action = row.tap_action || { action: TOGGLE_DOMAINS.includes(domain) ? 'toggle' : 'more-info' };
    this._performAction(action, row.entity);
  }

  // Whether a row should show its accent color/glow at all. Lights and
  // toggle-domain entities (switches, etc.) only glow while actually on -
  // otherwise the tile sits neutral/grey. Numbers, input_numbers and
  // plain sensors have no "off" state to speak of, so they always keep
  // their accent color.
  _isActive(row, stateObj) {
    const domain = this._domain(row.entity);
    if (domain === 'light' || domain === 'binary_sensor' || domain === 'timer' || TOGGLE_DOMAINS.includes(domain)) {
      return !!stateObj && ['on', 'open', 'active'].includes(stateObj.state);
    }
    return true;
  }

  // Only lights that can genuinely display a hue (hs/rgb/xy/...) glow in
  // their actual set color; brightness-only and color-temp-only lights
  // always stay the warm default. Reads the CURRENT state synchronously
  // every time - no network, no async history-API lookup. Fallback: if
  // this specific tick's state doesn't give us a definitive color (the
  // rgb_color/hs_color fields are missing, or during a fast drag firing
  // brightness-only turn_on calls every ~100ms, even the whole
  // attributes bag can occasionally arrive momentarily incomplete
  // before a physical device's next full report), fall back to the
  // last real color we saw for this entity rather than flash the warm
  // default. This is a plain in-memory dictionary, only ever written
  // when a real color passed the trueColorCapable check below - so it
  // can never tint a light that genuinely doesn't support color, even
  // though the fallback itself doesn't re-check trueColorCapable.
  _lightColor(stateObj, entityId) {
    const modes = stateObj?.attributes?.supported_color_modes;
    const trueColorCapable = Array.isArray(modes) && modes.some((m) => TRUE_COLOR_MODES.includes(m));
    if (trueColorCapable) {
      if (Array.isArray(stateObj.attributes.rgb_color)) {
        const [r, g, b] = stateObj.attributes.rgb_color;
        const color = `rgb(${r}, ${g}, ${b})`;
        if (entityId) this._lastColor[entityId] = color;
        return color;
      }
      if (Array.isArray(stateObj.attributes.hs_color)) {
        const color = hsToRgbCss(stateObj.attributes.hs_color);
        if (entityId) this._lastColor[entityId] = color;
        return color;
      }
    }
    if (entityId && this._lastColor[entityId]) {
      return this._lastColor[entityId];
    }
    return WARM_LIGHT_COLOR;
  }

  _rowColor(row, i, stateObj) {
    if (row.color) {
      const resolved = this._resolveTemplate(row.color, row.entity);
      if (resolved) return resolved; // template resolved to a real color - use it
      // template resolved to null/falsy ("no tint right now") - fall
      // through to the same default any untinted row would get.
    }
    const domain = this._domain(row.entity);
    return domain === 'light' ? this._lightColor(stateObj, row.entity) : PALETTE[i % PALETTE.length];
  }

  _setNumeric(row, pct) {
    const domain = this._domain(row.entity);
    const min = row.min ?? 0, max = row.max ?? 100;
    const value = Math.round((min + (max - min) * pct) * 100) / 100;
    if (domain === 'number') this._hass.callService('number', 'set_value', { entity_id: row.entity, value });
    else if (domain === 'input_number') this._hass.callService('input_number', 'set_value', { entity_id: row.entity, value });
    else if (domain === 'light') this._hass.callService('light', 'turn_on', { entity_id: row.entity, brightness_pct: Math.round(pct * 100) });
  }

  // A row with a `progress` template is always read-only (its position
  // is driven entirely by the template's return value), regardless of
  // domain - mirrors v1's read-only progress chips.
  _isEditable(row) {
    if (row.progress) return false;
    return ['number', 'input_number', 'light'].includes(this._domain(row.entity));
  }

  _pctFor(row, stateObj) {
    if (row.progress) {
      const val = this._resolveTemplate(row.progress, row.entity);
      const num = typeof val === 'number' ? val : parseFloat(val);
      return Number.isFinite(num) ? Math.max(0, Math.min(1, num / 100)) : 0;
    }
    if (!stateObj) return 0;
    const domain = this._domain(row.entity);
    if (domain === 'light' && stateObj.attributes.brightness != null) {
      return Math.max(0, Math.min(1, stateObj.attributes.brightness / 255));
    }
    const val = parseFloat(stateObj.state);
    if (isNaN(val)) return 0;
    const min = row.min ?? 0, max = row.max ?? 100;
    return Math.max(0, Math.min(1, (val - min) / (max - min)));
  }

  _subText(row, stateObj) {
    if (row.power_entity) {
      const powerObj = this._hass.states[row.power_entity];
      const watts = powerObj ? parseFloat(powerObj.state) : NaN;
      if (Number.isFinite(watts)) return `${watts.toFixed(1)} W`;
    }
    if (row.state_text) {
      const resolved = this._resolveTemplate(row.state_text, row.entity);
      if (resolved != null && resolved !== '') return resolved;
    }
    if (!stateObj) return 'nicht verfügbar';
    const unit = stateObj.attributes.unit_of_measurement;
    if (['on', 'off', 'open', 'closed'].includes(stateObj.state)) {
      return stateObj.state === 'open' ? 'Geöffnet' : stateObj.state === 'closed' ? 'Geschlossen' : stateObj.state === 'on' ? 'An' : 'Aus';
    }
    return unit ? `${stateObj.state} ${unit}` : stateObj.state;
  }

  _haptic(detail) {
    this.dispatchEvent(new CustomEvent('haptic', { bubbles: true, composed: true, detail }));
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(detail === 'medium' ? 14 : detail === 'light' ? 8 : 4);
    }
  }

  // -----------------------------------------------------------------
  // Drag handling
  //
  // Unlike the old global `_dragCount` gate (which blocked ALL rows'
  // updates the moment ANY row was being dragged), each drag now marks
  // only its own row element (`dataset.dragging`). _patchRows() checks
  // that per row: the dragged row's live position/glow stays exactly
  // where the pointer left it, but every other row - and even this
  // row's name/icon/color - keeps updating immediately. This mirrors
  // v1's `!el.dataset.dragging` guard, adapted to v2's richer per-pct
  // glow (which v1 didn't need to guard because its glow is pure CSS
  // driven off a custom property, not recomputed per render).
  // -----------------------------------------------------------------

  _startBarDrag(e, trackEl) {
    const i = Number(trackEl.dataset.i);
    const row = this._config.rows[i];
    if (!this._isEditable(row)) return;

    const tileEl = trackEl.closest('[data-row-i]');
    if (tileEl) tileEl.dataset.dragging = '1';
    trackEl.setPointerCapture(e.pointerId);

    let lastSent = 0;
    let lastStep = -1;
    const sendNumeric = (pct, throttle) => {
      const now = Date.now();
      if (throttle && now - lastSent < 100) return;
      lastSent = now;
      this._setNumeric(row, pct);
    };

    // Position + glow intensity only - mirrors v1's _applyBarFill /
    // _applySliderGlow exactly. Color/active (which hue, and whether
    // it's tinted at all) are never touched here; they're 100% owned
    // by _patchRows(), which runs unconditionally every hass tick
    // regardless of drag state (matching v1's tint line). --glow is a
    // plain intensity number (how strong the glow reads, scaling with
    // brightness%) - purely CSS-composed with --c via calc()/color-mix
    // in the stylesheet, so, like --c, it can never go stale requiring
    // an explicit repaint. Nothing here paints anything before the
    // first real pointermove, same as v1's pointerdown handler, which
    // only arms the drag and doesn't call its onMove callback until
    // movement actually happens.
    const update = (ev) => {
      const rect = trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const fill = trackEl.querySelector('.fill'), lens = trackEl.querySelector('.lens');
      if (fill) fill.style.width = `${pct * 100}%`;
      if (lens) lens.style.left = `calc(13px + (100% - 26px) * ${pct})`;
      if (tileEl) tileEl.style.setProperty('--glow', Math.max(0.12, pct));
      this._pendingPct = pct;
    };

    const cleanup = () => {
      trackEl.removeEventListener('pointermove', onMove);
      trackEl.removeEventListener('pointerup', onUp);
      trackEl.removeEventListener('pointercancel', onCancel);
      if (tileEl) delete tileEl.dataset.dragging;
      this._patchRows();
    };

    const onMove = (ev) => {
      update(ev);
      const step = Math.floor(this._pendingPct * 10);
      if (step !== lastStep) {
        lastStep = step;
        this._haptic(step >= 8 ? 'medium' : step >= 4 ? 'light' : 'selection');
      }
      sendNumeric(this._pendingPct, true); // live while dragging, throttled
    };
    const onUp = (ev) => {
      update(ev);
      sendNumeric(this._pendingPct, false); // final value, unthrottled
      cleanup();
    };
    const onCancel = () => cleanup();

    trackEl.addEventListener('pointermove', onMove);
    trackEl.addEventListener('pointerup', onUp);
    trackEl.addEventListener('pointercancel', onCancel);
  }

  _startRingDrag(e, ringEl) {
    const i = Number(ringEl.dataset.i);
    const row = this._config.rows[i];
    if (!this._isEditable(row)) return;

    const tileEl = ringEl.closest('[data-row-i]');
    if (tileEl) tileEl.dataset.dragging = '1';
    ringEl.setPointerCapture(e.pointerId);

    // Captured once, not re-read per move: _patchRows() just ran
    // unconditionally on the last hass tick before this drag started,
    // so this is already current. The ring's conic-gradient bakes
    // color and angle into one string, so position updates need a
    // color value to paint with - but the drag itself never decides
    // on/off or re-derives color, exactly like the bar drag above.
    const color = this._rowColor(row, i, this._hass.states[row.entity]);
    const active = this._isActive(row, this._hass.states[row.entity]);

    let lastSent = 0;
    let lastStep = -1;
    const sendNumeric = (pct, throttle) => {
      const now = Date.now();
      if (throttle && now - lastSent < 100) return;
      lastSent = now;
      this._setNumeric(row, pct);
    };

    const update = (ev) => {
      const rect = ringEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      let deg = Math.atan2(ev.clientX - cx, -(ev.clientY - cy)) * 180 / Math.PI;
      if (deg < 0) deg += 360;
      const pct = deg / 360;
      this._paintRing(ringEl, pct, color, active);
      if (tileEl) tileEl.style.setProperty('--glow', Math.max(0.12, pct));
      this._pendingPct = pct;
    };

    const cleanup = () => {
      ringEl.removeEventListener('pointermove', onMove);
      ringEl.removeEventListener('pointerup', onUp);
      ringEl.removeEventListener('pointercancel', onCancel);
      if (tileEl) delete tileEl.dataset.dragging;
      this._patchRows();
    };

    const onMove = (ev) => {
      update(ev);
      const step = Math.floor(this._pendingPct * 10);
      if (step !== lastStep) {
        lastStep = step;
        this._haptic(step >= 8 ? 'medium' : step >= 4 ? 'light' : 'selection');
      }
      sendNumeric(this._pendingPct, true); // live while dragging, throttled
    };
    const onUp = (ev) => {
      update(ev);
      sendNumeric(this._pendingPct, false); // final value, unthrottled
      cleanup();
    };
    const onCancel = () => cleanup();

    update(e);
    ringEl.addEventListener('pointermove', onMove);
    ringEl.addEventListener('pointerup', onUp);
    ringEl.addEventListener('pointercancel', onCancel);
  }

  // Outer halo around the ring track - same intensity curve as the icon
  // glow, kept in its own helper so render-time and live-drag-time stay
  // in sync instead of duplicating the formula in two places.
  _ringHaloShadow(active, color, pct) {
    if (!active) return 'none';
    const p = Math.max(0.12, pct);
    return `0 0 ${Math.round(10 + p * 12)}px -4px color-mix(in srgb, ${color} ${Math.round(35 + p * 45)}%, transparent)`;
  }

  _paintRing(ringEl, pct, color, active) {
    const deg = pct * 360;
    ringEl.style.background = `conic-gradient(${color} 0deg, ${color} ${deg}deg, transparent ${deg}deg)`;
    if (active !== undefined) ringEl.style.boxShadow = this._ringHaloShadow(active, color, pct);
    const lens = ringEl.querySelector('.ring-lens');
    if (lens) {
      const theta = pct * 2 * Math.PI, r = 33, c = 37;
      const x = c + r * Math.sin(theta), y = c - r * Math.cos(theta);
      lens.style.left = `${x}px`;
      lens.style.top = `${y}px`;
      lens.style.transform = `translate(-50%,-50%) rotate(${deg}deg)`;
    }
  }

  // -----------------------------------------------------------------
  // Row skeleton + incremental patching
  //
  // _buildRows() runs rarely (only from setConfig, i.e. when the card's
  // configuration itself changes) and constructs the static DOM shape
  // per row type once. _patchRows() runs on every hass tick and only
  // ever touches existing nodes' text/attributes/style - it never
  // replaces the row elements, so a drag's pointer capture on a track
  // or ring is never at risk, and no global "skip everything" guard is
  // needed anymore. This is the architectural piece ported from v1
  // that actually fixes the color-flash bug (see card changelog).
  // -----------------------------------------------------------------

  _buildRows() {
    const rows = this._config.rows;
    this._rowsEl.classList.toggle('grid', this._config.layout === 'grid');
    if (this._config.title) {
      this._titleEl.hidden = false;
      this._titleEl.textContent = this._config.title;
    } else {
      this._titleEl.hidden = true;
    }

    this._rowsEl.innerHTML = rows.map((row, i) => {
      const type = row.type || 'toggle';
      const domain = this._domain(row.entity);

      if (type === 'toggle') {
        // Icon is tappable for lights (original behavior) or any row with
        // an explicit tap_action configured - previously swallowed/inert
        // for every non-light domain regardless of tap_action.
        const iconAttrs = (domain === 'light' || row.tap_action) ? `data-action="icon-tap" data-i="${i}"` : `data-action="icon-inert"`;
        const controllable = TOGGLE_DOMAINS.includes(domain);
        const switchHtml = controllable
          ? `<div class="toggle" data-action="toggle" data-entity="${row.entity}"><div class="knob"></div></div>`
          : '';
        return `<div class="pill" data-row-i="${i}">
          <div class="left"><div class="icon-box" ${iconAttrs}><ha-icon></ha-icon></div>
            <div class="text"><div class="name" data-action="name-tap" data-i="${i}"></div><div class="sub"></div></div></div>
          ${switchHtml}
        </div>`;
      }
      if (type === 'gauge') {
        return `<div class="gauge-tile" data-row-i="${i}">
          <div class="ring" data-action="drag-ring" data-i="${i}">
            <div class="ring-inner" data-action="icon-tap" data-i="${i}"><ha-icon></ha-icon></div>
            <div class="ring-lens"></div>
          </div>
          <div class="text center"><div class="name" data-action="name-tap" data-i="${i}"></div><div class="sub"></div></div>
        </div>`;
      }
      // bar
      // `hide_track: true` on a bar row skips the visual progress
      // track/fill/lens entirely - for rows that are pure tap-action
      // buttons rather than a real progress/percentage display.
      // _patchRows() already null-checks fillEl/lensEl, so omitting
      // them here is safe.
      if (row.hide_track) {
        return `<div class="bar-tile" data-row-i="${i}">
          <div class="left"><div class="icon-box" data-action="icon-tap" data-i="${i}"><ha-icon></ha-icon></div>
            <div class="text"><div class="name" data-action="name-tap" data-i="${i}"></div><div class="sub"></div></div></div>
        </div>`;
      }
      return `<div class="bar-tile" data-row-i="${i}">
        <div class="left"><div class="icon-box" data-action="icon-tap" data-i="${i}"><ha-icon></ha-icon></div>
          <div class="text"><div class="name" data-action="name-tap" data-i="${i}"></div><div class="sub"></div></div></div>
        <div class="track" data-action="drag-bar" data-i="${i}">
          <div class="fill"></div>
          <div class="lens"></div>
        </div>
      </div>`;
    }).join('');

    this._patchRows();
  }

  _patchRows() {
    if (!this._hass || !this._config || !this._rowsEl) return;

    this._config.rows.forEach((row, i) => {
      const rowEl = this._rowsEl.querySelector(`[data-row-i="${i}"]`);
      if (!rowEl) return;

      const stateObj = this._hass.states[row.entity];
      const color = this._rowColor(row, i, stateObj);
      const name = row.name || stateObj?.attributes?.friendly_name || row.entity;
      const icon = row.icon || stateObj?.attributes?.icon || 'mdi:help-circle-outline';
      const type = row.type || 'toggle';
      const sub = this._subText(row, stateObj);
      const active = this._isActive(row, stateObj);
      // Only bar/gauge rows are draggable, and only this specific row's
      // own element carries the flag while its own drag is in progress.
      const dragging = rowEl.dataset.dragging === '1';

      // Always safe to patch, drag or not: text and icon never conflict
      // with a live pointer gesture.
      const nameEl = rowEl.querySelector('.name');
      const subEl = rowEl.querySelector('.sub');
      const iconEl = rowEl.querySelector('ha-icon');
      if (nameEl) nameEl.textContent = name;
      if (subEl) subEl.textContent = sub;
      if (iconEl) iconEl.setAttribute('icon', icon);

      if (type === 'toggle') {
        const on = active;
        rowEl.style.setProperty('--c', color);
        rowEl.classList.toggle('active', on);
        const iconBox = rowEl.querySelector('.icon-box');
        if (iconBox) iconBox.classList.toggle('active', on);
        const toggleEl = rowEl.querySelector('.toggle');
        if (toggleEl) toggleEl.classList.toggle('on', on);
        return;
      }

      if (type === 'gauge') {
        const pct = this._pctFor(row, stateObj);
        // Mirrors v1 exactly: color/active-state are a pure function of
        // the real entity state and update on every hass tick no
        // matter what - a drag never overrides them and never gets
        // overridden by them. Only the ring's own angle/lens position
        // AND the pct-scaled glow intensity (v1's _applySliderGlow
        // equivalent - brighter light, stronger glow) are genuinely
        // tied to the live pointer and stay frozen until release.
        rowEl.style.setProperty('--c', color);
        const ringEl = rowEl.querySelector('.ring');
        if (ringEl) ringEl.style.setProperty('--c', color);
        const ringInnerEl = rowEl.querySelector('.ring-inner');
        if (ringInnerEl) ringInnerEl.classList.toggle('active', active);
        if (!dragging) {
          rowEl.style.setProperty('--glow', active ? Math.max(0.12, pct) : 0);
          this._paintRing(ringEl, pct, color, active);
        }
        return;
      }

      // bar
      const pct = this._pctFor(row, stateObj);
      // Same principle as gauge: color/active always reflect the real
      // current state, drag or not - mirrors v1's tint line, which is
      // never gated by dragging either. Only the fill width + lens
      // left (the actual live position) AND the pct-scaled glow
      // intensity stay protected while this row is being dragged.
      rowEl.style.setProperty('--c', color);
      rowEl.classList.toggle('active', active);
      const iconBox = rowEl.querySelector('.icon-box');
      if (iconBox) iconBox.classList.toggle('active', active);
      if (!dragging) {
        rowEl.style.setProperty('--glow', active ? Math.max(0.12, pct) : 0);
        const fillEl = rowEl.querySelector('.fill');
        const lensEl = rowEl.querySelector('.lens');
        if (fillEl) {
          fillEl.style.width = `${pct * 100}%`;
          fillEl.style.boxShadow = active ? '' : 'none';
        }
        if (lensEl) lensEl.style.left = `calc(13px + (100% - 26px) * ${pct})`;
      }
    });
  }
}

customElements.define('liquid-glass-tile-card-v2', LiquidGlassTileCardV2);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'liquid-glass-tile-card-v2',
  name: 'Liquid Glass Tile Card v2',
  description: 'Glassmorphes Multi-Row Entity-Tile mit Toggle-Pillen, Fortschrittsbalken und Ring-Gauge, jeweils mit ziehbarer Glaslinse.',
});

// ---------------------------------------------------------------------
// Visual editor. Handles card-level fields (title, layout, bg_opacity)
// and per-row basics (entity via ha-entity-picker with a plain-text
// fallback, type, name, icon, min/max, hide_track). Anything
// JS-template-shaped (color/progress/state_text templates, tap_action)
// is left for YAML editing - editing arbitrary JS in a visual form
// isn't a good trade of effort for value.
//
// Row DOM is only fully rebuilt when the row COUNT changes (add/remove/
// move) - a plain value change (typing in a field) patches values in
// place instead, so focus and the entity-picker's own internal search
// state survive re-renders triggered by our own config-changed events.
// ---------------------------------------------------------------------
class LiquidGlassTileCardV2Editor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // Keep any already-created entity pickers current without touching
    // their value/search state.
    if (this._pickers) {
      this._pickers.forEach((p) => { if (p) p.hass = hass; });
    }
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _emit(newConfig) {
    this._config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: newConfig }, bubbles: true, composed: true }));
  }

  _updateTop(key, value) {
    const next = { ...this._config, [key]: value };
    if (value === '' || value == null) delete next[key];
    this._emit(next);
  }

  _updateRow(i, key, value) {
    const rows = this._config.rows.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, [key]: value };
      if (value === '' || value === false || value == null) delete next[key];
      return next;
    });
    this._emit({ ...this._config, rows });
  }

  _addRow() {
    this._emit({ ...this._config, rows: [...(this._config.rows || []), { entity: '', type: 'toggle' }] });
  }

  _removeRow(i) {
    this._emit({ ...this._config, rows: this._config.rows.filter((_, idx) => idx !== i) });
  }

  _moveRow(i, dir) {
    const rows = [...this._config.rows];
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    this._emit({ ...this._config, rows });
  }

  _setIfDiff(el, value) {
    if (el && el.value !== String(value ?? '')) el.value = value ?? '';
  }

  _render() {
    if (!this._config) return;
    if (!this._built) {
      this._built = true;
      this._pickers = [];
      this._rowCount = -1;
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;font-size:13px}
        .s{margin-bottom:14px}.st{font-weight:600;opacity:.7;margin-bottom:6px}
        .f{display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap}
        label{min-width:75px;opacity:.85}
        input[type=text],input[type=number],select{flex:1;min-width:100px;padding:5px 7px;border-radius:6px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color,#000);font-size:13px}
        input[type=range]{flex:1}
        .ep-host{flex:1;min-width:100px}
        .ep-host ha-entity-picker{width:100%}
        .rc{border:1px solid var(--divider-color,#ccc);border-radius:10px;padding:8px;margin-bottom:8px}
        .rh{display:flex;justify-content:space-between;margin-bottom:4px}
        .ra button{background:none;border:none;cursor:pointer;font-size:14px;padding:2px 5px;opacity:.7}
        .ab{background:var(--primary-color,#03a9f4);color:#fff;border:none;border-radius:8px;padding:7px 12px;cursor:pointer}
        .cb{display:flex;align-items:center;gap:6px}
        .hint{font-size:11px;opacity:.6;margin-top:4px}
        </style>
        <div class="s"><div class="st">Karte</div>
        <div class="f"><label>Titel</label><input type="text" data-top="title"></div>
        <div class="f"><label>Layout</label><select data-top="layout"><option value="list">Liste</option><option value="grid">Grid (2 Spalten)</option></select></div>
        <div class="f"><label>Transparenz</label><input type="range" min="0" max="1" step="0.05" data-top="bg_opacity"><span data-top-display="bg_opacity" style="font-size:12px;min-width:32px"></span></div>
        </div>
        <div class="s"><div class="st">Zeilen</div><div class="rh2"></div><button class="ab" type="button">+ Zeile</button></div>
        <div class="hint">Templates (color/progress/state_text) und tap_action bitte im YAML-Modus bearbeiten.</div>`;
      this.shadowRoot.querySelector('[data-top="title"]').addEventListener('input', (e) => this._updateTop('title', e.target.value));
      this.shadowRoot.querySelector('[data-top="layout"]').addEventListener('change', (e) => this._updateTop('layout', e.target.value));
      this.shadowRoot.querySelector('[data-top="bg_opacity"]').addEventListener('input', (e) => this._updateTop('bg_opacity', parseFloat(e.target.value)));
      this.shadowRoot.querySelector('.ab').addEventListener('click', () => this._addRow());
    }

    this._setIfDiff(this.shadowRoot.querySelector('[data-top="title"]'), this._config.title || '');
    const layoutEl = this.shadowRoot.querySelector('[data-top="layout"]');
    if (layoutEl.value !== (this._config.layout || 'list')) layoutEl.value = this._config.layout || 'list';
    const bgVal = this._config.bg_opacity != null ? this._config.bg_opacity : 0.7;
    this._setIfDiff(this.shadowRoot.querySelector('[data-top="bg_opacity"]'), bgVal);
    this.shadowRoot.querySelector('[data-top-display="bg_opacity"]').textContent = bgVal;

    const rows = this._config.rows || [];
    if (rows.length !== this._rowCount) {
      this._rowCount = rows.length;
      this._buildRowsDom(rows);
    } else {
      this._patchRowsDom(rows);
    }
  }

  _buildRowsDom(rows) {
    const host = this.shadowRoot.querySelector('.rh2');
    this._pickers = [];
    host.innerHTML = rows.map((row, i) => `<div class="rc" data-i="${i}">
      <div class="rh"><b>Zeile ${i + 1}</b>
        <span class="ra"><button type="button" data-act="up">\u25b2</button><button type="button" data-act="down">\u25bc</button><button type="button" data-act="del">\u2715</button></span></div>
      <div class="f"><label>Entity</label><div class="ep-host" data-ep="${i}"></div></div>
      <div class="f"><label>Typ</label><select data-field="type"><option value="toggle">toggle</option><option value="bar">bar</option><option value="gauge">gauge</option></select></div>
      <div class="f"><label>Name</label><input type="text" data-field="name" placeholder="(Entity-Name)"></div>
      <div class="f"><label>Icon</label><input type="text" data-field="icon" placeholder="mdi:..."></div>
      <div class="f" data-only="bar,gauge"><label>Min</label><input type="number" data-field="min" placeholder="0"><label>Max</label><input type="number" data-field="max" placeholder="100"></div>
      <div class="f cb" data-only="bar"><label style="min-width:auto">Leiste ausblenden</label><input type="checkbox" data-field="hide_track"></div>
      </div>`).join('');

    rows.forEach((row, i) => {
      const card = host.querySelector(`[data-i="${i}"]`);

      // Entity field: ha-entity-picker if the HA frontend has it
      // registered (it always does in practice), plain text as a
      // defensive fallback.
      const epHost = card.querySelector(`[data-ep="${i}"]`);
      let picker;
      if (customElements.get('ha-entity-picker')) {
        picker = document.createElement('ha-entity-picker');
        picker.hass = this._hass;
        picker.value = row.entity || '';
        picker.allowCustomEntity = true;
        picker.addEventListener('value-changed', (e) => {
          e.stopPropagation();
          this._updateRow(i, 'entity', e.detail.value || '');
        });
      } else {
        picker = document.createElement('input');
        picker.type = 'text';
        picker.placeholder = 'z.B. binary_sensor.xyz';
        picker.value = row.entity || '';
        picker.addEventListener('input', (e) => this._updateRow(i, 'entity', e.target.value));
      }
      epHost.appendChild(picker);
      this._pickers[i] = picker.tagName === 'HA-ENTITY-PICKER' ? picker : null;

      card.querySelector('[data-field="type"]').value = row.type || 'toggle';
      card.querySelector('[data-field="name"]').value = row.name || '';
      card.querySelector('[data-field="icon"]').value = row.icon || '';
      const minEl = card.querySelector('[data-field="min"]');
      const maxEl = card.querySelector('[data-field="max"]');
      if (minEl) minEl.value = row.min != null ? row.min : '';
      if (maxEl) maxEl.value = row.max != null ? row.max : '';
      const hideTrackEl = card.querySelector('[data-field="hide_track"]');
      if (hideTrackEl) hideTrackEl.checked = !!row.hide_track;

      const applyVisibility = () => {
        const type = card.querySelector('[data-field="type"]').value;
        card.querySelectorAll('[data-only]').forEach((el) => {
          el.style.display = el.dataset.only.split(',').includes(type) ? '' : 'none';
        });
      };
      applyVisibility();

      card.querySelector('[data-field="type"]').addEventListener('change', (e) => this._updateRow(i, 'type', e.target.value));
      card.querySelector('[data-field="name"]').addEventListener('input', (e) => this._updateRow(i, 'name', e.target.value));
      card.querySelector('[data-field="icon"]').addEventListener('input', (e) => this._updateRow(i, 'icon', e.target.value));
      if (minEl) minEl.addEventListener('input', (e) => this._updateRow(i, 'min', e.target.value === '' ? null : parseFloat(e.target.value)));
      if (maxEl) maxEl.addEventListener('input', (e) => this._updateRow(i, 'max', e.target.value === '' ? null : parseFloat(e.target.value)));
      if (hideTrackEl) hideTrackEl.addEventListener('change', (e) => this._updateRow(i, 'hide_track', e.target.checked));

      card.querySelector('[data-act="up"]').addEventListener('click', () => this._moveRow(i, -1));
      card.querySelector('[data-act="down"]').addEventListener('click', () => this._moveRow(i, 1));
      card.querySelector('[data-act="del"]').addEventListener('click', () => this._removeRow(i));
    });
  }

  _patchRowsDom(rows) {
    const host = this.shadowRoot.querySelector('.rh2');
    rows.forEach((row, i) => {
      const card = host.querySelector(`[data-i="${i}"]`);
      if (!card) return;

      const picker = this._pickers[i];
      if (picker) {
        picker.hass = this._hass;
        if (picker.value !== (row.entity || '')) picker.value = row.entity || '';
      } else {
        const plain = card.querySelector(`[data-ep="${i}"] input`);
        this._setIfDiff(plain, row.entity || '');
      }

      const typeEl = card.querySelector('[data-field="type"]');
      if (typeEl.value !== (row.type || 'toggle')) {
        typeEl.value = row.type || 'toggle';
        card.querySelectorAll('[data-only]').forEach((el) => {
          el.style.display = el.dataset.only.split(',').includes(typeEl.value) ? '' : 'none';
        });
      }
      this._setIfDiff(card.querySelector('[data-field="name"]'), row.name || '');
      this._setIfDiff(card.querySelector('[data-field="icon"]'), row.icon || '');
      const minEl = card.querySelector('[data-field="min"]');
      const maxEl = card.querySelector('[data-field="max"]');
      if (minEl) this._setIfDiff(minEl, row.min != null ? row.min : '');
      if (maxEl) this._setIfDiff(maxEl, row.max != null ? row.max : '');
      const hideTrackEl = card.querySelector('[data-field="hide_track"]');
      if (hideTrackEl) hideTrackEl.checked = !!row.hide_track;
    });
  }
}

customElements.define('liquid-glass-tile-card-v2-editor', LiquidGlassTileCardV2Editor);
