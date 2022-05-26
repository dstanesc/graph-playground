
const blockStorage = () => {
    const blocks = {}
    const put = (cid, block) => {
        if (blocks[cid.toString()]) {
            //console.log(`Block exists ${cid.toString}`);
        } else
            blocks[cid.toString()] = block
    }
    const get = async cid => {
        const block = blocks[cid.toString()]
        if (!block) throw new Error('Block Not found for ' + cid.toString())
        return block
    }
    const size = () => {
        return Object.keys(blocks).length
    }

    return { get, put, blocks, size }
}

export { blockStorage }