import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["ads", "crmuser"]

const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        username: DataTypes.CHAR(128),
        password: DataTypes.CHAR(128),
        description: DataTypes.TEXT,
        state: DataTypes.ENUM("on", "off"),
        role: DataTypes.CHAR(24),
        perm: DataTypes.JSONB,
        phone: DataTypes.CHAR(24),
        email: DataTypes.CHAR(64),
        realname: DataTypes.CHAR(64),
        address: DataTypes.TEXT,
        mgruuids: DataTypes.ARRAY(DataTypes.UUID),
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

//新添加
export async function findBymgruuids(uuid: string) {
    let res = await getModel(modelName).findOne({ where: {uuid: uuid } })
    return res ? res.get() : undefined
}


export async function findByUsername(username: string) {
    let res = await getModel(modelName).findOne({ where: { username: username, $or: [{ state: 'on' }, { state: null }] } })
    return res ? res.get() : undefined
}

//新添加
export async function findByAppUsername(username: string) {
    let res = await getModel("users.users").findOne({ where: { username: username, $or: [{ state: 'on' }, { state: null }] } })
    return res ? res.get() : undefined
}

export async function findByPassword(password: string, uuid: string) {
    let res = await getModel(modelName).findOne({ where: { password: password, uuid: uuid } })
    return res ? res.get() : undefined
}

export async function modifiedPassword(password: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ password: password }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByUsernames(username: string) {
    let res = await getModel(modelName).findOne({ where: { username: username } })
    return res ? res.get() : undefined
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } })
    return res ? res.get() : undefined
}

export async function findGoodsOW(uuid: string) {
    let res = await getModel(modelName).findAll({ where: { uuid: uuid } })
    return res.map(r => r.get())
}

export async function insertCrmUser(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res ? res.get() : undefined
}

export async function new_insertCrmUser(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res ? res.get() : undefined
}

export async function getCount(obj: any) {
    let res = await getModel(modelName).count({ where: obj })
    return res
}

export async function findAll(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { $or: [{ state: 'on' }, { state: 'off' }] }, order: [['created', "DESC"]], offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function findMallUserInfo(cursor: number, limit: number, searchdata: string) {
    let res = await getModel(modelName).findAll({
        // attributes: ["uuid", "username", "state", "phone", "perm", "mgruuids"],
        where: {
            $or: [{ perm: { "couponRW": 1 } }],
            state: { $in: ['on', 'off'] },
            $and: { $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }] }
        },
        order: [['created', "DESC"]], offset: cursor, limit: limit
    })
    return res.map(r => r.get())
}

export async function findUserInfo(cursor: number, limit: number, searchdata: string) {
    let res = await getModel(modelName).findAll({
        // attributes: ["uuid", "username", "state", "phone", "perm", "mgruuids"],
        where: {
            $or: [{ perm: { "adsRO": 1 } }, { perm: { "adsRW": 1 } }, { perm: { "adminRW": 1 } }, { perm: { "adminRO": 1 } }],
            state: { $in: ['on', 'off'] },
            $and: { $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }] }
        },
        order: [['created', "DESC"]], offset: cursor, limit: limit
    })
    return res.map(r => r.get())
}

export async function findMallCount(searchdata: string) {
    let res = await getModel(modelName).count({
        where: {
            $or: [{ perm: { "goodsRW": 1 } }, { perm: { "goodsRO": 1 } }, { perm: { "coupon": 1 } }],
            state: { $in: ['on', 'off'] },
            $and: { $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }] }
        }
    })
    return res
}

export async function findCount(searchdata: string) {
    let res = await getModel(modelName).count({
        where: {
            $or: [{ perm: { "adsRO": 1 } }, { perm: { "adsRW": 1 } }, { perm: { "adminRW": 1 } }, { perm: { "adminRO": 1 } }],
            state: { $in: ['on', 'off'] },
            $and: { $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }] }
        }
    })
    return res
}

export async function findAdminrwUserInfo(cursor: number, limit: number, searchdata: string) {
    let res = await getModel(modelName).findAll({
        where: {
            perm: { "adminRW": 1 },
            state: { $in: ['on', 'off'] },
            $and: { $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }] }
        },
        order: [['created', "DESC"]], offset: cursor, limit: limit
    })
    return res.map(r => r.get())
}

export async function findGoodsOWUserInfo(cursor: number, limit: number, searchdata: string) {
    let res = await getModel(modelName).findAll({
        where: {
            state: { $in: ['on', 'off'] },
            $or: [{ perm: { "goodsRO": 1 } }, { perm: { "goodsRW": 1 } }],
            $and: { $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }] }
        },
        order: [['created', "DESC"]], offset: cursor, limit: limit
    })
    return res.map(r => r.get())
}

export async function findAdminrwCount(searchdata: string) {
    let res = await getModel(modelName).count({
        where: {
            perm: { "adminRW": 1 },
            state: { $in: ['on', 'off'] },
            $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }]
        }
    })
    return res
}

export async function findGoodsOWCount(searchdata: string) {
    let res = await getModel(modelName).count({
        where: {
            state: { $in: ['on', 'off'] },
            $or: [{ perm: { "goodsRO": 1 } }, { perm: { "goodsRW": 1 } }],
            $and: { $or: [{ username: { $like: '%' + searchdata + '%' } }, { phone: { $like: '%' + searchdata + '%' } }] }
        }
    })
    return res
}

export async function resetPassword(useruuid: string, password: string) {
    let [number, res] = await getModel(modelName).update({ password: password }, { where: { uuid: useruuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function resetState(useruuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: useruuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function inserMgruuids(uuid: string, mgruuids: any) {
    let [number, res] = await getModel(modelName).update({ mgruuids: mgruuids }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateperm(uuid: string, perm: any) {
    let [number, res] = await getModel(modelName).update({ perm: perm }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function deleteCrmuser(useruuid: string) {
    await getModel(modelName).destroy({ where: { uuid: useruuid } })
}

export async function queryCrmuser(crmuuid:string){
    let res = await getModel(modelName).findOne({where :{uuid:crmuuid}});
    return res.get('mgruuids') ? res.get('mgruuids') : null;
}


export async function queryadvByuuid(crmuuid:string){
    let res = await getModel(modelName).findOne({where:{uuid:crmuuid}});
    return res ?  res : undefined;
}


//新添加
export async function findadv_ByPrimary(uuid: string) {
    let res = await getModel('ads.advertiser').findByPrimary(uuid)
    return res ? res.get() : undefined
}