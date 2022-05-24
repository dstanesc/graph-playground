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
    const nodesCommit = async (nodes) => {
        const list = nodes.map((elem, index) => ({ key: index.toString(), value: elem.toJson() }))
        const get = nodeStore.get
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await nodeStore.put(cid, block)
            nodesRoot = node
        }
    }

    const rlshpsCommit = async (rlshps) => {
        const list = rlshps.map((elem, index) => ({ key: index.toString(), value: elem.toJson() }))
        const get = rlshpStore.get
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await rlshpStore.put(cid, block)
            rlshpsRoot = node
        }
    }

    const propsCommit = async (props) => {
        const list = props.map((elem, index) => ({ key: index.toString(), value: elem.toJson() }))
        const get = propStore.get
        for await (const node of create({ get, compare, list, ...opts })) {
            const address = await node.address
            const block = await node.block
            const cid = block.cid
            await propStore.put(cid, block)
            propsRoot = node
        }
    }

    const storageCommit = async (nodes, rlshps, props) => {
        console.log('Committing to prolly')
        await nodesCommit(nodes)
        await rlshpsCommit(rlshps)
        await propsCommit(props)
    }

    const showBlocks = async () => {
        let sum = 0
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
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    const diff = otherStorage => {
        const diffNodes = nodeStore.diff(otherStorage.nodeStore)
        const diffRlshp = rlshpStore.diff(otherStorage.rlshpStore)
        const diffProps = propStore.diff(otherStorage.propStore)
        return { diffNodes, diffRlshp, diffProps }
    }

    return { nodeStore, rlshpStore, propStore, storageCommit, showBlocks, diff }
}

export { prollyStorage }