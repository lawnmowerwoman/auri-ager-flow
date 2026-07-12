/*
 * Auri Ager Framework
 * Bundled Home Assistant custom cards for calm energy, status and dashboard visualization.
 *
 * Includes Flow, Summary, Finance, Gauge, Sun, Status, Control, Value,
 * Camera, Entities, Micro Entity, Progress, Thermometer and Markdown cards.
 *
 * A framework to optimize the life standard of a German Shepherd dog named Baro 🐾
 *
 * Copyright (c) 2026 Stefanie Ramroth
 * Licensed under the Apache License, Version 2.0
 * You may obtain a copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Assembled by 00Auri ✨
 * Source modules included below without minification for easier debugging.
 *
 * ----------------------------------------------------------------------------
 * Version: 1.0.1
 * Status : Stable Release
 *
 * Release history:
 *
 * 0.1.0
 * - Initial Flow concept
 * - Custom SVG layout
 * - Animated flow pills
 *
 * 0.1.1
 * - Renderer optimization via snapshot + requestAnimationFrame
 * - Secondary self-consumption ring
 * - Battery runtime support
 * - External source / behind_home topology
 * - Mini status card integration
 * - Flow threshold handling
 *
 * Version: 0.1.2-dev
 * Status : Layout variants + clickable entities
 * Theme abstraction layer
 * COLOR_SCHEMES support
 * Dark mode implementation
 *
 * Version: 0.2
 * Visual Editor
 * Hide Zeroes option
 *
 * 1.0.0
 * - Initial public release
 * - Flow Card
 * - Summary Card
 * - Finance Card
 * - Gauge Card
 * - Sun Card
 * - Status Card
 * - Progress Card
 * - Entity Grid Card
 * - Entities Card
 * - Thermometer Card
 * - Markdown Card
 * - Visual Editors
 * - Dark Mode
 * - Theme System
 * - Clickable Entities
 * - Flow Animations
 * - Hide Zeroes
 * 
 * 1.0.1
 * - Fixed Flow header scaling on small displays
 * - Added max_width option to Flow Card
 * - Improved Entity Grid auto layout
 * - Renamed MicroEntityCard to EntityGridCard
 * - Minor visual adjustments
 *
 * 1.0.2
 * - Added Summary Card editor
 * - Added Finance Card editor
 * - Added compact layout support to EntityGridCard
 * - Added configurable icon_size to EntityGridCard
 * - Added show_value option to EntityGridCard
 * - Improved compact presence/status dashboards
 * - Minor editor and visual refinements
 *
 * Planned:
 * - Localization / configurable labels
 *
 * Design philosophy:
 * Motion indicates flow.
 * Values indicate magnitude.
 * Calmness is a feature.
 */
/*
 * Auri Ager Base Card
 *
 */

class AuriAgerBaseCard extends HTMLElement {
  static COLOR_SCHEMES = {
    light: {
      cardBg: "#ffffff",
      cardBorder: "rgba(0,0,0,.06)",
      accent: "#f5b82e",
      icon: "rgba(60,60,60,.70)",
      label: "rgba(60,60,60,.65)",
      small: "rgba(60,60,60,.55)",
      value: "rgba(25,25,25,.95)",
      line: "rgba(100,100,100,.14)",
      subBg: "rgba(0,0,0,.025)",
      positive: "#5aa44c",
      negative: "#d36b5f",
    },
    dark: {
      cardBg: "#1f2326",
      cardBorder: "rgba(255,255,255,.08)",
      accent: "#f5b82e",
      icon: "rgba(220,225,228,.68)",
      label: "rgba(220,225,228,.64)",
      small: "rgba(220,225,228,.52)",
      value: "rgba(245,247,248,.94)",
      line: "rgba(255,255,255,.10)",
      subBg: "rgba(255,255,255,.035)",
      positive: "#75bd68",
      negative: "#e18276",
    },
  };

  setConfig(config) {
    this.config = config;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._built = false;
    this._lastSnapshot = null;
  }

	trackedEntities() {
		return [];
	}
	
	stateSnapshot() {
		return this.trackedEntities()
			.map((entity) => {
				const stateObj = this._hass?.states?.[entity];
	
				return [
					entity,
					stateObj?.state ?? "",
					stateObj?.last_changed ?? "",
				].join(":");
			})
			.join("|");
	}
	
	needsLiveUpdates() {
  	return false;
	}

	set hass(hass) {
		this._hass = hass;
	
		if (!this._built) {
			this.buildStaticDom();
			this._built = true;
			this._lastSnapshot = this.stateSnapshot();
			this.updateDynamicDom();
			return;
		}
	
	  if (this.needsLiveUpdates()) {
   	 this.updateDynamicDom();
    	return;
	  }

		const snapshot = this.stateSnapshot();
	
		if (snapshot !== this._lastSnapshot) {
			this._lastSnapshot = snapshot;
			this.updateDynamicDom();
		}
	}

  themeMode() {
    const configured = this.config?.theme ?? "auto";
    if (configured !== "auto") return configured;
    return this._hass?.themes?.darkMode ? "dark" : "light";
  }

  colors() {
    return AuriAgerBaseCard.COLOR_SCHEMES[this.themeMode()]
      ?? AuriAgerBaseCard.COLOR_SCHEMES.light;
  }
  
  accentColor() {
    const C = this.colors();
    const scheme_accent_color = C.accent;

	  return (
  	  this.config.accent_color ??
    	this.config.accent ?? scheme_accent_color
  	);
	}

  hasEntity(entity) {
    return typeof entity === "string" && entity.trim().length > 0;
  }

  value(entity, fallback = 0) {
    if (!entity) return fallback;

    const raw = this._hass?.states?.[entity]?.state;
    const value = Number(raw);

    return Number.isFinite(value) ? value : fallback;
  }

	/*
  stateSnapshot() {
    const entities = this.config?.entities ?? {};

    return Object.values(entities)
      .filter(Boolean)
      .map((id) => `${id}:${this._hass?.states?.[id]?.state ?? ""}`)
      .join("|");
  }
  */

	escapeHtml(value) {
		return String(value ?? "")
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}
	
	isClickableFor(item) {
		return !!(item?.entity || item?.tap_action || item?.navigation_path || item?.url_path);
	}
	
	buildStaticDom() {
		// Default no-op for cards that use dynamic DOM hooks.
	}

  setText(selector, value) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.textContent = value ?? "";
  }

  setHTML(selector, value) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.innerHTML = value ?? "";
  }

  setVisible(selector, visible) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.style.display = visible ? "" : "none";
  }

  fmtMoney(value) {
	  const showCents = this.config.show_cents ?? false;
	  const abs = Math.abs(value);
	  const sign = value < 0 ? "-" : "";

	  const digits = showCents && abs < 1000 ? 2 : 0;

	  return `${sign}${abs.toLocaleString("de-DE", {
	    minimumFractionDigits: digits,
	    maximumFractionDigits: digits,
	  })} €`;

		/* Old Logic
    if (abs >= 1000) {
      return `${sign}${abs.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} €`;
    }

    return `${sign}${abs.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`;
    */
  }

  icon(name) {
    const icons = {
      savings: "mdi:piggy-bank-outline",
      battery: "mdi:battery-charging-medium",
      direct: "mdi:home-lightning-bolt",
      export: "mdi:transmission-tower-export",
      import: "mdi:transmission-tower-import",
      sum: "mdi:sigma",
      fiction: "mdi:calculator-variant-outline",
      gauge: "mdi:gauge",
      autarky: "mdi:home-lightning-bolt",
      self: "mdi:solar-power-variant",
    };

    return icons[name] ?? "mdi:chart-box-outline";
  }

	fireMoreInfo(entityId) {
		if (!entityId) return;
	
		this.dispatchEvent(
			new CustomEvent("hass-more-info", {
				bubbles: true,
				composed: true,
				detail: { entityId },
			})
		);
	}
	
	attachEntityClick(selector, entityId) {
		const el = this.shadowRoot?.querySelector(selector);
		if (!el || !entityId) return;
	
		el.classList.add("clickable");
		el.addEventListener("click", () => this.fireMoreInfo(entityId));
	}

  baseStyles(accent) {
    const C = this.colors();
    const accent_color = accent ?? C.accent;

    return `
      ha-card {
        padding: 22px;
        border-radius: 24px;
        background: ${C.cardBg};
        border: 1px solid ${C.cardBorder};
        box-shadow: none;
        font-family: var(--ha-font-family-body, system-ui);
      }

      .header {
        display: grid;
        grid-template-columns: 8px 1fr;
        gap: 14px;
        align-items: start;
        margin-bottom: 18px;
      }

      .accent {
        width: 8px;
        height: 42px;
        border-radius: 4px;
        background: ${accent_color};
      }

			.clickable {
				cursor: pointer;
			}
			
			.clickable:hover {
				opacity: .82;
			}
			
			.clickable:active {
				opacity: .65;
			}

			.clickable-entity {
				cursor: pointer;
			}
			
			.clickable-entity:hover {
				filter: brightness(0.96);
			}

      .title {
        font-size: 20px;
        font-weight: 750;
        color: ${C.value};
        line-height: 1.1;
        padding-bottom: 3px;
        transform: translateY(-2px);
      }

      .subtitle {
        margin-top: 1px;
        font-size: 13px;
        color: ${C.small};
      }
    `;
  }
}

class AuriAgerEditorBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    this.bindEntityPickers();
    this.bindIconPickers();
  }

  setConfig(config) {
    this._config = {
      ...(this.constructor.cardClass?.getStubConfig?.() ?? {}),
      ...(config ?? {}),
    };

    this.render();
  }

  cloneConfig(config) {
    if (window.structuredClone) return structuredClone(config);
    return JSON.parse(JSON.stringify(config ?? {}));
  }

  escapeHtml(value) {
    return `${value ?? ""}`
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  valueAtPath(source, path) {
    return path
      .split(".")
      .reduce((value, key) => value?.[key], source);
  }

  updateConfig(path, value) {
    const config = this.cloneConfig(this._config);
    const parts = path.split(".");
    let target = config;

    while (parts.length > 1) {
      const key = parts.shift();
      target[key] = target[key] ?? {};
      target = target[key];
    }

    if (value === "" || value === undefined) {
      delete target[parts[0]];
    } else {
      target[parts[0]] = value;
    }

    this.dispatchConfig(config);
  }

  dispatchConfig(config) {
    this._config = config;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  editorStyles() {
    return `
      .editor {
        display: grid;
        gap: 14px;
        padding: 16px;
        font-family: var(--ha-font-family-body, system-ui);
      }

      .editor-card {
        display: grid;
        gap: 12px;
        padding: 12px;
        border: 1px solid rgba(120,120,120,.20);
        border-radius: 14px;
      }

      .section-title {
        font-size: 13px;
        font-weight: 700;
        opacity: .72;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 12px;
        opacity: .86;
      }

      input,
      textarea,
      select,
      ha-icon-picker,
      ha-entity-picker {
        box-sizing: border-box;
        width: 100%;
      }

      input,
      textarea,
      select {
        padding: 9px 10px;
        border-radius: 10px;
        border: 1px solid rgba(120,120,120,.35);
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #202426);
        font: inherit;
      }

      textarea {
        min-height: 180px;
        resize: vertical;
        line-height: 1.45;
      }

      input[type="color"] {
        height: 42px;
        padding: 4px;
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
      }

      .checkbox-row input {
        width: auto;
      }

      .list {
        display: grid;
        gap: 8px;
      }

      .list-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        padding: 9px 10px;
        border-radius: 12px;
        background: rgba(120,120,120,.08);
      }

      .item-card {
        display: grid;
        gap: 10px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(120,120,120,.08);
      }

      .drag-handle {
        cursor: grab;
        opacity: .62;
        font-weight: 800;
      }

      .row-main {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
      }

      .row-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      button {
        border: 1px solid rgba(120,120,120,.35);
        border-radius: 10px;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #202426);
        padding: 7px 10px;
        font: inherit;
        cursor: pointer;
      }

      .button-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .detail-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
    `;
  }

  renderInput(path, label, value = this.valueAtPath(this._config, path), type = "text") {
    if (type === "text" && this.isIconPath(path)) {
      return this.renderIconPicker(path, label, value);
    }

    return `
      <label>
        <span>${label}</span>
        <input type="${type}" data-path="${path}" value="${this.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  renderSelect(path, label, value = this.valueAtPath(this._config, path), options = []) {
    return `
      <label>
        <span>${label}</span>
        <select data-path="${path}">
          ${options
            .map(([v, text]) => `
              <option value="${this.escapeHtml(v)}" ${value === v ? "selected" : ""}>
                ${this.escapeHtml(text)}
              </option>
            `)
            .join("")}
        </select>
      </label>
    `;
  }

  renderCheckbox(path, label, checked = this.valueAtPath(this._config, path) === true) {
    return `
      <label class="checkbox-row">
        <input type="checkbox" data-path="${path}" ${checked ? "checked" : ""}>
        <span>${label}</span>
      </label>
    `;
  }

  renderEntityPicker(path, label, value = this.valueAtPath(this._config, path)) {
    return `
      <label>
        <span>${label}</span>
        <ha-entity-picker
          data-path="${path}"
          data-value="${this.escapeHtml(value ?? "")}"
          allow-custom-entity>
        </ha-entity-picker>
      </label>
    `;
  }

  isIconPath(path) {
    return /(^|_)(icon|icon_on|icon_off)$/.test(path) ||
      path.endsWith(".icon") ||
      path.endsWith("_icon");
  }

  renderIconPicker(path, label, value = this.valueAtPath(this._config, path)) {
    return `
      <label>
        <span>${label}</span>
        <ha-icon-picker
          data-path="${path}"
          data-value="${this.escapeHtml(value ?? "")}">
        </ha-icon-picker>
      </label>
    `;
  }

  bindBasicControls() {
    this.shadowRoot.querySelectorAll("input[data-path], select[data-path], textarea[data-path]").forEach((el) => {
      el.addEventListener("change", (ev) => {
        let value = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
        if (ev.target.type === "number") value = ev.target.value === "" ? "" : Number(ev.target.value);
        this.updateConfig(ev.target.dataset.path, value);
      });
    });

    this.bindEntityPickers();
    this.bindIconPickers();
  }

  bindEntityPickers() {
    this.shadowRoot.querySelectorAll("ha-entity-picker[data-path]").forEach((el) => {
      const path = el.dataset.path;
      el.hass = this._hass;
      el.value = this.valueAtPath(this._config, path) ?? el.dataset.value ?? "";

      if (el._auriBound) return;
      el._auriBound = true;

      el.addEventListener("value-changed", (ev) => {
        this.updateConfig(path, ev.detail.value ?? "");
      });
    });
  }

  bindIconPickers() {
    this.shadowRoot.querySelectorAll("ha-icon-picker[data-path]").forEach((el) => {
      const path = el.dataset.path;
      el.hass = this._hass;
      el.value = this.valueAtPath(this._config, path) ?? el.dataset.value ?? "";

      if (el._auriBound) return;
      el._auriBound = true;

      el.addEventListener("value-changed", (ev) => {
        this.updateConfig(path, ev.detail.value ?? "");
      });
    });
  }

  renderStandardEditor(sections = []) {
    this.shadowRoot.innerHTML = `
      <style>${this.editorStyles()}</style>
      <div class="editor">
        ${sections
          .map((section) => `
            <div class="editor-card">
              <div class="section-title">${this.escapeHtml(section.title)}</div>
              ${section.body}
            </div>
          `)
          .join("")}
      </div>
    `;

    this.bindBasicControls();
  }
}
/*
 * Auri Ager Container Card
 *
 * Wraps arbitrary Lovelace cards in Auri Ager design language.
 */

class AuriAgerContainerCard extends AuriAgerBaseCard {
	static getStubConfig() {
		return {
			type: "custom:auri-ager-container-card",
			title: "Container",
			subtitle: "",
			accent_color: "#f5b82e",
	
			show_inner_border: true,
			content_padding: 12,
			hide_inner_header: false,
			content_height: null,
	
			cards: [],
		};
	}

  setConfig(config) {
    super.setConfig(config);

    this._cards = [];
  }

  getCardSize() {
    return 4;
  }

  stateSnapshot() {
    return JSON.stringify(this.config?.cards ?? []);
  }

	styles() {
		const C = this.colors();
	
		const showBorder =
			this.config.show_inner_border ?? true;
	
		const padding =
			this.config.content_padding ?? 12;
	
		const height =
			this.config.content_height;
	
		return `
			<style>
				${this.baseStyles(this.config.accent_color)}
	
				ha-card {
					padding: 22px;
				}
	
				.content {
					display: grid;
					gap: 12px;
					padding: ${padding}px;
				}
	
				.content > * {
					overflow: hidden;
					border: ${showBorder ? `1px solid ${C.cardBorder}` : "none"};
					border-radius: 20px;
					${height ? `max-height: ${height}px;` : ""}
				}
			</style>
		`;
	}

  async buildStaticDom() {
    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <div class="header">
          <div class="accent"></div>
          <div>
            <div id="container-title" class="title"></div>
            <div id="container-subtitle" class="subtitle"></div>
          </div>
        </div>

        <div id="container-content" class="content"></div>
      </ha-card>
    `;

    await this.buildChildCards();
  }

	async buildChildCards() {
		const content = this.shadowRoot.querySelector("#container-content");
		if (!content) return;
	
		content.innerHTML = "";
		this._cards = [];
	
		const helpers = await window.loadCardHelpers();
		const cards = this.config.cards ?? [];
	
		for (const cardConfig of cards) {
			const card = await helpers.createCardElement(cardConfig);
			card.hass = this._hass;
	
			if ((this.config.content_padding ?? 12) === 0) {
				card.style.padding = "0";
				card.style.margin = "0";
			}
	
			this._cards.push(card);
			content.appendChild(card);
	
			if (this.config.hide_inner_header) {
				card.updateComplete?.then(() => {
					const root = card.shadowRoot ?? card;
	
					root.querySelector(".header")?.remove();
					root.querySelector(".card-header")?.remove();
					root.querySelector("h1")?.remove();
				});
			}
		}
	}

  updateDynamicDom() {
    this.setText("#container-title", this.config.title ?? "");
    this.setText("#container-subtitle", this.config.subtitle ?? "");

    for (const card of this._cards ?? []) {
      card.hass = this._hass;
    }
  }
}

customElements.define("auri-ager-container-card", AuriAgerContainerCard);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-container-card",
  name: "Auri Ager Container",
  description: "Container for elements like cameras in Auri Ager design",
  preview: true,
});/*
 * Auri Ager Entities Card
 *
 * Generic entity list card with optional header, row icons,
 * multiple values, captions, dividers and status highlighting.
 */

class AuriAgerEntitiesCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-entities-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-entities-card",
      title: "Entities",
      subtitle: "",
      header_icon: "mdi:format-list-bulleted",
      accent_color: "#f5b82e",
      theme: "auto",
      show_header: true,
      line_spacing: "normal",
      column_width: 64,
      caption: [],
      entities: [],
    };
  }

  getCardSize() {
    return 3;
  }

  accentColor() {
    return this.config?.accent_color ?? this.config?.accent ?? "#f5b82e";
  }

  valueCount() {
    const captionCount = this.config?.caption?.length ?? 0;
    const rowMax = Math.max(
      1,
      ...(this.config?.entities ?? [])
        .filter((row) => !row.divider)
        .map((row) => this.rowValues(row).length),
    );

    return Math.max(captionCount, rowMax, 1);
  }

  rowValues(row) {
    if (Array.isArray(row?.values)) return row.values;

    const values = [];

    if (row?.primary?.entity || row?.entity) {
      values.push(row.primary ?? { entity: row.entity });
    }

    if (row?.secondary?.entity || row?.secondary_entity) {
      values.push(row.secondary ?? { entity: row.secondary_entity });
    }

    return values;
  }

  entityState(entity) {
    return entity ? this._hass?.states?.[entity] : null;
  }

  isActiveState(state) {
    return [
      "on",
      "open",
      "opening",
      "active",
      "playing",
      "heat",
      "heating",
    ].includes(state?.state);
  }

	valueSlot(valueIndex, valueCount) {
  	if (valueIndex === 0) return valueCount - 1;
	  return valueIndex - 1;
	}

  fmtValue(value, unit = "", decimals = undefined) {
    if (value === undefined || value === null || value === "") return "";

    const num = Number(value);

    if (!Number.isFinite(num)) {
      return unit ? `${value} ${unit}` : `${value}`;
    }

    const d =
      decimals !== undefined && decimals !== null
        ? decimals
        : Number.isInteger(num)
          ? 0
          : 1;

    return `${num.toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })}${unit ? ` ${unit}` : ""}`;
  }

  fmtValueFor(valueCfg) {
    const entity = valueCfg?.entity;
    const state = this.entityState(entity);
    if (!state) return "";

    const unit =
      valueCfg.unit ??
      state.attributes?.unit_of_measurement ??
      "";

    return this.fmtValue(
      state.state,
      unit,
      valueCfg.decimals,
    );
  }

  spacingValue() {
    const spacing = this.config?.line_spacing ?? "normal";

    if (spacing === "narrow") return 4;
    if (spacing === "comfort") return 14;

    return 8;
  }

  stateSnapshot() {
    const rows = this.config?.entities ?? [];

    return rows
      .flatMap((row) => {
        if (row.divider) return ["divider"];

        const valueEntities = this.rowValues(row)
          .map((v) => v.entity)
          .filter(Boolean);

        const statusEntity = row.status?.entity;

        return statusEntity
          ? [...valueEntities, statusEntity]
          : valueEntities;
      })
      .map((entity) => {
        const state = this._hass?.states?.[entity];
        return `${entity}:${state?.state ?? ""}`;
      })
      .join("|");
  }

  styles() {
    const C = this.colors();
    const spacing = this.spacingValue();
    const valueCount = this.valueCount();
		const columnWidth = this.config?.column_width ?? 64;

    return `
      <style>
        ${this.baseStyles(this.accentColor())}

        ha-card {
          --auri-entity-value-count: ${valueCount};
        }

        ha-card.no-header .header {
          display: none;
        }

        .header {
          grid-template-columns: 8px minmax(0, 1fr) auto;
        }

        .header-icon {
          justify-self: end;
          align-self: center;
          color: ${C.icon};
          --mdc-icon-size: 28px;
        }

        .rows {
          display: grid;
          gap: ${spacing}px;
        }

        .caption-row,
        .row {
          display: grid;
          grid-template-columns:
            auto
            minmax(0, 1fr)
            minmax(0, auto);
          gap: 14px;
          align-items: center;
        }
        
        .caption-row {
          min-height: 20px;
        }

        .caption-spacer {
          grid-column: 1 / 3;
        }

        .caption-values,
        .row-values {
          display: grid;
          grid-template-columns:
            repeat(var(--auri-entity-value-count), minmax(${columnWidth}px, 1fr));
          gap: 22px;
          align-items: baseline;
          justify-content: end;
          justify-self: end;
        }
        
        .row-values.single-value-row {
				  justify-self: stretch;
				  width: 100%;
				}

				.row-values.single-value-row .row-value {
					grid-column: 1 / -1;
				  text-align: right;
				}
        
        .caption-value {
          font-size: 11px;
          font-weight: 650;
          color: ${C.small};
          text-align: right;
          white-space: nowrap;
        }

        .row {
          min-height: 34px;
        	grid-template-columns: auto minmax(0, 1fr) auto;
        }

        .row-icon {
          color: ${C.icon};
          --mdc-icon-size: 22px;
        }

        .row-icon.active {
          color: ${this.accentColor()};
        }

        .row-title {
          min-width: 0;
          font-size: 15px;
          font-weight: 650;
          color: ${C.value};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-value {
          font-size: 15px;
          font-weight: 760;
          color: ${C.value};
          white-space: nowrap;
          text-align: right;
        }

        .row-value.muted {
          color: ${C.small};
          font-weight: 650;
        }

        .divider {
          height: 1px;
          background: ${C.line};
          margin: 4px 0;
        }

        .clickable {
          cursor: pointer;
        }

        .clickable:hover {
          opacity: .82;
        }

        .clickable:active {
          opacity: .65;
        }
      </style>
    `;
  }

  buildStaticDom() {
    const showHeader = this.config?.show_header ?? true;
    const rows = this.config?.entities ?? [];
    const captions = this.config?.caption ?? [];
    const valueCount = this.valueCount();

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card class="${showHeader ? "" : "no-header"}">
        <div class="header">
          <div class="accent"></div>
          <div>
            <div id="entities-title" class="title"></div>
            <div id="entities-subtitle" class="subtitle"></div>
          </div>
          <ha-icon id="entities-header-icon" class="header-icon"></ha-icon>
        </div>

        <div id="entities-rows" class="rows">
          ${
            captions.length
              ? `
                <div class="caption-row">
                  <div class="caption-spacer"></div>
                  <div class="caption-values">
										${Array.from({ length: valueCount })
											.map((_, visibleIndex) => {
												const sourceIndex =
													visibleIndex === valueCount - 1
														? 0
														: visibleIndex + 1;
										
												const label = captions[sourceIndex]?.label ?? "";
										
												return `<div class="caption-value">${label}</div>`;
											})
											.join("")}
                  </div>
                </div>
              `
              : ""
          }

          ${rows
            .map((row, index) => {
              if (row.divider) {
                return `<div class="divider"></div>`;
              }

              return `
                <div class="row" data-index="${index}">
                  <ha-icon class="row-icon" id="row-icon-${index}"></ha-icon>
                  <div class="row-title" id="row-title-${index}"></div>
                  <div class="row-values" id="row-values-${index}">
                    ${Array.from({ length: valueCount })
                      .map(
                        (_, valueIndex) =>
                          `<div
													  class="row-value"
													  id="row-value-${index}-${valueIndex}"
													  data-row="${index}"
													  data-value="${valueIndex}">
													</div>`,
                      )
                      .join("")}
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </ha-card>
    `;

		rows.forEach((row, index) => {
			if (row.divider) return;
		
			const values = this.rowValues(row);
			const rowEl = this.shadowRoot.querySelector(`.row[data-index="${index}"]`);
		
			if (rowEl) {
				const firstEntity = values[0]?.entity ?? row.status?.entity;
		
				if (firstEntity) {
					rowEl.classList.add("clickable");
					rowEl.addEventListener("click", () => this.fireMoreInfo(firstEntity));
				}
			}
		
			values.forEach((valueCfg, valueIndex) => {
				const slot = this.valueSlot(valueIndex, valueCount);
			
				const valueEl = this.shadowRoot.querySelector(
					`#row-value-${index}-${slot}`,
				);
			
				if (!valueEl || !valueCfg?.entity) return;
			
				valueEl.classList.add("clickable");
				valueEl.addEventListener("click", (ev) => {
					ev.stopPropagation();
					this.fireMoreInfo(valueCfg.entity);
				});
			});
		});
  }

  updateDynamicDom() {
    const rows = this.config?.entities ?? [];
    const valueCount = this.valueCount();

    this.setText("#entities-title", this.config?.title ?? "");
    this.setText("#entities-subtitle", this.config?.subtitle ?? "");

    const headerIcon = this.shadowRoot.querySelector("#entities-header-icon");

    if (headerIcon) {
      headerIcon.setAttribute(
        "icon",
        this.config?.header_icon ?? "mdi:format-list-bulleted",
      );
    }

    rows.forEach((row, index) => {
      if (row.divider) return;

      const values = this.rowValues(row);

			const realValues = values.filter((v) => v && !v.empty);
			const isSingleValueSpan = realValues.length === 1 && valueCount > 1;
			
			const rowValuesEl = this.shadowRoot.querySelector(
				`#row-values-${index}`,
			);
			
			if (rowValuesEl) {
				rowValuesEl.classList.toggle("single-value-row", isSingleValueSpan);
			}

      const firstEntity = values[0]?.entity;
      const firstState = this.entityState(firstEntity);

      const statusEntity = row.status?.entity;
      const statusState = this.entityState(statusEntity);
      const active = this.isActiveState(statusState);

      const icon = this.shadowRoot.querySelector(`#row-icon-${index}`);

      if (icon) {
        icon.setAttribute("icon", row.icon ?? "mdi:information-outline");
        icon.classList.toggle("active", active);
      }

      this.setText(
        `#row-title-${index}`,
        row.title ??
          firstState?.attributes?.friendly_name ??
          firstEntity ??
          "Entity",
      );

			// erst alle Slots dieser Zeile leeren
			for (let slot = 0; slot < valueCount; slot++) {
				const valueEl = this.shadowRoot.querySelector(
					`#row-value-${index}-${slot}`,
				);
			
				if (!valueEl) continue;
			
				valueEl.textContent = "";
				valueEl.style.display = "none";
				valueEl.style.gridColumn = "";
				valueEl.classList.remove("muted");
			}
			
			// dann echte Values in ihre sichtbaren Slots schreiben
			values.forEach((valueCfg, valueIndex) => {
				if (!valueCfg || valueCfg.empty) return;
			
				const slot = isSingleValueSpan
					? 0
					: this.valueSlot(valueIndex, valueCount);
			
				const valueEl = this.shadowRoot.querySelector(
					`#row-value-${index}-${slot}`,
				);
			
				if (!valueEl) return;
			
				const text = this.fmtValueFor(valueCfg);
			
				valueEl.textContent = text;
				valueEl.style.display = text ? "" : "none";
			
				valueEl.style.gridColumn = isSingleValueSpan
					? `1 / -1`
					: `${slot + 1}`;
			
				valueEl.classList.toggle(
					"muted",
					valueCfg?.muted ?? valueIndex !== 0,
				);
			});

    });
  }
}

customElements.define("auri-ager-entities-card", AuriAgerEntitiesCard);

class AuriAgerEntitiesCardEditor extends AuriAgerEditorBase {
  static cardClass = AuriAgerEntitiesCard;

  setConfig(config) {
    super.setConfig(config);
    this._detailIndex = null;
  }

  rows() {
    return Array.isArray(this._config?.entities) ? this._config.entities : [];
  }

  updateRow(index, key, value) {
    const config = this.cloneConfig(this._config);
    config.entities = Array.isArray(config.entities) ? config.entities : [];
    config.entities[index] = { ...(config.entities[index] ?? {}) };

    if (value === "" || value === undefined) delete config.entities[index][key];
    else config.entities[index][key] = value;

    this.dispatchConfig(config);
  }

  rowEditorValues(row) {
    if (Array.isArray(row?.values)) return row.values.map((value) => ({ ...(value ?? {}) }));

    const values = [];
    if (row?.primary?.entity || row?.entity) {
      values.push({ ...(row.primary ?? {}), entity: row.primary?.entity ?? row.entity, decimals: row.primary?.decimals ?? row.decimals });
    }
    if (row?.secondary?.entity || row?.secondary_entity) {
      values.push({ ...(row.secondary ?? {}), entity: row.secondary?.entity ?? row.secondary_entity });
    }

    return values.length ? values : [{ entity: "", decimals: undefined }];
  }

  updateRowValue(rowIndex, valueIndex, key, value) {
    const config = this.cloneConfig(this._config);
    config.entities = Array.isArray(config.entities) ? config.entities : [];
    const row = { ...(config.entities[rowIndex] ?? {}) };
    const values = this.rowEditorValues(row);

    values[valueIndex] = { ...(values[valueIndex] ?? {}) };

    if (value === "" || value === undefined) delete values[valueIndex][key];
    else values[valueIndex][key] = value;

    row.values = values;
    delete row.entity;
    delete row.primary;
    delete row.secondary;
    delete row.secondary_entity;
    delete row.decimals;

    config.entities[rowIndex] = row;
    this.dispatchConfig(config);
  }

  addRowValue(rowIndex) {
    const config = this.cloneConfig(this._config);
    config.entities = Array.isArray(config.entities) ? config.entities : [];
    const row = { ...(config.entities[rowIndex] ?? {}) };
    row.values = [...this.rowEditorValues(row), { entity: "" }];
    delete row.entity;
    delete row.primary;
    delete row.secondary;
    delete row.secondary_entity;
    delete row.decimals;
    config.entities[rowIndex] = row;
    this.dispatchConfig(config);
    this.render();
  }

  removeRowValue(rowIndex, valueIndex) {
    const config = this.cloneConfig(this._config);
    config.entities = Array.isArray(config.entities) ? config.entities : [];
    const row = { ...(config.entities[rowIndex] ?? {}) };
    const values = this.rowEditorValues(row).filter((_, index) => index !== valueIndex);
    row.values = values.length ? values : [{ entity: "" }];
    delete row.entity;
    delete row.primary;
    delete row.secondary;
    delete row.secondary_entity;
    delete row.decimals;
    config.entities[rowIndex] = row;
    this.dispatchConfig(config);
    this.render();
  }

  addRow(type = "entity") {
    const config = this.cloneConfig(this._config);
    config.entities = Array.isArray(config.entities) ? config.entities : [];
    config.entities.push(type === "divider" ? { divider: true } : { title: "Entity", entity: "", icon: "mdi:information-outline" });
    this.dispatchConfig(config);
    this._detailIndex = config.entities.length - 1;
    this.render();
  }

  removeRow(index) {
    const config = this.cloneConfig(this._config);
    config.entities = (config.entities ?? []).filter((_, i) => i !== index);
    this.dispatchConfig(config);
    this._detailIndex = null;
    this.render();
  }

  moveRow(from, to) {
    if (from === to || from < 0 || to < 0) return;
    const config = this.cloneConfig(this._config);
    const rows = [...(config.entities ?? [])];
    const [moved] = rows.splice(from, 1);
    rows.splice(to, 0, moved);
    config.entities = rows;
    this.dispatchConfig(config);
    this.render();
  }

  render() {
    const c = this._config ?? {};
    const detail = this._detailIndex !== null ? this.rows()[this._detailIndex] : null;

    this.shadowRoot.innerHTML = `
      <style>${this.editorStyles()}</style>
      <div class="editor">
        ${detail ? this.renderDetail(detail, this._detailIndex) : this.renderList(c)}
      </div>
    `;

    this.bindBasicControls();
    this.bindList();
    this.bindRowControls();
  }

  renderList(c) {
    return `
      <div class="editor-card">
        <div class="section-title">Darstellung</div>
        ${this.renderInput("title", "Titel", c.title)}
        ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
        ${this.renderInput("header_icon", "Header-Icon", c.header_icon)}
        ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
        ${this.renderCheckbox("show_header", "Header anzeigen", c.show_header !== false)}
        ${this.renderSelect("line_spacing", "Zeilenabstand", c.line_spacing, [
          ["narrow", "Eng"],
          ["normal", "Normal"],
          ["comfort", "Komfort"],
        ])}
        ${this.renderInput("column_width", "Spaltenbreite", c.column_width, "number")}
        ${this.renderSelect("theme", "Theme", c.theme, [
          ["auto", "Automatisch"],
          ["light", "Hell"],
          ["dark", "Dunkel"],
        ])}
      </div>
      <div class="editor-card">
        <div class="section-title">Zeilen</div>
        <div class="list">
          ${this.rows().map((row, index) => `
            <div class="list-row" draggable="true" data-index="${index}">
              <span class="drag-handle">☰</span>
              <button type="button" class="row-main" data-open="${index}">
                ${this.escapeHtml(row.divider ? "Trenner" : (row.entity || row.title || `Zeile ${index + 1}`))}
              </button>
              <button type="button" data-remove="${index}">Entfernen</button>
            </div>
          `).join("")}
        </div>
        <div class="button-row">
          <button type="button" data-add="entity">Entity hinzufügen</button>
          <button type="button" data-add="divider">Trenner hinzufügen</button>
        </div>
      </div>
    `;
  }

  renderDetail(row, index) {
    if (row.divider) {
      return `
        <div class="editor-card">
          <div class="detail-head">
            <div class="section-title">Trenner ${index + 1}</div>
            <button type="button" data-back>Zurück</button>
          </div>
        </div>
      `;
    }

    const values = this.rowEditorValues(row);

    return `
      <div class="editor-card">
        <div class="detail-head">
          <div class="section-title">Zeile ${index + 1}</div>
          <button type="button" data-back>Zurück</button>
        </div>
        ${this.renderRowInput(index, "title", "Titel", row.title)}
        ${this.renderRowEntity(index, "status_entity", "Status-Entity", row.status?.entity)}
        ${this.renderRowInput(index, "icon", "Icon", row.icon)}
      </div>
      <div class="editor-card">
        <div class="section-title">Werte</div>
        ${values.map((value, valueIndex) => `
          <div class="item-card">
            <div class="detail-head">
              <div class="section-title">Wert ${valueIndex + 1}</div>
              <button type="button" data-remove-value="${valueIndex}" data-row-index="${index}">Entfernen</button>
            </div>
            ${this.renderValueEntity(index, valueIndex, "entity", "Entity", value.entity)}
            ${this.renderValueInput(index, valueIndex, "decimals", "Nachkommastellen", value.decimals, "number")}
            ${this.renderValueInput(index, valueIndex, "unit", "Einheit", value.unit)}
            ${this.renderValueCheckbox(index, valueIndex, "muted", "Gedämpft", value.muted === true)}
          </div>
        `).join("")}
        <div class="button-row">
          <button type="button" data-add-value="${index}">Wert hinzufügen</button>
        </div>
      </div>
    `;
  }

  bindList() {
    let dragIndex = null;

    this.shadowRoot.querySelector("[data-back]")?.addEventListener("click", () => {
      this._detailIndex = null;
      this.render();
    });

    this.shadowRoot.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", () => this.addRow(button.dataset.add));
    });

    this.shadowRoot.querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => {
        this._detailIndex = Number(button.dataset.open);
        this.render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => this.removeRow(Number(button.dataset.remove)));
    });

    this.shadowRoot.querySelectorAll(".list-row[draggable]").forEach((row) => {
      row.addEventListener("dragstart", () => {
        dragIndex = Number(row.dataset.index);
      });
      row.addEventListener("dragover", (ev) => ev.preventDefault());
      row.addEventListener("drop", (ev) => {
        ev.preventDefault();
        this.moveRow(dragIndex, Number(row.dataset.index));
      });
    });
  }

  bindRowControls() {
    this.shadowRoot.querySelectorAll("[data-row-key]").forEach((el) => {
      const handler = (ev) => {
        const index = Number(ev.target.dataset.rowIndex);
        const key = ev.target.dataset.rowKey;
        let value = ev.detail?.value ?? ev.target.value;
        if (ev.target.type === "number") value = value === "" ? "" : Number(value);

        if (key === "status_entity") {
          const row = { ...(this.rows()[index] ?? {}) };
          this.updateRow(index, "status", value ? { ...(row.status ?? {}), entity: value } : undefined);
        } else {
          this.updateRow(index, key, value);
        }
      };

      if (el.tagName?.toLowerCase() === "ha-entity-picker" || el.tagName?.toLowerCase() === "ha-icon-picker") {
        el.hass = this._hass;
        el.value = el.dataset.value ?? "";
        el.addEventListener("value-changed", handler);
      } else {
        el.addEventListener("change", handler);
      }
    });

    this.shadowRoot.querySelectorAll("[data-value-key]").forEach((el) => {
      const handler = (ev) => {
        const rowIndex = Number(ev.target.dataset.rowIndex);
        const valueIndex = Number(ev.target.dataset.valueIndex);
        const key = ev.target.dataset.valueKey;
        let value = ev.target.type === "checkbox" ? ev.target.checked : ev.detail?.value ?? ev.target.value;
        if (ev.target.type === "number") value = value === "" ? "" : Number(value);
        this.updateRowValue(rowIndex, valueIndex, key, value);
      };

      if (el.tagName?.toLowerCase() === "ha-entity-picker") {
        el.hass = this._hass;
        el.value = el.dataset.value ?? "";
        el.addEventListener("value-changed", handler);
      } else {
        el.addEventListener("change", handler);
      }
    });

    this.shadowRoot.querySelectorAll("[data-add-value]").forEach((button) => {
      button.addEventListener("click", () => this.addRowValue(Number(button.dataset.addValue)));
    });

    this.shadowRoot.querySelectorAll("[data-remove-value]").forEach((button) => {
      button.addEventListener("click", () => this.removeRowValue(Number(button.dataset.rowIndex), Number(button.dataset.removeValue)));
    });
  }

  renderRowInput(index, key, label, value = "", type = "text") {
    if (type === "text" && key.endsWith("icon")) {
      return `
        <label>
          <span>${label}</span>
          <ha-icon-picker data-row-index="${index}" data-row-key="${key}" data-value="${this.escapeHtml(value ?? "")}"></ha-icon-picker>
        </label>
      `;
    }

    return `
      <label>
        <span>${label}</span>
        <input type="${type}" data-row-index="${index}" data-row-key="${key}" value="${this.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  renderRowEntity(index, key, label, value = "") {
    return `
      <label>
        <span>${label}</span>
        <ha-entity-picker data-row-index="${index}" data-row-key="${key}" data-value="${this.escapeHtml(value ?? "")}" allow-custom-entity></ha-entity-picker>
      </label>
    `;
  }

  renderValueInput(rowIndex, valueIndex, key, label, value = "", type = "text") {
    return `
      <label>
        <span>${label}</span>
        <input
          type="${type}"
          data-row-index="${rowIndex}"
          data-value-index="${valueIndex}"
          data-value-key="${key}"
          value="${this.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  renderValueEntity(rowIndex, valueIndex, key, label, value = "") {
    return `
      <label>
        <span>${label}</span>
        <ha-entity-picker
          data-row-index="${rowIndex}"
          data-value-index="${valueIndex}"
          data-value-key="${key}"
          data-value="${this.escapeHtml(value ?? "")}"
          allow-custom-entity>
        </ha-entity-picker>
      </label>
    `;
  }

  renderValueCheckbox(rowIndex, valueIndex, key, label, checked = false) {
    return `
      <label class="checkbox-row">
        <input
          type="checkbox"
          data-row-index="${rowIndex}"
          data-value-index="${valueIndex}"
          data-value-key="${key}"
          ${checked ? "checked" : ""}>
        <span>${label}</span>
      </label>
    `;
  }
}

