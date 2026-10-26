import { Currency } from '../types/finance';

export const JPY_PER_INR = 1.8;
export const JPY_PER_USD = 152;
export const INR_PER_USD = 84.4;

export function formatFromJpy(jpyVal: number, currency: Currency): string {
  if (isNaN(jpyVal)) return '¥0';

  if (currency === 'JPY') {
    return '¥' + Math.round(jpyVal).toLocaleString('en-US');
  } else if (currency === 'INR') {
    const inr = Math.round(jpyVal / JPY_PER_INR);
    return '₹' + inr.toLocaleString('en-IN');
  } else {
    const usd = (jpyVal / JPY_PER_USD).toFixed(2);
    return '$' + Number(usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function formatInrCard(inrVal: number, currency: Currency): string {
  if (isNaN(inrVal)) return '₹0';

  if (currency === 'JPY') {
    const jpy = Math.round(inrVal * JPY_PER_INR);
    return '¥' + jpy.toLocaleString('en-US');
  } else if (currency === 'INR') {
    return '₹' + Math.round(inrVal).toLocaleString('en-IN');
  } else {
    const usd = (inrVal / INR_PER_USD).toFixed(2);
    return '$' + Number(usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
