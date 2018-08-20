import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.inviterul"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        content: DataTypes.TEXT,
        tsrange: DataTypes.CHAR(36),
        invitepoint: DataTypes.INTEGER,
        parentinvitepoint: DataTypes.INTEGER,
        invitebalance: DataTypes.INTEGER,
        parentinvitebalance: DataTypes.INTEGER
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "inviterul"
        })
}


export async function updateInviteRule(inviterul: any) {
    let [number, res] = await getModel(modelName).update(inviterul, { where: {}, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function getInviteRule(sequelize: Sequelize) {
    let res = await sequelize.query(`select * from ads.inviterul`, { type: "select" }) as any[]
    return res[0]
}