customElements.define("auri-ager-entities-card-editor", AuriAgerEntitiesCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-entities-card",
  name: "Auri Ager Entities",
  description: "Multi-column entity list card",
  preview: true,
});
/*
 * Auri Ager Entity Grid Card
 *
 * Horizontal micro entity tiles with primary/secondary values
 * and optional status highlighting.
 */

class AuriAgerEntityGridCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-entity-grid-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-entity-grid-card",
      accent_color: "#f5b82e",
      theme: "auto",
      columns: "auto",
      layout: "normal",
      show_value: true,
      icon_size: 22,
      entities: [],
    };
  }

  getCardSize() {
    return 1;
  }

  accentColor() {
    return this.config?.accent_color ?? this.config?.accent ?? "#f5b82e";
  }

  rowValues(item) {
    if (Array.isArray(item?.values)) return item.values;

    const values = [];

    if (item?.entity) {
      values.push({ entity: item.entity, decimals: item.decimals });
    }

    if (item?.secondary?.entity || item?.secondary_entity) {
      values.push(item.secondary ?? { entity: item.secondary_entity });
    }

    return values;
  }

  entityState(entity) {
    return entity ? this._hass?.states?.[entity] : null;
  }

  isActiveState(state) {
    return [
      "on",
      "open",
      "opening",
      "active",
      "playing",
      "heat",
      "heating",
    ].includes(state?.state);
  }

  fmtValue(value, unit = "", decimals = undefined) {
    if (value === undefined || value === null || value === "") return "";

    const num = Number(value);

    if (!Number.isFinite(num)) {
      return unit ? `${value} ${unit}` : `${value}`;
    }

    const d =
      decimals !== undefined && decimals !== null
        ? decimals
        : Number.isInteger(num)
          ? 0
          : 1;

    return `${num.toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })}${unit ? ` ${unit}` : ""}`;
  }

  fmtValueFor(valueCfg) {
    const state = this.entityState(valueCfg?.entity);
    if (!state) return "";

    const unit =
      valueCfg.unit ??
      state.attributes?.unit_of_measurement ??
      "";

    return this.fmtValue(state.state, unit, valueCfg.decimals);
  }

  stateSnapshot() {
    return (this.config?.entities ?? [])
      .flatMap((item) => {
        const values = this.rowValues(item)
          .map((v) => v.entity)
          .filter(Boolean);

        const status = item.status?.entity;

        return status ? [...values, status] : values;
      })
      .map((entity) => {
        const state = this._hass?.states?.[entity];
        return `${entity}:${state?.state ?? ""}`;
      })
      .join("|");
  }

  styles() {
		const layout = this.config?.layout ?? "normal";
		const showValue = this.config?.show_value ?? true;
		const iconSize = this.config?.icon_size ?? (layout === "compact" ? 30 : 26);

    const C = this.colors();

    const columns = this.config?.columns ?? "auto";
		const grid_layout = columns === "auto"
        ? "repeat(auto-fit, minmax(92px, 1fr))"
        : `repeat(${this.config?.columns ?? 2}, minmax(0, 1fr))`;

    return `
      <style>
        ${this.baseStyles(this.accentColor())}

        ha-card {
          padding: 12px;
        }

        .micro-grid {
          display: grid;
          grid-template-columns: ${grid_layout};
          gap: 10px;
        }

        .micro {
          min-height: 86px;
          border-radius: 18px;
          background: rgba(0,0,0,.025);
          display: grid;
          grid-template-rows: auto auto auto auto;
          place-items: center;
          text-align: center;
          padding: 10px 8px;
          overflow: hidden;
        }

        .micro-icon {
          color: ${C.icon};
          --mdc-icon-size: ${iconSize}px;
				  margin-bottom: ${layout === "compact" ? "6px" : "4px"};
        }

        .micro-icon.active {
          color: ${this.accentColor()};
        }

        .micro-title {
          max-width: 100%;
          font-size: 13px;
          font-weight: 700;
          color: ${C.value};
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .micro-primary {
          margin-top: 5px;
          font-size: 18px;
          font-weight: 820;
          color: ${C.value};
          line-height: 1;
          white-space: nowrap;
        }

        .micro-secondary {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 650;
          color: ${C.small};
          line-height: 1;
          white-space: nowrap;
        }

				.micro.compact {
					min-height: ${showValue ? "76px" : "62px"};
					padding: ${showValue ? "9px 8px" : "8px 8px"};
					grid-template-rows: auto auto auto;
				}
				
				.micro.compact .micro-title {
					font-size: 12px;
					line-height: 1.05;
				}
				
				.micro.compact .micro-primary {
					margin-top: 4px;
					font-size: 16px;
				}
				
				.micro.compact .micro-secondary {
					margin-top: 3px;
					font-size: 11px;
				}

        .clickable {
          cursor: pointer;
        }

        .clickable:hover {
          opacity: .82;
        }

        .clickable:active {
          opacity: .65;
        }
      </style>
    `;
  }

  buildStaticDom() {
	  const layout = this.config?.layout ?? "normal";
    const items = this.config?.entities ?? [];

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <div class="micro-grid">
          ${items
            .map((item, index) => `
              <div class="micro ${layout} clickable" data-index="${index}">
                <ha-icon class="micro-icon" id="micro-icon-${index}"></ha-icon>
                <div class="micro-title" id="micro-title-${index}"></div>
                <div class="micro-primary" id="micro-primary-${index}"></div>
                <div class="micro-secondary" id="micro-secondary-${index}"></div>
              </div>
            `)
            .join("")}
        </div>
      </ha-card>
    `;

    items.forEach((item, index) => {
      const values = this.rowValues(item);
      const primaryEntity = values[0]?.entity;
      const secondaryEntity = values[1]?.entity;
      const statusEntity = item.status?.entity;

      const tile = this.shadowRoot.querySelector(`.micro[data-index="${index}"]`);
      const primaryEl = this.shadowRoot.querySelector(`#micro-primary-${index}`);
      const secondaryEl = this.shadowRoot.querySelector(`#micro-secondary-${index}`);
      const iconEl = this.shadowRoot.querySelector(`#micro-icon-${index}`);

      if (tile && primaryEntity) {
        tile.addEventListener("click", () => this.fireMoreInfo(primaryEntity));
      }

      if (primaryEl && primaryEntity) {
        primaryEl.classList.add("clickable");
        primaryEl.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.fireMoreInfo(primaryEntity);
        });
      }

      if (secondaryEl && secondaryEntity) {
        secondaryEl.classList.add("clickable");
        secondaryEl.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.fireMoreInfo(secondaryEntity);
        });
      }

      if (iconEl && statusEntity) {
        iconEl.classList.add("clickable");
        iconEl.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.fireMoreInfo(statusEntity);
        });
      }
    });
  }

  updateDynamicDom() {
    const items = this.config?.entities ?? [];

    items.forEach((item, index) => {
      const values = this.rowValues(item);
      const showValue = this.config?.show_value ?? true;

      const primary = values[0];
      const secondary = values[1];

      const statusState = this.entityState(item.status?.entity);
      const active = this.isActiveState(statusState);

      const firstState = this.entityState(primary?.entity);

      const icon = this.shadowRoot.querySelector(`#micro-icon-${index}`);
      if (icon) {
        icon.setAttribute("icon", item.icon ?? "mdi:information-outline");
        icon.classList.toggle("active", active);
				if (active) {
					icon.style.color = "";
				} else {
				  icon.style.color =
				    item.icon_color ??
				    this.colors().icon;
				}
      }

      this.setText(
        `#micro-title-${index}`,
        item.title ??
          firstState?.attributes?.friendly_name ??
          primary?.entity ??
          "Entity",
      );

			const primaryEl = this.shadowRoot.querySelector(`#micro-primary-${index}`);
			if (primaryEl) {
			  const primaryText = primary ? this.fmtValueFor(primary) : "";
			  primaryEl.style.display = showValue && primaryText ? "" : "none";
			  this.setText(`#micro-primary-${index}`, showValue ? primaryText : "");
			}

			const secondaryText = secondary ? this.fmtValueFor(secondary) : "";
			const secondaryEl = this.shadowRoot.querySelector(`#micro-secondary-${index}`);
			if (secondaryEl) {
			  secondaryEl.style.display = showValue && secondaryText ? "" : "none";
			  this.setText(`#micro-secondary-${index}`, showValue ? secondaryText : "");
			}
    });
  }
}

customElements.define("auri-ager-entity-grid-card", AuriAgerEntityGridCard);

class AuriAgerEntityGridCardEditor extends AuriAgerEditorBase {
  static cardClass = AuriAgerEntityGridCard;

  setConfig(config) {
    super.setConfig(config);
    this._detailIndex = null;
  }

  items() {
    return Array.isArray(this._config?.entities) ? this._config.entities : [];
  }

  updateItem(index, key, value) {
    const config = this.cloneConfig(this._config);
    config.entities = Array.isArray(config.entities) ? config.entities : [];
    config.entities[index] = { ...(config.entities[index] ?? {}) };

    if (value === "" || value === undefined) delete config.entities[index][key];
    else config.entities[index][key] = value;

    this.dispatchConfig(config);
  }

  addItem() {
    const config = this.cloneConfig(this._config);
    config.entities = Array.isArray(config.entities) ? config.entities : [];
    config.entities.push({ title: "Entity", entity: "", icon: "mdi:information-outline" });
    this.dispatchConfig(config);
    this._detailIndex = config.entities.length - 1;
    this.render();
  }

  removeItem(index) {
    const config = this.cloneConfig(this._config);
    config.entities = (config.entities ?? []).filter((_, i) => i !== index);
    this.dispatchConfig(config);
    this._detailIndex = null;
    this.render();
  }

  moveItem(from, to) {
    if (from === to || from < 0 || to < 0) return;
    const config = this.cloneConfig(this._config);
    const items = [...(config.entities ?? [])];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    config.entities = items;
    this.dispatchConfig(config);
    this.render();
  }

  render() {
    const c = this._config ?? {};
    const detail = this._detailIndex !== null ? this.items()[this._detailIndex] : null;

    this.shadowRoot.innerHTML = `
      <style>${this.editorStyles()}</style>
      <div class="editor">
        ${detail ? this.renderDetail(detail, this._detailIndex) : this.renderList(c)}
      </div>
    `;

    this.bindBasicControls();
    this.bindList();
    this.bindItemControls();
  }

  renderList(c) {
    return `
      <div class="editor-card">
        <div class="section-title">Darstellung</div>
        ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
        ${this.renderSelect("theme", "Theme", c.theme, [
          ["auto", "Automatisch"],
          ["light", "Hell"],
          ["dark", "Dunkel"],
        ])}
        ${this.renderSelect("layout", "Layout", c.layout, [
          ["normal", "Normal"],
          ["compact", "Compact"],
        ])}
        ${this.renderInput("columns", "Spalten", c.columns)}
        ${this.renderInput("icon_size", "Icon-Größe", c.icon_size, "number")}
        ${this.renderCheckbox("show_value", "Werte anzeigen", c.show_value !== false)}
      </div>
      <div class="editor-card">
        <div class="section-title">Entitäten</div>
        <div class="list">
          ${this.items().map((item, index) => `
            <div class="list-row" draggable="true" data-index="${index}">
              <span class="drag-handle">☰</span>
              <button type="button" class="row-main" data-open="${index}">
                ${this.escapeHtml(item.entity || item.title || `Eintrag ${index + 1}`)}
              </button>
              <button type="button" data-remove="${index}">Entfernen</button>
            </div>
          `).join("")}
        </div>
        <div class="button-row">
          <button type="button" data-add>Entität hinzufügen</button>
        </div>
      </div>
    `;
  }

  renderDetail(item, index) {
    return `
      <div class="editor-card">
        <div class="detail-head">
          <div class="section-title">Eintrag ${index + 1}</div>
          <button type="button" data-back>Zurück</button>
        </div>
        ${this.renderItemInput(index, "title", "Titel", item.title)}
        ${this.renderItemEntity(index, "entity", "Haupt-Entity", item.entity)}
        ${this.renderItemInput(index, "decimals", "Nachkommastellen", item.decimals, "number")}
        ${this.renderItemEntity(index, "secondary_entity", "Sekundär-Entity", item.secondary_entity ?? item.secondary?.entity)}
        ${this.renderItemEntity(index, "status_entity", "Status-Entity", item.status?.entity)}
        ${this.renderItemInput(index, "icon", "Icon", item.icon)}
        ${this.renderItemInput(index, "icon_color", "Icon-Farbe", item.icon_color, "color")}
      </div>
    `;
  }

  bindList() {
    let dragIndex = null;

    this.shadowRoot.querySelector("[data-add]")?.addEventListener("click", () => this.addItem());
    this.shadowRoot.querySelector("[data-back]")?.addEventListener("click", () => {
      this._detailIndex = null;
      this.render();
    });

    this.shadowRoot.querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => {
        this._detailIndex = Number(button.dataset.open);
        this.render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => this.removeItem(Number(button.dataset.remove)));
    });

    this.shadowRoot.querySelectorAll(".list-row[draggable]").forEach((row) => {
      row.addEventListener("dragstart", () => {
        dragIndex = Number(row.dataset.index);
      });
      row.addEventListener("dragover", (ev) => ev.preventDefault());
      row.addEventListener("drop", (ev) => {
        ev.preventDefault();
        this.moveItem(dragIndex, Number(row.dataset.index));
      });
    });
  }

  bindItemControls() {
    this.shadowRoot.querySelectorAll("[data-item-key]").forEach((el) => {
      const handler = (ev) => {
        const index = Number(ev.target.dataset.itemIndex);
        const key = ev.target.dataset.itemKey;
        let value = ev.detail?.value ?? ev.target.value;

        if (ev.target.type === "number") value = value === "" ? "" : Number(value);

        if (key === "status_entity") {
          const item = { ...(this.items()[index] ?? {}) };
          this.updateItem(index, "status", value ? { ...(item.status ?? {}), entity: value } : undefined);
        } else if (key === "secondary_entity") {
          this.updateItem(index, key, value);
        } else {
          this.updateItem(index, key, value);
        }
      };

      if (el.tagName?.toLowerCase() === "ha-entity-picker" || el.tagName?.toLowerCase() === "ha-icon-picker") {
        el.hass = this._hass;
        el.value = el.dataset.value ?? "";
        el.addEventListener("value-changed", handler);
      } else {
        el.addEventListener("change", handler);
      }
    });
  }

  renderItemInput(index, key, label, value = "", type = "text") {
    if (type === "text" && key === "icon") {
      return `
        <label>
          <span>${label}</span>
          <ha-icon-picker data-item-index="${index}" data-item-key="${key}" data-value="${this.escapeHtml(value ?? "")}"></ha-icon-picker>
        </label>
      `;
    }

    return `
      <label>
        <span>${label}</span>
        <input type="${type}" data-item-index="${index}" data-item-key="${key}" value="${this.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  renderItemEntity(index, key, label, value = "") {
    return `
      <label>
        <span>${label}</span>
        <ha-entity-picker data-item-index="${index}" data-item-key="${key}" data-value="${this.escapeHtml(value ?? "")}" allow-custom-entity></ha-entity-picker>
      </label>
    `;
  }
}

customElements.define("auri-ager-entity-grid-card-editor", AuriAgerEntityGridCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-entity-grid-card",
  name: "Auri Ager Entity Grid",
  description: "Space saving horizontal entity grid",
  preview: true,
});
/*
 * Auri Ager Value Card
 *
 * Single value card in Auri Ager design language
 */

class AuriAgerValueCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-value-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-value-card",
      title: "Wert",
      short_title: "",
      subtitle: "",
      entity: "",
      secondary: "",
      icon: "mdi:information-outline",
      theme: "auto",
      layout: "normal",
    };
  }

  getCardSize() {
	  if (this.config?.layout === "nano") return 1;
	  if (this.config?.layout === "tiny") return 1;
  	return this.config?.layout === "small" ? 1 : 2;
  }

  stateSnapshot() {
    const e1 = this.config?.entity;
    const e2 = this.config?.secondary;
    return [
      e1 ? `${e1}:${this._hass?.states?.[e1]?.state ?? ""}` : "",
      e2 ? `${e2}:${this._hass?.states?.[e2]?.state ?? ""}` : "",
      this.offsetWidth,
    ].join("|");
  }

  fmtValue(value, unit, decimals) {
    const numeric = Number(value);

    const text = Number.isFinite(numeric)
      ? numeric.toLocaleString("de-DE", {
          minimumFractionDigits: decimals ?? 0,
          maximumFractionDigits: decimals ?? 2,
        })
      : String(value ?? "–");

    return unit ? `${text} ${unit}` : text;
  }

  styles() {
    const C = this.colors();

    return `
      <style>
        ${this.baseStyles(this.config.accent_color)}

        ha-card.small {
          padding: 16px 22px;
        }

        ha-card.small .header {
          margin-bottom: 10px;
        }

				ha-card.tiny {
					padding: 18px 22px;
				}
				
				ha-card.nano {
					padding: 6px 23px;
				}

				ha-card.tiny .tiny-row {
					display: grid;
					grid-template-columns: 8px minmax(0, 1fr) 28px auto;
					gap: 14px;
					align-items: center;
				}
				
				ha-card.tiny .tiny-row::before {
					content: "";
					width: 8px;
					height: 42px;
					border-radius: 4px;
					background: ${this.config.accent_color ?? C.accent};
				}
				
				ha-card.tiny .tiny-text {
					min-width: 0;
				}
				
				ha-card.tiny .title {
					font-size: clamp(18px, 4vw, 20px);
				}

				ha-card.tiny .subtitle {
					font-size: 13px;
				}
				
				ha-card.tiny ha-icon {
					align-self: center;
					margin-top: 6px;
				}
				
				ha-card.tiny .value {
					font-size: clamp(18px, 4vw, 26px);
					line-height: 1;
					text-align: right;
				}

				ha-card.tiny .secondary-value {
				  color: ${C.small};
				  font-size: 16px;
				}
        
				ha-card.tiny .values {
					display: flex;
					flex-direction: row;
					align-items: baseline;
					justify-content: flex-end;
					gap: 22px;
					white-space: nowrap;
				}
				
				ha-card.nano .nano-row {
					display: grid;
					grid-template-columns: 6px minmax(0, 1fr) auto;
					gap: 15px;
					align-items: center;
				}
				
				ha-card.nano .nano-accent {
					width: 6px;
					height: 24px;
					border-radius: 3px;
					background: ${this.config.accent_color ?? C.accent};
				}
				
				ha-card.nano .nano-title {
					font-size: 12px;
					font-weight: 700;
					color: ${C.small};
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				
				ha-card.nano .value {
					font-size: 20px;
					font-weight: 780;
				}

        .title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .value-wrap {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 14px;
          align-items: end;
          min-height: 86px;
        }

        ha-card.small .value-wrap {
          min-height: 44px;
        }

        ha-icon {
          color: ${C.icon};
          --mdc-icon-size: 28px;
        }

        .values {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          align-items: end;
        }

        .values.has-secondary {
          grid-template-columns: auto auto;
				  justify-content: end;
				  gap: 22px;
        }

        .value {
          color: ${C.value};
          font-size: clamp(22px, 4vw, 30px);
          font-weight: 780;
          text-align: right;
          line-height: 1.05;
          white-space: nowrap;
        }

        .secondary-value {
          color: ${C.small};
          font-size: clamp(18px, 3.2vw, 24px);
          text-align: right;
        }

				ha-card.small .value-wrap,
				ha-card.tiny .value-wrap {
					min-height: 0;
				}
				
				ha-card.small {
					padding-bottom: 14px;
				}
				
				ha-card.tiny {
					padding-bottom: 14px;
				}
      </style>
    `;
  }

  buildStaticDom() {
		const layout = this.config.layout ?? "normal";
		const small = layout === "small";
		const tiny = layout === "tiny";
		const nano = layout === "nano";

		let body;
		
		if (nano) {
			body = `
				<div class="nano-row">
					<div class="nano-accent"></div>
					<div class="nano-title" id="value-title"></div>
					<div id="values" class="values">
						<div id="value-main" class="value"></div>
					</div>
				</div>
			`;
		} else if (tiny) {
			body = `
				<div class="tiny-row">
					<div class="tiny-text">
						<div id="value-title" class="title"></div>
						<div id="value-subtitle" class="subtitle"></div>
					</div>
					<ha-icon id="value-icon"></ha-icon>
					<div id="values" class="values">
						<div id="value-secondary" class="value secondary-value"></div>
						<div id="value-main" class="value"></div>
					</div>
				</div>
			`;
		} else {
			body = `
				<div class="header">
					<div class="accent"></div>
					<div>
						<div id="value-title" class="title"></div>
						<div id="value-subtitle" class="subtitle"></div>
					</div>
				</div>
		
				<div class="value-wrap">
					<ha-icon id="value-icon"></ha-icon>
					<div id="values" class="values">
						<div id="value-secondary" class="value secondary-value"></div>
						<div id="value-main" class="value"></div>
					</div>
				</div>
			`;
		}

		this.shadowRoot.innerHTML = `
			${this.styles()}
			<ha-card class="${nano ? "nano" : tiny ? "tiny" : small ? "small" : ""}">
				${body}
			</ha-card>
		`;
    
    // Value
		this.attachEntityClick("#value-main", this.config.entity);
		this.attachEntityClick("#value-secondary", this.config.secondary);
  }

  updateDynamicDom() {
    const entity = this.config.entity;
    const secondary = this.config.secondary;

    const state = entity ? this._hass?.states?.[entity] : null;
    const secondaryState = secondary ? this._hass?.states?.[secondary] : null;

    const isNarrow = this.offsetWidth < 180;

		const iconEl = this.shadowRoot.querySelector("#value-icon");
		
		if (iconEl) {
			iconEl.setAttribute("icon", this.config.icon ?? "mdi:information-outline");
		
			if (this.config.layout === "tiny" && isNarrow) {
				iconEl.style.display = "none";
			} else {
				iconEl.style.display = "";
			}
		}

    const title =
      isNarrow && this.config.short_title
        ? this.config.short_title
        : this.config.title ?? state?.attributes?.friendly_name ?? "Wert";

    const unit =
      this.config.unit ??
      state?.attributes?.unit_of_measurement ??
      "";

    const secondaryUnit =
      this.config.secondary_unit ??
      secondaryState?.attributes?.unit_of_measurement ??
      "";

    this.setText("#value-title", title);
    this.setText("#value-subtitle", this.config.subtitle ?? "");

    this.shadowRoot.querySelector("#value-icon")?.setAttribute(
      "icon",
      this.config.icon ?? "mdi:information-outline",
    );

    this.setText(
      "#value-main",
      this.fmtValue(state?.state, unit, this.config.decimals),
    );

    const valuesEl = this.shadowRoot.querySelector("#values");
    const secondaryEl = this.shadowRoot.querySelector("#value-secondary");

		const showSecondary =
			this.config.layout !== "nano" &&
			secondaryState;
			//this.config.layout !== "tiny" &&

		if (showSecondary && secondaryEl) {
			valuesEl?.classList.add("has-secondary");
			secondaryEl.style.display = "";
		
			this.setText(
				"#value-secondary",
				this.fmtValue(
					secondaryState.state,
					secondaryUnit,
					this.config.secondary_decimals,
				),
			);
		} else {
			valuesEl?.classList.remove("has-secondary");
		
			if (secondaryEl) {
				secondaryEl.style.display = "none";
			}
		}
  }
}

customElements.define("auri-ager-value-card", AuriAgerValueCard);

class AuriAgerValueCardEditor extends AuriAgerEditorBase {
  static cardClass = AuriAgerValueCard;

  render() {
    const c = this._config ?? {};

    this.renderStandardEditor([
      {
        title: "Darstellung",
        body: `
          ${this.renderInput("title", "Titel", c.title)}
          ${this.renderInput("short_title", "Kurztitel", c.short_title)}
          ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
          ${this.renderInput("icon", "Icon", c.icon)}
          ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
          ${this.renderSelect("layout", "Layout", c.layout, [
            ["normal", "Normal"],
            ["small", "Small"],
            ["tiny", "Tiny"],
            ["nano", "Nano"],
          ])}
          ${this.renderSelect("theme", "Theme", c.theme, [
            ["auto", "Automatisch"],
            ["light", "Hell"],
            ["dark", "Dunkel"],
          ])}
        `,
      },
      {
        title: "Entitäten",
        body: `
          ${this.renderEntityPicker("entity", "Haupt-Entity", c.entity)}
          ${this.renderEntityPicker("secondary", "Sekundär-Entity", c.secondary)}
        `,
      },
      {
        title: "Werte",
        body: `
          ${this.renderInput("unit", "Einheit", c.unit)}
          ${this.renderInput("decimals", "Nachkommastellen", c.decimals, "number")}
          ${this.renderInput("secondary_unit", "Sekundär-Einheit", c.secondary_unit)}
          ${this.renderInput("secondary_decimals", "Sekundär-Nachkommastellen", c.secondary_decimals, "number")}
        `,
      },
    ]);
  }
}

customElements.define("auri-ager-value-card-editor", AuriAgerValueCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-value-card",
  name: "Auri Ager Value",
  description: "Adjustable single value display",
  preview: true,
});
/*
 * Auri Ager Markdown Card
 *
 */

class AuriAgerMarkdownCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-markdown-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-markdown-card",
      title: "Markdown",
      subtitle: "",
      icon: "mdi:text-box-outline",
      content: "# Hello Auri\n\nMarkdown content...",
      accent_color: "#5aa7d8",
    };
  }

  getCardSize() {
    return 3;
  }

	needsLiveUpdates() {
  	return true;
	}

  accentColor() {
    return this.config?.accent_color ?? this.config?.accent ?? "#5aa7d8";
  }

  stateSnapshot() {
    return this.config?.content ?? "";
  }

  inlineMarkdown(text) {
    return this.escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

	expandEntities(text) {
		return `${text ?? ""}`.replace(
			/\{\{\s*([a-zA-Z_]+\.[a-zA-Z0-9_]+)\s*\}\}/g,
			(_, entityId) => {
				const entity = this._hass?.states?.[entityId];
				if (!entity) return "—";
	
				const unit = entity.attributes?.unit_of_measurement ?? "";
				return `${entity.state}${unit ? " " + unit : ""}`;
			}
		);
	}

  renderMarkdown(content) {
    const lines = `${content ?? ""}`.split("\n");
    const html = [];
    let inList = false;
    let inCode = false;
    let codeLines = [];

    const closeList = () => {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    };

    lines.forEach((line) => {
      if (line.trim().startsWith("```")) {
        if (inCode) {
          html.push(`<pre><code>${this.escapeHtml(codeLines.join("\n"))}</code></pre>`);
          codeLines = [];
          inCode = false;
        } else {
          closeList();
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeLines.push(line);
        return;
      }

      const trimmed = line.trim();

      if (!trimmed) {
        closeList();
        html.push(`<div class="md-space"></div>`);
        return;
      }

      if (trimmed.startsWith("- ")) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push(`<li>${this.inlineMarkdown(trimmed.slice(2))}</li>`);
        return;
      }

      closeList();

      if (trimmed.startsWith("### ")) {
        html.push(`<h3>${this.inlineMarkdown(trimmed.slice(4))}</h3>`);
      } else if (trimmed.startsWith("## ")) {
        html.push(`<h2>${this.inlineMarkdown(trimmed.slice(3))}</h2>`);
      } else if (trimmed.startsWith("# ")) {
        html.push(`<h1>${this.inlineMarkdown(trimmed.slice(2))}</h1>`);
      } else {
        html.push(`<p>${this.inlineMarkdown(trimmed)}</p>`);
      }
    });

    closeList();

    return html.join("");
  }

  styles() {
    const C = this.colors();
    const accent = this.accentColor();

    return `
      <style>
        ${this.baseStyles(accent)}

        .header {
          grid-template-columns: 8px minmax(0, 1fr) auto;
        }

				ha-card.no-content .header,
				ha-card.small.no-content .header {
				  margin-bottom: 0;
				}

				ha-card.small {
				  padding-top: 16px;
				  padding-bottom: 10px;
				}

				ha-card.small .accent {
					height: 28px;
				}
				
				ha-card.small .markdown-icon {
					--mdc-icon-size: 22px;
					transform: translateY(-2px);
				}
				
				ha-card.small .header {
					margin-bottom: 0;
				}

				ha-card.small .title {
					font-size: 16px;
					transform: translateY(4px);
				}
				
				ha-card.small .subtitle {
					margin-left: 12px;
					transform: translateY(4px);
				}

				ha-card.small .header > div:nth-child(2) {
				  display: flex;
				  align-items: baseline;
				  gap: 12px;
				}

				ha-card.no-content {
					padding-bottom: 14px;
				}
				
				ha-card.small.no-content {
					padding-bottom: 12px;
				}

        .markdown-icon {
          justify-self: end;
          align-self: center;
          color: ${C.icon};
          --mdc-icon-size: 30px;
        }

        .markdown-content {
          color: ${C.value};
          font-size: 14px;
          line-height: 1.45;
          margin-top: 0;
				  margin-bottom: 0;
        }
        
        .markdown-content.has-content {
				  margin-bottom: 8px;
				}

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          margin: 0 0 8px 0;
          line-height: 1.15;
          color: ${C.value};
        }

        .markdown-content h1 {
          font-size: 20px;
          font-weight: 800;
        }

        .markdown-content h2 {
          font-size: 17px;
          font-weight: 760;
        }

        .markdown-content h3 {
          font-size: 15px;
          font-weight: 720;
        }

        .markdown-content p {
          margin: 0 0 8px 0;
        }

        .markdown-content ul {
          margin: 0 0 8px 18px;
          padding: 0;
        }

        .markdown-content li {
          margin: 2px 0;
        }

        .markdown-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: .92em;
          background: rgba(0,0,0,.045);
          border-radius: 6px;
          padding: 1px 5px;
        }

        .markdown-content pre {
          margin: 8px 0;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(0,0,0,.045);
          overflow-x: auto;
        }

        .markdown-content pre code {
          background: transparent;
          padding: 0;
        }

				.markdown-content a {
					color: ${accent};
					text-decoration: none;
					font-weight: 600;
				}
				
				.markdown-content a:hover {
					text-decoration: underline;
				}

        .md-space {
          height: 4px;
        }
      </style>
    `;
  }

  buildStaticDom() {
  	const layout = this.config?.layout ?? "normal";

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card class="${layout}">
        <div class="header">
          <div class="accent"></div>
          <div>
            <div id="markdown-title" class="title"></div>
            <div id="markdown-subtitle" class="subtitle"></div>
          </div>
          <ha-icon id="markdown-icon" class="markdown-icon"></ha-icon>
        </div>

        <div id="markdown-content" class="markdown-content"></div>
      </ha-card>
    `;
  }

  updateDynamicDom() {
    this.setText("#markdown-title", this.config?.title ?? "");
    this.setText("#markdown-subtitle", this.config?.subtitle ?? "");
		const card = this.shadowRoot.querySelector("ha-card");
    const icon = this.shadowRoot.querySelector("#markdown-icon");
		const content = this.shadowRoot.querySelector("#markdown-content");

    if (icon) {
      icon.setAttribute("icon", this.config?.icon ?? "mdi:text-box-outline");
    }
		
		if (content && card) {
			const raw = this.config?.content ?? "";
			const expanded = this.expandEntities(raw);
			const hasContent = raw.trim().length > 0;

			card.classList.toggle("has-content", hasContent);
			card.classList.toggle("no-content", !hasContent);
		
			content.style.display = hasContent ? "" : "none";
			content.innerHTML = hasContent ? this.renderMarkdown(expanded) : "";
		}
  }
}

customElements.define("auri-ager-markdown-card", AuriAgerMarkdownCard);

class AuriAgerMarkdownCardEditor extends AuriAgerEditorBase {
  static cardClass = AuriAgerMarkdownCard;

  renderTextarea(path, label, value = this.valueAtPath(this._config, path)) {
    return `
      <label>
        <span>${label}</span>
        <textarea data-path="${path}">${this.escapeHtml(value ?? "")}</textarea>
      </label>
    `;
  }

  renderCheatSheet() {
    return `
      <div class="markdown-help">
        <div><code># Überschrift</code></div>
        <div><code>## Abschnitt</code></div>
        <div><code>**fett**</code></div>
        <div><code>*kursiv*</code></div>
        <div><code>\`code\`</code></div>
        <div><code>- Liste</code></div>
        <div><code>[Link](https://example.com)</code></div>
        <div><code>{{ sensor.beispiel }}</code></div>
      </div>
    `;
  }

  editorStyles() {
    return `
      ${super.editorStyles()}

      .markdown-help {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
        margin-top: 4px;
      }

      .markdown-help div {
        min-width: 0;
        padding: 7px 8px;
        border-radius: 10px;
        background: rgba(120,120,120,.08);
      }

      .markdown-help code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        white-space: nowrap;
      }
    `;
  }

  render() {
    const c = this._config ?? {};

    this.renderStandardEditor([
      {
        title: "Darstellung",
        body: `
          ${this.renderInput("title", "Titel", c.title)}
          ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
          ${this.renderInput("icon", "Icon", c.icon)}
          ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
          ${this.renderSelect("layout", "Layout", c.layout, [
            ["normal", "Normal"],
            ["small", "Small"],
          ])}
          ${this.renderSelect("theme", "Theme", c.theme, [
            ["auto", "Automatisch"],
            ["light", "Hell"],
            ["dark", "Dunkel"],
          ])}
        `,
      },
      {
        title: "Markdown",
        body: `
          ${this.renderTextarea("content", "Text", c.content)}
          ${this.renderCheatSheet()}
        `,
      },
    ]);
  }
}

