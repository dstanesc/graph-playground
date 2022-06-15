import { CID } from 'multiformats/cid'
import * as codec from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

const hashNode = async json => {
    delete json.offset
    return await hashContent(json)
}

// keep direct links only
const hashRlshp = async json => {
    delete json.offset
    delete json.firstNode
    delete json.secondNode
    delete json.firstPrevRel
    delete json.secondPrevRel
    delete json.secondNextRel
    const hash = await hashContent(json)
    return hash
}

const hashProp = async json => {
    delete json.offset
    return await hashContent(json)
}

const hashContent = async json => {
    const toEncode = JSON.stringify(json)
    const bytes = codec.encode(toEncode)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, codec.code, hash)
    return cid.toString()
}

export { hashNode, hashRlshp, hashProp }