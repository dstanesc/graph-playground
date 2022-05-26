import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { create, load } from 'prolly-trees/map'
import { bf, simpleCompare as compare } from 'prolly-trees/utils'
import { nocache } from 'prolly-trees/cache'
import { blockStorage } from './block-storage.js'

const chunker = bf(3)

const cache = nocache

const opts = { cache, chunker, codec, hasher }

const prollyStorage = () => {

    let nodeStore = blockStorage()
    let rlshpStore = blockStorage()
    let propStore = blockStorage()
    let nodesRoot
    let rlshpsRoot
    let propsRoot
    const nodesCreate = async (nodes) => {
        const list = nodes.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const get = nodeStore.get
        const blocks = []
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await nodeStore.put(cid, block)
            nodesRoot = node
            blocks.push(block)
        }
        return blocks
    }

    const rlshpsCreate = async (rlshps) => {
        const list = rlshps.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const get = rlshpStore.get
        const blocks = []
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await rlshpStore.put(cid, block)
            rlshpsRoot = node
            blocks.push(block)
        }
        return blocks
    }

    const propsCreate = async (props) => {
        const list = props.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const get = propStore.get
        const blocks = []
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await propStore.put(cid, block)
            propsRoot = node
            blocks.push(block)
        }
        return blocks
    }

    const nodesUpdate = async (nodes) => {
        const bulk = nodes.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const blocks = await nodesRoot.bulk(bulk)
        nodesRoot = blocks.root
        return blocks.blocks
    }

    const rlshpsUpdate = async (rlshps) => {
        const list = rlshps.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const { blocks, root } = await rlshpsRoot.bulk(list)
        rlshpsRoot = root
        return blocks
    }

    const propsUpdate = async (props) => {
        const list = props.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const { blocks, root } = await propsRoot.bulk(list)
        propsRoot = root
        return blocks
    }

    const storageCommit = async (nodes, rlshps, props) => {
        let nodeBlocks
        let rlshpBlocks
        let propBlocks
        const update = nodesRoot !== undefined
        if (update) {
            nodeBlocks = await nodesUpdate(nodes)
            rlshpBlocks = await rlshpsUpdate(rlshps)
            propBlocks = propsUpdate(props)
        } else {
            nodeBlocks = await nodesCreate(nodes)
            rlshpBlocks = await rlshpsCreate(rlshps)
            propBlocks = await propsCreate(props)
        }
        return { nodeBlocks, rlshpBlocks, propBlocks, update }
    }

    const showStoredBlocks = async () => {
        let sum = 0
        console.log('---')
        for await (const cid of Object.keys(nodeStore.blocks)) {
            const block = nodeStore.blocks[cid];
            sum += block.bytes.length
            console.log(`Nodes block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        for await (const cid of Object.keys(rlshpStore.blocks)) {
            const block = rlshpStore.blocks[cid];
            sum += block.bytes.length
            console.log(`Rlshp block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        for await (const cid of Object.keys(propStore.blocks)) {
            const block = propStore.blocks[cid];
            sum += block.bytes.length
            console.log(`Prop block: ${cid.toString()} ${block.bytes.length} bytes`);
        }
        console.log('---')
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    const showBlocks = async ({ nodeBlocks, rlshpBlocks, propBlocks, update }) => {

        console.log(`\n${update ? 'Updating graph' : 'Creating graph'}`)
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

    const size = async ({ nodeBlocks, rlshpBlocks, propBlocks }) => {
        let sum = 0
        for (const block of await nodeBlocks) {
            const cid = block.cid
            sum += block.bytes.length
        }
        console.log('---')
        for (const block of await rlshpBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
        }
        console.log('---')
        for (const block of await propBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
        }
        return sum;
    }

    const percent = async ({ nodeBlocks, rlshpBlocks, propBlocks }) => {
        const percentNodes = (((await nodeBlocks).length / nodeStore.size()) * 100).toFixed(2)
        const percentRlshp = (((await rlshpBlocks).length / rlshpStore.size()) * 100).toFixed(2)
        const percentProps = (((await propBlocks).length / propStore.size()) * 100).toFixed(2)
        return { percentNodes, percentRlshp, percentProps }
    }

    return { nodeStore, rlshpStore, propStore, storageCommit, showBlocks, showStoredBlocks, size, percent }
}

export { prollyStorage }