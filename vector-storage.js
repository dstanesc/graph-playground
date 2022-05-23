//import * as codec from '@ipld/dag-cbor'
//import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { create, createFrom, load } from 'ipld-vector'
import { blockStorage } from './block-storage.js'

const vectorStorage = async () => {

    let nodeStore = blockStorage()
    let rlshpStore = blockStorage()
    let nodeVector = await create(nodeStore, { width: 3, blockCodec: 'dag-cbor', blockAlg: 'sha2-256' })
    let rlshpVector = await create(rlshpStore, { width: 3, blockCodec: 'dag-cbor', blockAlg: 'sha2-256' })

    const showBlocks = async () => {
        let sum = 0
        for await (const cid of nodeVector.cids()) {
            const block = nodeStore.get(cid);
            sum += block.length
            console.log(`Nodes block: ${cid.toString()} ${block.length} bytes`);
        }
        console.log('---')
        for await (const cid of rlshpVector.cids()) {
            const block = rlshpStore.get(cid);
            sum += block.length
            console.log(`Rlshp block: ${cid.toString()} ${block.length} bytes`);
        }
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    const storageCommit = async (nodes, rlshps) => {
        console.log('Committing to vector')
        for (const node of nodes) {
            //console.log(`Committing node ${node.toString()}`)
            await nodeVector.push(node.toJson())
        }
        for (const rlshp of rlshps) {
            //console.log(`Committing rlshp ${rlshp.toString()}`)
            await rlshpVector.push(rlshp.toJson())
        }
    }

    const diff = otherStorage => {
        const diffNodes = nodeStore.diff(otherStorage.nodeStore)
        const diffRlshp = rlshpStore.diff(otherStorage.rlshpStore)
        return { diffNodes, diffRlshp }
    }

    const load = (cidNode, cidRlshp) => {
        nodeVector = load(nodeStore, cidNode)
        rlshpVector = load(rlshpStore, cidRlshp)
        return { nodeVector, rlshpVector }
    }

    return { nodeStore, rlshpStore, storageCommit, showBlocks, diff }
}


export { vectorStorage }