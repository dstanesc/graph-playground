import { create, createFrom, load } from 'ipld-vector'

const storage = () => {
    const blocks = {}
    const put = (cid, block) => {
        if (blocks[cid.toString()]) {
            console.log(`Block exists ${cid.toString}`);
        } else
            blocks[cid.toString()] = block
    }
    const get = cid => {
        const block = blocks[cid.toString()]
        if (!block) throw new Error('Not found')
        return block
    }
    const diff = otherStorage => {
        const added = []
        const reused = []
        for (const key of Object.keys(blocks)) {
            if (otherStorage.blocks[key]) {
                reused.push(key)
            } else {
                added.push(key)
            }
        }
        return { added, reused }
    }

    return { get, put, blocks, diff }
}

const vectorStorage = async () => {

    let nodeStore = storage()
    let rlshpStore = storage()
    let nodeVector = await create(nodeStore, { width: 3 })
    let rlshpVector = await create(rlshpStore, { width: 3 })

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

    return { nodeVector, rlshpVector, nodeStore, rlshpStore, showBlocks, diff }
}


export { storage, vectorStorage }