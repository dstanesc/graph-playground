import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'

const CID_VERSION = 1
const CODEC_CODE = raw.code

const codec = () => {

    const encode = async bytes => {
        const chunkHash = await sha256.digest(bytes)
        const chunkCid = CID.create(CID_VERSION, CODEC_CODE, chunkHash)
        return chunkCid
    }

    const decode = cidBytes => {
        return CID.decode(cidBytes)
    }

    return { encode, decode }
}
export { codec }