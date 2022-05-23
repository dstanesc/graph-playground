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
    let nodesRoot
    let rlshpsRoot
    const nodesCommit = async (nodes) => {
        // for (const node of nodes) {
        //     console.log(`Committing node ${node.toString()}`)
        // }
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
        // for (const rlshp of rlshps) {
        //     console.log(`Committing rlshp ${rlshp.toString()}`)
        // }
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

    const storageCommit = async (nodes, rlshps) => {
        console.log('Committing to prolly')
        await nodesCommit(nodes)
        await rlshpsCommit(rlshps)
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
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    const diff = otherStorage => {
        const diffNodes = nodeStore.diff(otherStorage.nodeStore)
        const diffRlshp = rlshpStore.diff(otherStorage.rlshpStore)
        return { diffNodes, diffRlshp }
    }

    return { nodeStore, rlshpStore, storageCommit, showBlocks, diff }
}

export { prollyStorage }