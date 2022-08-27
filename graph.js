import { Offset } from './offset.js'

import { hashNode, hashRlshp, hashProp } from './hash.js'

import { baselineChanges, rebaseNode, rebaseRlshp, rebaseProp } from './changes.js'

class Graph {

    constructor({ nodeGet, rlshpGet, propGet, nodeOffsetGet, rlshpOffsetGet, propOffsetGet, storageCommit, offsetIncrements }) {
        this.nodes = new Map()
        this.rlshps = new Map()
        this.props = new Map()
        this.nodeOffset = nodeOffsetGet()
        this.rlshpOffset = rlshpOffsetGet()
        this.propOffset = propOffsetGet()
        this.nodeGet = nodeGet
        this.rlshpGet = rlshpGet
        this.propGet = propGet
        this.storageCommit = storageCommit
        this.nodeOffsetGet = nodeOffsetGet
        this.rlshpOffsetGet = rlshpOffsetGet
        this.propOffsetGet = propOffsetGet
        this.offsetIncrements = offsetIncrements
    }

    merger() {
        return new GraphMerger(this)
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
        if (this.graph.nodes.has(offset.toString()))
            return this.graph.nodes.get(offset.toString())
        else {
            const node = await this.graph.nodeGet(offset.toString())
            this.graph.nodes.set(offset.toString(), node)
            return node
        }
    }

    async getRlshp(offset) {
        if (this.graph.rlshps.has(offset.toString()))
            return this.graph.rlshps.get(offset.toString())
        else {
            const rlshp = await this.graph.rlshpGet(offset.toString())
            this.graph.rlshps.set(offset.toString(), rlshp)
            return rlshp
        }
    }

