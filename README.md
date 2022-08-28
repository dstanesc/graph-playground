## Graph & Graph Storage Playground

_WIP_

Early draft looking into graph structures and graph immutable storage options.

Graph structure inspired by the Neo4j' index-free adjacency, that is each node acts as a micro-index of the nearby nodes.

Three distinct stores of data: nodes, relationships, properties.

History navigation / version control is an important (by)product of the persistence mechanism.


## Data Structures

For instance if data stores are vectors of data, references are offsets in the target vector:

Node structure
```js
{offset, label, nextRlshp, nextProp}
```
Rlshp structure
```js
{offset, rlshpLabel, firstNode, secondNode, firstNodePrevRlshp, firstNodeNextRlshp, secondNodePrevRlshp, secondNodeNextRlshp}
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


## Run

```
npm install
npm start
npm run clean
```

## Storage Results

```
// bf(3), dag-cbor, sha2-256
---
Prolly storage
Insert duration 406 ms
Blocks size1 634.36 KB
Blocks count1 3238
Blocks size2 640.88 KB
Blocks count2 3271
Block size increase 1.02 %
Block count increase 1.01 %

---

// bitWidth: 4, bucketSize: 3, blockCodec: dag-cbor, blockHasher: sha2-256
---
Hamt storage
Insert duration 2885 ms
Blocks size1 475.98 KB
Blocks count1 785
Blocks size2 476.38 KB
Blocks count2 785
Block increase 0.08 %

---

// width: 4, blockCodec: dag-cbor, blockAlg: sha2-256
---
Vector storage
Insert duration 4169 ms
Blocks size1 533.24 KB
Blocks count1 2141
Blocks size2 533.84 KB
Blocks count2 2145
Block increase 0.11 %

---
```

## Pseudo Query Language

Navigation based on a path of elements. Each path element is a constraint on rlshp label combined with node label.

```
[{rlshpLabel: nodeLabel}, ...]

eg. [{'year':'2021'}, {'category':'chemistry'}, {'laureates':'*'}]
```

Property selection is a list of property labels

```
['propLabel', ...]

eg. ['surname', 'firstname', 'motivation']
```

## Query Results

### Dataset

- [Nobel prizes](./nobel.js)

### Quick Scan

`PATH [{'year':'2021'}, {'category':'chemistry'}, {'laureates':'*'}]`

`SELECT ['surname', 'firstname', 'motivation']`

__Prolly__ 
- bf: 3

```
---Found---
{
  firstname: 'Benjamin',
  surname: 'List',
  motivation: '"for the development of asymmetric organocatalysis"'
}
---Found---
{
  firstname: 'David',
  surname: 'MacMillan',
  motivation: '"for the development of asymmetric organocatalysis"'
}
Query duration 4 ms

// bf: 4 -> Query duration 4 ms
```
__Hamt__ 
- bitWidth: 4, 
- bucketSize: 3

```
---Found---
{
  firstname: 'Benjamin',
  surname: 'List',
  motivation: '"for the development of asymmetric organocatalysis"'
}
---Found---
{
  firstname: 'David',
  surname: 'MacMillan',
  motivation: '"for the development of asymmetric organocatalysis"'
}
Query duration 7 ms
```

__Vector__
- width: 4

```
---Found---
{
  firstname: 'Benjamin',
  surname: 'List',
  motivation: '"for the development of asymmetric organocatalysis"'
}
---Found---
{
  firstname: 'David',
  surname: 'MacMillan',
  motivation: '"for the development of asymmetric organocatalysis"'
}
Query duration 8 ms
```
### Full Scan

`PATH [{'year':'1901'}, {'category':'medicine'}, {'laureates':'*'}]`

`SELECT ['surname', 'firstname', 'motivation']`

__Chunky__ (WIP, home grown `chunking-storage`, w/ fastcdc chunker)

---Found---
{
  firstname: 'Emil',
  surname: 'von Behring',
  motivation: '"for his work on serum therapy, especially its application against diphtheria, by which he has opened a new road in the domain of medical science and thereby placed in the hands of the physician a victorious weapon against illness and deaths"'
}
Query duration 4 ms

//fastcdc config
const minSize = 1024 * 64
const avgSize = minSize * 2
const maxSize = avgSize * 2
---


__Prolly__ 
- bf: 3

```
---Found---
{
  firstname: 'Emil',
  surname: 'von Behring',
  motivation: '"for his work on serum therapy, especially its application against diphtheria, by which he has opened a new road in the domain of medical science and thereby placed in the hands of the physician a victorious weapon against illness and deaths"'
}
Query duration 19 ms
// bf: 4 -> Query duration 13 ms
```

__Hamt__ 
- bitWidth: 4, 
- bucketSize: 3

```
---Found---
{
  firstname: 'Emil',
  surname: 'von Behring',
  motivation: '"for his work on serum therapy, especially its application against diphtheria, by which he has opened a new road in the domain of medical science and thereby placed in the hands of the physician a victorious weapon against illness and deaths"'
}
Query duration 112 ms
```

__Vector__
- width: 4

```
---Found---
{
  firstname: 'Emil',
  surname: 'von Behring',
  motivation: '"for his work on serum therapy, especially its application against diphtheria, by which he has opened a new road in the domain of medical science and thereby placed in the hands of the physician a victorious weapon against illness and deaths"'
}
Query duration 80 ms
```

## Other Links
- [Immutable Asynchronous Vector](https://github.com/rvagg/iavector)
- [Immutable Asynchronous Map](https://github.com/rvagg/iamap)
- [Probabilistic B-Trees](https://github.com/attic-labs/noms/blob/master/doc/intro.md#prolly-trees-probabilistic-b-trees)
- [How Dolt Stores Table Data](https://www.dolthub.com/blog/2020-04-01-how-dolt-stores-table-data/)
- [Optimizing Hash-Array Mapped Tries](https://michael.steindorfer.name/publications/oopsla15.pdf)