import { Graph } from '../graph.js'
import { blockStorage } from '../block-storage.js'
import { hamtStorage } from '../hamt-storage.js'
import { prollyStorage } from '../prolly-storage.js'
import { createLargerGraph, updateLargerGraph } from '../graph-data-larger.js'
import * as assert from 'assert';
import { history } from '../history.js'
import { baselineChanges } from '../changes.js'

describe('Prolly Nobel Prizes', function () {

    let s
    let h

    before(async function () {
        s = blockStorage()
        h = await history(s)
        const p = await prollyStorage(h, s)
        const g = new Graph(p)
        const gw = g.writer()
        await createLargerGraph(gw)
        await gw.commit()
    });

    describe('History', function () {


        it('history is independent', async function () {
            this.timeout(1000);
            const hr = h.rootGet()

            //base
            const hb = await history(s, hr)
            const sb = await prollyStorage(hb, s, 0)
            const gb = new Graph(sb)

            //copy 1
            const h1 = await history(s, hr)
            await h1.show()
            const s1 = await prollyStorage(h1, s, 0)
            const g1 = new Graph(s1)
            const gw1 = g1.writer()
            const root1 = await g1.getRoot()
            const y2023 = gw1.addNode("2023")
            await y2023.addProp(gw1, 'element', 'water')
            await y2023.addProp(gw1, 'sign', 'rabbit')
            await root1.addRlshp(gw1, 'year', y2023)
            await gw1.commit()
            console.log(s1.nodesRootGet())
            await h1.show()

            //copy 2
            const h2 = await history(s, hr)
            //await h2.show()
            const s2 = await prollyStorage(h2, s, 0)
            const g2 = new Graph(s2)
            const gw2 = g2.writer()
            const root2 = await g2.getRoot()
            const y2024 = gw2.addNode("2024")
            await root2.addRlshp(gw2, 'year', y2024)
            await gw2.commit()
            console.log(s2.nodesRootGet())
            await h2.show()

            assert.deepEqual(await h1.navigate('0'), await h2.navigate('0'))
            assert.notEqual(await h1.navigate('1'), h2.navigate('1'))
            assert.notEqual(s1.nodesRootGet(), s2.nodesRootGet())
        });
    });
});

