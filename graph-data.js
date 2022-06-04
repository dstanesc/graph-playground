import { Graph, GraphWriter } from './graph.js'

const createGraph = (gw) => {

    const r = gw.addNode("root")
    const n1 = gw.addNode("2021")
    const n2 = gw.addNode("chemistry")
    const n3 = gw.addNode("economics")

    const n6 = gw.addNode("1002").addProp(gw, 'firstname', 'Benjamin').addProp(gw, 'surname', 'List')
    const n7 = gw.addNode("1003").addProp(gw, 'firstname', 'David').addProp(gw, 'surname', 'MacMillan')
    const n8 = gw.addNode("1007").addProp(gw, 'firstname', 'David').addProp(gw, 'surname', 'Card')
    const n9 = gw.addNode("1008").addProp(gw, 'firstname', 'Joshua').addProp(gw, 'surname', 'Angrist')
    const n10 = gw.addNode("1009").addProp(gw, 'firstname', 'Guido').addProp(gw, 'surname', 'Imbens')

    const r1 = r.addRlshp(gw, "year", n1)
    const r2 = n1.addRlshp(gw, "category", n2)
    const r3 = n1.addRlshp(gw, "category", n3)

    const r4 = n2.addRlshp(gw, "laureates", n6)
    const r5 = n3.addRlshp(gw, "laureates", n7)

    const r8 = n3.addRlshp(gw, "laureates", n8)
    const r9 = n3.addRlshp(gw, "laureates", n9)
    const r10 = n3.addRlshp(gw, "laureates", n10)

    const k1 = gw.addNode("2020")
    const k2 = gw.addNode("chemistry")
    const k3 = gw.addNode("economics")

    const k6 = gw.addNode("991").addProp(gw, 'firstname', 'Emmanuelle').addProp(gw, 'surname', 'Charpentier')
    const k7 = gw.addNode("992").addProp(gw, 'firstname', 'Jennifer').addProp(gw, 'surname', 'Doudna')
    const k8 = gw.addNode("995").addProp(gw, 'firstname', 'Paul').addProp(gw, 'surname', 'Milgrom')
    const k9 = gw.addNode("996").addProp(gw, 'firstname', 'Robert').addProp(gw, 'surname', 'Wilson')

    const r11 = r.addRlshp(gw, "year", k1)
    const r12 = k1.addRlshp(gw, "category", k2)
    const r13 = k1.addRlshp(gw, "category", k3)

    const r16 = k2.addRlshp(gw, "laureates", k6)
    const r17 = k2.addRlshp(gw, "laureates", k7)

    const r18 = k3.addRlshp(gw, "laureates", k8)
    const r19 = k3.addRlshp(gw, "laureates", k9)

    return gw
}

const updateGraph = async (g, gw) => {
    const k10 = gw.addNode("literature")
    const k11 = gw.addNode("993")
    k11.addProp(gw, 'firstname', 'Louise').addProp(gw, 'surname', 'Glück')
    const n9 = await g.getNode(9)
    const r20 = n9.addRlshp(gw, "category", k10)
    const r21 = k10.addRlshp(gw, "laureates", k11)
    return gw
}

export { createGraph, updateGraph } 