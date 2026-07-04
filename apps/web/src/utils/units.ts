import type { UnitSystem } from '@purple/shared'

const KG_PER_LB = 0.45359237

export function kgToLbs(kg: number): number {
  return kg / KG_PER_LB
}

export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB
}

/** Converts a stored kg value into the display unit, unrounded. */
export function displayWeight(weightKg: number, unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? kgToLbs(weightKg) : weightKg
}

/** Converts a value entered in the display unit back to kg for storage. */
export function toStoredKg(value: number, unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? lbsToKg(value) : value
}

export function weightUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'lb' : 'kg'
}
