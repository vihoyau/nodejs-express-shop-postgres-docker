import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.adsoperation"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        adsuuid: DataTypes.UUID,
        useruuid: DataTypes.UUID,
        method: DataTypes.TEXT,
        created: DataTypes.DATE
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "adsoperation",
        })
}


export async function insertoperation(adsuuid: string, useruuid: string, method: string, created: Date) {
    if (useruuid == null || useruuid == undefined || useruuid == '') {
        let operation = await getModel(modelName).create({ adsuuid: adsuuid, method: method, created: created }, { returning: true });
        return operation;
    }
    let operation = await getModel(modelName).create({ adsuuid: adsuuid, useruuid: useruuid, method: method, created: created }, { returning: true });
    return operation;
}

export async function findAllplanByadveruuid(advertiseruuid: string) {
    let res = await getModel('puton.plan').findAll({ where: { advertiseruuid: advertiseruuid }, order: [['uuid', 'asc']] });
    return res ? res : undefined
}
export async function findAllunitByplanuuid(planuuid: string) {
    let res = await getModel('puton.unit').findAll({ where: { planuuid: planuuid }, order: [['uuid', 'asc']] });
    return res ? res : undefined
}
export async function findAlladsByunituuid(unituuid: string) {
    let res = await getModel('ads.ads').findAll({ where: { unituuid: unituuid }, order: [['uuid', 'asc']] });
    return res ? res : undefined
}
export async function findAlloperationByadsuuid(adsuuid: string) {
    let res = await getModel(modelName).findAll({ where: { adsuuid: adsuuid } });
    return res ? res.map(r => r.get()) : undefined
}

export async function findAlloperationByadsuuid_date(adsuuid: string, startdate: Date, enddate: Date) {
    let res = await getModel(modelName).findAll({ where: { adsuuid: adsuuid, created: { $gt: startdate, $lt: enddate } } });
    return res ? res.map(r => r.get()) : undefined
}


export async function findAlloperationByunituuid(sequelize: Sequelize, adsuuids: any[], startdate: Date, enddate: Date) {
    if (adsuuids != undefined && adsuuids.length != 0) {
        let adsStr = "(";
        for (let i = 0; i < adsuuids.length; i++) {
            adsStr = adsStr + "'" + adsuuids[i].uuid + "'";
            if (adsuuids.length - 1 != i) {
                adsStr = adsStr + ",";
            }
        }
        adsStr = adsStr + ")";
        let res = await sequelize.query(`select o.* from ads.adsoperation o
        where o.created > '${startdate.toLocaleString()}'
        and o.created < '${enddate.toLocaleString()}'
        and o.adsuuid in ${adsStr}
        order by o.created desc`, { type: 'select' });
        return res;
    } else {
        return []
    }
}


export async function createdoperation(records: object[]) {
    //getModel(modelName).create({adsuuid:adsuuid,method:method,created:new Date()})

    getModel(modelName).bulkCreate(records);
}

export async function deleteadsByadsuuid(sequelize: Sequelize, adsuuid: string) {
    sequelize.query(`delete from ads.adsoperation where adsuuid = '${adsuuid}'`, { type: 'delete' });
}


export async function deleteadsByadsuuids(sequelize: Sequelize, adsuuids: any[]) {
    if (adsuuids != undefined && adsuuids.length != 0) {
        let adsStr = "(";
        for (let i = 0; i < adsuuids.length; i++) {
            adsStr = adsStr + "'" + adsuuids[i].uuid + "'";
            if (adsuuids.length - 1 != i) {
                adsStr = adsStr + ",";
            }
        }
        adsStr = adsStr + ")";
        let res = await sequelize.query(`delete from ads.adsoperation where adsuuid in ${adsStr}`, { type: 'delete' });
        return res;
    } else {
        return []
    }
}