import { Transaction } from './types';

export function singleDecimal(value: number | null | undefined, decimals: number = 1): string {
    if (value == null) return "0.0";
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(value * factor) / factor;
    return rounded.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).replace(/,/g, ' ');
}

export function formatSingleDecimal(value: number | null | undefined): string {
    if (value == null) return 'N/A';
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded)
        ? `${rounded.toLocaleString().replace(/,/g, ' ')} NOK`
        : `${rounded.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).replace(/,/g, ' ')} NOK`;
}

export const transactionTypeMap: { [key in Transaction['transaction_type']]: string } = {
    BUY: 'Kjøp',
    SELL: 'Salg',
    DIVIDEND: 'Utbytte',
    DEPOSIT: 'Innskudd',
    WITHDRAW: 'Uttak',
};

export const orderTypeMap: { [key: string]: string } = {
    BUY: 'Kjøp',
    SELL: 'Salg',
};