import { AccountInfo, ParsedAccountData, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

/**
 * Type for an associated token account returned by the `connection` class
 */
export type AssociatedTokenAccount = {
    account: AccountInfo<ParsedAccountData>
    pubkey: PublicKey
}

export type ParsedAta = {
    mint: PublicKey
    ata: PublicKey
    coingeckoId?: string
    decimals: number
    name: string
    symbol: string
    image: string
    price: number
    balance: {
        amount: BN
        formatted: number
    }
}

/**
 * Stores the pre and post balances of a tx
 */
export type BalanceChange = {
    pre: FormattedAmount
    post: FormattedAmount
}

export type ParsedTransaction = {
    blockTime: number
    signatures: string[]
    logs: string[]
    balances: Record<string, BalanceChange>
    /**
     * Parsed ixs from the tx log
     */
    parsedInstructions: string[]
}

/**
 * Record for a token balance
 */
export type FormattedAmount = {
    amount: BN
    formatted: number
}

/**
 * Record for a token balance with price
 */
export type AmountWithPrice = FormattedAmount & {
    price: number
}

/**
 * Record of balances at a given timestamp
 */
export type ChartData = {
    timestamp: number
    balances: Record<string, { amount: BN; formatted: number }>
}

/**
 * Record of balances at a given timestamp with price
 */
export type ChartDataWithPrice = {
    timestamp: number
    balances: Record<string, AmountWithPrice>
    usdValue: number
}
