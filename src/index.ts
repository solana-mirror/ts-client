import dotenv from 'dotenv'
import { Connection, PublicKey } from '@solana/web3.js'
import { CoinGeckoClient } from 'coingecko-api-v3'
import { fetchTokenAccounts } from './tokens'

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
            timeout: 10000,
            autoRetry: true,
        },
        process.env.COINGEKO
    )

    const atas = await fetchTokenAccounts(connection, coingecko, owner)

    console.log(atas)
}

run().catch(console.error)
