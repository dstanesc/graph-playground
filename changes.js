import { Offset } from './offset.js'

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
    for (const offset of range(baselineRlshpOffset, currentRlshpOffset -1 )) {
        const rlshp = await current.getRlshp(new Offset(offset))
        rlshpsAdded.set(rlshp.offset.toString(), rlshp)
    }
    for (const offset of range(baselinePropOffset, currentPropOffset -1 )) {
        const prop = await current.getProp(new Offset(offset))
        propsAdded.set(prop.offset.toString(), prop)
    }

    const rlshpsLinked = new Map()
    const propsLinked = new Map()

    for (const offset of range(0, baselineRlshpOffset -1)) {

        const currentRlshp = await current.getRlshp(offset)
        const baselineRlshp = await baseline.getRlshp(offset)

        if(currentRlshp.offset.toString() !== baselineRlshp.offset.toString()){
            console.log('Inconsistency here')
        }
        // only last in rlshp chain needs linked
        if (baselineRlshp.firstNextRel === undefined && currentRlshp.offset.cid !== baselineRlshp.offset.cid) {
            rlshpsLinked.set(currentRlshp.offset.toString(), currentRlshp)
        }
    }

    for (const offset of range(0, baselinePropOffset -1)) {
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

export { baselineChanges }