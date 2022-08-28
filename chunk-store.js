import bounds from 'binary-search-bounds'

const INDEX_CONTROL_FLAG = 0b100100

const writeControlFlag = (buffer, pos, controlFlag) => {
    let flag = 0
    flag |= controlFlag
    return writeUInt(buffer, pos, flag)
}

const readControlFlag = (buffer, pos) => {
    return readUInt(buffer, pos)
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

const chunkStore = async () => {

    // |<-- index control (4 bytes) -->|<-- index size (4 bytes) -->|<-- byte array size (4 bytes) -->|<-- chunk start offset (4 bytes) -->|<-- chunk end offset (4 bytes) -->|<-- chunk CID (36 bytes) -->|...
    const create = async ({ buf, chunker, encode }) => {
        const offsets = chunker(buf)
        const shift = 12 // allow index header
        const blockSize = 44
        let lastOffset = 0
        let pos = shift
        const startOffsets = new Map()
        const blocks = [] // {cid, bytes}
        //const endOffsets = new Map()
        const index = { startOffsets /*, endOffsets*/ }
        const indexSize = offsets.length
        const byteArraySize = buf.length
        const indexBuffer = new Uint8Array(indexSize * (4 /* start offset */ + 4 /* end offset */ + 36 /* cid */) + (4 /* index control */ + 4 /* index size */) + 4 /* byte array size */)
        for (const offset of offsets.values()) {
            const chunkBytes = buf.subarray(lastOffset, offset)
            const chunkCid = await encode(chunkBytes)
            const block = { cid: chunkCid, bytes: chunkBytes }
            blocks.push(block)
            startOffsets.set(lastOffset, chunkCid)
            //endOffsets.set(lastOffset, offset - 1)
            if (chunkCid.byteLength !== 36) throw new Error(`The cid has unexpected size ${chunkCid.byteLength}`)
            // TODO store chunk length vs. absolute offset 
            // Propagate choice to the rust library
            writeUInt(indexBuffer, pos, lastOffset)
            writeUInt(indexBuffer, pos + 4, offset)
            indexBuffer.set(chunkCid.bytes, pos + 8)
            lastOffset = offset
            pos += blockSize
        }

        writeControlFlag(indexBuffer, 0, INDEX_CONTROL_FLAG) // index control
        writeUInt(indexBuffer, 4, indexSize)  // index size
        writeUInt(indexBuffer, 8, byteArraySize)  // byte array size

        const root = await encode(indexBuffer)
        if (root.byteLength !== 36) throw new Error(`The cid has unexpected size ${chunkCid.byteLength}`)

        // TODO chunk large indices, fixed size
        const rootBlock = { cid: root, bytes: indexBuffer }
        blocks.push(rootBlock)

        index.indexSize = indexSize
        index.byteArraySize = byteArraySize

        return { root, index, blocks }
    }


    const relevantChunks = (startOffsetArray, startOffset, endOffset) => {

        return startOffsetArray.slice(bounds.lt(startOffsetArray, startOffset), bounds.ge(startOffsetArray, endOffset) + 1)
    }

    const read = async (startOffset, length, { root, index, decode, get }, debugCallback) => {

        if (index === undefined) {
            if (root === undefined) throw new Error(`Missing root, please provide and index or root as arg`)
            index = await readIndex(root, get, decode)
        }
        const endOffset = startOffset + length
        if (startOffset > index.byteArraySize) throw new Error(`Start offset out of range ${startOffset} > buffer size ${index.byteArraySize}`)
        if (endOffset > index.byteArraySize) throw new Error(`End offset out of range ${endOffset} > buffer size ${index.byteArraySize}`)
        const startOffsetsIndexed = index.startOffsets
        const startOffsetArray = Array.from(startOffsetsIndexed.keys())
        const selectedChunks = relevantChunks(startOffsetArray, startOffset, endOffset)
        const resultBuffer = new Uint8Array(length)
        let cursor = 0
        let blocksLoaded = 0
        for (let i = 0; i < selectedChunks.length; i++) {
            blocksLoaded++
            const chunkOffset = selectedChunks[i]
            const chunkCid = startOffsetsIndexed.get(chunkOffset)
            //const chunkBuffer = await blockStore.get(chunkCid)
            const chunkBuffer = await get(chunkCid)
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

        if (debugCallback) {
            debugCallback({ blocksLoaded })
        }

        if (cursor !== resultBuffer.byteLength) throw new Error(`alg. error, check code`)
        return resultBuffer
    }

    const readIndex = async (root, get, decode) => {
        const indexBuffer = await get(root)
        const controlFlag = readControlFlag(indexBuffer, 0)
        if (controlFlag & INDEX_CONTROL_FLAG == 0) throw new Error(`This byte array is not an index`)
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
            const chunkCid = decode(cidBytes)
            startOffsets.set(startOffset, chunkCid)
            pos += blockSize
        }
        return index
    }

    return { create, read, readIndex, relevantChunks }
}

export { chunkStore }




