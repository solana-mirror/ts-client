import {
    fetchDigitalAssetWithAssociatedToken,
    mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
    Connection,
    LAMPORTS_PER_SOL,
    ParsedAccountData,
    PublicKey,
} from '@solana/web3.js'
import BN from 'bn.js'
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import { getPrice } from './price'
import { SOL_PUBKEY, USDC_PUBKEY } from './consts'
import { CoinGeckoClient } from 'coingecko-api-v3'

export type ParsedAta = {
    mint: PublicKey
    ata: PublicKey
    coingeckoId?: string
    decimals: number
    name: string
    symbol: string
    image: string
    price: number
    balance: {
        amount: BN
        formatted: number
    }
}

export async function fetchTokenAccounts(
    connection: Connection,
    coingecko: CoinGeckoClient,
    owner: PublicKey
) {
    const { value: atas } = await connection.getParsedTokenAccountsByOwner(
        owner,
        {
            programId: TOKEN_PROGRAM_ID,
        }
    )

    const parsedPromises = atas.map(async (ata) => {
        const info = ata.account.data.parsed.info
        const mint = new PublicKey(info.mint)

        const metadata = await fetchTokenMetadataByMint(connection, mint, owner)
        const price = await getPrice(connection, mint, USDC_PUBKEY)
        const coingeckoId = await getCoingeckoId(coingecko, mint)

        const spotToken: ParsedAta = {
            mint,
            ata: ata.pubkey,
            coingeckoId,
            decimals: info.tokenAmount.decimals,
            name: metadata?.metadata?.name || '',
            symbol: metadata?.metadata?.symbol || '',
            image: metadata?.metadata?.uri || '',
            price,
            balance: {
                amount: new BN(info.tokenAmount.amount),
                formatted: +info.tokenAmount.uiAmountString,
            },
        }

        return spotToken
    })

    const solPromise = (async () => {
        const balance = await connection.getBalance(owner)
        const formattedBalance = balance / LAMPORTS_PER_SOL
        const price = await getPrice(connection, SOL_PUBKEY, USDC_PUBKEY)
        const coingeckoId = await getCoingeckoId(coingecko, SOL_PUBKEY)

        const spotToken: ParsedAta = {
            mint: SOL_PUBKEY,
            ata: owner,
            coingeckoId,
            decimals: 9,
            name: 'Wrapped Solana',
            symbol: 'SOL',
            image: '',
            price,
            balance: {
                amount: new BN(balance),
                formatted: formattedBalance,
            },
        }

        return spotToken
    })()

    const parsedAtas = await Promise.all([...parsedPromises, solPromise])
    return parsedAtas
}

export async function fetchTokenMetadataByMint(
    connection: Connection,
    mint: PublicKey,
    owner: PublicKey
) {
    const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata())
    try {
        const asset = await fetchDigitalAssetWithAssociatedToken(
            umi,
            fromWeb3JsPublicKey(mint),
            fromWeb3JsPublicKey(owner)
        )
        return asset
    } catch {
        return null
    }
}

export async function getTokenData(connection: Connection, address: PublicKey) {
    return (await connection.getParsedAccountInfo(address)).value
        ?.data as ParsedAccountData
}

export async function getDecimals(
    connection: Connection,
    address: PublicKey
): Promise<number> {
    const data = await getTokenData(connection, address)
    return data.parsed.info.decimals
}

export async function getCoingeckoId(
    coingecko: CoinGeckoClient,
    token: PublicKey
) {
    const tokens = await coingecko.coinList({
        include_platform: true,
    })

    return tokens.find((x) => x.platforms?.solana === token.toString())?.id
}
