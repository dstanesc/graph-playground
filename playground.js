import { Graph, GraphInspector } from './graph.js'
import { vectorStorage } from './vector-storage.js'
import { prollyStorage } from './prolly-storage.js'
import { hamtStorage } from './hamt-storage.js'
import { createGraph, updateGraph } from './data.js'
import { createLargerGraph, updateLargerGraph} from './data-larger.js'

const graphToVector = async () => {
    const g1 = createGraph()
    const s1 = await vectorStorage()
    await g1.commit(s1)
    //await s1.showBlocks()
    updateGraph(g1)
    const s2 = await vectorStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp } = s2.diff(s1)
    return { diffNodes, diffRlshp }
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
    const { diffNodes, diffRlshp } = s2.diff(s1)
    return { diffNodes, diffRlshp }
}

const largerGraphToProlly = async () => {
    const g1 = createLargerGraph()
    const s1 = await prollyStorage()
    await g1.commit(s1)
    await s1.showBlocks()
    updateLargerGraph(g1)
    const s2 = await prollyStorage()
    await g1.commit(s2)
    //await s2.showBlocks()
    const { diffNodes, diffRlshp } = s2.diff(s1)
    return { diffNodes, diffRlshp }
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
    const { diffNodes, diffRlshp } = s2.diff(s1)
    return { diffNodes, diffRlshp }
}

const largerGraphToHamt = async () => {
    const g1 = createLargerGraph()
    const s1 = await hamtStorage()
    await g1.commit(s1)
    await s1.showBlocks()
    updateLargerGraph(g1)
    const s2 = await hamtStorage()
    await g1.commit(s2)
    const { diffNodes, diffRlshp } = s2.diff(s1)
    return { diffNodes, diffRlshp }
}

// {
//     const { diffNodes, diffRlshp } = await graphToVector()
//     console.log(`Vector node block reuse ${diffNodes.percent}%`)
//     console.log(`Vector rlshp block reuse ${diffRlshp.percent}%`)
// }

// {
//     const { diffNodes, diffRlshp } = await graphToProlly()
//     console.log(`Prolly node block reuse ${diffNodes.percent}%`)
//     console.log(`Prolly rlshp block reuse ${diffRlshp.percent}%`)
// }

{
    const { diffNodes, diffRlshp } = await largerGraphToProlly()
    console.log(`Larger prolly node block reuse ${diffNodes.percent}%`)
    console.log(`Larger prolly rlshp block reuse ${diffRlshp.percent}%`)
}

// {
//     const { diffNodes, diffRlshp } = await graphToHamt()
//     console.log(`HAMT node block reuse ${diffNodes.percent}%`)
//     console.log(`HAMT rlshp block reuse ${diffRlshp.percent}%`)
// }

// {
//     const { diffNodes, diffRlshp } = await largerGraphToHamt()
//     console.log(`Larger HAMT node block reuse ${diffNodes.percent}%`)
//     console.log(`Larger HAMT rlshp block reuse ${diffRlshp.percent}%`)
// }
