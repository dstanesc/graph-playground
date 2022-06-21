import { Offset } from './offset.js'
import { Node, Rlshp, Prop } from './graph.js'

async function rebaseNode(node, baselineOffsets, localOffsets) {
    const rebasedNodeOffset = await rebaseOffset(node.offset, baselineOffsets.baselineNodeOffset, localOffsets.localNodeOffset)
    const rebasedNextRlshpOffset = node.nextRlshp === undefined ? undefined : await rebaseOffset(node.nextRlshp, baselineOffsets.baselineRlshpOffset, localOffsets.localRlshpOffset)
    const rebasedNextPropOffset = node.nextProp === undefined ? undefined : await rebaseOffset(node.nextProp, baselineOffsets.baselinePropOffset, localOffsets.localPropOffset)
    return new Node(rebasedNodeOffset, node.label, rebasedNextRlshpOffset, rebasedNextPropOffset)
}

async function rebaseRlshp(rlshp, baselineOffsets, localOffsets) {
    const rebasedRlshpOffset = await rebaseOffset(rlshp.offset, baselineOffsets.baselineRlshpOffset, localOffsets.localRlshpOffset)
    const rebasedFirstNodeOffset = await rebaseOffset(rlshp.firstNode, baselineOffsets.baselineNodeOffset, localOffsets.localNodeOffset)
    const rebasedSecondNodeOffset = await rebaseOffset(rlshp.secondNode, baselineOffsets.baselineNodeOffset, localOffsets.localNodeOffset)
    const rebasedFirstPrevRlshpOffset = rlshp.firstPrevRel === undefined ? undefined : await rebaseOffset(rlshp.firstPrevRel, baselineOffsets.baselineRlshpOffset, localOffsets.localRlshpOffset)
    const rebasedFirstNextRlshpOffset = rlshp.firstNextRel === undefined ? undefined : await rebaseOffset(rlshp.firstNextRel, baselineOffsets.baselineRlshpOffset, localOffsets.localRlshpOffset)
    const rebasedSecondPrevRlshpOffset = rlshp.secondPrevRel === undefined ? undefined : await rebaseOffset(rlshp.secondPrevRel, baselineOffsets.baselineRlshpOffset, localOffsets.localRlshpOffset)
    const rebasedSecondNextRlshpOffset = rlshp.secondNextRel === undefined ? undefined : await rebaseOffset(rlshp.secondNextRel, baselineOffsets.baselineRlshpOffset, localOffsets.localRlshpOffset)
    return new Rlshp(rebasedRlshpOffset, rlshp.label, rebasedFirstNodeOffset, rebasedSecondNodeOffset, rebasedFirstPrevRlshpOffset, rebasedFirstNextRlshpOffset, rebasedSecondPrevRlshpOffset, rebasedSecondNextRlshpOffset)
}

async function rebaseProp(prop, baselineOffsets, localOffsets) {
    const rebasedPropOffset = await rebaseOffset(prop.offset, baselineOffsets.baselinePropOffset, localOffsets.localPropOffset)
    const rebasedNextPropOffset = prop.nextProp === undefined ? undefined : await rebaseOffset(prop.nextProp, baselineOffsets.baselinePropOffset, localOffsets.localPropOffset)
    return new Prop(rebasedPropOffset, prop.key, prop.value, rebasedNextPropOffset)
}

async function rebaseOffset(offset, baselineOffset, localOffset) {
    let rebasedOffset
    if (offset.greaterOrEquals(baselineOffset)) {
        const otherNodeOffsetRecomputed = parseInt(localOffset) + offset.minusValue(baselineOffset)
        rebasedOffset = new Offset(otherNodeOffsetRecomputed, offset.cid)
    } else rebasedOffset = offset
    return rebasedOffset
}

async function baselineChanges(current, baseline) {

    const baselineNodeOffset = baseline.nodeOffsetGet()
    const baselineRlshpOffset = baseline.rlshpOffsetGet()
    const baselinePropOffset = baseline.propOffsetGet()
    const currentNodeOffset = current.nodeOffsetGet()
    const currentRlshpOffset = current.rlshpOffsetGet()
    const currentPropOffset = current.propOffsetGet()

    const nodesAdded = new Map()
    const rlshpsAdded = new Map()
    const propsAdded = new Map()

    for (const offset of range(baselineNodeOffset, currentNodeOffset - 1)) {
        const node = await current.getNode(new Offset(offset))
        nodesAdded.set(node.offset.toString(), node)
    }
    for (const offset of range(baselineRlshpOffset, currentRlshpOffset - 1)) {
        const rlshp = await current.getRlshp(new Offset(offset))
        rlshpsAdded.set(rlshp.offset.toString(), rlshp)
    }
    for (const offset of range(baselinePropOffset, currentPropOffset - 1)) {
        const prop = await current.getProp(new Offset(offset))
        propsAdded.set(prop.offset.toString(), prop)
    }

    const rlshpsLinked = new Map()
    const propsLinked = new Map()

    for (const offset of range(0, baselineRlshpOffset - 1)) {

        const currentRlshp = await current.getRlshp(offset)
        const baselineRlshp = await baseline.getRlshp(offset)

        if (currentRlshp.offset.toString() !== baselineRlshp.offset.toString()) {
            console.log('Inconsistency here')
        }
        // only last in rlshp chain needs linked
        if (baselineRlshp.firstNextRel === undefined && currentRlshp.offset.cid !== baselineRlshp.offset.cid) {
            rlshpsLinked.set(currentRlshp.offset.toString(), currentRlshp)
        }
    }

    for (const offset of range(0, baselinePropOffset - 1)) {
        const currentProp = await current.getProp(offset)
        const baselineProp = await baseline.getProp(offset)
        // only last in prop chain needs linked
        if (baselineProp.nextProp === undefined && currentProp.offset.cid !== baselineProp.offset.cid) {
            propsLinked.set(currentProp.offset.toString(), currentProp)
        }
    }

    return { nodesAdded, rlshpsAdded, propsAdded, rlshpsLinked, propsLinked }
}

function* range(start, end) {
    for (let i = start; i <= end; i++) {
        yield i;
    }
}

export { baselineChanges, rebaseNode, rebaseRlshp, rebaseProp }