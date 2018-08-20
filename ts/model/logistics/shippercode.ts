import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"

const [schema, table] = ["logistics", "shipper"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        shippercode: DataTypes.CHAR(64),
        shippername: DataTypes.CHAR(64),
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}


export async function getShipperName(shippercode: string) {
    let res = await getModel(modelName).findOne({ where: { shippercode: shippercode } })
    return res ? res.get() : undefined
}

export async function getByShipperName(shippername: string) {
    let res = await getModel(modelName).findOne({ where: { shippername: shippername } })
    return res ? res.get() : undefined
}

export async function getShipper(sequelize: Sequelize) {
    let res = await sequelize.query(`select * from logistics.shipper s order by s.shippercode asc`, { type: "select" }) as any[]
    return res
}
