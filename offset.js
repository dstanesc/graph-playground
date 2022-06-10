class Offset {
    constructor(offset) {
        this.offset = offset
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

    toString() {
        return this.offset.toString();
    }
}

export { Offset }