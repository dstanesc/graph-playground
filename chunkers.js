import { compute_chunks_buzhash, compute_chunks_fastcdc } from "@dstanesc/wasm-chunking-node-eval";


const FASTCDC_CHUNK_MIN_SIZE_DEFAULT = 16384
const FASTCDC_CHUNK_AVG_SIZE_DEFAULT = 32768
const FASTCDC_CHUNK_MAX_SIZE_DEFAULT = 65536

const BUZHASH_MASK_DEFAULT = 15 //0b111111111111111


const chunkers = (name) => {

    const fastcdc = buf => compute_chunks_fastcdc(buf, FASTCDC_CHUNK_MIN_SIZE_DEFAULT, FASTCDC_CHUNK_AVG_SIZE_DEFAULT, FASTCDC_CHUNK_MAX_SIZE_DEFAULT)

    const buzhash = buf => compute_chunks_buzhash(buf, BUZHASH_MASK_DEFAULT)

    switch (name) {
        case 'fastcdc': return fastcdc
        case 'buzhash': return buzhash
        default: throw new Error(`Unknow chunking algorithm ${name}`)
    }

}

export { chunkers }