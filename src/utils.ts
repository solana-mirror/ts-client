/**
 * Separates an array in batches of a certain size
 * @param arr - The array to be batched
 * @param batchSize - The size of each batch
 * @param limit - Optional limit on the number of batches
 * @returns An array of batches
 */
export function createBatches<T>(
    arr: T[],
    batchSize: number,
    limit?: number
): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < arr.length; i += batchSize) {
        const batch = arr.slice(i, i + batchSize)
        batches.push(batch)
        if (limit && batches.length === limit) {
            break
        }
    }
    return batches
}
