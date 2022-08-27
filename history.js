import { CID } from 'multiformats/cid'
import { create, load } from 'ipld-hashmap'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'

const opts = { bitWidth: 4, bucketSize: 3, blockHasher, blockCodec }

const history = async (blockStore, root) => {

    const rootGet = () => {
        return root
    }

    const push = async ({ nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset }) => {
        const map = await getMap()
        const offset = (await map.size()).toString()
        await map.set(offset, { offset, nodesRoot, rlshpsRoot, propsRoot, nodeOffset, rlshpOffset, propOffset, prevOffset })
        root = map.cid.toString()
        return offset
    }

    const last = async () => {
        const map = await getMap()
        const lastOffset = (await map.size()) - 1
        return navigate(lastOffset)
    }

    const navigate = async requestOffset => {
        const map = await getMap()
        let commit
        if (requestOffset === -1)
            commit = { offset: 0, nodesRoot: undefined, rlshpsRoot: undefined, propsRoot: undefined, nodeOffset: 0, rlshpOffset: 0, propOffset: 0, prevOffset: -1 }
        else
            commit = await map.get(requestOffset.toString())
        return commit
    }

    const size = async () => {
        const map = await getMap()
        return await map.size()
    }

    const offsets = async () => {
        const map = await getMap()
        return await map.keys()
    }

    const show = async () => {
        console.log(`History size = ${await size()}`)
        for await (const commit of await offsets()) {
            let entry = await navigate(commit)
            console.log(JSON.stringify(entry, null, 2))
        }
        console.log('---')
    }

    const getMap = async () => {
        return root !== undefined ? await load(blockStore, CID.parse(root), opts) : await create(blockStore, opts)
    }

    const contains = async ({ nodesRoot, rlshpsRoot, propsRoot }) => {
        const size = await size()
        const map = await getMap()
        for (let index = size - 1; index > -1; index--) {
            const entry = await map.get(index.toString());
            if (nodesRoot === entry.nodesRoot && rlshpsRoot === entry.rlshpsRoot && propsRoot === entry.propsRoot)
                return entry
        }
        return undefined
    } 

    return { rootGet, push, last, navigate, size, show, contains, offsets }
}

export { history }