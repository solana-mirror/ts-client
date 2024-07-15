import { ParsedAta } from './tokens'

export function createBatches<T>(
    arr: T[],
    batchSize: number,
    firstBatches?: number
) {
    const batches: T[][] = []
    for (let i = 0; i < arr.length; i += batchSize) {
        const batch = arr.slice(i, i + batchSize)
        batches.push(batch)
        if (firstBatches && batches.length === firstBatches) {
            break
        }
    }
    return batches
}

/**
 * Takes in all the atas and returns price * balance for each
 * @param accs
 * @returns
 */
export function getNetWorth(accs: ParsedAta[]) {
    let balance = 0
    for (let i = 0; i < accs.length; i++) {
        balance += accs[i].price * accs[i].balance.formatted
    }
    return +balance.toFixed(2)
}
