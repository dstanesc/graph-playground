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

class Encoder {

    constructor(size) {
        this.buffer = new Uint8Array(size)
        this.cursor = 0
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
     * String, fixed size 64 bytes
     */
    writeFixedLengthString64(value) {
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
    writeFixedLengthString32(value) {
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
        console.log(`Writing bytes ${bytes} to offset ${start}, len=${bytes.byteLength}`)
        this.buffer.set(bytes, start)
        this.cursor += bytes.byteLength
        console.log(`Writing bytes ${bytes} to offset ${start}, moving cursor to ${this.cursor}`)
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
        console.log(`Writing uint ${value} to offset ${start}, moving cursor to ${this.cursor}`)
        return this.cursor
    }

    writeControl(controlByte) {
        const controlBytes = new Uint8Array(4)
        controlBytes[0] = controlByte
        return this.writeBytes(controlBytes)
    }

    writeOffset(offset) {
        if (this.cursor != offset) throw new Error(`Writing invalid offset ${offset}, current offset is ${this.cursor}`)
        return this.writeUInt(offset)
    }

    writeLabel(label) {
        return this.writeFixedLengthString32(label)
    }

    writeRef(offset) {
        return this.writeUInt(offset)
    }

}

class Decoder {
    constructor(buffer) {
        this.buffer = buffer
        this.cursor = 0
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
        console.log(`Reading bytes ${bytes} from offset ${start}, moving cursor to ${this.cursor}`)
        return bytes
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
        console.log(`Reading uint ${value} from offset ${start}, moving cursor to ${this.cursor}`)
        return value
    }

    readControl() {
        return this.readBytes(4)
    }

    readOffset() {
        return this.readUInt()
    }

    readLabel() {
        const labelSize = this.readUInt()
        console.log(`Reading label size ${labelSize}`);
        return this.readFixedSizeString32(labelSize)
    }

    readRef() {
        return this.readUInt()
    }
}


class NodesEncoder extends Encoder {

    constructor(nodes) {
        super(nodes.length * 52)
        this.nodes = nodes
    }

    writeControlNode() {
        return this.writeControl(0b100)
    }

    writeNode(node) {
        this.writeOffset(node.offset.offsetValue())
        this.writeLabel(node.label)
        this.writeRef(node.nextRlshp.offsetValue())
        this.writeRef(node.nextProp.offsetValue())
        this.writeControlNode()
    }

    write() {
        this.nodes.forEach(node => this.writeNode(node))
        return this;
    }
}

class NodesDecoder extends Decoder {

    readNode() {
        const offset = new Offset(this.readOffset())
        const label = this.readLabel()
        const nextRlshp = new Offset(this.readRef())
        const nextProp = new Offset(this.readRef())
        const controlBytes = this.readControl()
        const controlByte = controlBytes[0]
        if (controlByte & 0b100 == 0) throw new Error(`The buffer is not holding a node at this offset ${this.cursor - 52}`)
        return new Node(offset, label, nextRlshp, nextProp)
    }

    read() {
        if (this.buffer.byteLength % 52 !== 0) throw new Error("Invalid node byte array")
        const size = Math.trunc(this.buffer.byteLength / 52)
        const nodes = []
        for (let i = 0; i < size; i++) {
            nodes.push(this.readNode())
        }
        return nodes
    }
}


class RlshpsEncoder extends Encoder {

    constructor(rlshps) {
        super(rlshps.length * 68)
        this.rlshps = rlshps
    }

    writeControlRlshp() {
        return this.writeControl(0b1000)
    }

    writeRlshp(rlshp) {
        this.writeOffset(rlshp.offset.offsetValue())
        this.writeLabel(rlshp.label)
        this.writeRef(rlshp.firstNode.offsetValue())
        this.writeRef(rlshp.secondNode.offsetValue())
        this.writeRef(rlshp.firstPrevRel.offsetValue())
        this.writeRef(rlshp.firstNextRel.offsetValue())
        this.writeRef(rlshp.secondPrevRel.offsetValue())
        this.writeRef(rlshp.secondNextRel.offsetValue())
        this.writeControlRlshp()
    }

    write() {
        this.rlshps.forEach(rlshp => this.writeRlshp(rlshp))
        return this;
    }
}

class RlshpsDecoder extends Decoder {

    readRlshp() {
        const offset = new Offset(this.readOffset())
        const label = this.readLabel()
        const firstNode = new Offset(this.readRef())
        const secondNode = new Offset(this.readRef())
        const firstPrevRel = new Offset(this.readRef())
        const firstNextRel = new Offset(this.readRef())
        const secondPrevRel = new Offset(this.readRef())
        const secondNextRel = new Offset(this.readRef())
        const controlBytes = this.readControl()
        const controlByte = controlBytes[0]
        if (controlByte & 0b1000 == 0) throw new Error(`The buffer is not holding a rlshp at this offset ${this.cursor - 64}`)
        return new Rlshp(offset, label, firstNode, secondNode, firstPrevRel, firstNextRel, secondPrevRel, secondNextRel)
    }

    read() {
        if (this.buffer.byteLength % 68 !== 0) throw new Error("Invalid rlshp byte array")
        const size = Math.trunc(this.buffer.byteLength / 64)
        const rlshps = []
        for (let i = 0; i < size; i++) {
            rlshps.push(this.readRlshp())
        }
        return rlshps
    }
}

class PropsEncoder extends Encoder {

    constructor(props) {
        super(props.length * 116)
        this.props = props
    }

    writeKey(key) {
        return this.writeFixedLengthString32(key)
    }

    writeValue(cid) {
        return this.writeFixedLengthString64(cid)
    }

    writeControlProp() {
        return this.writeControl(0b10000)
    }

    writeProp(prop) {
        this.writeOffset(prop.offset.offsetValue())
        this.writeKey(prop.key)
        this.writeValue(prop.value)
        this.writeRef(prop.nextProp.offsetValue())
        this.writeControlProp()
    }

    write() {
        this.props.forEach(prop => this.writeProp(prop))
        return this;
    }
}


class PropsDecoder extends Decoder {

    readKey() {
        const keySize = this.readUInt()
        console.log(`Reading key size ${keySize}`);
        return this.readFixedSizeString32(keySize)
    }

    readValue() {
        const cidSize = this.readUInt()
        console.log(`Reading value size ${cidSize}`);
        return this.readFixedSizeString64(cidSize)
    }

    readProp() {
        const offset = new Offset(this.readOffset())
        const key = this.readKey()
        const cid = this.readValue() // FIXME elaborate elsewhere how to load cid content
        const nextProp = new Offset(this.readRef())
        const controlBytes = this.readControl()
        const controlByte = controlBytes[0]
        if (controlByte & 0b10000 == 0) throw new Error(`The buffer is not holding a prop at this offset ${this.cursor - 116}`)
        return new Prop(offset, key, cid, nextProp)
    }

    read() {
        if (this.buffer.byteLength % 116 !== 0) throw new Error("Invalid prop byte array")
        const size = Math.trunc(this.buffer.byteLength / 116)
        const props = []
        for (let i = 0; i < size; i++) {
            props.push(this.readProp())
        }
        return props
    }
}


export { NodesEncoder, NodesDecoder, RlshpsEncoder, RlshpsDecoder, PropsEncoder, PropsDecoder }