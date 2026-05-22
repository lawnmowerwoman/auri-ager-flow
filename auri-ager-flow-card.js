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

  static LAYOUT = {
    viewBox: "0 0 600 600",

    autarky: {
      x: 300,
      y: 285,
      r: 78,
    },

    selfConsumption: {
      x: 155,
      y: 285,
      r: 40,
    },

    nodes: {
      pv: { x: 145, y: 35 },
      external: { x: 300, y: 35 },
      grid: { x: 455, y: 35 },

      battery: { x: 145, y: 465 },
      wallbox: { x: 300, y: 465 },
      consumption: { x: 430, y: 465 },

      heatpump: { x: 545, y: 340 },
      home: { x: 545, y: 465 },
    },
  };

  static PATHS = {
    pv: "M145 122 L145 158 Q145 178 165 178 L238 178",
    external: "M300 122 L300 185",
    grid: "M455 122 L455 158 Q455 178 435 178 L362 178",

    battery: "M245 365 L245 398 Q245 418 225 418 L165 418 Q145 418 145 445",
    wallbox: "M300 380 L300 445",
    consumption: "M355 365 L355 398 Q355 418 375 418 L410 418 Q430 418 430 445",

    heatpump: "M470 475 L480 475 Q500 475 500 425 L500 385 Q500 365 525 365",
    home: "M470 495 L520 495",
  };

  setConfig(config) {
    this.config = config;
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  value(entity) {
    if (!entity) return 0;

    const state = this._hass?.states?.[entity];
    const value = Number(state?.state);

    return Number.isFinite(value) ? value : 0;
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

  /**
   * Temporary 1.0a animation strategy:
   * The card still re-renders on every Home Assistant update.
   * To avoid visible animation resets, we phase the animation using Date.now().
   *
   * Later 1.0b/1.0a+ improvement:
   * Separate static SVG/animation DOM from value updates.
   */
  pill(pathId, duration, reverse = false, pad = 0.08) {
    const seconds =
      typeof duration === "number"
        ? duration
        : Number(String(duration).replace("s", ""));

    const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 8;

    const start = pad;
    const end = 1 - pad;

    const phase = (Date.now() / 1000) % safeSeconds;
    const begin = `-${phase.toFixed(3)}s`;

    const direction = reverse
      ? `keyPoints="${end};${start}" keyTimes="0;1" calcMode="linear"`
      : `keyPoints="${start};${end}" keyTimes="0;1" calcMode="linear"`;

    return `
      <rect class="pill" x="-10" y="-5" width="20" height="10" rx="5" ry="5">
        <animateMotion
          dur="${safeSeconds}s"
          begin="${begin}"
          repeatCount="indefinite"
          rotate="auto"
          ${direction}>
          <mpath href="#${pathId}"/>
        </animateMotion>
      </rect>
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

  renderTopNode(label, iconSvg, value, x, y) {
    return `
      <text x="${x}" y="${y}" class="label">${label}</text>
      <g transform="translate(${x - 20} ${y + 14})">${iconSvg}</g>
      <text x="${x}" y="${y + 78}" class="value">${value}</text>
    `;
  }

  renderBottomNode(label, iconSvg, value, x, y) {
    return `
      <text x="${x}" y="${y}" class="value">${value}</text>
      <g transform="translate(${x - 20} ${y + 7})">${iconSvg}</g>
      <text x="${x}" y="${y + 62}" class="label">${label}</text>
    `;
  }

  renderBatteryNode(label, iconSvg, value, subline, subline2, x, y) {
    return `
      <text x="${x}" y="${y}" class="value">${value}</text>
      <g transform="translate(${x - 20} ${y + 7})">${iconSvg}</g>
      <text x="${x}" y="${y + 62}" class="label">${label}</text>
      <text x="${x}" y="${y + 84}" class="small">${subline}</text>
      <text x="${x}" y="${y + 100}" class="small">${subline2}</text>
    `;
  }

  valueText(entity) {
    if (!entity) return "";
    const state = this._hass?.states?.[entity];
    const value = state?.state;

    if (!value || value === "00:00" || value === "unknown" || value === "unavailable") {
      return "";
    }

    return String(value);
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
      solar: solar > AuriAgerFlowCard.THRESHOLD_W,
      external: externalDisplay > AuriAgerFlowCard.THRESHOLD_W,
      grid: Math.abs(grid) > AuriAgerFlowCard.THRESHOLD_W,
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
      gridForward: grid < 0,
      batteryForward: batteryPower < 0,
      active, 
    };
  }

  ringsSvg(data) {
    const { autarky, selfConsumption } = data;
    const { autarky: autarkyLayout, selfConsumption: selfLayout } =
      AuriAgerFlowCard.LAYOUT;

    const autarkyCircumference = 2 * Math.PI * autarkyLayout.r;
    const autarkyDash =
      (this.clamp(autarky) / 100) * autarkyCircumference;

    const selfCircumference = 2 * Math.PI * selfLayout.r;
    const selfDash =
      (this.clamp(selfConsumption) / 100) * selfCircumference;

    return `
      <circle cx="${selfLayout.x}" cy="${selfLayout.y}" r="${selfLayout.r}" class="ring-bg self-ring-bg"/>
      <circle cx="${selfLayout.x}" cy="${selfLayout.y}" r="${selfLayout.r}" class="self-ring"
              stroke-dasharray="${selfDash} ${selfCircumference}"/>
      <text x="${selfLayout.x}" y="${selfLayout.y - 3}" class="self-value">${Math.round(selfConsumption)}%</text>
      <text x="${selfLayout.x}" y="${selfLayout.y + 15}" class="self-label">Eigen-</text>
      <text x="${selfLayout.x}" y="${selfLayout.y + 29}" class="self-label">verbrauch</text>

      <circle cx="${autarkyLayout.x}" cy="${autarkyLayout.y}" r="${autarkyLayout.r}" class="ring-bg autarky-ring-bg"/>
      <circle cx="${autarkyLayout.x}" cy="${autarkyLayout.y}" r="${autarkyLayout.r}" class="autarky-ring"
              stroke-dasharray="${autarkyDash} ${autarkyCircumference}"/>
      <text x="${autarkyLayout.x}" y="${autarkyLayout.y - 7}" class="center-value">${Math.round(autarky)}%</text>
      <text x="${autarkyLayout.x}" y="${autarkyLayout.y + 19}" class="center-label">Autarkie</text>
    `;
  }

  pathsSvg(data) {
    const { gridForward, batteryForward, active } = data;
    const p = AuriAgerFlowCard.PATHS;

    const path = (id, d, marker = `marker-end="url(#flow-arrow-end)"`) => `
      <path id="${id}" class="line"
            ${marker}
            d="${d}" />
    `;

    return `
      ${active.solar ? path("pv-path", p.pv) : ""}
      ${active.external ? path("external-path", p.external) : ""}
      ${active.grid ? path("grid-path",p.grid,this.markerAttrs("flow-arrow", gridForward)) : ""}
      ${active.battery ? path("battery-path",p.battery,this.markerAttrs("flow-arrow", batteryForward)) : ""}
      ${active.wallbox ? path("wallbox-path", p.wallbox) : ""}
      ${active.consumption ? path("consumption-path", p.consumption) : ""}
      ${active.heatpump ? path("heatpump-path", p.heatpump) : ""}
      ${active.home ? path("home-path", p.home) : ""}
    `;
  }

  pillsSvg(data) {
    const { active } = data;

    return `
      ${active.solar ? this.pill("pv-path", 7) : ""}
      ${active.external ? this.pill("external-path", 8) : ""}
      ${active.grid ? this.pill("grid-path", 8, !data.gridForward) : ""}
      ${active.battery ? this.pill("battery-path", 8, !data.batteryForward) : ""}
      ${active.wallbox ? this.pill("wallbox-path", 9) : ""}
      ${active.consumption ? this.pill("consumption-path", 9) : ""}
      ${active.heatpump ? this.pill("heatpump-path", 9) : ""}
      ${active.home ? this.pill("home-path", 9) : ""}
    `;
  }

  nodesSvg(data) {
    const n = AuriAgerFlowCard.LAYOUT.nodes;

    return `
      ${this.renderTopNode(
        "PV",
        data.solar > AuriAgerFlowCard.THRESHOLD_W
          ? this.solarIcon()
          : this.moonIcon(),
        this.fmtW(data.solar),
        n.pv.x,
        n.pv.y
      )}

      ${this.renderTopNode(
        data.externalLabel,
        this.externalIcon(),
        this.fmtW(data.externalDisplay),
        n.external.x,
        n.external.y
      )}

      ${this.renderTopNode(
        "Netz",
        this.gridIcon(),
        this.fmtW(data.grid),
        n.grid.x,
        n.grid.y
      )}

      ${this.renderBatteryNode(
        "Batterie",
        this.batteryIcon(data.batterySoc),
        `${Math.round(data.batterySoc)}%`,
        `${data.batteryLabel} · ${this.fmtW(data.batteryPower)}`,
        data.batteryRuntime ? `Laufzeit ${data.batteryRuntime}` : "",
        n.battery.x,
        n.battery.y
      )}

      ${this.renderBottomNode(
        "Wallbox",
        this.wallboxIcon(),
        this.fmtW(data.wallbox),
        n.wallbox.x,
        n.wallbox.y
      )}

      ${this.renderBottomNode(
        "Verbrauch",
        this.homeIcon(),
        this.fmtW(data.consumption),
        n.consumption.x,
        n.consumption.y
      )}

      ${this.renderBottomNode(
        "Wärmepumpe",
        this.heatpumpIcon(),
        this.fmtW(data.heatpump),
        n.heatpump.x,
        n.heatpump.y
      )}

      ${this.renderBottomNode(
        "Haus",
        this.homeIcon(),
        this.fmtW(data.homeBase),
        n.home.x,
        n.home.y
      )}
    `;
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

  render() {
    if (!this.config || !this._hass) return;

    const data = this.resolveData();

    this.shadowRoot.innerHTML = `
      ${this.styles()}

      <ha-card>
        <svg viewBox="${AuriAgerFlowCard.LAYOUT.viewBox}">
          <defs>
            ${this.arrowDef("flow-arrow")}
          </defs>

          <text x="8" y="8" class="title">Auri Ager Flow</text>

          ${this.pathsSvg(data)}
          ${this.pillsSvg(data)}
          ${this.ringsSvg(data)}
          ${this.nodesSvg(data)}
        </svg>
      </ha-card>
    `;
  }

  getCardSize() {
    return 5;
  }
}

customElements.define("auri-ager-flow-card", AuriAgerFlowCard);