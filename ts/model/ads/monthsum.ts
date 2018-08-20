import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["ads", "monthsum"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        advertiseruuid: DataTypes.UUID,    //广告商uuid
        date: DataTypes.STRING, //日期，格式：YYYY-MM
        points: DataTypes.INTEGER,  //点击量
        show: DataTypes.INTEGER, //展示量
        consume: DataTypes.FLOAT,    //消费
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

//插入一条记录
export async function insertMonthSum(obj: any) {
    let re = await getModel(modelName).create(obj)
    return re ? re : undefined
}

//找这个广告商某天的汇总记录
export async function findByMonthAndUUID(date: string, advertiseruuid: string) {
    let res = await getModel(modelName).findOne({ where: { date, advertiseruuid } })
    return res ? res.get() : undefined
}