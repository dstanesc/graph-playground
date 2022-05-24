## Graph & Graph Storage Playground

_WIP_

Early draft looking into graph structures and graph immutable storage options

Graph structure inspired by the Neo4j' index-free adjacency, that is each node acts as a micro-index of the nearby nodes.

Three distinct stores of data: nodes, relationships, properties.

## Data Structures

For instance if stores are vectors of data, references are offsets in the target vector

Node structure
```js
{ offset, label, nextRlshp}
```
Rlshp structure
```js
{ offset, firstNode, secondNode, firstNodePrevRlshp, firstNodeNextRlshp }
```

## Storage

Effectively immutable content addressable set of blocks. The goal is to minimize the I/O associated w/ graph updates (eg. append/upload few blocks only) and graph traversal (eg. load/download few blocks only). 

## Useful Links

- [Immutable Asynchronous Vector](https://github.com/rvagg/iavector)
- [Immutable Asynchronous Map](https://github.com/rvagg/iamap)
- [js-ipld-hashmap](https://github.com/rvagg/js-ipld-hashmap)
- [js-ipld-vector](https://github.com/rvagg/js-ipld-vector)
- [Prolly Trees](https://github.com/mikeal/prolly-trees)
- [Probabilistic B-Trees](https://github.com/attic-labs/noms/blob/master/doc/intro.md#prolly-trees-probabilistic-b-trees)
