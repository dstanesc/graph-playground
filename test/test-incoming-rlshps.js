import { Graph } from '../graph.js'
import { blockStorage } from '../block-storage.js'
import { hamtStorage } from '../hamt-storage.js'
import { prollyStorage } from '../prolly-storage.js'
import { createGraph, updateGraph } from '../graph-data.js'
import * as assert from 'assert';
import { history } from '../history.js'


describe('Validate rlshp chaining, prolly', function () {

    let s
    let h

    before(async function () {
        s = blockStorage()
        h = await history(s)
        const p = await prollyStorage(h, s)
        const g = new Graph(p)
        const gw = g.writer()
        await createGraph(gw)
        await gw.commit()
    });

    describe('Rlshp linked lists', function () {

        it('Second node (incoming) rlshps are chained properly', async function () {
            this.timeout(1000);
            const hr = h.rootGet()
            const h1 = await history(s, hr)
            const s1 = await prollyStorage(h1, s)
            const g1 = new Graph(s1)
            const gw1 = g1.writer()
            const root1 = await g1.getRoot();

            const y2023 = gw1.addNode("2023")
            const y2024 = gw1.addNode("2024")
            const y2025 = gw1.addNode("2025")

            await root1.addRlshp(gw1, 'root-year2024', y2024)
            await root1.addRlshp(gw1, 'root-year2025', y2025)
            
            // more than a tree, genuine graph, modelling 3 parents to y2023
            const y2025_y2023 = await y2025.addRlshp(gw1, 'y2025-y2023', y2023)
            const y2024_y2023 = await y2024.addRlshp(gw1, 'y2024-y2023', y2023)
            const root_y2023 = await root1.addRlshp(gw1, 'root-y2023', y2023)
            await gw1.commit()

            // 17 => prev 19, next 18
            assert.equal(y2025_y2023.offset.offset, 17)
            assert.equal(y2025_y2023.secondPrevRel.offset, 19)
            assert.equal(y2025_y2023.secondPrevRel.cid, 'bagaaierahsgghoawvqbfzxhmlxrxl7ub4kknoyaje7mxi5okf3hsbdcneksa')
            assert.equal(y2025_y2023.secondNextRel.offset, 18)
            assert.equal(y2025_y2023.secondNextRel.cid, 'bagaaierakbmtvrb53frlmx6bwo4wq3no32v7k6ydt5zmkgogky7noubpsq5a')

            // 18 => prev 17
            assert.equal(y2024_y2023.offset.offset, 18)
            assert.equal(y2024_y2023.secondPrevRel.offset, 17)
            assert.equal(y2024_y2023.secondPrevRel.cid, 'bagaaiera6x7jbqa4uiivysw3vujn3ojo4e2mklse4l7ajmgamdrbmdjgzloa')

            // 19 => next 17
            assert.equal(root_y2023.offset.offset, 19)
            assert.equal(root_y2023.secondNextRel.offset, 17)
            assert.equal(root_y2023.secondNextRel.cid, 'bagaaiera6x7jbqa4uiivysw3vujn3ojo4e2mklse4l7ajmgamdrbmdjgzloa')
        });
    });
});

