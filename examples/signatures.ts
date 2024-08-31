import { PublicKey } from '@solana/web3.js'
import { configDotenv } from 'dotenv'
import { randomUUID } from 'crypto'
import axios, { AxiosInstance } from 'axios'
import fs from 'fs'
import { createBatches } from '../src/utils'

const owner = new PublicKey('UC5D8acPVt4btdfxvEmNMDmwcotPoJjLvDfzS7kCZmf')

const headers = {
    'Content-Type': 'application/json',
}

configDotenv()

async function getSignaturesForAddress(
    address: PublicKey,
    axiosClient: AxiosInstance
) {
    const rpc = process.env.RPC_ENDPOINT as string

    let before = undefined
    let shouldContinue = true
    const signatures: string[] = []

    while (shouldContinue) {
        const body = {
            jsonrpc: '2.0',
            id: randomUUID(),
            method: 'getSignaturesForAddress',
            params: [address.toBase58(), before && { before }],
        }

        try {
            const res = await axiosClient.post(rpc, body, {
                headers,
            })

            console.log('Response status:', res.status)

            const data = res.data.result

            const mapped = data.map((sig) => sig.signature)
            before = mapped[mapped.length - 1]
            signatures.push(...mapped)

            // Refetch only if the array is full
            if (data.length !== 1000) {
                shouldContinue = false
            }
        } catch (err) {
            console.log('Failed to fetch signatures', err.response.data)
        }
    }

    return signatures
}

async function run() {
    const rpc = process.env.RPC_ENDPOINT
    if (!rpc) {
        throw new Error('RPC not provided')
    }

    let axiosClient = axios.create()
    const sigs = await getSignaturesForAddress(owner, axiosClient)

    getTransactions(createBatches(sigs, 900)[0], axiosClient)
}

async function getTransactions(sigs: string[], axiosClient: AxiosInstance) {
    // rawdog the RPC
    const rpc = process.env.RPC_ENDPOINT as string

    const body = sigs.map((sig) => {
        return {
            method: 'getTransaction',
            jsonrpc: '2.0',
            params: [
                sig,
                {
                    commitment: 'confirmed',
                    maxSupportedTransactionVersion: 0,
                },
            ],
            id: randomUUID(),
        }
    })

    try {
        // console.log(body)
        console.time('fetch transactions')
        const res = await axiosClient.post(rpc, body, {
            headers,
        })

        console.log(res.status)
        console.timeEnd('fetch transactions')

        console.log(res.data[0].result.meta)
        console.log(res.data[0].result.transaction)
    } catch (err) {
        console.error('fetch()', err)
    }
}

run().catch(console.error)
