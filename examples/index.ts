import dotenv from 'dotenv'
import { PublicKey } from '@solana/web3.js'
import SolanaMirror from '../src/SolanaMirror'

const TEST_ACCOUNT = new PublicKey(
    'GhCar5JLrUencisZDBLPFsWiWQs5qfimejpU5wjzgS8y'
)

dotenv.config()

async function run() {
    const rpc = process.env.RPC_ENDPOINT
    if (!rpc) {
        throw new Error('Missing RPC_ENDPOINT')
    }

    const client = new SolanaMirror({
        watch: TEST_ACCOUNT,
        rpc,
    })

    const chartData = await client.getChartData({
        timeframe: 'D',
        range: 14,
    })

    console.log(chartData)
}

run().catch(console.error)
