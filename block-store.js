const blockStore = other => {
    const blocks = Object.assign({}, other);
    const put = block => {
        blocks[block.cid.toString()] = block.bytes
    }
    const get = async cid => {
        const bytes = blocks[cid.toString()]
        if (!bytes) throw new Error('Block Not found for ' + cid.toString())
        return bytes
    }
    const size = () => {
        return Object.keys(blocks).length
    }
    return { get, put, size }
}

export { blockStore }