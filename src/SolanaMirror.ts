import { PublicKey } from '@solana/web3.js'
import { Timeframe } from './types'
import {
    FetchOpts,
    getChartData,
    getTokenAccounts,
    getTransactions,
} from './functions'

export default class SolanaMirror {
    private watch: PublicKey

    /**
     * @param watch The address to watch
     */
    constructor(watch: PublicKey) {
        this.watch = watch
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
     * @param opts.parse Parse `PublicKey`s and `BN`s or keep them as strings
     */
    async getTokenAccounts(showApps?: boolean, opts?: FetchOpts) {
        return await getTokenAccounts(this.watch, showApps, opts)
    }

    /**
     * Fetches transactions for the watched address and parses them
     * @param index Used for pagination, first and last index of the transactions fetched
     * @param opts.parse Parse `PublicKey`s and `BN`s or keep them as strings
     */
    async getTransactions(index?: [number, number], opts?: FetchOpts) {
        return await getTransactions(this.watch, index, opts)
    }

    /**
     * Fetches transactions for the watched address, filters them, and returns a chart of the balance over time
     * @param timeframe Either daily ("D") or hourly ("H")
     * @param range Amount of timeframes to include. Hourly range max is 90d
     * @param detailed Retrieve detailed states (balances included) or only usdValues with their timestamps
     * @param opts.parse Parse `PublicKey`s and `BN`s or keep them as strings
     */
    async getChartData(
        range: number,
        timeframe: Timeframe,
        detailed?: boolean,
        opts?: FetchOpts
    ) {
        return await getChartData(this.watch, range, timeframe, detailed, opts)
    }
}
