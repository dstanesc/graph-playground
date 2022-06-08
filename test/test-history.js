import { Graph, GraphInspector } from '../graph.js'
import { blockStorage } from '../block-storage.js'
import { hamtStorage } from '../hamt-storage.js'
import { prollyStorage } from '../prolly-storage.js'
import { vectorStorage } from '../vector-storage.js'
import { createLargerGraph, updateLargerGraph } from '../graph-data-larger.js'
import * as assert from 'assert';
import { history } from '../history.js'


describe('Prolly Nobel Prizes', function () {

    let g
    let h
    let s

    before(async function () {
        s = blockStorage() 
        h = await history(s)
        const s1 = await prollyStorage(h, s)
        g = new Graph(s1)
    });

    describe('Writer', function () {
        it('history size should be 1 after creation', async function () {
            this.timeout(5000);
            const gw = g.writer()
            createLargerGraph(gw)
            await gw.commit()
            assert.equal(await h.size(), 1)
        });

        it('history size should be 2 after update', async function () {
            this.timeout(500);
            const gw = g.writer()
            const root = await g.getRoot();
            updateLargerGraph(root, gw)
            await gw.commit()
            assert.equal(await h.size(), 2)
        });

        it('history size should be 3 after update', async function () {
            this.timeout(500);
            const gw = g.writer()
            const root = await g.getRoot();
            const y2023 = gw.addNode("2023")
            root.addRlshp(gw, 'year', y2023)
            await gw.commit()
            assert.equal(await h.size(), 3)
        });

        it('history size should be 4 after update', async function () {
            this.timeout(500);
            const gw = g.writer()
            const root = await g.getRoot();
            const y2024 = gw.addNode("2024")
            root.addRlshp(gw, 'year', y2024)
            await gw.commit()
            assert.equal(await h.size(), 4)
        });


    });

    describe('History Checks', function () {
        it('history rollback', async function () {
            this.timeout(500);
            let { offset, nodesRoot, rlshpsRoot, propsRoot, prevOffset } = await h.current()
            let found = 0
            while (prevOffset !== "0") {
                console.log(`Found offset ${offset} previous  ${prevOffset}`)
                const prevCommit = await h.navigate(prevOffset)
                console.log(`Found previous entry ${JSON.stringify(prevCommit, null, 2)}`)
                prevOffset = prevCommit.prevOffset
                found++
            } 
            assert.equal(2, found)
        });

        it('history should have predictable roots', async function () {
            const commit1 = await h.navigate(0)
            const commit2 = await h.navigate(1)
            assert.equal(commit1.nodesRoot, 'bafyreih27heqjja25fi35x47oes76e2gg45brrhwhc6z6lh64plkkn73nu')
            assert.equal(commit2.nodesRoot, 'bafyreicpzcfq3atexl6dgd2j7qzgky7qh3kn7uew3vppofj62iqk32iifi')
            h.show()
        });
    });

});

describe('Hamt Nobel Prizes', function () {

    let g 
    let h
    let s

    before(async function () {
        s = blockStorage() 
        h = await history(s)
        const s1 = await hamtStorage(h, s)
        g = new Graph(s1)
    });

    describe('Writer', function () {
        it('history size should be 1 after creation', async function () {
            this.timeout(5000);
            const gw = g.writer()
            createLargerGraph(gw)
            await gw.commit()
            assert.equal(await h.size(), 1)
        });

        it('history size should be 2 after update', async function () {
            this.timeout(500);
            const gw = g.writer()
            const root = await g.getRoot();
            updateLargerGraph(root, gw)
            await gw.commit()
            assert.equal(await h.size(), 2)
        });

        it('history should have predictable roots', async function () {
            const commit1 = await h.navigate(0)
            const commit2 = await h.navigate(1)
            assert.equal(commit1.nodesRoot, 'bafyreigzy5m7afrxajayqtge4ofkpwvibkqgq5n3daw7p5vpaorugzvdae')
            assert.equal(commit2.nodesRoot, 'bafyreiefncqcfronfdapxcbz7zgjtjitwnvuno4gebtb4xgany34yx3ut4')
            h.show()
        });
    });
});


describe('Vector Nobel Prizes', function () {

    let g 
    let h
    let s

    before(async function () {
        s = blockStorage() 
        h = await history(s)
        const s1 = await vectorStorage(h, s)
        g = new Graph(s1)
    });

    describe('Writer', function () {
        it('history size should be 1 after creation', async function () {
            this.timeout(5000);
            const gw = g.writer()
            createLargerGraph(gw)
            await gw.commit()
            assert.equal(await h.size(), 1)
        });

        it('history size should be 2 after update', async function () {
            this.timeout(500);
            const gw = g.writer()
            const root = await g.getRoot();
            updateLargerGraph(root, gw)
            await gw.commit()
            assert.equal(await h.size(), 2)
        });
    });
});

