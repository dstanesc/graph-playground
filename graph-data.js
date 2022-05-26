import {Graph, GraphWriter} from './graph.js'

const createGraph = (gw) => {

    const r = gw.addNode("root")
    const n1 = gw.addNode("2021")
    const n2 = gw.addNode("chemistry")
    const n3 = gw.addNode("economics")
    const n4 = gw.addNode("laureates")
    const n5 = gw.addNode("laureates")
    const n6 = gw.addNode("1002").addProp(gw, 'firstname', 'Benjamin').addProp(gw, 'surname', 'List')
    const n7 = gw.addNode("1003").addProp(gw, 'firstname', 'David').addProp(gw, 'surname', 'MacMillan')
    const n8 = gw.addNode("1007").addProp(gw, 'firstname', 'David').addProp(gw, 'surname', 'Card')
    const n9 = gw.addNode("1008").addProp(gw, 'firstname', 'Joshua').addProp(gw, 'surname', 'Angrist')
    const n10 = gw.addNode("1009").addProp(gw, 'firstname', 'Guido').addProp(gw, 'surname', 'Imbens')

    const r1 = r.addRlshp(gw, n1)
    const r2 = n1.addRlshp(gw, n2)
    const r3 = n1.addRlshp(gw, n3)
    const r4 = n2.addRlshp(gw, n4)
    const r5 = n3.addRlshp(gw, n5)
    const r6 = n4.addRlshp(gw, n6)
    const r7 = n4.addRlshp(gw, n7)
    const r8 = n5.addRlshp(gw, n8)
    const r9 = n5.addRlshp(gw, n9)
    const r10 = n5.addRlshp(gw, n10)

    const k1 = gw.addNode("2020")
    const k2 = gw.addNode("chemistry")
    const k3 = gw.addNode("economics")
    const k4 = gw.addNode("laureates")
    const k5 = gw.addNode("laureates")
    const k6 = gw.addNode("991").addProp(gw, 'firstname', 'Emmanuelle').addProp(gw, 'surname', 'Charpentier')
    const k7 = gw.addNode("992").addProp(gw, 'firstname', 'Jennifer').addProp(gw, 'surname', 'Doudna')
    const k8 = gw.addNode("995").addProp(gw, 'firstname', 'Paul').addProp(gw, 'surname', 'Milgrom')
    const k9 = gw.addNode("996").addProp(gw, 'firstname', 'Robert').addProp(gw, 'surname', 'Wilson')

    const r11 = r.addRlshp(gw, k1)
    const r12 = k1.addRlshp(gw, k2)
    const r13 = k1.addRlshp(gw, k3)
    const r14 = k2.addRlshp(gw, k4)
    const r15 = k3.addRlshp(gw, k5)
    const r16 = k4.addRlshp(gw, k6)
    const r17 = k4.addRlshp(gw, k7)
    const r18 = k5.addRlshp(gw, k8)
    const r19 = k5.addRlshp(gw, k9)

    return gw
}

const updateGraph = (g, gw) => {
    const k10 = gw.addNode("literature")
    const k11 = gw.addNode("993")
    k11.addProp(gw, 'firstname', 'Louise').addProp(gw, 'surname', 'Glück')
    const r20 = g.getNode(11).addRlshp(gw, k10)
    const r21 = k10.addRlshp(gw, k11)
    return gw
}

export { createGraph, updateGraph } 