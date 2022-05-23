
const blockStorage = () => {
    const blocks = {}
    const put = (cid, block) => {
        if (blocks[cid.toString()]) {
            //console.log(`Block exists ${cid.toString}`);
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
        const percent = ((reused.length / (added.length + reused.length)) * 100).toFixed(2)
        return { added, reused, percent }
    }

    return { get, put, blocks, diff }
}

export { blockStorage }