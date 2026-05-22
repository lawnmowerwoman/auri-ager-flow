class AuriAgerFlowCard extends HTMLElement {
  static COLORS = {
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
  };

  static THRESHOLD_W = 30;
  static THRESHOLD_W_ZERO = 0;

  static LAYOUT = {
    viewBox: "0 0 600 600",

    autarky: {
      x: 250,
      y: 300,
      r: 78,
    },

    selfConsumption: {
      x: 90,
      y: 300,
      r: 40,
    },

    nodes: {
      pv: { x: 95, y: 50 },
      external: { x: 250, y: 50 },
      grid: { x: 405, y: 50 },

      battery: { x: 95, y: 480 },
      wallbox: { x: 250, y: 480 },
      consumption: { x: 380, y: 480 },

      heatpump: { x: 520, y: 355 },
      home: { x: 520, y: 480 },
    },
  };

  static PATHS = {
    pv: "M95 150 L95 220 Q95 235 115 235 L170 235",
    external: "M250 150 L250 205",
    grid: "M405 150 L405 220 Q405 235 385 235 L330 235",

    battery: "M170 365 H120 Q95 365 95 390 V445",
    wallbox: "M250 400 L250 445",
    consumption: "M330 365 H355 Q380 365 380 390 V445",

    heatpump: "M410 495 H430 Q450 495 450 475 V405 Q450 380 475 380 H495",
    home: "M410 510 L500 510",
  };

  setConfig(config) {
    this.config = config;
		this._lastSnapshot = "";
		this._raf = null;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._built = false;
  }

	set hass(hass) {
		this._hass = hass;
	
		if (!this.config || !this._hass) return;
	
		if (!this._built) {
			this.buildStaticDom();
			this._built = true;
			this._lastSnapshot = "";
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
    const abs = Math.abs(value);

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

  arrowDef(id, color = AuriAgerFlowCard.COLORS.arrow) {
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

    const solarRaw = this.value(entities.solar);
    const external = this.value(entities.external);
    const grid = this.value(entities.grid);
    const batteryPower = this.value(entities.battery_power);
    const batterySoc = this.value(entities.battery_soc);
    const batteryRuntime = this.valueText(entities.battery_runtime);
    const homeRaw = this.value(entities.home);
    const wallbox = this.value(entities.wallbox);
    const heatpump = this.value(entities.heatpump);
    const autarky = this.value(entities.autarky);
    const selfConsumption = this.value(entities.self_consumption);

    let solar = solarRaw;
    let externalDisplay = external;
    let externalCorrection = 0;

    if (externalMode === "parallel_pv") {
      solar = solarRaw + external;
      externalDisplay = 0;
    }

    if (externalMode === "behind_home") {
      externalCorrection = external;
    }

    const homeBase = Math.max(
      0,
      homeRaw + externalCorrection - wallbox - heatpump
    );

    const consumption = Math.max(0, homeBase + heatpump);

    const batteryLabel =
      batteryPower > AuriAgerFlowCard.THRESHOLD_W ? "Entlädt" :
      batteryPower < -AuriAgerFlowCard.THRESHOLD_W ? "Lädt" :
      "Standby";

    const active = {
      solar: solar > AuriAgerFlowCard.THRESHOLD_W_ZERO,
      external: externalDisplay > AuriAgerFlowCard.THRESHOLD_W,
      grid: Math.abs(grid) > AuriAgerFlowCard.THRESHOLD_W_ZERO,
      battery: Math.abs(batteryPower) > AuriAgerFlowCard.THRESHOLD_W,
      wallbox: wallbox > AuriAgerFlowCard.THRESHOLD_W,
      consumption: consumption > AuriAgerFlowCard.THRESHOLD_W,
      heatpump: heatpump > AuriAgerFlowCard.THRESHOLD_W,
      home: homeBase > AuriAgerFlowCard.THRESHOLD_W,
    };

    return {
      solar,
      externalDisplay,
      externalLabel: externalConfig.label ?? "Externe Quelle",
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

      active,
    };
  }

  buildStaticDom() {
    const p = AuriAgerFlowCard.PATHS;

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <svg viewBox="${AuriAgerFlowCard.LAYOUT.viewBox}">
          <defs>
            ${this.arrowDef("flow-arrow")}
          </defs>

          <text x="8" y="8" class="title">Auri Ager Flow</text>

          ${this.flowSvg("solar", "pv-path", p.pv, 7)}
          ${this.flowSvg("external", "external-path", p.external, 8)}
          ${this.flowSvg("grid", "grid-path", p.grid, 8)}
          ${this.flowSvg("battery", "battery-path", p.battery, 8)}
          ${this.flowSvg("wallbox", "wallbox-path", p.wallbox, 9)}
          ${this.flowSvg("consumption", "consumption-path", p.consumption, 9)}
          ${this.flowSvg("heatpump", "heatpump-path", p.heatpump, 9)}
          ${this.flowSvg("home", "home-path", p.home, 9)}

          ${this.staticRingsSvg()}
          ${this.staticNodesSvg()}
        </svg>
      </ha-card>
    `;
  }

  staticRingsSvg() {
    const { autarky, selfConsumption } = AuriAgerFlowCard.LAYOUT;

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
    const n = AuriAgerFlowCard.LAYOUT.nodes;

    return `
      <text x="${n.pv.x}" y="${n.pv.y}" class="label">PV</text>
      <g id="pv-icon" transform="translate(${n.pv.x - 20} ${n.pv.y + 14})"></g>
      <text id="pv-value" x="${n.pv.x}" y="${n.pv.y + 78}" class="value"></text>

      <text id="external-label" x="${n.external.x}" y="${n.external.y}" class="label"></text>
      <g id="external-icon" transform="translate(${n.external.x - 20} ${n.external.y + 14})">
        ${this.externalIcon()}
      </g>
      <text id="external-value" x="${n.external.x}" y="${n.external.y + 78}" class="value"></text>

      <text x="${n.grid.x}" y="${n.grid.y}" class="label">Netz</text>
      <g id="grid-icon" transform="translate(${n.grid.x - 20} ${n.grid.y + 14})">
        ${this.gridIcon()}
      </g>
      <text id="grid-value" x="${n.grid.x}" y="${n.grid.y + 78}" class="value"></text>

      <text id="battery-value" x="${n.battery.x}" y="${n.battery.y}" class="value"></text>
      <g id="battery-icon" transform="translate(${n.battery.x - 20} ${n.battery.y + 7})"></g>
      <text x="${n.battery.x}" y="${n.battery.y + 62}" class="label">Batterie</text>
      <text id="battery-subline" x="${n.battery.x}" y="${n.battery.y + 84}" class="small"></text>
      <text id="battery-runtime" x="${n.battery.x}" y="${n.battery.y + 100}" class="small"></text>

      <text id="wallbox-value" x="${n.wallbox.x}" y="${n.wallbox.y}" class="value"></text>
      <g transform="translate(${n.wallbox.x - 20} ${n.wallbox.y + 7})">
        ${this.wallboxIcon()}
      </g>
      <text x="${n.wallbox.x}" y="${n.wallbox.y + 62}" class="label">Wallbox</text>

      <text id="consumption-value" x="${n.consumption.x}" y="${n.consumption.y}" class="value"></text>
      <g transform="translate(${n.consumption.x - 20} ${n.consumption.y + 7})">
        ${this.homeIcon()}
      </g>
      <text x="${n.consumption.x}" y="${n.consumption.y + 62}" class="label">Verbrauch</text>

      <text id="heatpump-value" x="${n.heatpump.x}" y="${n.heatpump.y}" class="value"></text>
      <g transform="translate(${n.heatpump.x - 20} ${n.heatpump.y + 7})">
        ${this.heatpumpIcon()}
      </g>
      <text x="${n.heatpump.x}" y="${n.heatpump.y + 62}" class="label">Wärmepumpe</text>

      <text id="home-value" x="${n.home.x}" y="${n.home.y}" class="value"></text>
      <g transform="translate(${n.home.x - 20} ${n.home.y + 7})">
        ${this.homeIcon()}
      </g>
      <text x="${n.home.x}" y="${n.home.y + 62}" class="label">Haus</text>
    `;
  }

  updateDynamicDom() {
    const data = this.resolveData();
    const { autarky, selfConsumption } = AuriAgerFlowCard.LAYOUT;

    const autarkyCircumference = 2 * Math.PI * autarky.r;
    const autarkyDash =
      (this.clamp(data.autarky) / 100) * autarkyCircumference;

    const selfCircumference = 2 * Math.PI * selfConsumption.r;
    const selfDash =
      (this.clamp(data.selfConsumption) / 100) * selfCircumference;

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
    this.setText("#external-value", this.fmtW(data.externalDisplay));

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
    this.setVisible("#flow-grid", data.active.grid);
    this.setVisible("#flow-battery", data.active.battery);
    this.setVisible("#flow-wallbox", data.active.wallbox);
    this.setVisible("#flow-consumption", data.active.consumption);
    this.setVisible("#flow-heatpump", data.active.heatpump);
    this.setVisible("#flow-home", data.active.home);
  }

  styles() {
    const { COLORS, LAYOUT } = AuriAgerFlowCard;

    return `
      <style>
        ha-card {
          padding: 22px;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,.06);
          box-shadow: none;
        }

        svg {
          width: 100%;
          height: auto;
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
          fill: #fff;
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
          transform-origin: ${LAYOUT.autarky.x}px ${LAYOUT.autarky.y}px;
        }

        .self-ring-bg {
          stroke-width: 9;
        }

        .self-ring {
          fill: none;
          stroke: rgba(60,60,60,.55);
          stroke-width: 9;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: ${LAYOUT.selfConsumption.x}px ${LAYOUT.selfConsumption.y}px;
        }

        .center-value {
          font-size: 34px;
          font-weight: 850;
          fill: ${COLORS.center};
          text-anchor: middle;
        }

        .center-label {
          font-size: 14px;
          fill: #667076;
          text-anchor: middle;
        }

        .self-value {
          font-size: 20px;
          font-weight: 750;
          fill: rgba(25,25,25,.90);
          text-anchor: middle;
        }

        .self-label {
          font-size: 11px;
          fill: rgba(60,60,60,.60);
          text-anchor: middle;
        }
      </style>
    `;
  }
}

customElements.define("auri-ager-flow-card", AuriAgerFlowCard);