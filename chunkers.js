import { compute_chunks_buzhash, compute_chunks_fastcdc } from "@dstanesc/wasm-chunking-node-eval";


const FASTCDC_CHUNK_MIN_SIZE_DEFAULT = 16384 // 4069 //8192 //16384
const FASTCDC_CHUNK_AVG_SIZE_DEFAULT = 32768 // 8192 // 16384 //32768
const FASTCDC_CHUNK_MAX_SIZE_DEFAULT = 65536 // 16384 //32768 //65536

const BUZHASH_MASK_DEFAULT = 14 //0b11111111111111


const chunkers = (name, opts) => {

    let min_size = FASTCDC_CHUNK_MIN_SIZE_DEFAULT
    let avg_size = FASTCDC_CHUNK_AVG_SIZE_DEFAULT
    let max_size = FASTCDC_CHUNK_MAX_SIZE_DEFAULT
    let buz_mask = BUZHASH_MASK_DEFAULT

    if (opts !== undefined) {
        const { minSize, avgSize, maxSize, mask } = opts
        if (minSize)
            min_size = minSize
        if (avgSize)
            avg_size = avgSize
        if (maxSize)
            max_size = maxSize
        if (mask)
            buz_mask = mask
    }

    const fastcdc = buf => compute_chunks_fastcdc(buf, min_size, avg_size, max_size)

    const buzhash = buf => compute_chunks_buzhash(buf, buz_mask)

    switch (name) {
        case 'fastcdc': return fastcdc
        case 'buzhash': return buzhash
        default: throw new Error(`Unknown chunking algorithm ${name}`)
    }

}

export { chunkers }