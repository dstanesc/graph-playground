import { Offset } from './offset.js'
import { Node, Rlshp, Prop } from './graph.js'

const utf8Encoder = new TextEncoder('utf-8')
const utf8Decoder = new TextDecoder('utf-8')

function stringToUtf8(value) {
    return utf8Encoder.encode(value)
}

function utf8ToString(buffer) {
    return utf8Decoder.decode(buffer)
}

const REF_OFFSET_EXISTS = 0x0001
const REF_CID_EXISTS = 0x0010

const NODE_CONTROL_FLAG = 0x001
const RLSHP_CONTROL_FLAG = 0x010
const PROP_CONTROL_FLAG = 0x100

class Encoder {

    constructor(size, encode, put) {
        this.buffer = new Uint8Array(size)
        this.cursor = 0
        this.encode = encode
        this.put = put
        console.log(`Encode buffer size = ${this.buffer.byteLength}`)
    }

    content() {
        return this.buffer.subarray(0, this.cursor) // identical w/ fixed size buffer
    }

    // allocateSpace() {
    //     const newSize = this.buffer.byteLength * 2
    //     const newBuffer = new Uint8Array(newSize)
    //     newBuf.set(this.buffer, 0)
    //     this.buffer = newBuffer
    // }

    // checkAndAllocateSpace(numBytes) {
    //     if (this.offset + numBytes > this.buffer.byteLength)
    //         allocateSpace()
    // }

    /*
     * String, fixed size 256 bytes 
     */
    writeFixedLengthString256(value) {  // 256 + 4
        const bytes = stringToUtf8(value)
        if (bytes.length > 256) throw new Error(`String too large - ${bytes.length}, max allowed 256 bytes`)
        const length = bytes.length
        this.writeUInt(length)
        const fixedSizeBuffer = new Uint8Array(256)
        fixedSizeBuffer.set(bytes, 0)
        return this.writeBytes(fixedSizeBuffer)
    }

    /*
     * String, fixed size 64 bytes 
     */
    writeFixedLengthString64(value) {  // 32 + 4
        const bytes = stringToUtf8(value)
        if (bytes.length > 64) throw new Error(`String too large - ${bytes.length}, max allowed 64 bytes`)
        const length = bytes.length
        this.writeUInt(length)
        const fixedSizeBuffer = new Uint8Array(64)
        fixedSizeBuffer.set(bytes, 0)
        return this.writeBytes(fixedSizeBuffer)
    }

    /*
     * String, fixed size 32 bytes 
     */
    writeFixedLengthString32(value) { // 32 + 4
        const bytes = stringToUtf8(value)
        if (bytes.length > 32) throw new Error(`String too large - ${bytes.length}, max allowed 32 bytes`)
        const length = bytes.length
        this.writeUInt(length)
        const fixedSizeBuffer = new Uint8Array(32)
        fixedSizeBuffer.set(bytes, 0)
        return this.writeBytes(fixedSizeBuffer)
    }

    writeByte(byte) {
        this.buffer[this.cursor] = byte
        this.cursor += 1
    }

    writeBytes(bytes) {
        const start = this.cursor
        //console.log(`Writing bytes ${bytes} to offset ${start}, len=${bytes.byteLength}`)
        this.buffer.set(bytes, start)
        this.cursor += bytes.byteLength
        //console.log(`Writing bytes ${bytes} to offset ${start}, moving cursor to ${this.cursor}`)
        return this.cursor
    }

    /*
     * Unsigned 32-bit integer, little endian
     */
    writeUInt(value) {
        if (value < 0 || value > 0xffffffff) throw new Error("Integer out of range")
        const start = this.cursor
        this.buffer[start] = (value & 0xff)
        this.buffer[start + 1] = (value >>> 8)
        this.buffer[start + 2] = (value >>> 16)
        this.buffer[start + 3] = (value >>> 24)
        this.cursor += 4
        //console.log(`Writing uint ${value} to offset ${start}, moving cursor to ${this.cursor}`)
        return this.cursor
    }

