/**
 * Converts a rupee amount (number or string) to integer paise.
 * Safely handles floating point inputs like 450.50 -> 45050 paise.
 */
export function rupeesToPaise(amount: number | string): number {
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/,/g, '').trim();
    if (!cleaned || isNaN(Number(cleaned))) return 0;
    amount = Number(cleaned);
  }
  return Math.round(amount * 100);
}

/**
 * Converts integer paise to rupees.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Formats a paise amount into Indian digit grouped currency representation.
 * Examples with '₹':
 *   45000 paise -> "₹450"
 *   232000 paise -> "₹2,320"
 *   45050 paise -> "₹450.50"
 */
export function formatPaise(paise: number, currency: string = '₹'): string {
  const rupees = paise / 100;
  const isInteger = paise % 100 === 0;

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const formattedNum = formatter.format(Math.abs(rupees));
  const sign = paise < 0 ? '-' : '';

  return `${sign}${currency}${formattedNum}`;
}

/**
 * Formats rupee values directly.
 */
export function formatRupees(rupees: number, currency: string = '₹'): string {
  return formatPaise(Math.round(rupees * 100), currency);
}
