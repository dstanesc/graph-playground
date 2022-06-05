import { blockStorage } from './block-storage.js'
import { create, load } from 'ipld-hashmap'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'

const opts = { bitWidth: 4, bucketSize: 3, blockHasher, blockCodec }

const history = async () => {

    const blockStore = blockStorage()

    let root

    const push = async ({ nodesRoot, rlshpsRoot, propsRoot, prevOffset }) => {
        const map = await getMap()
        const offset = (await map.size()).toString()
        await  map.set(offset, { offset, nodesRoot, rlshpsRoot, propsRoot, prevOffset })
        root = map.cid
        return offset
    }

    const current = async () => {
        const map = await getMap()
        const currentOffset = (await map.size()) - 1
        let commit
        if (currentOffset === -1)
            commit = { offset: '0', nodesRoot: undefined, rlshpsRoot: undefined, propsRoot: undefined, prevOffset: '-1'}
        else
            commit = await map.get(currentOffset.toString())
        return commit
    }

    const navigate = async requestOffset => {
        const map = await getMap()
        const commit = await map.get(requestOffset.toString())
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
            let { offset, nodesRoot, rlshpsRoot, propsRoot, prevOffset } = await navigate(commit)
            console.log(`History commit=${await commit}`)
            console.log(`History offset=${offset}`)
            console.log(`History nodesRoot=${nodesRoot}`)
            console.log(`History rlshpsRoot=${rlshpsRoot}`)
            console.log(`History propsRoot=${propsRoot}`)
            console.log(`History prevOffset=${prevOffset}`)
        }
        console.log('---')
    }

    const getMap = async () => {
        return root !== undefined ? await load(blockStore, root, opts) : await create(blockStore, opts)
    }

    return { root, blockStore, push, current, navigate, size, show }
}

export { history }