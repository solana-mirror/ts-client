import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

type BalanceAmountOpts = string | BN
type PublicKeyOpts = PublicKey | string

export type ParsedAta<B extends BalanceAmountOpts, P extends PublicKeyOpts> = {
    mint: P
    ata: P
    coingeckoId?: string
    decimals: number
    name: string
    symbol: string
    image: string
    price: number
    balance: FormattedAmount<B>
}

/**
 * Stores the pre and post balances of a tx
 */
export type BalanceChange<T extends BalanceAmountOpts> = {
    pre: FormattedAmount<T>
    post: FormattedAmount<T>
}

export type ParsedTransaction<T extends BalanceAmountOpts> = {
    blockTime: number
    signatures: string[]
    balances: Record<string, BalanceChange<T>>
    /**
     * Parsed ixs from the tx log
     */
    parsedInstructions: string[]
}

export type TransactionResponse<T extends BalanceAmountOpts> = {
    transactions: ParsedTransaction<T>[]
    count: number
}

/**
 * Record for a token balance
 */
export type FormattedAmount<T extends BalanceAmountOpts> = {
    amount: T
    formatted: number
}

/**
 * Record for a token balance with price
 */
export type AmountWithPrice<T extends BalanceAmountOpts> = {
    amount: FormattedAmount<T>
    price: number
}

/**
 * Record of balances at a given timestamp
 */
export type ChartData<T extends BalanceAmountOpts> = {
    timestamp: number
    balances: Record<string, FormattedAmount<T>>
}

/**
 * Record of balances at a given timestamp with price
 */
export type ChartDataWithPrice<T extends BalanceAmountOpts> = {
    timestamp: number
    balances: Record<string, AmountWithPrice<T>>
    usdValue: number
}

export type Timeframe = 'd' | 'h'
