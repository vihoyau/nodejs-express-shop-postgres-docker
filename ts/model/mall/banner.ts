import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.banner" 
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        pic: DataTypes.TEXT,
        url: DataTypes.TEXT,
        state: DataTypes.ENUM("on", "off"),
        content: DataTypes.TEXT,
        description: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        position: DataTypes.INTEGER,
        externalurl: DataTypes.ENUM("true", "false"),
        modified: DataTypes.TIME,
        created: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "banner"
        })
}

export async function getBanner(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: { state: 'on' },
        order: [['position', 'ASC'], ['modified', 'DESC']],
        limit: limit,
        offset: cursor
    })
    return res.map(r => r.get())
}

export async function getBanners() {
    let res = await getModel(modelName).findAll({
        where: { state: 'on' },
        order: [['position', 'ASC'], ['modified', 'DESC']],
    })
    return res.map(r => r.get())
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res : undefined
}

export async function getCount(obj: any) {
    let res = await getModel(modelName).count({ where: obj })
    return res
}

export async function getBannerAll(obj: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: obj,
        order: [['position', 'ASC'], ['modified', 'DESC']],
        limit: limit,
        offset: cursor
    })
    return res.map(r => r.get())
}

export async function deleteByuuid(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function insertBanner() {
    let res = await getModel(modelName).create({ returning: true })
    return res ? res.get() : undefined
}

export async function update(banner: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(banner, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updatePosition(seqz: Sequelize, position: string, uuid: string) {
    return await seqz.transaction(async t => {
        let goods = await getModel(modelName).findOne({ where: { state: 'on', position: position }, transaction: t })
        let goods1 = await getModel(modelName).findByPrimary(uuid, { transaction: t })
        await getModel(modelName).update({ position: goods1.get("position") }, { where: { uuid: goods.get("uuid") }, transaction: t, returning: true })
        let [number, res] = await getModel(modelName).update({ position: position }, { where: { uuid: uuid }, transaction: t, returning: true })
        return number > 0 ? res[0].get() : undefined
    })
}

export async function updateUrl(url: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ url: url }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updatePic(pic: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ pic: pic }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateContent(content: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ content: content }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
