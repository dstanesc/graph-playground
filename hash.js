import { CID } from 'multiformats/cid'
import * as codec from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

const hashContent = async json => {
    const bytes = codec.encode(json)
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, codec.code, hash)
    return cid.toString()
}

export { hashContent }