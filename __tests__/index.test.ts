import { describe, test, expect } from '@jest/globals'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import {
    fetchTokenAccounts,
    fetchTokenMetadataByMint,
    getDecimals,
} from '../src/tokens'
import { USDC_ADDRESS, USDC_PUBKEY } from '../src/consts'
import { createBatches, getNetWorth } from '../src/utils'
import {
    fetchFormattedTransactions,
    fetchTransactions,
    filterBalanceStates,
    getBalanceStates,
    getChartData,
    getTotalBalances,
} from '../src/transactions'
import { BN } from 'bn.js'
import { configDotenv } from 'dotenv'
import { CoinGeckoClient } from 'coingecko-api-v3'

configDotenv()

const rpc = process.env.RPC_ENDPOINT
if (!rpc) {
    throw new Error('RPC not provided')
}

const connection = new Connection(rpc, 'confirmed')

const coingecko = new CoinGeckoClient(
    {
        timeout: 40000,
        autoRetry: true,
    },
    process.env.COINGEKO
)

// Test account only has USDC ATA, with balance of 2 USDC
const TEST_ACCOUNT = new PublicKey(
    'GhCar5JLrUencisZDBLPFsWiWQs5qfimejpU5wjzgS8y'
)

describe('Formatting tokens', () => {
    test('Gets correct metadata for USDC', async () => {
        const metadata = await fetchTokenMetadataByMint(
            connection,
            USDC_PUBKEY,
            TEST_ACCOUNT
        )

        // Use separate getDecimals function to test it standalone
        const decimals = await getDecimals(connection, USDC_PUBKEY)

        expect(metadata?.metadata?.symbol).toEqual('USDC')
        expect(metadata?.metadata?.name).toEqual('USD Coin')
        expect(decimals).toEqual(6)
    }, 10000)
    test('Gets correct ATAs for test account', async () => {
        const atas = await fetchTokenAccounts(connection, TEST_ACCOUNT)
        const usdcAta = atas.find((ata) => ata.mint.toString() === USDC_ADDRESS)

        expect(usdcAta).toStrictEqual({
            mint: USDC_PUBKEY,
            ata: new PublicKey('Xs5AGA129VSQ1KoYuiftwSF5iCzGeskoxiZFyUudaav'),
            coingeckoId: 'usd-coin',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
            image: expect.any(String),
            price: 1,
            balance: {
                amount: new BN(2000000),
                formatted: 2,
            },
        })
    })
})

describe('Transactions', () => {
    test('Get correct batches', () => {
        const arr = new Array(20).fill(0, 0, 10).fill(1, 10, 20)

        const batches = createBatches(arr, 10)

        expect(batches[0]).toStrictEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        expect(batches[1]).toStrictEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    })
    test('Handle empty array', () => {
        const batches = createBatches([], 10)
        expect(batches).toStrictEqual([])
    })
    test('Get formatted transactions', async () => {
        const formattedTransactions = await fetchFormattedTransactions(
            connection,
            TEST_ACCOUNT
        )

        expect(formattedTransactions).toHaveLength(2)

        // SOL transfer of 0.025
        expect(formattedTransactions[0]).toStrictEqual({
            blockTime: expect.any(Number),
            signatures: expect.any(Array),
            logs: expect.any(Array),
            balances: {
                So11111111111111111111111111111111111111112: {
                    pre: {
                        amount: new BN(0),
                        formatted: 0,
                    },
                    post: {
                        amount: new BN(0.025 * LAMPORTS_PER_SOL),
                        formatted: 0.025,
                    },
                },
            },
            parsedInstructions: [],
        })

        expect(formattedTransactions[1]).toStrictEqual({
            blockTime: expect.any(Number),
            signatures: expect.any(Array),
            logs: expect.any(Array),
            balances: {
                EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
                    pre: {
                        amount: new BN(0),
                        formatted: 0,
                    },
                    post: {
                        amount: new BN(2000000),
                        formatted: 2,
                    },
                },
                So11111111111111111111111111111111111111112: {
                    pre: {
                        amount: new BN(0.025 * LAMPORTS_PER_SOL),
                        formatted: 0.025,
                    },
                    post: {
                        amount: new BN(0.008984229 * LAMPORTS_PER_SOL),
                        formatted: 0.008984229,
                    },
                },
            },
            parsedInstructions: expect.any(Array),
        })
    }, 10000)
})

describe('Chart data', () => {
    test('Get correct historical balances for test account', async () => {
        const txs = await fetchFormattedTransactions(connection, TEST_ACCOUNT)

        const balances = getBalanceStates(txs)

        expect(balances).toStrictEqual([
            {
                timestamp: 1720702580,
                balances: {
                    So11111111111111111111111111111111111111112: {
                        amount: new BN(0.025 * LAMPORTS_PER_SOL),
                        formatted: 0.025,
                    },
                },
            },
            {
                balances: {
                    So11111111111111111111111111111111111111112: {
                        amount: new BN(0.008984229 * LAMPORTS_PER_SOL),
                        formatted: 0.008984229,
                    },
                    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
                        amount: new BN(2000000),
                        formatted: 2,
                    },
                },
                timestamp: 1720702648,
            },
        ])
    })
    test('Get correct filtered states', async () => {
        const txs = await fetchFormattedTransactions(connection, TEST_ACCOUNT)
        const balanceStates = getBalanceStates(txs)
        const filteredStates = filterBalanceStates(balanceStates, {
            timeframe: 'D',
            range: 1000,
        })
        expect(filteredStates).toStrictEqual([
            {
                balances: {
                    So11111111111111111111111111111111111111112: {
                        amount: expect.any(BN),
                        formatted: 0.008984229,
                    },
                    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
                        amount: expect.any(BN),
                        formatted: 2,
                    },
                },
                timestamp: expect.any(Number),
            },
        ])
    })
    test('Get correct total balances', async () => {
        const chartData = await getChartData(
            connection,
            coingecko,
            TEST_ACCOUNT,
            {
                timeframe: 'D',
                range: 1000,
            }
        )

        const atas = await fetchTokenAccounts(connection, TEST_ACCOUNT)
        const currentBalance = getNetWorth(atas)

        expect(chartData).toStrictEqual([
            {
                timestamp: expect.any(Number),
                balances: {
                    So11111111111111111111111111111111111111112: {
                        amount: new BN(0.008984229 * LAMPORTS_PER_SOL),
                        formatted: 0.008984229,
                        price: expect.any(Number),
                    },
                    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
                        amount: new BN(2000000),
                        formatted: 2,
                        price: expect.any(Number),
                    },
                },
                usdValue: expect.any(Number),
            },
        ])
    })
})