    /*
     *  32-bit integer, little endian
     */
    writeInt(value) {
        if (value < -0x80000000 || value > 0x7fffffff) throw new Error("Integer out of range")
        const start = this.cursor
        this.buffer[start] = (value & 0xff)
        this.buffer[start + 1] = (value >>> 8)
        this.buffer[start + 2] = (value >>> 16)
        this.buffer[start + 3] = (value >>> 24)
        this.cursor += 4
        //console.log(`Writing int ${value} to offset ${start}, moving cursor to ${this.cursor}`)
        return this.cursor
    }


    writeControl(controlByte) {
        const controlBytes = new Uint8Array(4)
        controlBytes[0] = controlByte
        return this.writeBytes(controlBytes)
    }

    writeRefExists(offset, cidBytes) {
        let flags = 0
        flags |= REF_OFFSET_EXISTS
        if (cidBytes)
            flags |= REF_CID_EXISTS
        return this.writeUInt(flags)
    }

    writeOffset(offset) {
        if (this.cursor != offset) throw new Error(`Writing invalid offset ${offset}, current offset is ${this.cursor}`)
        return this.writeUInt(offset)
    }

    writeLabel(label) {
        return this.writeFixedLengthString32(label)
    }

    writeRef(offset, cidBytes) { // 44
        this.writeRefExists(offset, cidBytes) // 4
        this.writeUInt(offset) // 4
        if (cidBytes) {
            if (cidBytes.byteLength !== 36) throw new Error(`The CID has unexpected size ${cidBytes.byteLength}`)
            this.writeBytes(cidBytes) //36
        } else this.skipBytes(36)
    }

    skipBytes(length) {
        this.cursor += length
    }

    skipUInt() {
        this.skipBytes(4)
    }

    skipRef() {
        this.skipBytes(44)
    }

}

class Decoder {
    constructor(buffer, decode, get) {
        this.buffer = buffer
        this.cursor = 0
        this.decode = decode
        this.get = get
    }

    readByte() {
        const start = this.cursor
        this.cursor += 1
        return this.buffer[start - 1]
    }

    readBytes(length) {
        const start = this.cursor
        this.cursor += length
        const bytes = this.buffer.subarray(start, this.cursor)
        //console.log(`Reading bytes ${bytes} from offset ${start}, moving cursor to ${this.cursor}`)
        return bytes
    }

    /*
     * Fixed size 256 bytes
     */
    readFixedSizeString256(stringSize) {
        const stringBytes = this.readBytes(stringSize)
        this.cursor += 256 - stringSize
        return utf8ToString(stringBytes)
    }

    /*
     * Fixed size 64 bytes
     */
    readFixedSizeString64(stringSize) {
        const stringBytes = this.readBytes(stringSize)
        this.cursor += 64 - stringSize
        return utf8ToString(stringBytes)
    }

    /*
     * Fixed size 32 bytes
     */
    readFixedSizeString32(stringSize) {
        const stringBytes = this.readBytes(stringSize)
        this.cursor += 32 - stringSize
        return utf8ToString(stringBytes)
    }
    /*
     * Unsigned 32-bit integer, little endian
     */
    readUInt() {
        const start = this.cursor
        const value = ((this.buffer[start]) |
            (this.buffer[start + 1] << 8) |
            (this.buffer[start + 2] << 16)) +
            (this.buffer[start + 3] * 0x1000000)
        this.cursor += 4
        //console.log(`Reading uint ${value} from offset ${start}, moving cursor to ${this.cursor}`)
        return value
    }

    /*
     * 32-bit integer, little endian
     */
    readInt() {
        const start = this.cursor
        const value = (this.buffer[start]) |
            (this.buffer[start + 1] << 8) |
            (this.buffer[start + 2] << 16) |
            (this.buffer[start + 3] << 24)
        this.cursor += 4
        //console.log(`Reading uint ${value} from offset ${start}, moving cursor to ${this.cursor}`)
        return value
    }

    readControl() {
        return this.readBytes(4)
    }

    readOffset() {
        return new Offset(this.readUInt())
    }

    readLabel() {
        const labelSize = this.readUInt()
        //console.log(`Reading label size ${labelSize}`);
        return this.readFixedSizeString32(labelSize)
    }

