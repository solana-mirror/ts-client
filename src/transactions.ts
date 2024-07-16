import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    TokenBalance,
    TransactionSignature,
    VersionedTransactionResponse,
} from '@solana/web3.js'
import { createBatches } from './utils'
import BN from 'bn.js'
import { SOL_ADDRESS, USDC_PUBKEY } from './consts'
import dayjs from 'dayjs'
import { CoinGeckoClient } from 'coingecko-api-v3'
import coingeckoTokens from '../coingecko.json'
import {
    AmountWithPrice,
    BalanceChange,
    ChartData,
    ChartDataWithPrice,
    ParsedTransaction,
} from './types'
import { getPrice } from './price'

type FetchSignaturesOpts = {
    before?: TransactionSignature
    after?: TransactionSignature
    limit: number
}

export type FetchTransactionsOpts = {
    batchSize: number
    limit?: number
    includeFailed?: boolean
}

export type FilterBalanceStatesOpts = {
    timeframe: 'D' | 'H'
    range: number
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
    const { batchSize, limit, includeFailed } = opts || {
        batchSize: 100, // default batchSize
    }

    const signatures = await fetchSignatures(connection, address)
    const batches = createBatches(signatures, batchSize, limit)

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
    const balances: Record<string, BalanceChange> = {}

    // Handle SOL
    const ownerIdx = tx.transaction.message.staticAccountKeys.findIndex(
        (addr) => addr.toString() === signer.toString()
    )

    const preSol = tx.meta?.preBalances[ownerIdx] || 0
    const postSol = tx.meta?.postBalances[ownerIdx] || 0

    if (preSol !== postSol) {
        balances[SOL_ADDRESS] = {
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

    for (const preBalance of preTokenBalances) {
        const { mint, uiTokenAmount } = preBalance
        const { amount, uiAmount } = uiTokenAmount

        if (!balances[mint]) {
            balances[mint] = {
                pre: { amount: new BN(0), formatted: 0 },
                post: { amount: new BN(0), formatted: 0 },
            }
        }

        balances[mint].pre = {
            amount: new BN(amount),
            formatted: uiAmount || 0,
        }
    }

    for (const postBalance of postTokenBalances) {
        const { mint, uiTokenAmount } = postBalance
        const { amount, uiAmount } = uiTokenAmount

        if (!balances[mint]) {
            balances[mint] = {
                pre: { amount: new BN(0), formatted: 0 },
                post: { amount: new BN(0), formatted: 0 },
            }
        }

        balances[mint].post = {
            amount: new BN(amount),
            formatted: uiAmount || 0,
        }
    }

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
 * Walks through the tx array and adds up every balance change
 * @param txs
 */
export function getBalanceStates(txs: ParsedTransaction[]) {
    const states: ChartData[] = []

    for (const tx of txs) {
        const { blockTime, balances } = tx
        let state: ChartData

        if (states.length === 0) {
            state = {
                timestamp: blockTime,
                balances: {},
            }
        } else {
            state = {
                balances: { ...states[states.length - 1].balances },
                timestamp: blockTime,
            }
        }

        for (const [mint, balance] of Object.entries(balances)) {
            const { post } = balance

            // Remove 0 bals
            if (post.formatted === 0) {
                if (state.balances[mint]) {
                    delete state.balances[mint]
                }
                continue
            }

            if (
                !state.balances[mint] ||
                state.balances[mint].formatted !== post.formatted
            ) {
                state.balances[mint] = post
            }
        }

        states.push(state)
    }

    return states
}

/**
 * Filters the balance states to a specific timeframe and range
 * @param states
 * @param opts.timeframe "D" | "H"
 * @param opts.range number of days or hours
 */
export function filterBalanceStates(
    states: ChartData[],
    opts: FilterBalanceStatesOpts
) {
    const { timeframe, range } = opts
    const tSeconds = timeframe === 'D' ? 86400 : 3600

    // We're pushing here to make sure all the states up to now are included,
    // then we push this last state to the filtered states array
    const _states = [...states]
    _states.push({
        ...states[states.length - 1],
        timestamp: dayjs().unix(),
    })

    const filteredStates: ChartData[] = []

    const finalTimestamp = Math.floor(dayjs().unix() / tSeconds) * tSeconds
    const initialTimestamp = finalTimestamp - range * tSeconds

    let lastIdx = 0
    for (let i = 0; i <= range; i++) {
        const timestamp = initialTimestamp + i * tSeconds

        for (let j = lastIdx; j < _states.length; j++) {
            if (_states[j].timestamp >= timestamp) {
                if (j === 0) {
                    break
                }

                const stateToPush = { ..._states[j - 1], timestamp }
                filteredStates.push(stateToPush)
                lastIdx = j
                break
            }
        }

        // Fill empty periods
        if (
            filteredStates.length &&
            filteredStates[filteredStates.length - 1].timestamp !== timestamp
        ) {
            const stateToPush = { ...states[states.length - 1], timestamp }
            filteredStates.push(stateToPush)
        }
    }

    // We can simply push now after it did the checks
    filteredStates.push(_states[_states.length - 1])

    return filteredStates
}

/**
 * Matches coinGecko token prices with each transaction and returns formatted chartStates
 * @param coingecko
 * @param states
 */
export async function getTotalBalances(
    connection: Connection,
    coingecko: CoinGeckoClient,
    states: ChartData[]
) {
    const balances = states.map((state) => state.balances)
    const mints = balances.map((bal) => Object.keys(bal))
    const uniqueMints = [...new Set(mints.flat())]

    const coingeckoPrices = {}

    const from = states[0].timestamp
    const to = states.length === 1 ? from : states[states.length - 1].timestamp

    const diff = (to - from) / 86400
    // handle edge case in which coingecko returns daily data (more than 90 days)
    const timeStep = diff > 90 ? 86400 : 3600

    const newStates = [] as ChartDataWithPrice[]

    // Only fetch coingecko prices from the past, if from === to
    // The Jup price will be fetched
    if (from !== to) {
        for (const mint of uniqueMints) {
            const id = coingeckoTokens[mint]?.id
            if (!id) {
                continue
            }

            const { prices } = await coingecko.coinIdMarketChartRange({
                id,
                vs_currency: 'usd',
                from,
                to,
            })

            coingeckoPrices[mint] = prices
        }
    }

    for (let i = 0; i < states.length; i++) {
        const state = states[i]
        const { timestamp, balances: stateBals } = state
        const balsWithPrice = {} as Record<string, AmountWithPrice>

        for (const [mint, balance] of Object.entries(stateBals)) {
            const index = Math.floor((timestamp - from) / timeStep)

            const price = await (async () => {
                // Get current price from Jup for accurracy
                // Coingecko can be delayed up to 10-20 mins
                if (i === states.length - 1) {
                    return await getPrice(
                        connection,
                        new PublicKey(mint),
                        USDC_PUBKEY
                    )
                }
                if (!coingeckoPrices[mint]) {
                    return 0
                }
                return coingeckoPrices[mint][index][1]
            })()

            if (!price) {
                continue
            }

            balsWithPrice[mint] = {
                ...balance,
                price,
            }
        }

        const usdValue = Object.values(balsWithPrice).reduce(
            (total, { formatted, price }) => total + formatted * price,
            0
        )

        newStates.push({
            timestamp,
            balances: balsWithPrice,
            usdValue,
        })
    }

    return newStates
}