customElements.define("auri-ager-markdown-card-editor", AuriAgerMarkdownCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-markdown-card",
  name: "Auri Ager Markdown",
  description: "Markdown text and headers in Auri Ager design language",
  preview: true,
});
/*
 * Auri Ager Gauge Card
 *
 * Display percent radius in Auri Ager design language
 */
 
class AuriAgerGaugeCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-gauge-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-gauge-card",
      title: "Autarkie",
      subtitle: "",
      entity: "",
      theme: "auto",
      accent: "autarky",
    };
  }

  getCardSize() {
    return 3;
  }

  stateSnapshot() {
    const entity = this.config.entity;
    return entity ? `${entity}:${this._hass?.states?.[entity]?.state ?? ""}` : "";
  }

  percentage() {
    const value = this.value(this.config.entity);
    return Math.max(0, Math.min(100, value));
  }

  styles() {
    const C = this.colors();
    const accent = this.config.accent_color ?? C.accent;

    return `
      <style>
        ${this.baseStyles(accent)}

        ha-card {
          display: grid;
          gap: 8px;
          padding: 14px 18px 16px;
        }

				.header {
				  margin-bottom: 8px;
				}

				.title {
					font-size: clamp(15px, 4.2vw, 20px);
					font-weight: 750;
					color: ${C.value};
					line-height: 1.05;
				
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				
				.gauge-wrap {
					min-height: 120px;
					display: grid;
					place-items: center;
					padding: 0;
				}

        svg {
          width: min(140px, 70%);
          height: auto;
          overflow: visible;
        }

        .ring-bg {
          fill: transparent;
          stroke: ${C.line};
          stroke-width: 16;
        }

        .ring {
          fill: transparent;
          stroke: ${accent};
          stroke-width: 16;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 110px 110px;
        }

        .value {
          font-size: 34px;
          font-weight: 850;
          fill: ${C.value};
          text-anchor: middle;
        }

        .label {
          font-size: 13px;
          fill: ${C.small};
          text-anchor: middle;
        }
      </style>
    `;
  }

  buildStaticDom() {
    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <div class="header">
          <div class="accent"></div>
          <div>
            <div id="gauge-title" class="title"></div>
            <div id="gauge-subtitle" class="subtitle"></div>
          </div>
        </div>

        <div class="gauge-wrap">
          <svg viewBox="0 0 220 220">
            <circle class="ring-bg" cx="110" cy="110" r="78"></circle>
            <circle id="gauge-ring" class="ring" cx="110" cy="110" r="78"></circle>
            <text id="gauge-value" x="110" y="106" class="value"></text>
            <text id="gauge-label" x="110" y="132" class="label"></text>
          </svg>
        </div>
      </ha-card>
    `;
    
    // Gauge
		this.attachEntityClick("ha-card", this.config.entity);
  }

  updateDynamicDom() {
    const pct = this.percentage();
    const circumference = 2 * Math.PI * 78;
    const dash = (pct / 100) * circumference;

		const isNarrow = this.offsetWidth < 180;
		this.setText(
			"#gauge-title",
			isNarrow
				? this.config.short_title ?? this.config.title
				: this.config.title
		);

    //this.setText("#gauge-title", this.config.title ?? "Gauge");
    this.setText("#gauge-subtitle", this.config.subtitle ?? "");
    this.setText("#gauge-value", `${Math.round(pct)}%`);
    this.setText("#gauge-label", this.config.label ?? this.config.title ?? "");

    this.shadowRoot
      ?.querySelector("#gauge-ring")
      ?.setAttribute("stroke-dasharray", `${dash} ${circumference}`);
  }
}

customElements.define("auri-ager-gauge-card", AuriAgerGaugeCard);

class AuriAgerGaugeCardEditor extends AuriAgerEditorBase {
  static cardClass = AuriAgerGaugeCard;

  render() {
    const c = this._config ?? {};

    this.renderStandardEditor([
      {
        title: "Darstellung",
        body: `
          ${this.renderInput("title", "Titel", c.title)}
          ${this.renderInput("short_title", "Kurztitel", c.short_title)}
          ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
          ${this.renderInput("label", "Label im Ring", c.label)}
          ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
          ${this.renderSelect("theme", "Theme", c.theme, [
            ["auto", "Automatisch"],
            ["light", "Hell"],
            ["dark", "Dunkel"],
          ])}
        `,
      },
      {
        title: "Entität",
        body: this.renderEntityPicker("entity", "Entity", c.entity),
      },
    ]);
  }
}

customElements.define("auri-ager-gauge-card-editor", AuriAgerGaugeCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-gauge-card",
  name: "Auri Ager Gauge",
  description: "Dashboard for percent values",
  preview: true,
});
/*
 * Auri Ager Progress Card
 *
 */

class AuriAgerProgressCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-progress-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-progress-card",
      entity: "",
      title: "Progress Bar",
      subtitle: "",
      icon: "mdi:battery-high",
      bar_color: "#f5b82e",
      layout: "normal",
      min: 0,
      max: 100,
      decimals: 0,
    };
  }

  getCardSize() {
    return 2;
  }

  accentColor() {
    return this.config?.accent_color ?? this.config?.accent ?? this.config?.bar_color ?? "#f5b82e";
  }

  stateSnapshot() {
    const entity = this.config?.entity;
    const state = entity ? this._hass?.states?.[entity] : null;
    return `${entity ?? ""}:${state?.state ?? ""}`;
  }

  valueNumber() {
    const entity = this.config?.entity;
    const state = entity ? this._hass?.states?.[entity] : null;
    const value = Number(state?.state);
    return Number.isFinite(value) ? value : 0;
  }

  minValue() {
    const value = Number(this.config?.min ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  maxValue() {
    const value = Number(this.config?.max ?? 100);
    return Number.isFinite(value) ? value : 100;
  }

  progressPercent() {
    const min = this.minValue();
    const max = this.maxValue();
    if (max <= min) return 0;

    return Math.max(0, Math.min(100, ((this.valueNumber() - min) / (max - min)) * 100));
  }

  valueText() {
    const entity = this.config?.entity;
    const decimals = this.config?.decimals ?? 0;
    const state = entity ? this._hass?.states?.[entity] : null;
    const value = Number(state?.state);
    const unit = this.config?.unit ?? state?.attributes?.unit_of_measurement ?? "%";

    if (!Number.isFinite(value)) return "";

    const formatted = value.toLocaleString("de-DE", {
		  minimumFractionDigits: decimals,
		  maximumFractionDigits: decimals,
		});

    return `${formatted}${unit ? " " + unit : ""}`;
  }

  styles() {
    const C = this.colors();
    const accent = this.accentColor();

    return `
      <style>
        ${this.baseStyles(accent)}

        ha-card {
          padding: 22px;
        }

        .progress-icon {
          color: ${C.icon};
          --mdc-icon-size: 30px;
        }

        .bar {
          height: 12px;
          border-radius: 999px;
          overflow: hidden;
          background: ${C.line};
        }

        .fill {
          height: 100%;
          width: 0%;
          border-radius: 999px;
          background: ${accent};
          transition: width .25s ease;
        }

        .value {
          font-size: 20px;
          font-weight: 800;
          color: ${C.value};
          white-space: nowrap;
        }

        ha-card.normal .progress-head {
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }

        ha-card.normal .bar {
          margin-top: 18px;
        }

        ha-card.small {
          padding-top: 14px;
          padding-bottom: 14px;
        }

        ha-card.small .progress-head {
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }

        ha-card.small .title-line {
          display: block;
          min-width: 0;
        }

        ha-card.small .subtitle {
        	display: block;
          font-size: 14px;
          margin-top: 1px;
        }

        ha-card.small .progress-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          margin-top: 12px;
        }

        ha-card.tiny {
          padding-top: 10px;
          padding-bottom: 10px;
        }

        ha-card.tiny .progress-head {
          display: grid;
          grid-template-columns: minmax(0, auto) minmax(80px, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        ha-card.tiny .accent,
        ha-card.tiny .subtitle,
        ha-card.tiny .progress-icon {
          display: none;
        }

        ha-card.tiny .title {
          font-size: 16px;
          line-height: 1;
          transform: translateY(2px);
        }

        ha-card.tiny .value {
          font-size: 16px;
          font-weight: 800;
        }

        ha-card.tiny .bar {
          height: 10px;
        }
      </style>
    `;
  }

  buildStaticDom() {
    const layout = this.config?.layout ?? "normal";

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card class="${layout}">
        ${layout === "tiny" ? `
          <div class="progress-head">
            <div id="progress-title" class="title"></div>
            <div class="bar">
              <div id="progress-fill" class="fill"></div>
            </div>
            <div id="progress-value" class="value"></div>
          </div>
        ` : `
          <div class="progress-head">
            <div class="accent"></div>
            <div class="title-line">
              <div id="progress-title" class="title"></div>
              <div id="progress-subtitle" class="subtitle"></div>
            </div>
            <ha-icon id="progress-icon" class="progress-icon"></ha-icon>
          </div>

          ${layout === "small" ? `
            <div class="progress-body">
              <div class="bar">
                <div id="progress-fill" class="fill"></div>
              </div>
              <div id="progress-value" class="value"></div>
            </div>
          ` : `
            <div class="progress-body">
              <div id="progress-value" class="value" style="text-align:right;margin-top:12px;"></div>
              <div class="bar">
                <div id="progress-fill" class="fill"></div>
              </div>
            </div>
          `}
        `}
      </ha-card>
    `;

    this.attachEntityClick("ha-card", this.config.entity);
  }

  updateDynamicDom() {
    this.setText("#progress-title", this.config?.title ?? "");
    this.setText("#progress-subtitle", this.config?.subtitle ?? "");
    this.setText("#progress-value", this.valueText());

    const icon = this.shadowRoot.querySelector("#progress-icon");
    if (icon) {
      icon.setAttribute("icon", this.config?.icon ?? "mdi:battery-high");
    }

    const fill = this.shadowRoot.querySelector("#progress-fill");
    if (fill) {
      fill.style.width = `${this.progressPercent()}%`;
    }
  }
}

customElements.define("auri-ager-progress-card", AuriAgerProgressCard);

class AuriAgerProgressCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = AuriAgerProgressCard.getStubConfig();
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.bindEntityPickers();
    this.shadowRoot.querySelectorAll("ha-icon-picker").forEach((el) => {
      el.hass = hass;
    });
  }

  setConfig(config) {
    this._config = {
      ...AuriAgerProgressCard.getStubConfig(),
      ...config,
    };

    this.render();
  }

  escapeHtml(value) {
    return `${value ?? ""}`
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  styles() {
    return `
      .editor {
        display: grid;
        gap: 14px;
        padding: 16px;
        font-family: var(--ha-font-family-body, system-ui);
      }

      .editor-card {
        display: grid;
        gap: 12px;
        padding: 12px;
        border: 1px solid rgba(120,120,120,.20);
        border-radius: 14px;
      }

      .section-title {
        font-size: 13px;
        font-weight: 700;
        opacity: .72;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 12px;
        opacity: .86;
      }

      input,
      select {
        box-sizing: border-box;
        width: 100%;
        padding: 9px 10px;
        border-radius: 10px;
        border: 1px solid rgba(120,120,120,.35);
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #202426);
        font: inherit;
      }

      input[type="color"] {
        height: 42px;
        padding: 4px;
      }
    `;
  }

  render() {
    const c = this._config ?? {};

    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>

      <div class="editor">
        <div class="editor-card">
          <div class="section-title">Darstellung</div>
          ${this.renderInput("title", "Titel", c.title)}
          ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
          ${this.renderInput("icon", "Icon", c.icon)}
          ${this.renderInput("bar_color", "Balkenfarbe", c.bar_color, "color")}
          ${this.renderInput("unit", "Einheit", c.unit ?? "%")}
          ${this.renderSelect("layout", "Layout", c.layout, [
            ["normal", "Normal"],
            ["small", "Small"],
            ["tiny", "Tiny"],
          ])}
          ${this.renderSelect("theme", "Theme", c.theme, [
            ["auto", "Automatisch"],
            ["light", "Hell"],
            ["dark", "Dunkel"],
          ])}
        </div>

        <div class="editor-card">
          <div class="section-title">Wert</div>
          ${this.renderEntityPicker("entity", "Entity", c.entity)}
          ${this.renderInput("min", "Minimum", c.min ?? 0, "number")}
          ${this.renderInput("max", "Maximum", c.max ?? 100, "number")}
          ${this.renderInput("decimals", "Nachkommastellen", c.decimals ?? 0, "number")}
        </div>
      </div>
    `;

    [
      "title",
      "subtitle",
      "icon",
      "bar_color",
      "unit",
      "layout",
      "theme",
      "entity",
      "min",
      "max",
      "decimals",
    ].forEach((key) => this.bindInput(key));

    this.bindEntityPickers();
  }

  bindInput(key) {
    const el = this.shadowRoot.querySelector("#" + key);
    if (!el) return;

    if (el.tagName?.toLowerCase() === "ha-icon-picker") {
      el.hass = this._hass;
      el.value = this._config?.[key] ?? "";
      el.addEventListener("value-changed", (ev) => {
        this.configChanged(key, ev.detail.value ?? "");
      });
      return;
    }

    el.addEventListener("change", (ev) => {
      const value = ev.target.type === "number" ? Number(ev.target.value) : ev.target.value;
      this.configChanged(key, value);
    });
  }

  bindEntityPickers() {
    this.shadowRoot.querySelectorAll("ha-entity-picker[data-key]").forEach((el) => {
      const key = el.dataset.key;
      el.hass = this._hass;
      el.value = this._config?.[key] ?? "";

      if (el._auriBound) return;
      el._auriBound = true;

      el.addEventListener("value-changed", (ev) => {
        this.configChanged(key, ev.detail.value ?? "");
      });
    });
  }

  configChanged(key, value) {
    const config = {
      ...this._config,
      [key]: value,
    };

    this._config = config;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  renderSelect(key, label, value, options = []) {
    return `
      <label>
        <span>${label}</span>
        <select id="${key}">
          ${options
            .map(([v, text]) => `
              <option value="${this.escapeHtml(v)}" ${value === v ? "selected" : ""}>
                ${this.escapeHtml(text)}
              </option>
            `)
            .join("")}
        </select>
      </label>
    `;
  }

  renderInput(key, label, value = "", type = "text") {
    if (type === "text" && key.endsWith("icon")) {
      return `
        <label>
          <span>${label}</span>
          <ha-icon-picker id="${key}" data-value="${this.escapeHtml(value ?? "")}"></ha-icon-picker>
        </label>
      `;
    }

    return `
      <label>
        <span>${label}</span>
        <input type="${type}" id="${key}" value="${this.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  renderEntityPicker(key, label, value = "") {
    return `
      <label>
        <span>${label}</span>
        <ha-entity-picker
          data-key="${key}"
          data-value="${this.escapeHtml(value ?? "")}"
          allow-custom-entity>
        </ha-entity-picker>
      </label>
    `;
  }
}

customElements.define("auri-ager-progress-card-editor", AuriAgerProgressCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-progress-card",
  name: "Auri Ager Progress",
  description: "Progress Bar Card",
  preview: true,
});
/* ==========================================================================
 * Auri Ager Sun
 * Source: auri-ager-sun-card(8).js
 * ========================================================================== */

/*
 * Auri Ager Sun
 * Calm sun azimuth and elevation visualization for Home Assistant
 *
 * Copyright (c) 2026 Stefanie Ramroth
 *
 * Licensed under the Apache License, Version 2.0
 * You may obtain a copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * ----------------------------------------------------------------------------
 * Version: 0.0.1
 * Status : HACS Initial Release
 *
 * Design philosophy:
 * Visual overload kills understanding.
 * Information needs no animation.
 * Calmness is a feature.
 * ----------------------------------------------------------------------------
 */
class AuriAgerSunCard extends HTMLElement {
	static getConfigElement() {
		return document.createElement(
			"auri-ager-sun-card-editor"
		);
	}
	
	static getStubConfig() {
		return {
			type: "custom:auri-ager-sun-card",
			title: false,
			entities: {
				sun: "sun.sun",
			},
			expert: {
				solar_arc: true,
				daylight_band: true,
			},
			calibration: {
				sunrise_offset_minutes: 0,
				sunset_offset_minutes: 0,
			},
			display_time: true,
		};
	}

  static COLOR_SCHEMES = {
  	light: {
			cardBg: "#ffffff",
			cardBorder: "rgba(0,0,0,.06)",

			text: "rgba(25,25,25,.92)",
			label: "rgba(60,60,60,.62)",
			line: "rgba(100,100,100,.52)",
			icon: "rgba(60,60,60,.70)",

			sun: "#f5b82e",
			sunset: "#d94a2b",
			sunrise: "#ff8a50",

			night: "rgba(80,80,80,.55)",
			ring: "rgba(100,100,100,.35)",

			backgroundOpacity: .28,
  	},
  	dark: {
			cardBg: "#1f2326",
			cardBorder: "rgba(255,255,255,.08)",
		
			text: "rgba(245,247,248,.94)",
			label: "rgba(220,225,228,.72)",
			line: "rgba(210,215,218,.38)",
			icon: "rgba(220,225,228,.70)",
		
			sun: "#f5b82e",
			sunset: "#ff8a50",
			sunrise: "#ff9d70",
		
			night: "rgba(170,175,180,.75)",
			ring: "rgba(220,225,228,.28)",
		
			backgroundOpacity: .18,
  	},
  };

