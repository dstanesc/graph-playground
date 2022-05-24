## Graph & Graph Storage Playground

_WIP_

Early draft looking into graph structures and graph immutable storage options.

Graph structure inspired by the Neo4j' index-free adjacency, that is each node acts as a micro-index of the nearby nodes.

Three distinct stores of data: nodes, relationships, properties.

History navigation / version control is an important (by)product of the persistence mechanism.

## Run

```
npm install
npm start
npm run clean
```

## Data Structures

For instance if data stores are vectors of data, references are offsets in the target vector:

Node structure
```js
{offset, label, nextRlshp}
```
Rlshp structure
```js
{offset, firstNode, secondNode, firstNodePrevRlshp, firstNodeNextRlshp, secondNodePrevRlshp, secondNodeNextRlshp}
```
Prop structure
```js
{offset, propName, propValue, nextProp}
```
## Storage

Effectively immutable content addressable set of blocks. The goal is to minimize the I/O associated w/ graph updates (eg. append/upload few blocks only) and graph traversal (eg. load/download few blocks only). 

So far three implementations investigated for persistence:
- [js-ipld-vector](https://github.com/rvagg/js-ipld-vector)
- [js-ipld-hashmap](https://github.com/rvagg/js-ipld-hashmap)
- [prolly trees](https://github.com/mikeal/prolly-trees)


## Other Links
- [Immutable Asynchronous Vector](https://github.com/rvagg/iavector)
- [Immutable Asynchronous Map](https://github.com/rvagg/iamap)
- [Probabilistic B-Trees](https://github.com/attic-labs/noms/blob/master/doc/intro.md#prolly-trees-probabilistic-b-trees)
- [How Dolt Stores Table Data](https://www.dolthub.com/blog/2020-04-01-how-dolt-stores-table-data/)
- [Optimizing Hash-Array Mapped Tries](https://michael.steindorfer.name/publications/oopsla15.pdf)