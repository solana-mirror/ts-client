import { describe, test, expect } from '@jest/globals'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import SolanaMirror from '../src/SolanaMirror'

const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const USDC_PUBKEY = new PublicKey(USDC_ADDRESS)

const owner = new PublicKey('RAPExZp7b7UN8hyUu7kVnjfCeXoSQ9U6ywJuepJYbJH')

const TEST_ACCOUNT = new PublicKey(
    'GhCar5JLrUencisZDBLPFsWiWQs5qfimejpU5wjzgS8y'
)

const solanaMirror = new SolanaMirror(TEST_ACCOUNT)

describe('Parent class', () => {
    test('Gets and sets address', () => {
        const testClient = new SolanaMirror(TEST_ACCOUNT)

        const watchAddress = testClient.getWatchAddress()
        expect(watchAddress).toStrictEqual(TEST_ACCOUNT)

        testClient.setWatchAddress(owner)
        expect(testClient.getWatchAddress()).toStrictEqual(owner)
    })
})

describe('Endpoints', () => {
    test('/accounts/<address>', async () => {
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
    test('/transactions/<address>', async () => {
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
    test('Get correct total balances', async () => {
        const chartData = await solanaMirror.getChartData(255, 'd')

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
    }, 15000)
})
