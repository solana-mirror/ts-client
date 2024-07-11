import dotenv from 'dotenv'
import { Connection, PublicKey } from '@solana/web3.js'
import { fetchTokenAccounts } from './tokens'

dotenv.config()

async function run() {
    const rpc = process.env.RPC_ENDPOINT
    if (!rpc) {
        throw new Error('RPC not provided')
    }
    const connection = new Connection(rpc, 'confirmed')
    const owner = new PublicKey('RAPExZp7b7UN8hyUu7kVnjfCeXoSQ9U6ywJuepJYbJH')

    const accs = await fetchTokenAccounts(connection, owner)
    console.log(accs)
}

run().catch(console.error)
