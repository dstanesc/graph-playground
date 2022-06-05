import Benchmark from 'benchmark'

import { Graph, GraphReader, GraphInspector } from './graph.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'
import { history } from './history.js'


const s1 = async () => {
  const h = await history()
  const s1 = await vectorStorage(h)
  const g = new Graph(s1)
  const gw = g.writer()
  createLargerGraph(gw)
  await gw.commit()
  return g
}

const s2 = async () => {
  const h = await history()
  const s1 = await prollyStorage(h)
  const g = new Graph(s1)
  const gw = g.writer()
  createLargerGraph(gw)
  await gw.commit()
  return g
}

const s3 = async () => {
  const h = await history()
  const s1 = await hamtStorage(h)
  const g = new Graph(s1)
  const gw = g.writer()
  createLargerGraph(gw)
  await gw.commit()
  return g
}


const sx = async () => {
  const v = await s1()
  const p = await s2()
  const h = await s3()
  return { v, p, h }
}

sx().then(s => {

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

    .add('Vector Reading', async () => {
      const reader = s.v.reader()
      const results = await reader.read([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .add('Prolly Reading', async () => {
      const reader = s.p.reader()
      const results = await reader.read([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .add('Hamt Reading', async () => {
      const reader = s.h.reader()
      const results = await reader.read([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .run()

})