  setConfig(config) {
    this.config = config;
    this._built = false;
    this._lastSnapshot = null;
    this._raf = null;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;

    if (!this.config || !this._hass) return;

    if (!this._built) {
      this.buildStaticDom();
      this._built = true;
      this._lastSnapshot = null;
    }

    const snapshot = this.stateSnapshot();
    if (snapshot === this._lastSnapshot) return;

    this._lastSnapshot = snapshot;

    if (this._raf) {
      cancelAnimationFrame(this._raf);
    }

    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      this.updateDynamicDom();
    });
  }

  getCardSize() {
    return 2;
  }

	themeMode() {
		const configured = this.config.theme ?? "auto";
	
		if (configured !== "auto") {
			return configured;
		}
	
		const theme = this._hass?.themes?.darkMode;
		return theme ? "dark" : "light";
	}
	
	colors() {
		const mode = this.themeMode();
		return this.constructor.COLOR_SCHEMES[mode]
			?? this.constructor.COLOR_SCHEMES.light;
	}

  stateSnapshot() {
    const sun = this.sunState();
    const attrs = sun?.attributes ?? {};

    return [
      sun?.state ?? "",
      attrs.azimuth ?? "",
      attrs.elevation ?? "",
      attrs.next_rising ?? "",
      attrs.next_setting ?? "",
    ].join("|");
  }

  geometry() {
    const hasTitle = this.config.title !== false;

    return {
      cx: 100,
      cy: hasTitle ? 108 : 92,
      r: 62,
    };
  }

  formatTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  sunEntity() {
    return this.config.entities?.sun ?? this.config.sun ?? "sun.sun";
  }

  sunState() {
    return this._hass?.states?.[this.sunEntity()];
  }

  num(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  timeToDegrees(date, offsetMinutes = 0) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 0;

    const minutes = date.getHours() * 60 + date.getMinutes() + offsetMinutes;
    return (minutes / 1440) * 360;
  }

  polar(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;

    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  arcPath(cx, cy, r, startDeg, endDeg) {
    const start = this.polar(cx, cy, r, startDeg);
    const end = this.polar(cx, cy, r, endDeg);

    const delta = (endDeg - startDeg + 360) % 360;
    const largeArc = delta > 180 ? 1 : 0;

    return `
      M ${start.x} ${start.y}
      A ${r} ${r}
        0 ${largeArc} 1
        ${end.x} ${end.y}
    `;
  }

  solarArcPath(cx, cy, r, startDeg, endDeg, elevation) {
    const start = this.polar(cx, cy, r, startDeg);
    const end = this.polar(cx, cy, r, endDeg);

    // The sun path is not intended to be a perfect astronomical model.
    // It is a calm visual projection: sunrise and sunset stay on the ring,
    // while the seasonal elevation moves the peak between winter and summer.
    const span = (endDeg - startDeg + 360) % 360;
    const skew = (180 - span) / 180;

    // Night values are clamped to 0. High summer values are capped to keep the
    // path visually stable inside the compact card geometry.
    const elevationClamped = Math.max(0, Math.min(70, elevation));
    const seasonFactor = elevationClamped / 70;

    const winterPeakY = cy + r * 0.85;
    const summerPeakY = cy + r * 0.3;

    const peak = {
      x: cx + r * (-0.06 - skew * 0.22),
      y: winterPeakY + (summerPeakY - winterPeakY) * seasonFactor,
    };

    const c1 = {
      x: start.x - r * (0.04 + skew * 0.1),
      y: peak.y + r * 0.08,
    };

    const c2 = {
      x: end.x - r * (0.04 - skew * 0.18),
      y: peak.y + r * 0.08,
    };

    return `
      M ${start.x} ${start.y}
      Q ${c1.x} ${c1.y}
        ${peak.x} ${peak.y}
      Q ${c2.x} ${c2.y}
        ${end.x} ${end.y}
    `;
  }

  sunRadiusForElevation(baseRadius, elevation) {
    const clamped = Math.max(0, Math.min(90, elevation));

    // 0°  -> sun sits on the horizon/ring.
    // 90° -> sun moves toward the center, but not into the text area.
    const innerRadius = baseRadius * 0.34;

    return baseRadius - (clamped / 90) * (baseRadius - innerRadius);
  }

  sunIcon() {
    return `
      <g class="sun-icon">
        <circle class="sun-core" cx="0" cy="0" r="7"/>

        <line x1="0" y1="-16" x2="0" y2="-11"/>
        <line x1="0" y1="11" x2="0" y2="16"/>

        <line x1="-16" y1="0" x2="-11" y2="0"/>
        <line x1="11" y1="0" x2="16" y2="0"/>

        <line x1="-11.3" y1="-11.3" x2="-7.8" y2="-7.8"/>
        <line x1="7.8" y1="7.8" x2="11.3" y2="11.3"/>

        <line x1="11.3" y1="-11.3" x2="7.8" y2="-7.8"/>
        <line x1="-7.8" y1="7.8" x2="-11.3" y2="11.3"/>
      </g>
    `;
  }

  sunriseIcon() {
    return `
      <g class="event-icon sunrise-icon">
        <path d="M-8 4 A8 8 0 0 1 8 4"/>
        <path d="M0 4 V-8"/>
        <path d="M-3 -5 L0 -8 L3 -5"/>
      </g>
    `;
  }

  sunsetIcon() {
    return `
      <g class="event-icon sunset-icon">
        <path d="M-8 4 A8 8 0 0 1 8 4"/>
        <path d="M0 -8 V4"/>
        <path d="M-3 1 L0 4 L3 1"/>
      </g>
    `;
  }

  resolveData() {
    const sun = this.sunState();
    const attrs = sun?.attributes ?? {};
    const calibration = this.config.calibration ?? {};

    const azimuth = this.num(attrs.azimuth);
    const elevation = this.num(attrs.elevation);
    const sunrise = new Date(attrs.next_rising);
    const sunset = new Date(attrs.next_setting);
    const now = new Date();

    const sunriseMinutes = sunrise.getHours() * 60 + sunrise.getMinutes();
    const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const dayProgress = Math.max(
      0,
      Math.min(1, (nowMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes)),
    );

    return {
      azimuth,
      elevation,
      sunriseAngle: this.timeToDegrees(
        sunrise,
        calibration.sunrise_offset_minutes ?? 0,
      ),
      sunsetAngle: this.timeToDegrees(
        sunset,
        calibration.sunset_offset_minutes ?? 0,
      ),
      sunrise,
      sunset,
      dayProgress,
      isAboveHorizon: sun?.state === "above_horizon" || elevation > 0,
    };
  }

  styles() {
		const C = this.colors();

    return `
      <style>
        ha-card {
          padding: 12px;
          border-radius: 20px;
          overflow: hidden;
          background: ${C.cardBg};
					border: 1px solid ${C.cardBorder};
          box-shadow: none;
        }

        svg {
          display: block;
          width: 100%;
          max-width: 200px;
          height: auto;
          margin: 0 auto;
          font-family: var(--ha-font-family-body, system-ui);
          overflow: hidden;
        }

        .title {
          font-size: 15px;
          font-weight: 700;
          fill: ${C.text};
          dominant-baseline: hanging;
        }

        .event-time {
          font-size: 10px;
          font-weight: 650;
          fill: ${C.label};
          text-anchor: middle;
          dominant-baseline: middle;
        }

        .ring {
          fill: none;
          stroke-width: 6;
          opacity: .85;
        }

        .direction {
          font-size: 12px;
          fill: ${C.label};
          text-anchor: middle;
          font-weight: 600;
        }

        .marker {
          fill: none;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .sunrise { stroke: ${C.sunrise}; }
        .sunset { stroke: ${C.sunset}; }

        .sun-icon {
          fill: none;
          stroke: var(--auri-sun-color, #f5b82e);
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .sun-core {
          fill: var(--auri-sun-color, #f5b82e);
        }

        .event-icon {
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .sunrise-icon { stroke: #ff8a50; }
        .sunset-icon { stroke: #d94a2b; }

        .solar-arc {
          fill: none;
          stroke: rgba(245,184,46,.75);
          stroke-width: 3.2;
          stroke-dasharray: 4 3;
          stroke-linecap: round;
        }

        .daylight-band {
          fill: none;
          stroke-width: 7;
          opacity: .65;
          stroke-linecap: round;
        }

        .center-value {
          font-size: 32px;
          font-weight: 750;
          fill: ${C.text};
          text-anchor: middle;
        }

        .center-label {
          font-size: 13px;
          fill: ${C.label};
          text-anchor: middle;
        }
      </style>
    `;
  }

  buildStaticDom() {
    const title = this.config.title;
    const showTitle = title !== false;
    const background = this.config.background;
    const show = this.config.show ?? {};
    const expert = this.config.expert ?? {};
    const { cx, cy, r } = this.geometry();

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <svg viewBox="0 0 200 200">
          ${showTitle ? `<text x="8" y="8" class="title">${title ?? "Sonnenstand"}</text>` : ""}

          <clipPath id="sun-bg-clip">
            <circle cx="${cx}" cy="${cy}" r="${r}"/>
          </clipPath>

          ${background
            ? `<image href="${background}"
                      x="${cx - r}"
                      y="${cy - r}"
                      width="${r * 2}"
                      height="${r * 2}"
                      opacity="${this.colors().backgroundOpacity}"
                      preserveAspectRatio="xMidYMid slice"
                      clip-path="url(#sun-bg-clip)"/>`
            : ""}

          <circle id="compass-ring" cx="${cx}" cy="${cy}" r="${r}" class="ring"/>

          ${show.directions !== false
            ? `<text x="${cx}" y="${cy - r - 10}" class="direction">N</text>
               <text x="${cx + r + 12}" y="${cy + 4}" class="direction">O</text>
               <text x="${cx}" y="${cy + r + 18}" class="direction">S</text>
               <text x="${cx - r - 14}" y="${cy + 4}" class="direction">W</text>`
            : ""}

          ${show.sunrise !== false
            ? `<g id="sunrise-marker" class="marker">
                 ${this.sunriseIcon()}
               </g>`
            : ""}

          ${show.sunset !== false
            ? `<g id="sunset-marker" class="marker">
                 ${this.sunsetIcon()}
               </g>`
            : ""}

          ${this.config.display_time === true
            ? `<text id="sunrise-time" class="event-time"></text>
               <text id="sunset-time" class="event-time"></text>`
            : ""}

          ${expert.solar_arc
            ? `<path id="solar-arc" class="solar-arc"/>`
            : ""}

          ${expert.daylight_band
            ? `<path id="daylight-band" class="daylight-band"/>`
            : ""}

          <g id="sun-marker" class="sun">
            ${this.sunIcon()}
          </g>

          <text id="elevation-value" x="${cx}" y="${cy + 8}" class="center-value"></text>
          <text x="${cx}" y="${cy + 28}" class="center-label">Elevation</text>
        </svg>
      </ha-card>
    `;
  }

  updateDynamicDom() {
    const data = this.resolveData();
    const expert = this.config.expert ?? {};
    const { cx, cy, r } = this.geometry();
		const COLORS = this.colors();

    // With solar_arc enabled the sun moves inward based on elevation.
    // Without solar_arc it stays on the compass ring. Negative elevation is
    // clamped so the night position remains stable on the horizon.
    //const visualElevation = expert.solar_arc ? Math.max(0, data.elevation) : 0;
    //const sunRadius = this.sunRadiusForElevation(r, visualElevation);

    //const sunPos = this.polar(cx, cy, sunRadius, data.azimuth);
    const sunrisePos = this.polar(cx, cy, r, data.sunriseAngle);
    const sunsetPos = this.polar(cx, cy, r, data.sunsetAngle);

    const ring = this.shadowRoot.querySelector("#compass-ring");
    if (ring) {
      ring.setAttribute(
        "stroke",
        data.isAboveHorizon ? "rgba(245,184,46,.85)" : "rgba(80,80,80,.55)",
      );
    }

    const arc = this.shadowRoot.querySelector("#solar-arc");
    if (arc) {
      arc.setAttribute(
        "d",
        this.solarArcPath(
          cx,
          cy,
          r,
          data.sunriseAngle,
          data.sunsetAngle,
          data.elevation,
        ),
      );
    }

    const band = this.shadowRoot.querySelector("#daylight-band");
    if (band) {
      band.setAttribute(
        "d",
        this.arcPath(cx, cy, r + 11, data.sunriseAngle, data.sunsetAngle),
      );

      band.setAttribute(
        "stroke",
        data.isAboveHorizon ? "rgba(245,184,46,.38)" : "rgba(80,80,80,.25)",
      );
    }

		const sunMarker = this.shadowRoot.querySelector("#sun-marker");
		
		if (sunMarker) {
			const isDayVisual =
				data.isAboveHorizon &&
				data.elevation >= 0;
		
			const visualElevation =
				expert.solar_arc && isDayVisual
					? data.elevation
					: 0;
		
			const sunRadius = this.sunRadiusForElevation(r, visualElevation);
			const sunPos = this.polar(cx, cy, sunRadius, data.azimuth);
		
			sunMarker.setAttribute(
				"transform",
				`translate(${sunPos.x} ${sunPos.y})`
			);
		
			sunMarker.style.setProperty(
				"--auri-sun-color",
				isDayVisual
					? COLORS.sun
					: COLORS.night
			);
		}

    const sunriseMarker = this.shadowRoot.querySelector("#sunrise-marker");
    if (sunriseMarker) {
      sunriseMarker.setAttribute(
        "transform",
        `translate(${sunrisePos.x} ${sunrisePos.y}) rotate(${data.sunriseAngle})`,
      );
    }

    const sunsetMarker = this.shadowRoot.querySelector("#sunset-marker");
    if (sunsetMarker) {
      sunsetMarker.setAttribute(
        "transform",
        `translate(${sunsetPos.x} ${sunsetPos.y}) rotate(${data.sunsetAngle})`,
      );
    }

    const sunriseTime = this.shadowRoot.querySelector("#sunrise-time");
    if (sunriseTime) {
      sunriseTime.textContent = this.formatTime(data.sunrise);
      sunriseTime.setAttribute("x", sunrisePos.x + 30);
      sunriseTime.setAttribute("y", sunrisePos.y + 2);
    }

    const sunsetTime = this.shadowRoot.querySelector("#sunset-time");
    if (sunsetTime) {
      sunsetTime.textContent = this.formatTime(data.sunset);
      sunsetTime.setAttribute("x", sunsetPos.x - 30);
      sunsetTime.setAttribute("y", sunsetPos.y + 2);
    }

    const elevation = this.shadowRoot.querySelector("#elevation-value");
    if (elevation) {
      elevation.textContent = `${data.elevation.toFixed(1)}°`;
    }
  }
}

customElements.define("auri-ager-sun-card", AuriAgerSunCard);

class AuriAgerSunCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  render() {
    this.innerHTML = `
      <ha-form id="form"></ha-form>
    `;

    const form = this.querySelector("#form");

    form.hass = this._hass;

form.schema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "sun",
        label: "Sonnen-Entität",
        selector: {
          entity: {
            domain: "sun",
          },
        },
      },
    ],
  },
  {
    name: "display_time",
    label: "Uhrzeiten anzeigen",
    selector: {
      boolean: {},
    },
  },
  {
    name: "expert",
    type: "grid",
    schema: [
      {
        name: "solar_arc",
        label: "Solarbogen anzeigen",
        selector: {
          boolean: {},
        },
      },
      {
        name: "daylight_band",
        label: "Tageslichtband anzeigen",
        selector: {
          boolean: {},
        },
      },
    ],
  },
  {
    name: "calibration",
    type: "grid",
    schema: [
      {
        name: "sunrise_offset_minutes",
        label: "Sonnenaufgang Korrektur",
        selector: {
          number: {
            min: -180,
            max: 180,
            step: 1,
          },
        },
      },
      {
        name: "sunset_offset_minutes",
        label: "Sonnenuntergang Korrektur",
        selector: {
          number: {
            min: -180,
            max: 180,
            step: 1,
          },
        },
      },
    ],
  },
];

form.computeLabel = (schema) => {
  const labels = {
    entities: "Entitäten",
    sun: "Sonne",
    background: "Hintergrundbild",
    display_time: "Uhrzeiten anzeigen",
    expert: "Expertenoptionen",
    solar_arc: "Solarbogen anzeigen",
    daylight_band: "Tageslichtband anzeigen",
    calibration: "Kalibrierung",
    sunrise_offset_minutes: "Sonnenaufgang Korrektur",
    sunset_offset_minutes: "Sonnenuntergang Korrektur",
  };

  return labels[schema.name] ?? schema.name;
};

    form.data = JSON.parse(
    	JSON.stringify(this._config)
		);

    form.addEventListener(
      "value-changed",
      (ev) => {
        this.dispatchEvent(
          new CustomEvent(
            "config-changed",
            {
              detail: {
                config: ev.detail.value
              },
              bubbles: true,
              composed: true
            }
          )
        );
      }
    );
  }
}

customElements.define(
  "auri-ager-sun-card-editor",
  AuriAgerSunCardEditor
);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-sun-card",
  name: "Auri Ager Sun",
  description: "Sun position and daylight visualization",
  preview: true,
});

/*
 * Auri Ager Flow
 *
 * Calm energy flow visualization for Home Assistant
 */
class AuriAgerFlowCard extends HTMLElement {
	static getConfigElement() {
		return document.createElement("auri-ager-flow-card-editor");
	}
	
	static getStubConfig() {
		return {
			type: "custom:auri-ager-flow-card",
			theme: "auto",
			hide_zeros: false,
			max_width: 1200,
		};
	}

  static COLOR_SCHEMES = {
  	light: {
			cardBg: "#ffffff",
			cardBorder: "rgba(0,0,0,.06)",
			accent: "#f5b82e",

			icon: "rgba(60,60,60,.70)",
			line: "rgba(100,100,100,.58)",
			pill: "rgba(100,100,100,.72)",
			arrow: "rgba(100,100,100,.62)",

			label: "rgba(60,60,60,.65)",
			small: "rgba(60,60,60,.55)",
			value: "rgba(25,25,25,.95)",
			center: "#202426",

			autarky: "#f5b82e",
			ringBg: "#eceff1",
			selfConsumption: "rgba(100,100,100,.72)"
  	},
  	dark: {
			cardBg: "#1f2326",
			cardBorder: "rgba(255,255,255,.08)",
			accent: "#f5b82e",
		
			icon: "rgba(220,225,228,.68)",
			line: "rgba(190,195,198,.42)",
			pill: "rgba(210,215,218,.62)",
			arrow: "rgba(210,215,218,.58)",
		
			label: "rgba(220,225,228,.64)",
			small: "rgba(220,225,228,.52)",
			value: "rgba(245,247,248,.94)",
			center: "#f3f5f6",
		
			autarky: "#f5b82e",
			ringBg: "rgba(255,255,255,.12)",
			selfConsumption: "rgba(220,225,228,.78)"
  	},
  };

  static THRESHOLD_W = 30;
  static THRESHOLD_W_ZERO = 0;

  static LAYOUTS = {
    full: {
      viewBox: "0 0 600 600",
      autarky: { x: 250, y: 325, r: 78 },
      selfConsumption: { x: 90, y: 325, r: 40 },
      nodes: {
        pv: { x: 95, y: 75 },
        external: { x: 250, y: 75 },
        grid: { x: 405, y: 75 },
        battery: { x: 95, y: 505 },
        wallbox: { x: 250, y: 505 },
        consumption: { x: 380, y: 505 },
        heatpump: { x: 520, y: 380 },
        home: { x: 520, y: 505 },
      },
    },

    simple: {
      viewBox: "0 0 600 600",
      autarky: { x: 300, y: 325, r: 78 },
      selfConsumption: { x: 140, y: 325, r: 40 },
      nodes: {
        pv: { x: 145, y: 75 },
        external: { x: 300, y: 75 },
        grid: { x: 455, y: 75 },
        battery: { x: 145, y: 505 },
        wallbox: { x: 300, y: 505 },
        consumption: { x: 430, y: 505 },
        heatpump: { x: 570, y: 380 },
        home: { x: 570, y: 505 },
      },
    },
  };

	static PATHS = {
		full: {
			pv: "M95 175 L95 245 Q95 260 115 260 L170 260",
			external: "M250 175 L250 230",
			externalToPv: "M225 107 H120",
			grid: "M405 175 L405 245 Q405 260 385 260 L330 260",
			battery: "M170 390 H120 Q95 390 95 415 V470",
			wallbox: "M250 425 L250 470",
			consumption: "M330 390 H355 Q380 390 380 415 V470",
			heatpump: "M410 520 H430 Q450 520 450 500 V430 Q450 405 475 405 H495",
			home: "M410 535 L500 535",
			wallboxBehindHome: "M355 535 H285",
		},
	
		simple: {
			pv: "M145 175 L145 245 Q145 260 165 260 L220 260",
			external: "M300 175 L300 230",
			externalToPv: "M275 107 H170",
			grid: "M455 175 L455 245 Q455 260 435 260 L380 260",
			battery: "M220 390 H170 Q145 390 145 415 V470",
			wallbox: "M300 425 L300 470",
			consumption: "M380 390 H405 Q430 390 430 415 V470",
			heatpump: "M460 520 H480 Q500 520 500 500 V430 Q500 405 525 405 H545",
			home: "M460 535 L550 535",
			wallboxBehindHome: "M405 535 H335",
		},
	};

  setConfig(config) {
    this.config = config;
		this._lastSnapshot = null;
		this._raf = null;
		this._layoutMode = this.layoutMode();

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._built = false;
  }

	set hass(hass) {
		this._hass = hass;
	
		if (!this.config || !this._hass) return;

		const nextLayoutMode = this.layoutMode();

		if (nextLayoutMode !== this._layoutMode) {
		  this._layoutMode = nextLayoutMode;
		  this._built = false;
		  this._lastSnapshot = null;
		}

		if (!this._built) {
			this.buildStaticDom();
			this._built = true;
			this._lastSnapshot = null;
		}
	
		const snapshot = this.stateSnapshot();
	
		if (snapshot === this._lastSnapshot) {
			return;
		}
	
		this._lastSnapshot = snapshot;
	
		if (this._raf) {
			cancelAnimationFrame(this._raf);
		}
	
		this._raf = requestAnimationFrame(() => {
			this._raf = null;
			this.updateDynamicDom();
		});
	}

	stateSnapshot() {
		const entities = this.config.entities ?? {};
	
		const ids = [
			entities.solar,
			entities.external,
			entities.grid,
			entities.battery_power,
			entities.battery_soc,
			entities.battery_runtime,
			entities.home,
			entities.wallbox,
			entities.heatpump,
			entities.autarky,
			entities.self_consumption,
		].filter(Boolean);
	
		return ids
			.map((id) => `${id}:${this._hass?.states?.[id]?.state ?? ""}`)
			.join("|");
	}

  render() {
    if (!this.config || !this._hass) return;

    if (!this._built) {
      this.buildStaticDom();
      this._built = true;
    }

    this.updateDynamicDom();
  }

  getCardSize() {
    return 5;
  }

	themeMode() {
		const configured = this.config.theme ?? "auto";
	
		if (configured !== "auto") {
			return configured;
		}
	
		const theme = this._hass?.themes?.darkMode;
		return theme ? "dark" : "light";
	}
	
	colors() {
		const mode = this.themeMode();
		return AuriAgerFlowCard.COLOR_SCHEMES[mode]
			?? AuriAgerFlowCard.COLOR_SCHEMES.light;
	}

  layoutMode() {
	  return this.hasSecondaryConsumer() ? "full" : "simple";
  }

  currentLayout() {
    return AuriAgerFlowCard.LAYOUTS[this.layoutMode()];
  }

  currentPaths() {
    return AuriAgerFlowCard.PATHS[this.layoutMode()];
  }

	dashboardTitle() {
		return this.config.title ?? "Aktuelle Werte";
	}
	
	formatDateTime(date = new Date()) {
		return date.toLocaleString("de-DE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}

	hasSecondaryConsumer() {
		const entities = this.config?.entities ?? {};
	
		const heatpumpMode =
			this.config?.heatpump?.mode ?? "behind_home";
	
		const wallboxMode =
			this.config?.wallbox?.mode ?? "behind_home";
	
		const available = {
			wallbox: this.hasEntity(entities.wallbox),
			heatpump: this.hasEntity(entities.heatpump),
		};
	
		const needsHomeSplit =
			available.heatpump;
		
		const needsWallboxSplit =
			available.wallbox &&
			wallboxMode === "behind_home";
		
		return (
			needsHomeSplit ||
			needsWallboxSplit
		);
	}

	hasEntity(entity) {
	  return typeof entity === "string" && entity.trim().length > 0;
	}

  value(entity) {
    if (!entity) return 0;

    const state = this._hass?.states?.[entity];
    const value = Number(state?.state);

    return Number.isFinite(value) ? value : 0;
  }

  valueText(entity) {
    if (!entity) return "";

    const state = this._hass?.states?.[entity];
    const value = state?.state;

    if (
      !value ||
      value === "00:00" ||
      value === "unknown" ||
      value === "unavailable"
    ) {
      return "";
    }

    return String(value);
  }

  clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  fmtW(value) {
		const hideZeros = this.config.hide_zeros ?? false;
    const abs = Math.abs(value);

		if ( hideZeros && abs < 0.5	) { return ""; }

    if (abs >= 1000) {
      return `${(abs / 1000).toFixed(1)} kW`;
    }

    return `${Math.round(abs)} W`;
  }

  isActive(value) {
    return Math.abs(value) > AuriAgerFlowCard.THRESHOLD_W;
  }

  markerAttrs(markerId, forward = true) {
    return forward
      ? `marker-end="url(#${markerId}-end)"`
      : `marker-start="url(#${markerId}-start)"`;
  }

  setText(selector, value) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.textContent = value ?? "";
  }

  setHTML(selector, value) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.innerHTML = value ?? "";
  }

  setVisible(selector, visible) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.style.display = visible ? "" : "none";
  }

  setPathDirection(pathSelector, forward) {
    const path = this.shadowRoot?.querySelector(pathSelector);
    if (!path) return;

    path.removeAttribute("marker-start");
    path.removeAttribute("marker-end");

    if (forward) {
      path.setAttribute("marker-end", "url(#flow-arrow-end)");
    } else {
      path.setAttribute("marker-start", "url(#flow-arrow-start)");
    }
  }

  setPillDirection(flowName, reverse, pad = 0.08) {
    const motion = this.shadowRoot?.querySelector(
      `#flow-${flowName} animateMotion`
    );

    if (!motion) return;

    const start = pad;
    const end = 1 - pad;

    motion.setAttribute("keyPoints", reverse ? `${end};${start}` : `${start};${end}`);
    motion.setAttribute("keyTimes", "0;1");
    motion.setAttribute("calcMode", "linear");
  }

  fireMoreInfo(entityId) {
    if (!entityId) return;

    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      })
    );
  }
  
	attachEntityHandlers() {
		const entities = this.config.entities ?? {};
	
		const mapping = {
			"node-pv": entities.solar,
			"node-external": entities.external,
			"node-grid": entities.grid,
			"node-battery-soc": entities.battery_soc,
			"node-battery-power": entities.battery_power,
			"node-wallbox": entities.wallbox,
			"node-consumption": entities.home,
			"node-heatpump": entities.heatpump,
			"node-home": entities.home,
		};
	
		Object.entries(mapping).forEach(([id, entity]) => {
			const el = this.shadowRoot?.querySelector(`#${id}`);
	
			if (!el || !entity) return;
	
			el.style.cursor = "pointer";
	
			el.addEventListener("click", () => {
				this.dispatchEvent(
					new CustomEvent("hass-more-info", {
						bubbles: true,
						composed: true,
						detail: {
							entityId: entity,
						},
					})
				);
			});
		});
	}

  arrowDef(id) {
		const color = this.colors().arrow;
    return `
      <marker id="${id}-end"
              markerWidth="11"
              markerHeight="11"
              refX="8.1"
              refY="5.5"
              orient="auto"
              markerUnits="userSpaceOnUse">
        <path d="M3,2.2 L8.1,5.5 L3,8.8"
              fill="none"
              stroke="${color}"
              stroke-width="1.55"
              stroke-linecap="round"
              stroke-linejoin="round"/>
      </marker>

      <marker id="${id}-start"
              markerWidth="11"
              markerHeight="11"
              refX="2.9"
              refY="5.5"
              orient="auto"
              markerUnits="userSpaceOnUse">
        <path d="M8,2.2 L2.9,5.5 L8,8.8"
              fill="none"
              stroke="${color}"
              stroke-width="1.55"
              stroke-linecap="round"
              stroke-linejoin="round"/>
      </marker>
    `;
  }

  flowSvg(name, pathId, d, duration, marker = `marker-end="url(#flow-arrow-end)"`) {
    return `
      <g id="flow-${name}">
        <path id="${pathId}"
              class="line"
              ${marker}
              d="${d}" />

        <rect class="pill" x="-10" y="-5" width="20" height="10" rx="5" ry="5">
          <animateMotion
            dur="${duration}s"
            repeatCount="indefinite"
            rotate="auto"
            keyPoints="0.08;0.92"
            keyTimes="0;1"
            calcMode="linear">
            <mpath href="#${pathId}"/>
          </animateMotion>
        </rect>
      </g>
    `;
  }

  iconWrap(svg) {
    return `<g class="node-icon">${svg}</g>`;
  }

  solarIcon() {
    return this.iconWrap(`
      <circle cx="20" cy="20" r="7"/>
      <line x1="20" y1="5" x2="20" y2="10"/>
      <line x1="20" y1="30" x2="20" y2="35"/>
      <line x1="5" y1="20" x2="10" y2="20"/>
      <line x1="30" y1="20" x2="35" y2="20"/>
      <line x1="10" y1="10" x2="13.5" y2="13.5"/>
      <line x1="26.5" y1="26.5" x2="30" y2="30"/>
      <line x1="26.5" y1="13.5" x2="30" y2="10"/>
      <line x1="10" y1="30" x2="13.5" y2="26.5"/>
    `);
  }

  moonIcon() {
    return this.iconWrap(`
      <path d="M25 8
               C18 10 14 15 14 21
               C14 28 20 33 27 32
               C23 35 17 35 13 31
               C8 27 7 19 10 14
               C13 9 19 6 25 8Z"/>
    `);
  }

  externalIcon() {
    return this.iconWrap(`
      <path d="M23 6 L13 22 H20 L16 34 L28 17 H21 Z"/>
    `);
  }

  gridIcon() {
    return this.iconWrap(`
      <path d="M20 6 V34"/>
      <path d="M12 18 H28"/>
      <path d="M14 13 H26"/>
      <path d="M9 34 H31"/>
      <path d="M20 6 L11 34"/>
      <path d="M20 6 L29 34"/>
    `);
  }

  homeIcon() {
    return this.iconWrap(`
      <path d="M9 21 L20 10 L31 21"/>
      <path d="M12 20 V32 H28 V20"/>
      <path d="M17 32 V24 H23 V32"/>
    `);
  }

	consumptionIcon() {
		return this.iconWrap(`
			<!-- Haus -->
			<path d="M9 21 L20 10 L31 21"/>
			<path d="M12 20 V32 H28 V20"/>
	
			<!-- Verbrauchsbalken -->
			<path d="M15 28 V26"/>
			<path d="M18 28 V23"/>
			<path d="M21 28 V21"/>
			<path d="M24 28 V18"/>
		`);
	}

  wallboxIcon() {
    return this.iconWrap(`
      <rect x="11" y="8" width="18" height="26" rx="4"/>
      <path d="M20 14 L20 26"/>
      <path d="M29 16 C35 16 35 28 29 28"/>
      <path d="M17 27 H23"/>
    `);
  }

  heatpumpIcon() {
    return this.iconWrap(`
      <circle cx="20" cy="20" r="12"/>
      <circle cx="20" cy="20" r="2"/>
      <path d="M20 8 C25 12 25 17 20 20"/>
      <path d="M32 20 C28 25 23 25 20 20"/>
      <path d="M20 32 C15 28 15 23 20 20"/>
      <path d="M8 20 C12 15 17 15 20 20"/>
    `);
  }

  batteryIcon(soc) {
    const clamped = this.clamp(soc);
    const fillWidth = (clamped / 100) * 26;

    return this.iconWrap(`
      <rect x="4" y="12" width="32" height="18" rx="4"/>
      <rect x="37" y="17" width="3" height="8" rx="1.5"/>
      <rect class="battery-fill"
            x="7"
            y="15"
            width="${fillWidth}"
            height="12"
            rx="2"/>
    `);
  }

  resolveData() {
    const entities = this.config.entities ?? {};
    const externalConfig = this.config.external ?? {};
    const externalMode = externalConfig.mode ?? "parallel_pv";
		const heatpumpMode = this.config.heatpump?.mode ?? "behind_home";
		const wallboxMode = this.config.wallbox?.mode ?? "behind_home";

		const hasSecondaryConsumer = this.hasSecondaryConsumer();
		const available = {
		  external: this.hasEntity(entities.external),
		  wallbox: this.hasEntity(entities.wallbox),
		  heatpump: this.hasEntity(entities.heatpump),
		  home: hasSecondaryConsumer,
		};

    const solarRaw = this.value(entities.solar);
    const external = this.value(entities.external);
    const grid = this.value(entities.grid);
    const batteryPower = this.value(entities.battery_power);
    const batterySoc = this.value(entities.battery_soc);
    const batteryRuntime = this.valueText(entities.battery_runtime);
    const homeRaw = this.value(entities.home);
    const wallbox = this.value(entities.wallbox);
    const heatpump = this.value(entities.heatpump);

    let solar = solarRaw;
    let externalDisplay = external;
    let externalCorrection = 0;

		if (externalMode === "addToPV") {
		  solar = solarRaw + external;
		  externalDisplay = 0;
		}

    if (externalMode === "behind_home") {
      externalCorrection = external;
    }

		let homeBase = homeRaw + externalCorrection;
		
		if (heatpumpMode === "behind_home") {
			homeBase -= heatpump;
		}
		
		if (wallboxMode === "behind_home") {
			homeBase -= wallbox;
		}
		
		homeBase = Math.max(0, homeBase);
		
		let consumption = homeBase;
		
		if (available.heatpump) {
			consumption += heatpump;
		}
		
		if (available.wallbox) {
			consumption += wallbox;
		}

		const gridImport = Math.max(0, -grid);
		const gridExport = Math.max(0, grid);
		
		let producedPower = solar;

		if (available.external && externalMode !== "addToPV") {
		  producedPower += external;
		}
		
		const selfConsumedPower =
			Math.max(
				0,
				producedPower - gridExport
			);
		
		const selfConsumption =
			producedPower > 0
				? Math.max(
						0,
						Math.min(
							100,
							(selfConsumedPower / producedPower) * 100
						)
					)
				: 0;
		
		const autarky =
			consumption > 0
				? Math.max(
						0,
						Math.min(
							100,
							((consumption - gridImport) / consumption) * 100
						)
					)
				: 0;
		
    const batteryLabel =
      batteryPower > AuriAgerFlowCard.THRESHOLD_W ? "Entlädt" :
      batteryPower < -AuriAgerFlowCard.THRESHOLD_W ? "Lädt" :
      "Standby";

    const active = {
      solar: solar > AuriAgerFlowCard.THRESHOLD_W_ZERO,
      external:
			  available.external &&
			  externalMode !== "addToPV" &&
			  externalDisplay > AuriAgerFlowCard.THRESHOLD_W,
			externalToPv:
			  available.external &&
			  externalMode === "addToPV" &&
			  external > AuriAgerFlowCard.THRESHOLD_W,
      grid: Math.abs(grid) > AuriAgerFlowCard.THRESHOLD_W_ZERO,
      battery: Math.abs(batteryPower) > AuriAgerFlowCard.THRESHOLD_W,
      // wallbox: available.wallbox && wallbox > AuriAgerFlowCard.THRESHOLD_W,
      wallbox:
			  available.wallbox &&
			  wallboxMode === "separate" &&
			  wallbox > AuriAgerFlowCard.THRESHOLD_W,

			wallboxBehindHome:
			  available.wallbox &&
			  wallboxMode === "behind_home" &&
			  wallbox > AuriAgerFlowCard.THRESHOLD_W,
      consumption: consumption > AuriAgerFlowCard.THRESHOLD_W,
      heatpump: available.heatpump && heatpump > AuriAgerFlowCard.THRESHOLD_W,
      home: available.home && homeBase > AuriAgerFlowCard.THRESHOLD_W,
    };

    return {
      solar,
      externalDisplay,
      externalLabel: externalConfig.label ?? "Externe Quelle",
      externalMode,
			external,
      grid,
      batteryPower,
      batterySoc,
      batteryLabel,
      batteryRuntime,
      wallbox,
      heatpump,
      homeBase,
      consumption,
      autarky,
      selfConsumption,
      // grid path is drawn grid -> center.
      // grid > 0 means export, therefore center -> grid, so reverse path.
      gridForward: grid < 0,
      // battery path is drawn center -> battery.
      // batteryPower < 0 means charging, therefore center -> battery.
      batteryForward: batteryPower < 0,
      available,
      active,
    };
  }

  buildStaticDom() {
    const p = this.currentPaths();
    const layout = this.currentLayout();

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
         <div class="dashboard-header">
         	<div class="header-accent"></div>
         	<div>
						<div id="dashboard-title" class="dashboard-title"></div>
			      <div id="dashboard-time" class="dashboard-time"></div>
					</div>
				</div>

				<div class="flow-container">
					<svg class="flow-svg" viewBox="${layout.viewBox}">
						<defs>
							${this.arrowDef("flow-arrow")}
						</defs>
	
						${this.flowSvg("solar", "pv-path", p.pv, 7)}
						${this.flowSvg("external", "external-path", p.external, 8)}
						${this.flowSvg("external-to-pv", "external-to-pv-path", p.externalToPv, 8)}
						${this.flowSvg("grid", "grid-path", p.grid, 8)}
						${this.flowSvg("battery", "battery-path", p.battery, 8)}
						${this.flowSvg("wallbox", "wallbox-path", p.wallbox, 7)}
						${this.flowSvg("wallbox-behind-home", "wallbox-behind-home-path", p.wallboxBehindHome, 7)}
						${this.flowSvg("consumption", "consumption-path", p.consumption, 9)}
						${this.flowSvg("heatpump", "heatpump-path", p.heatpump, 8)}
						${this.flowSvg("home", "home-path", p.home, 9)}
	
						${this.staticRingsSvg()}
						${this.staticNodesSvg()}
					</svg>
				</div>

      </ha-card>
    `;

    this.attachEntityHandlers();
  }

  staticRingsSvg() {
    const { autarky, selfConsumption } = this.currentLayout();

    return `
      <circle cx="${selfConsumption.x}" cy="${selfConsumption.y}" r="${selfConsumption.r}" class="ring-bg self-ring-bg"/>
      <circle id="self-ring" cx="${selfConsumption.x}" cy="${selfConsumption.y}" r="${selfConsumption.r}" class="self-ring"/>
      <text id="self-value" x="${selfConsumption.x}" y="${selfConsumption.y - 3}" class="self-value"></text>
      <text x="${selfConsumption.x}" y="${selfConsumption.y + 15}" class="self-label">Eigen-</text>
      <text x="${selfConsumption.x}" y="${selfConsumption.y + 29}" class="self-label">verbrauch</text>

      <circle cx="${autarky.x}" cy="${autarky.y}" r="${autarky.r}" class="ring-bg autarky-ring-bg"/>
      <circle id="autarky-ring" cx="${autarky.x}" cy="${autarky.y}" r="${autarky.r}" class="autarky-ring"/>
      <text id="autarky-value" x="${autarky.x}" y="${autarky.y - 7}" class="center-value"></text>
      <text x="${autarky.x}" y="${autarky.y + 19}" class="center-label">Autarkie</text>
    `;
  }

  staticNodesSvg() {
    const n = this.currentLayout().nodes;

		return `
			<g id="node-pv" class="clickable-node">
				<text x="${n.pv.x}" y="${n.pv.y}" class="label">PV</text>
				<g id="pv-icon"
					 transform="translate(${n.pv.x - 20} ${n.pv.y + 14})">
				</g>
				<text id="pv-value"
							x="${n.pv.x}"
							y="${n.pv.y + 84}"
							class="value">
				</text>
			</g>
		
			<g id="node-external" class="clickable-node">
				<text id="external-label"
							x="${n.external.x}"
							y="${n.external.y}"
							class="label">
				</text>
		
				<g id="external-icon"
					 transform="translate(${n.external.x - 20} ${n.external.y + 14})">
					${this.externalIcon()}
				</g>
		
				<text id="external-value"
							x="${n.external.x}"
							y="${n.external.y + 84}"
							class="value">
				</text>
			</g>
		
			<g id="node-grid" class="clickable-node">
				<text x="${n.grid.x}" y="${n.grid.y}" class="label">Netz</text>
		
				<g id="grid-icon"
					 transform="translate(${n.grid.x - 20} ${n.grid.y + 14})">
					${this.gridIcon()}
				</g>
		
				<text id="grid-value"
							x="${n.grid.x}"
							y="${n.grid.y + 84}"
							class="value">
				</text>
			</g>
		
			<g id="node-battery-soc" class="clickable-node">
				<rect x="${n.battery.x - 50}"
							y="${n.battery.y - 26}"
							width="100"
							height="88"
							fill="transparent">
				</rect>

				<text id="battery-value"
							x="${n.battery.x}"
							y="${n.battery.y}"
							class="value">
				</text>
			
				<g id="battery-icon"
					 transform="translate(${n.battery.x - 20} ${n.battery.y + 7})">
				</g>
			
				<text x="${n.battery.x}"
							y="${n.battery.y + 62}"
							class="label">
					Batterie
				</text>
			</g>
			
			<g id="node-battery-power" class="clickable-node">
				<rect x="${n.battery.x - 55}"
							y="${n.battery.y + 70}"
							width="110"
							height="22"
							fill="transparent">
				</rect>
			
				<text id="battery-subline"
							x="${n.battery.x}"
							y="${n.battery.y + 80}"
							class="small">
				</text>
			</g>
			
			<text id="battery-runtime"
						x="${n.battery.x}"
						y="${n.battery.y + 96}"
						class="small">
			</text>
		
			<g id="node-wallbox" class="clickable-node">
				<text id="wallbox-value"
							x="${n.wallbox.x}"
							y="${n.wallbox.y}"
							class="value">
				</text>
		
				<g transform="translate(${n.wallbox.x - 20} ${n.wallbox.y + 7})">
					${this.wallboxIcon()}
				</g>
		
				<text x="${n.wallbox.x}"
							y="${n.wallbox.y + 62}"
							class="label">
					Wallbox
				</text>
			</g>
		
			<g id="node-consumption" class="clickable-node">
				<text id="consumption-value"
							x="${n.consumption.x}"
							y="${n.consumption.y}"
							class="value">
				</text>
		
				<g transform="translate(${n.consumption.x - 20} ${n.consumption.y + 7})">
					${this.consumptionIcon()}
				</g>
		
				<text x="${n.consumption.x}"
							y="${n.consumption.y + 62}"
							class="label">
					Verbrauch
				</text>
			</g>
		
			<g id="node-heatpump" class="clickable-node">
				<text id="heatpump-value"
							x="${n.heatpump.x}"
							y="${n.heatpump.y}"
							class="value">
				</text>
		
				<g transform="translate(${n.heatpump.x - 20} ${n.heatpump.y + 7})">
					${this.heatpumpIcon()}
				</g>
		
				<text x="${n.heatpump.x}"
							y="${n.heatpump.y + 62}"
							class="label">
					Wärmepumpe
				</text>
			</g>
		
			<g id="node-home" class="clickable-node">
				<text id="home-value"
							x="${n.home.x}"
							y="${n.home.y}"
							class="value">
				</text>
		
				<g transform="translate(${n.home.x - 20} ${n.home.y + 7})">
					${this.homeIcon()}
				</g>
		
				<text x="${n.home.x}"
							y="${n.home.y + 62}"
							class="label">
					Haus
				</text>
			</g>
		`;
  }

  updateDynamicDom() {
  	//console.log("[AuriAgerFlow] updateDynamicDom called");
    const data = this.resolveData();
    //console.log("[AuriAgerFlow] data", data);
		const maxWidth = this.config.max_width ?? 960;

		const container =
		  this.shadowRoot.querySelector(".flow-container");

		if (container) {
		  container.style.setProperty(
		    "--auri-max-width",
		    `${maxWidth}px`
		  );
		}

		const compact =
		  this.offsetWidth < 800;

		const card =
			this.shadowRoot.querySelector("ha-card");
		
		card?.classList.toggle(
			"compact",
			compact
		);

    const { autarky, selfConsumption } = this.currentLayout();

    const autarkyCircumference = 2 * Math.PI * autarky.r;
    const autarkyDash =
      (this.clamp(data.autarky) / 100) * autarkyCircumference;

    const selfCircumference = 2 * Math.PI * selfConsumption.r;
    const selfDash =
      (this.clamp(data.selfConsumption) / 100) * selfCircumference;

		this.setText("#dashboard-title", this.dashboardTitle());
		this.setText("#dashboard-time", this.formatDateTime());

    this.shadowRoot
      .querySelector("#autarky-ring")
      ?.setAttribute("stroke-dasharray", `${autarkyDash} ${autarkyCircumference}`);

    this.shadowRoot
      .querySelector("#self-ring")
      ?.setAttribute("stroke-dasharray", `${selfDash} ${selfCircumference}`);

    this.setText("#autarky-value", `${Math.round(data.autarky)}%`);
    this.setText("#self-value", `${Math.round(data.selfConsumption)}%`);

    this.setText("#pv-value", this.fmtW(data.solar));
    this.setHTML(
      "#pv-icon",
      data.solar > AuriAgerFlowCard.THRESHOLD_W
        ? this.solarIcon()
        : this.moonIcon()
    );

    this.setText("#external-label", data.externalLabel);
		this.setText(
		  "#external-value",
		  data.externalMode === "addToPV" ? "" : this.fmtW(data.externalDisplay)
		);
    this.setText("#grid-value", this.fmtW(data.grid));

    this.setText("#battery-value", `${Math.round(data.batterySoc)}%`);
    this.setHTML("#battery-icon", this.batteryIcon(data.batterySoc));
    const batteryLabelText = [
		  data.batteryLabel,
		  data.batteryLabel !== "Standby" ? this.fmtW(data.batteryPower) : null
		].filter(Boolean).join(" · ");
    this.setText("#battery-subline", batteryLabelText);
    //  `${data.batteryLabel} ${data.batteryLabel != "Standby" ? `${data.batteryLabel} · ${this.fmtW(data.batteryPower)}`
    //);
    this.setText(
      "#battery-runtime",
      data.batteryRuntime ? `Laufzeit ${data.batteryRuntime}` : ""
    );

    this.setText("#wallbox-value", this.fmtW(data.wallbox));
    this.setText("#consumption-value", this.fmtW(data.consumption));
    this.setText("#heatpump-value", this.fmtW(data.heatpump));
    this.setText("#home-value", this.fmtW(data.homeBase));

    this.setPathDirection("#grid-path", data.gridForward);
    this.setPathDirection("#battery-path", data.batteryForward);

    this.setPillDirection("grid", !data.gridForward);
    this.setPillDirection("battery", !data.batteryForward);

    this.setVisible("#flow-solar", data.active.solar);
    this.setVisible("#flow-external", data.active.external);
    this.setVisible("#flow-external-to-pv", data.active.externalToPv);
    this.setVisible("#flow-grid", data.active.grid);
    this.setVisible("#flow-battery", data.active.battery);
    this.setVisible("#flow-wallbox", data.active.wallbox);
		this.setVisible("#flow-wallbox-behind-home", data.active.wallboxBehindHome);
    this.setVisible("#flow-consumption", data.active.consumption);
    this.setVisible("#flow-heatpump", data.active.heatpump);
    this.setVisible("#flow-home", data.active.home);
    this.setVisible("#node-external", data.available.external);
		this.setVisible("#node-wallbox", data.available.wallbox);
		this.setVisible("#node-heatpump", data.available.heatpump);
		this.setVisible("#node-home", data.available.home);
  }

  styles() {
    const COLORS = this.colors();
    const { autarky, selfConsumption } = this.currentLayout();

    return `
      <style>
				:host {
				  display: block;
				  width: 100%;
				}

				@media (max-width: 700px) {
					ha-card {
						padding: 4px;
						border-radius: 22px;
					}
				
					svg {
						width: calc(100vw - 20px);
						max-width: none;

					}
				}

        ha-card {
        	width: 100%;
				  margin-inline: auto;
          padding: 2px;
          border-radius: inherit;
          background: transparent;
				  border: none;
          box-shadow: none;
				  overflow: hidden;
        }

				.flow-container {
					width: 100%;
					max-width: var(--auri-max-width, 1200px);
					margin: 0 auto;
				}
          /* background: ${COLORS.cardBg};
					border: 1px solid ${COLORS.cardBorder}; */

				.header-accent {
					fill: ${COLORS.autarky};
				}

				.dashboard-header {
					position: absolute;
					left: 18px;
					top: 18px;
					display: grid;
					grid-template-columns: 8px minmax(0, 1fr);
					gap: 14px;
					align-items: start;
					z-index: 5;
					pointer-events: none;
				}
				
				.dashboard-header .header-accent {
					width: 8px;
					height: 42px;
					border-radius: 4px;
					background: ${COLORS.accent};
				}
				
				.dashboard-title {
					font-size: 20px;
					font-weight: 750;
					line-height: 1.1;
					color: ${COLORS.value};
					transform: translateY(-2px);
				}
				
				.dashboard-time {
					margin-top: 1px;
					font-size: 13px;
					color: ${COLORS.small};
				}
				
				ha-card {
					position: relative;
					padding-top: 86px;
				}

				svg {
					display: block;
					width: min(100%, 640px);
					height: auto;
					margin: 0 auto;
					object-fit: contain;
					font-family: var(--ha-font-family-body, system-ui);
					overflow: visible;
				}
				
				.flow-svg {
				  display: block;
				  width: 100%;
				  height: auto;
				  margin-top: -64px;
				}

        .title {
          font-size: 18px;
          fill: #2f3437;
          font-weight: 700;
        }

        .label {
          font-size: 15px;
          fill: ${COLORS.label};
          text-anchor: middle;
        }

        .value {
          font-size: 21px;
          font-weight: 750;
          fill: ${COLORS.value};
          text-anchor: middle;
        }
        
        ha-card.compact .value {
				  font-size: 30px;
				}

        .small {
          font-size: 13px;
          fill: ${COLORS.small};
          text-anchor: middle;
        }

        .node-icon {
          fill: none;
          stroke: ${COLORS.icon};
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .battery-fill {
          fill: ${COLORS.icon};
          stroke: none;
        }

        .line {
          fill: none;
          stroke: ${COLORS.line};
          stroke-width: 3;
          opacity: .72;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .pill {
          fill: ${COLORS.pill};
          opacity: .95;
        }

        .ring-bg {
          fill: transparent;
				  stroke: ${COLORS.ringBg};
        }

        .autarky-ring-bg {
          stroke-width: 18;
        }

        .autarky-ring {
          fill: none;
          stroke: ${COLORS.autarky};
          stroke-width: 18;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: ${autarky.x}px ${autarky.y}px;
        }

        .self-ring-bg {
        	stroke-width: 9;
        }

        .self-ring {
          fill: none;
          stroke: ${COLORS.selfConsumption};
          stroke-width: 9;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: ${selfConsumption.x}px ${selfConsumption.y}px;
        }

        .center-value {
          font-size: 34px;
          font-weight: 850;
          fill: ${COLORS.center};
          text-anchor: middle;
        }

        .center-label {
          font-size: 14px;
          fill: ${COLORS.label};
          text-anchor: middle;
        }

        .self-value {
          font-size: 20px;
          font-weight: 750;
          fill: ${COLORS.value};
          text-anchor: middle;
        }

        .self-label {
          font-size: 11px;
          fill: ${COLORS.small};
          text-anchor: middle;
        }

				.clickable-node:hover {
					opacity: .82;
					transition: opacity .15s ease;
				}
				
				.clickable-node {
				  cursor: pointer;
				}

				.clickable-node:hover {
				  opacity: .82;
				}

				.clickable-node:active {
				  opacity: .65;
				}
      </style>
    `;
  }
}

