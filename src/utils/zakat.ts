import type { ZakatAsset } from '../models';

const ZAKAT_RATE = 0.025; // 2.5%

export interface ZakatResult {
  totalZakatable: number;
  zakatDue: number;
  isAboveNisab: boolean;
  rate: number;
}

/**
 * Calculate zakat due.
 * @param assets  - list of assets with their zakatable flag
 * @param nisab   - the nisab threshold in the user's currency
 */
export function calculateZakat(assets: ZakatAsset[], nisab: number): ZakatResult {
  const totalZakatable = assets
    .filter((a) => a.isZakatable)
    .reduce((sum, a) => sum + a.value, 0);

  const isAboveNisab = totalZakatable >= nisab;
  const zakatDue = isAboveNisab ? totalZakatable * ZAKAT_RATE : 0;

  return { totalZakatable, zakatDue, isAboveNisab, rate: ZAKAT_RATE };
}

/**
 * Gold nisab equivalent — roughly 85g of gold.
 * At ~€60/g this is ~€5,100. Users can override via settings.
 */
export const DEFAULT_NISAB_EUR = 5100;
