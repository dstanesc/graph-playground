import {GraphWriter} from './graph.js'

const createGraph = () => {

    const gw = new GraphWriter()

    const r = gw.addNode("root")
    const n1 = gw.addNode("2021")
    const n2 = gw.addNode("chemistry")
    const n3 = gw.addNode("economics")
    const n4 = gw.addNode("laureates")
    const n5 = gw.addNode("laureates")
    const n6 = gw.addNode("1002").addProp('firstname', 'Benjamin').addProp('surname', 'List')
    const n7 = gw.addNode("1003").addProp('firstname', 'David').addProp('surname', 'MacMillan')
    const n8 = gw.addNode("1007").addProp('firstname', 'David').addProp('surname', 'Card')
    const n9 = gw.addNode("1008").addProp('firstname', 'Joshua').addProp('surname', 'Angrist')
    const n10 = gw.addNode("1009").addProp('firstname', 'Guido').addProp('surname', 'Imbens')

    const r1 = r.addRlshp(n1)
    const r2 = n1.addRlshp(n2)
    const r3 = n1.addRlshp(n3)
    const r4 = n2.addRlshp(n4)
    const r5 = n3.addRlshp(n5)
    const r6 = n4.addRlshp(n6)
    const r7 = n4.addRlshp(n7)
    const r8 = n5.addRlshp(n8)
    const r9 = n5.addRlshp(n9)
    const r10 = n5.addRlshp(n10)

    const k1 = gw.addNode("2020")
    const k2 = gw.addNode("chemistry")
    const k3 = gw.addNode("economics")
    const k4 = gw.addNode("laureates")
    const k5 = gw.addNode("laureates")
    const k6 = gw.addNode("991").addProp('firstname', 'Emmanuelle').addProp('surname', 'Charpentier')
    const k7 = gw.addNode("992").addProp('firstname', 'Jennifer').addProp('surname', 'Doudna')
    const k8 = gw.addNode("995").addProp('firstname', 'Paul').addProp('surname', 'Milgrom')
    const k9 = gw.addNode("996").addProp('firstname', 'Robert').addProp('surname', 'Wilson')

    const r11 = r.addRlshp(k1)
    const r12 = k1.addRlshp(k2)
    const r13 = k1.addRlshp(k3)
    const r14 = k2.addRlshp(k4)
    const r15 = k3.addRlshp(k5)
    const r16 = k4.addRlshp(k6)
    const r17 = k4.addRlshp(k7)
    const r18 = k5.addRlshp(k8)
    const r19 = k5.addRlshp(k9)

    return gw
}

const updateGraph = (gw) => {
    const k10 = gw.addNode("literature")
    const k11 = gw.addNode("993")
    k11.addProp('firstname', 'Louise').addProp('surname', 'Glück')
    const r20 = gw.nodes[11].addRlshp(k10)
    const r21 = k10.addRlshp(k11)
    return gw
}

export { createGraph, updateGraph } 