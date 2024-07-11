import { describe, test, expect } from '@jest/globals'
import { Connection, PublicKey } from '@solana/web3.js'
import {
    fetchTokenAccounts,
    fetchTokenMetadataByMint,
    getDecimals,
} from '../src/tokens'
import { USDC_PUBKEY } from '../src/consts'
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

        // Use sepatate getDecimals function to test it standalone
        const decimals = await getDecimals(connection, USDC_PUBKEY)

        expect(metadata?.metadata?.symbol).toEqual('USDC')
        expect(metadata?.metadata?.name).toEqual('USD Coin')
        expect(decimals).toEqual(6)
    })
    test('Gets correct ATAs for test account', async () => {
        const atas = await fetchTokenAccounts(connection, TEST_ACCOUNT)

        expect(atas).toStrictEqual([
            {
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
            },
        ])
    })
})
