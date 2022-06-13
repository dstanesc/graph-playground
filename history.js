import { CID } from 'multiformats/cid'
import { blockStorage } from './block-storage.js'
import { create, load } from 'ipld-hashmap'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'
import { Offset } from './offset.js'

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

    const current = async () => {
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

    const commits = async () => {
        const map = await getMap()
        return await map.keys()
    }

    const show = async () => {
        console.log(`History size = ${await size()}`)
        for await (const commit of await commits()) {
            let entry = await navigate(commit)
            console.log(JSON.stringify(entry, null, 2))
        }
        console.log('---')
    }

    const getMap = async () => {
        return root !== undefined ? await load(blockStore, CID.parse(root), opts) : await create(blockStore, opts)
    }

    return { rootGet, push, current, navigate, size, show }
}

export { history }