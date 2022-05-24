import bent from 'bent'
import { Graph, GraphInspector } from './graph.js'
import json  from './prize.js'

const createLargerGraph = () => {
    const g1 = new Graph()
    const root = g1.createNode("root")
    const years = new Map()
    const yearCategories = new Map()
    for (const prize of json.prizes) {
        //console.log(`${prize.year}:${prize.category}`)
        let year
        if (years.has(prize.year)) {
            year = years.get(prize.year)
        } else {
            year = g1.createNode(prize.year)
            years.set(prize.year, year)
            root.addRlshp(year)
        }
        let category
        if (yearCategories.has(prize.year + '_' + prize.category)) {
            category = yearCategories.get(prize.year + '_' + prize.category)
        } else {
            category = g1.createNode(prize.category)
            yearCategories.set(prize.year + '_' + prize.category, category)
            year.addRlshp(category)
        }
        const laureates = g1.createNode('laureates')
        category.addRlshp(laureates)
        if (prize.laureates !== undefined) {
            for (const l of prize.laureates) {
                const laureate = g1.createNode(l.id)
                laureate.addProp('firstname', l.firstname).addProp('surname', l.surname)
                laureates.addRlshp(laureate)
            }
        }
        root.addRlshp(year)
    }
    return g1
}

const updateLargerGraph = (g1) => {
    const root = g1.getRoot();
    const y2022 = g1.createNode("2022")
    const peace = g1.createNode("peace")
    const laureates = g1.createNode("laureates")
    const laureate = g1.createNode("3030")
    laureate.addProp('firstname', 'undisclosed').addProp('surname', 'undisclosed')
    laureates.addRlshp(laureate)
    peace.addRlshp(laureates)
    y2022.addRlshp(peace)
    root.addRlshp(y2022)
    return g1
}

export { createLargerGraph, updateLargerGraph } 