class Offset {
    constructor(offset, cid) {
        this.offset = offset
        this.cid = cid
    }

    offsetValue() {
        return this.offset
    }

    greaterOrEquals(otherValue) {
        return parseInt(this.offsetValue()) >= parseInt(otherValue)
    }

    minus(otherValue) {
        return new Offset(parseInt(this.offsetValue()) - parseInt(otherValue))
    }
    
    minusValue(otherValue) {
        return parseInt(this.offsetValue() - parseInt(otherValue))
    }

    toString() {
        return this.offset.toString();
    }

    toJson() {
        const json = {
            offset: this.offset
        }

        if (this.cid !== undefined)
            json.cid = this.cid

        return json
    }

    static fromJson(json) {
        return new Offset(json.offset, json.cid)
    }
}

export { Offset }