/**
 * Separates an array in batches of a certain size
 * @param arr - The array to be batched
 * @param batchSize - The size of each batch
 * @param limit - Optional limit on the number of elements
 * @returns An array of batches
 */
export function createBatches<T>(
    arr: T[],
    batchSize: number,
    limit?: number
): T[][] {
    const batches: T[][] = []
    let totalElements = 0

    for (let i = 0; i < arr.length; i += batchSize) {
        const batch = arr.slice(i, i + batchSize)

        if (limit) {
            const remainingLimit = limit - totalElements
            if (batch.length > remainingLimit) {
                batches.push(batch.slice(0, remainingLimit))
                break
            }
        }

        batches.push(batch)
        totalElements += batch.length
    }

    return batches
}
