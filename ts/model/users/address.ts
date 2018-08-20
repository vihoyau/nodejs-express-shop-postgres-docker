import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "users.address"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {                                 // UUID
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,               // 对应的用户UUID
        address: DataTypes.TEXT,                // 常用收货地址管理	每个最多可预设5个收货地址
        contact: DataTypes.CHAR(36),            // 联系人
        phone: DataTypes.CHAR(20),              // 联系电话
        defaul: DataTypes.ENUM("yes", "no"),   // 默认地址：yes-是的 no-不是
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "users",
            freezeTableName: true,
            tableName: "address",
        })
}

export async function createAddress(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res.get()
}

export async function updatedefaul(useruuid: string) {
    let [number, res] = await getModel(modelName).update({ defaul: "no" }, { where: { useruuid: useruuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function getCount(useruuid: string) {
    return await getModel(modelName).count({ where: { useruuid: useruuid } })
}

export async function deleteAddress(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function updateAddress(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByUuid(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res.get()
}

export async function findByUseruuid(useruuid: string) {
    let res = await getModel(modelName).findAll({ where: { useruuid: useruuid }, order: [['created', 'desc']] })
    return res.map(r => r.get())
}

export async function updateState(seqz: Sequelize, useruuid: string, uuid: string) {
    await seqz.transaction(async t => {
        await getModel(modelName).update({ defaul: "no" }, { where: { useruuid: useruuid, defaul: "yes" }, transaction: t })
        let [number, res] = await getModel(modelName).update({ defaul: "yes" }, { where: { uuid: uuid }, transaction: t, returning: true })
        return number > 0 ? res[0].get() : undefined
    })
}

export async function getDefaultAddress(useruuid: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, defaul: 'yes' } })
    return res ? res.get() : undefined
}