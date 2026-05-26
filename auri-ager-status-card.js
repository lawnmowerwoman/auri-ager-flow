class AuriAgerStatusCard extends HTMLElement {
  static COLOR_SCHEMES = {
  	light: {
			cardBg: "#ffffff",
			cardBorder: "rgba(0,0,0,.06)",
		
			label: "rgba(60,60,60,.65)",
			small: "rgba(60,60,60,.55)",
		
			ok: "#2e7d32",
			warning: "#f57c00",
			fault: "#d32f2f",
			info: "#1565c0",
			neutral: "rgba(60,60,60,.45)",
		
			grid: "darkslategray",
			offgrid: "purple",
			buying: "crimson",
			selling: "green",
  	},
  	dark: {
			cardBg: "#1f2326",
			cardBorder: "rgba(255,255,255,.08)",
		
			label: "rgba(220,225,228,.70)",
			small: "rgba(220,225,228,.55)",
		
			ok: "#5cb85c",
			warning: "#f6a623",
			fault: "#ef5350",
			info: "#4da3ff",
		
			neutral: "rgba(220,225,228,.40)",
		
			grid: "#7da2a6",
			offgrid: "#b084f5",
			buying: "#ff6b6b",
			selling: "#5fcf7b",
  	},
  };

  setConfig(config) {
    this.config = config;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._built = false;
  }

  set hass(hass) {
    this._hass = hass;

    if (!this.config || !this._hass) return;

    if (!this._built) {
      this.build();
      this._built = true;
    }

    this.update();
  }

  getCardSize() {
    return 1;
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

  state(entity) {
    if (!entity) return undefined;
    return this._hass?.states?.[entity]?.state;
  }

  number(entity) {
    const value = Number(this.state(entity));
    return Number.isFinite(value) ? value : 0;
  }

  isOn(entity) {
    return this.state(entity) === "on";
  }

  setIcon(slot, icon, color, label, title = "") {
    const root = this.shadowRoot;
    const iconEl = root.querySelector(`#${slot} ha-icon`);
    const labelEl = root.querySelector(`#${slot} .label`);
    const itemEl = root.querySelector(`#${slot}`);

    if (iconEl) {
      iconEl.setAttribute("icon", icon);
      iconEl.style.color = color;
    }

    if (labelEl) {
      labelEl.textContent = label;
    }

    if (itemEl) {
      itemEl.title = title || label;
    }
  }

  build() {
	  const COLORS = this.colors();

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: 10px 14px;
          border-radius: 18px;
					border: 1px solid ${COLORS.cardBorder};
          background: var(--ha-card-background, ${COLORS.cardBg});
          box-shadow: none;
        }

        .item {
          display: grid;
          grid-template-rows: 28px auto;
          justify-items: center;
          align-items: center;
          min-width: 44px;
          gap: 2px;
        }

        ha-icon {
          --mdc-icon-size: 26px;
          transition: color .2s ease, opacity .2s ease;
        }

        .label {
          font-family: var(--ha-font-family-body, system-ui);
          font-size: 10px;
          line-height: 1.1;
          color: ${COLORS.label};
          white-space: nowrap;
        }

        :host([compact]) .label {
          display: none;
        }

        :host([compact]) ha-card {
          gap: 14px;
          padding: 8px 12px;
        }
      </style>

      <ha-card>
        <div id="grid" class="item">
          <ha-icon></ha-icon>
          <div class="label"></div>
        </div>

        <div id="inverter" class="item">
          <ha-icon></ha-icon>
          <div class="label"></div>
        </div>

        <div id="production" class="item">
          <ha-icon></ha-icon>
          <div class="label"></div>
        </div>

        <div id="gridflow" class="item">
          <ha-icon></ha-icon>
          <div class="label"></div>
        </div>

        <div id="battery" class="item">
          <ha-icon></ha-icon>
          <div class="label"></div>
        </div>
      </ha-card>
    `;
  }

  update() {
    const e = this.config.entities ?? {};
		const C = this.colors();

    // 1. Netzstatus
    if (this.isOn(e.is_offgrid)) {
      this.setIcon(
        "grid",
        "mdi:transmission-tower-off",
        C.offgrid,
        "Off Grid",
        "Netz getrennt / Off Grid"
      );
    } else if (this.isOn(e.is_ongrid)) {
      this.setIcon(
        "grid",
        "mdi:transmission-tower",
        C.grid,
        "On Grid",
        "Netz verbunden / On Grid"
      );
    } else {
      this.setIcon(
        "grid",
        "mdi:transmission-tower",
        C.neutral,
        "Netz ?",
        "Netzstatus unbekannt"
      );
    }

    // 2. Wechselrichter
    if (this.isOn(e.has_inverter_fault)) {
      this.setIcon(
        "inverter",
        "mdi:lightning-bolt-outline",
        C.fault,
        "Fehler",
        "Wechselrichterfehler"
      );
    } else {
      this.setIcon(
        "inverter",
        "mdi:lightning-bolt",
        C.info,
        "OK",
        "Wechselrichter OK"
      );
    }

    // 3. Produktion
    if (this.isOn(e.is_producing)) {
      this.setIcon(
        "production",
        "mdi:solar-power-variant",
        C.warning,
        "PV",
        "PV produziert"
      );
    } else {
      this.setIcon(
        "production",
        "mdi:solar-power-variant",
        C.neutral,
        "PV aus",
        "PV produziert nicht"
      );
    }

    // 4. Netzfluss
    if (this.isOn(e.is_buying)) {
      this.setIcon(
        "gridflow",
        "mdi:transmission-tower-export",
        C.buying,
        "Bezug",
        "Strombezug aus dem Netz"
      );
    } else if (this.isOn(e.is_selling)) {
      this.setIcon(
        "gridflow",
        "mdi:transmission-tower-import",
        C.selling,
        "Einspeis.",
        "Einspeisung ins Netz"
      );
    } else {
      this.setIcon(
        "gridflow",
        "mdi:transmission-tower",
        C.neutral,
        "Neutral",
        "Kein relevanter Netzfluss"
      );
    }

    // 5. Batterie
    const batteryAbs = this.number(e.battery_power_abs);

    if (this.isOn(e.has_battery_failure)) {
      this.setIcon(
        "battery",
        "mdi:battery-off-outline",
        C.fault,
        "Fehler",
        "Batteriefehler"
      );
    } else if (this.isOn(e.battery_is_charging)) {
      this.setIcon(
        "battery",
        "mdi:battery-arrow-up",
        C.ok,
        "Lädt",
        "Batterie lädt"
      );
    } else if (this.isOn(e.battery_is_discharging)) {
      this.setIcon(
        "battery",
        "mdi:battery-arrow-down",
        C.fault,
        "Entlädt",
        "Batterie entlädt"
      );
    } else if (batteryAbs < 1) {
      this.setIcon(
        "battery",
        "mdi:battery-check-outline",
        C.neutral,
        "Standby",
        "Batterie Standby"
      );
    } else {
      this.setIcon(
        "battery",
        "mdi:battery",
        C.neutral,
        "Batterie",
        "Batteriestatus unbekannt"
      );
    }
  }
}

customElements.define("auri-ager-status-card", AuriAgerStatusCard);
