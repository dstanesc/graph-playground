import bent from 'bent'
import { Graph, GraphWriter, GraphInspector } from './graph.js'
import nobel from './nobel.js'

//https://api.nobelprize.org/v1/prize.json
const createLargerGraph = (gw) => {

    const root = gw.addNode("root")
    const years = new Map()
    const yearCategories = new Map()
    for (const prize of nobel.prizes) {
        //console.log(`${prize.year}:${prize.category}`)
        let year
        if (years.has(prize.year)) {
            year = years.get(prize.year)
        } else {
            year = gw.addNode(prize.year)
            years.set(prize.year, year)
            root.addRlshp(gw, year)
        }
        let category
        if (yearCategories.has(prize.year + '_' + prize.category)) {
            category = yearCategories.get(prize.year + '_' + prize.category)
        } else {
            category = gw.addNode(prize.category)
            yearCategories.set(prize.year + '_' + prize.category, category)
            year.addRlshp(gw, category)
        }
        const laureates = gw.addNode('laureates')
        category.addRlshp(gw, laureates)
        if (prize.laureates !== undefined) {
            for (const l of prize.laureates) {
                const laureate = gw.addNode(l.id)
                laureate.addProp(gw, 'firstname', l.firstname).addProp(gw, 'surname', l.surname).addProp(gw, 'motivation', l.motivation)
                laureates.addRlshp(gw, laureate)
            }
        }
        root.addRlshp(gw, year)
    }
}

const updateLargerGraph = (root, gw) => {
    const y2022 = gw.addNode("2022")
    const peace = gw.addNode("peace")
    const laureates = gw.addNode("laureates")
    const laureate = gw.addNode("3030")
    laureate.addProp(gw, 'firstname', 'undisclosed').addProp(gw, 'surname', 'undisclosed')
    laureates.addRlshp(gw, laureate)
    peace.addRlshp(gw, laureates)
    y2022.addRlshp(gw, peace)
    root.addRlshp(gw, y2022)
}

export { createLargerGraph, updateLargerGraph } 