    async getProp(offset) {
        if (this.graph.props.has(offset.toString()))
            return this.graph.props.get(offset.toString())
        else {
            const prop = await this.graph.propGet(offset)
            this.graph.props.set(offset.toString(), prop)
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

class GraphComposer {

    constructor(graph) {
        this.graph = graph
        this.nodesAdded = new Map()
        this.rlshpsAdded = new Map()
        this.propsAdded = new Map()
        this.nodeOffset = graph.nodeOffset
        this.rlshpOffset = graph.rlshpOffset
        this.propOffset = graph.propOffset
        this.initNodeOffset = graph.nodeOffset
        this.initRlshpOffset = graph.rlshpOffset
        this.initPropOffset = graph.propOffset
        this.offsetIncrements = graph.offsetIncrements
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
                    if (rlshp1 == undefined) {
                        rlshp1 = temp
                    } else if (rlshp2 === undefined) {
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
            node = this.nodesAdded.get(offset.toString())
        else
            node = await this.graph.getNode(offset)
        return node
    }

    async getRlshp(offset) {
        let rlshp
        if (offset.greaterOrEquals(this.initRlshpOffset))
            rlshp = this.rlshpsAdded.get(offset.toString())
        else
            rlshp = await this.graph.getRlshp(offset)
        return rlshp
    }

    async getProp(offset) {
        let prop
        if (offset.greaterOrEquals(this.initPropOffset))
            prop = this.propsAdded.get(offset.toString())
        else
            prop = await this.graph.getProp(offset)
        return prop
    }
}

class GraphMerger extends GraphComposer {

    addNode(node) {
        this.nodesAdded.set(node.offset.toString(), node)
        this.nodeOffset = Math.max(this.nodeOffset, node.offset.offset)
        return this
    }

    addRlshp(rlshp) {
        this.rlshpsAdded.set(rlshp.offset.toString(), rlshp)
        this.rlshpOffset = Math.max(this.rlshpOffset, rlshp.offset.offset)
        return this
    }

    addProp(prop) {
        this.propsAdded.set(prop.offset.toString(), prop)
        this.propOffset = Math.max(this.propOffset, prop.offset.offset)
        return this
    }

    updateRlshp(rlshp) {
        this.rlshpsAdded.set(rlshp.offset.toString(), rlshp)
        return this
    }

    updateProp(prop) {
        this.propsAdded.set(prop.offset.toString(), prop)
        return this
    }


    //FIXME WIP
    async mergeChanges(other, baseline) {

        const local = this.graph

        const otherChanges = await baselineChanges(other, baseline)

        const baselineNodeOffset = baseline.nodeOffsetGet()
        const baselineRlshpOffset = baseline.rlshpOffsetGet()
        const baselinePropOffset = baseline.propOffsetGet()
        const baselineOffsets = { baselineNodeOffset, baselineRlshpOffset, baselinePropOffset }

        const localNodeOffset = local.nodeOffsetGet()
        const localRlshpOffset = local.rlshpOffsetGet()
        const localPropOffset = local.propOffsetGet()
        const localOffsets = { localNodeOffset, localRlshpOffset, localPropOffset }

        for (const [offset, node] of otherChanges.nodesAdded) {
            const rebasedNode = await rebaseNode(node, baselineOffsets, localOffsets)
            console.log(`Rebasing node from ${offset} to ${rebasedNode.offset.offset}`)
            console.log(`From`)
            console.log(node.toJson())
            console.log(`To`)
            console.log(rebasedNode.toJson())
            this.addNode(rebasedNode)
        }

        for (const [offset, rlshp] of otherChanges.rlshpsAdded) {
            const rebasedRlshp = await rebaseRlshp(rlshp, baselineOffsets, localOffsets)
            console.log(`Rebasing rlshp from ${offset} to ${rebasedRlshp.offset.offset}`)
            console.log(`From`)
            console.log(rlshp.toJson())
            console.log(`To`)
            console.log(rebasedRlshp.toJson())
            this.addRlshp(rebasedRlshp)
        }

        for (const [offset, prop] of otherChanges.propsAdded) {
            const rebasedProp = await rebaseProp(prop, baselineOffsets, localOffsets)
            console.log(`Rebasing prop from ${offset} to ${rebasedProp.offset.offset}`)
            console.log(`From`)
            console.log(prop.toJson())
            console.log(`To`)
            console.log(rebasedProp.toJson())
            this.addProp(rebasedProp)
        }

        for (const [offset, rlshp] of otherChanges.rlshpsLinked) {
            const rebasedRlshp = await rebaseRlshp(rlshp, baselineOffsets, localOffsets)
            console.log(`Updating rlshp from ${offset} to ${rebasedRlshp.offset.offset}`)
            console.log(`From`)
            console.log(rlshp.toJson())
            console.log(`To`)
            console.log(rebasedRlshp.toJson())
            this.updateRlshp(rebasedRlshp)
        }

        for (const [offset, prop] of otherChanges.propsLinked) {
            const rebasedProp = await rebaseProp(prop, baselineOffsets, localOffsets)
            console.log(`Updating prop from ${offset} to ${rebasedProp.offset.offset}`)
            console.log(`From`)
            console.log(prop.toJson())
            console.log(`To`)
            console.log(rebasedProp.toJson())
            this.updateProp(rebasedProp)
        }

        //FIXME WIP
    }


    async commit() {

        const rebasedNodeOffset = this.nodeOffset + 1
        const rebasedRlshpOffset = this.rlshpOffset + 1
        const rebasedPropOffset = this.propOffset + 1

        console.log(`merging nodeOffset:${rebasedNodeOffset} rlshpOffset:${rebasedRlshpOffset} propOffset:${rebasedPropOffset}`)

        // FIXME: recompute the updated chain only
        await this.processContentAddressing()

        const commitResult = await this.graph.storageCommit(this.nodesAdded, this.rlshpsAdded, this.propsAdded, rebasedNodeOffset, rebasedRlshpOffset, rebasedPropOffset)

        this.graph.nodes = new Map([...this.graph.nodes, ...this.nodesAdded])
        this.graph.rlshps = new Map([...this.graph.rlshps, ...this.rlshpsAdded])
        this.graph.props = new Map([...this.graph.props, ...this.propsAdded])
        this.graph.nodeOffset = rebasedNodeOffset
        this.graph.rlshpOffset = rebasedRlshpOffset
        this.graph.propOffset = rebasedPropOffset
        this.nodesAdded = new Map()
        this.rlshpsAdded = new Map()
        this.propsAdded = new Map()

        return commitResult
    }
}

class GraphWriter extends GraphComposer {

    nextNodeOffset() {
        if (this.offsetIncrements) {
            const currentOffset = this.nodeOffset
            this.nodeOffset += this.offsetIncrements.node
            return new Offset(currentOffset)
        } else
            return new Offset(this.nodeOffset++)
    }


    nextRlshpOffset() {
        if (this.offsetIncrements) {
            const currentOffset = this.rlshpOffset
            this.rlshpOffset += this.offsetIncrements.rlshp
            return new Offset(currentOffset)
        } else
            return new Offset(this.rlshpOffset++)
    }


    nextPropOffset() {
        if (this.offsetIncrements) {
            const currentOffset = this.propOffset
            this.propOffset += this.offsetIncrements.prop
            return new Offset(currentOffset)
        }
        return new Offset(this.propOffset++)
    }

    addNode(label) {
        const node = new Node(this.nextNodeOffset(), label)
        this.nodesAdded.set(node.offset.toString(), node)
        return node
    }

    addRlshp(rlshp) {
        this.rlshpsAdded.set(rlshp.offset.toString(), rlshp)
        return this
    }

    addProp(prop) {
        this.propsAdded.set(prop.offset.toString(), prop)
        return this
    }

    async commit() {

        console.log(`committing nodeOffset:${this.nodeOffset} rlshpOffset:${this.rlshpOffset} propOffset:${this.propOffset}`)

        await this.processIncomingRlshps()

        await this.processContentAddressing()

        const nodesComplete = new Map([...this.graph.nodes, ...this.nodesAdded])
        const rlshpsComplete = new Map([...this.graph.rlshps, ...this.rlshpsAdded])
        const propsComplete = new Map([...this.graph.props, ...this.propsAdded])

        const commitResult = await this.graph.storageCommit(nodesComplete, rlshpsComplete, propsComplete, this.nodesAdded, this.rlshpsAdded, this.propsAdded, this.nodeOffset, this.rlshpOffset, this.propOffset)

        this.graph.nodes = nodesComplete
        this.graph.rlshps = rlshpsComplete
        this.graph.props = propsComplete
        this.graph.nodeOffset = this.nodeOffset
        this.graph.rlshpOffset = this.rlshpOffset
        this.graph.propOffset = this.propOffset
        this.nodesAdded = new Map()
        this.rlshpsAdded = new Map()
        this.propsAdded = new Map()

        return commitResult
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
            await firstNext.addRlshp(graphWriter, rlshp)
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
        if (node.nextProp !== undefined) {
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
        const hash = await hashProp(prop.toJson())
        prop.offset.cid = hash
    }

    const endRlshp = async rlshp => {
        const hash = await hashRlshp(rlshp.toJson())
        rlshp.offset.cid = hash
    }

    const endNode = async node => {
        const hash = await hashNode(node.toJson())
        node.offset.cid = hash
    }

    return { endNode, endRlshp, endProp }
}

export { Graph, GraphWriter, GraphReader, GraphProcessor, Node, Rlshp, Prop }