
export function sleep(ms: number) {
    return new Promise(resove => setTimeout(resove, ms))
}
/*
export async function test() {
    let seqz = new Sequelize(pgOpt.database, pgOpt.username, pgOpt.password, pgOpt.options as Options)

    getModel(seqz, "mall", "category")
    let Category = seqz.model("mall.category")

    let user = await Category.findOne()
    console.log(user.get("name"))

    let res = await seqz.query("select * from mall.category", { model: Category }) as any[]
    res.forEach(r => console.log(r.get("name")))

    let ct = await Category.findOne()
    res = await seqz.transaction(t => {
        return ct.updateAttributes({ name: "xxx2" }, { transaction: t })
    })
    // console.log(res)
    console.log("----------------------")
}
*/

export function shuffle(input: any[]) {
    for (let i = input.length - 1; i >= 0; i--) {
        let randomIndex = Math.floor(Math.random() * (i + 1))
        let itemAtIndex = input[randomIndex]
        input[randomIndex] = input[i]
        input[i] = itemAtIndex
    }
    return input
}





