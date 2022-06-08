import Benchmark from 'benchmark'

import { Graph, GraphReader, GraphInspector } from './graph.js'
import { blockStorage } from './block-storage.js'
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
      const s = blockStorage() 
      const h = await history(s)
      const s1 = await prollyStorage(h, s)
      const g = new Graph(s1)
      const gw = g.writer()
      const r = gw.addNode("root")
      const blockResult1 = await gw.commit()
    })
    .add('Hamt Graph Creation', async () => {
      const s = blockStorage() 
      const h = await history(s)
      const s1 = await hamtStorage(h, s)
      const g = new Graph(s1)
      const gw = g.writer()
      const r = gw.addNode("root")
      const blockResult1 = await gw.commit()
    })
    .add('Vector Graph Creation', async () => {
      const s = blockStorage() 
      const h = await history(s)
      const s1 = await vectorStorage(h, s)
      const g = new Graph(s1)
      const gw = g.writer()
      const r = gw.addNode("root")
      const blockResult1 = await gw.commit()
    })
    .run()

