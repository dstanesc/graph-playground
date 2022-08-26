import { chunkers } from '../chunkers.js'
import { chunkStore } from '../chunk-store.js'
import { blockStore } from '../block-store.js'
import { unpack, pack } from 'msgpackr'
import * as lz4 from 'lz4js'
import * as pako from 'pako'
import * as json from 'multiformats/codecs/json'
import * as assert from 'assert';
import { codec } from '../codec.js'
import {  partReports } from '@dstanesc/fake-metrology-data'


async function readReportChunks(buf, {minSize, avgSize, maxSize}) {
    console.log(buf.byteLength)
    const { encode, decode } = codec()
    const { get, put } = blockStore()
    const chunker = chunkers('fastcdc', {minSize, avgSize, maxSize})
    const cs = await chunkStore()
    const { root, index, blocks } = await cs.create({ buf, chunker, encode })
    return blocks.map(block => block.cid.toString())
}
describe('Similar reports', function () {

    describe('multiformats/codecs/json to chunk store', function () {
        it('should reuse chunks', async function () {
            const minSize = 1024 * 32
            const avgSize = minSize * 2
            const maxSize = avgSize * 2
            const reportsData = partReports({reportSize: 900})
            const arr1 = await readReportChunks(json.encode(reportsData.one), {minSize, avgSize, maxSize})
            const arr2 = await readReportChunks(json.encode(reportsData.two), {minSize, avgSize, maxSize})
            let intersection = arr1.filter(x => arr2.includes(x));
            //intersection.forEach(e => console.log(e))
            let difference = arr1.filter(x => !arr2.includes(x));
            //difference.forEach(e => console.log(e))
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr1.length ) * 100).toFixed(2)
            console.log(`Diff multiformats/codecs/json % ${diff}`)
        });
    });


    describe('textEncoder to chunk store', function () {
        it('should reuse chunks', async function () {
            const minSize = 1024 * 32
            const avgSize = minSize * 2
            const maxSize = avgSize * 2
            const reportsData = partReports({reportSize: 900})
            const encoder = new TextEncoder()
            const arr1 = await readReportChunks(encoder.encode(JSON.stringify(reportsData.one)), {minSize, avgSize, maxSize})
            const arr2 = await readReportChunks(encoder.encode(JSON.stringify(reportsData.two)), {minSize, avgSize, maxSize})
            let intersection = arr1.filter(x => arr2.includes(x));
            //intersection.forEach(e => console.log(e))
            let difference = arr1.filter(x => !arr2.includes(x));
            //difference.forEach(e => console.log(e))
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr1.length ) * 100).toFixed(2)
            console.log(`Diff TextEncoder % ${diff}`)
        });
    });

    describe('MsgPack to chunk store', function () {
        it('should reuse chunks', async function () {
            const minSize = 1024 * 32
            const avgSize = minSize * 2
            const maxSize = avgSize * 2
            const reportsData = partReports({reportSize: 900})
            const arr1 = await readReportChunks(pack(reportsData.one), {minSize, avgSize, maxSize})
            const arr2 = await readReportChunks(pack(reportsData.two), {minSize, avgSize, maxSize})
            let intersection = arr1.filter(x => arr2.includes(x));
            //intersection.forEach(e => console.log(e))
            let difference = arr1.filter(x => !arr2.includes(x));
            //difference.forEach(e => console.log(e))
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr1.length ) * 100).toFixed(2)
            console.log(`Diff MsgPack % ${diff}`)
        });
    });

    describe('LZ4 to chunk store', function () {
        it('should reuse chunks', async function () {
            const minSize = 1024 * 8
            const avgSize = minSize * 2
            const maxSize = avgSize * 2
            const reportsData = partReports({reportSize: 900})
            const arr1 = await readReportChunks(lz4.compress(pack(reportsData.one)), {minSize, avgSize, maxSize})
            const arr2 = await readReportChunks(lz4.compress(pack(reportsData.two)), {minSize, avgSize, maxSize})
            let intersection = arr1.filter(x => arr2.includes(x));
            //intersection.forEach(e => console.log(e))
            let difference = arr1.filter(x => !arr2.includes(x));
            //difference.forEach(e => console.log(e))
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr1.length ) * 100).toFixed(2)
            console.log(`Diff LZ4 % ${diff}`)
        });
    });

    describe('Pako to chunk store', function () {
        it('should reuse chunks', async function () {
            const minSize = 1024 * 8
            const avgSize = minSize * 2
            const maxSize = avgSize * 2
            const reportsData = partReports({reportSize: 900})
            const arr1 = await readReportChunks(pako.deflate(pack(reportsData.one)), {minSize, avgSize, maxSize})
            const arr2 = await readReportChunks(pako.deflate(pack(reportsData.two)), {minSize, avgSize, maxSize})
            let intersection = arr1.filter(x => arr2.includes(x));
            //intersection.forEach(e => console.log(e))
            let difference = arr1.filter(x => !arr2.includes(x));
            //difference.forEach(e => console.log(e))
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr1.length ) * 100).toFixed(2)
            console.log(`Diff Pako % ${diff}`)
        });
    });
});



