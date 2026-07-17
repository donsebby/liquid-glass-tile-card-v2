const CARD_VERSION = '2.8.7';

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
    border-radius:16px; padding:10px 12px; box-shadow: inset 0 0 24px -12px var(--c); cursor:pointer; }
  .bar-tile { flex-direction:column; align-items:stretch; gap:10px; }
  .bar-tile .left { display:flex; align-items:center; gap:10px; min-width:0; }
  .left { display:flex; align-items:center; gap:10px; min-width:0; }
  .icon-box { width:34px; height:34px; flex:none; border-radius:11px; position:relative; display:flex; align-items:center;
    justify-content:center; backdrop-filter: blur(3px) saturate(140%); -webkit-backdrop-filter: blur(3px) saturate(140%);
    border: 1px solid color-mix(in srgb, ${INK} 18%, rgba(255,255,255,0.35));
    color: var(--primary-text-color, #fff); cursor:pointer; transition: box-shadow .12s ease, filter .12s ease, background .12s ease; }
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
    display:flex; align-items:center; justify-content:center; color: var(--secondary-text-color, rgba(255,255,255,0.7)); cursor:pointer; }
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
    this._dragCount = 0;
    this._lastColor = this._lastColor || {};
    this._build();
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
    this._render();
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
    // binary_sensor has a meaningful "off" state too (window closed, no
    // motion, ...) so it glows conditionally just like lights/switches -
    // its raw state is always literally "on"/"off" regardless of
    // device_class (open/wet/motion/... are just frontend labels). Only
    // domains with no real off-state (numbers, plain sensors, ...) fall
    // through to "always show the accent".
    if (domain === 'light' || domain === 'binary_sensor' || domain === 'timer' || TOGGLE_DOMAINS.includes(domain)) {
      return !!stateObj && ['on', 'open', 'active'].includes(stateObj.state);
    }
    return true;
  }

  // Only lights that can genuinely display a hue (hs/rgb/xy/...) glow in
  // their actual set color; brightness-only and color-temp-only lights
  // always stay the warm default, same as everything else that isn't a
  // "colored lamp". `rgb_color` is only present in HA's state attributes
  // while the light is actually ON - HA strips it entirely while off
  // (confirmed: off-state attributes come back with rgb_color: null),
  // so a fresh card instance (Lovelace re-creates these on every view
  // switch) has no client-side memory of the color either. We cover
  // both gaps: an in-memory cache for "seen it on this session" lights,
  // and a background history lookup for lights we haven't.
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
      if (entityId) {
        if (this._lastColor[entityId]) return this._lastColor[entityId];
        this._fetchLastColor(entityId);
      }
    }
    return WARM_LIGHT_COLOR;
  }

  // One-shot (per entity, per card instance) background lookup of the
  // last color the light was actually showing, via HA's history API -
  // the only place that information still exists once the light is
  // off. Best-effort: if the recorder is disabled or the call fails, we
  // silently keep the warm default until the light turns back on for
  // real. On success we re-render so the icon picks up the real color
  // without the user having to touch anything.
  _fetchLastColor(entityId) {
    this._historyFetched = this._historyFetched || {};
    if (this._historyFetched[entityId] || !this._hass || typeof this._hass.callApi !== 'function') return;
    this._historyFetched[entityId] = true;
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const path = `history/period/${start}?filter_entity_id=${entityId}&minimal_response=false&no_attributes=false&significant_changes_only=false`;
    this._hass.callApi('GET', path).then((result) => {
      const entries = (result && result[0]) || [];
      for (let idx = entries.length - 1; idx >= 0; idx--) {
        const rgb = entries[idx] && entries[idx].attributes && entries[idx].attributes.rgb_color;
        if (Array.isArray(rgb)) {
          this._lastColor[entityId] = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
          this._render();
          return;
        }
      }
    }).catch(() => {});
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

  // Shared glow math behind both icon-box (pill/bar-tile) and ring-inner
  // (gauge) rendering - mirrors the v1 card's lit-knob behavior: a
  // frosted-glass chip that always keeps its translucent glass base,
  // with only the tinted glow (inset wash + outer halo) growing in
  // intensity - never a flat, fully opaque colored square. `pct` is
  // null for rows with no continuous level (plain toggles), which just
  // glow at full strength when on.
  _glowParts(active, color, pct) {
    if (!active) {
      return {
        bg: `linear-gradient(155deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.12) 100%)`,
        shadow: `inset 0 1px 1px rgba(255,255,255,0.18)`,
        filter: 'none',
      };
    }
    const p = pct == null ? 1 : Math.max(0.12, pct);
    const innerTint = `color-mix(in srgb, ${color} ${Math.round(30 + p * 35)}%, rgba(255,255,255,0.3))`;
    const glowColor = `color-mix(in srgb, ${color} ${Math.round(35 + p * 45)}%, transparent)`;
    const insetGlow = `color-mix(in srgb, ${color} ${Math.round(25 + p * 35)}%, white)`;
    const outerGlow = `color-mix(in srgb, ${color} 45%, transparent)`;
    return {
      bg: `linear-gradient(155deg, ${innerTint} 0%, rgba(255,255,255,0.12) 45%, ${innerTint} 100%)`,
      shadow: `inset 0 0 ${Math.round(8 + p * 8)}px ${insetGlow}, inset 0 1px 1px rgba(255,255,255,0.5), 0 0 ${Math.round(6 + p * 12)}px -1px ${glowColor}, 0 3px 8px -3px ${outerGlow}`,
      filter: `brightness(${(0.95 + p * 0.25).toFixed(2)}) saturate(${Math.round(105 + p * 55)}%)`,
    };
  }

  // Full frosted-glass icon: translucent tinted background + glow.
  _iconGlowStyle(active, color, pct) {
    const { bg, shadow, filter } = this._glowParts(active, color, pct);
    return `--c:${color}; background:${bg}; box-shadow:${shadow}; filter:${filter};`;
  }

  // Ring-inner keeps its own solid CSS background (it punches the
  // "donut hole" out of the conic-gradient ring) - only the glow/filter
  // portion is applied here, never the background.
  _ringInnerGlowStyle(active, color, pct) {
    const { shadow, filter } = this._glowParts(active, color, pct);
    return `--c:${color}; box-shadow:${shadow}; filter:${filter};`;
  }

  // Companion glow for the tile itself (the soft inset wash behind the
  // row), same intensity curve as the icon.
  _tileGlowShadow(active, color, pct) {
    if (!active) return 'none';
    const p = pct == null ? 1 : Math.max(0.12, pct);
    const blur = Math.round(16 + p * 16);
    const alpha = Math.round(15 + p * 35);
    return `inset 0 0 ${blur}px -12px color-mix(in srgb, ${color} ${alpha}%, transparent)`;
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
    // Optional power readout (mirrors v1's power_entity feature): if set,
    // this always wins over everything else - e.g. a toggle row for a
    // switch can show "12.3 W" instead of "An".
    if (row.power_entity) {
      const powerObj = this._hass.states[row.power_entity];
      const watts = powerObj ? parseFloat(powerObj.state) : NaN;
      if (Number.isFinite(watts)) return `${watts.toFixed(1)} W`;
    }
    // Custom string or `[[[ ]]]` template, e.g. a countdown or a
    // formatted status line.
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

  // Fires a haptic pulse via a bubbling custom event (for hosts that
  // listen for it, e.g. the Companion App) plus navigator.vibrate() as a
  // plain-browser fallback.
  _haptic(detail) {
    this.dispatchEvent(new CustomEvent('haptic', { bubbles: true, composed: true, detail }));
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(detail === 'medium' ? 14 : detail === 'light' ? 8 : 4);
    }
  }

  // -----------------------------------------------------------------
  // Drag handling
  //
  // Every drag increments/decrements a shared counter. While it's > 0,
  // _render() skips rebuilding the row DOM entirely - otherwise a
  // routine hass update from any unrelated entity elsewhere in the
  // system (which happens constantly on a live install) would replace
  // the track/ring element mid-gesture, killing the pointer capture
  // and aborting the drag. Listeners are always torn down via a single
  // cleanup path, including pointercancel, so an interrupted drag
  // (e.g. a scroll gesture stealing the pointer) can't leak listeners
  // or leave the counter stuck above zero.
  // -----------------------------------------------------------------

  _startBarDrag(e, trackEl) {
    const i = Number(trackEl.dataset.i);
    const row = this._config.rows[i];
    if (!this._isEditable(row)) return;

    this._dragCount++;
    trackEl.setPointerCapture(e.pointerId);

    const tileEl = trackEl.closest('[data-row-i]');
    const iconEl = tileEl ? tileEl.querySelector('.icon-box') : null;
    const stateObj = this._hass.states[row.entity];
    const color = this._rowColor(row, i, stateObj);

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
      // Inset by the lens's own half-width (13px) so the knob's circular
      // "lens" is always fully inside the track and never clips against
      // the tile's rounded corner at 0%/100% - see the matching markup
      // in _render() for the non-drag (rest state) placement.
      if (lens) lens.style.left = `calc(13px + (100% - 26px) * ${pct})`;
      // Live glow: the icon (and tile wash) brighten as the drag moves,
      // not only once _render() runs again after release - matches v1's
      // knob behavior. Treat the row as "active" the moment the drag
      // pushes past ~0, even before HA's own state confirms "on" (that
      // confirmation lags a round-trip behind the live pointer).
      const liveActive = pct > 0.02;
      if (iconEl) iconEl.style.cssText = this._iconGlowStyle(liveActive, color, pct);
      if (tileEl) tileEl.style.boxShadow = this._tileGlowShadow(liveActive, color, pct);
      this._pendingPct = pct;
    };

    const cleanup = () => {
      trackEl.removeEventListener('pointermove', onMove);
      trackEl.removeEventListener('pointerup', onUp);
      trackEl.removeEventListener('pointercancel', onCancel);
      this._dragCount = Math.max(0, this._dragCount - 1);
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

    this._dragCount++;
    ringEl.setPointerCapture(e.pointerId);

    const tileEl = ringEl.closest('[data-row-i]');
    const iconEl = ringEl.querySelector('.ring-inner');
    const stateObj = this._hass.states[row.entity];
    const color = this._rowColor(row, i, stateObj);

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
      this._paintRing(ringEl, pct, color, liveActive);
      if (iconEl) iconEl.style.cssText = this._ringInnerGlowStyle(liveActive, color, pct);
      this._pendingPct = pct;
    };

    const cleanup = () => {
      ringEl.removeEventListener('pointermove', onMove);
      ringEl.removeEventListener('pointerup', onUp);
      ringEl.removeEventListener('pointercancel', onCancel);
      this._dragCount = Math.max(0, this._dragCount - 1);
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

  _render() {
    if (!this._hass || !this._config) return;
    if (this._dragCount > 0) return; // a drag is in progress - don't yank the DOM out from under it

    const rows = this._config.rows;
    this._rowsEl.classList.toggle('grid', this._config.layout === 'grid');
    if (this._config.title) { this._titleEl.hidden = false; this._titleEl.textContent = this._config.title; }

    this._rowsEl.innerHTML = rows.map((row, i) => {
      const stateObj = this._hass.states[row.entity];
      const color = this._rowColor(row, i, stateObj);
      const name = row.name || stateObj?.attributes?.friendly_name || row.entity;
      const icon = row.icon || stateObj?.attributes?.icon || 'mdi:help-circle-outline';
      const type = row.type || 'toggle';
      const sub = this._subText(row, stateObj);

      const active = this._isActive(row, stateObj);
      const domain = this._domain(row.entity);

      if (type === 'toggle') {
        const on = active;
        // Only lights get the "tap the icon to turn it on" shortcut -
        // Steckdosen and other switch-like domains rely on the dedicated
        // toggle pill instead, so the icon stays inert for taps there.
        const iconAttrs = domain === 'light' ? `data-action="icon-tap" data-i="${i}"` : `data-action="icon-inert"`;
        // A binary_sensor (window/door contact, printer status, ...) has
        // no toggle service to call - showing a switch widget on it would
        // be a fake control. Domains HA can actually toggle get the real
        // switch pill; everything else is a plain read-only status row
        // (icon + name + state text), tappable for more-info like v1's
        // read-only tiles.
        const controllable = TOGGLE_DOMAINS.includes(domain);
        const switchHtml = controllable
          ? `<div class="toggle ${on ? 'on' : ''}" data-action="toggle" data-entity="${row.entity}"><div class="knob"></div></div>`
          : '';
        return `<div class="pill" data-row-i="${i}" style="--c:${color}; box-shadow:${this._tileGlowShadow(on, color, null)}">
          <div class="left"><div class="icon-box" style="${this._iconGlowStyle(on, color, null)}" ${iconAttrs}><ha-icon icon="${icon}"></ha-icon></div>
            <div class="text"><div class="name">${name}</div><div class="sub">${sub}</div></div></div>
          ${switchHtml}
        </div>`;
      }
      if (type === 'gauge') {
        const pct = this._pctFor(row, stateObj);
        const deg = pct * 360;
        const theta = pct * 2 * Math.PI, r = 33, c = 37;
        const lx = c + r * Math.sin(theta), ly = c - r * Math.cos(theta);
        const ringBg = active
          ? `conic-gradient(${color} 0deg, ${color} ${deg}deg, color-mix(in srgb, ${INK} 14%, transparent) ${deg}deg)`
          : `color-mix(in srgb, ${INK} 14%, transparent)`;
        return `<div class="gauge-tile" data-row-i="${i}">
          <div class="ring" style="--c:${color};background:${ringBg};box-shadow:${this._ringHaloShadow(active, color, pct)}"
               data-action="drag-ring" data-i="${i}">
            <div class="ring-inner" style="${this._ringInnerGlowStyle(active, color, pct)}" data-action="icon-tap" data-i="${i}"><ha-icon icon="${icon}"></ha-icon></div>
            <div class="ring-lens" style="left:${lx}px;top:${ly}px;transform:translate(-50%,-50%) rotate(${deg}deg)"></div>
          </div>
          <div class="text center"><div class="name">${name}</div><div class="sub">${sub}</div></div>
        </div>`;
      }
      const pct = this._pctFor(row, stateObj);
      return `<div class="bar-tile" data-row-i="${i}" style="--c:${color}; box-shadow:${this._tileGlowShadow(active, color, pct)}">
        <div class="left"><div class="icon-box" style="${this._iconGlowStyle(active, color, pct)}" data-action="icon-tap" data-i="${i}"><ha-icon icon="${icon}"></ha-icon></div>
          <div class="text"><div class="name">${name}</div><div class="sub">${sub}</div></div></div>
        <div class="track" data-action="drag-bar" data-i="${i}">
          <div class="fill" style="width:${pct * 100}%; ${active ? '' : 'box-shadow:none;'}"></div>
          <div class="lens" style="left:calc(13px + (100% - 26px) * ${pct})"></div>
        </div>
      </div>`;
    }).join('');
  }
}

customElements.define('liquid-glass-tile-card-v2', LiquidGlassTileCardV2);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'liquid-glass-tile-card-v2',
  name: 'Liquid Glass Tile Card v2',
  description: 'Glassmorphes Entity-Tile mit Toggle-Pillen, Fortschrittsbalken und Ring-Gauge, jeweils mit ziehbarer Glaslinse.',
});
