import { Offset } from '../offset.js'
import { Node, Rlshp, Prop } from '../graph.js'
import { NodesEncoder, NodesDecoder, RlshpsEncoder, RlshpsDecoder, PropsEncoder, PropsDecoder } from '../encoding.js'
import { chunkers } from '../chunkers.js'
import { chunkStore } from '../chunk-store.js'
import { blockStorage } from '../block-storage.js'
import { unpack, pack } from 'msgpackr'
import * as assert from 'assert';


const random = max => {
    return Math.floor(Math.random() * max) + 1;
}

const io = blocksLoaded => {
    console.log(blocksLoaded)
}

describe('Nodes', function () {
    describe('Serialized to chunk store', function () {
        it('Should require minimal retrieval I/O', async function () {
            const nodeCount = 1000
            const nodes = []
            for (let index = 0; index < nodeCount; index++) {
                const node = new Node(new Offset(index * 52), `${index} node label`, new Offset(random(1024 * 1024)), new Offset(random(1024 * 1024)))
                nodes.push(node)
            }
            const nodesByteArray = new NodesEncoder(nodes).write().content()
            assert.equal(52 * nodeCount, nodesByteArray.length)

            const blockStore = blockStorage()
            const chunker = chunkers('fastcdc')
            const cs = await chunkStore({ blockStore, chunker })

            const root = await cs.write(nodesByteArray) //root CID
            console.log(`Byte array length ${nodesByteArray.byteLength}`)
            console.log(`Root CID ${root}`)

            const cs2 = await chunkStore({ blockStore, chunker, root })

            const startNode = 14
            const resultCount = 2
            const startOffset = 52 * startNode
            const byteLength = 52 * resultCount

            console.log()
            console.log()

            let blocksLoaded = 0
            
            const resultByteArray = await cs2.read(startOffset, byteLength, blocks => {
                blocksLoaded = blocks
                console.log(`Blocks loaded ${blocksLoaded}`)
            })

            assert.equal(resultByteArray.byteLength, byteLength)
            assert.equal(blocksLoaded,  1)

            console.log()
            console.log()

            const nodesResult = new NodesDecoder(resultByteArray).read()
            console.log(nodesResult)
            
            assert.equal(nodesResult.length, resultCount)
            assert.equal(nodesResult[0].offset.offset, 52 * startNode)
            assert.equal(nodesResult[1].offset.offset, 52 * (startNode + 1))
        });
    });
});

