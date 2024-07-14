import dotenv from 'dotenv'
import { Connection, PublicKey } from '@solana/web3.js'
import { CoinGeckoClient } from 'coingecko-api-v3'
import { fetchTokenAccounts, generateCoingeckoIds } from './tokens'
import { getHistoricalPrice, ParsedHistoricalData } from './price'
import {
    fetchFormattedTransactions,
    fetchTransactions,
    filterBalanceStates,
    getBalanceStates,
    getChartData,
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

    const chartData = await getChartData(connection, owner, {
        timeframe: 'D',
        range: 14,
    })

    console.log(chartData)
}

run().catch(console.error)
