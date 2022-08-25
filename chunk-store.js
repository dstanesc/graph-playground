
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import bounds from 'binary-search-bounds'

const INDEX_CONTROL_BYTE = 0b100100
const CID_VERSION = 1
const CODEC_CODE = raw.code



const writeControlByte = (buffer, pos, controlByte) => {
    const controlBytes = new Uint8Array(4)
    controlBytes[0] = controlByte
    buffer.set(controlBytes, pos)
}


const writeUInt = (buffer, pos, value) => {
    if (value < 0 || value > 0xffffffff) throw new Error("Integer out of range")
    buffer[pos] = (value & 0xff)
    buffer[pos + 1] = (value >>> 8)
    buffer[pos + 2] = (value >>> 16)
    buffer[pos + 3] = (value >>> 24)
    return pos + 4
}


const readUInt = (buffer, pos) => {
    const value = ((buffer[pos]) |
        (buffer[pos + 1] << 8) |
        (buffer[pos + 2] << 16)) +
        (buffer[pos + 3] * 0x1000000)
    return value
}

const readBytes = (buffer, pos, length) => {
    const bytes = buffer.subarray(pos, pos + length)
    return bytes
}

const readControlByte = (buffer, pos) => {
    const controlBytes = readBytes(buffer, pos, 4)
    return controlBytes[0]
}

const chunkStore = async ({ blockStore, chunker, root }) => {

    let index = undefined

    const write = async buf => {
        ({ root, index } = await writeIndex(buf))
        return root
    }

    const ensureIndex = async () => {
        if (index === undefined) {
            if (root === undefined) {
                throw new Error(`Missing root, please provide as arg`)
            }
            (index = await readIndex(root))
        }
    }

    const relevantChunks = (startOffsetArray, startOffset, endOffset) => {

        return startOffsetArray.slice(bounds.lt(startOffsetArray, startOffset), bounds.ge(startOffsetArray, endOffset) + 1)
    }

    const read = async (startOffset, length) => {
        await ensureIndex()
        const endOffset = startOffset + length
        if (startOffset > index.byteArraySize) throw new Error(`Start offset out of range ${startOffset} > buffer size ${index.byteArraySize}`)
        if (endOffset > index.byteArraySize) throw new Error(`End offset out of range ${endOffset} > buffer size ${index.byteArraySize}`)
        const startOffsetsIndexed = index.startOffsets
        const startOffsetArray = Array.from(startOffsetsIndexed.keys())
        const selectedChunks = relevantChunks(startOffsetArray, startOffset, endOffset)
        const resultBuffer = new Uint8Array(length)
        let cursor = 0
        for (let i = 0; i < selectedChunks.length; i++) {
            const chunkOffset = selectedChunks[i]
            const chunkCid = startOffsetsIndexed.get(chunkOffset)
            const chunkBuffer = await blockStore.get(chunkCid)
            if (chunkOffset <= startOffset && endOffset < chunkOffset + chunkBuffer.byteLength) {
                // single block read
                resultBuffer.set(chunkBuffer.subarray(startOffset - chunkOffset, endOffset - chunkOffset), cursor)
                cursor += endOffset - startOffset
                break
            } else if (chunkOffset <= startOffset) {
                // first block 
                resultBuffer.set(chunkBuffer.subarray(startOffset - chunkOffset, chunkBuffer.byteLength), cursor)
                cursor = chunkBuffer.byteLength - (startOffset - chunkOffset)
            } else if (chunkOffset > startOffset && endOffset > chunkOffset + chunkBuffer.byteLength) {
                // full block
                resultBuffer.set(chunkBuffer, cursor)
                cursor += chunkBuffer.byteLength
            } else if (chunkOffset > startOffset && endOffset < chunkOffset + chunkBuffer.byteLength) {
                // last block
                resultBuffer.set(chunkBuffer.subarray(0, endOffset - chunkOffset), cursor)
                cursor += endOffset - chunkOffset
                break
            }
            console.log(`Cursor ${cursor}`)
        }
        if (cursor !== resultBuffer.byteLength) throw new Error(`alg. error, check code`)
        return resultBuffer
    }


    // |<-- index control (4 bytes) -->|<-- index size (4 bytes) -->|<-- byte array size (4 bytes) -->|<-- chunk start offset (4 bytes) -->|<-- chunk end offset (4 bytes) -->|<-- chunk CID (36 bytes) -->|...
    const writeIndex = async buf => {
        const offsets = chunker(buf)
        const shift = 12 // allow index header
        const blockSize = 44
        let lastOffset = 0
        let pos = shift
        const startOffsets = new Map()
        //const endOffsets = new Map()
        const index = { startOffsets /*, endOffsets*/ }
        const indexSize = offsets.length
        const byteArraySize = buf.length
        const indexBuffer = new Uint8Array(indexSize * (4 /* start offset */ + 4 /* end offset */ + 36 /* cid */) + (4 /* index control */ + 4 /* index size */) + 4 /* byte array size */)
        for (const offset of offsets.values()) {
            //console.log(`Writing at ${pos}`)
            const chunkBytes = buf.subarray(lastOffset, offset)
            const chunkHash = await sha256.digest(chunkBytes)
            const chunkCid = CID.create(CID_VERSION, CODEC_CODE, chunkHash)
            blockStore.put(chunkCid, chunkBytes)
            startOffsets.set(lastOffset, chunkCid)
            //endOffsets.set(lastOffset, offset - 1)
            if (chunkCid.byteLength !== 36) throw new Error(`The CID has unexpected size ${chunkCid.byteLength}`)
            // TODO store chunk length vs. absolute offset 
            // Propagate choice to rust chunking library
            writeUInt(indexBuffer, pos, lastOffset)
            writeUInt(indexBuffer, pos + 4, offset)
            indexBuffer.set(chunkCid.bytes, pos + 8)
            lastOffset = offset;
            pos += blockSize
        }

        writeControlByte(indexBuffer, 0, INDEX_CONTROL_BYTE) // index control
        writeUInt(indexBuffer, 4, indexSize)  // index size
        writeUInt(indexBuffer, 8, byteArraySize)  // byte array size

        const indexHash = await sha256.digest(indexBuffer)
        const root = CID.create(1, raw.code, indexHash)
        if (root.byteLength !== 36) throw new Error(`The CID has unexpected size ${chunkCid.byteLength}`)

        // TODO chunk large indices
        blockStore.put(root, indexBuffer)

        index.indexSize = indexSize
        index.byteArraySize = byteArraySize

        return { root, index }
    }

    const readIndex = async indexCid => {
        const indexBuffer = await blockStore.get(indexCid)
        const controlByte = readControlByte(indexBuffer, 0)
        if (controlByte & INDEX_CONTROL_BYTE == 0) throw new Error(`This byte array is not an index`)
        const indexSize = readUInt(indexBuffer, 4)
        const byteArraySize = readUInt(indexBuffer, 8)
        const blockSize = 44
        const shift = 12
        let pos = shift
        const startOffsets = new Map()
        const index = { startOffsets, indexSize, byteArraySize }
        for (let i = 0; i < indexSize; i++) {
            const startOffset = readUInt(indexBuffer, pos)
            const nextOffset = readUInt(indexBuffer, pos + 4)
            //const endOffset = nextOffset - 1
            const cidBytes = readBytes(indexBuffer, pos + 8, 36)
            const chunkCid = CID.decode(cidBytes)
            startOffsets.set(startOffset, chunkCid)
            pos += blockSize
        }
        return index
    }

    return { write, read, writeIndex, readIndex, relevantChunks }
}

export { chunkStore }


