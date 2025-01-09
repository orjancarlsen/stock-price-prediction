export interface Company {
  name?: string;
  symbol: string;
}

export type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'DIVIDEND';

export interface Transaction {
    id: number;
    transaction_type: TransactionType
    stock_symbol?: string;
    price_per_share?: number;
    number_of_shares?: number;
    fee: number;
    amount: number;
    timestamp: Date;
}

export enum IconSVGType {
  Calendar = 'CALENDAR',
  Buy = 'BUY',
  Sell = 'SELL',
  Deposit = 'DEPOSIT',
  Withdraw = 'WITHDRAW',
  Dividend = 'DIVIDEND',
}
