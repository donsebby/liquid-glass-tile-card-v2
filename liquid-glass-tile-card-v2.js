const CARD_VERSION = '2.9.0';

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
  .pill.active, .bar-tile.active { box-shadow: inset 0 0 28px -10px color-mix(in srgb, var(--c) 45%, transparent); }
  .bar-tile { flex-direction:column; align-items:stretch; gap:10px; }
  .bar-tile .left { display:flex; align-items:center; gap:10px; min-width:0; }
  .left { display:flex; align-items:center; gap:10px; min-width:0; }
  .icon-box { width:34px; height:34px; flex:none; border-radius:11px; position:relative; display:flex; align-items:center;
    justify-content:center; backdrop-filter: blur(3px) saturate(140%); -webkit-backdrop-filter: blur(3px) saturate(140%);
    border: 1px solid color-mix(in srgb, ${INK} 18%, rgba(255,255,255,0.35));
    color: var(--primary-text-color, #fff); cursor:pointer; transition: box-shadow .12s ease, filter .12s ease, background .12s ease;
    background: linear-gradient(155deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.12) 100%);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.18); }
  .icon-box.active { background: linear-gradient(155deg, color-mix(in srgb, var(--c) 45%, rgba(255,255,255,0.3)) 0%, rgba(255,255,255,0.12) 45%, color-mix(in srgb, var(--c) 45%, rgba(255,255,255,0.3)) 100%);
    box-shadow: inset 0 0 12px color-mix(in srgb, var(--c) 40%, white), inset 0 1px 1px rgba(255,255,255,0.5), 0 0 14px -1px color-mix(in srgb, var(--c) 55%, transparent), 0 3px 8px -3px color-mix(in srgb, var(--c) 45%, transparent);
    filter: brightness(1.15) saturate(150%); }
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
    backdrop-filter: blur(3px); border:1px solid rgba(255,255,255,0.6);
    box-shadow: 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.15); }
  .gauge-tile { display:flex; flex-direction:column; align-items:center; cursor:pointer; min-width:0; box-sizing:border-box; }
  .ring { width:74px; height:74px; border-radius:50%; position:relative; display:flex; align-items:center; justify-content:center;
    background: conic-gradient(var(--c) 0deg, var(--pct), color-mix(in srgb, ${INK} 14%, transparent) 0deg);
    box-shadow:0 0 16px -4px var(--c); touch-action:none; cursor:grab; }
  .ring-inner { width:58px; height:58px; border-radius:50%; background: var(--card-background-color, #22232c);
    display:flex; align-items:center; justify-content:center; color: var(--secondary-text-color, rgba(255,255,255,0.7)); cursor:pointer;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.18); transition: box-shadow .12s ease, filter .12s ease; }
  .ring-inner.active { box-shadow: inset 0 0 12px color-mix(in srgb, var(--c) 40%, white), inset 0 1px 1px rgba(255,255,255,0.5), 0 0 14px -1px color-mix(in srgb, var(--c) 55%, transparent), 0 3px 8px -3px color-mix(in srgb, var(--c) 45%, transparent);
    filter: brightness(1.15) saturate(150%); }
  .ring-inner ha-icon { --mdc-icon-size: 20px; }
  .ring-lens { position:absolute; width:26px; height:16px; border-radius:999px;
    cursor:grab; background: linear-gradient(155deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.28) 100%);
    backdrop-filter: blur(3px); border:1px solid rgba(255,255,255,0.6);
    box-shadow: 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.15); }
