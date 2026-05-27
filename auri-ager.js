/*
 * Auri Ager Framework
 * Bundled Home Assistant custom cards: Flow, Summary, Finance, Gauge and Sun.
 *
 * Copyright (c) 2026 Stefanie Ramroth
 * Licensed under the Apache License, Version 2.0
 *
 * Assembled by 00Auri ✨
 * Source modules included below without minification for easier debugging.
 */


/* ==========================================================================
 * Auri Ager Flow
 * Source: auri-ager-flow-card(19).js
 * ========================================================================== */

/*
 * Auri Ager Flow
 * Calm energy flow visualization for Home Assistant
 *
 * Copyright (c) 2026 Stefanie Ramroth
 *
 * Licensed under the Apache License, Version 2.0
 * You may obtain a copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * ----------------------------------------------------------------------------
 * Version: 0.2
 * Status : HACS Initial Release
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
 * Planned:
 * - Localization / configurable labels
 *
 * Design philosophy:
 * Motion indicates flow.
 * Values indicate magnitude.
 * Calmness is a feature.
 * ----------------------------------------------------------------------------
 */
class AuriAgerFlowCard extends HTMLElement {
	static getConfigElement() {
		return document.createElement("auri-ager-flow-card-editor");
	}
	
	static getStubConfig() {
		return {
			type: "custom:auri-ager-flow-card",
			theme: "auto",
			external: {
				mode: "parallel_pv",
				label: "Externe Quelle",
			},
			entities: {},
		};
	}

