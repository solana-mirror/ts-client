import dotenv from 'dotenv'
import { Connection, PublicKey } from '@solana/web3.js'
import { CoinGeckoClient } from 'coingecko-api-v3'
import { fetchTokenAccounts, generateCoingeckoIds } from './tokens'
import { getHistoricalPrice, ParsedHistoricalData } from './price'
import {
    fetchFormattedTransactions,
    fetchTransactions,
    parseTransaction,
} from './transactions'

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

    // await generateCoingeckoIds(coingecko)

    const atas = await fetchTokenAccounts(connection, owner)

    const txs = await fetchTransactions(connection, owner, {
        batchSize: 50,
        fetchFirstBatches: 1,
    })

    console.log(await getHistoricalPrice(coingecko, 'billy', 1720494134))

    // const formattedTxs = await Promise.all(txs.map(async (tx) => await parseTransaction(coingecko, tx, owner)))
}

run().catch(console.error)
