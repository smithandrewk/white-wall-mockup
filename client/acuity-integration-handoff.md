# Acuity Integration Handoff

This repo is now set up for duration-aware Acuity wiring.

## Where To Configure It

Edit:

- `scripts/booking-config.js`

The Acuity section now supports:

- `mode: "placeholder"` while no live config is present
- `mode: "iframe"` if each duration should render an embedded Acuity calendar
- `mode: "scheduler"` if each duration should link out to Acuity instead of embedding

## Required Inputs

For each location duration, fill one of:

1. `iframeSrc`
2. `schedulerUrl`

Optional but recommended:

- `appointmentTypeId`
- `accountUrl`

## Duration Keys To Match

### Powdersville

- `pv-1`
- `pv-2`
- `pv-3`
- `pv-4`
- `pv-6`
- `pv-full`

### Taylor's Mill

- `tm-1`
- `tm-2`
- `tm-3`

## Suggested Acuity Verification Checklist

- Confirm separate appointment types exist for each duration
- Confirm Powdersville 4hr+ types are the only ones intended for event-capable bookings
- Confirm Taylor's Mill has no event-capable appointment types
- Confirm the embed or scheduler URL actually lands on the matching appointment type
- Confirm the embed works on mobile preview widths
- Confirm confirmation emails still use correct branding and links

## Enable Sequence

1. Fill the duration mappings in `scripts/booking-config.js`
2. Set `integrations.acuity.mode` to `iframe` or `scheduler`
3. Set `integrations.acuity.enabled` to `true`
4. Test both `/book-powdersville` and `/book-taylors-mill`