  static COLOR_SCHEMES = {
  	light: {
			cardBg: "#ffffff",
			cardBorder: "rgba(0,0,0,.06)",

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
      autarky: { x: 300, y: 315, r: 78 },
      selfConsumption: { x: 140, y: 315, r: 40 },
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
			wallboxBehindHome: "M355 535 H300",
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
			wallboxBehindHome: "M405 535 H350",
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
    const entities = this.config?.entities ?? {};
    return this.hasEntity(entities.heatpump) ? "full" : "simple";
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

		const available = {
		  external: this.hasEntity(entities.external),
		  wallbox: this.hasEntity(entities.wallbox),
		  heatpump: this.hasEntity(entities.heatpump),
		  home: this.hasEntity(entities.heatpump),
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

		/*
    const homeBase = available.heatpump
      ? Math.max(0, homeRaw + externalCorrection - wallbox - heatpump)
      : Math.max(0, homeRaw + externalCorrection - wallbox);

    const consumption = available.heatpump
      ? Math.max(0, homeBase + heatpump)
      : Math.max(0, homeBase);
		*/

		const gridImport = Math.max(0, -grid);
		const gridExport = Math.max(0, grid);
		
		const producedPower =
			solar +
			(externalMode !== "behind_home"
				? externalDisplay
				: 0);
		
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
		
		/*
		const selfConsumption =
			solar > 0
				? Math.max(
						0,
						Math.min(
							100,
							(selfConsumedPower / solar) * 100
						)
					)
				: 0;
		*/

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
        <svg viewBox="${layout.viewBox}">
          <defs>
            ${this.arrowDef("flow-arrow")}
          </defs>

          <g id="dashboard-header" transform="translate(8 8)">
						<rect class="header-accent" x="0" y="0" width="8" height="42" rx="4"/>
						<text id="dashboard-title" x="18" y="16" class="dashboard-title"></text>
						<text id="dashboard-time" x="18" y="36" class="dashboard-time"></text>
					</g>

          ${this.flowSvg("solar", "pv-path", p.pv, 7)}
          ${this.flowSvg("external", "external-path", p.external, 8)}
          ${this.flowSvg("external-to-pv", "external-to-pv-path", p.externalToPv, 8)}
          ${this.flowSvg("grid", "grid-path", p.grid, 8)}
          ${this.flowSvg("battery", "battery-path", p.battery, 8)}
          ${this.flowSvg("wallbox", "wallbox-path", p.wallbox, 9)}
          ${this.flowSvg("wallbox-behind-home", "wallbox-behind-home-path", p.wallboxBehindHome, 9)}
          ${this.flowSvg("consumption", "consumption-path", p.consumption, 9)}
          ${this.flowSvg("heatpump", "heatpump-path", p.heatpump, 9)}
          ${this.flowSvg("home", "home-path", p.home, 9)}

          ${this.staticRingsSvg()}
          ${this.staticNodesSvg()}
        </svg>
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
							y="${n.pv.y + 78}"
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
							y="${n.external.y + 78}"
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
							y="${n.grid.y + 78}"
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
					${this.homeIcon()}
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
    this.setText(
      "#battery-subline",
      `${data.batteryLabel} · ${this.fmtW(data.batteryPower)}`
    );
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
          padding: 2px;
          border-radius: inherit;
          background: transparent;
				  border: none;
          box-shadow: none;
				  overflow: hidden;
        }

          /* background: ${COLORS.cardBg};
					border: 1px solid ${COLORS.cardBorder}; */

				.header-accent {
					fill: ${COLORS.autarky};
				}
				
				.dashboard-title {
					font-size: 18px;
					font-weight: 750;
					fill: ${COLORS.value};
				}
				
				.dashboard-time {
					font-size: 13px;
					fill: ${COLORS.small};
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
});

/* ==========================================================================
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
    };
  }

  icon(name) {
    const icons = {
      production: "mdi:solar-power-variant",
      self: "mdi:home-lightning-bolt",
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

  styles() {
    const C = this.colors();

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
          background: ${C.accent};
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
						gap:4px;
						margin-left:8px;
				}
				
				.dc-label{
						font-size:.62em;
						opacity:.60;
						font-weight:500;
						margin-left:2px;
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
						margin-left:10px;
						margin-right:6px;
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
					${this.fmtKwh(data.production)}
					<span class="dc-production">
						${sunSmall}
						${this.fmtKwh(data.productionDc)}
						<span class="dc-label">DC</span>
					</span>
				`
				: `
					${this.fmtKwh(data.production)}
					<span class="dc-label">AC</span>
				`;
		
		const productionEl =
			this.shadowRoot?.querySelector("#production-value");
		
		if (productionEl) {
			productionEl.innerHTML = productionValue;
		}

    this.setText("#self-consumption-value", this.fmtKwh(data.selfConsumption));
    this.setText("#feed-in-value", this.fmtKwh(data.feedIn));
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
		  <span class="tree-count">
		    ${tree}
		    <span class="tree-value">${treeCount}</span>
		    <span class="tree-label">${treeLabel}</span>
		  </span>
		`;
  }
}

customElements.define("auri-ager-summary-card", AuriAgerSummaryCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "auri-ager-summary-card",
  name: "Auri Ager Summary",
  description: "Calm energy period summary card",
  preview: true,
});

/* ==========================================================================
 * Auri Ager Finance + Gauge
 * Source: auri-ager-finance-card(1).js
 * ========================================================================== */

/*
 * Auri Ager Finance + Gauge Cards
 * Calm finance and percentage visualization cards for Home Assistant
 *
 * Copyright (c) 2026 Stefanie Ramroth
 * Licensed under the Apache License, Version 2.0
 *
 * ----------------------------------------------------------------------------
 * Version: 0.1.0-dev
 * Status : Initial draft
 * ----------------------------------------------------------------------------
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

  themeMode() {
    const configured = this.config?.theme ?? "auto";
    if (configured !== "auto") return configured;
    return this._hass?.themes?.darkMode ? "dark" : "light";
  }

  colors() {
    return AuriAgerBaseCard.COLOR_SCHEMES[this.themeMode()]
      ?? AuriAgerBaseCard.COLOR_SCHEMES.light;
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

  stateSnapshot() {
    const entities = this.config?.entities ?? {};

    return Object.values(entities)
      .filter(Boolean)
      .map((id) => `${id}:${this._hass?.states?.[id]?.state ?? ""}`)
      .join("|");
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

  baseStyles() {
    const C = this.colors();

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
        background: ${C.accent};
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
    `;
  }
}

class AuriAgerFinanceCard extends AuriAgerBaseCard {
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
        ${this.baseStyles()}

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

class AuriAgerGaugeCard extends AuriAgerBaseCard {
  static getStubConfig() {
    return {
      type: "custom:auri-ager-gauge-card",
      title: "Autarkie",
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
        ${this.baseStyles()}

        ha-card {
          display: grid;
          gap: 8px;
          padding: 14px 18px 16px;
        }

				.header {
				  margin-bottom: 8px;
				}

      .accent {
        width: 8px;
        height: 42px;
        border-radius: 4px;
        background: ${accent};
      }

        .gauge-wrap {
          display: grid;
          place-items: center;
          padding: 0;
        }

        svg {
          width: min(100%, 155px);
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
  }

  updateDynamicDom() {
    const pct = this.percentage();
    const circumference = 2 * Math.PI * 78;
    const dash = (pct / 100) * circumference;

    this.setText("#gauge-title", this.config.title ?? "Gauge");
    this.setText("#gauge-subtitle", this.config.subtitle ?? "");
    this.setText("#gauge-value", `${Math.round(pct)}%`);
    this.setText("#gauge-label", this.config.label ?? this.config.title ?? "");

    this.shadowRoot
      ?.querySelector("#gauge-ring")
      ?.setAttribute("stroke-dasharray", `${dash} ${circumference}`);
  }
}

customElements.define("auri-ager-gauge-card", AuriAgerGaugeCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "auri-ager-finance-card",
  name: "Auri Ager Finance",
  description: "Calm energy finance summary card",
  preview: true,
});
window.customCards.push({
  type: "auri-ager-gauge-card",
  name: "Auri Ager Gauge",
  description: "Calm percentage gauge card",
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
