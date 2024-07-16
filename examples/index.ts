require('tsconfig-paths')
import dotenv from 'dotenv'
import { Connection, PublicKey } from '@solana/web3.js'
import { CoinGeckoClient } from 'coingecko-api-v3'
import SolanaMirror from '../src/SolanaMirror'

const owner = new PublicKey('RAPExZp7b7UN8hyUu7kVnjfCeXoSQ9U6ywJuepJYbJH')

const TEST_ACCOUNT = new PublicKey(
    'GhCar5JLrUencisZDBLPFsWiWQs5qfimejpU5wjzgS8y'
)

dotenv.config()

async function run() {
    const rpc = process.env.RPC_ENDPOINT
    if (!rpc) {
        throw new Error('RPC not provided')
    }
    const connection = new Connection(rpc, 'confirmed')

    const coingecko = new CoinGeckoClient(
        {
            timeout: 40000,
            autoRetry: true,
        },
        process.env.COINGEKO
    )

    const client = new SolanaMirror({
        watch: TEST_ACCOUNT,
        connection,
        coingecko,
    })

    const chartData = await client.getChartData({
        timeframe: 'D',
        range: 14,
    })
}

run().catch(console.error)
