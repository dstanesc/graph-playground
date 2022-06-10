import nobel from './nobel.js'

//https://api.nobelprize.org/v1/prize.json
const createLargerGraph = async (gw) => {

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
            await root.addRlshp(gw, "year", year)
        }
        let category
        if (yearCategories.has(prize.year + '_' + prize.category)) {
            category = yearCategories.get(prize.year + '_' + prize.category)
        } else {
            category = gw.addNode(prize.category)
            yearCategories.set(prize.year + '_' + prize.category, category)
            await year.addRlshp(gw, 'category', category)
        }
        if (prize.laureates !== undefined) {
            for (const l of prize.laureates) {
                const laureate = gw.addNode(l.id)
                await laureate.addProp(gw, 'firstname', l.firstname)
                await laureate.addProp(gw, 'surname', l.surname)
                await laureate.addProp(gw, 'motivation', l.motivation)
                await category.addRlshp(gw, 'laureates', laureate)
            }
        }
    }
}

const updateLargerGraph = async (root, gw) => {
    const y2022 = gw.addNode("2022")
    const peace = gw.addNode("peace")
    const laureate = gw.addNode("3030")
    await laureate.addProp(gw, 'firstname', 'undisclosed')
    await laureate.addProp(gw, 'surname', 'undisclosed')
    await peace.addRlshp(gw, 'laureates', laureate)
    await y2022.addRlshp(gw, 'category', peace)
    await root.addRlshp(gw, 'year', y2022)
}

export { createLargerGraph, updateLargerGraph } 