    readRefExists() {
        return this.readUInt()
    }

    readRef() { // 44
        const flags = this.readRefExists() // 4
        if (flags & REF_OFFSET_EXISTS) {
            const offset = this.readOffset() // 4
            if (flags & REF_CID_EXISTS) {
                const cidBytes = this.readBytes(36)
                return new Offset(offset, cidBytes)
            } else {
                this.skipBytes(36)
                return new Offset(offset)
            }
        } else {
            this.skipBytes(68)
            return undefined
        }
    }

    skipBytes(length) {
        this.cursor += length
    }
}


const NODE_SIZE_BYTES = 132

class NodesEncoder extends Encoder {

    constructor(nodes) {
        super(nodes.length * NODE_SIZE_BYTES)
        this.nodes = nodes
    }

    writeControlNode() {
        let flags = 0
        return this.writeUInt(flags |= NODE_CONTROL_FLAG)
    }

    writeNode(node) { // NODE_SIZE_BYTES
        this.writeOffset(node.offset.offsetValue()) // 4
        this.writeLabel(node.label) // 32 + 4
        if (node.nextRlshp)
            this.writeRef(node.nextRlshp.offsetValue()) // 44
        else this.skipRef()
        if (node.nextProp)
            this.writeRef(node.nextProp.offsetValue()) // 44
        else this.skipRef()
        return this.writeControlNode() // 4
    }

    write() {
        this.nodes.forEach(node => this.writeNode(node))
        return this;
    }
}

class NodesDecoder extends Decoder {

    readControlNode() {
        return this.readUInt()
    }

    readNode() { // NODE_SIZE_BYTES
        const offset = this.readOffset()
        const label = this.readLabel()
        const nextRlshp = this.readRef()
        const nextProp = this.readRef()
        if (this.readControlNode() & NODE_CONTROL_FLAG === 0)
            throw new Error(`The buffer is not holding a node at this offset ${this.cursor - NODE_SIZE_BYTES}`)
        return new Node(offset, label, nextRlshp, nextProp)
    }

    read() {
        if (this.buffer.byteLength % NODE_SIZE_BYTES !== 0) throw new Error("Invalid node byte array")
        const size = Math.trunc(this.buffer.byteLength / NODE_SIZE_BYTES)
        const nodes = []
        for (let i = 0; i < size; i++) {
            nodes.push(this.readNode())
        }
        return nodes
    }
}


const RLSHP_SIZE_BYTES = 308

class RlshpsEncoder extends Encoder {

    constructor(rlshps) {
        super(rlshps.length * RLSHP_SIZE_BYTES)
        this.rlshps = rlshps
    }

    writeControlRlshp() {
        let flags = 0
        return this.writeUInt(flags |= RLSHP_CONTROL_FLAG)
    }

    writeRlshp(rlshp) { // RLSHP_SIZE_BYTES
        this.writeOffset(rlshp.offset.offsetValue()) // 4
        this.writeLabel(rlshp.label) //  // 32 + 4
        this.writeRef(rlshp.firstNode.offsetValue()) // 44
        this.writeRef(rlshp.secondNode.offsetValue()) // 44
        if (rlshp.firstPrevRel)
            this.writeRef(rlshp.firstPrevRel.offsetValue()) // 44
        else this.skipRef()
        if (rlshp.firstNextRel)
            this.writeRef(rlshp.firstNextRel.offsetValue()) // 44
        else this.skipRef()
        if (rlshp.secondPrevRel)
            this.writeRef(rlshp.secondPrevRel.offsetValue()) // 44
        else this.skipRef()
        if (rlshp.secondNextRel)
            this.writeRef(rlshp.secondNextRel.offsetValue()) // 44
        else this.skipRef()
        return this.writeControlRlshp() //4 
    }

    write() {
        this.rlshps.forEach(rlshp => this.writeRlshp(rlshp))
        return this;
    }
}

class RlshpsDecoder extends Decoder {

    readControlRlshp() {
        return this.readUInt()
    }

