import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"


const modelName = "puton.unit"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid:{
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        planuuid:DataTypes.UUID,
        name:DataTypes.TEXT,
        mode:DataTypes.INTEGER,
        area:DataTypes.TEXT,
        sex:DataTypes.INTEGER,
        age:DataTypes.JSONB,
        method:DataTypes.TEXT,
        status:DataTypes.INTEGER,
        bid:DataTypes.DOUBLE,
        cpe_type:DataTypes.INTEGER //0展示 1点击
    },{
        timestamps: false,
        schema: "puton",
        freezeTableName: true,
        tableName: "unit",
    })
}
export async function insertunit(unit :any){
    return await getModel(modelName).create(unit,{returning:true});
}


export async function queryunit(planuuid:string){
    let res = await getModel(modelName).findAll({where:{planuuid:planuuid}});
    return res  ;
}


export async function queryunitone(unituuid:string){
    let res = await getModel(modelName).findOne({where:{uuid:unituuid}});
    return res ? res.get() : undefined;
}

/**
 * 
 * @param unit 单元名称，推广方式，投放地域，性别，年龄，计费方式，出价
 */
export async function updateunit(unit:any){
    let [num, res] = await getModel(modelName).update({name:unit.name,mode:unit.mode,area:unit.area,sex:unit.sex,age:unit.age,method:unit.method,bid:unit.bid},{where:{uuid:unit.unituuid},returning:true});
    return num>0 ? res : undefined;
}

export async function queryunitAll(searchdata:string,sequelize :Sequelize ,planuuid:any[]){
    if(planuuid!=undefined&&planuuid.length!=0){
        let stringPlans = " (";
        for(let i=0;i<planuuid.length;i++){
            stringPlans = stringPlans+ "'"+planuuid[i].uuid+"'";
            if(i!=planuuid.length-1){
                stringPlans = stringPlans + ","
            }
        }
        stringPlans = stringPlans +")";
        let res = await sequelize.query(`select * from puton.unit where planuuid in ${stringPlans} and name like '%${searchdata}%'`,{type:'select'});
        //getModel(modelName).findAll({where:{planuuid:planuuid}});
        return res ? res:undefined;
    }else{
        return undefined;
    }
    
    
}
export async function queryunitAllBypage(start:number,length:number,planuuid: string){
        let res = await getModel(modelName).findAll({where:{planuuid:planuuid},offset:start,limit:length});
        return res ? res.map(r=>
            r.get()
        ) : undefined;
}

export async function queryunitAllcount(sequelize:Sequelize,planuuid:string){
         let re = await sequelize.query(`select count(*) as count from puton.unit where planuuid = '${planuuid}'`,{type:'select'});
         return re ? re: undefined;
}

export async function updateunitstatus(planuuid:string,status:number){
    let [number,res] = await getModel(modelName).update({status:status},{where:{uuid:planuuid},returning:true});
    return number>0 ? res:undefined
}

export async function queryplanByunituuid(sequelize:Sequelize,unituuid:string){
    let res = await sequelize.query(`select plan.* from puton.plan as plan ,puton.unit as unit where unit.planuuid = plan.uuid and unit.uuid= '${unituuid}'`,{type:'select'});
    return res ? res : undefined
}

export async function delelteunitByuuid(sequelize : Sequelize ,unituuid:string){
    await sequelize.query(`delete from puton.unit where uuid = '${unituuid}'`,{type:'delete'});
}

export async function queryunitByplan(planuuid: string) {
    let re = await getModel(modelName).findAll({ where: { planuuid: planuuid } });
    return re ? re.map(r => r.get()) : undefined
}

export async function queryunitByuuids(sequelize:Sequelize ,unituuids:any[]){
    if(unituuids!=undefined&&unituuids.length!=0){
        let stringUuids = "(";
        for(let i =0;i<unituuids.length;i++){
            stringUuids = stringUuids +"'" + unituuids[i].unituuid+ "'";
            if(i!=unituuids.length-1){
                stringUuids = stringUuids + "," 
            }
        }
        stringUuids = stringUuids + ")";
        let unit = await sequelize.query(`select * from puton.unit where uuid in ${stringUuids}`,{type:'select'});
        return unit ? unit:undefined;
    }else{
        let unit = await sequelize.query(`select * from puton.unit `,{type:'select'});
        return unit ? unit:undefined;
    }
}

export async function queryunitByadsuuid(sequelize:Sequelize,adsuuid:string){
    let res =  await sequelize.query(`select * from ads.ads as ads ,puton.unit as unit where ads.unituuid = unit.uuid and ads.uuid = '${adsuuid}'`,{type:"select"});
    return res.length!=0? res[0]:undefined;
}


export async function findAllunitByplanuuid(planuuid:string){
    let res = await getModel(modelName).findAll({where:{planuuid:planuuid}});
    return res ? res.map(r=>r.get()) : undefined;
}

export async function findAllunitByplanuuids(sequelize :Sequelize,planuuids:any[]){
    if(planuuids!=undefined&&planuuids.length!=0){
        let planStr = "(";
        for(let i = 0;i<planuuids.length;i++){
            planStr = planStr + "'" + planuuids[i].uuid + "'";
            if((planuuids.length-1)!=i){
                planStr = planStr +","
            }
        }
        planStr = planStr + ")";
        let res = sequelize.query(`select * from puton.unit where planuuid in ${planStr}`,{type:'select'});
        return res
    }else{
        return [];
    }
}

export async function findunitByplanuuid(planuuid:string){
    let res = await getModel(modelName).findAll({where:{planuuid:planuuid}});
    return res ? res.map(r=>r.get()):[];
}
export async function updateunitStatusByplanuuid(planuuid:string){
    let [number,res] = await getModel(modelName).update({status:'0'},{where:{planuuid:planuuid},returning:true});
    return number>0 ?res.map(r=>r.get()):[]; 
}