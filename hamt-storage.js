import { create, load } from 'ipld-hashmap'
import { blockStorage } from './block-storage.js'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'
import {Node, Rlshp, Prop} from './graph.js'

// - bitWidth (number, default 8) - The number of bits to extract from the hash to form a data element index at each level of the Map, e.g. a bitWidth of 5 will extract 5 bits to be used as the data element index, since 2^5=32, each node will store up to 32 data elements (child nodes and/or entry buckets). The maximum depth of the Map is determined by floor((hashBytes * 8) / bitWidth) where hashBytes is the number of bytes the hash function produces, e.g. hashBytes=32 and bitWidth=5 yields a maximum depth of 51 nodes. The maximum bitWidth currently allowed is 8 which will store 256 data elements in each node.

// - bucketSize (number, default 5) - The maximum number of collisions acceptable at each level of the Map. A collision in the bitWidth index at a given depth will result in entries stored in a bucket (array). Once the bucket exceeds bucketSize, a new child node is created for that index and all entries in the bucket are pushed

const opts = { bitWidth: 4, bucketSize: 3, blockHasher, blockCodec }

class Block {
    constructor(cid, bytes) {
        this.cid = cid
        this.bytes = bytes
    }
}

const hamtStorage = async () => {

    let nodeStore = blockStorage()
    let rlshpStore = blockStorage()
    let propStore = blockStorage()

    let nodesRoot
    let rlshpsRoot
    let propsRoot

    const showStoredBlocks = async () => {
        let sum = 0
        for await (const cid of nodeMap.cids()) {
            const block = nodeStore.get(cid);
            sum += block.length
            console.log(`Nodes block: ${cid.toString()} ${block.length} bytes`);
        }
        console.log('---')
        for await (const cid of rlshpMap.cids()) {
            const block = rlshpStore.get(cid);
            sum += block.length
            console.log(`Rlshp block: ${cid.toString()} ${block.length} bytes`);
        }
        console.log('---')
        for await (const cid of propMap.cids()) {
            const block = propStore.get(cid);
            sum += block.length
            console.log(`Prop block: ${cid.toString()} ${block.length} bytes`);
        }
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    //FIXME log changes before distributed commit
    const storageCommit = async (nodes, rlshps, props) => {

        const update = nodesRoot !== undefined

        let nodeMap
        let rlshpMap
        let propMap

        if (update) {
            nodeMap = await load(nodeStore, nodesRoot, opts)
            rlshpMap = await load(rlshpStore, rlshpsRoot, opts)
            propMap = await load(propStore, propsRoot, opts)
        } else {
            nodeMap = await create(nodeStore, opts)
            rlshpMap = await create(rlshpStore, opts)
            propMap = await create(propStore, opts)
        }

        for (const node of nodes) {
            await nodeMap.set(node.offset.toString(), node.toJson())
        }
        for (const rlshp of rlshps) {
            await rlshpMap.set(rlshp.offset.toString(), rlshp.toJson())
        }
        for (const prop of props) {
            await propMap.set(prop.offset.toString(), prop.toJson())
        }

        nodesRoot = nodeMap.cid
        rlshpsRoot = rlshpMap.cid
        propsRoot = propMap.cid

        return roots()
    }

    const nodeGet = async offset => {
        const nodeMap = await load(nodeStore, nodesRoot, opts)
        const value = await nodeMap.get(offset.toString())
        return Node.fromJson(value)
    }

    const rlshpGet = async offset => {
        const rlshpMap = await load(rlshpStore, rlshpsRoot, opts)
        const value = await rlshpMap.get(offset.toString())
        return Rlshp.fromJson(value)
    }

    const propGet = async offset => {
        const propMap = await load(propStore, propsRoot, opts)
        const value = await propMap.get(offset.toString())
        return Prop.fromJson(value)
    }

    const roots = () => {

        return { nodesRoot, rlshpsRoot, propsRoot }
    }

    const blocks = async ({ nodesRoot, rlshpsRoot, propsRoot }) => {

        const nodeMap = await load(nodeStore, nodesRoot, opts)
        const rlshpMap = await load(rlshpStore, rlshpsRoot, opts)
        const propMap = await load(propStore, propsRoot, opts)

        let nodeBlocks = []
        let rlshpBlocks = []
        let propBlocks = []

        for await (const cid of nodeMap.cids()) {
            nodeBlocks.push(new Block(cid, await nodeStore.get(cid)))
        }

        for await (const cid of rlshpMap.cids()) {
            rlshpBlocks.push(new Block(cid, await rlshpStore.get(cid)))
        }

        for await (const cid of propMap.cids()) {
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

    return { nodeStore, rlshpStore, propStore, storageCommit, showStoredBlocks, size, count, roots, blocks, showBlocks, nodeGet, rlshpGet, propGet }
}


export { hamtStorage }