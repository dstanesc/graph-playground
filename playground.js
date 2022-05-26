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

const graphToProlly = async () => {
    const gw = createGraph()
    const s1 = await prollyStorage()
    await gw.commit(s1)
    //await s1.showBlocks()
    updateGraph(gw)
    const s2 = await prollyStorage()
    await gw.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    return { diffNodes, diffRlshp, diffProps }
}

const largerGraphToProlly = async () => {
    const g = new Graph()
    const gw = g.writer()
    createLargerGraph(gw)
    const s1 = await prollyStorage()
    const blockResult1 = await gw.commit(s1)
    await s1.showBlocks(blockResult1)
    const gw2 = g.writer()
    const root = g.getRoot();
    updateLargerGraph(root, gw2)
    const blockResult2 = await gw2.commit(s1)
    await s1.showBlocks(blockResult2)
    const { percentNodes, percentRlshp, percentProps } = await s1.percent(blockResult2)
    console.log(`Block increase nodes ${percentNodes} %`)
    console.log(`Block  increase rlshps ${percentRlshp} %`)
    console.log(`Block  increase props ${percentProps} %`)
    //await s1.showBlocks()
    //const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    //return { diffNodes, diffRlshp, diffProps }
}

// const graphToHamt = async () => {
//     const gw = createGraph()
//     const s1 = await hamtStorage()
//     await gw.commit(s1)
//     //await s1.showBlocks()
//     updateGraph(gw)
//     const s2 = await hamtStorage()
//     await gw.commit(s2)
//     //await s2.showBlocks()
//     const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
//     return { diffNodes, diffRlshp, diffProps }
// }

// const largerGraphToHamt = async () => {
//     const gw = createLargerGraph()
//     const s1 = await hamtStorage()
//     await gw.commit(s1)
//     //await s1.showBlocks()
//     updateLargerGraph(gw)
//     const s2 = await hamtStorage()
//     await gw.commit(s2)
//     //await s2.showBlocks()
//     const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
//     return { diffNodes, diffRlshp, diffProps }
// }

// {
//     const { diffNodes, diffRlshp, diffProps } = await graphToVector()
//     console.log(`Vector node block reuse ${diffNodes.percent}%`)
//     console.log(`Vector rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`Vector prop block reuse ${diffProps.percent}%`)
// }

// {
//     const start = new Date()
//     const { diffNodes, diffRlshp, diffProps } = await largerGraphToVector()
//     const end = new Date()
//     console.log(`Duration ${end - start} ms`)
//     console.log(`Larger vector node block reuse ${diffNodes.percent}%`)
//     console.log(`Larger vector rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`Larger vector prop block reuse ${diffProps.percent}%`)
// }

// {
//     const { diffNodes, diffRlshp, diffProps } = await graphToProlly()
//     console.log(`Prolly node block reuse ${diffNodes.percent}%`)
//     console.log(`Prolly rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`Prolly prop block reuse ${diffProps.percent}%`)
// }

{
    const start = new Date()
    await largerGraphToProlly()
    const end = new Date()
    console.log(`Duration ${end - start} ms`)
    //console.log(`Larger prolly node block reuse ${diffNodes.percent}%`)
    //console.log(`Larger prolly rlshp block reuse ${diffRlshp.percent}%`)
    //console.log(`Larger prolly prop block reuse ${diffProps.percent}%`)
}

// {
//     const { diffNodes, diffRlshp, diffProps } = await graphToHamt()
//     console.log(`HAMT node block reuse ${diffNodes.percent}%`)
//     console.log(`HAMT rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`HAMT prop block reuse ${diffProps.percent}%`)
// }

// {
//     const start = new Date()
//     const { diffNodes, diffRlshp, diffProps } = await largerGraphToHamt()
//     const end = new Date()
//     console.log(`Duration ${end - start} ms`)
//     console.log(`Larger HAMT node block reuse ${diffNodes.percent}%`)
//     console.log(`Larger HAMT rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`Larger HAMT prop block reuse ${diffProps.percent}%`)
// }
