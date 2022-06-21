import { Graph, Node, Rlshp, Prop } from '../graph.js'
import { blockStorage } from '../block-storage.js'
import { hamtStorage } from '../hamt-storage.js'
import { prollyStorage } from '../prolly-storage.js'
import { createLargerGraph, updateLargerGraph } from '../graph-data-larger.js'
import * as assert from 'assert';
import { history } from '../history.js'

describe('Graph', function () {

    describe('Merge', function () {

        it('Playground for merging changes', async function () {
            this.timeout(3000);

            // baseline
            const s = blockStorage()
            const hb = await history(s)
            const pb = await prollyStorage(hb, s)
            const gb = new Graph(pb)
            const gw = gb.writer()
            await createLargerGraph(gw)
            await gw.commit()

            // history root cid
            const hr = hb.rootGet()

            // user 1
            const h1 = await history(s, hr)
            const s1 = await prollyStorage(h1, s)
            const g1 = new Graph(s1)
            const gw1 = g1.writer()
            const root1 = await g1.getRoot();
            const y2023 = gw1.addNode("2023")
            await y2023.addProp(gw1, 'element', 'water')
            await y2023.addProp(gw1, 'sign', 'rabbit')
            await root1.addRlshp(gw1, 'year', y2023)
            await gw1.commit()

            // user 2
            const h2 = await history(s, hr)
            const s2 = await prollyStorage(h2, s)
            const g2 = new Graph(s2)
            const gw2 = g2.writer()
            const root2 = await g2.getRoot();
            const y2024 = gw2.addNode("2024")
            await y2024.addProp(gw2, 'element', 'wood')
            await root2.addRlshp(gw2, 'year', y2024)
            await gw2.commit()

            console.log('History before merge')
            await h1.show()

            assert.equal(2, await h1.size())

            const gm = g1.merger()
            await gm.mergeChanges(g2, gb)
            await gm.commit()

            console.log('History after merge')
            await h1.show()

            assert.equal(3, await h1.size())

            // Query changes to validate merge
            const reader = g1.reader()
            const results = await reader.read([{ 'year': '2024' }], ['element'])
            let found = []
            for await (const result of results) {
                console.log('---Found---')
                console.log(result)
                found.push(result)
            }
            assert.equal(1, found.length)
            assert.deepEqual({ element: 'wood' }, found[0])
        });
    });
});

