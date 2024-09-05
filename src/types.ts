import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

type BalanceAmount = string | BN

export type ParsedAta<T extends BalanceAmount> = {
    mint: PublicKey
    ata: PublicKey
    coingeckoId?: string
    decimals: number
    name: string
    symbol: string
    image: string
    price: number
    balance: FormattedAmount<T>
}

/**
 * Stores the pre and post balances of a tx
 */
export type BalanceChange<T extends BalanceAmount> = {
    pre: FormattedAmount<T>
    post: FormattedAmount<T>
}

export type ParsedTransaction<T extends BalanceAmount> = {
    blockTime: number
    signatures: string[]
    balances: Record<string, BalanceChange<T>>
    /**
     * Parsed ixs from the tx log
     */
    parsedInstructions: string[]
}

/**
 * Record for a token balance
 */
export type FormattedAmount<T extends BalanceAmount> = {
    amount: T
    formatted: number
}

/**
 * Record for a token balance with price
 */
export type AmountWithPrice<T extends BalanceAmount> = {
    amount: FormattedAmount<T>
    price: number
}

/**
 * Record of balances at a given timestamp
 */
export type ChartData<T extends BalanceAmount> = {
    timestamp: number
    balances: Record<string, FormattedAmount<T>>
}

/**
 * Record of balances at a given timestamp with price
 */
export type ChartDataWithPrice<T extends BalanceAmount> = {
    timestamp: number
    balances: Record<string, AmountWithPrice<T>>
    usdValue: number
}

export type Timeframe = 'd' | 'h'
