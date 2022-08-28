import { Graph } from './graph.js'
import { blockStore } from './block-store.js'
import { blockStorage } from './block-storage.js'
import { chunkingStorage } from './chunking-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'
import { history } from './history.js'


const graphToChunky = async () => {
    console.log('Chunky storage')
    const s = blockStorage() 
    const h = await history(s)
    const x = blockStore() 
    const s1 = await chunkingStorage(h, x)
    const g = new Graph(s1)
    const gw = g.writer()
    const start = new Date()
    await createGraph(gw)
    const blockResult1 = await gw.commit()
    console.log(`Node count ${g.nodes.size} expected size = ${g.nodes.size * s1.offsetIncrements.node }`)
    console.log(`Rlshp count ${g.rlshps.size} expected size = ${g.rlshps.size * s1.offsetIncrements.rlshp}`)
    console.log(`Props count ${g.props.size} expected size = ${g.props.size * s1.offsetIncrements.prop}`)
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    const size1 = s1.size(blockResult1)
    const count1 = s1.count(blockResult1)
    s1.showBlocks(blockResult1)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    await updateGraph(g, gw2)
    const blockResult2 = await gw2.commit()
    s1.showBlocks(blockResult2)
    const size2 = s1.size(blockResult2)
    const count2 = s1.count(blockResult2)
    console.log(`Blocks size2 ${((size1 + size2) / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count1 + count2}`)
    console.log(`Block size increase ${(((size2) / (size1 + size2)) * 100).toFixed(2)} %`)
    console.log(`Block count increase ${(((count2) / (count1 + count2)) * 100).toFixed(2)} %`)
    console.log('---')
    await h.show()
}

const graphReaderChunky = async (path, select) => {
    console.log('Chunky storage')
    const s = blockStorage() 
    const h = await history(s)
    const x = blockStore() 
    const s1 = await chunkingStorage(h, x)
    const g = new Graph(s1)
    const gw = g.writer()
    let start = new Date()
    await createLargerGraph(gw)
    const blockResult1 = await gw.commit()
    console.log(`Node count ${g.nodes.size} expected size = ${g.nodes.size * s1.offsetIncrements.node }`)
    console.log(`Rlshp count ${g.rlshps.size} expected size = ${g.rlshps.size * s1.offsetIncrements.rlshp}`)
    console.log(`Props count ${g.props.size} expected size = ${g.props.size * s1.offsetIncrements.prop}`)
    let end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    const size1 = s1.size(blockResult1)
    const count1 = s1.count(blockResult1)
    //s1.showBlocks(blockResult1)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    await updateGraph(g, gw2)
    const blockResult2 = await gw2.commit()
    //s1.showBlocks(blockResult2)
    const size2 = s1.size(blockResult2)
    const count2 = s1.count(blockResult2)
    console.log(`Blocks size2 ${((size1 + size2) / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count1 + count2}`)
    console.log(`Block size increase ${(((size2) / (size1 + size2)) * 100).toFixed(2)} %`)
    console.log(`Block count increase ${(((count2) / (count1 + count2)) * 100).toFixed(2)} %`)
    console.log('---')
    await h.show()
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

{
    await graphToChunky()
    console.log('---')
}

{
    // quick scan
    await graphReaderChunky([{ 'year': '2021' }, { 'category': 'chemistry' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}

{
    // full scan
    await graphReaderChunky([{ 'year': '1901' }, { 'category': 'medicine' }, { 'laureates': '*' }], ['surname', 'firstname', 'motivation'])
    console.log('---')
}
