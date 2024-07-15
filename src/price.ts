import { createJupiterApiClient } from '@jup-ag/api'
import { Connection, PublicKey } from '@solana/web3.js'
import { getDecimals } from './tokens'
import { CoinGeckoClient } from 'coingecko-api-v3'

/**
 * Use Jupiter to get swap quote
 * @param connection
 * @param tokenA
 * @param tokenB
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

    const quote = await jupiter.quoteGet({
        inputMint: tokenA.toString(), // Mint address of the input token
        outputMint: tokenB.toString(), // Mint address of the output token
        amount, // raw input amount of tokens
    })

    const price = +quote.outAmount
    return price / Math.pow(10, decimalsB)
}
