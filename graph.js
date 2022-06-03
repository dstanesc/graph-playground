class Graph {

    constructor() {
        this.nodes = []
        this.rlshps = []
        this.props = []
        this.nodeOffset = 0
        this.rlshpOffset = 0
        this.propOffset = 0
    }

    writer() {
        return new GraphWriter(this, this.nodeOffset, this.rlshpOffset, this.propOffset)
    }

    getRoot() {
        return this.getNode(0)
    }

    getNode(index) {
        return Node.fromJson(this.nodes[index])
    }
}

class SearchCompleted {
    constructor() {
    }
}

class GraphReader {

    constructor({ nodeGet, rlshpGet, propGet }) {
        this.nodeGet = nodeGet
        this.rlshpGet = rlshpGet
        this.propGet = propGet
    }

    async getNode(offset) {
        return await this.nodeGet(offset)
    }

    async getRlshp(offset) {
        return await this.rlshpGet(offset)
    }

    async getProp(offset) {
        return await this.propGet(offset)
    }

    async * read(path, select) {
        try {
            const root = await this.getNode('0')
            yield* this.readInternal(root, 0, path, select)
        } catch (e) {
            if (e instanceof SearchCompleted) {
                //ignore
            } else throw e
        }
    }

    keyValue(elem) {
        return Object.entries(elem)[0]
    }

    async * readInternal(node, index, path, select) {
        if (index < path.length) {
            const elem = path[index]
            const [rlshpLabel, nodeLabel] = this.keyValue(elem)
            const rlshps = await this.getRlshpsNode(node, rlshpLabel)
            for await (const rlshp of rlshps) {
                const childNode = await this.getNode(rlshp.secondNode)
                if (nodeLabel === '*' || childNode.label === nodeLabel) {
                    if (index === path.length - 1) {
                        yield* await this.getPropsNode(childNode, select)
                    } else {
                        yield* await this.readInternal(childNode, index + 1, path, select)
                    }
                }
            }
            throw new SearchCompleted()
        }
    }

    async * getPropsNode(node, select) {
        if (node.nextProp !== undefined) {
            const propJson = await this.getProp(node.nextProp)
            const firstProp = Prop.fromJson(propJson)
            const result = {}
            if (select.includes(firstProp.key)) {
                result[firstProp.key] = firstProp.value
                if (Object.keys(result).length === select.length) {
                    yield result
                } else
                    yield* await this.getPropsProp(firstProp, select, result)
            } else
                yield* await this.getPropsProp(firstProp, select, result)
        }
    }

    async * getPropsProp(prop, select, result) {
        if (prop.nextProp !== undefined) {
            const propJson = await this.getProp(prop.nextProp)
            const nextProp = Prop.fromJson(propJson)
            if (select.includes(nextProp.key)) {
                result[nextProp.key] = nextProp.value
                if (Object.keys(result).length === select.length) {
                    yield result
                } else
                    yield* await this.getPropsProp(nextProp, select, result)
            } else
                yield* await this.getPropsProp(nextProp, select, result)
        }
    }

    async * getNodesNode(node, rlshpLabel) {
        const rlshps = await this.getRlshpsNode(node, rlshpLabel)
        for await (const rlshp of rlshps) {
            const childNode = await this.getNode(rlshp.secondNode)
            yield childNode
        }
    }

    async * getRlshpsNode(node, rlshpLabel) {
        if (node.nextRlshp !== undefined) {
            const rlshpJson = await this.getRlshp(node.nextRlshp)
            const firstRlshp = Rlshp.fromJson(rlshpJson)
            if (firstRlshp.label === rlshpLabel)
                yield firstRlshp
            yield* await this.getRlshpsRlshp(firstRlshp, rlshpLabel)
        }
    }

    async * getRlshpsRlshp(rlshp, rlshpLabel) {
        if (rlshp.firstNextRel !== undefined) {
            const rlshpJson = await this.getRlshp(rlshp.firstNextRel)
            const firstRlshp = Rlshp.fromJson(rlshpJson)
            if (firstRlshp.label === rlshpLabel)
                yield firstRlshp
            yield* await this.getRlshpsRlshp(firstRlshp, rlshpLabel)
        }
    }
}

class GraphWriter {

    constructor(graph, nodeOffset, rlshpOffset, propOffset) {
        this.graph = graph
        this.nodesAdded = []
        this.rlshpsAdded = []
        this.propsAdded = []
        this.nodesRemoved = []
        this.rlshpsRemoved = []
        this.propsRemoved = []
        this.nodeOffset = nodeOffset
        this.rlshpOffset = rlshpOffset
        this.propOffset = propOffset
        this.initNodeOffset = nodeOffset
        this.initRlshpOffset = rlshpOffset
        this.initPropOffset = propOffset
    }

    nextNodeOffset() {
        return this.nodeOffset++
    }

    nextRlshpOffset() {
        return this.rlshpOffset++
    }

    nextPropOffset() {
        return this.propOffset++
    }

    addNode(label) {
        const node = new Node(this.nextNodeOffset(), label)
        //console.log(`Adding node ${node.offset} : ${node.label}`)
        this.nodesAdded.push(node)
        return node
    }

    addRlshp(rlshp) {
        //console.log(`Adding rlshp ${rlshp.offset} : ${rlshp.firstNode}=>${rlshp.secondNode}`)
        this.rlshpsAdded.push(rlshp)
        return this
    }

