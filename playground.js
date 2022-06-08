import { Graph, GraphInspector } from './graph.js'
import { blockStorage } from './block-storage.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'
import { history } from './history.js'

const graphToProlly = async () => {
    console.log('Prolly storage')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await prollyStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    const start = new Date()
    createGraph(gw)
    const blockResult1 = await gw.commit()
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    //await s1.showBlocks(blockResult1)
    const size1 = await s1.size(blockResult1)
    const count1 = await s1.count(blockResult1)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    updateGraph(g, gw2)
    const blockResult2 = await gw2.commit()
    //await s1.showBlocks(blockResult2)
    const size2 = await s1.size(blockResult2)
    const count2 = await s1.count(blockResult2)
    console.log(`Blocks size2 ${((size1 + size2) / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count1 + count2}`)
    const { percentNodes, percentRlshp, percentProps } = await s1.percent(blockResult2)
    console.log(`Block increase nodes ${percentNodes} %`)
    console.log(`Block increase rlshps ${percentRlshp} %`)
    console.log(`Block increase props ${percentProps} %`)
    console.log('---')
    await h.show()
    //new GraphInspector(g).debug()
}

const graphToHamt = async () => {
    console.log('Hamt storage')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await hamtStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    const start = new Date()
    createGraph(gw)
    const roots = await gw.commit()
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    //await s1.showBlocks(roots)
    const size1 = await s1.size(roots)
    const count1 = await s1.count(roots)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    updateGraph(g, gw2)
    const roots2 = await gw2.commit()
    //await s1.showBlocks(roots2)
    const size2 = await s1.size(roots2)
    const count2 = await s1.count(roots2)
    console.log(`Blocks size2 ${(size2 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count2}`)
    console.log(`Block increase ${(((size2 - size1) / size2) * 100).toFixed(2)} %`)
    console.log('---')
    await h.show()
}


const largerGraphToProlly = async () => {
    console.log('Prolly storage - larger')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await prollyStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    const start = new Date()
    createLargerGraph(gw)
    const blockResult1 = await gw.commit()
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    //await s1.showBlocks(blockResult1)
    const size1 = await s1.size(blockResult1)
    const count1 = await s1.count(blockResult1)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    const root = await g.getRoot();
    updateLargerGraph(root, gw2)
    const blockResult2 = await gw2.commit()
    //await s1.showBlocks(blockResult2)
    const size2 = await s1.size(blockResult2)
    const count2 = await s1.count(blockResult2)
    console.log(`Blocks size2 ${((size1 + size2) / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count1 + count2}`)
    const { percentNodes, percentRlshp, percentProps } = await s1.percent(blockResult2)
    console.log(`Block increase nodes ${percentNodes} %`)
    console.log(`Block increase rlshps ${percentRlshp} %`)
    console.log(`Block increase props ${percentProps} %`)
    console.log('---')
    await h.show()
}

const largerGraphToHamt = async () => {
    console.log('Hamt storage - larger')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await hamtStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    const start = new Date()
    createLargerGraph(gw)
    const roots = await gw.commit()
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    //await s1.showBlocks(roots)
    const size1 = await s1.size(roots)
    const count1 = await s1.count(roots)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    const root = await g.getRoot();
    updateLargerGraph(root, gw2)
    const roots2 = await gw2.commit()
    //await s1.showBlocks(roots2)
    const size2 = await s1.size(roots2)
    const count2 = await s1.count(roots2)
    console.log(`Blocks size2 ${(size2 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count2}`)
    console.log(`Block increase ${(((size2 - size1) / size2) * 100).toFixed(2)} %`)
    console.log('---')
    await h.show()
}


const largerGraphToVector = async () => {
    console.log('Vector storage - larger')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await vectorStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    const start = new Date()
    createLargerGraph(gw)
    const roots = await gw.commit()
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    //await s1.showBlocks(roots)
    const size1 = await s1.size(roots)
    const count1 = await s1.count(roots)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    const root = await g.getRoot();
    updateLargerGraph(root, gw2)
    const roots2 = await gw2.commit()
    //await s1.showBlocks(roots2)
    const size2 = await s1.size(roots2)
    const count2 = await s1.count(roots2)
    console.log(`Blocks size2 ${(size2 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count2}`)
    console.log(`Block increase ${(((size2 - size1) / size2) * 100).toFixed(2)} %`)
    console.log('---')
    await h.show()
}

const graphReaderProlly = async (path, select) => {
    console.log('Prolly storage - larger')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await prollyStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    let start = new Date()
    createLargerGraph(gw)
    const blockResult1 = await gw.commit()
    //await s1.showBlocks(blockResult1)
    let end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    start = new Date()
    const reader = g.reader()
    const results = await reader.read(path, select)
    for await (const result of results) {
        console.log('---Found---')
        console.log(result)
    }
    end = new Date()
    console.log(`Query duration ${end - start} ms`)
}

const graphReaderHamt = async (path, select) => {
    console.log('Hamt storage - larger')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await hamtStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    let start = new Date()
    createLargerGraph(gw)
    const blockResult1 = await gw.commit()
    //await s1.showBlocks(blockResult1)
    let end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    start = new Date()
    const reader =  g.reader()
    const results = await reader.read(path, select)
    for await (const result of results) {
        console.log('---Found---')
        console.log(result)
    }
    end = new Date()
    console.log(`Query duration ${end - start} ms`)
}

const graphReaderVector = async (path, select) => {
    console.log('Vector storage - larger')
    const s = blockStorage() 
    const h = await history(s)
    const s1 = await vectorStorage(h, s)
    const g = new Graph(s1)
    const gw = g.writer()
    let start = new Date()
    createLargerGraph(gw)
    const blockResult1 = await gw.commit()
    //await s1.showBlocks(blockResult1)
    let end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    start = new Date()
    const reader =  g.reader()
    const results = await reader.read(path, select)
    for await (const result of results) {
        console.log('---Found---')
        console.log(result)
    }
    end = new Date()
    console.log(`Query duration ${end - start} ms`)
}


{
    await graphToProlly()
    console.log('---')
}

{
    await graphToHamt()
    console.log('---')
}

{
    await largerGraphToProlly()
    console.log('---')
}

{
    await largerGraphToHamt()
    console.log('---')
}

{
    await largerGraphToVector()
    console.log('---')
}


{
    //quick scan
    await graphReaderProlly([{ 'year': '2021' }, { 'category': 'chemistry' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}

{
    //quick scan
    await graphReaderHamt([{ 'year': '2021' }, { 'category': 'chemistry' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}

{
    //quick scan
    await graphReaderVector([{ 'year': '2021' }, { 'category': 'chemistry' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}

{
    //full scan
    await graphReaderProlly([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}

{
    //full scan
    await graphReaderHamt([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}

{
    //full scan
    await graphReaderVector([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}