customElements.define("auri-ager-flow-card", AuriAgerFlowCard);

class AuriAgerFlowCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;

    if (!this._rendered && this._hass) {
      this.render();
      this._rendered = true;
    }
    
    this.syncControls();
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._rendered && this._config) {
      this.render();
      this._rendered = true;
    } else {
      this.syncControls();
    }
  }

	syncControls() {
		if (!this._config || !this._hass || !this._rendered) return;
	
		const theme = this._config.theme ?? "auto";
		const external = this._config.external ?? {};
		const heatpump = this._config.heatpump ?? {};
		const wallbox = this._config.wallbox ?? {};
	
		const setValue = (path, value) => {
			const el = this.querySelector(`[data-path="${path}"]`);
			if (el) el.value = value;
		};
	
		const setChecked = (path, value) => {
			const el = this.querySelector(`[data-path="${path}"]`);
			if (el) el.checked = value;
		};
	
		setValue("theme", theme);
		setValue("max_width",this._config.max_width ?? 960);
		setValue("external.mode", external.mode ?? "parallel_pv");
		setValue("external.label", external.label ?? "Externe Quelle");
		setValue("heatpump.mode", heatpump.mode ?? "behind_home");
		setValue("wallbox.mode", wallbox.mode ?? "behind_home");
		setChecked("hide_zeros", this._config.hide_zeros ?? false);
	
		const form = this.querySelector("#entity-form");
		if (form) {
			form.hass = this._hass;
			form.data = {
				entities: this._config.entities ?? {},
			};
		}
	}

	static getConfigElement() {
		return document.createElement(
			"auri-ager-flow-card-editor"
		);
	}
	
	static getStubConfig() {
		return {};
	}
	
	static getCardSize() {
		return 6;
	}
	
	static getConfigForm() {
		return {
			title: "Auri Ager Flow",
		};
	}

  render() {
    if (!this._config || !this._hass) return;

    const theme = this._config.theme ?? "auto";
    const maxWidth = this._config.max_width ?? 960;
    const external = this._config.external ?? {};
    const hideZeros = this._config.hide_zeros ?? false;
    const externalMode = external.mode ?? "parallel_pv";
    const externalLabel = external.label ?? "Externe Quelle";
    const heatpump = this._config.heatpump ?? {};
		const wallbox = this._config.wallbox ?? {};
		const heatpumpMode = heatpump.mode ?? "behind_home";
		const wallboxMode = wallbox.mode ?? "behind_home";
    const entities = this._config.entities ?? {};

		const schema = [
			{
				name: "entities",
				type: "grid",
				schema: [
					{ name: "solar", selector: { entity: { domain: "sensor" } } },
					{ name: "external", selector: { entity: { domain: "sensor" } } },
					{ name: "grid", selector: { entity: { domain: "sensor" } } },
					{ name: "battery_power", selector: { entity: { domain: "sensor" } } },
					{ name: "battery_soc", selector: { entity: { domain: "sensor" } } },
					{ name: "battery_runtime", selector: { entity: { domain: "sensor" } } },
					{ name: "home", selector: { entity: { domain: "sensor" } } },
					{ name: "wallbox", selector: { entity: { domain: "sensor" } } },
					{ name: "heatpump", selector: { entity: { domain: "sensor" } } },
				],
			},
		];

    this.innerHTML = `
      <style>
        .editor {
          display: grid;
          gap: 14px;
          padding: 16px;
          font-family: var(--ha-font-family-body, system-ui);
        }

        .editor-card {
          display: grid;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(120,120,120,.20);
          border-radius: 14px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          opacity: .72;
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          opacity: .86;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .hint {
          font-size: 11px;
          opacity: .62;
          margin-top: -8px;
        }

        select,
        input[type="text"],
        ha-entity-picker {
          box-sizing: border-box;
          width: 100%;
        }

        select,
        input[type="text"] {
          padding: 9px 10px;
          border-radius: 10px;
          border: 1px solid rgba(120,120,120,.35);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #202426);
          font: inherit;
        }
      </style>

      <div class="editor">
        <div class="editor-card">
          <div class="section-title">Darstellung</div>

          <label>
            Theme
            <select data-path="theme">
              <option value="auto">Automatisch</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

					<label>
						Maximale Breite
						<input
							type="number"
							data-path="max_width"
							min="600"
							max="3000"
							step="50">
					</label>

          <label class="checkbox-row">
            <input type="checkbox" data-path="hide_zeros">
            Nullwerte ausblenden
          </label>
        </div>

        <div class="editor-card">
          <div class="section-title">Externe Quelle</div>

          <label>
            External Mode
            <select data-path="external.mode">
              <option value="parallel_pv">Parallel anzeigen</option>
              <option value="behind_home">Behind Home</option>
              <option value="addToPV">Zu PV addieren</option>
            </select>
          </label>

          <div class="hint">
            addToPV addiert die externe Quelle zur PV und zeigt nur den Zubringer-Flow.
          </div>

          <label>
            External Label
            <input type="text" data-path="external.label" placeholder="Externe Quelle">
          </label>
        </div>

				<div class="editor-card">
					<div class="section-title">Wärmepumpe</div>
				
					<label>
						Modus
						<select data-path="heatpump.mode">
							<option value="behind_home">Behind Home</option>
							<option value="separate">Separater Zähler</option>
						</select>
					</label>
				</div>
				
				<div class="editor-card">
					<div class="section-title">Wallbox</div>
				
					<label>
						Modus
						<select data-path="wallbox.mode">
							<option value="behind_home">Behind Home</option>
							<option value="separate">Separater Zähler</option>
						</select>
					</label>
				</div>

        <div class="editor-card">
          <div class="section-title">Entitäten</div>

          <ha-form id="entity-form"></ha-form>
        </div>
      </div>
    `;

		const form = this.querySelector("#entity-form");
		
		if (form) {
			form.hass = this._hass;
			form.data = {
				entities: this._config.entities ?? {},
			};
			form.schema = schema;
			form.computeLabel = (schema) => {
				const labels = {
					solar: "PV",
					external: "Externe Quelle",
					grid: "Netz",
					battery_power: "Batterie Leistung",
					battery_soc: "Batterie SOC",
					battery_runtime: "Batterie Laufzeit",
					home: "Verbrauch / Haus gesamt",
					wallbox: "Wallbox",
					heatpump: "Wärmepumpe",
				};
		
				return labels[schema.name] ?? schema.name;
			};
		
			form.addEventListener("value-changed", (ev) => {
				const config = this.cloneConfig(this._config);
				config.entities = ev.detail.value.entities ?? {};
				this._config = config;
		
				this.dispatchEvent(
					new CustomEvent("config-changed", {
						detail: { config },
						bubbles: true,
						composed: true,
					})
				);
			});
		}

    this.querySelector('[data-path="theme"]').value = theme;
    this.querySelector('[data-path="max_width"]').value = maxWidth;
    this.querySelector('[data-path="external.mode"]').value = externalMode;
    this.querySelector('[data-path="external.label"]').value = externalLabel;
    this.querySelector('[data-path="heatpump.mode"]').value = heatpumpMode;
		this.querySelector('[data-path="wallbox.mode"]').value = wallboxMode;
    this.querySelector('[data-path="hide_zeros"]').checked = hideZeros;

    this.querySelectorAll("select[data-path]").forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });

		this.querySelectorAll('input[type="number"][data-path]').forEach((el) => {
		  el.addEventListener("change", (ev) => {
		    this.updateConfig(ev.target.dataset.path, Number(ev.target.value));
		  });
		});

    this.querySelectorAll('input[type="text"][data-path]').forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });

    this.querySelectorAll('input[type="checkbox"][data-path]').forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.checked);
      });
    });

    this.bindEntityPickers();
  }

  bindEntityPickers() {
    this.querySelectorAll("ha-entity-picker[data-path]").forEach((el) => {
      const path = el.dataset.path;

      el.hass = this._hass;
      el.value = this.valueAtPath(this._config, path) ?? "";

      if (el._auriBound) return;
      el._auriBound = true;

      el.addEventListener("value-changed", (ev) => {
        this.updateConfig(path, ev.detail.value ?? "");
      });
    });
  }

  entitySelect(label, path, value = "") {
    return `
      <label>
        ${label}
        <ha-entity-picker
          data-path="${path}"
          allow-custom-entity>
        </ha-entity-picker>
      </label>
    `;
  }

  updateConfig(path, value) {
    const config = this.cloneConfig(this._config);
    const parts = path.split(".");
    let target = config;

    while (parts.length > 1) {
      const key = parts.shift();
      target[key] = target[key] ?? {};
      target = target[key];
    }

    target[parts[0]] = value;
    this._config = config;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  valueAtPath(obj, path) {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
  }

  cloneConfig(config) {
    if (window.structuredClone) {
      return structuredClone(config);
    }

    return JSON.parse(JSON.stringify(config));
  }
}

customElements.define("auri-ager-flow-card-editor", AuriAgerFlowCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-flow-card",
  name: "Auri Ager Flow",
  description: "Power Flow Dashboard Card",
  preview: true,
});/* ==========================================================================
 * Auri Ager Summary
 * Source: auri-ager-summary-card(1).js
 * ========================================================================== */

/*
 * Auri Ager Summary
 * Calm energy period summary visualization for Home Assistant
 *
 * Copyright (c) 2026 Stefanie Ramroth
 *
 * Licensed under the Apache License, Version 2.0
 *
 * ----------------------------------------------------------------------------
 * Version: 0.1.0-dev
 * Status : Initial Summary Card
 *
 * Design philosophy:
 * Live values show the moment.
 * Summaries explain the period.
 * Calmness is a feature.
 * ----------------------------------------------------------------------------
 */
class AuriAgerSummaryCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("auri-ager-summary-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-summary-card",
      title: "Heute",
      theme: "auto",
      entities: {},
    };
  }

  static COLOR_SCHEMES = {
    light: {
      cardBg: "#ffffff",
      cardBorder: "rgba(0,0,0,.06)",
      accent: "#f5b82e",
      icon: "rgba(60,60,60,.70)",
      label: "rgba(60,60,60,.65)",
      small: "rgba(60,60,60,.55)",
      value: "rgba(25,25,25,.95)",
      line: "rgba(100,100,100,.14)",
      subBg: "rgba(0,0,0,.025)",
    },
    dark: {
      cardBg: "#1f2326",
      cardBorder: "rgba(255,255,255,.08)",
      accent: "#f5b82e",
      icon: "rgba(220,225,228,.68)",
      label: "rgba(220,225,228,.64)",
      small: "rgba(220,225,228,.52)",
      value: "rgba(245,247,248,.94)",
      line: "rgba(255,255,255,.10)",
      subBg: "rgba(255,255,255,.035)",
    },
  };

  setConfig(config) {
    this.config = config;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._built = false;
    this._lastSnapshot = null;
  }

  set hass(hass) {
    this._hass = hass;

    if (!this.config || !this._hass) return;

    if (!this._built) {
      this.buildStaticDom();
      this._built = true;
    }

    const snapshot = this.stateSnapshot();
    if (snapshot === this._lastSnapshot) return;

    this._lastSnapshot = snapshot;
    this.updateDynamicDom();
  }

  getCardSize() {
    return 4;
  }

  themeMode() {
    const configured = this.config.theme ?? "auto";

    if (configured !== "auto") {
      return configured;
    }

    return this._hass?.themes?.darkMode ? "dark" : "light";
  }

  colors() {
    const mode = this.themeMode();
    return AuriAgerSummaryCard.COLOR_SCHEMES[mode]
      ?? AuriAgerSummaryCard.COLOR_SCHEMES.light;
  }

  stateSnapshot() {
    const entities = this.config.entities ?? {};

    return Object.values(entities)
      .filter(Boolean)
      .map((id) => `${id}:${this._hass?.states?.[id]?.state ?? ""}`)
      .join("|");
  }

	value(entity, fallback = 0) {
		if (!entity) return fallback;
	
		const raw = this._hass?.states?.[entity]?.state;
		const value = Number(raw);
	
		return Number.isFinite(value) ? value : fallback;
	}

  hasEntity(entity) {
    return typeof entity === "string" && entity.trim().length > 0;
  }

  fmtKwh(value) {
    const abs = Math.abs(value);

    if (abs >= 1000) {
      return `${(value / 1000).toFixed(2)} MWh`;
    }

    return `${value.toFixed(1)} kWh`;
  }

  fmtPercent(value) {
    if (!Number.isFinite(value)) return "–";
    return `${Math.round(value)}%`;
  }

  fmtKg(value) {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} t`;
    }

    return `${Math.round(value)} kg`;
  }

  setText(selector, value) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.textContent = value ?? "";
  }

  setVisible(selector, visible) {
    const el = this.shadowRoot?.querySelector(selector);
    if (el) el.style.display = visible ? "" : "none";
  }

  calcData() {
    const entities = this.config.entities ?? {};
    const factors = this.config.factors ?? {};

		const hasProduction = this.hasEntity(entities.production);
		const hasProductionDc = this.hasEntity(entities.production_dc);
		
		let efficiency = this.value(entities.efficiency, 96);
		
		if (efficiency <= 0) {
			efficiency = 96;
		}
		
		const productionDc = hasProductionDc
			? this.value(entities.production_dc)
			: null;
		
		let production = 0;
		
		if (hasProduction && !hasProductionDc && this.hasEntity(entities.efficiency)) {
			// Legacy/Fallback:
			// production + efficiency means production is treated as DC.
			production = this.value(entities.production) * (efficiency / 100);
		} else if (hasProduction) {
			// Explicit production is treated as AC.
			production = this.value(entities.production);
		} else if (hasProductionDc) {
			// DC production is converted to usable AC production.
			production = this.value(entities.production_dc) * (efficiency / 100);
		}

    const battery_charge = this.value(entities.battery_charge);
    const battery_discharge = this.value(entities.battery_discharge);

    const feedIn = this.value(entities.feed_in);
    const gridImport = this.value(entities.grid_import);
    const consumption = this.value(entities.consumption);
    const wallbox = this.value(entities.wallbox);
    const heatpump = this.value(entities.heatpump);

    const selfConsumption = Math.max(0, production - feedIn);
    const autarkyPercent = consumption > 0
      ? ((consumption - gridImport) / consumption) * 100
      : 0;
    const selfConsumptionPercent = production > 0
      ? (selfConsumption / production) * 100
      : 0;

    const co2FactorKgPerKwh = factors.co2_kg_per_kwh ?? 0.42;
    const treeKgPerYear = factors.tree_kg_per_year ?? 22;

    const co2Saved = production * co2FactorKgPerKwh;
    const trees = treeKgPerYear > 0 ? co2Saved / treeKgPerYear : 0;

    return {
      production,
      productionDc,
      battery_charge,
      battery_discharge,
      feedIn,
      gridImport,
      consumption,
      wallbox,
      heatpump,
      selfConsumption,
      autarkyPercent,
      selfConsumptionPercent,
      co2Saved,
      trees,
      hasProductionDc: productionDc !== null,
      hasWallbox: this.hasEntity(entities.wallbox),
      hasHeatpump: this.hasEntity(entities.heatpump),
      hasBatteryCharge: this.hasEntity(entities.battery_charge),
      hasBatteryDischarge: this.hasEntity(entities.battery_discharge),
    };
  }

  icon(name) {
    const icons = {
      production: "mdi:solar-power-variant",
      self: "mdi:home-lightning-bolt",
      batteryUp: "mdi:battery-arrow-up",
      batteryDown: "mdi:battery-arrow-down-outline",
      feedIn: "mdi:transmission-tower-export",
      gridImport: "mdi:transmission-tower-import",
      consumption: "mdi:home-lightning-bolt-outline",
      co2: "mdi:leaf",
      
			sunSmall: `
			<svg viewBox="0 0 24 24" class="inline-icon sun-inline">
				<circle cx="12" cy="12" r="4.8"/>
				<g>
					<line x1="12" y1="2" x2="12" y2="5"/>
					<line x1="12" y1="19" x2="12" y2="22"/>
					<line x1="2" y1="12" x2="5" y2="12"/>
					<line x1="19" y1="12" x2="22" y2="12"/>
					<line x1="5" y1="5" x2="7.2" y2="7.2"/>
					<line x1="16.8" y1="16.8" x2="19" y2="19"/>
					<line x1="16.8" y1="7.2" x2="19" y2="5"/>
					<line x1="5" y1="19" x2="7.2" y2="16.8"/>
				</g>
			</svg>
			`,
			
			tree: `
			<svg viewBox="0 0 24 24" class="inline-icon tree-inline">
				<circle cx="12" cy="8" r="4"/>
				<circle cx="9" cy="10" r="3.2"/>
				<circle cx="15" cy="10" r="3.2"/>
				<rect x="11" y="13" width="2" height="7" rx="1"/>
			</svg>
			`,
    };

    return icons[name] ?? "mdi:chart-box-outline";
  }

  row(id, icon, label, sub = "") {
    return `
      <div id="${id}" class="row">
        <ha-icon icon="${icon}"></ha-icon>
        <div class="text">
          <div class="label">${label}</div>
          ${sub ? `<div class="sub">${sub}</div>` : ""}
        </div>
        <div id="${id}-value" class="value"></div>
      </div>
    `;
  }

  fireMoreInfo(entityId) {
    if (!entityId) return;

    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      })
    );
  }
  
  attachEntityClick(selector, entityId) {
		const el = this.shadowRoot?.querySelector(selector);
		if (!el || !entityId) return;
	
		el.classList.add("clickable");
		el.addEventListener("click", () => this.fireMoreInfo(entityId));
	}

  styles() {
    const C = this.colors();
    const accent = this.config.accent_color ?? C.accent;

    return `
      <style>
        ha-card {
          padding: 22px;
          border-radius: 24px;
          background: ${C.cardBg};
          border: 1px solid ${C.cardBorder};
          box-shadow: none;
          font-family: var(--ha-font-family-body, system-ui);
        }

        .header {
          display: grid;
          grid-template-columns: 8px 1fr;
          gap: 14px;
          align-items: start;
          margin-bottom: 18px;
        }

        .accent {
          width: 8px;
          height: 42px;
          border-radius: 4px;
          background: ${accent};
        }

        .title {
          font-size: 20px;
          font-weight: 750;
          color: ${C.value};
          line-height: 1.1;
        }

        .subtitle {
          margin-top: 4px;
          font-size: 13px;
          color: ${C.small};
        }

				.clickable {
					cursor: pointer;
				}
				
				.clickable:hover {
					opacity: .82;
				}
				
				.clickable:active {
					opacity: .65;
				}

        .rows {
          display: grid;
          gap: 8px;
        }

        .row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid ${C.line};
        }

        .row:last-child {
          border-bottom: none;
        }

        ha-icon {
          color: ${C.icon};
          --mdc-icon-size: 25px;
        }

        .label {
          font-size: 14px;
          color: ${C.label};
        }

        .sub {
          margin-top: 2px;
          font-size: 12px;
          color: ${C.small};
        }

        .value {
          font-size: 18px;
          font-weight: 760;
          color: ${C.value};
          white-space: nowrap;
          text-align: right;
        }

        .subvalues {
          display: grid;
          gap: 5px;
          margin: 4px 0 6px 44px;
          padding: 8px 10px;
          border-radius: 14px;
          background: ${C.subBg};
        }

        .subrow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: ${C.small};
        }

        .subrow strong {
          color: ${C.label};
          font-weight: 650;
        }
        
        .dc-production,
				.tree-count{
					display:inline-flex;
					align-items:center;
					gap:6px;
				}
				
				.dc-production svg,
				.tree-count svg{
					width:14px;
					height:14px;
					opacity:.75;
				}
				
				.dc-production{
						display:inline-flex;
						align-items:center;
						gap:6px;
						margin-right:8px;
				}
				
				.dc-label{
						font-size:.62em;
						opacity:.60;
						font-weight:500;
				}

				.tree-count{
						display:inline-flex;
						align-items:center;
						margin-left:6px;
						gap:3px;
				}
				
				.tree-value{
						font-weight:700;
				}
				
				.tree-label{
						font-size:.82em;
						opacity:.65;
						margin-left:2px;
				}

				.sun-inline {
						color:#f4b629;
				}
				
				.sun-inline circle {
						fill:currentColor;
				}
				
				.sun-inline line {
						stroke:currentColor;
						stroke-width:2.8;
						stroke-linecap:round;
				}
				
				.inline-icon{
						width:18px;
						height:18px;
						margin-left:0px;
						margin-right:3px;
						vertical-align:-3px;
				}
				
				.tree-inline {
						color:#6fb55e;   /* gesundes Blattgrün */
				}
				
				.tree-inline circle {
			    	fill:currentColor;
				    stroke:none;
				}
				
				.tree-inline rect {
 				    fill:#7d5a3c;
				}
				
				.tree-inline path {
						fill:none;
						stroke:currentColor;
						stroke-width:2;
						stroke-linecap:round;
						stroke-linejoin:round;
				}
      </style>
    `;
  }

  buildStaticDom() {
    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <div class="header">
          <div class="accent"></div>
          <div>
            <div id="summary-title" class="title"></div>
            <div id="summary-subtitle" class="subtitle"></div>
          </div>
        </div>

        <div class="rows">
          ${this.row("production", this.icon("production"), "Produktion")}
          ${this.row("self-consumption", this.icon("self"), "Eigenverbrauch")}

          ${this.row("battery-charge", this.icon("batteryUp"), "Batterie laden")}
          ${this.row("battery-discharge", this.icon("batteryDown"), "Batterie entladen")}

          ${this.row("feed-in", this.icon("feedIn"), "Einspeisung")}
          ${this.row("grid-import", this.icon("gridImport"), "Netzbezug")}
          ${this.row("consumption", this.icon("consumption"), "Verbrauch")}

          <div id="consumption-subvalues" class="subvalues">
            <div id="wallbox-row" class="subrow">
              <span>Wallbox</span>
              <strong id="wallbox-value"></strong>
            </div>
            <div id="heatpump-row" class="subrow">
              <span>Wärmepumpe</span>
              <strong id="heatpump-value"></strong>
            </div>
          </div>

          ${this.row("autarky", this.icon("self"), "Autarkie")}
          ${this.row("self-rate", this.icon("self"), "Eigenverbrauchsquote")}
          ${this.row("co2", this.icon("co2"), "CO₂ gespart", "geschätzt")}
        </div>
      </ha-card>
    `;
    
    const e = this.config.entities ?? {};

		this.attachEntityClick("#production", e.production ?? e.production_dc);
		this.attachEntityClick("#self-consumption", e.production);
		this.attachEntityClick("#battery-charge", e.battery_charge);
		this.attachEntityClick("#battery-discharge", e.battery_discharge);
		this.attachEntityClick("#feed-in", e.feed_in);
		this.attachEntityClick("#grid-import", e.grid_import);
		this.attachEntityClick("#consumption", e.consumption);
		this.attachEntityClick("#wallbox-row", e.wallbox);
		this.attachEntityClick("#heatpump-row", e.heatpump);
  }

  updateDynamicDom() {
    const data = this.calcData();
    const sunSmall = this.icon("sunSmall");
		const tree = this.icon("tree");

    this.setText("#summary-title", this.config.title ?? "Zusammenfassung");
    this.setText("#summary-subtitle", this.config.subtitle ?? "Energie-Bilanz");

		const productionValue =
			data.hasProductionDc
				? `
					<span class="dc-production">
						${sunSmall}
						${this.fmtKwh(data.productionDc)}
						<span class="dc-label">DC</span>
					</span>
					${this.fmtKwh(data.production)}
				`
				: `
					<span class="dc-label">AC</span>
					${this.fmtKwh(data.production)}
				`;
		
		const productionEl =
			this.shadowRoot?.querySelector("#production-value");
		
		if (productionEl) {
			productionEl.innerHTML = productionValue;
		}

    this.setText("#self-consumption-value", this.fmtKwh(data.selfConsumption));
    this.setText("#feed-in-value", this.fmtKwh(data.feedIn));

    this.setText("#battery-charge-value", this.fmtKwh(data.battery_charge));
    this.setText("#battery-discharge-value", this.fmtKwh(data.battery_discharge));
    this.setVisible("#battery-charge", data.hasBatteryCharge);
    this.setVisible("#battery-discharge", data.hasBatteryDischarge);

    this.setText("#grid-import-value", this.fmtKwh(data.gridImport));
    this.setText("#consumption-value", this.fmtKwh(data.consumption));

    this.setText("#wallbox-value", this.fmtKwh(data.wallbox));
    this.setText("#heatpump-value", this.fmtKwh(data.heatpump));
    this.setVisible("#wallbox-row", data.hasWallbox);
    this.setVisible("#heatpump-row", data.hasHeatpump);
    this.setVisible("#consumption-subvalues", data.hasWallbox || data.hasHeatpump);

    this.setText("#autarky-value", this.fmtPercent(data.autarkyPercent));
    this.setText("#self-rate-value", this.fmtPercent(data.selfConsumptionPercent));

		const co2El = this.shadowRoot?.querySelector("#co2-value");
		const treeCount = Math.round(data.trees);
		const treeLabel = treeCount === 1 ? "Baum" : "Bäume";
		
		co2El.innerHTML = `
			${this.fmtKg(data.co2Saved)}
		
			${
				treeCount >= 1
					? `
						<span class="tree-count">
							${tree}
							<span class="tree-value">${treeCount}</span>
							<span class="tree-label">${treeLabel}</span>
						</span>
					`
					: ""
			}
		`;
  }
}

customElements.define("auri-ager-summary-card", AuriAgerSummaryCard);

class AuriAgerSummaryCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;

    if (!this._rendered && this._hass) {
      this.render();
      this._rendered = true;
    }

    this.syncControls();
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._rendered && this._config) {
      this.render();
      this._rendered = true;
    } else {
      this.syncControls();
    }
  }

  syncControls() {
    if (!this._config || !this._hass || !this._rendered) return;

    const setValue = (path, value) => {
      const el = this.querySelector(`[data-path="${path}"]`);
      if (el) el.value = value;
    };

    setValue("title", this._config.title ?? "");
    setValue("subtitle", this._config.subtitle ?? "");
    setValue("theme", this._config.theme ?? "auto");
    setValue("accent_color", this._config.accent_color ?? "#5aa7d8");

    const form = this.querySelector("#entity-form");
    if (form) {
      form.hass = this._hass;
      form.data = {
        entities: this._config.entities ?? {},
      };
    }
  }

  static getConfigElement() {
    return document.createElement("auri-ager-summary-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  static getCardSize() {
    return 4;
  }

  static getConfigForm() {
    return {
      title: "Auri Ager Summary",
    };
  }

  render() {
    if (!this._config || !this._hass) return;

    const schema = [
      {
        name: "entities",
        type: "grid",
				schema: [
					{ name: "production_dc", selector: { entity: { domain: "sensor" } } },
					{ name: "production", selector: { entity: { domain: "sensor" } } },
				
					{ name: "efficiency", selector: { entity: { domain: "sensor" } } },
				
					{ name: "battery_charge", selector: { entity: { domain: "sensor" } } },
					{ name: "battery_discharge", selector: { entity: { domain: "sensor" } } },
				
					{ name: "feed_in", selector: { entity: { domain: "sensor" } } },
					{ name: "grid_import", selector: { entity: { domain: "sensor" } } },
				
					{ name: "consumption", selector: { entity: { domain: "sensor" } } },
				
					{ name: "wallbox", selector: { entity: { domain: "sensor" } } },
					{ name: "heatpump", selector: { entity: { domain: "sensor" } } },
				],
      },
    ];

    this.innerHTML = `
      <style>
        .editor {
          display: grid;
          gap: 14px;
          padding: 16px;
          font-family: var(--ha-font-family-body, system-ui);
        }

        .editor-card {
          display: grid;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(120,120,120,.20);
          border-radius: 14px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          opacity: .72;
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          opacity: .86;
        }

        select,
        input[type="text"],
        input[type="color"] {
          box-sizing: border-box;
          width: 100%;
        }

        select,
        input[type="text"] {
          padding: 9px 10px;
          border-radius: 10px;
          border: 1px solid rgba(120,120,120,.35);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #202426);
          font: inherit;
        }

        input[type="color"] {
          height: 42px;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid rgba(120,120,120,.35);
          background: var(--card-background-color, #fff);
        }
      </style>

      <div class="editor">
        <div class="editor-card">
          <div class="section-title">Darstellung</div>

          <label>
            Titel
            <input type="text" data-path="title" placeholder="Energie-Bilanz">
          </label>

          <label>
            Untertitel
            <input type="text" data-path="subtitle" placeholder="seit Inbetriebnahme">
          </label>

          <label>
            Theme
            <select data-path="theme">
              <option value="auto">Automatisch</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label>
            Akzentfarbe
            <input type="color" data-path="accent_color">
          </label>
        </div>

        <div class="editor-card">
          <div class="section-title">Entitäten</div>
          <ha-form id="entity-form"></ha-form>
        </div>
      </div>
    `;

    const form = this.querySelector("#entity-form");

    if (form) {
      form.hass = this._hass;
      form.data = {
        entities: this._config.entities ?? {},
      };
      form.schema = schema;
      form.computeLabel = (schema) => {
        const labels = {
					production_dc: "Erzeugung DC",
					production: "Erzeugung AC",
					efficiency: "Effizienzfaktor",
					battery_charge: "Batterie laden",
					battery_discharge: "Batterie entladen",
					feed_in: "Einspeisung",
					grid_import: "Bezug",
					consumption: "Gesamtverbrauch",
					wallbox: "Wallbox",
					heatpump: "Wärmepumpe",
        };

        return labels[schema.name] ?? schema.name;
      };

      form.addEventListener("value-changed", (ev) => {
        const config = this.cloneConfig(this._config);
        config.entities = ev.detail.value.entities ?? {};
        this._config = config;

        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config },
            bubbles: true,
            composed: true,
          }),
        );
      });
    }

    this.syncControls();

    this.querySelectorAll("select[data-path]").forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });

    this.querySelectorAll('input[type="text"][data-path]').forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });

    this.querySelectorAll('input[type="color"][data-path]').forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });
  }

  updateConfig(path, value) {
    const config = this.cloneConfig(this._config);
    const parts = path.split(".");
    let target = config;

    while (parts.length > 1) {
      const key = parts.shift();
      target[key] = target[key] ?? {};
      target = target[key];
    }

    target[parts[0]] = value;
    this._config = config;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  cloneConfig(config) {
    if (window.structuredClone) return structuredClone(config);
    return JSON.parse(JSON.stringify(config));
  }
}

customElements.define("auri-ager-summary-card-editor", AuriAgerSummaryCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "auri-ager-summary-card",
  name: "Auri Ager Summary",
  description: "Calm energy period summary card",
  preview: true,
});
/*
 * Auri Ager Finance Card
 * Calm finance visualization cards for Home Assistant
 *
 */
 
