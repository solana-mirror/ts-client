import { PublicKey } from '@solana/web3.js'
import {
    ChartDataWithPrice,
    ParsedAta,
    Timeframe,
    ParsedTransaction,
} from './types'
import { configDotenv } from 'dotenv'
import BN from 'bn.js'

configDotenv()

export default class SolanaMirror {
    private watch: PublicKey
    private baseUrl: string

    /**
     * @param args.watch The address to watch
     */
    constructor(watch: PublicKey) {
        this.watch = watch

        // Check env for dev value
        const env = process.env.SM_ENVIRONMENT
        if (env == 'dev') {
            this.baseUrl = 'http://localhost:8000'
        } else {
            this.baseUrl = 'https://api.solanamirror.xyz'
        }
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
        const endpoint = `/accounts/${this.watch}`
        const res = await fetch(this.baseUrl + endpoint)

        if (!res.ok) {
            throw new Error(
                `${endpoint} failed with status ${res.status}: ${res.statusText}`
            )
        }

        const json = (await res.json()) as ParsedAta<string>[]
        const parsed: ParsedAta<BN>[] = json.map((x) => ({
            ...x,
            ata: new PublicKey(x.ata),
            mint: new PublicKey(x.mint),
            balance: {
                ...x.balance,
                amount: new BN(x.balance.amount),
            },
        }))

        return parsed
    }

    /**
     * Fetches transactions for the watched address and parses them
     */
    async getTransactions() {
        const endpoint = `/transactions/${this.watch}`
        const res = await fetch(this.baseUrl + endpoint)

        if (!res.ok) {
            throw new Error(
                `${endpoint} failed with status ${res.status}: ${res.statusText}`
            )
        }

        const json = (await res.json()) as ParsedTransaction<string>[] // Parsing as ParsedTransaction<string>[] first
        const parsed: ParsedTransaction<BN>[] = json.map((x) => ({
            ...x,
            balances: Object.fromEntries(
                Object.entries(x.balances).map(([key, value]) => [
                    key,
                    {
                        pre: {
                            ...value.pre,
                            amount: new BN(value.pre.amount),
                        },
                        post: {
                            ...value.post,
                            amount: new BN(value.post.amount),
                        },
                    },
                ])
            ),
        }))

        return parsed
    }

    /**
     * Fetches transactions for the watched address, filters them, and returns a chart of the balance over time
     * @param timeframe Either daily ("D") or hourly ("H")
     * @param range Amount of timeframes to include. Hourly range max is 90d
     */
    async getChartData(range: number, timeframe: Timeframe) {
        const endpoint = `/chart/${this.watch}/${range}${timeframe}`
        const res = await fetch(this.baseUrl + endpoint)

        if (!res.ok) {
            throw new Error(
                `${endpoint} failed with status ${res.status}: ${res.statusText}`
            )
        }

        const json = (await res.json()) as ChartDataWithPrice<string>[]
        const parsed: ChartDataWithPrice<BN>[] = json.map((x) => ({
            ...x,
            balances: Object.fromEntries(
                Object.entries(x.balances).map(([key, value]) => [
                    key,
                    {
                        ...value,
                        amount: new BN(value.amount),
                    },
                ])
            ),
        }))

        return parsed
    }
}
