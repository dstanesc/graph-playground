import { chunkers } from '../chunkers.js'
import { chunkStore } from '../chunk-store.js'
import { blockStorage } from '../block-storage.js'
import { partReport } from '@dstanesc/fake-metrology-data'
import { unpack, pack } from 'msgpackr'
import * as assert from 'assert';

describe('Chunk Store', function () {
    describe('Indexing', function () {
        it('Should serialize and deserialize the offset index w/o errors', async function () {
            const blockStore = blockStorage()
            const chunker = chunkers('fastcdc')
            const cs = await chunkStore({ blockStore, chunker })
            const reportData = partReport({ reportSize: 300 })
            const buf = pack(reportData)
            const { root, index } = await cs.writeIndex(buf)

            console.log(index)

            const index2 = await cs.readIndex(root)

            console.log(index2)
            console.log(root)
            console.log(index2.indexSize)
            console.log(index2.byteArraySize)

            assert.equal(index.indexSize, index2.indexSize)
            assert.equal(index.byteArraySize, index2.byteArraySize)
            assert.equal(Object.keys(index).length, Object.keys(index2).length)
            assert.equal(index.startOffsets.get(0).toString(), index2.startOffsets.get(0).toString())
        });
    });

    describe('Chunk selection', function () {
        it('Should find relevant chunks for offset range', async function () {
            const blockStore = blockStorage()
            const chunker = chunkers('fastcdc')
            const cs = await chunkStore({ blockStore, chunker })
            const reportData = partReport({ reportSize: 300 })
            const buf = pack(reportData)
            const byteLength = buf.byteLength
            const root = await cs.write(buf) //root CID
            console.log(root)
            const index = await cs.readIndex(root)
            const startOffset = 1024 * 1024
            const endOffset = 1024 * 1024 + 1024 * 1024
            const startOffsetArray = Array.from(index.startOffsets.keys())
            const selected = cs.relevantChunks(startOffsetArray, startOffset, endOffset)
            console.log(startOffsetArray)
            console.log(selected)
            console.log(`Buffer size=${byteLength} slice start=${startOffset} end=${endOffset}`)

        });
    });

    describe('Retrieval', function () {
        it('Should retrieve by offset', async function () {
            const blockStore = blockStorage()
            const chunker = chunkers('fastcdc')
            const cs = await chunkStore({ blockStore, chunker })
            const reportData = partReport({ reportSize: 300 })
            const buf = pack(reportData)
            const root = await cs.write(buf) //root CID
            console.log(root)

            const cs2 = await chunkStore({ blockStore, chunker, root })

            const startOffset = 1024 * 64
            const byteLength = 1024 * 12
            const found = await cs2.read(startOffset, byteLength)
            console.log(found)
            assert.equal(found.byteLength, byteLength)
        });
    });

    describe('Retrieval', function () {
        it('Should properly store and retrieve very small buffers', async function () {
            const blockStore = blockStorage()
            const chunker = chunkers('fastcdc')
            const cs = await chunkStore({ blockStore, chunker })
            const reportData = {"hello" : "world"}
            const buf = pack(reportData)
            const root = await cs.write(buf) //root CID
            console.log(buf.byteLength)
            console.log(root)
            const cs2 = await chunkStore({ blockStore, chunker, root })
            const startOffset = 0
            const byteLength = buf.byteLength
            const found = await cs2.read(startOffset, byteLength)
            assert.equal(found.byteLength, buf.byteLength)
            console.log(found)
            const hello = unpack(found)
            console.log(hello)
            assert.equal(hello.hello, 'world')
        });
    });


    describe('Retrieval', function () {
        it('Should fail when retrieving  offsets larger than buffer', async function () {
            const blockStore = blockStorage()
            const chunker = chunkers('fastcdc')
            const cs = await chunkStore({ blockStore, chunker })
            const reportData = partReport({ reportSize: 300 })
            const buf = pack(reportData)
            const root = await cs.write(buf) //root CID
            console.log(root)

            const cs2 = await chunkStore({ blockStore, chunker, root })

            const startOffset = 1024 * 1024
            const byteLength = 1024 * 1024 + 1024 * 1024

            cs2.read(startOffset, byteLength).then(res => { assert.fail('Should not retrieve but throw') }).catch(err => console.error(err));
        });
    });


});

