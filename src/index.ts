import dotenv from 'dotenv'
import { Connection, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

import {
    fetchDigitalAssetWithAssociatedToken,
    mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

dotenv.config()

const rpc = process.env.RPC_ENDPOINT as string

const connection = new Connection(rpc, 'confirmed')

type SpotToken = {
    mint: PublicKey
    decimals: number
    symbol: string
    image: string
    price: {
        amount: BN
        formatted: number
    }
    balance: {
        amount: BN
        formatted: number
    }
}

async function fetchTokenAccounts(owner: string) {
    const ownerPublicKey = new PublicKey(owner)
    const { value: atas } = await connection.getParsedTokenAccountsByOwner(
        ownerPublicKey,
        {
            programId: TOKEN_PROGRAM_ID,
        }
    )

    const parsedPromises = atas.map(async (ata) => {
        const info = ata.account.data.parsed.info

        const metadata = await fetchTokenMetadataByMint(info)

        // Format the data
        const spotToken: SpotToken = {
            mint: new PublicKey(info.mint),
            decimals: info.tokenAmount.decimals,
            symbol: metadata?.metadata?.symbol || 'Unknown',
            image: metadata?.metadata?.uri || '',
            price: {
                amount: new BN(0),
                formatted: 0,
            },
            balance: {
                amount: info.tokenAmount.amount,
                formatted: +info.tokenAmount.uiAmountString,
            },
        }
        console.log(spotToken)
        return spotToken
    })

    const parsedAtas = await Promise.all(parsedPromises)
    return parsedAtas
}

async function fetchTokenMetadataByMint(info) {
    const umi = createUmi(rpc).use(mplTokenMetadata())
    try {
        const asset = await fetchDigitalAssetWithAssociatedToken(
            umi,
            info.mint,
            info.owner
        )
        return asset
    } catch {
        return null
    }
}

const ownerPublicKeyString = 'RAPExZp7b7UN8hyUu7kVnjfCeXoSQ9U6ywJuepJYbJH'
fetchTokenAccounts(ownerPublicKeyString)
