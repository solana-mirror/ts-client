import dotenv from 'dotenv'
import { Connection, PublicKey } from '@solana/web3.js'
import { CoinGeckoClient } from 'coingecko-api-v3'
import { fetchTokenAccounts } from './tokens'
import { getHistoricalPrice, ParsedHistoricalData } from './price'

dotenv.config()

async function run() {
    const rpc = process.env.RPC_ENDPOINT
    if (!rpc) {
        throw new Error('RPC not provided')
    }
    const connection = new Connection(rpc, 'confirmed')
    const owner = new PublicKey('RAPExZp7b7UN8hyUu7kVnjfCeXoSQ9U6ywJuepJYbJH')

    const coingecko = new CoinGeckoClient(
        {
            timeout: 40000,
            autoRetry: true,
        },
        process.env.COINGEKO
    )

    const atas = await fetchTokenAccounts(connection, coingecko, owner)

    const timestamp = 1720818000

    const validAtas = atas.filter((ata) => ata.coingeckoId)

    if (!validAtas[2].coingeckoId) {
        return
    }

    const data = await getHistoricalPrice(
        coingecko,
        validAtas[2].coingeckoId,
        timestamp
    )

    console.log(data)
}

run().catch(console.error)
