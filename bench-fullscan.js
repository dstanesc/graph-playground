import Benchmark from 'benchmark'

import { Graph } from './graph.js'
import { blockStorage } from './block-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'
import { history } from './history.js'


const s2 = async () => {
  const s = blockStorage()
  const h = await history(s)
  const s1 = await prollyStorage(h, s)
  const g = new Graph(s1)
  const gw = g.writer()
  await createLargerGraph(gw)
  await gw.commit()
  return g
}

const s3 = async () => {
  const s = blockStorage()
  const h = await history(s)
  const s1 = await hamtStorage(h, s)
  const g = new Graph(s1)
  const gw = g.writer()
  await createLargerGraph(gw)
  await gw.commit()
  return g
}


const sx = async () => {
  const p = await s2()
  const h = await s3()
  return { p, h }
}

sx().then(su => {

  const querySuite = new Benchmark.Suite('Graph Full Scan Suite')

  querySuite.on('complete', event => {
    const suite = event.currentTarget;
    const fastestOption = suite.filter('fastest').map('name')
    console.log(`The fastest option is ${fastestOption}`)
    process.exit(0)
  })

  querySuite.on('cycle', event => {
    const benchmark = event.target;
    console.log(benchmark.toString());
  });


  //FIXME order affects run performance (first always best)
  querySuite

    .add('Prolly Reading', async () => {
      const reader = su.p.reader()
      const results = await reader.read([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .add('Hamt Reading', async () => {
      const reader = su.h.reader()
      const results = await reader.read([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .run()

})
