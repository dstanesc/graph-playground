import { Graph, GraphWriter } from './graph.js'

const createGraph = async (gw) => {

    const r = gw.addNode("root")
    const n1 = gw.addNode("2021")
    const n2 = gw.addNode("chemistry")
    const n3 = gw.addNode("economics")

    const n6 = gw.addNode("1002")
    await n6.addProp(gw, 'firstname', 'Benjamin')
    await n6.addProp(gw, 'surname', 'List')
    const n7 = gw.addNode("1003")
    await n7.addProp(gw, 'firstname', 'David')
    await n7.addProp(gw, 'surname', 'MacMillan')
    const n8 = gw.addNode("1007")
    await n8.addProp(gw, 'firstname', 'David')
    await n8.addProp(gw, 'surname', 'Card')
    const n9 = gw.addNode("1008")
    await n9.addProp(gw, 'firstname', 'Joshua')
    await n9.addProp(gw, 'surname', 'Angrist')
    const n10 = gw.addNode("1009")
    await n10.addProp(gw, 'firstname', 'Guido')
    await n10.addProp(gw, 'surname', 'Imbens')

    const r1 = await r.addRlshp(gw, "year", n1)
    const r2 = await n1.addRlshp(gw, "category", n2)
    const r3 = await n1.addRlshp(gw, "category", n3)

    const r4 = await n2.addRlshp(gw, "laureates", n6)
    const r5 = await n3.addRlshp(gw, "laureates", n7)

    const r8 = await n3.addRlshp(gw, "laureates", n8)
    const r9 = await n3.addRlshp(gw, "laureates", n9)
    const r10 = await n3.addRlshp(gw, "laureates", n10)

    const k1 = gw.addNode("2020")
    const k2 = gw.addNode("chemistry")
    const k3 = gw.addNode("economics")

    const k6 = gw.addNode("991")
    await k6.addProp(gw, 'firstname', 'Emmanuelle')
    await k6.addProp(gw, 'surname', 'Charpentier')
    const k7 = gw.addNode("992")
    await k7.addProp(gw, 'firstname', 'Jennifer')
    await k7.addProp(gw, 'surname', 'Doudna')
    const k8 = gw.addNode("995")
    await k8.addProp(gw, 'firstname', 'Paul')
    await k8.addProp(gw, 'surname', 'Milgrom')
    const k9 = gw.addNode("996")
    await k9.addProp(gw, 'firstname', 'Robert')
    await k9.addProp(gw, 'surname', 'Wilson')

    const r11 = await r.addRlshp(gw, "year", k1)
    const r12 = await k1.addRlshp(gw, "category", k2)
    const r13 = await k1.addRlshp(gw, "category", k3)

    const r16 = await k2.addRlshp(gw, "laureates", k6)
    const r17 = await k2.addRlshp(gw, "laureates", k7)

    const r18 = await k3.addRlshp(gw, "laureates", k8)
    const r19 = await k3.addRlshp(gw, "laureates", k9)

    return gw
}

const updateGraph = async (g, gw) => {
    const k10 = gw.addNode("literature")
    const k11 = gw.addNode("993")
    await k11.addProp(gw, 'firstname', 'Louise')
    await k11.addProp(gw, 'surname', 'Glück')
    // const n9 = await g.getNode(9)
    
    const n9 = await g.getNode(468) //FIXME will fail on non -chunky backends
    const r20 = await n9.addRlshp(gw, "category", k10)
    const r21 = await k10.addRlshp(gw, "laureates", k11)
    return gw
}

export { createGraph, updateGraph } 