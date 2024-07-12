import { describe, test, expect } from '@jest/globals'
import { Connection, PublicKey } from '@solana/web3.js'
import {
    fetchTokenAccounts,
    fetchTokenMetadataByMint,
    getDecimals,
} from '../src/tokens'
import { USDC_ADDRESS, USDC_PUBKEY } from '../src/consts'
import { createBatches, getBalance } from '../src/utils'
import { fetchTransactions } from '../src/transactions'
import { BN } from 'bn.js'
import { configDotenv } from 'dotenv'

configDotenv()

const rpc = process.env.RPC_ENDPOINT
if (!rpc) {
    throw new Error('RPC not provided')
}
const connection = new Connection(rpc, 'confirmed')

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
    })
    test('Gets correct ATAs for test account', async () => {
        const atas = await fetchTokenAccounts(connection, TEST_ACCOUNT)
        const usdcAta = atas.find((ata) => ata.mint.toString() === USDC_ADDRESS)

        expect(usdcAta).toStrictEqual({
            mint: USDC_PUBKEY,
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
    test('Get balance', async () => {
        const accs = await fetchTokenAccounts(connection, TEST_ACCOUNT)
        const balance = getBalance(accs)

        expect(typeof balance).toStrictEqual('number')
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
    test('Get transactions', async () => {
        const transactions = await fetchTransactions(connection, TEST_ACCOUNT)
        expect(transactions).toHaveLength(2)
        expect(transactions[0]).toStrictEqual({
            blockTime: expect.any(Number),
            meta: {
                computeUnitsConsumed: expect.any(Number),
                err: null, // receive all txs successfully
                fee: expect.any(Number),
                innerInstructions: expect.any(Array),
                logMessages: expect.any(Array),
                postBalances: expect.any(Array),
                postTokenBalances: expect.any(Array),
                preBalances: expect.any(Array),
                preTokenBalances: expect.any(Array),
                rewards: expect.any(Array),
                status: expect.any(Object),
            },
            slot: expect.any(Number),
            transaction: {
                message: expect.any(Object),
                signatures: expect.any(Array),
            },
            version: 0,
        }) // receive Solana + swap
    })
})