    readRlshp() { // RLSHP_SIZE_BYTES
        const offset = this.readOffset()
        const label = this.readLabel()
        const firstNode = this.readRef()
        const secondNode = this.readRef()
        const firstPrevRel = this.readRef()
        const firstNextRel = this.readRef()
        const secondPrevRel = this.readRef()
        const secondNextRel = this.readRef()
        if (this.readControlRlshp() & RLSHP_CONTROL_FLAG === 0)
            throw new Error(`The buffer is not holding a rlshp at this offset ${this.cursor - RLSHP_SIZE_BYTES}`)
        return new Rlshp(offset, label, firstNode, secondNode, firstPrevRel, firstNextRel, secondPrevRel, secondNextRel)
    }

    read() {
        if (this.buffer.byteLength % RLSHP_SIZE_BYTES !== 0) throw new Error("Invalid rlshp byte array")
        const size = Math.trunc(this.buffer.byteLength / RLSHP_SIZE_BYTES)
        const rlshps = []
        for (let i = 0; i < size; i++) {
            rlshps.push(this.readRlshp())
        }
        return rlshps
    }
}

const PROP_SIZE_BYTES = 124

class PropsEncoder extends Encoder {

    constructor(props, encode, put) {
        super(props.length * PROP_SIZE_BYTES, encode, put)
        this.props = props
    }

    writeKey(key) {
        return this.writeFixedLengthString32(key)
    }

    async writeValue(value) {
        const bytes = new TextEncoder().encode(value) //FIXME elaborate formats
        const cid = await this.encode(bytes)
        if (cid.bytes.byteLength != 36) throw new Error('Prop value encoding should produce exactly 36 bytes')
        const block = { cid, bytes }
        this.put(block)
        return this.writeBytes(cid.bytes)
    }

    writeControlProp() {
        let flags = 0
        return this.writeUInt(flags |= PROP_CONTROL_FLAG)
    }

    async writeProp(prop) { // PROP_SIZE_BYTES
        this.writeOffset(prop.offset.offsetValue()) // 4
        this.writeKey(prop.key)   // 32 + 4
        await this.writeValue(prop.value) // 36 
        if (prop.nextProp)
            this.writeRef(prop.nextProp.offsetValue()) // 44
        else this.skipRef()
        return this.writeControlProp() // 4
    }

    async write() {
        for (const prop of this.props) {
            await this.writeProp(prop)
        }
        return this;
    }
}


class PropsDecoder extends Decoder {

    constructor(buffer, decode, get) {
        super(buffer, decode, get)
    }

    readKey() {
        const keySize = this.readUInt()
        console.log(`Reading key size ${keySize}`);
        return this.readFixedSizeString32(keySize)
    }

    async readValue() {
        const cidBytes = this.readBytes(36)
        const valueCid = this.decode(cidBytes)
        const valueBytes = await this.get(valueCid)
        return new TextDecoder().decode(valueBytes) //FIXME elaborate formats
    }

    readControlProp() {
        return this.readUInt()
    }

    async readProp() { // PROP_SIZE_BYTES
        const offset = this.readOffset()
        const key = this.readKey()
        const cid = await this.readValue()
        const nextProp = this.readRef()
        if (this.readControlProp() & PROP_CONTROL_FLAG === 0)
            throw new Error(`The buffer is not holding a prop at this offset ${this.cursor - PROP_SIZE_BYTES}`)

        return new Prop(offset, key, cid, nextProp)
    }

    async read() {
        if (this.buffer.byteLength % PROP_SIZE_BYTES !== 0) throw new Error("Invalid prop byte array")
        const size = Math.trunc(this.buffer.byteLength / PROP_SIZE_BYTES)
        const props = []
        for (let i = 0; i < size; i++) {
            props.push(await this.readProp())
        }
        return props
    }
}

const offsetIncrements = { node: NODE_SIZE_BYTES, rlshp: RLSHP_SIZE_BYTES, prop: PROP_SIZE_BYTES }

export { NodesEncoder, NodesDecoder, RlshpsEncoder, RlshpsDecoder, PropsEncoder, PropsDecoder, offsetIncrements }