
class Commit {
    constructor(nodeRoot, rlshpRoot, propRoot, prevCommit) {
        this.nodeRoot = nodeRoot
        this.rlshpRoot = rlshpRoot
        this.propRoot = propRoot
        this.prevCommit = prevCommit
    }

    toJson() {
        const json = {
            nodeRoot: this.nodeRoot,
            rlshpRoot: this.rlshpRoot,
            propRoot: this.propRoot,
        }
        if (this.prevCommit !== undefined)
            json.prevCommit = this.prevCommit

        return json
    }

    static fromJson(json) {
        return new Commit(json.nodeRoot, json.rlshpRoot, json.propRoot, json.prevCommit)
    }

    toString() {
        return `Commit ${this.nodeRoot}: ${this.rlshpRoot} : ${this.propRoot} => ${this.prevCommit}`;
    }
}

export { Commit }