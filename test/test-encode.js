import { Offset } from '../offset.js'
import { Node, Rlshp, Prop } from '../graph.js'
import { NodesEncoder, NodesDecoder, RlshpsEncoder, RlshpsDecoder, PropsEncoder, PropsDecoder } from '../encoding.js'
import * as assert from 'assert';

describe('Graph', function () {
    describe('Custom Node 52 bytes binary encoding/decoding', function () {
        it('Node serde', function () {
            const nodes = [
                new Node(new Offset(0), "The first node", new Offset(1234), new Offset(3456)),
                new Node(new Offset(52), "The second node", new Offset(4321), new Offset(6543)),
                new Node(new Offset(104), "The third node", new Offset(55555), new Offset(77777))
            ]

            const nodesByteArray = new NodesEncoder(nodes).write().content()

            assert.equal(52 * 3, nodesByteArray.length)

            const nodes2 = new NodesDecoder(nodesByteArray).read()

            const node1 = nodes2[0]
            const node2 = nodes2[1]
            const node3 = nodes2[2]

            console.log(`Read Node 1 ${node1.toString()}`)
            console.log(`Read Node 2 ${node2.toString()}`)
            console.log(`Read Node 3 ${node3.toString()}`)

            assert.equal(0, node1.offset.offset)
            assert.equal("The first node", node1.label)
            assert.equal(1234, node1.nextRlshp)
            assert.equal(3456, node1.nextProp)

            assert.equal(52, node2.offset.offset)
            assert.equal("The second node", node2.label)
            assert.equal(4321, node2.nextRlshp)
            assert.equal(6543, node2.nextProp)

            assert.equal(104, node3.offset.offset)
            assert.equal("The third node", node3.label)
            assert.equal(55555, node3.nextRlshp)
            assert.equal(77777, node3.nextProp)
        });
    });

    describe('Custom Rlshp 64 bytes binary encoding/decoding', function () {
        it('Rlshp serde', function () {
            const rlshps = [
                new Rlshp(new Offset(0), "The first rlshp", new Offset(123), new Offset(33), new Offset(12), new Offset(88), new Offset(99), new Offset(77)),
                new Rlshp(new Offset(68), "The second rlshp", new Offset(321), new Offset(44), new Offset(23), new Offset(55), new Offset(5), new Offset(7)),
                new Rlshp(new Offset(136), "The third rlshp", new Offset(1), new Offset(1), new Offset(1), new Offset(1), new Offset(1), new Offset(1)),
            ]

            const rlshpsByteArray = new RlshpsEncoder(rlshps).write().content()

            assert.equal(68 * 3, rlshpsByteArray.length)

            const rlshps2 = new RlshpsDecoder(rlshpsByteArray).read()

            const rlshp1 = rlshps2[0]
            const rlshp2 = rlshps2[1]
            const rlshp3 = rlshps2[2]

            console.log(`Read Rlshp 1 ${rlshp1.toString()}`)
            console.log(`Read Rlshp 2 ${rlshp2.toString()}`)
            console.log(`Read Rlshp 3 ${rlshp3.toString()}`)

            assert.equal(0, rlshp1.offset.offset)
            assert.equal("The first rlshp", rlshp1.label)
            assert.equal(123, rlshp1.firstNode)
            assert.equal(33, rlshp1.secondNode)

            assert.equal(68, rlshp2.offset.offset)
            assert.equal("The second rlshp", rlshp2.label)
            assert.equal(321, rlshp2.firstNode)
            assert.equal(44, rlshp2.secondNode)


            assert.equal(136, rlshp3.offset.offset)
            assert.equal("The third rlshp", rlshp3.label)
            assert.equal(1, rlshp3.firstNode)
            assert.equal(1, rlshp3.secondNode)

        });
    });

    describe('Custom Prop 116 bytes binary encoding/decoding', function () {
        it('Prop serde', function () {
            const props = [
                new Prop(new Offset(0), "key1", "4d42aff95f8e7611386e8477f7d8d23a6ae08490f7922e03b50dbb08c9b308f9", new Offset(11)),
                new Prop(new Offset(116), "key1", "efc8c0a704015f0d724f219e512b16b0574e4427162a0047acf2ee229fbdc529", new Offset(6543)),
                new Prop(new Offset(232), "key1", "d8eff270b2742d102a87536d81774845874894b479ef3729c904d375b60a999b", new Offset(77777))
            ]

            const propsByteArray = new PropsEncoder(props).write().content()

            assert.equal(116 * 3, propsByteArray.length)

            const props2 = new PropsDecoder(propsByteArray).read()

            const p1 = props2[0]
            const p2 = props2[1]
            const p3 = props2[2]

            console.log(`Read Prop 1 ${p1.toString()}`)
            console.log(`Read Prop 2 ${p2.toString()}`)
            console.log(`Read Prop 3 ${p3.toString()}`)

            assert.equal(0, p1.offset.offset)
            assert.equal("key1", p1.key)
            assert.equal("4d42aff95f8e7611386e8477f7d8d23a6ae08490f7922e03b50dbb08c9b308f9", p1.value)
            assert.equal(11, p1.nextProp)

            assert.equal(116, p2.offset.offset)
            assert.equal("key1", p2.key)
            assert.equal("efc8c0a704015f0d724f219e512b16b0574e4427162a0047acf2ee229fbdc529", p2.value)
            assert.equal(6543, p2.nextProp)

            assert.equal(232, p3.offset.offset)
            assert.equal("key1", p3.key)
            assert.equal("d8eff270b2742d102a87536d81774845874894b479ef3729c904d375b60a999b", p3.value)
            assert.equal(77777, p3.nextProp)
        });
    });
});

