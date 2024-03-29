import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { create, load } from 'prolly-trees/map'
import { bf, simpleCompare as compare } from 'prolly-trees/utils'
import { nocache, global as globalCache } from 'prolly-trees/cache'
import { blockStorage } from './block-storage.js'
import { Node, Rlshp, Prop } from './graph.js'
import { Offset } from './offset.js'

const chunker = bf(3)

const cache = globalCache

const opts = { cache, chunker, codec, hasher }

const prollyStorage = async (history, blockStore, requestOffset) => {

    const nodeStore = blockStore
    const rlshpStore = blockStore
    const propStore = blockStore

    let { offset, nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset } = requestOffset !== undefined ? await history.navigate(requestOffset) : await history.last()

    const mapToList = (input) => {
        return Array.from(input).map((elem) => ({ key: elem[0], value: elem[1].toJson() }))
    }
    const nodesCreate = async (nodes) => {
        //const list = nodes.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const list = mapToList(nodes)
        const get = nodeStore.get
        const blocks = []
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await nodeStore.put(cid, block)
            nodesRoot = address.toString()
            blocks.push(block)
        }
        return blocks
    }

    const rlshpsCreate = async (rlshps) => {
        //const list = rlshps.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const list = mapToList(rlshps)
        const get = rlshpStore.get
        const blocks = []
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await rlshpStore.put(cid, block)
            rlshpsRoot = address.toString()
            blocks.push(block)
        }
        return blocks
    }


    const propsCreate = async (props) => {
        //const list = props.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
        const list = mapToList(props)
        const get = propStore.get
        const blocks = []
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await propStore.put(cid, block)
            propsRoot = address.toString()
            blocks.push(block)
        }
        return blocks
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

    const nodeGet = async offset => {
        const actualRoot = await loadNodesRoot(nodesRoot)
        const { result: value } = await actualRoot.get(offset.toString())
        return Node.fromJson(value)
    }

    const rlshpGet = async offset => {
        const actualRoot = await loadRlshpsRoot(rlshpsRoot)
        const { result: value } = await actualRoot.get(offset.toString())
        return Rlshp.fromJson(value)
    }

    const propGet = async offset => {
        const actualRoot = await loadPropsRoot(propsRoot)
        const { result: value } = await actualRoot.get(offset.toString())
        return Prop.fromJson(value)
    }

    const loadNodesRoot = async offset => {
        const get = nodeStore.get
        return await load({ cid: offset, get, compare, ...opts })
    }

    const loadRlshpsRoot = async offset => {
        const get = rlshpStore.get
        return await load({ cid: offset, get, compare, ...opts })
    }

    const loadPropsRoot = async offset => {
        const get = propStore.get
        return await load({ cid: offset, get, compare, ...opts })
    }

    const nodesUpdate = async (nodes) => {
        if (nodes.size > 0) {
            //const bulk = nodes.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
            const list = mapToList(nodes)
            const actualRoot = await loadNodesRoot(nodesRoot)
            const { blocks, root } = await actualRoot.bulk(list)
            await Promise.all(blocks.map(b => nodeStore.put(b.cid, b)))
            nodesRoot = (await root.address).toString()
            return blocks
        } else return []
    }

    const rlshpsUpdate = async (rlshps) => {
        if (rlshps.size > 0) {
            //const list = rlshps.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
            const list = mapToList(rlshps)
            const actualRoot = await loadRlshpsRoot(rlshpsRoot)
            const { blocks, root } = await actualRoot.bulk(list)
            await Promise.all(blocks.map(b => rlshpStore.put(b.cid, b)))
            rlshpsRoot = (await root.address).toString()
            return blocks
        } else return []
    }

    const propsUpdate = async (props) => {
        if (props.size > 0) {
            //const list = props.map((elem) => ({ key: elem.offset.toString(), value: elem.toJson() }))
            const list = mapToList(props)
            const actualRoot = await loadPropsRoot(propsRoot)
            const { blocks, root } = await actualRoot.bulk(list)
            await Promise.all(blocks.map(b => propStore.put(b.cid, b)))
            propsRoot = (await root.address).toString()
            return blocks
        } else return []
    }

    //FIXME log changes before distributed commit
    const storageCommit = async (nodesComplete, rlshpsComplete, propsComplete, nodesAdded, rlshpsAdded, propsAdded, nOffset, rOffset, pOffset) => {
        let nodeBlocks
        let rlshpBlocks
        let propBlocks
        const update = nodesRoot !== undefined
        if (update) {
            nodeBlocks = await nodesUpdate(nodesAdded)
            rlshpBlocks = await rlshpsUpdate(rlshpsAdded)
            propBlocks = await propsUpdate(propsAdded)
        } else {
            nodeBlocks = await nodesCreate(nodesAdded)
            rlshpBlocks = await rlshpsCreate(rlshpsAdded)
            propBlocks = await propsCreate(propsAdded)
        }

        nodeOffset = nOffset
        rlshpOffset = rOffset
        propOffset = pOffset

        offset = await history.push({ nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset: offset })

        return { nodeBlocks, rlshpBlocks, propBlocks, update }
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
        for (const block of await rlshpBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
        }
        for (const block of await propBlocks) {
            const cid = block.cid;
            sum += block.bytes.length
        }
        return sum;
    }

    const count = async ({ nodeBlocks, rlshpBlocks, propBlocks }) => {
        let c = (await nodeBlocks).length
        c += (await rlshpBlocks).length
        c += (await propBlocks).length
        return c
    }


    return { nodesRootGet, rlshpsRootGet, propsRootGet, nodeOffsetGet, rlshpOffsetGet, propOffsetGet, storageCommit, showBlocks, size, count, nodeGet, rlshpGet, propGet }
}

export { prollyStorage }