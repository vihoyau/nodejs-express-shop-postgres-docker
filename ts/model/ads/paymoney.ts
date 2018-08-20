import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"


const modelName = "ads.paymoney"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid:{
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid:DataTypes.UUID,
        method:DataTypes.STRING,
        money:DataTypes.INTEGER,
        created:DataTypes.DATE
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "paymoney",
        })
}
export async function insertpaymoney( useruuid: string, money: number, created: Date,method:string) {
    let re = await getModel(modelName).create({useruuid:useruuid,money: money, created: created,method:method});
    return re ? re : undefined;
}