class AuriAgerFinanceCard extends AuriAgerBaseCard {
	static getConfigElement() {
		return document.createElement("auri-ager-finance-card-editor");
	}

  static getStubConfig() {
    return {
      type: "custom:auri-ager-finance-card",
      title: "Finanzen",
      subtitle: "Energie-Wert",
      theme: "auto",
      entities: {},
    };
  }

  getCardSize() {
    return 4;
  }

	trackedEntities() {
		return [
			this.config?.direct_saving,
			this.config?.battery_saving,
			this.config?.feed_in_revenue,
			this.config?.grid_import_cost,
			this.config?.fictional_total,
		].filter(Boolean);
	}

  calcData() {
    const entities = this.config.entities ?? {};
		const hasBatterySaving = this.hasEntity(entities.battery_saving);
		
		const directSaving = this.value(entities.direct_saving);
		const batterySaving = hasBatterySaving
			? this.value(entities.battery_saving)
			: 0;
		
		const totalSaving = hasBatterySaving
			? directSaving + batterySaving
			: directSaving;

    const feedInRevenue = this.value(entities.feed_in_revenue);
    const gridImportCost = this.value(entities.grid_import_cost);

    const fictionalTotal = this.hasEntity(entities.fictional_total)
		  ? this.value(entities.fictional_total)
		  : gridImportCost + totalSaving;
		// Old value w/o fictional_total
    // const fictionalTotal = gridImportCost + totalSaving;
    const netBenefit = fictionalTotal - gridImportCost + feedInRevenue;
    // wrong: totalSaving + feedInRevenue - gridImportCost;

    return {
      directSaving,
      batterySaving,
      feedInRevenue,
      gridImportCost,
      totalSaving,
      fictionalTotal,
      netBenefit,
      hasBatterySaving,
    };
  }

  row(id, icon, label, sub = "") {
    return `
      <div id="${id}" class="row">
        <ha-icon icon="${icon}"></ha-icon>
        <div class="text">
          <div class="label">${label}</div>
          ${sub ? `<div class="sub">${sub}</div>` : ""}
        </div>
        <div id="${id}-value" class="value"></div>
      </div>
    `;
  }

  styles() {
    const C = this.colors();

    return `
      <style>
        ${this.baseStyles(this.config.accent_color)}

        .rows {
          display: grid;
          gap: 8px;
        }

        .row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid ${C.line};
        }

        .row:last-child {
          border-bottom: none;
        }

        ha-icon {
          color: ${C.icon};
          --mdc-icon-size: 25px;
        }

        .label {
          font-size: 14px;
          color: ${C.label};
        }

        .sub {
          margin-top: 2px;
          font-size: 12px;
          color: ${C.small};
        }

        .value {
          font-size: 18px;
          font-weight: 760;
          color: ${C.value};
          white-space: nowrap;
          text-align: right;
        }

        .positive {
          color: ${C.positive};
        }

        .negative {
          color: ${C.negative};
        }
      </style>
    `;
  }

  buildStaticDom() {
    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <div class="header">
          <div class="accent"></div>
          <div>
            <div id="finance-title" class="title"></div>
            <div id="finance-subtitle" class="subtitle"></div>
          </div>
        </div>

        <div class="rows">
          ${this.row("direct-saving", this.icon("direct"), "Direktverbrauch")}
          ${this.row("battery-saving", this.icon("battery"), "Batterie-Ersparnis")}
          ${this.row("total-saving", this.icon("savings"), "Gesamt-Ersparnis", "Direkt + Batterie")}
          ${this.row("feed-in-revenue", this.icon("export"), "Einspeisevergütung")}
          ${this.row("grid-import-cost", this.icon("import"), "Netzbezugskosten")}
          ${this.row("fictional-total", this.icon("fiction"), "Fiktive Summe", "Kosten + Ersparnis")}
          ${this.row("net-benefit", this.icon("sum"), "PV Vorteil", "gegenüber Netzbetrieb")}
        </div>
      </ha-card>
    `;
    
    // Finance, zeilenweise
		const e = this.config.entities ?? {};
		
		this.attachEntityClick("#direct-saving", e.direct_saving);
		this.attachEntityClick("#battery-saving", e.battery_saving);
		this.attachEntityClick("#feed-in-revenue", e.feed_in_revenue);
		this.attachEntityClick("#grid-import-cost", e.grid_import_cost);
		this.attachEntityClick("#fictional-total", e.fictional_total);
  }

  updateDynamicDom() {
    const data = this.calcData();

    this.setText("#finance-title", this.config.title ?? "Finanzen");
    this.setText("#finance-subtitle", this.config.subtitle ?? "Energie-Wert");

    this.setText("#direct-saving-value", this.fmtMoney(data.directSaving));
    this.setText("#battery-saving-value", this.fmtMoney(data.batterySaving));
    this.setText("#total-saving-value", this.fmtMoney(data.totalSaving));
    this.setText("#feed-in-revenue-value", this.fmtMoney(data.feedInRevenue));
    this.setText("#grid-import-cost-value", this.fmtMoney(data.gridImportCost));
    this.setText("#fictional-total-value", this.fmtMoney(data.fictionalTotal));
    this.setText("#net-benefit-value", this.fmtMoney(data.netBenefit));

    this.setVisible("#direct-saving", data.hasBatterySaving);
    this.setVisible("#battery-saving", data.hasBatterySaving);
  }
}

customElements.define("auri-ager-finance-card", AuriAgerFinanceCard);

class AuriAgerFinanceCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;

    if (!this._rendered && this._hass) {
      this.render();
      this._rendered = true;
    }

    this.syncControls();
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._rendered && this._config) {
      this.render();
      this._rendered = true;
    } else {
      this.syncControls();
    }
  }

  syncControls() {
    if (!this._config || !this._hass || !this._rendered) return;

    const setValue = (path, value) => {
      const el = this.querySelector(`[data-path="${path}"]`);
      if (el) el.value = value;
    };

    setValue("title", this._config.title ?? "");
    setValue("subtitle", this._config.subtitle ?? "");
    setValue("theme", this._config.theme ?? "auto");
    setValue("accent_color", this._config.accent_color ?? "#5aa7d8");

		const setChecked = (path, value) => {
			const el = this.querySelector(`[data-path="${path}"]`);
			if (el) el.checked = value;
		};
		
		setChecked("show_cents", this._config.show_cents ?? true);

    const form = this.querySelector("#entity-form");
    if (form) {
      form.hass = this._hass;
      form.data = {
        entities: this._config.entities ?? {},
      };
    }
  }

  static getConfigElement() {
    return document.createElement("auri-ager-finance-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  static getCardSize() {
    return 4;
  }

  static getConfigForm() {
    return {
      title: "Auri Ager Finance",
    };
  }

  render() {
    if (!this._config || !this._hass) return;

		const schema = [
			{
				name: "entities",
				type: "grid",
				schema: [
					{ name: "direct_saving", selector: { entity: { domain: "sensor" } } },
					{ name: "battery_saving", selector: { entity: { domain: "sensor" } } },
					{ name: "feed_in_revenue", selector: { entity: { domain: "sensor" } } },
					{ name: "grid_import_cost", selector: { entity: { domain: "sensor" } } },
					{ name: "fictional_total", selector: { entity: { domain: "sensor" } } },
				],
			},
		];

    this.innerHTML = `
      <style>
        .editor {
          display: grid;
          gap: 14px;
          padding: 16px;
          font-family: var(--ha-font-family-body, system-ui);
        }

        .editor-card {
          display: grid;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(120,120,120,.20);
          border-radius: 14px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          opacity: .72;
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          opacity: .86;
        }

        select,
        input[type="text"],
        input[type="color"] {
          box-sizing: border-box;
          width: 100%;
        }

        select,
        input[type="text"] {
          padding: 9px 10px;
          border-radius: 10px;
          border: 1px solid rgba(120,120,120,.35);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #202426);
          font: inherit;
        }

        input[type="color"] {
          height: 42px;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid rgba(120,120,120,.35);
          background: var(--card-background-color, #fff);
        }
      </style>

      <div class="editor">
        <div class="editor-card">
          <div class="section-title">Darstellung</div>

          <label>
            Titel
            <input type="text" data-path="title" placeholder="Finanzen">
          </label>

          <label>
            Untertitel
            <input type="text" data-path="subtitle" placeholder="seit Inbetriebnahme">
          </label>

					<label class="checkbox-row">
					  <input type="checkbox" data-path="show_cents">
					  Cent-Beträge unter 100 € anzeigen
					</label>

          <label>
            Theme
            <select data-path="theme">
              <option value="auto">Automatisch</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label>
            Akzentfarbe
            <input type="color" data-path="accent_color">
          </label>
        </div>

        <div class="editor-card">
          <div class="section-title">Entitäten</div>
          <ha-form id="entity-form"></ha-form>
        </div>
      </div>
    `;

    const form = this.querySelector("#entity-form");

    if (form) {
      form.hass = this._hass;
      form.data = {
        entities: this._config.entities ?? {},
      };
      form.schema = schema;
			form.computeLabel = (schema) => {
				const labels = {
					direct_saving: "Direkte Ersparnis",
					battery_saving: "Batterie-Ersparnis",
					feed_in_revenue: "Einspeisevergütung",
					grid_import_cost: "Netzbezug Kosten",
					fictional_total: "Fiktiver Gesamtbezug",
				};
			
				return labels[schema.name] ?? schema.name;
			};

      form.addEventListener("value-changed", (ev) => {
        const config = this.cloneConfig(this._config);
        config.entities = ev.detail.value.entities ?? {};
        this._config = config;

        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config },
            bubbles: true,
            composed: true,
          }),
        );
      });
    }

    this.syncControls();

    this.querySelectorAll("select[data-path]").forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });

    this.querySelectorAll('input[type="text"][data-path]').forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });

		this.querySelectorAll('input[type="checkbox"][data-path]').forEach((el) => {
			el.addEventListener("change", (ev) => {
				this.updateConfig(ev.target.dataset.path, ev.target.checked);
			});
		});

    this.querySelectorAll('input[type="color"][data-path]').forEach((el) => {
      el.addEventListener("change", (ev) => {
        this.updateConfig(ev.target.dataset.path, ev.target.value);
      });
    });
  }

  updateConfig(path, value) {
    const config = this.cloneConfig(this._config);
    const parts = path.split(".");
    let target = config;

    while (parts.length > 1) {
      const key = parts.shift();
      target[key] = target[key] ?? {};
      target = target[key];
    }

    target[parts[0]] = value;
    this._config = config;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  cloneConfig(config) {
    if (window.structuredClone) return structuredClone(config);
    return JSON.parse(JSON.stringify(config));
  }
}

customElements.define("auri-ager-finance-card-editor", AuriAgerFinanceCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-finance-card",
  name: "Auri Ager Finance",
  description: "Calculate and display financial benefits",
  preview: true,
});
/*
 * Auri Ager Load Breakdown Card
 *
 */

class AuriAgerLoadBreakdownCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-load-breakdown-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-load-breakdown-card",
      title: "Verbrauchsanalyse",
      subtitle: "aktuelle Verbraucher",
      source: "",
      entities: [],
      accent_color: "#5aa7d8",
    };
  }

  getCardSize() {
    return 4;
  }

  stateSnapshot() {
    const source = this.config?.source;
    const entities = this.config?.entities ?? [];
    return [
      source ? `${source}:${this._hass?.states?.[source]?.state ?? ""}` : "",
      ...entities.map((e) => {
        const id = typeof e === "string" ? e : e.entity;
        return `${id}:${this._hass?.states?.[id]?.state ?? ""}`;
      }),
    ].join("|");
  }

  value(entityId) {
    const raw = this._hass?.states?.[entityId]?.state;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  fmtW(value) {
    return `${Math.round(value).toLocaleString("de-DE")} W`;
  }

  styles() {
    const C = this.colors();

    return `
      <style>
        ${this.baseStyles(this.config.accent_color)}

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .pill {
          border-radius: 16px;
          background: ${C.subtleBg};
          padding: 12px 14px;
        }

        .pill-label {
          font-size: 12px;
          color: ${C.small};
          margin-bottom: 4px;
        }

        .pill-value {
          font-size: 20px;
          font-weight: 780;
          color: ${C.value};
        }

        .rows {
          display: grid;
          gap: 0;
        }

        .row {
          display: grid;
          grid-template-columns: 34px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          border-top: 1px solid ${C.separator};
        }

        ha-icon {
          color: ${C.icon};
          --mdc-icon-size: 24px;
        }

        .name {
          color: ${C.text};
          font-size: 15px;
        }

        .value {
          color: ${C.value};
          font-size: 16px;
          font-weight: 760;
          white-space: nowrap;
        }

        .rest .name,
        .rest .value {
          font-weight: 780;
        }
      </style>
    `;
  }

  buildStaticDom() {
    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <div class="header">
          <div class="accent"></div>
          <div>
            <div id="title" class="title"></div>
            <div id="subtitle" class="subtitle"></div>
          </div>
        </div>

        <div class="summary">
          <div class="pill">
            <div class="pill-label">Gesamt</div>
            <div id="total" class="pill-value"></div>
          </div>
          <div class="pill">
            <div class="pill-label">Bekannt</div>
            <div id="known" class="pill-value"></div>
          </div>
          <div class="pill">
            <div class="pill-label">Rest</div>
            <div id="rest" class="pill-value"></div>
          </div>
        </div>

        <div id="rows" class="rows"></div>
      </ha-card>
    `;
  }

  updateDynamicDom() {
    const source = this.config.source;
    const entries = this.config.entities ?? [];

    const total = this.value(source);

    const items = entries
      .map((entry) => {
        const entity = typeof entry === "string" ? entry : entry.entity;
        const state = this._hass?.states?.[entity];
        const value = this.value(entity);

        return {
          entity,
          value,
          name:
            entry.name ??
            state?.attributes?.friendly_name ??
            entity,
          icon:
            entry.icon ??
            state?.attributes?.icon ??
            "mdi:flash",
        };
      })
      .sort((a, b) => b.value - a.value);

    const known = items.reduce((sum, item) => sum + item.value, 0);
    const rest = Math.max(0, total - known);

    this.setText("#title", this.config.title ?? "Verbrauchsanalyse");
    this.setText("#subtitle", this.config.subtitle ?? "");
    this.setText("#total", this.fmtW(total));
    this.setText("#known", this.fmtW(known));
    this.setText("#rest", this.fmtW(rest));

    const rows = this.shadowRoot.querySelector("#rows");

		rows.innerHTML = `
			${items.map((item) => `
				<div class="row clickable" data-entity="${item.entity}">
					<ha-icon icon="${item.icon}"></ha-icon>
					<div class="name">${item.name}</div>
					<div class="value">${this.fmtW(item.value)}</div>
				</div>
			`).join("")}
		
			<div class="row rest">
				<ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon>
				<div class="name">Nicht zugeordnet</div>
				<div class="value">${this.fmtW(rest)}</div>
			</div>
		`;
		
		rows.querySelectorAll("[data-entity]").forEach((el) => {
			el.addEventListener("click", () => {
				this.fireMoreInfo(el.dataset.entity);
			});
		});

  }
}

customElements.define("auri-ager-load-breakdown-card", AuriAgerLoadBreakdownCard);

class AuriAgerLoadBreakdownCardEditor extends AuriAgerEditorBase {
  static cardClass = AuriAgerLoadBreakdownCard;

  entries() {
    return Array.isArray(this._config?.entities) ? this._config.entities : [];
  }

  normalizeEntry(entry) {
    return typeof entry === "string" ? { entity: entry } : { ...(entry ?? {}) };
  }

  updateEntry(index, key, value) {
    const config = this.cloneConfig(this._config);
    config.entities = (config.entities ?? []).map((entry) => this.normalizeEntry(entry));
    config.entities[index] = { ...(config.entities[index] ?? {}) };

    if (value === "" || value === undefined) delete config.entities[index][key];
    else config.entities[index][key] = value;

    this.dispatchConfig(config);
    this.render();
  }

  addEntry() {
    const config = this.cloneConfig(this._config);
    config.entities = (config.entities ?? []).map((entry) => this.normalizeEntry(entry));
    config.entities.push({ entity: "", name: "", icon: "mdi:flash" });
    this.dispatchConfig(config);
    this.render();
  }

  removeEntry(index) {
    const config = this.cloneConfig(this._config);
    config.entities = (config.entities ?? []).filter((_, i) => i !== index);
    this.dispatchConfig(config);
    this.render();
  }

  moveEntry(from, to) {
    if (from === to || from < 0 || to < 0) return;
    const config = this.cloneConfig(this._config);
    const items = [...(config.entities ?? [])];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    config.entities = items;
    this.dispatchConfig(config);
    this.render();
  }

  render() {
    const c = this._config ?? {};

    this.shadowRoot.innerHTML = `
      <style>${this.editorStyles()}</style>
      <div class="editor">
        <div class="editor-card">
          <div class="section-title">Darstellung</div>
          ${this.renderInput("title", "Titel", c.title)}
          ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
          ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
          ${this.renderEntityPicker("source", "Gesamtverbrauch", c.source)}
        </div>
        <div class="editor-card">
          <div class="section-title">Verbraucher</div>
          <div class="list">
            ${this.entries().map((entry, index) => this.renderEntry(this.normalizeEntry(entry), index)).join("")}
          </div>
          <div class="button-row">
            <button type="button" data-add>Verbraucher hinzufügen</button>
          </div>
        </div>
      </div>
    `;

    this.bindBasicControls();
    this.bindEntries();
  }

  renderEntry(entry, index) {
    return `
      <div class="editor-card" draggable="true" data-entry="${index}">
        <div class="detail-head">
          <div class="section-title">Verbraucher ${index + 1}</div>
          <span class="row-action">
            <span class="drag-handle">☰</span>
            <button type="button" data-remove="${index}">Entfernen</button>
          </span>
        </div>
        ${this.renderEntryEntity(index, "entity", "Entity", entry.entity)}
        ${this.renderEntryInput(index, "name", "Name", entry.name)}
        ${this.renderEntryInput(index, "icon", "Icon", entry.icon)}
      </div>
    `;
  }

