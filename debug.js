
const graphDebugVisitor = () => {

    const startNode = async node => {
        console.log(`startNode ${JSON.stringify(node.toJson())}`)
    }

    const endNode = async node => {
        console.log(`endNode ${JSON.stringify(node.toJson())}`)
    }

    const startRlshp = async rlshp => {
        console.log(`startRlshp ${JSON.stringify(rlshp.toJson())}`)
    }

    const endRlshp = async rlshp => {
        console.log(`endRlshp ${JSON.stringify(rlshp.toJson())}`)
    }

    const startProp = async prop => {
        console.log(`startProp ${JSON.stringify(prop.toJson())}`)
    }

    const endProp = async prop => {
        console.log(`endProp ${JSON.stringify(prop.toJson())}`)
    }

    return { startNode, endNode, startRlshp, endRlshp, startProp, endProp }
}

export { graphDebugVisitor }
