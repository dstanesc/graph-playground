import Benchmark from 'benchmark'

import { Graph, GraphReader, GraphInspector } from './graph.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'
import { history } from './history.js'


const s1 = async () => {
  const g = new Graph()
  const gw = g.writer()
  let start = new Date()
  createLargerGraph(gw)
  const h = await history()
  const s1 = await vectorStorage(h)
  await gw.commit(s1)
  return s1
}

const s2 = async () => {
  const g = new Graph()
  const gw = g.writer()
  let start = new Date()
  createLargerGraph(gw)
  const h = await history()
  const s1 = await prollyStorage(h)
  await gw.commit(s1)
  return s1
}

const s3 = async () => {
  const g = new Graph()
  const gw = g.writer()
  let start = new Date()
  createLargerGraph(gw)
  const h = await history()
  const s1 = await hamtStorage(h)
  await gw.commit(s1)
  return s1
}


const sx = async () => {
  const v = await s1()
  const p = await s2()
  const h = await s3()
  return { v, p, h }
}

sx().then(s => {

  const querySuite = new Benchmark.Suite('Graph Quick Scan Suite')

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

  querySuite

    .add('Vector Reading', async () => {
      const reader = new GraphReader(s.v)
      const results = await reader.read([{ 'year': '2021' }, { 'category': 'chemistry' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .add('Prolly Reading', async () => {
      const reader = new GraphReader(s.p)
      const results = await reader.read([{ 'year': '2021' }, { 'category': 'chemistry' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .add('Hamt Reading', async () => {
      const reader = new GraphReader(s.h)
      const results = await reader.read([{ 'year': '2021' }, { 'category': 'chemistry' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
      for await (const result of results) {
        console.log('---Found---')
        console.log(result)
      }
    })

    .run()

})
