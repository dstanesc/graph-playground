import fs from 'fs'
import filedirname from 'filedirname'
import path from 'path'
import { chunkers } from '../chunkers.js'
import { chunkStore } from '../chunk-store.js'
import { blockStore } from '../block-store.js'
import { unpack, pack } from 'msgpackr'
import { codec } from '../codec.js'
import * as lz4 from 'lz4js'
import * as pako from 'pako'
import * as json from 'multiformats/codecs/json'
import * as assert from 'assert';

export function readResource(fileName) {
    const [__filename, __dirname] = filedirname(import.meta.url);
    return read(path.join(__dirname, 'files', fileName));
}

export function read(path) {
    return fs.readFileSync(path);
}

async function readImageChunks(buf, alg) {
    console.log(buf.byteLength)
    const { encode, decode } = codec()
    const { get, put } = blockStore()

    const minSize = 1024 * 2
    const avgSize = minSize * 2
    const maxSize = avgSize * 2
    const mask = 11
    const chunker = chunkers(alg, {minSize, avgSize, maxSize, mask})
    const cs = await chunkStore()
    const { root, index, blocks } = await cs.create({ buf, chunker, encode })
    return blocks.map(block => block.cid.toString())
}

describe('For videos h264 codec chunked with buzhash', function () {
    // 2 min video
    // ffmpeg  -i dpr-h264-orig.mp4 -bitexact -c:v libx264  dpr-h264-full.mp4
    // cut to first 20 sec
    // ffmpeg  -i dpr-h264-orig.mp4 -t 20 -bitexact -c:v libx264  dpr-h264-first.mp4
    // cut to last 20 sec
    // ffmpeg  -i dpr-h264-orig.mp4 -ss 00:01:50.00 -bitexact -c:v libx264  dpr-h264-last.mp4

    describe('extracting first 20 sec', function () {
        it('should reuse most chunks from the larger video', async function () {
            const mov1 = readResource('dpr-h264-full.mp4')
            const mov2 = readResource('dpr-h264-first.mp4')
            const arr1 = await readImageChunks(mov1, 'buzhash')
            const arr2 = await readImageChunks(mov2, 'buzhash')
            let intersection = arr2.filter(x => arr1.includes(x));
            let difference = arr2.filter(x => !arr1.includes(x));
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr2.length ) * 100).toFixed(2)
            console.log(`Diff % ${diff}`)
            assert.equal(6, Math.floor(diff))
        });
    });

    describe('extracting last 20 sec', function () {
        it('cannot reuse chunks from the larger video', async function () {
            const mov1 = readResource('dpr-h264-full.mp4')
            const mov2 = readResource('dpr-h264-last.mp4')
            const arr1 = await readImageChunks(mov1, 'buzhash')
            const arr2 = await readImageChunks(mov2, 'buzhash')
            let intersection = arr2.filter(x => arr1.includes(x));
            let difference = arr2.filter(x => !arr1.includes(x));
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr2.length ) * 100).toFixed(2)
            console.log(`Diff % ${diff}`)
            assert.equal(100, Math.floor(diff))
        });
    });

})

describe('For videos h264 codec chunked with fastcdc', function () {
    // 2 min video
    // ffmpeg  -i dpr-h264-orig.mp4 -bitexact -c:v libx264  dpr-h264-full.mp4
    // cut to first 20 sec
    // ffmpeg  -i dpr-h264-orig.mp4 -t 20 -bitexact -c:v libx264  dpr-h264-first.mp4
    // cut to last 20 sec
    // ffmpeg  -i dpr-h264-orig.mp4 -ss 00:01:50.00 -bitexact -c:v libx264  dpr-h264-last.mp4

    describe('extracting first 20 sec', function () {
        it('should reuse most chunks from the larger video', async function () {
            const mov1 = readResource('dpr-h264-full.mp4')
            const mov2 = readResource('dpr-h264-first.mp4')
            const arr1 = await readImageChunks(mov1, 'fastcdc')
            const arr2 = await readImageChunks(mov2, 'fastcdc')
            let intersection = arr2.filter(x => arr1.includes(x));
            let difference = arr2.filter(x => !arr1.includes(x));
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr2.length ) * 100).toFixed(2)
            console.log(`Diff % ${diff}`)
            assert.equal(4, Math.floor(diff))
        });
    });

    describe('extracting last 20 sec', function () {
        it('cannot reuse chunks from the larger video', async function () {
            const mov1 = readResource('dpr-h264-full.mp4')
            const mov2 = readResource('dpr-h264-last.mp4')
            const arr1 = await readImageChunks(mov1, 'fastcdc')
            const arr2 = await readImageChunks(mov2, 'fastcdc')
            let intersection = arr2.filter(x => arr1.includes(x));
            let difference = arr2.filter(x => !arr1.includes(x));
            console.log(`Total ${arr2.length}`)
            console.log(`Intersection ${intersection.length}`)
            console.log(`Difference ${difference.length}`)
            const diff = ((difference.length / arr2.length ) * 100).toFixed(2)
            console.log(`Diff % ${diff}`)
            assert.equal(100, Math.floor(diff))
        });
    });

})