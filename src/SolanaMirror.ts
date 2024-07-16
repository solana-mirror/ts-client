import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { CoinGeckoClient } from 'coingecko-api-v3'
import {
    FetchTransactionsOpts,
    filterBalanceStates,
    FilterBalanceStatesOpts,
    getBalanceStates,
    getTotalBalances,
} from './transactions'
import { fetchTransactions, parseTransaction } from './transactions'
import {
    ChartDataWithPrice,
    getPrice,
    parseAta,
    ParsedAta,
    SOL_ADDRESS,
    SOL_PUBKEY,
    USDC_PUBKEY,
} from '.'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import coingeckoTokens from '../coingecko.json'
import { BN } from 'bn.js'

interface ISolanaMirrorArgs {
    watch: PublicKey
    connection: Connection
    coingecko: CoinGeckoClient
}

export default class SolanaMirror {
    private watch: PublicKey
    private connection: Connection
    private coingecko: CoinGeckoClient

    /**
     * @param args.watch The address to watch
     * @param args.connection
     * @param args.coingecko
     */
    constructor(args: ISolanaMirrorArgs) {
        const { watch, connection, coingecko } = args
        this.watch = watch
        this.coingecko = coingecko
        this.connection = connection
    }

    /**
     * @returns The address being watched
     */
    getWatchAddress() {
        return this.watch
    }

    /**
     * Changes the address being watched
     * @param address
     */
    setWatchAddress(address: PublicKey) {
        this.watch = address
    }

    /**
     * Gets the ATAs for an account and token info for each
     * @todo Migrate to [Solana.fm](https://api.solana.fm/v1/addresses/{account-hash}/tokens) endpoint once it's not in beta anymore
     */
    async getTokenAccounts() {
        const { connection, watch } = this
        const { value: atas } = await connection.getParsedTokenAccountsByOwner(
            this.watch,
            {
                programId: TOKEN_PROGRAM_ID,
            }
        )

        const parsedPromises = atas.map(async (ata) =>
            parseAta(connection, watch, ata)
        )

        // Hardcode SOL as it's not included in the ATAs
        const solPromise = (async () => {
            const balance = await connection.getBalance(watch)
            const formattedBalance = balance / LAMPORTS_PER_SOL
            const price = await getPrice(connection, SOL_PUBKEY, USDC_PUBKEY)
            const coingeckoId = coingeckoTokens[SOL_ADDRESS].id

            const spotToken: ParsedAta = {
                mint: SOL_PUBKEY,
                ata: watch,
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

    /**
     * Takes in all the atas and returns price * balance for each
     * @returns USD value of all tokens
     */
    async getNetWorth() {
        const accs = await this.getTokenAccounts()
        let balance = 0
        for (let i = 0; i < accs.length; i++) {
            balance += accs[i].price * accs[i].balance.formatted
        }
        return +balance.toFixed(2)
    }

    /**
     * Fetches transactions for the watched address and parses them
     * @param opts.batchSize Split transactions into batches of this size
     * @param opts.limit Fetch this many batches of transactions
     * @param opts.includeFailed Include failed transactions
     */
    async getTransactions(opts?: FetchTransactionsOpts) {
        const txs = await fetchTransactions(this.connection, this.watch, opts)
        return txs.map((tx) => parseTransaction(tx, this.watch))
    }

    /**
     * Fetches transactions for the watched address, filters them, and returns a chart of the balance over time
     * @param filterOpts.timeframe Either daily ("D") or hourly ("H")
     * @param filterOpts.range Amount of timeframes to include. Hourly range max is 90d
     * @param fetchTxOpts.batchSize Split transactions into batches of this size
     * @param fetchTxOpts.limit Fetch this many batches of transactions
     * @param fetchTxOpts.includeFailed Include failed transactions
     */
    async getChartData(
        filterOpts: FilterBalanceStatesOpts,
        fetchTxOpts?: FetchTransactionsOpts
    ) {
        const txs = await this.getTransactions(fetchTxOpts)

        const { timeframe, range } = filterOpts
        if (timeframe === 'H' && range > 90 * 24) {
            return [] as ChartDataWithPrice[]
        }

        const states = getBalanceStates(txs)
        const filteredStates = filterBalanceStates(states, filterOpts)
        const chartWithBalances = getTotalBalances(
            this.connection,
            this.coingecko,
            filteredStates
        )

        return chartWithBalances
    }
}
