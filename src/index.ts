import dotenv from 'dotenv'
import {
    Connection,
    PublicKey,
    VersionedTransaction,
    VersionedTransactionResponse,
} from '@solana/web3.js'
import { fetchTokenAccounts } from './tokens'
import {
    fetchFormattedTransactions,
    fetchTransactions,
    parseTransaction,
} from './transactions'
import { getBalance } from './utils'

dotenv.config()

async function run() {
    const rpc = process.env.RPC_ENDPOINT
    if (!rpc) {
        throw new Error('RPC not provided')
    }
    const connection = new Connection(rpc, 'confirmed')
    const owner = new PublicKey('RAPExZp7b7UN8hyUu7kVnjfCeXoSQ9U6ywJuepJYbJH')

    const txs = await fetchFormattedTransactions(connection, owner)
}

run().catch(console.error)
