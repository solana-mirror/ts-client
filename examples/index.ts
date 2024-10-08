import dotenv from 'dotenv'
import { PublicKey } from '@solana/web3.js'
import SolanaMirror from '../src/SolanaMirror'

const TEST_ACCOUNT = new PublicKey(
    'GhCar5JLrUencisZDBLPFsWiWQs5qfimejpU5wjzgS8y'
)

dotenv.config()

async function run() {
    const client = new SolanaMirror(TEST_ACCOUNT)
    const txs = await client.getChartData(80, 'd', false)

    console.log(txs)
}

run().catch(console.error)