  bindEntries() {
    let dragIndex = null;

    this.shadowRoot.querySelector("[data-add]")?.addEventListener("click", () => this.addEntry());

    this.shadowRoot.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => this.removeEntry(Number(button.dataset.remove)));
    });

    this.shadowRoot.querySelectorAll("[data-entry][draggable]").forEach((row) => {
      row.addEventListener("dragstart", () => {
        dragIndex = Number(row.dataset.entry);
      });
      row.addEventListener("dragover", (ev) => ev.preventDefault());
      row.addEventListener("drop", (ev) => {
        ev.preventDefault();
        this.moveEntry(dragIndex, Number(row.dataset.entry));
      });
    });

    this.shadowRoot.querySelectorAll("[data-entry-key]").forEach((el) => {
      const handler = (ev) => {
        this.updateEntry(Number(ev.target.dataset.entryIndex), ev.target.dataset.entryKey, ev.detail?.value ?? ev.target.value);
      };

      if (el.tagName?.toLowerCase() === "ha-entity-picker" || el.tagName?.toLowerCase() === "ha-icon-picker") {
        el.hass = this._hass;
        el.value = el.dataset.value ?? "";
        el.addEventListener("value-changed", handler);
      } else {
        el.addEventListener("change", handler);
      }
    });
  }

  renderEntryInput(index, key, label, value = "") {
    if (key === "icon") {
      return `
        <label>
          <span>${label}</span>
          <ha-icon-picker data-entry-index="${index}" data-entry-key="${key}" data-value="${this.escapeHtml(value ?? "")}"></ha-icon-picker>
        </label>
      `;
    }

    return `
      <label>
        <span>${label}</span>
        <input type="text" data-entry-index="${index}" data-entry-key="${key}" value="${this.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  renderEntryEntity(index, key, label, value = "") {
    return `
      <label>
        <span>${label}</span>
        <ha-entity-picker data-entry-index="${index}" data-entry-key="${key}" data-value="${this.escapeHtml(value ?? "")}" allow-custom-entity></ha-entity-picker>
      </label>
    `;
  }
}

customElements.define("auri-ager-load-breakdown-card-editor", AuriAgerLoadBreakdownCardEditor);



window.customCards = window.customCards || [];
window.customCards.push({
  type: "auri-ager-load-breakdown-card",
  name: "Auri Ager Load Breakdown",
  description: "Calm energy distribution breakdown",
  preview: true,
});
/*
 * Auri Ager Switch Card
 *
 */

class AuriAgerSwitchCard extends AuriAgerBaseCard {
	static getConfigElement() {
		return document.createElement("auri-ager-switch-card-editor");
	}

	static getStubConfig() {
		return {
			type: "custom:auri-ager-switch-card",
			title: "Schalter",
			subtitle: "",
			entity: "",
			icon: "mdi:lightbulb",
			accent_color: "#f5b82e",
			layout: "normal",
			theme: "auto",
		};
	}

	getCardSize() {
		const layout = this.config?.layout ?? "normal";
	
		// layout: large   # viel Weißraum, Icon unten rechts
		// layout: normal  # kompakter Standard
		// layout: small   # Titel/Subtitel + Icon rechts
		// layout: tiny    # nur Accent + Titel
		if (layout === "large") return 2;
	
		return 1;
	}

	stateSnapshot() {
		const entity = this.config?.entity;
	
		return entity
			? `${entity}:${this._hass?.states?.[entity]?.state ?? ""}`
			: "";
	}

	toggleEntity() {
		const entity = this.config?.entity;
		if (!entity || !this._hass) return;
	
		this._hass.callService("homeassistant", "toggle", {
			entity_id: entity,
		});
	}

	styles() {
		const C = this.colors();
	
		return `
			<style>
				${this.baseStyles(this.config.accent_color)}
	
				.switch-row {
					display: grid;
					grid-template-columns: 8px minmax(0, 1fr) auto;
					gap: 14px;
					align-items: start;
				}
				
				.switch-text {
					min-width: 0;
				}
				
				.switch-icon {
					justify-self: end;
					color: ${C.icon};
					--mdc-icon-size: 30px;
				}
				
				/* large: Icon unten rechts mit Luft */
				ha-card.large .switch-row {
					min-height: 96px;
				}
				
				ha-card.large .switch-icon {
					align-self: end;
				}
				
				/* normal: Icon etwa auf Subtitle-Baseline */
				ha-card.normal .switch-row {
					min-height: 64px;
				}
				
				ha-card.normal .switch-icon {
					align-self: center;
					margin-top: 20px;
				}
				
				/* small: Icon auf Titel/Subtitel-Zeile */
				ha-card.small {
					padding-top: 8px;
					padding-bottom: 8px;
				}

				ha-card.small .switch-row {
					min-height: 50px;
					align-items: center;
				}
				
				ha-card.small .switch-icon {
					align-self: center;
				}
				
				/* tiny: kompakt */
				ha-card.tiny .switch-text {
				  display: flex;
				  align-items: baseline;
				  gap: 14px;
				  min-width: 0;
				}

				ha-card.tiny .title {
					font-size: 16px;
					font-weight: 700;
					line-height: 1;
				}
				
				ha-card.tiny .subtitle {
					display: block;
					font-size: 11px;
					line-height: 1;
					margin-top: 0;
				  transform: translateY(-1px);
				}
				
				ha-card.tiny {
					padding-top: 8px;
					padding-bottom: 8px;
				}
				
				ha-card.tiny .accent {
					height: 28px;
				}
				
				ha-card.tiny .switch-row {
					grid-template-columns: 8px minmax(0, 1fr);
					align-items: center;
					min-height: 28px;
				}
				
				@media (max-width: 360px) {
					ha-card.tiny .switch-text {
						display: none;
					}
				
					ha-card.tiny .subtitle {
						display: block;
						margin-top: 0;
					}
				}
	
				.icon {
					justify-self: end;
				}
	
				ha-icon {
					color: ${C.icon};
					--mdc-icon-size: 30px;
				}
			</style>
		`;
	}

	buildStaticDom() {
		const layout = this.config.layout ?? "normal";
		const tiny = layout === "tiny";
	
		this.shadowRoot.innerHTML = `
			${this.styles()}
	
			<ha-card id="switch-card" class="${layout}">
				<div class="switch-row">
					<div id="accent" class="accent"></div>
	
					<div class="switch-text">
						<div id="switch-title" class="title"></div>
						<div id="switch-subtitle" class="subtitle"></div>
					</div>
	
					${tiny ? "" : `
						<ha-icon id="switch-icon" class="switch-icon"></ha-icon>
					`}
				</div>
			</ha-card>
		`;
	
		const card = this.shadowRoot.querySelector("#switch-card");
		card?.addEventListener("click", () => this.toggleEntity());
		
		card?.addEventListener("contextmenu", (ev) => {
			ev.preventDefault();
			this.fireMoreInfo(this.config.entity);
		});
	}

	updateDynamicDom() {
		const state = this._hass?.states?.[this.config.entity];
		const isOn = ["on", "open", "active", "playing"].includes(state?.state);
	
		const C = this.colors();
	
		const offAccent = this.themeMode() === "dark"
			? "rgba(255,255,255,.16)"
			: "rgba(0,0,0,.07)";
		
		const accent = isOn
			? (this.config.accent_color ?? "#f5b82e")
			: offAccent;
	
		const iconColor =
			isOn
				? accent
				: C.icon;
	
		this.setText(
			"#switch-title",
			this.config.title ??
				state?.attributes?.friendly_name ??
				"Schalter",
		);
	
		this.setText(
			"#switch-subtitle",
			this.config.subtitle ?? "",
		);
	
		const icon =
			this.shadowRoot.querySelector(
				"#switch-icon",
			);
	
		if (icon) {
			icon?.setAttribute(
				"icon",
				this.config.icon ??
					"mdi:lightbulb",
			);
	
			icon.style.color = iconColor;
		}

		this.shadowRoot
			.querySelector("#accent")
			.style.background =
				accent;
	}

}

customElements.define("auri-ager-switch-card", AuriAgerSwitchCard);

class AuriAgerSwitchCardEditor extends AuriAgerEditorBase {
	static cardClass = AuriAgerSwitchCard;

	render() {
		const c = this._config ?? {};

		this.renderStandardEditor([
			{
				title: "Darstellung",
				body: `
					${this.renderInput("title", "Titel", c.title)}
					${this.renderInput("subtitle", "Untertitel", c.subtitle)}
					${this.renderInput("icon", "Icon", c.icon)}
					${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
					${this.renderSelect("layout", "Layout", c.layout, [
						["normal", "Normal"],
						["large", "Large"],
						["small", "Small"],
						["tiny", "Tiny"],
					])}
					${this.renderSelect("theme", "Theme", c.theme, [
						["auto", "Automatisch"],
						["light", "Hell"],
						["dark", "Dunkel"],
					])}
				`,
			},
			{
				title: "Entität",
				body: this.renderEntityPicker("entity", "Entity", c.entity),
			},
		]);
	}
}

customElements.define("auri-ager-switch-card-editor", AuriAgerSwitchCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-switch-card",
  name: "Auri Ager Switch",
  description: "Toggle an entity with Auri styling",
  preview: true,
});
/*
 * Auri Ager Thermometer Card
 *
 * Display temperature values in Auri Ager design language
 */

class AuriAgerThermometerCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-thermometer-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-thermometer-card",
      title: "Heizungsvorlauf",
      subtitle: "Temperatur",
      icon: "mdi:radiator",
      entity: "sensor.heizkreis_vorlauf",
      decimals: 1,
      min: 20,
      max: 60,
      dots: "ten",
      pointer: "arrow",
      layout: "normal",
      theme: "auto",
      color_schema: "normal",
      accent_color: "#5aa7d8",
      ring_color: "#e65c4f",
      fill_from_zero: false,
    };
  }

  getCardSize() {
    return 3;
  }

  accentColor() {
    return this.config?.accent_color ?? this.config?.accent ?? "#5aa7d8";
  }

  stateSnapshot() {
    const entity = this.config?.entity;
    const state = entity ? this._hass?.states?.[entity] : null;
    return `${entity ?? ""}:${state?.state ?? ""}`;
  }

  rawValue() {
    const entity = this.config?.entity;
    const state = entity ? this._hass?.states?.[entity] : null;
    const value = Number(state?.state);
    return Number.isFinite(value) ? value : null;
  }

  minValue() {
    const value = Number(this.config?.min ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  maxValue() {
    const value = Number(this.config?.max ?? 100);
    return Number.isFinite(value) ? value : 100;
  }

  normalizedValue() {
    const value = this.rawValue();
    const min = this.minValue();
    const max = this.maxValue();

    if (value === null || max <= min) return 0;

    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  valueText() {
    const value = this.rawValue();
    if (value === null) return "";

    const decimals = this.config?.decimals ?? 1;

    return `${value.toLocaleString("de-DE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })} °C`;
  }

	ringColor() {
		return this.config?.ring_color ?? this.accentColor();
	}
	
	positionForValue(value) {
		const min = this.minValue();
		const max = this.maxValue();
	
		if (max <= min) return 0;
	
		return Math.max(0, Math.min(1, (value - min) / (max - min)));
	}
	
	angleForRatio(ratio) {
		return -210 + ratio * 240;
	}

  fillAngles() {
    const ratio = this.normalizedValue();
    const min = this.minValue();
    const max = this.maxValue();
    const value = this.rawValue();

    if (this.config?.fill_from_zero && min < 0 && max > 0 && value !== null) {
      const zeroRatio = this.positionForValue(0);

      if (value < 0) {
        return {
          startAngle: this.angleForRatio(ratio),
          endAngle: this.angleForRatio(zeroRatio),
        };
      }

      return {
        startAngle: this.angleForRatio(zeroRatio),
        endAngle: this.angleForRatio(ratio),
      };
    }

    return {
      startAngle: -210,
      endAngle: this.angleForRatio(ratio),
    };
  }

	polarToCartesian(cx, cy, r, angleDeg) {
		const rad = (angleDeg * Math.PI) / 180;
	
		return {
			x: cx + r * Math.cos(rad),
			y: cy + r * Math.sin(rad),
		};
	}
	
	arcPath(cx, cy, r, startAngle, endAngle) {
		const start = this.polarToCartesian(cx, cy, r, startAngle);
		const end = this.polarToCartesian(cx, cy, r, endAngle);
		const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
	
		return [
			"M", start.x, start.y,
			"A", r, r, 0, largeArc, 1, end.x, end.y,
		].join(" ");
	}

	tickStep() {
		if (this.config?.dots === "five") return 5;
		if (this.config?.dots === "ten") return 10;
		return null;
	}
	
	tickDots() {
		const step = this.tickStep();
		if (!step) return "";
	
		const min = this.minValue();
		const max = this.maxValue();
		const start = Math.ceil(min / step) * step;
		const values = [];
	
		for (let v = start; v <= max; v += step) {
			values.push(v);
		}
	
		return values
			.map((v) => {
				const ratio = this.positionForValue(v);
				const angle = this.angleForRatio(ratio);
				const rad = (angle * Math.PI) / 180;
	
				const x = 110 + Math.cos(rad) * 84;
				const y = 110 + Math.sin(rad) * 84;
	
				const cls = v === 0 ? "tick-dot zero" : "tick-dot";
	
				return `<circle class="${cls}" cx="${x}" cy="${y}" r="${v === 0 ? 3.2 : 2.2}"></circle>`;
			})
			.join("");
	}

	scalePointForValue(value, radius = 98) {
		const ratio = this.positionForValue(value);
		const angle = this.angleForRatio(ratio);
		return this.polarToCartesian(110, 110, radius, angle);
	}

  styles() {
    const C = this.colors();
    const accent = this.accentColor();
    const ring = this.ringColor();

    return `
      <style>
        ${this.baseStyles(accent)}

        ha-card {
          display: grid;
          gap: 10px;
          padding: 22px;
          padding-bottom: 12px;
        }

        .header {
          grid-template-columns: 8px minmax(0, 1fr) auto;
        }

        .thermo-icon {
          justify-self: end;
          align-self: center;
          color: ${C.icon};
          --mdc-icon-size: 30px;
        }

				.thermo-wrap {
					position: relative;
					display: block;
					min-height: 0;
					height: 170px;
					margin-bottom: 0;
					overflow: visible;
				}
				
				.thermo-wrap svg {
					position: absolute;
					left: 50%;
					top: 50%;
					transform: translate(-50%, -50%);
					display: block;
				}
				
				ha-card.normal .thermo-wrap {
					height: 185px;
				}
				
				ha-card.small .thermo-wrap {
					height: 118px;
				}
				
        svg {
          width: min(170px, 76%);
          height: auto;
          overflow: visible;
        }

				ha-card.normal svg {
					width: min(204px, 82%);
				}
				
				ha-card.small svg {
					width: min(136px, 68%);
				}

        .track {
          fill: none;
          stroke: ${C.line};
          stroke-width: 14;
          stroke-linecap: round;
        }

				.fill {
					fill: none;
					stroke: ${ring};
					stroke-width: 14;
					stroke-linecap: butt;
					transition: stroke-dasharray .25s ease;
				}

        .tick-dot {
          fill: ${C.small};
          opacity: .55;
        }
        
        .tick-dot.zero {
				  fill: ${ring};
				  opacity: .9;
				}

				.scale-label {
					font-size: 14px;
					font-weight: 650;
					fill: ${C.small};
					text-anchor: middle;
				}
				
				.zero-line {
					stroke: ${C.small};
					stroke-width: 2;
					stroke-linecap: round;
					opacity: .75;
				}

        .pointer {
          fill: ${ring};
          transform-origin: 110px 110px;
          transition: transform .25s ease;
        }

        .value {
          font-size: 28px;
          font-weight: 850;
          fill: ${C.value};
          text-anchor: middle;
        }

        .range {
          font-size: 14px;
          font-weight: 650;
          fill: ${C.small};
          text-anchor: middle;
        }

        ha-card.small .value {
          font-size: 24px;
        }
      </style>
    `;
  }

  buildStaticDom() {
    const layout = this.config?.layout ?? "normal";
    const pointer = this.config?.pointer ?? "arrow";

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card class="${layout}">
        <div class="header">
          <div class="accent"></div>
          <div class="title-line">
            <div id="thermo-title" class="title"></div>
            <div id="thermo-subtitle" class="subtitle"></div>
          </div>
          <ha-icon id="thermo-icon" class="thermo-icon"></ha-icon>
        </div>

        <div class="thermo-wrap">
          <svg viewBox="20 20 180 155">
            <path
              class="track"
              d="M 43 153 A 78 78 0 1 1 177 153"
            ></path>

            <path
              id="thermo-fill"
              class="fill"
              d="M 43 153 A 78 78 0 1 1 177 153"
            ></path>

            ${this.tickDots()}

						<text id="thermo-min-label" class="scale-label"></text>
						<text id="thermo-max-label" class="scale-label"></text>
						<line id="thermo-zero-line" class="zero-line"></line>

            ${
              pointer === "arrow"
                ? `
                  <polygon
                    id="thermo-pointer"
                    class="pointer"
                    points="110,28 104,44 116,44"
                  ></polygon>
                `
                : ""
            }

            <text id="thermo-value" x="110" y="112" class="value"></text>
            <!-- <text id="thermo-range" x="110" y="136" class="range"></text> -->
          </svg>
        </div>
      </ha-card>
    `;

    this.attachEntityClick("ha-card", this.config.entity);
  }

  updateDynamicDom() {
    const ratio = this.normalizedValue();
    const pointer = this.config?.pointer ?? "arrow";
    const min = this.minValue();
    const max = this.maxValue();
    const fillFromZero = this.config?.fill_from_zero === true && min < 0 && max > 0;
    const showFill = pointer === "fill" || fillFromZero;

    this.setText("#thermo-title", this.config?.title ?? "");
    this.setText("#thermo-subtitle", this.config?.subtitle ?? "");
    this.setText("#thermo-value", this.valueText());
    /* this.setText(
      "#thermo-range",
      `${this.minValue()}–${this.maxValue()} °C`,
    ); */

    const icon = this.shadowRoot.querySelector("#thermo-icon");
    if (icon) {
      icon.setAttribute("icon", this.config?.icon ?? "mdi:thermometer");
    }

		const fill = this.shadowRoot.querySelector("#thermo-fill");
		if (fill) {
			if (showFill) {
				fill.style.display = "";
		
				const { startAngle, endAngle } = this.fillAngles();
		
				fill.setAttribute(
					"d",
					this.arcPath(110, 110, 78, startAngle, endAngle),
				);
			} else {
				fill.style.display = "none";
			}
		}

		const minPoint = this.scalePointForValue(min, 103);
		const maxPoint = this.scalePointForValue(max, 103);
		
		const minLabel = this.shadowRoot.querySelector("#thermo-min-label");
		if (minLabel) {
			minLabel.setAttribute("x", minPoint.x);
			minLabel.setAttribute("y", minPoint.y + 4);
			minLabel.textContent = `${min}°`;
		}
		
		const maxLabel = this.shadowRoot.querySelector("#thermo-max-label");
		if (maxLabel) {
			maxLabel.setAttribute("x", maxPoint.x);
			maxLabel.setAttribute("y", maxPoint.y + 4);
			maxLabel.textContent = `${max}°`;
		}

		const zeroLine = this.shadowRoot.querySelector("#thermo-zero-line");
		
		if (zeroLine) {
			if (min < 0 && max > 0) {
				const inner = this.scalePointForValue(0, 70);
				const outer = this.scalePointForValue(0, 88);
		
				zeroLine.style.display = "";
				zeroLine.setAttribute("x1", inner.x);
				zeroLine.setAttribute("y1", inner.y);
				zeroLine.setAttribute("x2", outer.x);
				zeroLine.setAttribute("y2", outer.y);
			} else {
				zeroLine.style.display = "none";
			}
		}

    const marker = this.shadowRoot.querySelector("#thermo-pointer");
    if (marker) {
      const angle = -210 + ratio * 240;
      marker.style.transform = `rotate(${angle + 90}deg)`;
    }
  }
}

customElements.define("auri-ager-thermometer-card", AuriAgerThermometerCard);

class AuriAgerThermometerCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = AuriAgerThermometerCard.getStubConfig();
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.bindEntityPickers();
    this.shadowRoot.querySelectorAll("ha-icon-picker").forEach((el) => {
      el.hass = hass;
    });
  }

  setConfig(config) {
    this._config = {
      ...AuriAgerThermometerCard.getStubConfig(),
      ...config,
    };

    this.render();
  }

  escapeHtml(value) {
    return `${value ?? ""}`
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  styles() {
    return `
      .editor {
        display: grid;
        gap: 14px;
        padding: 16px;
        font-family: var(--ha-font-family-body, system-ui);
      }

      .editor-card {
        display: grid;
        gap: 12px;
        padding: 12px;
        border: 1px solid rgba(120,120,120,.20);
        border-radius: 14px;
      }

      .section-title {
        font-size: 13px;
        font-weight: 700;
        opacity: .72;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 12px;
        opacity: .86;
      }

      input,
      select {
        box-sizing: border-box;
        width: 100%;
        padding: 9px 10px;
        border-radius: 10px;
        border: 1px solid rgba(120,120,120,.35);
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #202426);
        font: inherit;
      }

      input[type="color"] {
        height: 42px;
        padding: 4px;
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
      }

      .checkbox-row input {
        width: auto;
      }
    `;
  }

  render() {
    const c = this._config ?? {};

    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>

      <div class="editor">
        <div class="editor-card">
          <div class="section-title">Darstellung</div>
          ${this.renderInput("title", "Titel", c.title)}
          ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
          ${this.renderInput("icon", "Icon", c.icon)}
          ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
          ${this.renderInput("ring_color", "Ringfarbe", c.ring_color, "color")}
          ${this.renderSelect("layout", "Layout", c.layout, [
            ["normal", "Normal"],
            ["small", "Small"],
          ])}
          ${this.renderSelect("theme", "Theme", c.theme, [
            ["auto", "Automatisch"],
            ["light", "Hell"],
            ["dark", "Dunkel"],
          ])}
        </div>

        <div class="editor-card">
          <div class="section-title">Skala</div>
          ${this.renderEntityPicker("entity", "Entity", c.entity)}
          ${this.renderInput("min", "Minimum", c.min, "number")}
          ${this.renderInput("max", "Maximum", c.max, "number")}
          ${this.renderInput("decimals", "Nachkommastellen", c.decimals, "number")}
          ${this.renderSelect("dots", "Skalenpunkte", c.dots, [
            ["none", "Keine"],
            ["five", "5er-Schritte"],
            ["ten", "10er-Schritte"],
          ])}
          ${this.renderSelect("pointer", "Anzeige", c.pointer, [
            ["arrow", "Zeiger"],
            ["fill", "Füllung"],
          ])}
          ${this.renderCheckbox("fill_from_zero", "Füllung vom Nullpunkt starten", c.fill_from_zero === true)}
        </div>
      </div>
    `;

    [
      "title",
      "subtitle",
      "icon",
      "accent_color",
      "ring_color",
      "layout",
      "theme",
      "entity",
      "min",
      "max",
      "decimals",
      "dots",
      "pointer",
      "fill_from_zero",
    ].forEach((key) => this.bindInput(key));

    this.bindEntityPickers();
  }

  bindInput(key) {
    const el = this.shadowRoot.querySelector("#" + key);
    if (!el) return;

    if (el.tagName?.toLowerCase() === "ha-icon-picker") {
      el.hass = this._hass;
      el.value = this._config?.[key] ?? "";
      el.addEventListener("value-changed", (ev) => {
        this.configChanged(key, ev.detail.value ?? "");
      });
      return;
    }

    el.addEventListener("change", (ev) => {
      let value = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
      if (ev.target.type === "number") value = Number(value);
      this.configChanged(key, value);
    });
  }

  bindEntityPickers() {
    this.shadowRoot.querySelectorAll("ha-entity-picker[data-key]").forEach((el) => {
      const key = el.dataset.key;
      el.hass = this._hass;
      el.value = this._config?.[key] ?? "";

      if (el._auriBound) return;
      el._auriBound = true;

      el.addEventListener("value-changed", (ev) => {
        this.configChanged(key, ev.detail.value ?? "");
      });
    });
  }

  configChanged(key, value) {
    const config = {
      ...this._config,
      [key]: value,
    };

    this._config = config;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  renderSelect(key, label, value, options = []) {
    return `
      <label>
        <span>${label}</span>
        <select id="${key}">
          ${options
            .map(([v, text]) => `
              <option value="${this.escapeHtml(v)}" ${value === v ? "selected" : ""}>
                ${this.escapeHtml(text)}
              </option>
            `)
            .join("")}
        </select>
      </label>
    `;
  }

  renderCheckbox(key, label, checked = false) {
    return `
      <label class="checkbox-row">
        <input type="checkbox" id="${key}" ${checked ? "checked" : ""}>
        <span>${label}</span>
      </label>
    `;
  }

  renderInput(key, label, value = "", type = "text") {
    if (type === "text" && key.endsWith("icon")) {
      return `
        <label>
          <span>${label}</span>
          <ha-icon-picker id="${key}" data-value="${this.escapeHtml(value ?? "")}"></ha-icon-picker>
        </label>
      `;
    }

    return `
      <label>
        <span>${label}</span>
        <input type="${type}" id="${key}" value="${this.escapeHtml(value ?? "")}">
      </label>
    `;
  }

  renderEntityPicker(key, label, value = "") {
    return `
      <label>
        <span>${label}</span>
        <ha-entity-picker
          data-key="${key}"
          data-value="${this.escapeHtml(value ?? "")}"
          allow-custom-entity>
        </ha-entity-picker>
      </label>
    `;
  }
}

customElements.define("auri-ager-thermometer-card-editor", AuriAgerThermometerCardEditor);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-thermometer-card",
  name: "Auri Ager Thermometer",
  description: "Configurable thermometer card",
  preview: true,
});
/*
 * Auri Ager Control Card
 *
 * Action / cover control card in Auri Ager design language.
 */

class AuriAgerControlCard extends AuriAgerBaseCard {
	static getConfigElement() {
  	return document.createElement("auri-ager-control-card-editor");
	}

  static getStubConfig() {
    return {
      type: "custom:auri-ager-control-card",
      title: "Schalter",
      subtitle: "",
      entity: "",
      mode_entity: "",
      status_entity: "",
      accent_icon: "",
      icon: "",
      icon_on: "",
      icon_off: "",
      mode_icon: "",
      show_control: true,
      status_on: "Aktiv",
      status_off: "Inaktiv",
      accent_color: "#f5b82e",
      layout: "normal",
      theme: "auto",
      mode: "action",
    };
  }

  getCardSize() {
    const layout = this.config?.layout ?? "normal";
    return layout === "large" ? 2 : 1;
  }

	trackedEntities() {
		const entities = [];
	
		for (const item of this.items()) {
			if (item.entity) entities.push(item.entity);
			if (item.mode_entity) entities.push(item.mode_entity);
			if (item.status_entity) entities.push(item.status_entity);
		}
	
		return [...new Set(entities)];
	}

	stateSnapshot() {
		const parts = [];
	
		for (const item of this.items()) {
			if (item?.type === "divider") continue;
	
			const entity = item?.entity;
			const mode = item?.mode_entity;
			const status = item?.status_entity;
	
			const stateObj = entity ? this._hass?.states?.[entity] : null;
			const modeObj = mode ? this._hass?.states?.[mode] : null;
			const statusObj = status ? this._hass?.states?.[status] : null;
	
			parts.push([
				entity ?? "",
				stateObj?.state ?? "",
				stateObj?.attributes?.current_position ?? "",
				stateObj?.attributes?.position ?? "",
				mode ?? "",
				modeObj?.state ?? "",
				status ?? "",
				statusObj?.state ?? "",
			].join(":"));
		}
	
		parts.push(`w:${this.offsetWidth}`);
	
		return parts.join("|");
	}

  accentColor() {
    return this.config?.accent_color ?? this.config?.accent ?? "#f5b82e";
  }

	isGroup() {
		return Array.isArray(this.config?.items) &&
					 this.config.items.length > 0;
	}
	
	effectiveLayout(item) {
	  if (this.isGroup()) return "tiny";
  	return item?.layout ?? this.config?.layout ?? "normal";
	}

	domainFor(item) {
		return `${item?.entity ?? ""}`.split(".")[0];
	}
	
	isCoverFor(item) {
		return item?.mode === "cover" || this.domainFor(item) === "cover";
	}
	
	isNativeMoreInfoControlFor(item) {
		const domain = this.domainFor(item);
		return domain === "select" || domain === "input_select" || domain === "number";
	}

	selectOptions() {
		const entity = this.config?.entity;
		const stateObj = entity ? this._hass?.states?.[entity] : null;
		return stateObj?.attributes?.options ?? [];
	}
	
	selectValue() {
		const entity = this.config?.entity;
		return entity ? this._hass?.states?.[entity]?.state ?? "" : "";
	}
	
	selectServiceDomain() {
		return this.domain() === "input_select" ? "input_select" : "select";
	}
	
	setSelectOption(option) {
		const entity = this.config?.entity;
		if (!entity || !this._hass) return;
	
		this._hass.callService(this.selectServiceDomain(), "select_option", {
			entity_id: entity,
			option,
		});
	}

	numberValue() {
		const entity = this.config?.entity;
		return entity ? this._hass?.states?.[entity]?.state ?? "" : "";
	}
	
	setNumberValue(value) {
		const entity = this.config?.entity;
		if (!entity || !this._hass) return;
	
		this._hass.callService("number", "set_value", {
			entity_id: entity,
			value: Number(value),
		});
	}

	isNativeMoreInfoControl() {
		return this.isSelect() || this.isNumber();
	}

  statusState() {
    const id = this.config?.status_entity || this.config?.entity;
    return id ? this._hass?.states?.[id] : null;
  }

  isActiveState(state) {
    return ["on", "open", "opening", "active", "playing"].includes(state?.state);
  }

  currentIcon(active) {
    if (active && this.config.icon_on) return this.config.icon_on;
    if (!active && this.config.icon_off) return this.config.icon_off;
    return this.config.icon ?? "mdi:gesture-tap";
  }

	isSwitchFor(item) {
		return item?.mode === "switch" || this.domainFor(item) === "switch";
	}
	
	isBooleanFor(item) {
		return item?.mode === "boolean" || this.domainFor(item) === "input_boolean";
	}
	
	isSelectFor(item) {
		const domain = this.domainFor(item);
		return item?.mode === "select" || domain === "select" || domain === "input_select";
	}
	
	isNumberFor(item) {
		return item?.mode === "number" || this.domainFor(item) === "number";
	}
	
	isClickableFor(item) {
		const domain = this.domainFor(item);
		return (
			this.isCoverFor(item) ||
			this.isSwitchFor(item) ||
			this.isBooleanFor(item) ||
			this.isSelectFor(item) ||
			this.isNumberFor(item) ||
			domain === "button" ||
			domain === "script"
		);
	}

  runActionFor(item) {
		const entity = item?.entity;
		if (!entity || !this._hass) return;
	
		const domain = entity.split(".")[0];
	
		if (domain === "script") {
			this._hass.callService("script", "turn_on", { entity_id: entity });
			return;
		}
	
		if (domain === "button") {
			this._hass.callService("button", "press", { entity_id: entity });
			return;
		}
	
		this._hass.callService("homeassistant", "toggle", { entity_id: entity });
	}
	
	coverActionFor(item, service) {
		const entity = item?.entity;
		if (!entity || !this._hass) return;
	
		this._hass.callService("cover", service, { entity_id: entity });
	}
	
	toggleModeFor(item) {
		const entity = item?.mode_entity;
		if (!entity || !this._hass) return;
	
		this._hass.callService("homeassistant", "toggle", { entity_id: entity });
		setTimeout(() => this.updateDynamicDom(), 250);
	}
	
	setSelectOptionFor(item, option) {
		const entity = item?.entity;
		if (!entity || !this._hass) return;
	
		const domain = entity.split(".")[0];
		const serviceDomain = domain === "input_select" ? "input_select" : "select";
	
		this._hass.callService(serviceDomain, "select_option", {
			entity_id: entity,
			option,
		});
	}
	
	setNumberValueFor(item, value) {
		const entity = item?.entity;
		if (!entity || !this._hass) return;
	
		this._hass.callService("number", "set_value", {
			entity_id: entity,
			value: Number(value),
		});
	}

	controlIconFor(entity, state, item = this.config) {
		const domain = entity?.split(".")[0];
		const active = state === "on";
	
		if (active && item?.icon_on) return item.icon_on;
		if (!active && item?.icon_off) return item.icon_off;
	
		if (domain === "button") return item?.icon || "mdi:gesture-tap";
		if (domain === "script") return item?.icon || "mdi:gesture-tap";
	
		if (domain === "switch") {
			return active
				? item?.icon_on || "mdi:toggle-switch-outline"
				: item?.icon_off || "mdi:toggle-switch-off-outline";
		}
	
		if (domain === "input_boolean") {
			return active
				? item?.icon_on || "mdi:checkbox-marked-outline"
				: item?.icon_off || "mdi:checkbox-blank-outline";
		}
	
		if (item?.icon) return item.icon;
	
		return "mdi:gesture-tap";
	}

  coverAction(service) {
    const entity = this.config?.entity;
    if (!entity || !this._hass) return;

    this._hass.callService("cover", service, { entity_id: entity });
  }
  
  coverPosition() {
	  const cover =
  	  this._hass?.states?.[this.config.entity];

	  return cover?.attributes?.current_position;
	}

	modeState() {
		const id = this.config?.mode_entity;
		return id ? this._hass?.states?.[id] : null;
	}
	
	modeActive() {
		return this.modeState()?.state === "on";
	}
	
	toggleMode() {
		const entity = this.config?.mode_entity;
		if (!entity || !this._hass) return;
	
		this._hass.callService("homeassistant", "toggle", {
			entity_id: entity,
		});
		
		setTimeout(() => this.updateDynamicDom(), 250);
	}

	coverStatusText() {
		const pos = this.coverPosition();
	
		if (pos === undefined || pos === null)
			return "";
	
		if (pos === 0)
			return "Geschlossen";
	
		if (pos >= 90)
			return "Offen";
	
		return `${pos}%`;
	}

  styles() {
    const C = this.colors();

    return `
      <style>
        ${this.baseStyles(this.accentColor())}

				.rows {
					display: grid;
					gap: 8px;
				}
				
				.control-row {
					display: grid;
					grid-template-columns: 8px minmax(0, 1fr) auto;
					gap: 14px;
					align-items: center;
					min-height: 50px;
				}
				
				.control-row {
				  padding-top: 2px;
				  padding-bottom: 2px;
				}

        .switch-row {
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
        }

        .switch-text {
          min-width: 0;
        }

        .switch-icon {
          justify-self: end;
          align-self: end;
          color: ${C.icon};
          --mdc-icon-size: 30px;
          grid-column: 3;
          grid-row: 2;
        }

        .cover-controls {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-self: end;
          grid-column: 3;
          grid-row: 1;
        }

        .cover-controls button {
          border: 0;
          border-radius: 8px;
          background: rgba(0,0,0,.06);
          width: 30px;
          height: 22px;
          display: grid;
          place-items: center;
          cursor: pointer;
          padding: 0;
        }

        .cover-controls button:active {
          opacity: .65;
        }

        .cover-controls ha-icon {
          --mdc-icon-size: 16px;
          color: ${C.value};
        }
        
        .cover-text {
					font-size: 14px;
					font-weight: 500;
					color: ${C.subtitle};
					margin-right: 4px;
					white-space: nowrap;
				}
				
				.cover-position {
					width: 75px;
					text-align: right;
				  margin-right: 18px;
				}

				.cover-mode {
					display: grid;
					place-items: center;
					width: 22px;
					height: 22px;
					border-radius: 8px;
					margin-right: 0;
					cursor: pointer;
					user-select: none;
					font-weight: 800;
				}
				
				.cover-mode ha-icon {
					--mdc-icon-size: 15px;
				}
				
				.cover-mode.active {
					background: ${this.accentColor()};
					color: #fff;
				}
				
				.cover-mode.inactive {
					background: rgba(0,0,0,.06);
					color: ${C.subtitle};
				}

				/* large: viel Weißraum, Icon unten rechts */
				ha-card.large .control-row {
				  min-height: 132px;
				  align-items: start;
				}
				
				ha-card.large .switch-icon {
				  justify-self: end;
				  align-self: end;
				  margin: 0;
				  --mdc-icon-size: 30px;
				  grid-column: 3;
				  grid-row: 2;
				}
				
				/* normal: Standardkarte */
				ha-card.normal .control-row {
				  min-height: 96px;
				  align-items: start;
				}
				
				ha-card.normal .switch-icon {
				  justify-self: end;
				  align-self: end;
				  margin: 0;
				  --mdc-icon-size: 30px;
				  grid-column: 3;
				  grid-row: 2;
				}
				
				/* small: Listenelement mit optionalem Subtitle */
				ha-card.small {
				  padding-top: 8px;
				  padding-bottom: 8px;
				}
				
				ha-card.small .control-row {
				  min-height: 50px;
				  align-items: center;
				}
				
				ha-card.small .switch-icon {
				  justify-self: end;
				  align-self: center;
				  margin: 0;
				  --mdc-icon-size: 26px;
				  transform: translateY(-1px);
				  grid-column: 3;
				  grid-row: 1;
				}
				
				ha-card.small .switch-text {
				  display: grid;
				  gap: 3px;
				}
				
				/* tiny: kompakt, ohne Subtitle */
				ha-card.tiny {
				  padding-top: 8px;
				  padding-bottom: 8px;
				}
				
				ha-card.tiny .accent {
				  height: 28px;
				}
				
				ha-card.tiny .control-row {
				  grid-template-columns: 8px minmax(0, 1fr) auto;
				  align-items: center;
				  min-height: 28px;
				}
				
				ha-card.tiny .switch-text {
				  display: flex;
				  align-items: baseline;
				  gap: 14px;
				  min-width: 0;
				}
				
				ha-card.tiny .title {
				  font-size: 16px;
				  font-weight: 700;
				  line-height: 1;
			    transform: translateY(2px);
				}
				
				ha-card.tiny .subtitle {
				  display: none;
				}
				
				ha-card.tiny .switch-icon {
				  justify-self: end;
				  align-self: center;
				  margin: 0;
				  --mdc-icon-size: 26px;
				  transform: translateY(-1px);
				  grid-column: 3;
				  grid-row: 1;
				}

				.control-row.control-switch .switch-icon {
				  --mdc-icon-size: 34px;
				}

				.accent.accent-icon {
					background: transparent !important;
					width: 32px;
					height: 32px;
					display: grid;
					place-items: center;
					margin-left: -10px;
				}
				
				.accent.accent-icon ha-icon {
					color: ${this.accentColor()};
					--mdc-icon-size: 26px;
				}

        @media (max-width: 360px) {
          ha-card.tiny .switch-text {
            display: none;
          }
        }

        ha-icon {
          color: ${C.icon};
          --mdc-icon-size: 30px;
        }

				.value-control-container {
					position: relative;
					justify-self: end;
					display: flex;
					align-items: center;
					gap: 4px;
				}
				
				.value-control {
					border: 0;
					background: rgba(0,0,0,.06);
					border-radius: 8px;
					padding: 6px 10px;
					font: inherit;
					color: ${C.value};
					cursor: pointer;
				}
				
				.value-control-select {
					appearance: none;
					-webkit-appearance: none;
					padding-right: 28px;
				}
				
				.value-control-arrow {
					position: absolute;
					right: 8px;
					pointer-events: none;
					color: ${C.icon};
					--mdc-icon-size: 16px;
				}

				.number-control {
					width: 92px;
					min-width: 0;
					text-align: right;
					padding: 6px 8px;
				}
				
				.value-control-unit {
					min-width: 20px;
					color: ${C.subtitle};
					font-weight: 800;
				}

				.control-divider {
					min-height: 0;
					padding: 6px 0 2px 0;
				}
				
				.control-divider-title {
					font-size: 14px;
					font-weight: 700;
					color: ${C.subtitle};
				}
				
				.control-divider.has-line {
					border-top: 1px solid rgba(0,0,0,.10);
					margin: 4px 0;
				}

				ha-card.is-clickable {
					cursor: pointer;
				}
				
				.control-row.is-clickable {
				  cursor: pointer;
				}
				
				.cover-controls button,
				#cover-mode,
				.switch-icon {
					cursor: pointer;
				}
      </style>
    `;
  }

	buildStaticDom() {
		const layout = this.isGroup()
			? "tiny"
			: (this.config?.layout ?? "normal");
	
		this.shadowRoot.innerHTML = `
			${this.styles()}
	
			<ha-card id="control-card" class="${layout}">
				<div id="rows" class="rows"></div>
			</ha-card>
		`;

		const rows = this.shadowRoot.querySelector("#rows");
		
		rows?.addEventListener("click", (ev) => {
			const row = ev.target.closest(".control-row");
			if (!row) return;
		
			const index = Number(row.dataset.index);
			const item = this.items()[index];
			if (!item) return;
		
			// echte Inline-Controls sollen ihren eigenen Job machen
			if (ev.target.closest(".value-control-container")) {
				ev.stopPropagation();
				return;
			}
		
			// Cover-Buttons
			if (ev.target.closest(".cover-open")) {
				ev.stopPropagation();
				this.coverActionFor(item, "open_cover");
				return;
			}
		
			if (ev.target.closest(".cover-stop")) {
				ev.stopPropagation();
				this.coverActionFor(item, "stop_cover");
				return;
			}
		
			if (ev.target.closest(".cover-close")) {
				ev.stopPropagation();
				this.coverActionFor(item, "close_cover");
				return;
			}
		
			if (ev.target.closest(".cover-mode")) {
				ev.stopPropagation();
				this.toggleModeFor(item);
				return;
			}
		
			if (this.isCoverFor(item) || this.isNativeMoreInfoControlFor(item)) {
				this.fireMoreInfo(item.entity);
				return;
			}
		
			this.runActionFor(item);
		});

		rows?.addEventListener("change", (ev) => {
			const row = ev.target.closest(".control-row");
			if (!row) return;
		
			const index = Number(row.dataset.index);
			const item = this.items()[index];
			if (!item) return;
		
			const target = ev.target;
		
			if (target.classList.contains("value-control-select")) {
				ev.stopPropagation();
				this.setSelectOptionFor(item, target.value);
				return;
			}
		
			if (target.classList.contains("value-control-number")) {
				ev.stopPropagation();
				this.setNumberValueFor(item, target.value);
				return;
			}
		});

  }

	items() {
		return Array.isArray(this.config?.items) && this.config.items.length
			? this.config.items
			: [this.config];
	}

	renderRow(item, index) {
		if (item?.type === "divider") {
		  return this.renderDivider(item, index);
		}

		return `
			<div class="control-row" data-index="${index}">
				<div class="accent"></div>
	
				<div class="switch-text">
					<div class="title">${this.escapeHtml(item.title ?? "Schalter")}</div>
					<div class="subtitle">${this.escapeHtml(item.subtitle ?? "")}</div>
				</div>
	
				<div class="value-control-container"></div>
	
				<div class="cover-controls">
					<div class="cover-mode cover-text"></div>
					<div class="cover-position cover-text"></div>
					<button class="cover-open" aria-label="Öffnen">
						<ha-icon icon="mdi:chevron-up"></ha-icon>
					</button>
					<button class="cover-stop" aria-label="Stopp">
						<ha-icon icon="mdi:square"></ha-icon>
					</button>
					<button class="cover-close" aria-label="Schließen">
						<ha-icon icon="mdi:chevron-down"></ha-icon>
					</button>
				</div>

				<ha-icon class="switch-icon"></ha-icon>
			</div>
		`;
	}

	updateRow(row, item, index) {
		const layout = this.effectiveLayout(item);
		const tiny = layout === "tiny";
	
		const entity = item?.entity;
		const domain = `${entity ?? ""}`.split(".")[0];

		const showControl = item?.show_control !== false;

		const stateObj = entity ? this._hass?.states?.[entity] : null;
		const statusId = item?.status_entity || entity;
		const statusState = statusId ? this._hass?.states?.[statusId] : null;
		const active = this.isActiveState(statusState);
	
		const isCover = item?.mode === "cover" || domain === "cover";
		const isSwitch = item?.mode === "switch" || domain === "switch";
		const isBoolean = item?.mode === "boolean" || domain === "input_boolean";
		const isSelect =
			item?.mode === "select" || domain === "select" || domain === "input_select";
		const isNumber = item?.mode === "number" || domain === "number";
	
		const C = this.colors();
	
		const offAccent =
			this.themeMode() === "dark"
				? "rgba(255,255,255,.16)"
				: "rgba(0,0,0,.07)";
	
		const accentBase = item?.accent_color ?? item?.accent ?? this.accentColor();
		const hasExplicitAccent = !!item?.accent_color || !!item?.accent;
		const isPassiveControl = isSelect || isNumber;
	
		const effectiveAccent =
			isPassiveControl && !hasExplicitAccent
				? offAccent
				: active
					? accentBase
					: offAccent;
	
		const effectiveIconColor =
			isPassiveControl && !hasExplicitAccent
				? C.icon
				: active || hasExplicitAccent
					? accentBase
					: C.icon;
	
		const iconColor = effectiveIconColor;
	
		row.classList.toggle("control-switch", isSwitch);
		row.classList.toggle("control-boolean", isBoolean);
		row.classList.toggle(
			"is-clickable",
			isCover ||
				isSwitch ||
				isBoolean ||
				isSelect ||
				isNumber ||
				domain === "button" ||
				domain === "script"
		);
	
		const titleEl = row.querySelector(".title");
		const subtitleEl = row.querySelector(".subtitle");
	
		if (titleEl) {
			titleEl.textContent =
				item?.title ??
				statusState?.attributes?.friendly_name ??
				"Schalter";
		}
	
		if (subtitleEl) {
			subtitleEl.textContent = item?.subtitle ?? "";
		}
	
		const valueControl = row.querySelector(".value-control-container");
	
		if (valueControl) {
			if (isSelect) {
				const value = stateObj?.state ?? "";
				const options = stateObj?.attributes?.options ?? [];
	
				valueControl.style.display = "";
				valueControl.innerHTML = `
					<select class="value-control value-control-select">
						${options
							.map((opt) => `<option value="${this.escapeHtml(opt)}">${this.escapeHtml(opt)}</option>`)
							.join("")}
					</select>
					<ha-icon
						class="value-control-arrow"
						icon="mdi:chevron-down">
					</ha-icon>
				`;
	
				const select = valueControl.querySelector(".value-control-select");
				if (select) select.value = value;
			} else if (isNumber) {
				const value = stateObj?.state ?? "";
				const unit = stateObj?.attributes?.unit_of_measurement ?? "";
				const min = stateObj?.attributes?.min;
				const max = stateObj?.attributes?.max;
				const step = stateObj?.attributes?.step ?? 1;
	
				valueControl.style.display = "";
				valueControl.innerHTML = `
					<input
						class="value-control value-control-number number-control"
						type="number"
						value="${this.escapeHtml(value)}"
						${min !== undefined ? `min="${this.escapeHtml(min)}"` : ""}
						${max !== undefined ? `max="${this.escapeHtml(max)}"` : ""}
						step="${this.escapeHtml(step)}"
					/>
					${unit ? `<span class="value-control-unit">${this.escapeHtml(unit)}</span>` : ""}
				`;
			} else {
				valueControl.style.display = "none";
				valueControl.innerHTML = "";
			}
		}
	
		const modeEl = row.querySelector(".cover-mode");
	
		if (modeEl) {
			const modeEntity = item?.mode_entity;
			const modeState = modeEntity ? this._hass?.states?.[modeEntity] : null;
			const modeActive = modeState?.state === "on";
	
			modeEl.style.display = isCover && modeEntity ? "" : "none";
			modeEl.classList.toggle("active", modeActive);
			modeEl.classList.toggle("inactive", !modeActive);

			if (modeActive) {
				modeEl.style.background = accentBase;
				modeEl.style.color = "#fff";
			} else {
				modeEl.style.background = "rgba(0,0,0,.06)";
				modeEl.style.color = C.subtitle;
			}
	
			if (item?.mode_icon) {
				modeEl.innerHTML = `<ha-icon icon="${this.escapeHtml(item.mode_icon)}"></ha-icon>`;
			} else {
				modeEl.textContent = "A";
			}
		}
	
		const coverPositionEl = row.querySelector(".cover-position");
	
		if (coverPositionEl) {
			const pos = stateObj?.attributes?.current_position;
			let text = "";
	
			if (pos !== undefined && pos !== null) {
				if (pos === 0) text = "Geschlossen";
				else if (pos >= 90) text = "Offen";
				else text = `${pos}%`;
			}
	
			coverPositionEl.textContent = isCover ? text : "";
		}
	
		const icon = row.querySelector(".switch-icon");
	
		if (icon) {
			if (showControl) {
				icon.setAttribute("icon", this.controlIconFor(entity, stateObj?.state, item));
			} else {
				icon.setAttribute("icon", item?.icon || this.controlIconFor(entity, stateObj?.state, item));
			}
			icon.style.color = iconColor;
			icon.style.display =
				(tiny && isCover) || isSelect || isNumber ? "none" : "";
		}
	
		const accentEl = row.querySelector(".accent");
	
		if (accentEl) {
			const accentIcon = item?.accent_icon;
	
			if (accentIcon) {
				accentEl.innerHTML = `<ha-icon icon="${this.escapeHtml(accentIcon)}"></ha-icon>`;
				accentEl.classList.add("accent-icon");
				accentEl.style.background = "transparent";
	
				const accentHaIcon = accentEl.querySelector("ha-icon");
				if (accentHaIcon) {
					accentHaIcon.style.color = effectiveIconColor;
				}
			} else {
				accentEl.innerHTML = "";
				accentEl.classList.remove("accent-icon");
				accentEl.style.background = effectiveAccent;
			}
		}
	
		const coverControls = row.querySelector(".cover-controls");
		if (coverControls) {
			coverControls.style.display = isCover ? "flex" : "none";
		}
		
		row.classList.toggle("control-switch", isSwitch);
		row.classList.toggle("control-boolean", isBoolean);
		row.classList.toggle("is-clickable", this.isClickableFor(item));
	}

  updateDynamicDom() {
		const rows = this.shadowRoot.querySelector("#rows");
		
		if (rows) {
			rows.innerHTML = this.items()
			  .map((item, index) => this.renderRow(item, index))
			  .join("");
		}
		
		this.shadowRoot.querySelectorAll(".control-row").forEach((row, index) => {
			const item = this.items()[Number(row.dataset.index)];
			this.updateRow(row, item, index);
		});
	}

	renderDivider(item, index) {
		const title = item?.title ?? "";
		const hasLine = item?.line ?? !title;
	
		return `
			<div class="control-divider ${hasLine ? "has-line" : ""}" data-index="${index}">
				${title ? `<div class="control-divider-title">${this.escapeHtml(title)}</div>` : ""}
			</div>
		`;
	}
}


class AuriAgerControlCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = AuriAgerControlCard.getStubConfig();
    this._detailIndex = null;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((el) => {
      el.hass = hass;
    });
    this.shadowRoot.querySelectorAll("ha-icon-picker").forEach((el) => {
      el.hass = hass;
    });
  }

  setConfig(config) {
    this._config = {
      ...AuriAgerControlCard.getStubConfig(),
      ...config,
    };

    this.render();
  }

	bindInput(key) {
		const el = this.shadowRoot.querySelector("#" + key);
		if (!el) return;

		if (el.tagName?.toLowerCase() === "ha-entity-picker" || el.tagName?.toLowerCase() === "ha-icon-picker") {
			el.hass = this._hass;
			el.value = this._config?.[key] ?? "";
			el.addEventListener("value-changed", (ev) => {
				this.configChanged(key, ev.detail.value ?? "");
			});
			return;
		}
	
		el.addEventListener("change", this.onInputChange.bind(this, key));
	}
	
	onInputChange(key, ev) {
		const el = ev.target;
		const value = el.type === "checkbox" ? el.checked : el.value;
		this.configChanged(key, value);
	}
	
	escapeHtml(value) {
		return `${value ?? ""}`
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;");
	}
	
	configChanged(key, value) {
		const config = {
			...this._config,
			[key]: value,
		};
	
		this._config = config;
	
		this.dispatchEvent(
			new CustomEvent("config-changed", {
				detail: { config },
				bubbles: true,
				composed: true,
			})
		);
	}

	dispatchConfig(config) {
		this._config = config;
	
		this.dispatchEvent(
			new CustomEvent("config-changed", {
				detail: { config },
				bubbles: true,
				composed: true,
			})
		);
	}

	singleItemFromConfig() {
		const c = this._config ?? {};
		const item = {};
	
		[
			"title",
			"subtitle",
			"entity",
			"status_entity",
			"mode_entity",
			"mode",
			"show_control",
			"mode_icon",
			"icon",
			"icon_on",
			"icon_off",
			"accent_icon",
			"accent_color",
			"status_on",
			"status_off",
		].forEach((key) => {
			if (c[key] !== undefined && c[key] !== "") item[key] = c[key];
		});
	
		return item;
	}

	editorMode() {
		return Array.isArray(this._config?.items) ? "multi" : "single";
	}

	setEditorMode(mode) {
		const config = { ...this._config };
		this._detailIndex = null;
	
		if (mode === "multi") {
			config.items = Array.isArray(config.items) && config.items.length
				? config.items
				: [this.singleItemFromConfig()];
		} else {
			delete config.items;
		}
	
		this.dispatchConfig(config);
		this.render();
	}

	itemValue(index, key, value) {
		const items = [...(this._config.items ?? [])];
		const item = { ...(items[index] ?? {}) };
	
		if (key === "show_control" || key === "line") {
			item[key] = value;
		} else if (value === "") {
			delete item[key];
		} else {
			item[key] = value;
		}
	
		items[index] = item;
		this.dispatchConfig({ ...this._config, items });
	}

	addItem(type = "control") {
		const items = [...(this._config.items ?? [])];
	
		items.push(
			type === "divider"
				? { type: "divider", title: "", line: true }
				: {
					title: "Schalter",
					entity: "",
					mode: "action",
					show_control: true,
				}
		);
	
		this.dispatchConfig({ ...this._config, items });
		this.render();
	}

	removeItem(index) {
		const items = [...(this._config.items ?? [])];
		items.splice(index, 1);
		this.dispatchConfig({ ...this._config, items });
		this._detailIndex = null;
		this.render();
	}

	moveItem(from, to) {
		if (from === to || from < 0 || to < 0) return;
	
		const items = [...(this._config.items ?? [])];
		const [moved] = items.splice(from, 1);
		items.splice(to, 0, moved);
		this.dispatchConfig({ ...this._config, items });
		this.render();
	}

	editorStyles() {
		return `
			.editor {
				display: grid;
				gap: 14px;
				padding: 16px;
				font-family: var(--ha-font-family-body, system-ui);
			}
	
			.editor-card {
				display: grid;
				gap: 12px;
				padding: 12px;
				border: 1px solid rgba(120,120,120,.20);
				border-radius: 14px;
			}
	
			.section-title {
				font-size: 13px;
				font-weight: 700;
				opacity: .72;
			}
	
			label {
				display: grid;
				gap: 6px;
				font-size: 12px;
				opacity: .86;
			}
	
			select,
			input[type="text"],
			input[type="number"],
			input[type="color"] {
				box-sizing: border-box;
				width: 100%;
			}
	
			select,
			input[type="text"],
			input[type="number"] {
				padding: 9px 10px;
				border-radius: 10px;
				border: 1px solid rgba(120,120,120,.35);
				background: var(--card-background-color, #fff);
				color: var(--primary-text-color, #202426);
				font: inherit;
			}
	
			input[type="color"] {
				height: 42px;
				padding: 4px;
				border-radius: 10px;
				border: 1px solid rgba(120,120,120,.35);
				background: var(--card-background-color, #fff);
			}
	
			.checkbox-row {
				display: flex;
				align-items: center;
				gap: 10px;
				font-size: 13px;
			}
	
			.checkbox-row input {
				width: auto;
			}

			.mode-row {
				display: grid;
				grid-template-columns: minmax(0, 1fr);
				gap: 8px;
			}

			.item-card {
				display: grid;
				gap: 10px;
				padding: 10px;
				border-radius: 12px;
				background: rgba(120,120,120,.08);
			}

			.list-row {
				display: grid;
				grid-template-columns: auto minmax(0, 1fr) auto;
				gap: 10px;
				align-items: center;
				padding: 9px 10px;
				border-radius: 12px;
				background: rgba(120,120,120,.08);
				margin-bottom: 8px;
			}

			.drag-handle {
				cursor: grab;
				opacity: .62;
				font-weight: 800;
			}

			.row-main {
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				text-align: left;
			}

			.item-head {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
			}

			.item-title {
				font-size: 12px;
				font-weight: 700;
				opacity: .72;
			}

			.item-actions {
				display: flex;
				gap: 8px;
			}

			button {
				border: 1px solid rgba(120,120,120,.35);
				border-radius: 10px;
				background: var(--card-background-color, #fff);
				color: var(--primary-text-color, #202426);
				padding: 7px 10px;
				font: inherit;
				cursor: pointer;
			}

			.add-row {
				display: flex;
				gap: 8px;
				flex-wrap: wrap;
			}
		`;
	}
	
	render() {
		const c = this._config ?? {};
		const mode = this.editorMode();
	
		this.shadowRoot.innerHTML = `
			<style>
				${this.editorStyles()}
			</style>
	
			<div class="editor">
				<div class="editor-card">
					<div class="section-title">Darstellung</div>
	
					${this.renderInput("title", "Titel", c.title)}
					${this.renderInput("subtitle", "Untertitel", c.subtitle)}
					${this.renderInput("icon", "Icon", c.icon)}
					${this.renderInput("accent_icon", "Akzent-Icon", c.accent_icon)}
					${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
	
					${this.renderSelect("layout", "Layout", c.layout, [
						["normal", "Normal"],
						["small", "Small"],
						["tiny", "Tiny"],
						["large", "Large"],
					])}
	
					${this.renderSelect("theme", "Theme", c.theme, [
						["auto", "Automatisch"],
						["light", "Hell"],
						["dark", "Dunkel"],
					])}
				</div>
	
				<div class="editor-card">
					<div class="section-title">Editor-Modus</div>
	
					<label class="mode-row">
						<span>Entitäten</span>
						<select id="editor-mode">
							<option value="single" ${mode === "single" ? "selected" : ""}>Eine Entität</option>
							<option value="multi" ${mode === "multi" ? "selected" : ""}>Mehrere Entitäten</option>
						</select>
					</label>
				</div>

				<div class="editor-card">
					<div class="section-title">Entitäten</div>
	
					${mode === "single" ? `
						${this.renderEntityInput("entity", "Haupt-Entity", c.entity)}
						${this.renderEntityInput("status_entity", "Status-Entity", c.status_entity)}
						${this.renderEntityInput("mode_entity", "Mode-Entity", c.mode_entity)}
					` : this.renderItems(c.items ?? [])}
				</div>
	
				<div class="editor-card" style="${mode === "multi" ? "display:none" : ""}">
					<div class="section-title">Verhalten</div>
	
					${this.renderSelect("mode", "Modus", c.mode, [
						["action", "Action"],
						["switch", "Switch"],
						["boolean", "Boolean"],
						["cover", "Cover"],
						["select", "Select"],
						["number", "Number"],
					])}
	
					${this.renderCheckbox("show_control", "Control anzeigen", c.show_control !== false)}
					${this.renderInput("mode_icon", "Mode-Icon", c.mode_icon)}
					${this.renderInput("icon_on", "Icon aktiv", c.icon_on)}
					${this.renderInput("icon_off", "Icon inaktiv", c.icon_off)}
				</div>
	
				<div class="editor-card">
					<div class="section-title">Status-Texte</div>
	
					${this.renderInput("status_on", "Text aktiv", c.status_on)}
					${this.renderInput("status_off", "Text inaktiv", c.status_off)}
				</div>
			</div>
		`;

		this.shadowRoot.querySelector("#editor-mode")?.addEventListener("change", (ev) => {
			this.setEditorMode(ev.target.value);
		});
	
		[
			"title",
			"subtitle",
			"icon",
			"accent_icon",
			"accent_color",
			"layout",
			"theme",
			"entity",
			"status_entity",
			"mode_entity",
			"mode",
			"show_control",
			"mode_icon",
			"icon_on",
			"icon_off",
			"status_on",
			"status_off",
		].forEach((key) => this.bindInput(key));

		this.bindItems();
	}

	renderItems(items = []) {
		if (this._detailIndex !== null && items[this._detailIndex]) {
			const item = items[this._detailIndex];
			return item?.type === "divider"
				? this.renderDividerEditor(item, this._detailIndex)
				: this.renderControlItemEditor(item, this._detailIndex);
		}

		return `
			<div class="items-editor">
				${items
					.map((item, index) => `
						<div class="list-row" draggable="true" data-index="${index}">
							<span class="drag-handle">☰</span>
							<button type="button" class="row-main" data-open-item="${index}">
								${this.escapeHtml(item?.type === "divider" ? "Trenner" : (item?.entity || item?.title || `Eintrag ${index + 1}`))}
							</button>
							<button type="button" data-remove-item="${index}">Entfernen</button>
						</div>
					`)
					.join("")}
				<div class="add-row">
					<button type="button" data-add-item="control">Entität hinzufügen</button>
					<button type="button" data-add-item="divider">Trenner hinzufügen</button>
				</div>
			</div>
		`;
	}

	renderControlItemEditor(item, index) {
		return `
			<div class="item-card" data-item="${index}">
				<div class="item-head">
					<div class="item-title">Eintrag ${index + 1}</div>
					<button type="button" data-back-item>Zurück</button>
				</div>
				${this.renderItemInput(index, "title", "Titel", item.title)}
				${this.renderItemInput(index, "subtitle", "Untertitel", item.subtitle)}
				${this.renderItemEntity(index, "entity", "Haupt-Entity", item.entity)}
				${this.renderItemEntity(index, "status_entity", "Status-Entity", item.status_entity)}
				${this.renderItemEntity(index, "mode_entity", "Mode-Entity", item.mode_entity)}
				${this.renderItemSelect(index, "mode", "Modus", item.mode, [
					["action", "Action"],
					["switch", "Switch"],
					["boolean", "Boolean"],
					["cover", "Cover"],
					["select", "Select"],
					["number", "Number"],
				])}
				${this.renderItemCheckbox(index, "show_control", "Control anzeigen", item.show_control !== false)}
				${this.renderItemInput(index, "icon", "Icon", item.icon)}
				${this.renderItemInput(index, "accent_icon", "Akzent-Icon", item.accent_icon)}
				${this.renderItemInput(index, "accent_color", "Akzentfarbe", item.accent_color, "color")}
				${this.renderItemInput(index, "mode_icon", "Mode-Icon", item.mode_icon)}
				${this.renderItemInput(index, "icon_on", "Icon aktiv", item.icon_on)}
				${this.renderItemInput(index, "icon_off", "Icon inaktiv", item.icon_off)}
				${this.renderItemInput(index, "status_on", "Text aktiv", item.status_on)}
				${this.renderItemInput(index, "status_off", "Text inaktiv", item.status_off)}
			</div>
		`;
	}

	renderDividerEditor(item, index) {
		return `
			<div class="item-card" data-item="${index}">
				<div class="item-head">
					<div class="item-title">Trenner ${index + 1}</div>
					<button type="button" data-back-item>Zurück</button>
				</div>
				${this.renderItemInput(index, "title", "Titel", item.title)}
				${this.renderItemCheckbox(index, "line", "Linie anzeigen", item.line !== false)}
			</div>
		`;
	}

	bindItems() {
		let dragIndex = null;

		this.shadowRoot.querySelectorAll("[data-item-key]").forEach((el) => {
			const handler = (ev) => {
				const index = Number(ev.target.dataset.itemIndex);
				const key = ev.target.dataset.itemKey;
				let value = ev.target.type === "checkbox"
					? ev.target.checked
					: ev.detail?.value ?? ev.target.value;
				this.itemValue(index, key, value);
			};

			if (el.tagName?.toLowerCase() === "ha-entity-picker" || el.tagName?.toLowerCase() === "ha-icon-picker") {
				el.hass = this._hass;
				el.value = el.dataset.value ?? "";
				el.addEventListener("value-changed", handler);
			} else {
				el.addEventListener("change", handler);
			}
		});

		this.shadowRoot.querySelector("[data-back-item]")?.addEventListener("click", () => {
			this._detailIndex = null;
			this.render();
		});

		this.shadowRoot.querySelectorAll("[data-open-item]").forEach((button) => {
			button.addEventListener("click", () => {
				this._detailIndex = Number(button.dataset.openItem);
				this.render();
			});
		});

		this.shadowRoot.querySelectorAll("[data-remove-item]").forEach((button) => {
			button.addEventListener("click", () => {
				this.removeItem(Number(button.dataset.removeItem));
			});
		});

		this.shadowRoot.querySelectorAll("[data-add-item]").forEach((button) => {
			button.addEventListener("click", () => {
				this.addItem(button.dataset.addItem);
			});
		});

		this.shadowRoot.querySelectorAll(".list-row[draggable]").forEach((row) => {
			row.addEventListener("dragstart", () => {
				dragIndex = Number(row.dataset.index);
			});
			row.addEventListener("dragover", (ev) => ev.preventDefault());
			row.addEventListener("drop", (ev) => {
				ev.preventDefault();
				this.moveItem(dragIndex, Number(row.dataset.index));
			});
		});
	}

	renderSelect(key, label, value, options = []) {
		return `
			<label>
				<span>${label}</span>
				<select id="${key}">
					${options
						.map(([v, text]) => `
							<option value="${this.escapeHtml(v)}" ${value === v ? "selected" : ""}>
								${this.escapeHtml(text)}
							</option>
						`)
						.join("")}
				</select>
			</label>
		`;
	}
	
	renderCheckbox(key, label, checked = false) {
		return `
			<label class="checkbox-row">
				<input type="checkbox" id="${key}" ${checked ? "checked" : ""}>
				<span>${label}</span>
			</label>
		`;
	}
	
	renderInput(key, label, value = "", type = "text") {
		if (type === "text" && this.isIconKey(key)) {
			return `
				<label>
					<span>${label}</span>
					<ha-icon-picker
						id="${key}"
						data-value="${this.escapeHtml(value ?? "")}">
					</ha-icon-picker>
				</label>
			`;
		}

		return `
			<label>
				<span>${label}</span>
				<input type="${type}" id="${key}" value="${this.escapeHtml(value ?? "")}">
			</label>
		`;
	}

	isIconKey(key) {
		return /(^|_)(icon|icon_on|icon_off)$/.test(key) || key.endsWith("_icon");
	}

	renderEntityInput(key, label, value = "") {
		return `
			<label>
				<span>${label}</span>
				<ha-entity-picker
					id="${key}"
					data-value="${this.escapeHtml(value ?? "")}"
					allow-custom-entity>
				</ha-entity-picker>
			</label>
		`;
	}

	renderItemInput(index, key, label, value = "", type = "text") {
		if (type === "text" && this.isIconKey(key)) {
			return `
				<label>
					<span>${label}</span>
					<ha-icon-picker
						data-item-index="${index}"
						data-item-key="${key}"
						data-value="${this.escapeHtml(value ?? "")}">
					</ha-icon-picker>
				</label>
			`;
		}

		return `
			<label>
				<span>${label}</span>
				<input
					type="${type}"
					data-item-index="${index}"
					data-item-key="${key}"
					value="${this.escapeHtml(value ?? "")}">
			</label>
		`;
	}

	renderItemEntity(index, key, label, value = "") {
		return `
			<label>
				<span>${label}</span>
				<ha-entity-picker
					data-item-index="${index}"
					data-item-key="${key}"
					data-value="${this.escapeHtml(value ?? "")}"
					allow-custom-entity>
				</ha-entity-picker>
			</label>
		`;
	}

	renderItemSelect(index, key, label, value, options = []) {
		return `
			<label>
				<span>${label}</span>
				<select data-item-index="${index}" data-item-key="${key}">
					${options
						.map(([v, text]) => `
							<option value="${this.escapeHtml(v)}" ${value === v ? "selected" : ""}>
								${this.escapeHtml(text)}
							</option>
						`)
						.join("")}
				</select>
			</label>
		`;
	}

	renderItemCheckbox(index, key, label, checked = false) {
		return `
			<label class="checkbox-row">
				<input
					type="checkbox"
					data-item-index="${index}"
					data-item-key="${key}"
					${checked ? "checked" : ""}>
				<span>${label}</span>
			</label>
		`;
	}

}

