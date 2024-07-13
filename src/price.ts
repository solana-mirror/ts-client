import { createJupiterApiClient } from '@jup-ag/api'
import { Connection, PublicKey } from '@solana/web3.js'
import { getDecimals, ParsedAta } from './tokens'
import { ApiV3PoolInfoItem, Raydium } from '@raydium-io/raydium-sdk-v2'
import { SOL_ADDRESS, SOL_PUBKEY, USDC_PUBKEY } from './consts'
import { CoinGeckoClient, CoinListResponseItem } from 'coingecko-api-v3'

/**
 * @note Raydium SDK's pool response is wrongly typed, this is the right type for the fetchPoolByMints function
 */
export type RaydiumPools = {
    count: number
    data: ApiV3PoolInfoItem[]
    hasNextPage: boolean
}

/**
 * Use Jupiter to get swap quote
 * @param connection
 * @param tokenA
 * @param tokenB
 * @returns
 */
export async function getPrice(
    connection: Connection,
    tokenA: PublicKey,
    tokenB: PublicKey
) {
    const jupiter = createJupiterApiClient()

    // Using USDC as $, if it's comparing USDC to itself return 1
    if (tokenA.toString() === tokenB.toString()) {
        return 1
    }

    const decimalsA = await getDecimals(connection, tokenA)
    const decimalsB = await getDecimals(connection, tokenB)
    const amount = Math.pow(10, decimalsA)

    try {
        const quote = await jupiter.quoteGet({
            inputMint: tokenA.toString(), // Mint address of the input token
            outputMint: tokenB.toString(), // Mint address of the output token
            amount, // raw input amount of tokens
        })

        const price = +quote.outAmount
        return price / Math.pow(10, decimalsB)
    } catch {
        return 0
    }
}

export type ParsedHistoricalData = {
    prices: [number, number][]
}

export async function getHistoricalPrice(
    coingecko: CoinGeckoClient,
    id: string,
    timestamp: number
) {
    const prices = await coingecko.coinIdMarketChartRange({
        id,
        vs_currency: 'usd',
        from: timestamp - 7200,
        to: timestamp,
    })

    return prices.prices[prices.prices.length - 1][1] // return last price
}
