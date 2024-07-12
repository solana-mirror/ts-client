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
