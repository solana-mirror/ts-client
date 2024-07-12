import { Connection, PublicKey } from '@solana/web3.js'
import { createBatches } from './utils'

type FetchTransactionsOpts = {
    batchSize: number
    fetchFirstBatches?: number
}

/**
 * Fetches all signatures of an address and parses transactions
 * @param connection
 * @param address
 * @param opts batchSize (100 by default), fetchFirstBatches
 * @returns parsed transactions
 */
export async function fetchTransactions(
    connection: Connection,
    address: PublicKey,
    opts?: FetchTransactionsOpts
) {
    const { batchSize, fetchFirstBatches } = opts || {
        batchSize: 100, // default batchSize
    }

    const txHashes = await connection.getSignaturesForAddress(address)

    const signatures = txHashes.map((hash) => {
        return hash.signature
    })

    const batches = createBatches(signatures, batchSize, fetchFirstBatches)

    const transactions = await Promise.all(
        batches.map(async (batch) => {
            return await connection.getParsedTransactions(batch, {
                maxSupportedTransactionVersion: 0,
            })
        })
    )
    return transactions.flat()
}
