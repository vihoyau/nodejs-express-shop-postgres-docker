import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.invitation"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        invite: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        useruuid: DataTypes.UUID,
        phone: DataTypes.CHAR(24),
        parentinvite: DataTypes.INTEGER,
        state: DataTypes.ENUM('on', 'off'),
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "invitation",
        })
}

export async function getViews(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } })
    return res ? res.get() : undefined
}

export async function getByInvite(invite: string) {
    let res = await getModel(modelName).findOne({ where: { invite: invite } })
    return res ? res.get() : undefined
}

export async function getByUserUuid(useruuid: string) {
    let res = await getModel(modelName).findOne({ attributes: ['phone'], where: { useruuid: useruuid } })
    return res ? res.get('phone') : undefined
}

export async function updateInvitation(parentinvite: number, invite: string) {
    let [number, res] = await getModel(modelName).update({ state: 'on', parentinvite: parentinvite }, { where: { invite: invite }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function insertInvitation(useruuid: string, phone: string) {
    let res = await getModel(modelName).create({ useruuid: useruuid, phone: phone }, { returning: true })
    return res ? res.get() : undefined
}

export async function getByPhone(phone: string) {
    let res = await getModel(modelName).findOne({ where: { phone: phone } })
    return res ? res.get() : undefined
}