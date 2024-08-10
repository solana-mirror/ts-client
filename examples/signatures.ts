import { Connection, PublicKey } from '@solana/web3.js'
import { fetchSignatures, fetchTransactions } from '../src'
import { configDotenv } from 'dotenv'
import { createBatches } from '../src/utils'

const owner = new PublicKey('UC5D8acPVt4btdfxvEmNMDmwcotPoJjLvDfzS7kCZmf')

configDotenv()

async function run() {
    const rpc = process.env.RPC_ENDPOINT
    if (!rpc) {
        throw new Error('RPC not provided')
    }

    const customFetch = async (url, options) => {
        console.log('Request URL:', url)
        console.log('Request Options:', {
            method: options.method,
            body: options.body,
        })

        const response = await fetch(url, options)

        console.log('Response Status:', response.status)
        return response
    }

    // Provide the custom fetch function to the Connection
    const connection = new Connection(rpc, {
        fetch: customFetch,
        commitment: 'confirmed',
    })

    const txs = await fetchTransactions(connection, owner)

    console.log(txs.length)
}

run().catch(console.error)
