import { PublicKey } from '@solana/web3.js'
import { Timeframe } from './types'
import { getChartData, getTokenAccounts, getTransactions } from './functions'

export default class SolanaMirror {
    private watch: PublicKey

    /**
     * @param args.watch The address to watch
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
     * @todo Migrate to [Solana.fm](https://api.solana.fm/v1/addresses/{account-hash}/tokens) endpoint once it's not in beta anymore
     */
    async getTokenAccounts() {
        return await getTokenAccounts(this.watch)
    }

    /**
     * Fetches transactions for the watched address and parses them
     */
    async getTransactions() {
        return await getTransactions(this.watch)
    }

    /**
     * Fetches transactions for the watched address, filters them, and returns a chart of the balance over time
     * @param timeframe Either daily ("D") or hourly ("H")
     * @param range Amount of timeframes to include. Hourly range max is 90d
     */
    async getChartData(range: number, timeframe: Timeframe) {
        return await getChartData(this.watch, range, timeframe)
    }
}
