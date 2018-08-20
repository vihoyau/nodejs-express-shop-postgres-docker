import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"


const [schema, table] = ["ads", "advertiser"]
const modelName = `${schema}.${table}`

/* export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        company: DataTypes.CHAR(128),
        contacts: DataTypes.CHAR(128),
        phone: DataTypes.CHAR(24),
        licence: DataTypes.TEXT,
        state: DataTypes.ENUM('on', 'off'),
        address: DataTypes.TEXT,
        description: DataTypes.TEXT,
        points: DataTypes.INTEGER,
        totalpoints: DataTypes.INTEGER,
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
} */
//新添加0922
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        contacts: DataTypes.CHAR(128),
        description: DataTypes.TEXT,
        phone: DataTypes.CHAR(24),
        imgarr:DataTypes.ARRAY(DataTypes.TEXT) ,        //Text[]
        state: DataTypes.ENUM('on', 'off'),
        address: DataTypes.TEXT,
        points: DataTypes.INTEGER,
        totalpoints: DataTypes.INTEGER,
        qq:DataTypes.CHAR(20),
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
        zipcode:DataTypes.CHAR(30),
        email:DataTypes.CHAR(30),
        types:DataTypes.INTEGER,     //smallint
        company: DataTypes.CHAR(128),
        websitename:DataTypes.CHAR(24), 
        websiteaddr:DataTypes.CHAR(30),
        licence: DataTypes.TEXT,
        idcard : DataTypes.CHAR(18),
        ext: DataTypes.JSONB,
        //审核状态
        audit : DataTypes.INTEGER, 
        //备注             
        remark : DataTypes.CHAR(30),
        crmuuid : DataTypes.UUIDV4,
        dailybudget:DataTypes.DOUBLE,
        tempdailybudget:DataTypes.DOUBLE,
        rent: DataTypes.INTEGER

    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function findByCompany(company: string) {
    let res = await getModel(modelName).find({ where: { company: company } })
    return res ? res.get() : undefined
}

export async function getCount(searchdata:string,advertiseruuid?:string) {
    if(advertiseruuid==undefined){
        let res = await getModel(modelName).count({ where: {$or:[
            { company: { $like: '%' + searchdata + '%' } },
            { contacts: { $like: '%' + searchdata + '%' } }
        ],state:'on'} })
        return res
    }else{
        let res = await getModel(modelName).count({ where: {$or:[
            { company: { $like: '%' + searchdata + '%' } },
            { contacts: { $like: '%' + searchdata + '%' } }
        ],uuid:advertiseruuid} })
        return res
    }
    
}

export async function listAdvertiser() {
    let res = await getModel(modelName).findAll({ attributes: ["uuid", "company"] }) as any[]
    return res ? res.map(r => r.get()) : undefined
}

//新添加的查询广告商的全部记录 包括：待审核 审核通过 审核不通过的全部信息
export async function listallAdvertiser() {
    let res = await getModel(modelName).findAll() as any[]
    return res ? res.map(r => r.get()) : undefined
}


export async function findAdvInfo(obj: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj, attributes: ["uuid", "contacts", "phone", "address", "company"], order: [['created', "DESC"]], offset: cursor, limit: limit }) as any[]
    return res.map(r => r.get())
}

//查看广告商公司名的信息
export async function findAdv_company_Info() {
    let res = await getModel(modelName).findAll({ attributes:[ "company"]}) as any[]
    return res.map(r => r.get())
}

//新添加的查询广告商的信息      audit : 0 待审核列表
export async function new_findAdvInfo() {
    let res = await getModel(modelName).findAll({ where: {audit : 0} }) as any[]   //待审核的信息
    return res.map(r => r.get())
}

//新添加的adminRW和adminRO的查询广告商的信息      audit : 0 待审核列表
export async function find_perm_AdvInfo(uuid:string) {
    let res = await getModel(modelName).findOne({where:{uuid:uuid,audit:0}});
    return res ? res.get() : undefined
}

