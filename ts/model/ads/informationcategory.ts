import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.informationcategory"

/**
 *
 * "uuid" uuid NOT NULL,
"name" text COLLATE "default",
"parent" text COLLATE "default",
"pic" text COLLATE "default",
"position" int4,
 */
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        name: {
            type: DataTypes.TEXT,
            unique: true
        },   //名字
        pic: DataTypes.TEXT,    //图片url
        position: DataTypes.INTEGER, //排序
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "informationcategory",
        })
}

export async function createInfoCate(obj: any) {
    return await getModel(modelName).create(obj)
}

export async function delInfoCate(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid } })
}

export async function updateInfoCate(uuid: any, obj: any) {
    let [num, arr] = await getModel(modelName).update(obj, { where: { uuid }, returning: true })
    return num > 0 ? arr[0] : undefined
}

export async function getAllInfoCate() {
    let arr = await getModel(modelName).findAll({ order: [['created', 'asc']] })
    return arr.map(r => r.get())
}
