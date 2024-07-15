import { describe, test, expect } from '@jest/globals'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import {
    fetchTokenMetadataByMint,
    getDecimals,
    USDC_ADDRESS,
    USDC_PUBKEY,
} from '../src'
import { createBatches } from '../src/utils'
import { filterBalanceStates, getBalanceStates } from '../src/transactions'
import { BN } from 'bn.js'
import { configDotenv } from 'dotenv'
import { CoinGeckoClient } from 'coingecko-api-v3'
import SolanaMirror from '../src/SolanaMirror'

configDotenv()

const owner = new PublicKey('RAPExZp7b7UN8hyUu7kVnjfCeXoSQ9U6ywJuepJYbJH')

const TEST_ACCOUNT = new PublicKey(
    'GhCar5JLrUencisZDBLPFsWiWQs5qfimejpU5wjzgS8y'
)

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

const solanaMirror = new SolanaMirror({
    watch: TEST_ACCOUNT,
    connection,
    coingecko,
})

describe('Parent class', () => {
    test('Get correct watch address', () => {
        const testClient = new SolanaMirror({
            watch: TEST_ACCOUNT,
            connection,
            coingecko,
        })

        const watchAddress = testClient.getWatchAddress()
        expect(watchAddress).toStrictEqual(TEST_ACCOUNT)

        testClient.setWatchAddress(owner)
        expect(testClient.getWatchAddress()).toStrictEqual(owner)
    })
})

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
        const atas = await solanaMirror.getTokenAccounts()
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
    test('Get correct net worth', async () => {
        const netWorth = await solanaMirror.getNetWorth()

        // It adds the solana value to the USDC balance
        expect(netWorth).toBeGreaterThan(2)
    })
})

describe('Transactions', () => {
    test('Get correct batches', () => {
        const arr = new Array(20).fill(0, 0, 10).fill(1, 10, 20).fill(2, 20, 30)

        const batches = createBatches(arr, 10, 15)
        expect(batches[0]).toStrictEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        expect(batches[1]).toStrictEqual([1, 1, 1, 1, 1])

        const limitBatches = createBatches(arr, 10, 20)
        expect(limitBatches[0]).toStrictEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        expect(limitBatches[1]).toStrictEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    })
    test('Handle empty array', () => {
        const batches = createBatches([], 10)
        expect(batches).toStrictEqual([])
    })
    test('Get formatted transactions', async () => {
        const formattedTransactions = await solanaMirror.getTransactions()

        expect(formattedTransactions).toHaveLength(4)

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
        const txs = await solanaMirror.getTransactions()
        const balances = getBalanceStates(txs)

        expect(balances[0]).toStrictEqual({
            timestamp: 1720702580,
            balances: {
                So11111111111111111111111111111111111111112: {
                    amount: new BN(0.025 * LAMPORTS_PER_SOL),
                    formatted: 0.025,
                },
            },
        })

        expect(balances[1]).toStrictEqual({
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
        })

        expect(balances[balances.length - 1]).toStrictEqual({
            balances: {
                So11111111111111111111111111111111111111112: {
                    amount: new BN(0.008984229 * LAMPORTS_PER_SOL),
                    formatted: 0.008984229,
                },
                EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
                    amount: new BN(2000000),
                    formatted: 2,
                },
                '3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump': {
                    amount: new BN(1000000),
                    formatted: 1,
                },
                jTCmWBY9hussHxEX1mY9CdTqMmVDH1Mg9Tb8E321xgV: {
                    amount: new BN(1000000),
                    formatted: 1,
                },
            },
            timestamp: expect.any(Number),
        })
    })
    test('Get correct filtered states', async () => {
        const txs = await solanaMirror.getTransactions()
        const balanceStates = getBalanceStates(txs)
        const filteredStates = filterBalanceStates(balanceStates, {
            timeframe: 'D',
            range: 1000,
        })

        expect(filteredStates.length).toBeGreaterThan(1)

        // Daily close of the first day the wallet was active
        expect(filteredStates[0].timestamp).toBe(1720742400)

        expect(filteredStates[0]).toStrictEqual({
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
        })
    })
    test('Get correct total balances', async () => {
        const chartData = await solanaMirror.getChartData({
            timeframe: 'D',
            range: 1000,
        })

        expect(chartData[0]).toStrictEqual({
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
        })
    })
})
