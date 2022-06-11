import { Offset } from './offset.js'

import { hashContent } from './hash.js'


class Graph {

    constructor({ nodeGet, rlshpGet, propGet, nodeOffsetGet, rlshpOffsetGet, propOffsetGet, storageCommit }) {
        this.nodes = []
        this.rlshps = []
        this.props = []
        this.nodeOffset = nodeOffsetGet()
        this.rlshpOffset = rlshpOffsetGet()
        this.propOffset = propOffsetGet()
        this.nodeGet = nodeGet
        this.rlshpGet = rlshpGet
        this.propGet = propGet
        this.storageCommit = storageCommit
    }

    writer() {
        return new GraphWriter(this)
    }

    reader() {
        return new GraphReader(this)
    }

    async getRoot() {
        return await this.getNode(new Offset(0))
    }

    async getNode(offset) {
        return await this.reader().getNode(offset)
    }

    async getRlshp(offset) {
        return await this.reader().getRlshp(offset)
    }

    async getProp(offset) {
        return await this.reader().getProp(offset)
    }
}

class SearchCompleted {
    constructor() {
    }
}

class GraphReader {

    constructor(graph) {
        this.graph = graph
    }

    async getNode(offset) {
        if (this.graph.nodes[offset.toString()] !== undefined)
            return this.graph.nodes[offset.toString()]
        else {
            const node = await this.graph.nodeGet(offset.toString())
            this.graph.nodes[offset.toString()] = node
            return node
        }
    }

    async getRlshp(offset) {
        if (this.graph.rlshps[offset.toString()] !== undefined)
            return this.graph.rlshps[offset.toString()]
        else {
            const rlshp = await this.graph.rlshpGet(offset.toString())
            this.graph.rlshps[offset.toString()] = rlshp
            return rlshp
        }
    }

    async getProp(offset) {
        if (this.graph.props[offset.toString()] !== undefined)
            return this.graph.props[offset.toString()]
        else {
            const prop = await this.graph.propGet(offset)
            this.graph.props[offset.toString()] = prop
            return prop
        }
    }

