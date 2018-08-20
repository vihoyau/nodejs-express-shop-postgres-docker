import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "puton.plan"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        advertiseruuid: DataTypes.UUID,
        name: DataTypes.TEXT,
        putresource: DataTypes.INTEGER,
        dailybudget: DataTypes.DOUBLE,
        startdate: DataTypes.DATE,
        enddate: DataTypes.DATE,
        period: DataTypes.JSONB,
        status: DataTypes.INTEGER
    }, {
            timestamps: false,
            schema: "puton",
            freezeTableName: true,
            tableName: "plan",
        })
}


export async function insertplan(plan: any) {
    return await getModel(modelName).create(plan, { returning: true });
}


export async function queryplanselect(advertiseruuid?: string) {
    if (!advertiseruuid) {
        let res = await getModel(modelName).findAll();
        return res ? res : undefined;
    } else {
        let res = await getModel(modelName).findAll({ where: { advertiseruuid: advertiseruuid } });
        return res ? res : undefined;
    }
}


//推广计划名称，推广资源，日预算，开始日期，结束日期，投放时间段
export async function updateplan(plan: any) {
    let [number, res] = await getModel(modelName).update({ name: plan.name, putresource: plan.putresource, dailybudget: plan.dailybudget, startdate: plan.startdate, enddate: plan.enddate, period: plan.period }, { where: { uuid: plan.planuuid }, returning: true });
    return number > 0 ? res : undefined;
}

export async function queryplanone(planuuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: planuuid } });
    return res ? res.get() : undefined;
}

export async function queryplanperiod(sequelize: Sequelize, planuuid: string) {
    let res = await sequelize.query(`select *  from puton.plan where uuid = '${planuuid}'`, { type: 'select' });
    return res ? res : undefined;
}

export async function queryplanAll(advertiseruuid?: string) {
    if (!advertiseruuid) {
        let res = await getModel(modelName).findAll();
        return res ? res.map(r => r.get()) : undefined;
    } else {
        let res = await getModel(modelName).findAll({ where: { advertiseruuid: advertiseruuid}});
        return res ? res.map(r => r.get()) : undefined;
    }
}

export async function queryplanAllBypage(searchdata:string,start:number,length:number,advertiseruuid?: string){
    if (!advertiseruuid) {
        let res = await getModel(modelName).findAll({where:{$or: [
            { name: { $like: '%' + searchdata + '%' } }
        ]},offset:start,limit:length,order:[['startdate','desc']]});
        return res ? res.map(r => r.get()) : undefined;
    } else {
        let res = await getModel(modelName).findAll({ where: { advertiseruuid: advertiseruuid,$or: [
            { name: { $like: '%' + searchdata + '%' } }
        ] },offset:start,limit:length,order:[['startdate','desc']]});
        return res ? res.map(r => r.get()) : undefined;
    }
}

export async function queryplanAllcount(sequelize:Sequelize,advertiseruuid?: string){
    if (!advertiseruuid) {
       let re = sequelize.query(`select count(*) as count from puton.plan`,{type:'select'});
       return re ? re: undefined;
    }else{
        let re = sequelize.query(`select count(*) as count from puton.plan where advertiseruuid = '${advertiseruuid}'`,{type:'select'});
        return re ? re: undefined;
    }
}


export async function updateplanstatus(planuuid:string,status:number){
    let [number,res] = await getModel(modelName).update({status:status},{where:{uuid:planuuid},returning:true});
    return number>0 ? res:undefined
}

export async function deleteplanByuuid(sequelize:Sequelize,planuuid:string){
    sequelize.query(`delete from puton.plan where uuid = '${planuuid}'`)
}

export async function findAllplanByadvertiseruuid(advertiseruuid:string){
    let plans = await getModel(modelName).findAll({where:{advertiseruuid:advertiseruuid}});
    return plans ? plans.map(r=>r.get()) : []
}

export async function queryplanByunituuid(sequelize:Sequelize,unituuid:string){
    let plan = await sequelize.query(`select puton.plan.* from puton.unit ,puton.plan where puton.unit.planuuid = puton.plan.uuid  `,{type:'select'});
    return plan?plan[0]:undefined;
}

export async function findplanBystatus1(){
   let plan = await getModel(modelName).findAll({where:{status:1}});
   return plan ?plan.map(r=>r.get()):[];
}