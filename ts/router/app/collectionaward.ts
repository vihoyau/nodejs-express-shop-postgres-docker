import { DataTypes, Sequelize } from "sequelize"
import { Router} from "express"
import { getModel } from "../../lib/global"
export const router = Router()
const modelName = "mall.collectionaward"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        fortune: DataTypes.JSONB,//¸£
        emolument: DataTypes.JSONB,//Â»
        longevity: DataTypes.JSONB,//ÊÙ
        property: DataTypes.JSONB,//²Æ
        happiness: DataTypes.JSONB,//Ï²
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "collectionaward"
        })
}

export async function awardcollection(addcollections: any) {
    try {
        console.log(addcollections)
        let res = await getModel(modelName).create(addcollections, { returning: true })
        return res ? res.get() : undefined
    } catch (e) {
        throw new Error(e)
    }

}
// export async function awardcollection(addcollections: any,uuid:any) {
//     try {
//         let res = await getModel(modelName).update(addcollections, { where: { uuid: uuid }, returning: true })
//         return res 
//     } catch (e) {
//         throw new Error(e)
//     }

// }
export async function find_All_award() {
    let res = await getModel(modelName).findAll() as any[]
    return res 
}
export async function deleteAward() {
    await getModel(modelName).destroy()
}