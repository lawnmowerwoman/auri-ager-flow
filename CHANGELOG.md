# Changelog

## 1.2.0 - 2026-08-22

### Added

- Flow Battery Engine V2 for internal battery runtime, charge time, backup energy and backup runtime calculations.
- New Flow battery configuration with `battery.entity`, `battery.soc_entity`, `capacity`, `has_backup`, `minimum_soc`, `maximum_soc` and `backup_minimum_soc`.
- `dod` and `backup_dod` support for inverter integrations that expose depth of discharge instead of minimum SOC.
- Numeric-or-entity support for `maximum_soc`, `minimum_soc`, `backup_minimum_soc`, `dod` and `backup_dod`.
- `load` configuration with `entity`, `backup_entity`, `grid_detection_entity` and `grid_detection_value`.
- Automatic on/off-grid load switching.
- Island mode visualization in Flow: the central Autarky ring becomes a status indicator when the grid is unavailable.

### Changed

- Flow battery runtime text now uses compact hour formatting such as `4:32 h`.
- Sun Card layout is now based on explicit geometry constants with a wider SVG viewBox.
- Sunrise and sunset times are positioned relative to their markers and kept inside the SVG bounds.
- README documentation updated for the current bundled cards, editors and Flow V2 configuration.

### Fixed

- Autarky and self-consumption values are clamped to valid percentage ranges.
- Thermometer `fill_from_zero` behavior corrected for temperature ranges crossing zero.
- Entity and icon pickers stabilized across visual editors.

### Compatibility

- Existing Flow configurations using `battery.power`, `battery.soc`, `battery.backup_power`, `entities.battery_power` and `entities.battery_soc` remain supported.

## 1.1

- Added missing visual editors.
- Added icon picker support.
- Improved editor stability.

## 1.0.2

- Added Summary Card editor.
- Added Finance Card editor.
- Added compact layout support to Entity Grid Card.
- Added configurable icon size and value display to Entity Grid Card.

## 1.0.1

- Fixed Flow header scaling on small displays.
- Added `max_width` option to Flow Card.
- Improved Entity Grid auto layout.
- Renamed Micro Entity Card to Entity Grid Card.

## 1.0.0

- Initial public release of the Auri Ager Framework bundle.
