import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.category"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        name: DataTypes.TEXT,
        parent: DataTypes.UUID,
        pic: DataTypes.TEXT,
        position: DataTypes.INTEGER
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "category"
        })
}

//
export async function getsearchAll(name: string) {
    let res = await getModel(modelName).findOne({ where: { name: name } })
    return res ? res.get() : undefined
}

export async function getCategory() {
    let res = await getModel(modelName).findAll({ where: { parent: null, name: { $notIn: ['查看所有', '优惠券'] } }, order: [["position", "asc"]] })
    return res.map(r => r.get())
}

export async function getSubcategory(parent: string) {
    let res = await getModel(modelName).findAll({ where: { parent: parent } })
    return res.map(r => r.get())
}

function getFormatStr(s: string) {
    return s ? s : null
}

export async function insert(name: string, parent: string) {
    return await getModel(modelName).create({ name: name, parent: getFormatStr(parent) })
}

export async function getByName(name: string, parent: string) {
    let res = await getModel(modelName).find({ where: { name: name, parent: getFormatStr(parent) } })
    return res ? res.get() : undefined
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function updateName(name: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ name: name }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function deleteByCategory(uuid: string) {
    return await getModel(modelName).destroy({ where: { parent: uuid } })
}

export async function deleteCategory(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function modifilyPic(uuid: string, pic: any) {
    let [ number, res] = await getModel(modelName).update({ pic: pic }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateOrder(uuid: string, position: number) {
    let [number, res] = await getModel(modelName).update({ position: position }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function querycategorypic(uuid :string ){
    let res = await getModel(modelName).findOne({where : {uuid :uuid }});
    return res.get("pic") ? res.get("pic") : null
}