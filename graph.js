
class Graph {
    constructor() {
        this.nodes = []
        this.rlshps = []
        this.rlshpOffsetSeq = 0
        this.nodeOffsetSeq = 0
    }

    createNode = label => {
        const node = new Node(this, this.nodeOffsetSeq++, label)
        this.addNode(node)
        return node
    }

    addNode = node => {
        //console.log(`Adding node ${node.offset} : ${node.label}`)
        this.nodes.push(node)
        return this
    }

    addRlshp = rlshp => {
        //console.log(`Adding rlshp ${rlshp.offset} : ${rlshp.firstNode}=>${rlshp.secondNode}`)
        this.rlshps.push(rlshp)
        return this
    }

    commit = async ({ storageCommit }) => {
        await storageCommit(this.nodes, this.rlshps)
    }

    getRoot = () => {
        return this.getNode(0)
    }

    getNode = index => {
        return Node.fromJson(this, this.nodes[index])
    }
}

class Rlshp {
    constructor(graph, offset, firstNode, secondNode, firstPrevRel, firstNextRel) {
        this.graph = graph
        this.offset = offset
        this.firstNode = firstNode
        this.secondNode = secondNode
        this.firstPrevRel = firstPrevRel
        this.firstNextRel = firstNextRel
    }
    toJson() {
        const json = {
            offset: this.offset,
            firstNode: this.firstNode,
            secondNode: this.secondNode,
        }
        if (this.firstPrevRel !== undefined)
            json.firstPrevRel = this.firstPrevRel
        if (this.firstNextRel !== undefined)
            json.firstNextRel = this.firstNextRel

        return json
    }

    addRlshp(rlshp) {
        if (this.firstNextRel === undefined) {
            this.firstNextRel = rlshp.offset
            rlshp.firstPrevRel = this.firstNextRel
        } else
            this.graph.rlshps[this.firstNextRel].addRlshp(rlshp)
    }

    * getRlshps() {
        if (this.firstNextRel !== undefined) {
            const firstRlshp = Rlshp.fromJson(this.graph, this.graph.rlshps[this.firstNextRel])
            yield firstRlshp
            yield* firstRlshp.getRlshps()
        }
    }

    static fromJson(graph, json) {
        return new Rlshp(graph, json.offset, json.firstNode, json.secondNode, json.firstPrevRel, json.firstNextRel)
    }

    toString() {
        return `Rlshp ${this.offset}: ${this.firstNode}=>${this.secondNode}`;
    }
}

class Node {

    constructor(graph, offset, label, nextRlshp) {
        this.graph = graph
        this.offset = offset
        this.label = label
        this.props = {}
        this.nextRlshp = nextRlshp
    }

    addRlshp(node) {
        const rlshp = new Rlshp(this.graph, this.graph.rlshpOffsetSeq++, this.offset, node.offset)
        if (this.nextRlshp !== undefined)
            this.graph.rlshps[this.nextRlshp].addRlshp(rlshp)
        else
            this.nextRlshp = rlshp.offset
        this.graph.addRlshp(rlshp)
        return rlshp
    }

    * getRlshps() {
        if (this.nextRlshp !== undefined) {
            const firstRlshp = Rlshp.fromJson(this.graph, this.graph.rlshps[this.nextRlshp])
            yield firstRlshp
            yield* firstRlshp.getRlshps()
        }
    }

    addProp = (propName, propValue) => {
        this.props[propName] = propValue
        return this
    }

    toJson() {
        const json = {
            offset: this.offset,
            label: this.label,
        }
        if (this.nextRlshp !== undefined)
            json.nextRlshp = this.nextRlshp

        return json
    }

    static fromJson(graph, json) {
        return new Node(graph, json.offset, json.label, json.nextRlshp)
    }

    toString() {
        return `Node ${this.offset}: ${this.label} nextRlshp ${this.nextRlshp}`;
    }
}

class GraphInspector {

    constructor(graph) {
        this.nodes = graph.nodes
        this.rlshps = graph.rlshps
    }

    traverseNode = (node, visitor) => {
        visitor.startNode(node)
        if (node.nextRlshp !== undefined) {
            const rlshpFirstOffset = node.nextRlshp
            const rlshpFirst = this.rlshps[rlshpFirstOffset]
            visitor.nodeNext(node, rlshpFirst)
            this.traverseRlshp(rlshpFirst, visitor);
        } else {
            visitor.endNode(node)
        }
    }

    traverseRlshp = (rlshp, visitor) => {
        visitor.startRlshp(rlshp)
        if (rlshp.firstNextRel !== undefined) {
            const rlshpNextOffset = rlshp.firstNextRel
            const rlshpNext = this.rlshps[rlshpNextOffset]
            visitor.rlshpNext(rlshp, rlshpNext)
            this.traverseRlshp(rlshpNext, visitor);
        } else {
            visitor.endRlshp(rlshp)
        }
        const secondNodeOffset = rlshp.secondNode
        const secondNode = this.nodes[secondNodeOffset]
        this.traverseNode(secondNode, visitor)
    }

    debug = () => {
        console.log(`Nodes ${this.nodes.length}, Rlshps ${this.rlshps.length}`)
        const root = this.nodes[0]
        this.traverseNode(root, debugVisitor())
        return this
    }
}

const debugVisitor = () => {

    const startNode = node => {
        console.log(`${node.toString()}`)
    }

    const endNode = node => {
        //console.log(`endNode ${node.toString()}`)
    }

    const nodeNext = (node, nextRlshp) => {
        //console.log(`nodeNext ${nextRlshp.toString()}`)
    }

    const startRlshp = rlshp => {
        console.log(`${rlshp.toString()}`)
    }

    const endRlshp = rlshp => {
        //console.log(`endRlshp ${rlshp.toString()}`)
    }

    const rlshpNext = (rlshp, nextRlshp) => {
        //console.log(`rlshpNext ${nextRlshp.toString()}`)
    }

    return { startNode, endNode, nodeNext, startRlshp, endRlshp, rlshpNext }
}

export { Graph, GraphInspector }