customElements.define(
  "auri-ager-control-card-editor",
  AuriAgerControlCardEditor
);

customElements.define(
  "auri-ager-control-card",
  AuriAgerControlCard
);

window.customCards = window.customCards || [];

window.customCards.push({
  type: "auri-ager-control-card",
  name: "Auri Ager Control",
  description: "Control shutters and switches",
  preview: true,
});
/*
 * Auri Ager Three Phase Card
 *
 */

class AuriAgerThreePhaseCard extends AuriAgerBaseCard {
  static getConfigElement() {
    return document.createElement("auri-ager-three-phase-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:auri-ager-three-phase-card",
      title: "Phase Analytics",
      short_title: "",
      subtitle: "Strom · Spannung · Leistung",
      icon: "mdi:power",
      theme: "auto",
      layout: "normal",
      precise: true,
      phases: [
        {
          name: "L1",
          power: "sensor.meter_active_power_l1",
          voltage: "sensor.meter_l1_voltage",
          current: "sensor.meter_l1_current",
        },
        {
          name: "L2",
          power: "sensor.meter_active_power_l2",
          voltage: "sensor.meter_l2_voltage",
          current: "sensor.meter_l2_current",
        },
        {
          name: "L3",
          power: "sensor.meter_active_power_l3",
          voltage: "sensor.meter_l3_voltage",
          current: "sensor.meter_l3_current",
        },
      ],
      totals: {
        active_power: "sensor.active_power",
        apparent_power: "sensor.meter_apparent_power_total",
        reactive_power: "sensor.reactive_power_total",
        neutral_current: "sensor.in_meter",
        current: "sensor.betriebsstrom_anschluss",
        cosphi: "sensor.cosphi",
        frequency: "sensor.meter_frequency",
      },
    };
  }

  getCardSize() {
    return 5;
  }

  _state(entity) {
    if (!entity || !this._hass?.states?.[entity]) return null;
    return this._hass.states[entity];
  }

  _num(entity) {
    const s = this._state(entity);
    const n = Number(s?.state);
    return Number.isFinite(n) ? n : null;
  }

  _unit(entity, fallback = "") {
    return this._state(entity)?.attributes?.unit_of_measurement ?? fallback;
  }

  _fmt(entity, fallbackUnit = "", digits = 1) {
    const n = this._num(entity);
    if (n === null) return "–";

    const unit = this._unit(entity, fallbackUnit);

    return `${n.toLocaleString("de-DE", {
      maximumFractionDigits: digits,
    })}${unit ? ` ${unit}` : ""}`;
  }

  _fmtPower(entity) {
    const n = this._num(entity);
    if (n === null) return "–";

    const precise = this.config?.precise ?? true;

    if (precise) {
      return `${n.toLocaleString("de-DE", {
        maximumFractionDigits: 0,
      })} W`;
    }

    if (Math.abs(n) >= 1000) {
      return `${(n / 1000).toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} kW`;
    }

    return `${n.toLocaleString("de-DE", {
      maximumFractionDigits: 0,
    })} W`;
  }

	_fmtFixed(entity, fallbackUnit = "", digits = 2) {
		const n = this._num(entity);
		if (n === null) return "–";
	
    const unit = this._unit(entity, fallbackUnit);

		return `${n.toLocaleString("de-DE", {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits,
		})}${unit ? ` ${unit}` : ""}`;
	}

  stateSnapshot() {
    const phases = this.config?.phases ?? [];
    const totals = this.config?.totals ?? {};

    const ids = [
      ...phases.flatMap((p) => [p.power, p.voltage, p.current]),
      totals.active_power,
      totals.apparent_power,
      totals.reactive_power,
      totals.neutral_current,
      totals.current,
      totals.cosphi,
      totals.frequency,
    ].filter(Boolean);

    return ids
      .map((id) => `${id}:${this._hass?.states?.[id]?.state ?? ""}`)
      .join("|");
  }

	_setEntityTarget(selector, entity) {
		const el = this.shadowRoot?.querySelector(selector);
		if (!el) return;
	
		if (entity && this._hass?.states?.[entity]) {
			el.dataset.entity = entity;
			el.classList.add("clickable-entity");
		} else {
			delete el.dataset.entity;
			el.classList.remove("clickable-entity");
		}
	}
	
	_openMoreInfo(entityId) {
		if (!entityId || !this._hass?.states?.[entityId]) return;
	
		this.dispatchEvent(
			new CustomEvent("hass-more-info", {
				bubbles: true,
				composed: true,
				detail: { entityId },
			})
		);
	}

  buildStaticDom() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    const C = this.colors();
    const accent = this.accentColor();

    this.shadowRoot.innerHTML = `
      <style>
        ${this.baseStyles(accent)}

        .header {
          grid-template-columns: 8px 1fr auto;
        }

        .header-icon {
          color: ${C.icon};
          --mdc-icon-size: 36px;
        }

        .three-phase-body {
          position: relative;
          min-height: 520px;
          margin-top: 12px;
        }

				/* Replace .phase-y */
				.phase-y {
					position: absolute;
					left: 50%;
					top: 118px;
					width: 310px;
					height: 250px;
					transform: translateX(-50%);
					pointer-events: none;
					z-index: 0;
				}
				
				/* Keep 150px phase cards */
				.phase-card {
					position: absolute;
					z-index: 1;
					width: 150px;
					min-height: 60px;
					background: ${C.subBg};
					border-radius: 18px;
					padding: 10px;
					text-align: center;
				}
				
				/* Labels passend zu den Linienenden */
				.phase-label.l1 {
					left: 50%;
					top: 131px;
					transform: translate(-50%, -100%);
				}
				
				.phase-label.l2 {
					left: calc(50% + 97px);
					top: 286px;
					transform: translate(-50%, -50%);
				}
				
				.phase-label.l3 {
					left: calc(50% - 97px);
					top: 286px;
					transform: translate(-50%, -50%);
				}

        .phase-y svg {
          width: 100%;
          height: 100%;
          opacity: .36;
        }

        .phase-line {
          fill: none;
          stroke: ${accent};
          stroke-width: 8;
          stroke-linecap: round;
        }

        .phase-center {
          fill: ${C.cardBg};
          stroke: ${accent};
          stroke-width: 6;
        }

        .phase-label {
          position: absolute;
          z-index: 3;
          background: ${C.cardBg};
          color: ${C.value};
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 13px;
          font-weight: 850;
          line-height: 1;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
        }



        .phase-card.l1 {
          left: 50%;
          top: 12px;
          transform: translateX(-50%);
        }

        .phase-card.l2 {
          right: 0;
          top: 305px;
        }

        .phase-card.l3 {
          left: 0;
          top: 305px;
        }

        .phase-main {
          font-size: 21px;
          font-weight: 840;
          color: ${C.value};
          line-height: 1.05;
          margin-bottom: 9px;
        }

        .phase-sub {
          font-size: 14px;
          color: ${C.small};
          line-height: 1.45;
        }

				/* Detail-Row nicht mehr als gemeinsame Grid-Zeile */
				.detail-row {
					position: absolute;
					left: 0;
					right: 0;
					top: 0;
					z-index: 1;
					display: block;
				}

        .detail-card {
          background: ${C.subBg};
          border-radius: 18px;
          padding: 10px;
          min-height: 120px;
        }

				/* Sternpunkt links neben den Sternpunkt, leicht oberhalb Zentrum */
				.detail-card.starpoint {
					position: absolute;
					left: 10px;
					top: 125px;
					width: 160px;
					min-height: 90px;
				}
				
				/* Gesamt unter L2/L3, zentriert und breiter */
				.detail-card.total {
					position: absolute;
					left: 50%;
					top: 410px;
					width: 75%;
					min-height: 82px;
					transform: translateX(-50%);
				}
				
				.detail-card.starpoint {
					background: rgba(122, 167, 217, 0.10);
				}

				.detail-card.total {
					background: rgba(105, 105, 105, 0.10);
				}

        .detail-title {
          font-size: 15px;
          font-weight: 850;
          color: ${C.value};
          margin-bottom: 9px;
        }

        .detail-main {
          font-size: 23px;
          font-weight: 840;
          color: ${C.value};
          line-height: 1.05;
          margin-bottom: 9px;
        }

        .detail-line {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          font-size: 13px;
          color: ${C.small};
          line-height: 1.45;
          padding: 2px 0;
        }

        .detail-line span:last-child {
          color: ${C.label};
          text-align: right;
          white-space: nowrap;
        }

				.total .total-head {
					display: grid;
					grid-template-columns: auto 1fr;
					align-items: baseline;
					gap: 14px;
					margin-bottom: 10px;
				}
				
				.total .detail-title {
					margin-bottom: 0;
				}
				
				.total .detail-main {
					font-size: 23px;
					margin-bottom: 0;
					text-align: right;
				}
      </style>

      <ha-card>
        <div class="header">
          <div class="accent"></div>
          <div>
            <div class="title"></div>
            <div class="subtitle"></div>
          </div>
          <ha-icon class="header-icon"></ha-icon>
        </div>

        <div class="three-phase-body">
          <div class="phase-y">
						<svg viewBox="0 0 310 250" aria-hidden="true">
							<path class="phase-line" d="M155 112 L155 10" />
							<path class="phase-line" d="M155 112 L58 168" />
							<path class="phase-line" d="M155 112 L252 168" />
							<circle class="phase-center" cx="155" cy="112" r="17" />
						</svg>
          </div>

          <div class="phase-label l1">L1</div>
          <div class="phase-label l2">L2</div>
          <div class="phase-label l3">L3</div>

          <div class="phase-card l1">
            <div class="phase-main" data-l1-power>–</div>
            <div class="phase-sub">
              <div data-l1-voltage-row>Spannung: <span data-l1-voltage>–</span></div>
              <div data-l1-current-row>Strom: <span data-l1-current>–</span></div>
            </div>
          </div>

          <div class="phase-card l2">
            <div class="phase-main" data-l2-power>–</div>
            <div class="phase-sub">
              <div data-l2-voltage-row>Spannung: <span data-l2-voltage>–</span></div>
              <div data-l2-current-row>Strom: <span data-l2-current>–</span></div>
            </div>
          </div>

          <div class="phase-card l3">
            <div class="phase-main" data-l3-power>–</div>
            <div class="phase-sub">
              <div data-l3-voltage-row>Spannung: <span data-l3-voltage>–</span></div>
              <div data-l3-current-row>Strom: <span data-l3-current>–</span></div>
            </div>
          </div>

          <div class="detail-row">
            <div class="detail-card starpoint">
              <div class="detail-title">Sternpunkt</div>
              <div class="detail-line" data-neutral-current-row>
                <span>Neutralleiter</span>
                <span data-neutral-current>–</span>
              </div>
              <div class="detail-line" data-cosphi-row>
                <span>cos φ</span>
                <span data-cosphi>–</span>
              </div>
              <div class="detail-line" data-frequency-row>
                <span>Frequenz</span>
                <span data-frequency>–</span>
              </div>
            </div>

						<div class="detail-card total">
							<div class="total-head">
								<div class="detail-title">Gesamt</div>
								<div class="detail-main" data-total-power>–</div>
							</div>
						
							<div class="detail-line" data-total-apparent-row>
								<span>Scheinleistung</span>
								<span data-total-apparent>–</span>
							</div>
							<div class="detail-line" data-total-reactive-row>
								<span>Blindleistung</span>
								<span data-total-reactive>–</span>
							</div>
							<div class="detail-line" data-total-current-row>
								<span>Gesamtstrom</span>
								<span data-total-current>–</span>
							</div>
						</div>
          </div>
        </div>
      </ha-card>
    `;

		this.shadowRoot.addEventListener("click", (ev) => {
			const target = ev.target.closest("[data-entity]");
			if (!target) return;
		
			ev.stopPropagation();
			this._openMoreInfo(target.dataset.entity);
		});
  }

  updateDynamicDom() {
    const title = this.config?.title ?? "Phase Analytics";
    const subtitle = this.config?.subtitle ?? "";
    const icon = this.config?.icon ?? "mdi:power";
    const phases = this.config?.phases ?? [];
    const totals = this.config?.totals ?? {};

    this.setText(".title", title);
    this.setText(".subtitle", subtitle);

    const iconEl = this.shadowRoot?.querySelector(".header-icon");
    if (iconEl) iconEl.setAttribute("icon", icon);

    const setEntityText = (textSelector, rowSelector, entity, formatter) => {
      const has = !!entity && !!this._hass?.states?.[entity];
      this.setVisible(rowSelector, has);
      if (has) this.setText(textSelector, formatter(entity));
    };

    const p1 = phases[0] ?? {};
    const p2 = phases[1] ?? {};
    const p3 = phases[2] ?? {};

    this.setText("[data-l1-power]", this._fmtPower(p1.power));
    setEntityText("[data-l1-voltage]", "[data-l1-voltage-row]", p1.voltage, (e) => this._fmt(e, "V", 1));
    setEntityText("[data-l1-current]", "[data-l1-current-row]", p1.current, (e) => this._fmt(e, "A", 1));

    this.setText("[data-l2-power]", this._fmtPower(p2.power));
    setEntityText("[data-l2-voltage]", "[data-l2-voltage-row]", p2.voltage, (e) => this._fmt(e, "V", 1));
    setEntityText("[data-l2-current]", "[data-l2-current-row]", p2.current, (e) => this._fmt(e, "A", 1));

    this.setText("[data-l3-power]", this._fmtPower(p3.power));
    setEntityText("[data-l3-voltage]", "[data-l3-voltage-row]", p3.voltage, (e) => this._fmt(e, "V", 1));
    setEntityText("[data-l3-current]", "[data-l3-current-row]", p3.current, (e) => this._fmt(e, "A", 1));

    this.setText("[data-total-power]", this._fmtPower(totals.active_power));
    setEntityText("[data-total-apparent]", "[data-total-apparent-row]", totals.apparent_power, (e) => this._fmt(e, "VA", 0));
    setEntityText("[data-total-reactive]", "[data-total-reactive-row]", totals.reactive_power, (e) => this._fmt(e, "var", 0));
    setEntityText("[data-total-current]", "[data-total-current-row]", totals.current, (e) => this._fmt(e, "A", 1));

    setEntityText("[data-neutral-current]", "[data-neutral-current-row]", totals.neutral_current, (e) => this._fmt(e, "A", 1));
    setEntityText("[data-cosphi]", "[data-cosphi-row]", totals.cosphi, (e) => this._fmtFixed(e, "", 2));
    setEntityText("[data-frequency]", "[data-frequency-row]", totals.frequency, (e) => this._fmtFixed(e, "Hz", 2));

		this._setEntityTarget(".phase-card.l1", p1.power);
		this._setEntityTarget("[data-l1-voltage-row]", p1.voltage);
		this._setEntityTarget("[data-l1-current-row]", p1.current);
		
		this._setEntityTarget(".phase-card.l2", p2.power);
		this._setEntityTarget("[data-l2-voltage-row]", p2.voltage);
		this._setEntityTarget("[data-l2-current-row]", p2.current);
		
		this._setEntityTarget(".phase-card.l3", p3.power);
		this._setEntityTarget("[data-l3-voltage-row]", p3.voltage);
		this._setEntityTarget("[data-l3-current-row]", p3.current);
		
		this._setEntityTarget(".total .total-head", totals.active_power);
		this._setEntityTarget("[data-total-apparent-row]", totals.apparent_power);
		this._setEntityTarget("[data-total-reactive-row]", totals.reactive_power);
		this._setEntityTarget("[data-total-current-row]", totals.current);
		
		this._setEntityTarget("[data-neutral-current-row]", totals.neutral_current);
		this._setEntityTarget("[data-cosphi-row]", totals.cosphi);
		this._setEntityTarget("[data-frequency-row]", totals.frequency);
  }
}

customElements.define("auri-ager-three-phase-card", AuriAgerThreePhaseCard);

class AuriAgerThreePhaseCardEditor extends AuriAgerEditorBase {
  static cardClass = AuriAgerThreePhaseCard;

  renderPhase(index, fallbackName) {
    const phase = this._config?.phases?.[index] ?? {};

    return `
      <div class="editor-card">
        <div class="section-title">${fallbackName}</div>
        ${this.renderInput(`phases.${index}.name`, "Name", phase.name ?? fallbackName)}
        ${this.renderEntityPicker(`phases.${index}.power`, "Leistung", phase.power)}
        ${this.renderEntityPicker(`phases.${index}.voltage`, "Spannung", phase.voltage)}
        ${this.renderEntityPicker(`phases.${index}.current`, "Strom", phase.current)}
      </div>
    `;
  }

  render() {
    const c = this._config ?? {};

    this.shadowRoot.innerHTML = `
      <style>${this.editorStyles()}</style>
      <div class="editor">
        <div class="editor-card">
          <div class="section-title">Darstellung</div>
          ${this.renderInput("title", "Titel", c.title)}
          ${this.renderInput("short_title", "Kurztitel", c.short_title)}
          ${this.renderInput("subtitle", "Untertitel", c.subtitle)}
          ${this.renderInput("icon", "Icon", c.icon)}
          ${this.renderInput("accent_color", "Akzentfarbe", c.accent_color, "color")}
          ${this.renderCheckbox("precise", "Leistung exakt in W anzeigen", c.precise !== false)}
          ${this.renderSelect("layout", "Layout", c.layout, [
            ["normal", "Normal"],
          ])}
          ${this.renderSelect("theme", "Theme", c.theme, [
            ["auto", "Automatisch"],
            ["light", "Hell"],
            ["dark", "Dunkel"],
          ])}
        </div>

        ${this.renderPhase(0, "L1")}
        ${this.renderPhase(1, "L2")}
        ${this.renderPhase(2, "L3")}

        <div class="editor-card">
          <div class="section-title">Gesamt</div>
          ${this.renderEntityPicker("totals.active_power", "Wirkleistung", c.totals?.active_power)}
          ${this.renderEntityPicker("totals.apparent_power", "Scheinleistung", c.totals?.apparent_power)}
          ${this.renderEntityPicker("totals.reactive_power", "Blindleistung", c.totals?.reactive_power)}
          ${this.renderEntityPicker("totals.current", "Gesamtstrom", c.totals?.current)}
        </div>

        <div class="editor-card">
          <div class="section-title">Sternpunkt</div>
          ${this.renderEntityPicker("totals.neutral_current", "Neutralleiter", c.totals?.neutral_current)}
          ${this.renderEntityPicker("totals.cosphi", "cos φ", c.totals?.cosphi)}
          ${this.renderEntityPicker("totals.frequency", "Frequenz", c.totals?.frequency)}
        </div>
      </div>
    `;

    this.bindBasicControls();
  }
}

customElements.define("auri-ager-three-phase-card-editor", AuriAgerThreePhaseCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "auri-ager-three-phase-card",
  name: "Auri Ager Three Phase",
  description: "Display Current, Voltage and Power for AC",
  preview: true,
});
