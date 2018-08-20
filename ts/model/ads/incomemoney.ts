import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
//import logger = require("winston")

const [schema, table] = ["ads", "incomemoney"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
  return sequelize.define(modelName, {
    uuid: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    useruuid: DataTypes.UUID,
    money: DataTypes.INTEGER,
    method: DataTypes.TEXT,
    created: DataTypes.TIME
  }, {
      timestamps: false,
      schema: schema,
      freezeTableName: true,
      tableName: table,
    })
}

//查看ads.incomemoney表的单个记录
export async function find_one_incomemoney(useruuid: string) {
  let res = await getModel(modelName).findAll({ where: { useruuid: useruuid } }) as any[]
  return res ? res.map(r => r.get()) : undefined
}

//查看ads.incomemoney表的单个记录
/* export async function find_oneadv_incomemoney(useruuid: string) {
  let res = await getModel(modelName).findOne({ where: { useruuid: useruuid } }) 
  return res ? res.get() : undefined
} */

//更新ads.incomemoney表的单个记录
/* export async function updateexp(uuid: string, exp: number) {
  let [number, res] = await getModel(modelName).update({ exp: exp }, { where: { uuid: uuid }, returning: true })
  return number > 0 ? res[0].get() : undefined
} */

//创建单个记录
export async function create_one_incomemoney(incomemoney: any) {
  try {
    console.log(incomemoney)
    let res = await getModel(modelName).create(incomemoney, { returning: true })
    return res ? res.get() : undefined
  } catch (e) {
    //console.log(1111111)
    throw new Error(e)
  }

}