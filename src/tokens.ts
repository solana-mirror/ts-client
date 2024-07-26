import { USDC_PUBKEY, ParsedAta, getPrice, AssociatedTokenAccount } from '.'
import {
    fetchDigitalAssetWithAssociatedToken,
    mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import coingecko from '../coingecko.json'

// infer type from the json
const coingeckoTokens = coingecko

/**
 * Parses an ATA returned by the `connection` class
 * @param connection
 * @param ata
 * @returns
 */
export async function parseAta(
    connection: Connection,
    owner: PublicKey,
    ata: AssociatedTokenAccount
) {
    const info = ata.account.data.parsed.info
    const mint = new PublicKey(info.mint)

    const metadata = await fetchTokenMetadataByMint(connection, mint, owner)
    const price = await getPrice(connection, mint, USDC_PUBKEY)

    const name = metadata?.metadata.name || ''
    const symbol = metadata?.metadata.symbol || ''
    const image = metadata?.metadata.uri || ''
    const coingeckoId = coingeckoTokens[mint.toString()]?.id

    const spotToken: ParsedAta = {
        mint,
        ata: ata.pubkey,
        coingeckoId,
        decimals: info.tokenAmount.decimals,
        name,
        symbol,
        image,
        price,
        balance: {
            amount: new BN(info.tokenAmount.amount),
            formatted: +info.tokenAmount.uiAmountString,
        },
    }

    return spotToken
}

/**
 * Gets the metadata of a token
 * @param connection
 * @param mint
 * @param owner
 */
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

/**
 * Gets the data of an address
 * @param connection
 * @param address
 */
export async function getTokenData(connection: Connection, address: PublicKey) {
    return (await connection.getParsedAccountInfo(address)).value
        ?.data as ParsedAccountData
}

/**
 * Gets the ata for a token and returns its decimals
 * @param connection
 * @param address
 */
export async function getDecimals(
    connection: Connection,
    address: PublicKey
): Promise<number> {
    const data = await getTokenData(connection, address)
    return data.parsed.info.decimals
}
