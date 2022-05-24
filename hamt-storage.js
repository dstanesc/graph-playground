import { create, load } from 'ipld-hashmap'
import { blockStorage } from './block-storage.js'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'

const hamtStorage = async () => {

    let nodeStore = blockStorage()
    let rlshpStore = blockStorage()
    let propStore = blockStorage()
    let nodeMap = await create(nodeStore, { bitWidth: 3, bucketSize: 2, blockHasher, blockCodec })
    let rlshpMap = await create(rlshpStore, { bitWidth: 3, bucketSize: 2, blockHasher, blockCodec })
    let propMap = await create(propStore, { bitWidth: 3, bucketSize: 2, blockHasher, blockCodec })

    const showBlocks = async () => {
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

    const storageCommit = async (nodes, rlshps, props) => {
        console.log('Committing to hamt')
        for (const node of nodes) {
            //console.log(`Committing node ${node.toString()}`)
            await nodeMap.set(node.offset.toString(), node.toJson())
        }
        for (const rlshp of rlshps) {
            //console.log(`Committing rlshp ${rlshp.toString()}`)
            await rlshpMap.set(rlshp.offset.toString(), rlshp.toJson())
        }
        for (const prop of props) {
            //console.log(`Committing rlshp ${rlshp.toString()}`)
            await propMap.set(prop.offset.toString(), prop.toJson())
        }
    }

    const diff = otherStorage => {
        const diffNodes = nodeStore.diff(otherStorage.nodeStore)
        const diffRlshp = rlshpStore.diff(otherStorage.rlshpStore)
        const diffProps = propStore.diff(otherStorage.propStore)
        return { diffNodes, diffRlshp, diffProps }
    }

    return { nodeStore, rlshpStore, propStore, storageCommit, showBlocks, diff }
}


export { hamtStorage }