import {
    ConfirmedSignatureInfo,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    TokenBalance,
    Transaction,
    TransactionSignature,
    VersionedTransactionResponse,
} from '@solana/web3.js'
import { createBatches } from './utils'
import BN from 'bn.js'
import { SOL_ADDRESS } from './consts'

type FetchTransactionsOpts = {
    batchSize: number
    fetchFirstBatches?: number
    includeFailed?: boolean
}

type FormattedAmount = {
    amount: BN
    formatted: number
}

type Balance = {
    price: FormattedAmount
    pre: FormattedAmount
    post: FormattedAmount
}

type ParsedTransaction = {
    blockTime: number
    signatures: string[]
    logs: string[]
    balances: Record<string, Balance>
    parsedInstructions: string[] // Parsed ixs from the tx log
}

type FetchSignaturesOpts = {
    before?: TransactionSignature
    after?: TransactionSignature
    limit: number
}

/**
 * Fetches signatures of an address
 * @param connection
 * @param address
 * @param opts before and after unix timestamps
 */
export async function fetchSignatures(
    connection: Connection,
    address: PublicKey,
    opts?: FetchSignaturesOpts
) {
    const { before, after, limit } = opts || {}
    const signatures = await connection.getSignaturesForAddress(address, {
        before,
        until: after,
        limit,
    })
    return signatures.map((sig) => sig.signature)
}

/**
 * Fetches all signatures of an address and parses transactions
 * @param connection
 * @param address
 * @param opts batchSize (100 by default), fetchFirstBatches, includeFailed (false by default)
 * @returns parsed transactions
 */
export async function fetchTransactions(
    connection: Connection,
    address: PublicKey,
    opts?: FetchTransactionsOpts
) {
    const { batchSize, fetchFirstBatches, includeFailed } = opts || {
        batchSize: 100, // default batchSize
    }

    const signatures = await fetchSignatures(connection, address)
    const batches = createBatches(signatures, batchSize, fetchFirstBatches)

    const transactions = await Promise.all(
        batches.map(async (batch) => {
            return await connection.getTransactions(batch, {
                maxSupportedTransactionVersion: 0,
            })
        })
    )

    const flat = transactions
        .flat()
        .sort(
            (a, b) => (a?.blockTime || 0) - (b?.blockTime || 0)
        ) as VersionedTransactionResponse[]
    return includeFailed ? flat : flat.filter((tx) => tx?.meta?.err === null)
}

/**
 * Transforms the RPC transaction into a readable format
 * @param tx Versioned tx only
 * @param signer The address that we're tracking
 * @returns Parsed transaction
 */
export function parseTransaction(
    tx: VersionedTransactionResponse,
    signer: PublicKey
) {
    const balances: Record<string, Balance> = {}

    // Handle SOL
    const ownerIdx = tx.transaction.message.staticAccountKeys.findIndex(
        (addr) => addr.toString() === signer.toString()
    )

    const preSol = tx.meta?.preBalances[ownerIdx] || 0
    const postSol = tx.meta?.postBalances[ownerIdx] || 0

    if (preSol !== postSol) {
        balances[SOL_ADDRESS] = {
            price: { amount: new BN(0), formatted: 0 },
            pre: {
                amount: new BN(preSol),
                formatted: preSol / LAMPORTS_PER_SOL,
            },
            post: {
                amount: new BN(postSol),
                formatted: postSol / LAMPORTS_PER_SOL,
            },
        }
    }

    // Handle SPL
    const preTokenBalances = tx.meta?.preTokenBalances?.filter(
        (preBalance) => preBalance.owner === signer.toString()
    ) as TokenBalance[]
    const postTokenBalances = tx.meta?.postTokenBalances?.filter(
        (postBalance) => postBalance.owner === signer.toString()
    ) as TokenBalance[]

    preTokenBalances.forEach((preBalance) => {
        const { mint, uiTokenAmount } = preBalance
        const { amount, uiAmount } = uiTokenAmount

        if (!balances[mint]) {
            balances[mint] = {
                price: { amount: new BN(0), formatted: 0 },
                pre: { amount: new BN(0), formatted: 0 },
                post: { amount: new BN(0), formatted: 0 },
            }
        }

        balances[mint].pre = {
            amount: new BN(amount),
            formatted: uiAmount || 0,
        }
    })

    postTokenBalances.forEach((postBalance) => {
        const { mint, uiTokenAmount } = postBalance
        const { amount, uiAmount } = uiTokenAmount

        if (!balances[mint]) {
            balances[mint] = {
                price: { amount: new BN(0), formatted: 0 },
                pre: { amount: new BN(0), formatted: 0 },
                post: { amount: new BN(0), formatted: 0 },
            }
        }

        balances[mint].post = {
            amount: new BN(amount),
            formatted: uiAmount || 0,
        }
    })

    const instructions =
        tx.meta?.logMessages
            ?.filter((log) => {
                return log.startsWith('Program log: Instruction: ')
            })
            .map((log) => {
                return log.replace('Program log: Instruction: ', '')
            }) || []

    const parsedTx: ParsedTransaction = {
        blockTime: tx.blockTime || -1,
        signatures: tx.transaction.signatures,
        logs: tx.meta?.logMessages || [],
        balances,
        parsedInstructions: instructions,
    }

    return parsedTx
}

/**
 * Fetches the transactions for an address and formats them
 * @param connection
 * @param address
 * @param opts
 * @returns Formatted transactions
 */
export async function fetchFormattedTransactions(
    connection: Connection,
    address: PublicKey,
    opts?: FetchTransactionsOpts
) {
    const txs = await fetchTransactions(connection, address, opts)
    return txs.map((tx) => parseTransaction(tx, address))
}
