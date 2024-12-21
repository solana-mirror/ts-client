import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

type BalanceAmountOpts = string | BN
type PublicKeyOpts = PublicKey | string

export type BalancesResponse<
    B extends BalanceAmountOpts,
    P extends PublicKeyOpts,
> = {
    accounts: ParsedAta<B, P>[]
    raydium?: ParsedPosition<B>[]
}

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

export type ParsedPosition<T extends BalanceAmountOpts> = {
    totalValueUsd?: number
    protocol: ProtocolInfo
    tokenA: TokenPosition<T>
    tokenB: TokenPosition<T>
    feeTier: string
}

export type ProtocolInfo = {
    name: string
    symbol: string
    image: string
    poolId: string
}

export type TokenPosition<T extends BalanceAmountOpts> = {
    mint: string
    name: string
    symbol: string
    image: string
    amount: FormattedAmountWithPrice<T>
}

export type AccountsOnly = {
    accounts: ParsedAta<BN, PublicKey>[]
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
export type FormattedAmountWithPrice<T extends BalanceAmountOpts> = {
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
    balances: Record<string, FormattedAmountWithPrice<T>>
    usdValue: number
}

/**
 * Usd balance and its corresponding timestamp
 */
export type MinimalChartData = {
    timestamp: number
    usdValue: number
}

export type Timeframe = 'd' | 'h'
