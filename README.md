# Solana Mirror SDK

Package that parses ATAs, transactions and generates chart data for a Solana wallet address. As of now, there are no dApp implementations -- the balances are just fetched from the wallet itself.

## Getting started

1. Install solana-mirror

```bash
npm i solana-mirror
yarn add solana-mirror
```

2. Import the SolanaMirror class and initialize it

```ts
import SolanaMirror from 'solana-mirror'
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'

const connection = new Connection(rpc, 'confirmed')

const wallet = new PublicKey('your_base58_wallet_address')

const solanaMirror = new SolanaMirror(wallet)
```

## Functionalities

-   Get the user's associated token accounts, parsed with their respective metadata and balances

```ts
const atas = await solanaMirror.getTokenAccounts()
```

-   Get the parsed transactions

```ts
const txs = await solanaMirror.getTransactions()
```

-   Get the formatted chart data (daily/hourly resolution) with historical balances and value

```ts
const chartData = await solanaMirror.getChartData(7, "d")
```
The functions are also available standalone, by passing an address to them
