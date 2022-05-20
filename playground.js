import { Graph, GraphInspector } from './graph.js'
import { vectorStorage } from './storage.js'


const g1 = new Graph()

const r = g1.createNode("root")
const n1 = g1.createNode("2021")
const n2 = g1.createNode("chemistry")
const n3 = g1.createNode("economics")
const n4 = g1.createNode("laureats")
const n5 = g1.createNode("laureats")
const n6 = g1.createNode("1002").addProp('firstname', 'Benjamin').addProp('surname', 'List')
const n7 = g1.createNode("1003").addProp('firstname', 'David').addProp('surname', 'MacMillan')
const n8 = g1.createNode("1007").addProp('firstname', 'David').addProp('surname', 'Card')
const n9 = g1.createNode("1008").addProp('firstname', 'Joshua').addProp('surname', 'Angrist')
const n10 = g1.createNode("1009").addProp('firstname', 'Guido').addProp('surname', 'Imbens')

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

const k1 = g1.createNode("2020")
const k2 = g1.createNode("chemistry")
const k3 = g1.createNode("economics")
const k4 = g1.createNode("laureats")
const k5 = g1.createNode("laureats")
const k6 = g1.createNode("991").addProp('firstname', 'Emmanuelle').addProp('surname', 'Charpentier')
const k7 = g1.createNode("992").addProp('firstname', 'Jennifer').addProp('surname', 'Doudna')
const k8 = g1.createNode("995").addProp('firstname', 'Paul').addProp('surname', 'Milgrom')
const k9 = g1.createNode("996").addProp('firstname', 'Robert').addProp('surname', 'Wilson')

const r11 = r.addRlshp(k1)
const r12 = k1.addRlshp(k2)
const r13 = k1.addRlshp(k3)
const r14 = k2.addRlshp(k4)
const r15 = k3.addRlshp(k5)
const r16 = k4.addRlshp(k6)
const r17 = k4.addRlshp(k7)
const r18 = k5.addRlshp(k8)
const r19 = k5.addRlshp(k9)


const s1 = await vectorStorage()

await g1.commit(s1)

await s1.showBlocks()

new GraphInspector(g1).debug()

const root = g1.getRoot()

console.log(`===`)

console.log(root.toString())

for(const rlshp of root.getRlshps()){
    console.log(rlshp.toString())
}

// const k10 = g1.createNode("literature")
// const k11 = g1.createNode("993").addProp('firstname', 'Louise').addProp('surname', 'Glück')
// const r20 = k1.addRlshp(k10)
// const r21 = k10.addRlshp(k11)

// const s2 = await vectorStorage()

// await g1.commit(s2)

// await s2.showBlocks()

// const {diffNodes, diffRlshp} = s2.diff(s1)

// for(const cid of diffNodes.added){
//     console.log(`Added node block ${cid}`)
// }

// for(const cid of diffNodes.reused){
//     console.log(`Reused node block ${cid}`)
// }

// for(const cid of diffRlshp.added){
//      console.log(`Added rlshp block ${cid}`)
// }

// for(const cid of diffRlshp.reused){
//     console.log(`Reused rlshp block ${cid}`)
// }

