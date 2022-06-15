import { Graph } from '../graph.js'
import { blockStorage } from '../block-storage.js'
import { hamtStorage } from '../hamt-storage.js'
import { prollyStorage } from '../prolly-storage.js'
import { createLargerGraph, updateLargerGraph } from '../graph-data-larger.js'
import * as assert from 'assert';
import { history } from '../history.js'
import { baselineChanges } from '../changes.js'

describe('Graph', function () {

    describe('Story', function () {

        it('Changes to baseline', async function () {
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

            // changes
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

            const { nodesAdded, rlshpsAdded, propsAdded, rlshpsLinked, propsLinked } = await baselineChanges(g1, gb)

            for (const [key, node] of nodesAdded) {
                console.log(`Node added ${key}`)
                console.log(node.toJson())
            }
            for (const [key, rlshp] of rlshpsAdded) {
                console.log(`Rlshp added ${key}`)
                console.log(rlshp.toJson())
            }
            for (const [key, prop] of propsAdded) {
                console.log(`Prop added ${key}`)
                console.log(prop.toJson())
            }
            for (const [key, rlshpLinked] of rlshpsLinked) {
                console.log(`Rlshp Linked ${key}`)
                console.log(rlshpLinked.toJson())
            }
            for (const [key, propLinked] of propsLinked) {
                console.log(`Prop Linked ${key}`)
                console.log(propLinked.toJson())
            }

            assert.equal(1, nodesAdded.size)
            assert.equal(1, rlshpsAdded.size)
            assert.equal(2, propsAdded.size)
            assert.equal(1, rlshpsLinked.size)
         
            assert.equal('bagaaierapasvlc4sh275u43os42fab6ub6fn3yfgnsb4wednr277anix4ppa', rlshpsLinked.get('1742').offset.cid)
        });
    });
});

