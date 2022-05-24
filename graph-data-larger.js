import bent from 'bent'
import { GraphWriter, GraphInspector } from './graph.js'
import nobel  from './nobel.js'

//https://api.nobelprize.org/v1/prize.json
const createLargerGraph = () => {
    const gw = new GraphWriter()
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
            root.addRlshp(year)
        }
        let category
        if (yearCategories.has(prize.year + '_' + prize.category)) {
            category = yearCategories.get(prize.year + '_' + prize.category)
        } else {
            category = gw.addNode(prize.category)
            yearCategories.set(prize.year + '_' + prize.category, category)
            year.addRlshp(category)
        }
        const laureates = gw.addNode('laureates')
        category.addRlshp(laureates)
        if (prize.laureates !== undefined) {
            for (const l of prize.laureates) {
                const laureate = gw.addNode(l.id)
                laureate.addProp('firstname', l.firstname).addProp('surname', l.surname).addProp('motivation', l.motivation)
                laureates.addRlshp(laureate)
            }
        }
        root.addRlshp(year)
    }
    return gw
}

const updateLargerGraph = (gw) => {
    const root = gw.getRoot();
    const y2022 = gw.addNode("2022")
    const peace = gw.addNode("peace")
    const laureates = gw.addNode("laureates")
    const laureate = gw.addNode("3030")
    laureate.addProp('firstname', 'undisclosed').addProp('surname', 'undisclosed')
    laureates.addRlshp(laureate)
    peace.addRlshp(laureates)
    y2022.addRlshp(peace)
    root.addRlshp(y2022)
    return gw
}

export { createLargerGraph, updateLargerGraph } 