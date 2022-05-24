//import * as codec from '@ipld/dag-cbor'
//import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { create, createFrom, load } from 'ipld-vector'
import { blockStorage } from './block-storage.js'

const vectorStorage = async () => {

    let nodeStore = blockStorage()
    let rlshpStore = blockStorage()
    let propStore = blockStorage()

    let nodeVector = await create(nodeStore, { width: 3, blockCodec: 'dag-cbor', blockAlg: 'sha2-256' })
    let rlshpVector = await create(rlshpStore, { width: 3, blockCodec: 'dag-cbor', blockAlg: 'sha2-256' })
    let propVector = await create(propStore, { width: 3, blockCodec: 'dag-cbor', blockAlg: 'sha2-256' })

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
        console.log('---')
        for await (const cid of propVector.cids()) {
            const block = propStore.get(cid);
            sum += block.length
            console.log(`Prop block: ${cid.toString()} ${block.length} bytes`);
        }
        console.log(`Total stored size ${(sum / (1024)).toFixed(2)} KB`);
    }

    const storageCommit = async (nodes, rlshps, props) => {
        console.log('Committing to vector')
        for (const node of nodes) {
            //console.log(`Committing node ${node.toString()}`)
            await nodeVector.push(node.toJson())
        }
        for (const rlshp of rlshps) {
            //console.log(`Committing rlshp ${rlshp.toString()}`)
            await rlshpVector.push(rlshp.toJson())
        }
        for (const prop of props) {
            //console.log(`Committing rlshp ${rlshp.toString()}`)
            await propVector.push(prop.toJson())
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


export { vectorStorage }