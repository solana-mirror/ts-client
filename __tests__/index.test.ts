import { describe, test, expect } from '@jest/globals'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import SolanaMirror from '../src/SolanaMirror'
import {
    ChartDataWithPrice,
    ParsedAta,
    TransactionResponse,
} from '../src/types'

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
        const atas = (await solanaMirror.getTokenAccounts({
            parse: true,
        })) as ParsedAta<BN, PublicKey>[]
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
        const formattedTransactions = (await solanaMirror.getTransactions({
            parse: true,
        })) as TransactionResponse<BN>

        expect(formattedTransactions.transactions[0]).toStrictEqual({
            blockTime: expect.any(Number),
            signatures: [
                '5bR8rn837e7B17nojiEjCZLR3Uy5fWfbS9f2HeWFTHv1one8nQvhBqj5uAeZL94CfLGfmJpPW3nmYk9NWPacV1uG',
            ],
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

        expect(formattedTransactions.transactions[1]).toStrictEqual({
            blockTime: expect.any(Number),
            signatures: [
                'iuX8sPiXzmaBBiWntPTux3mT23cp9C9i7LdeLciRhnD6WN8ibA22x4a25E9sSVyj5d5oLYt5q1XvPMZrPQyU4a3',
            ],
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
            parsedInstructions: [
                'GetAccountDataSize',
                'InitializeImmutableOwner',
                'InitializeAccount3',
                'SyncNative',
                'GetAccountDataSize',
                'InitializeImmutableOwner',
                'InitializeAccount3',
                'SharedAccountsExactOutRoute',
                'TransferChecked',
                'Swap',
                'Transfer',
                'Transfer',
                'Swap',
                'Transfer',
                'Transfer',
                'Transfer',
                'Transfer',
                'TransferChecked',
                'CloseAccount',
            ],
        })
    }, 25000)
    test('/chart/<address>/<timeframe>', async () => {
        const chartData = (await solanaMirror.getChartData(255, 'd', {
            parse: true,
        })) as ChartDataWithPrice<BN>[]

        expect(chartData[0]).toStrictEqual({
            timestamp: expect.any(Number),
            balances: {
                So11111111111111111111111111111111111111112: {
                    amount: {
                        amount: new BN(0.008984229 * LAMPORTS_PER_SOL),
                        formatted: 0.008984229,
                    },
                    price: expect.any(Number),
                },
                EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
                    amount: {
                        amount: new BN(2000000),
                        formatted: 2,
                    },
                    price: expect.any(Number),
                },
            },
            usdValue: expect.any(Number),
        })
    }, 25000)
})