`;

class LiquidGlassTileCardV2 extends HTMLElement {
  setConfig(config) {
    if (!config.rows || !Array.isArray(config.rows) || !config.rows.length) {
      throw new Error('liquid-glass-tile-card-v2: "rows" (array of entity configs) is required.');
    }
    this._config = config;
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
        { entity: 'sensor.spuelmaschine_fortschritt', type: 'gauge', max: 100 },
        { entity: 'number.einspeisevorgabe', type: 'bar', min: 0, max: 2000 },
      ],
    };
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

      // Name tap always opens HA's own more-info dialog - the color
      // wheel, color-temp slider etc. live there, and this is the one
      // place that shortcut should be reachable no matter what
      // tap_action is configured (dragging the tile itself sets
      // brightness, not color).
      const nameTap = e.target.closest('[data-action="name-tap"]');
      if (nameTap) {
        const row = this._config.rows[Number(nameTap.dataset.i)];
        if (row) {
          this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: row.entity } }));
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
  // always stay the warm default. Ported straight from v1's philosophy:
  // read whatever the CURRENT state object says, synchronously, every
  // time - no cache, no async history-API fallback. v1 never had any
  // version of the "yellow until released" bug precisely because it
  // never waited on anything; the moment a fresh hass tick carries the
  // real rgb_color/hs_color, the very next _patchRows() call (which now
  // runs unconditionally for color, drag or not) reflects it. A light
  // with no color info yet just shows the warm default for that one
  // tick, same as v1 always did - never gets artificially "stuck".
  _lightColor(stateObj) {
    const modes = stateObj?.attributes?.supported_color_modes;
    const trueColorCapable = Array.isArray(modes) && modes.some((m) => TRUE_COLOR_MODES.includes(m));
    if (trueColorCapable) {
      if (Array.isArray(stateObj.attributes.rgb_color)) {
        const [r, g, b] = stateObj.attributes.rgb_color;
        return `rgb(${r}, ${g}, ${b})`;
      }
      if (Array.isArray(stateObj.attributes.hs_color)) {
        return hsToRgbCss(stateObj.attributes.hs_color);
      }
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
    return domain === 'light' ? this._lightColor(stateObj) : PALETTE[i % PALETTE.length];
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

    const iconEl = tileEl ? tileEl.querySelector('.icon-box') : null;

    let lastSent = 0;
    let lastStep = -1;
    const sendNumeric = (pct, throttle) => {
      const now = Date.now();
      if (throttle && now - lastSent < 100) return;
      lastSent = now;
      this._setNumeric(row, pct);
    };

    const update = (ev) => {
      const rect = trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const fill = trackEl.querySelector('.fill'), lens = trackEl.querySelector('.lens');
      if (fill) fill.style.width = `${pct * 100}%`;
      if (lens) lens.style.left = `calc(13px + (100% - 26px) * ${pct})`;
      const liveActive = pct > 0.02;
      // Color needs no attention here anymore - it's a plain var(--c)
      // CSS reference that _patchRows() keeps current regardless of
      // drag state, so it can never go stale mid-gesture. Only the
      // active/inactive glow toggle needs a live update here, so the
      // tile lights up the instant the drag crosses ~0, before HA's
      // own state confirms "on" (that confirmation lags a round trip).
      if (tileEl) tileEl.classList.toggle('active', liveActive);
      if (iconEl) iconEl.classList.toggle('active', liveActive);
      this._pendingPct = pct;
    };

    const cleanup = () => {
      trackEl.removeEventListener('pointermove', onMove);
      trackEl.removeEventListener('pointerup', onUp);
      trackEl.removeEventListener('pointercancel', onCancel);
      if (tileEl) delete tileEl.dataset.dragging;
      // Catch up the fill/lens position to the final settled value now
      // that the drag guard is lifted.
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

    const iconEl = ringEl.querySelector('.ring-inner');

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
      const liveActive = pct > 0.02;
      // The ring's own conic-gradient background still has to be a
      // JS-computed string (dynamic angle), so it still needs a live
      // color re-read each move - same reasoning as the bar drag.
      // The inner icon's glow, though, is now a plain CSS var(--c) +
      // .active toggle, so it just needs the class flipped live.
      const liveColor = this._rowColor(row, i, this._hass.states[row.entity]);
      this._paintRing(ringEl, pct, liveColor, liveActive);
      if (iconEl) iconEl.classList.toggle('active', liveActive);
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
    ringEl.style.background = `conic-gradient(${color} 0deg, ${color} ${deg}deg, color-mix(in srgb, ${INK} 14%, transparent) ${deg}deg)`;
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
        const iconAttrs = domain === 'light' ? `data-action="icon-tap" data-i="${i}"` : `data-action="icon-inert"`;
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
        rowEl.style.setProperty('--c', color);
        const ringEl = rowEl.querySelector('.ring');
        if (ringEl) ringEl.style.setProperty('--c', color);
        // The inner icon's glow is plain CSS (var(--c) + .active), so
        // it's always safe to update regardless of drag state - only
        // the ring's own angle/lens position (a JS-computed string,
        // genuinely tied to the live pointer) stays frozen until
        // release.
        const ringInnerEl = rowEl.querySelector('.ring-inner');
        if (ringInnerEl) ringInnerEl.classList.toggle('active', active);
        if (!dragging) {
          this._paintRing(ringEl, pct, color, active);
        }
        return;
      }

      // bar
      const pct = this._pctFor(row, stateObj);
      rowEl.style.setProperty('--c', color);
      // Tile glow + icon glow are now plain CSS (var(--c) + .active),
      // so they're always safe to update regardless of drag state.
      // Only the fill width + lens left (the actual live position)
      // stay protected while this row is being dragged.
      rowEl.classList.toggle('active', active);
      const iconBox = rowEl.querySelector('.icon-box');
      if (iconBox) iconBox.classList.toggle('active', active);
      if (!dragging) {
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
