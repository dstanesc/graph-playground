import { Graph } from './graph.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'

// const graphToVector = async () => {
//     const gw = createGraph()
//     const s1 = await vectorStorage()
//     await gw.commit(s1)
//     //await s1.showBlocks()
//     updateGraph(gw)
//     const s2 = await vectorStorage()
//     await gw.commit(s2)
//     //await s2.showBlocks()
//     const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
//     return { diffNodes, diffRlshp, diffProps }
// }

// const largerGraphToVector = async () => {
//     const gw = createLargerGraph()
//     const s1 = await vectorStorage()
//     await gw.commit(s1)
//     //await s1.showBlocks()
//     updateLargerGraph(gw)
//     const s2 = await vectorStorage()
//     await gw.commit(s2)
//     //await s2.showBlocks()
//     const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
//     return { diffNodes, diffRlshp, diffProps }
// }


const largerGraphToProlly = async () => {
    console.log('Prolly storage')
    const g = new Graph()
    const gw = g.writer()
    const start = new Date()
    createLargerGraph(gw)
    const s1 = await prollyStorage()
    const blockResult1 = await gw.commit(s1)
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    //await s1.showBlocks(blockResult1)
    const size1 = await s1.size(blockResult1)
    const count1 = await s1.count(blockResult1)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    const root = g.getRoot();
    updateLargerGraph(root, gw2)
    const blockResult2 = await gw2.commit(s1)
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
}

const largerGraphToHamt = async () => {
    console.log('Hamt storage')
    const g = new Graph()
    const gw = g.writer()
    const start = new Date()
    createLargerGraph(gw)
    const s1 = await hamtStorage()
    const roots = await gw.commit(s1)
    const end = new Date()
    console.log(`Insert duration ${end - start} ms`)
    //await s1.showBlocks(roots)
    const size1 = await s1.size(roots)
    const count1 = await s1.count(roots)
    console.log(`Blocks size1 ${(size1 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count1 ${count1}`)
    const gw2 = g.writer()
    const root = g.getRoot();
    updateLargerGraph(root, gw2)
    const roots2 = await gw2.commit(s1)
    //await s1.showBlocks(roots2)
    const size2 = await s1.size(roots2)
    const count2 = await s1.count(roots2)
    console.log(`Blocks size2 ${(size2 / (1024)).toFixed(2)} KB`)
    console.log(`Blocks count2 ${count2}`)
    console.log(`Block increase ${(((size2 - size1) / size2) * 100).toFixed(2)} %`)
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


