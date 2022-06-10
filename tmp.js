import { Graph, GraphProcessor } from './graph.js'
import { blockStorage } from './block-storage.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'
import { history } from './history.js'
import { Offset } from './offset.js'
import { graphDebugVisitor } from './debug.js'


const s = blockStorage()
const h = await history(s)
const p = await prollyStorage(h, s)
const g = new Graph(p)
const gw = g.writer()
await createGraph(gw)
await gw.commit()
await h.show()
//await new GraphProcessor(g).process(graphDebugVisitor())
const hr = h.rootGet()

//copy 1
const h1 = await history(s, hr)
const s1 = await prollyStorage(h1, s)
const g1 = new Graph(s1)
const gw1 = g1.writer()
const root1 = await g1.getRoot();
const y2023 = gw1.addNode("2023")
await root1.addRlshp(gw1, 'year', y2023)
await gw1.commit()
//console.log(s1.nodesRootGet())
await h1.show()

