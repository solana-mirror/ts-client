import { CoinGeckoClient } from 'coingecko-api-v3'
import fs from 'fs'

/**
 * Gets all the coingecko ids for the tokens and outputs a json file
 * with an object whose keys are the token addresses
 * @param coingecko
 */
export async function generateCoingeckoData(coingecko: CoinGeckoClient) {
    const tokens = await coingecko.coinList({
        include_platform: true,
    })

    const sortedTokens: Record<
        string,
        { name: string; id: string; symbol: string }
    > = {}

    for (const token of tokens) {
        const { platforms, name, id, symbol } = token

        if (!platforms?.solana || !name || !id || !symbol) {
            continue
        }
        sortedTokens[platforms.solana] = {
            name,
            id,
            symbol,
        }
    }

    fs.writeFile(
        'coingecko.json',
        JSON.stringify(sortedTokens, null, 2),
        {},
        () => {}
    )
}