    addProp(prop) {
        //console.log(`Adding prop ${prop.offset} : ${prop.key}:${prop.value}`)
        this.propsAdded.push(prop)
        return this
    }

    removeNode(offset) {
        this.nodesRemoved.push(offset)
    }

    removeRlshp(offset) {
        this.rlshpsRemoved.push(offset)
    }

    removeProp(offset) {
        this.propsRemoved.push(offset)
    }

    async commit({ storageCommit }) {

        const commitResult = await storageCommit(this.nodesAdded, this.rlshpsAdded, this.propsAdded)

        this.graph.nodes.push(...this.nodesAdded)
        this.graph.rlshps.push(...this.rlshpsAdded)
        this.graph.props.push(...this.propsAdded)
        this.graph.nodeOffset = this.nodeOffset
        this.graph.rlshpOffset = this.rlshpOffset
        this.graph.propOffset = this.propOffset
        this.nodesAdded = []
        this.rlshpsAdded = []
        this.propsAdded = []
        this.nodesRemoved = []
        this.rlshpsRemoved = []
        this.propsRemoved = []
        
        return commitResult
    }

    getRlshp(offset) {
        let rlshp
        if (offset >= this.initRlshpOffset)
            rlshp = this.rlshpsAdded[offset - this.initRlshpOffset]
        else
            rlshp = this.graph.rlshps[offset]
        return rlshp
    }

    getProp(offset) {
        let prop
        if (offset >= this.initPropOffset)
            prop = this.propsAdded[offset - this.initPropOffset]
        else
            prop = this.graph.props[offset]
        return prop
    }
}

class Rlshp {
    constructor(offset, label, firstNode, secondNode, firstPrevRel, firstNextRel) {
        this.offset = offset
        this.label = label
        this.firstNode = firstNode
        this.secondNode = secondNode
        this.firstPrevRel = firstPrevRel
        this.firstNextRel = firstNextRel
    }

    toJson() {
        const json = {
            offset: this.offset,
            label: this.label,
            firstNode: this.firstNode,
            secondNode: this.secondNode,
        }
        if (this.firstPrevRel !== undefined)
            json.firstPrevRel = this.firstPrevRel
        if (this.firstNextRel !== undefined)
            json.firstNextRel = this.firstNextRel

        return json
    }

    addRlshp(graphWriter, rlshp) {
        if (this.firstNextRel === undefined) {
            this.firstNextRel = rlshp.offset
            rlshp.firstPrevRel = this.firstNextRel
        } else
            graphWriter.getRlshp(this.firstNextRel).addRlshp(graphWriter, rlshp)
    }

    static fromJson(json) {
        return new Rlshp(json.offset, json.label, json.firstNode, json.secondNode, json.firstPrevRel, json.firstNextRel)
    }

    toString() {
        return `Rlshp ${this.offset}: ${this.label} : ${this.firstNode}=>${this.secondNode}`;
    }
}

class Node {

    constructor(offset, label, nextRlshp, nextProp) {
        this.offset = offset
        this.label = label
        this.nextRlshp = nextRlshp
        this.nextProp = nextProp
    }


    addRlshp(graphWriter, label, node) {
        const rlshp = new Rlshp(graphWriter.nextRlshpOffset(), label, this.offset, node.offset)
        if (this.nextRlshp !== undefined) {
            graphWriter.getRlshp(this.nextRlshp).addRlshp(graphWriter, rlshp)
        } else
            this.nextRlshp = rlshp.offset
        graphWriter.addRlshp(rlshp)
        return rlshp
    }

    addProp(graphWriter, propName, propValue) {
        if (propName !== undefined && propValue !== undefined) {
            const prop = new Prop(graphWriter.nextPropOffset(), propName, propValue)
            if (this.nextProp !== undefined)
                graphWriter.getProp(this.nextProp).addProp(graphWriter, prop)
            else
                this.nextProp = prop.offset
            graphWriter.addProp(prop)
        }
        return this
    }

    toJson() {
        const json = {
            offset: this.offset,
            label: this.label,
        }
        if (this.nextRlshp !== undefined)
            json.nextRlshp = this.nextRlshp

        if (this.nextProp !== undefined)
            json.nextProp = this.nextProp

        return json
    }

    static fromJson(json) {
        return new Node(json.offset, json.label, json.nextRlshp, json.nextProp)
    }

    toString() {
        return `Node ${this.offset}: ${this.label} nextRlshp ${this.nextRlshp} nextProp ${this.nextProp}`;
    }
}

class Prop {
    constructor(offset, key, value, nextProp) {
        this.offset = offset
        this.key = key
        this.value = value
        this.nextProp = nextProp
    }

    addProp(graphWriter, prop) {
        if (this.nextProp === undefined)
            this.nextProp = prop.offset
        else
            graphWriter.getProp(this.nextProp).addProp(graphWriter, prop)
        return this
    }

    toJson() {
        const json = {
            offset: this.offset,
            key: this.key,
            value: this.value,
        }
        if (this.nextProp !== undefined)
            json.nextProp = this.nextProp

        return json
    }

    static fromJson(json) {
        return new Prop(json.offset, json.key, json.value, json.nextProp)
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

export { Graph, GraphWriter, GraphReader, GraphInspector, Node, Rlshp, Prop }