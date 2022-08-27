import { Offset } from '../offset.js'
import { Node, Rlshp, Prop } from '../graph.js'
import { NodesEncoder, NodesDecoder, RlshpsEncoder, RlshpsDecoder, PropsEncoder, PropsDecoder } from '../encoding.js'
import { chunkers } from '../chunkers.js'
import { chunkStore } from '../chunk-store.js'
import { blockStore } from '../block-store.js'
import { unpack, pack } from 'msgpackr'
import * as assert from 'assert';
import { codec } from '../codec.js'

const random = max => Math.floor(Math.random() * max) + 1;

describe('Nodes fixed size binary encoded', function () {
    describe('serialized to chunk store', function () {
        it('should require minimal retrieval I/O', async function () {
            const nodeCount = 1000
            const nodes = []
            for (let index = 0; index < nodeCount; index++) {
                const node = new Node(new Offset(index * 52), `${index} node label`, new Offset(random(1024 * 1024)), new Offset(random(1024 * 1024)))
                nodes.push(node)
            }
            const nodesByteArray = new NodesEncoder(nodes).write().content()
            assert.equal(52 * nodeCount, nodesByteArray.length)
            const { encode, decode } = codec()
            const { get, put } = blockStore()
            const chunker = chunkers('fastcdc')
            const cs = await chunkStore()

            const { root, index, blocks } = await cs.create({ buf: nodesByteArray, chunker, encode }) //root CID
            console.log(`Byte array length ${nodesByteArray.byteLength}`)
            console.log(`Root CID ${root}`)
            blocks.forEach(block => put(block))

            const cs2 = await chunkStore()

            const startNode = 14
            const resultCount = 2
            const startOffset = 52 * startNode
            const byteLength = 52 * resultCount

            console.log()
            console.log()

            let loaded = 0
            const resultByteArray = await cs2.read(startOffset, byteLength, { root, get, decode }, info => {
                loaded = info.blocksLoaded
                console.log(`Blocks loaded ${loaded}`)
            })

            assert.equal(resultByteArray.byteLength, byteLength)
            assert.equal(loaded, 1)

            console.log()
            console.log()

            const nodesResult = new NodesDecoder(resultByteArray).read()
            console.log(nodesResult)

            assert.equal(nodesResult.length, resultCount)
            assert.equal(nodesResult[0].offset.offset, 52 * startNode)
            assert.equal(nodesResult[1].offset.offset, 52 * (startNode + 1))
        });
    });

    describe('serialized to chunk store', function () {
        it('should reuse blocks in case of changes 1 for the change another one for the size header', async function () {
            const nodeCount = 2000
            const nodes1 = []
            for (let index = 0; index < nodeCount; index++) {
                const node = new Node(new Offset(index * 52), `${index} node label`, new Offset(random(1024 * 1024)), new Offset(random(1024 * 1024)))
                nodes1.push(node)
            }
            const nodesByteArray1 = new NodesEncoder(nodes1).write().content()
            assert.equal(52 * nodeCount, nodesByteArray1.length)
            

            const nodes2 = [...nodes1]
            nodes2.push(new Node(new Offset(nodeCount * 52), `${nodeCount} node label`, new Offset(random(1024 * 1024)), new Offset(random(1024 * 1024))))

            const nodesByteArray2 = new NodesEncoder(nodes2).write().content()
            assert.equal(52 * (nodeCount + 1), nodesByteArray2.length)

            const { encode, decode } = codec()
            const { get, put } = blockStore()
            const minSize = 1024 * 1
            const avgSize = minSize * 2
            const maxSize = avgSize * 2
            const chunker = chunkers('fastcdc', {minSize, avgSize, maxSize})

            const cs = await chunkStore()

            const {blocks: blocks1 } = await cs.create({ buf: nodesByteArray1, chunker, encode }) 
            const {blocks: blocks2 } = await cs.create({ buf: nodesByteArray2, chunker, encode }) 
   
            const arr1 = blocks1.map(block => block.cid.toString())
            const arr2 = blocks2.map(block => block.cid.toString())

            let intersection = arr2.filter(x => arr1.includes(x));
            let difference = arr2.filter(x => !arr1.includes(x));
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr2.length ) * 100).toFixed(2)
            console.log(`Diff % ${diff}`)
            assert.equal(2, difference.length) // first chunk + last chunk
        });
    });
});

