import { Node, Rlshp, Prop } from './graph.js'
import { chunkStore } from './chunk-store.js'
import { codec } from './codec.js'
import { chunkers } from './chunkers.js'
import { NodesEncoder, NodesDecoder, RlshpsEncoder, RlshpsDecoder, PropsEncoder, PropsDecoder, offsetIncrements } from './encoding.js'
import { CID } from 'multiformats'

const { encode, decode } = codec()

const minSize = 1024 * 32
const avgSize = minSize * 2
const maxSize = avgSize * 2

const chunker = chunkers('fastcdc', { minSize, avgSize, maxSize })

const cs = await chunkStore()


const chunkingStorage = async (history, blockStore) => {

    const nodeStore = blockStore
    const rlshpStore = blockStore
    const propStore = blockStore

    let { offset, nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset } = await history.last()

    let nodesIndex
    let rlshpsIndex
    let propsIndex

    const nodesCreate = async (nodes) => {
        const nodesArray = Array.from(nodes.values())
        const nodesByteArray = new NodesEncoder(nodesArray).write().content()
        const { root, index, blocks } = await cs.create({ buf: nodesByteArray, chunker, encode })
        blocks.forEach(block => nodeStore.put(block))
        nodesRoot = root.toString()
        nodesIndex = index
        return blocks
    }

    const rlshpsCreate = async (rlshps) => {
        const rlshpsArray = Array.from(rlshps.values())
        const rlshpsByteArray = new RlshpsEncoder(rlshpsArray).write().content()
        const { root, index, blocks } = await cs.create({ buf: rlshpsByteArray, chunker, encode })
        blocks.forEach(block => rlshpStore.put(block))
        rlshpsRoot = root.toString()
        rlshpsIndex = index
        return blocks
    }

    const propsCreate = async (props) => {
        const propsArray = Array.from(props.values())
        const propsEncoder = await new PropsEncoder(propsArray, encode, propStore.put).write()
        const propsByteArray = propsEncoder.content()
        const { root, index, blocks } = await cs.create({ buf: propsByteArray, chunker, encode })
        blocks.forEach(block => propStore.put(block))
        propsRoot = root.toString()
        rlshpsIndex = index
        return blocks
    }

    const nodeGet = async offset => {
        const offsetInt = parseInt(offset)
        const get = nodeStore.get
        const resultByteArray = await cs.read(offsetInt, offsetInt + offsetIncrements.node, { root: CID.parse(nodesRoot), index: nodesIndex, get, decode })
        const nodesResult = new NodesDecoder(resultByteArray).read()
        return nodesResult[0]
    }

    const rlshpGet = async offset => {
        const offsetInt = parseInt(offset)
        const get = rlshpStore.get
        const resultByteArray = await cs.read(offsetInt, offsetInt + offsetIncrements.rlshp, { root: CID.parse(rlshpsRoot), index: rlshpsIndex, get, decode })
        const rlshpsResult = new RlshpsDecoder(resultByteArray).read()
        return rlshpsResult[0]
    }

    const propGet = async offset => {
        const offsetInt = parseInt(offset)
        const get = propStore.get
        const resultByteArray = await cs.read(offsetInt, offsetInt + offsetIncrements.prop, { root: CID.parse(propsRoot), index: propsIndex, get, decode })
        const propsResult = await new PropsDecoder(resultByteArray, decode, get).read()
        return propsResult[0]
    }

    const storageCommit = async (nodesComplete, rlshpsComplete, propsComplete, nodesAdded, rlshpsAdded, propsAdded, nOffset, rOffset, pOffset) => {

        //FIXME no real update, just rewrite the full. 
        const nodeBlocks = await nodesCreate(nodesComplete)
        const rlshpBlocks = await rlshpsCreate(rlshpsComplete)
        const propBlocks = await propsCreate(propsComplete)

        nodeOffset = nOffset
        rlshpOffset = rOffset
        propOffset = pOffset

        offset = await history.push({ nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset: offset })

        return { nodeBlocks, rlshpBlocks, propBlocks }
    }


    const nodesRootGet = () => {
        return nodesRoot
    }

    const rlshpsRootGet = () => {
        return rlshpsRoot
    }

    const propsRootGet = () => {
        return propsRoot
    }

    const nodeOffsetGet = () => {
        return nodeOffset
    }

    const rlshpOffsetGet = () => {
        return rlshpOffset
    }

    const propOffsetGet = () => {
        return propOffset
    }

    const size = ({ nodeBlocks, rlshpBlocks, propBlocks }) => {
        let sum = 0
        for (const block of nodeBlocks) {
            const cid = block.cid
            sum += block.bytes.length
        }
        for (const block of rlshpBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
        }
        for (const block of propBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
        }
        return sum;
    }

    const count = ({ nodeBlocks, rlshpBlocks, propBlocks }) => {
        let c = nodeBlocks.length
        c += rlshpBlocks.length
        c += propBlocks.length
        return c
    }

    const showBlocks = ({ nodeBlocks, rlshpBlocks, propBlocks }) => {

        console.log('---')
        let sum = 0
        for (const block of nodeBlocks) {
            const cid = block.cid
            sum += block.bytes.length
            console.log(`Nodes block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        for (const block of rlshpBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
            console.log(`Rlshp block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        for (const block of propBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
            console.log(`Prop block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    return { nodesRootGet, rlshpsRootGet, propsRootGet, nodeOffsetGet, rlshpOffsetGet, propOffsetGet, storageCommit, nodeGet, rlshpGet, propGet, size, count, showBlocks, offsetIncrements }

}

export { chunkingStorage }