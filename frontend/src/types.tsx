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

export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELED';

export interface Order {
  id: number;
  order_type: string;
  stock_symbol: string;
  price_per_share: number;
  number_of_shares: number;
  fee: number;
  amount: number;
  status: OrderStatus;
  timestamp_created: Date;
  timestamp_updated?: Date;
}

export enum AssetType {
  STOCK = 'STOCK',
  CASH = 'CASH',
}

export interface Asset {
  asset_type: AssetType;
  stock_symbol?: string;
  number_of_shares?: number;
  price_per_share?: number;
  total_value: number;
  available?: number;
  todays_value?: number;
}

export interface PortfolioValue {
    date: Date;
    value: number;
}

export enum IconSVGType {
  Calendar = 'CALENDAR',
  Buy = 'BUY',
  Sell = 'SELL',
  Deposit = 'DEPOSIT',
  Withdraw = 'WITHDRAW',
  Dividend = 'DIVIDEND',
  Pending = 'PENDING',
  Executed = 'EXECUTED',
  Canceled = 'CANCELED',
}
