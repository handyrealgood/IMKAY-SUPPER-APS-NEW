import { ItemUnit } from '../types';

export interface UnitOption {
  unit: ItemUnit;
  label: string;
  toBaseMultiplier: number; // Multiply quantity in this unit to get quantity in base unit
}

export type UnitFamily = 'weight' | 'volume' | 'count';

export const UNIT_DETAILS: Record<string, { label: string; family: UnitFamily; abbr: string }> = {
  kg: { label: 'Kilogram (kg)', family: 'weight', abbr: 'kg' },
  gram: { label: 'Gram (g)', family: 'weight', abbr: 'g' },
  liter: { label: 'Liter (L)', family: 'volume', abbr: 'L' },
  ml: { label: 'Mililiter (ml)', family: 'volume', abbr: 'ml' },
  pcs: { label: 'Pieces (pcs)', family: 'count', abbr: 'pcs' },
  pack: { label: 'Pack / Dus', family: 'count', abbr: 'pack' },
  can: { label: 'Kaleng (can)', family: 'count', abbr: 'can' },
  portion: { label: 'Porsi (portion)', family: 'count', abbr: 'porsi' },
  Galon: { label: 'Galon', family: 'volume', abbr: 'galon' },
  Tabung: { label: 'Tabung', family: 'count', abbr: 'tabung' },
};

/**
 * Get unit family: weight, volume, or count
 */
export const getUnitFamily = (unit: ItemUnit): UnitFamily => {
  return UNIT_DETAILS[unit]?.family || 'count';
};

/**
 * Returns options of units compatible with the base unit,
 * along with the multiplier to convert from that unit to the base unit.
 */
export const getCompatibleUnits = (baseUnit: ItemUnit, customPackSize = 12): UnitOption[] => {
  const family = getUnitFamily(baseUnit);

  if (family === 'weight') {
    if (baseUnit === 'kg') {
      return [
        { unit: 'gram', label: 'Gram (g) — Satuan Kecil', toBaseMultiplier: 0.001 },
        { unit: 'kg', label: 'Kilogram (kg) — Satuan Baku', toBaseMultiplier: 1 },
      ];
    }
    return [
      { unit: 'gram', label: 'Gram (g) — Satuan Baku', toBaseMultiplier: 1 },
      { unit: 'kg', label: 'Kilogram (kg) — Satuan Besar (1 kg = 1.000 g)', toBaseMultiplier: 1000 },
    ];
  }

  if (family === 'volume') {
    if (baseUnit === 'liter') {
      return [
        { unit: 'ml', label: 'Mililiter (ml) — Satuan Kecil', toBaseMultiplier: 0.001 },
        { unit: 'liter', label: 'Liter (L) — Satuan Baku', toBaseMultiplier: 1 },
      ];
    }
    return [
      { unit: 'ml', label: 'Mililiter (ml) — Satuan Baku', toBaseMultiplier: 1 },
      { unit: 'liter', label: 'Liter (L) — Satuan Besar (1 L = 1.000 ml)', toBaseMultiplier: 1000 },
    ];
  }

  // Count family or custom units
  const options: UnitOption[] = [
    { unit: 'pcs', label: 'Pieces (pcs)', toBaseMultiplier: baseUnit === 'pack' ? (1 / customPackSize) : 1 },
    { unit: 'pack', label: `Pack / Dus (${customPackSize} pcs)`, toBaseMultiplier: baseUnit === 'pcs' ? customPackSize : 1 },
    { unit: 'can', label: 'Kaleng / Can (1 pcs)', toBaseMultiplier: baseUnit === 'pack' ? (1 / customPackSize) : 1 },
    { unit: 'portion', label: 'Porsi (1 pcs)', toBaseMultiplier: baseUnit === 'pack' ? (1 / customPackSize) : 1 },
    { unit: 'Galon', label: 'Galon (1 galon)', toBaseMultiplier: 1 },
    { unit: 'Tabung', label: 'Tabung (1 tabung)', toBaseMultiplier: 1 },
  ];

  // If baseUnit is custom and not yet in options, add it
  if (!options.some(o => o.unit === baseUnit)) {
    options.unshift({
      unit: baseUnit,
      label: `${baseUnit} — Satuan Baku`,
      toBaseMultiplier: 1,
    });
  }

  return options;
};

/**
 * Convert quantity from one unit to another
 */
export const convertQuantity = (
  qty: number,
  fromUnit: ItemUnit,
  toUnit: ItemUnit,
  customPackSize = 12
): number => {
  if (fromUnit === toUnit || !qty) return qty;

  // Weight conversion
  if (fromUnit === 'kg' && toUnit === 'gram') return qty * 1000;
  if (fromUnit === 'gram' && toUnit === 'kg') return qty / 1000;

  // Volume conversion
  if (fromUnit === 'liter' && toUnit === 'ml') return qty * 1000;
  if (fromUnit === 'ml' && toUnit === 'liter') return qty / 1000;

  // Count / Pack conversion
  if (fromUnit === 'pack' && (toUnit === 'pcs' || toUnit === 'portion' || toUnit === 'can')) {
    return qty * customPackSize;
  }
  if ((fromUnit === 'pcs' || fromUnit === 'portion' || fromUnit === 'can') && toUnit === 'pack') {
    return qty / customPackSize;
  }

  // Identical count units
  if (['pcs', 'can', 'portion'].includes(fromUnit) && ['pcs', 'can', 'portion'].includes(toUnit)) {
    return qty;
  }

  // Fallback: 1 to 1 if unrelated
  return qty;
};

/**
 * Convert cost per base unit to cost per target unit
 * E.g., if Rp 145.000 per kg, cost per gram = Rp 145
 */
export const convertCostPerUnit = (
  costPerBaseUnit: number,
  baseUnit: ItemUnit,
  targetUnit: ItemUnit,
  customPackSize = 12
): number => {
  if (baseUnit === targetUnit || !costPerBaseUnit) return costPerBaseUnit;

  // Convert 1 targetUnit to baseUnit quantity
  const oneTargetInBaseUnit = convertQuantity(1, targetUnit, baseUnit, customPackSize);
  return costPerBaseUnit * oneTargetInBaseUnit;
};

/**
 * Generates clean explanation text of conversion
 * E.g. "150 gram = 0.15 kg"
 */
export const getConversionDescription = (
  qty: number,
  fromUnit: ItemUnit,
  baseUnit: ItemUnit,
  customPackSize = 12
): string => {
  if (fromUnit === baseUnit) {
    return `${qty} ${fromUnit}`;
  }

  const converted = convertQuantity(qty, fromUnit, baseUnit, customPackSize);
  const formattedConverted = Number.isInteger(converted) 
    ? converted.toString() 
    : converted.toFixed(converted < 0.01 ? 4 : 3).replace(/\.?0+$/, '');

  return `${qty} ${fromUnit} = ${formattedConverted} ${baseUnit}`;
};
