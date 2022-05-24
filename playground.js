import { Graph, GraphInspector } from './graph.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './graph-data.js'
import { createLargerGraph, updateLargerGraph } from './graph-data-larger.js'

const graphToVector = async () => {
    const g1 = createGraph()
    const s1 = await vectorStorage()
    await g1.commit(s1)
    //await s1.showBlocks()
    updateGraph(g1)
    const s2 = await vectorStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    return { diffNodes, diffRlshp, diffProps }
}

const largerGraphToVector = async () => {
    const g1 = createLargerGraph()
    const s1 = await vectorStorage()
    await g1.commit(s1)
    //await s1.showBlocks()
    updateLargerGraph(g1)
    const s2 = await vectorStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    return { diffNodes, diffRlshp, diffProps }
}

const graphToProlly = async () => {
    const g1 = createGraph()
    const s1 = await prollyStorage()
    await g1.commit(s1)
    //await s1.showBlocks()
    updateGraph(g1)
    const s2 = await prollyStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    return { diffNodes, diffRlshp, diffProps }
}

const largerGraphToProlly = async () => {
    const g1 = createLargerGraph()
    const s1 = await prollyStorage()
    await g1.commit(s1)
    //await s1.showBlocks()
    updateLargerGraph(g1)
    const s2 = await prollyStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    return { diffNodes, diffRlshp, diffProps }
}

const graphToHamt = async () => {
    const g1 = createGraph()
    const s1 = await hamtStorage()
    await g1.commit(s1)
    //await s1.showBlocks()
    updateGraph(g1)
    const s2 = await hamtStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    return { diffNodes, diffRlshp, diffProps }
}

const largerGraphToHamt = async () => {
    const g1 = createLargerGraph()
    const s1 = await hamtStorage()
    await g1.commit(s1)
    //await s1.showBlocks()
    updateLargerGraph(g1)
    const s2 = await hamtStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp, diffProps } = s2.diff(s1)
    return { diffNodes, diffRlshp, diffProps }
}

// {
//     const { diffNodes, diffRlshp, diffProps } = await graphToVector()
//     console.log(`Vector node block reuse ${diffNodes.percent}%`)
//     console.log(`Vector rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`Vector prop block reuse ${diffProps.percent}%`)
// }

{
    const start = new Date()
    const { diffNodes, diffRlshp, diffProps } = await largerGraphToVector()
    const end = new Date()
    console.log(`Duration ${end - start} ms`)
    console.log(`Larger vector node block reuse ${diffNodes.percent}%`)
    console.log(`Larger vector rlshp block reuse ${diffRlshp.percent}%`)
    console.log(`Larger vector prop block reuse ${diffProps.percent}%`)
}

// {
//     const { diffNodes, diffRlshp, diffProps } = await graphToProlly()
//     console.log(`Prolly node block reuse ${diffNodes.percent}%`)
//     console.log(`Prolly rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`Prolly prop block reuse ${diffProps.percent}%`)
// }

{
    const start = new Date()
    const { diffNodes, diffRlshp, diffProps } = await largerGraphToProlly()
    const end = new Date()
    console.log(`Duration ${end - start} ms`)
    console.log(`Larger prolly node block reuse ${diffNodes.percent}%`)
    console.log(`Larger prolly rlshp block reuse ${diffRlshp.percent}%`)
    console.log(`Larger prolly prop block reuse ${diffProps.percent}%`)
}

// {
//     const { diffNodes, diffRlshp, diffProps } = await graphToHamt()
//     console.log(`HAMT node block reuse ${diffNodes.percent}%`)
//     console.log(`HAMT rlshp block reuse ${diffRlshp.percent}%`)
//     console.log(`HAMT prop block reuse ${diffProps.percent}%`)
// }

{
    const start = new Date()
    const { diffNodes, diffRlshp, diffProps } = await largerGraphToHamt()
    const end = new Date()
    console.log(`Duration ${end - start} ms`)
    console.log(`Larger HAMT node block reuse ${diffNodes.percent}%`)
    console.log(`Larger HAMT rlshp block reuse ${diffRlshp.percent}%`)
    console.log(`Larger HAMT prop block reuse ${diffProps.percent}%`)
}
