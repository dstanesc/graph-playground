//import * as codec from '@ipld/dag-cbor'
//import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { create, createFrom, load } from 'ipld-vector'
import { blockStorage } from './block-storage.js'
import { Node, Rlshp, Prop } from './graph.js'
import { Offset } from './offset.js'

const opts = { width: 4, blockCodec: 'dag-cbor', blockAlg: 'sha2-256' }

class Block {
    constructor(cid, bytes) {
        this.cid = cid
        this.bytes = bytes
    }
}

const vectorStorage = async (history, blockStore, requestOffset) => {

    const nodeStore = blockStore
    const rlshpStore = blockStore
    const propStore = blockStore

    let { offset, nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset } = requestOffset !== undefined ?  await history.navigate(requestOffset) : await history.last()

    const nodeGet = async offset => {
        const nodeVector = await load(nodeStore, nodesRoot, opts)
        const value = await nodeVector.get(offset.toString())
        return Node.fromJson(value)
    }

    const rlshpGet = async offset => {
        const rlshpVector = await load(rlshpStore, rlshpsRoot, opts)
        const value = await rlshpVector.get(offset.toString())
        return Rlshp.fromJson(value)
    }

    const propGet = async offset => {
        const propVector = await load(propStore, propsRoot, opts)
        const value = await propVector.get(offset.toString())
        return Prop.fromJson(value)
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

    const storageCommit = async (nodes, rlshps, props, nOffset, rOffset, pOffset) => {


        const update = nodesRoot !== undefined

        let nodeVector
        let rlshpVector
        let propVector

        if (update) {
            nodeVector = await load(nodeStore, nodesRoot, opts)
            rlshpVector = await load(rlshpStore, rlshpsRoot, opts)
            propVector = await load(propStore, propsRoot, opts)
        } else {
            nodeVector = await create(nodeStore, opts)
            rlshpVector = await create(rlshpStore, opts)
            propVector = await create(propStore, opts)
        }

        for (const node of nodes) {
            await nodeVector.push(node.toJson())
        }
        for (const rlshp of rlshps) {
            await rlshpVector.push(rlshp.toJson())
        }
        for (const prop of props) {
            await propVector.push(prop.toJson())
        }

        nodesRoot = nodeVector.cid
        rlshpsRoot = rlshpVector.cid
        propsRoot = propVector.cid

        nodeOffset = nOffset
        rlshpOffset = rOffset
        propOffset = pOffset

        offset = await history.push({ nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset: offset})

        return roots()
    }

    const roots = () => {
        return { nodesRoot, rlshpsRoot, propsRoot }
    }


    const blocks = async ({ nodesRoot, rlshpsRoot, propsRoot }) => {

        const nodeVector = await load(nodeStore, nodesRoot, opts)
        const rlshpVector = await load(rlshpStore, rlshpsRoot, opts)
        const propVector = await load(propStore, propsRoot, opts)

        let nodeBlocks = []
        let rlshpBlocks = []
        let propBlocks = []

        for await (const cid of nodeVector.cids()) {
            nodeBlocks.push(new Block(cid, await nodeStore.get(cid)))
        }

        for await (const cid of rlshpVector.cids()) {
            rlshpBlocks.push(new Block(cid, await rlshpStore.get(cid)))
        }

        for await (const cid of propVector.cids()) {
            propBlocks.push(new Block(cid, await propStore.get(cid)))
        }

        return { nodeBlocks, rlshpBlocks, propBlocks }
    }


    const showBlocks = async ({ nodesRoot, rlshpsRoot, propsRoot }) => {

        const { nodeBlocks, rlshpBlocks, propBlocks } = await blocks({ nodesRoot, rlshpsRoot, propsRoot })

        console.log('---')
        let sum = 0
        for (const block of await nodeBlocks) {
            const cid = block.cid
            sum += block.bytes.length
            console.log(`Nodes block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        for (const block of await rlshpBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
            console.log(`Rlshp block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        for (const block of await propBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
            console.log(`Prop block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    const size = async ({ nodesRoot, rlshpsRoot, propsRoot }) => {

        const { nodeBlocks, rlshpBlocks, propBlocks } = await blocks({ nodesRoot, rlshpsRoot, propsRoot })

        let sum = 0
        for (const block of await nodeBlocks) {
            sum += block.bytes.length
        }
        for (const block of await rlshpBlocks) {
            sum += block.bytes.length
        }
        for (const block of await propBlocks) {
            sum += block.bytes.length
        }
        return sum
    }

    const count = async ({ nodesRoot, rlshpsRoot, propsRoot }) => {
        const { nodeBlocks, rlshpBlocks, propBlocks } = await blocks({ nodesRoot, rlshpsRoot, propsRoot })
        let c = (await nodeBlocks).length
        c += (await rlshpBlocks).length
        c += (await propBlocks).length
        return c
    }

    return {nodeOffsetGet, rlshpOffsetGet, propOffsetGet,  storageCommit, size, count, roots, blocks, showBlocks, nodeGet, rlshpGet, propGet }
}


export { vectorStorage }