    async * read(path, select) {
        try {
            const root = await this.getNode(new Offset(0))
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

    constructor(graph) {
        this.graph = graph
        this.nodesAdded = []
        this.rlshpsAdded = []
        this.propsAdded = []
        this.nodesRemoved = []
        this.rlshpsRemoved = []
        this.propsRemoved = []
        this.nodeOffset = graph.nodeOffset
        this.rlshpOffset = graph.rlshpOffset
        this.propOffset = graph.propOffset
        this.initNodeOffset = graph.nodeOffset
        this.initRlshpOffset = graph.rlshpOffset
        this.initPropOffset = graph.propOffset
    }

    nextNodeOffset() {
        return new Offset(this.nodeOffset++)
    }

    nextRlshpOffset() {
        return new Offset(this.rlshpOffset++)
    }

    nextPropOffset() {
        return new Offset(this.propOffset++)
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

    async commit() {

        console.log(`committing nodeOffset:${this.nodeOffset.toString()} rlshpOffset:${this.rlshpOffset.toString()} propOffset:${this.propOffset.toString()}`)

        await this.processIncomingRlshps()

        await this.processContentAddressing()

        const commitResult = await this.graph.storageCommit(this.nodesAdded, this.rlshpsAdded, this.propsAdded, this.nodeOffset.toString(), this.rlshpOffset.toString(), this.propOffset.toString())

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

    async processIncomingRlshps() {
        const incomingRlshpTable = new Map()
        await new GraphProcessor(this).process(incomingRlshpsVisitor(incomingRlshpTable))
        for (const [secondNodeOffset, rlshpSet] of incomingRlshpTable.entries()) {
            if (rlshpSet !== undefined && rlshpSet.size > 1) { // build the chain
                let rlshp1
                let rlshp2
                for (const rlshpOffset of rlshpSet.values()) {
                    const temp = await this.getRlshp(rlshpOffset)
                    if(rlshp1 == undefined){
                       rlshp1 = temp 
                    } else if(rlshp2 === undefined){
                        rlshp2 = temp
                        rlshp2.secondPrevRel = rlshp1.offset
                        rlshp1.secondNextRel = rlshp2.offset
                    } else {
                       rlshp1 = rlshp2
                       rlshp2 = temp
                       rlshp2.secondPrevRel = rlshp1.offset
                       rlshp1.secondNextRel = rlshp2.offset
                    }
                }
            }
        }
    }

    async processContentAddressing() {
        await new GraphProcessor(this).process(contentAddressVisitor())
    }

    async getRoot() {
        return await this.getNode(new Offset(0))
    }

    async getNode(offset) {
        let node
        if (offset.greaterOrEquals(this.initNodeOffset))
            node = this.nodesAdded[offset.minus(this.initNodeOffset)]
        else
            node = await this.graph.getNode(offset)
        return node
    }

    async getRlshp(offset) {
        let rlshp
        if (offset.greaterOrEquals(this.initRlshpOffset))
            rlshp = this.rlshpsAdded[offset.minus(this.initRlshpOffset)]
        else
            rlshp = await this.graph.getRlshp(offset)
        return rlshp
    }

    async getProp(offset) {
        let prop
        if (offset.greaterOrEquals(this.initPropOffset))
            prop = this.propsAdded[offset.minus(this.initPropOffset)]
        else
            prop = await this.graph.getProp(offset)
        return prop
    }
}

class Rlshp {
    constructor(offset, label, firstNode, secondNode, firstPrevRel, firstNextRel, secondPrevRel, secondNextRel) {
        this.offset = offset
        this.label = label
        this.firstNode = firstNode
        this.secondNode = secondNode
        this.firstPrevRel = firstPrevRel
        this.firstNextRel = firstNextRel
        this.secondPrevRel = secondPrevRel
        this.secondNextRel = secondNextRel
    }

    toJson() {
        const json = {
            offset: this.offset.toJson(),
            label: this.label,
            firstNode: this.firstNode.toJson(),
            secondNode: this.secondNode.toJson(),
        }
        if (this.firstPrevRel !== undefined)
            json.firstPrevRel = this.firstPrevRel.toJson()
        if (this.firstNextRel !== undefined)
            json.firstNextRel = this.firstNextRel.toJson()
        if (this.secondPrevRel !== undefined)
            json.secondPrevRel = this.secondPrevRel.toJson()
        if (this.secondNextRel !== undefined)
            json.secondNextRel = this.secondNextRel.toJson()


        return json
    }

    async addRlshp(graphWriter, rlshp) {
        if (this.firstNextRel === undefined) {
            this.firstNextRel = rlshp.offset
            rlshp.firstPrevRel = this.firstNextRel
        } else {
            const firstNext = await graphWriter.getRlshp(this.firstNextRel)
            firstNext.addRlshp(graphWriter, rlshp)
        }
    }

    static fromJson(json) {
        return new Rlshp(Offset.fromJson(json.offset), json.label, Offset.fromJson(json.firstNode), Offset.fromJson(json.secondNode), json.firstPrevRel !== undefined ? Offset.fromJson(json.firstPrevRel) : undefined, json.firstNextRel !== undefined ? Offset.fromJson(json.firstNextRel) : undefined, json.secondPrevRel !== undefined ? Offset.fromJson(json.secondPrevRel) : undefined, json.secondNextRel !== undefined ? Offset.fromJson(json.secondNextRel) : undefined)
    }

    toString() {
        return `Rlshp ${this.offset} ${this.label} : ${this.firstNode} => ${this.secondNode}`;
    }
}

class Node {

    constructor(offset, label, nextRlshp, nextProp) {
        this.offset = offset
        this.label = label
        this.nextRlshp = nextRlshp
        this.nextProp = nextProp
    }

    async addRlshp(graphWriter, label, node) {
        const rlshp = new Rlshp(graphWriter.nextRlshpOffset(), label, this.offset, node.offset)
        if (this.nextRlshp !== undefined) {
            const next = await graphWriter.getRlshp(this.nextRlshp)
            await next.addRlshp(graphWriter, rlshp)
        } else
            this.nextRlshp = rlshp.offset
        graphWriter.addRlshp(rlshp)
        return rlshp
    }

    async addProp(graphWriter, propName, propValue) {
        if (propName !== undefined && propValue !== undefined) {
            const prop = new Prop(graphWriter.nextPropOffset(), propName, propValue)
            if (this.nextProp !== undefined) {
                const next = await graphWriter.getProp(this.nextProp)
                next.addProp(graphWriter, prop)
            } else
                this.nextProp = prop.offset
            graphWriter.addProp(prop)
        }
        return this
    }

    toJson() {
        const json = {
            offset: this.offset.toJson(),
            label: this.label,
        }
        if (this.nextRlshp !== undefined)
            json.nextRlshp = this.nextRlshp.toJson()

        if (this.nextProp !== undefined)
            json.nextProp = this.nextProp.toJson()

        return json
    }

    static fromJson(json) {
        return new Node(Offset.fromJson(json.offset), json.label, json.nextRlshp !== undefined ? Offset.fromJson(json.nextRlshp) : undefined, json.nextProp !== undefined ? Offset.fromJson(json.nextProp) : undefined)
    }

    toString() {
        return `Node ${this.offset} ${this.label} nextRlshp:${this.nextRlshp} nextProp:${this.nextProp}`;
    }
}

class Prop {
    constructor(offset, key, value, nextProp) {
        this.offset = offset
        this.key = key
        this.value = value
        this.nextProp = nextProp
    }

    async addProp(graphWriter, prop) {
        if (this.nextProp === undefined)
            this.nextProp = prop.offset
        else {
            const next = await graphWriter.getProp(this.nextProp)
            next.addProp(graphWriter, prop)
        }
        return this
    }

    toJson() {
        const json = {
            offset: this.offset.toJson(),
            key: this.key,
            value: this.value,
        }
        if (this.nextProp !== undefined)
            json.nextProp = this.nextProp.toJson()

        return json
    }

    static fromJson(json) {
        return new Prop(Offset.fromJson(json.offset), json.key, json.value, json.nextProp !== undefined ? Offset.fromJson(json.nextProp) : undefined)
    }

    toString() {
        return `Prop ${this.offset} ${this.key}:${this.value} nextProp:${this.nextProp}`;
    }
}


class GraphProcessor {

    constructor(accessor) {
        this.accessor = accessor
    }

    process = async visitor => {
        const root = await this.accessor.getNode(new Offset(0))
        await this.traverseNode(root, visitor)
        return this
    }

    traverseNode = async (node, visitor) => {
        if (visitor.startNode)
            await visitor.startNode(node)
        if (node.nextRlshp !== undefined) {
            const rlshpFirstOffset = node.nextRlshp
            const rlshpFirst = await this.accessor.getRlshp(rlshpFirstOffset)
            await this.traverseRlshp(rlshpFirst, visitor);
        }
        if (node.nextProp != undefined) {
            const propFirstOffset = node.nextProp
            const propFirst = await this.accessor.getProp(propFirstOffset)
            await this.traverseProp(propFirst, visitor)
        }
        if (visitor.endNode)
            await visitor.endNode(node)
    }

    traverseRlshp = async (rlshp, visitor) => {
        if (visitor.startRlshp)
            await visitor.startRlshp(rlshp)
        if (rlshp.firstNextRel !== undefined) {
            const rlshpNextOffset = rlshp.firstNextRel
            const rlshpNext = await this.accessor.getRlshp(rlshpNextOffset)
            await this.traverseRlshp(rlshpNext, visitor);
        }
        const secondNodeOffset = rlshp.secondNode
        const secondNode = await this.accessor.getNode(secondNodeOffset)
        await this.traverseNode(secondNode, visitor)
        if (visitor.endRlshp)
            await visitor.endRlshp(rlshp)
    }

    traverseProp = async (prop, visitor) => {
        if (visitor.startProp)
            await visitor.startProp(prop)
        if (prop.nextProp !== undefined) {
            const propNextOffset = prop.nextProp
            const propNext = await this.accessor.getProp(propNextOffset)
            await this.traverseProp(propNext, visitor)
        }
        if (visitor.endProp)
            await visitor.endProp(prop)
    }
}

const incomingRlshpsVisitor = (incomingRlshps) => {

    const endRlshp = rlshp => {
        const rlshpOffset = rlshp.offset
        const nodeOffset = rlshp.secondNode
        if (incomingRlshps.has(nodeOffset.toString())) {
            let rlshpSet = incomingRlshps.get(nodeOffset.toString())
            rlshpSet.add(rlshpOffset)
        } else {
            let rlshpSet = new Set()
            rlshpSet.add(rlshpOffset)
            incomingRlshps.set(nodeOffset.toString(), rlshpSet)
        }
    }

    return { endRlshp }
}

const contentAddressVisitor = () => {

    const endProp = async prop => {
        const hash = await hashContent(JSON.stringify(prop.toJson()))
        prop.offset.cid = hash
    }

    const endRlshp = async rlshp => {
        const hash = await hashContent(JSON.stringify(rlshp.toJson()))
        rlshp.offset.cid = hash
    }

    const endNode = async node => {
        const hash = await hashContent(JSON.stringify(node.toJson()))
        node.offset.cid = hash
    }

    return { endNode, endRlshp, endProp }
}

export { Graph, GraphWriter, GraphReader, GraphProcessor, Node, Rlshp, Prop }