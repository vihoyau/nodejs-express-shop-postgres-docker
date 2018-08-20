import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.category"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        name: DataTypes.CHAR(64),
        parent: DataTypes.UUID,
        pic: DataTypes.TEXT,
        position: DataTypes.INTEGER,
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "category",
        })
}

export async function getCategory() {
    let res = await getModel(modelName).findAll({ where: { parent: null, name: { $notIn: ['查看所有', '优惠券', '推荐'] } }, order: [["position", "asc"]] })
    return res.map(r => r.get())
}

export async function getSubcategory(parentUuid: string) {
    let res = await getModel(modelName).findAll({ where: { parent: parentUuid }, order: [['position', 'asc']] })
    return res.map(r => r.get())
}

export async function getSubcategory2(parentUuid: string, cursor: any, limit: any) {
    let res = await getModel(modelName).findAll({
        where: { parent: parentUuid }, order: [['position', 'asc']],
        offset: cursor, limit: limit
    })
    return res.map(r => r.get())
}

function getFormatStr(s: string) {
    return s ? s : null
}

export async function insert(typeName: string, parentUuid: string, position: number) {
    return await getModel(modelName).create({ name: typeName, parent: getFormatStr(parentUuid), position })
}

export async function updatePositon(uuid: string, position: number) {
    let [num, res] = await getModel(modelName).update({ position }, { where: { uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

export async function getByName(typeName: string) {
    let res = await getModel(modelName).find({ where: { name: typeName } })
    return res ? res.get() : undefined
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function modifilyPic(uuid: string, pic: any) {
    let [number, res] = await getModel(modelName).update({ pic: pic }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateNameAndPositon(name: string, position: number, uuid: string) {
    let [number, res] = await getModel(modelName).update({ name, position }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updatePic(pic: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ pic: pic }, { where: { uuid: uuid } })
    return number > 0 ? res[0].get() : undefined
}

export async function deleteCategory(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function deleteSubCategory(parent: string) {
    await getModel(modelName).destroy({ where: { parent: parent } })
}

export async function updateOrder(uuid: string, position: number) {
    let [number, res] = await getModel(modelName).update({ position: position }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//
export async function getsearchAll(name: string) {
    let res = await getModel(modelName).findOne({ where: { name: name } })
    return res ? res.get() : undefined
}