//新添加:通过crmuuid查询广告商的记录
export async function find_AdvInfo_by_crmuuid(crmuuid:string) {
    let res = await getModel(modelName).findOne({where:{crmuuid:crmuuid}});
    return res ? res.get() : undefined
}

export async function addAdvertiser(advertiser: any) {
    try {
        console.log(advertiser)
        let res = await getModel(modelName).create(advertiser, { returning: true })
        return res ? res.get() : undefined
    } catch (e) {
        console.log(1111111)
        throw new Error(e)
    }

}

//在where的条件下，update字段point,returning为update的返回值,因为更新的是整个数组，所以res[0].get为取得数组第一个元素
export async function modifyPoint(uuid: string, points: string) {
    let [number, res] = await getModel(modelName).update({ points: points }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//新添加  修改audit审核字段的状态
export async function modifyAudit(uuid: string, audit: string) {
    let [number, res] = await getModel(modelName).update({ audit: audit },{ where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//新添加  修改remark备注字段的状态
export async function modifyRemark(uuid: string, remark: string) {
    let [number, res] = await getModel(modelName).update({ remark: remark },{ where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//新添加  修改balance总余额字段的状态
export async function modifybalance(uuid: string, balance: string) {
    let [number, res] = await getModel(modelName).update({ balance: balance },{ where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//新添加  修改balance_state余额状态字段的状态
export async function modifybalance_state(uuid: string, balance_state: string) {
    let [number, res] = await getModel(modelName).update({ balance_state: balance_state },{ where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByPrimary(uuid: string) {
    let res = await getModel('ads.advertiser').findByPrimary(uuid)
    return res ? res.get() : undefined
}

//新添加 查找users_ext的全部信息
export async function find_users_ext_table_information() {
    let res = await getModel('users.users_ext').findAll() as any[]
    return res ? res.map(r => r.get()) : undefined
}

//新添加 查找users_ext的全部信息
export async function find_one_users_ext_table_information(uuid:string) {
    let res = await getModel('users.users_ext').findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function updateAdvertiser(advertiser: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(advertiser, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}


export async function getAll(searchdata: string, cursor: number, limit: number,advertiseruuid?:string) {
    if(advertiseruuid==undefined){
        let res = await getModel(modelName).findAll({ where: {$or: [
            { company: { $like: '%' + searchdata + '%' } },
            { contacts: { $like: '%' + searchdata + '%' } },
            { phone: {$like:'%' + searchdata + '%'}}
        ]/* ,state:'on' */}, offset: cursor, limit: limit }) as any[]
        return res.map(r => r.get())
    }else{
        let res = await getModel(modelName).findAll({ where: {$or: [
            { company: { $like: '%' + searchdata + '%' } },
            { contacts: { $like: '%' + searchdata + '%' } },
            { phone: {$like:'%' + searchdata + '%'}}
        ],uuid:advertiseruuid/* ,state:'on' */}, offset: cursor, limit: limit }) as any[]
        return res.map(r => r.get())
    }
    
}

export async function findoneBycrmuuid(crmuuid:string){
    let res = await getModel(modelName).findOne({where:{crmuuid:crmuuid}});
    return res ? res.get() : undefined
}

export async function findAlladvertiser(){
    let res = await getModel(modelName).findAll();
    return res ? res.map(r=>r.get()):[];
}

export async function finddailybudgetByuuid(uuid:string){
    let advertiser = await getModel(modelName).findOne({where:{uuid:uuid}});
    return advertiser.get();
}


export async function updatedailybudget(){
    getModel(modelName).update({tempdailybudget:100},{where:{},returning:true});
}

export async function finddailybudgetisZERO(){
    let advertiser =  await getModel(modelName).findAll({where:{dailybudget:0}});
    return advertiser ? advertiser.map( r=>r.get()) :[]
}