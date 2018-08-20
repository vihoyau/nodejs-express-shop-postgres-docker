import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "puton.controltime"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        ads_week:DataTypes.INTEGER,
        ads_hour:DataTypes.INTEGER,
        planuuids:DataTypes.JSONB
    },{
        timestamps: false,
        schema: "puton",
        freezeTableName: true,
        tableName: "controltime",
    })
}
export async function querycontroltime(sequelize:Sequelize ){
    let res = await sequelize.query(`select * from puton.controltime order by ads_week`,{type:'select'});
    return res ? res : undefined;
}

export async function updatecomtrotimeByhour(controltime:any){
    let res = await getModel(modelName).update({planuuids:controltime.planuuids},{where:{ads_week:controltime.ads_week,ads_hour:controltime.ads_hour},returning:true});
    return res? res: undefined;
}


export async function querycontroltimeByweek_hour(sequelize:Sequelize ,week:number,hour:number){
    let res = await sequelize.query(`select planuuids from puton.controltime where ads_week = ${week} and ads_hour = ${hour}`,{ type :'select'})
    return res ? res[0] : undefined;
}

export async function queryunitbycontroltime(sequelize:Sequelize ,week:number,hour:number){
    let res = await sequelize.query(`select uuid from puton.unit where planuuid::varchar in (select t.* from puton.controltime as con, jsonb_array_elements_text(planuuids) as t where ads_week = ${week} and ads_hour = ${hour})`,{ type :'select'});
    return res ? res :[];
}