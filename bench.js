import Benchmark from 'benchmark'

import { Graph, GraphReader, GraphInspector } from './graph.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'
import { history } from './history.js'

const creationSuite = new Benchmark.Suite('Graph Creation Suite')

creationSuite.on('complete', event => {
    const suite = event.currentTarget;
    const fastestOption = suite.filter('fastest').map('name')
    console.log(`The fastest option is ${fastestOption}`)
    process.exit(0)
})

creationSuite.on('cycle', event => {
    const benchmark = event.target;  
    console.log(benchmark.toString());
  });

creationSuite
    .add('Prolly Graph Creation', async () => {
      const g = new Graph()
      const gw = g.writer()
      const r = gw.addNode("root")
      const h = await history()
      const s1 = await prollyStorage(h)
      const blockResult1 = await gw.commit(s1)
    })
    .add('Hamt Graph Creation', async () => {
      const g = new Graph()
      const gw = g.writer()
      const r = gw.addNode("root")
      const h = await history()
      const s1 = await hamtStorage(h)
      const blockResult1 = await gw.commit(s1)
    })
    .add('Vector Graph Creation', async () => {
      const g = new Graph()
      const gw = g.writer()
      const r = gw.addNode("root")
      const h = await history()
      const s1 = await vectorStorage(h)
      const blockResult1 = await gw.commit(s1)
    })
    .run()

