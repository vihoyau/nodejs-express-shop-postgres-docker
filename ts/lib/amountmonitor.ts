import { findByName } from "../model/system/system"
import { resetAppUserState } from "../model/users/users"
import { findTodayAmount, insertAmountLog } from "../model/users/amountlog"
import { Sequelize } from "sequelize"
import { delAppLogin } from "../redis/logindao"
import * as moment from "moment"
import * as winston from "winston"

export async function amountcheck(sequelize: Sequelize, useruuid: string, mode: string, fee: any, points: any) {
    let obj = {
        useruuid: useruuid,
        amount: fee,
        points: points,
        mode: mode,
        time: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    await insertAmountLog(obj)

    let limit = await findByName("limit")
    limit = limit.content.val

    let amount = await findTodayAmount(sequelize, useruuid)
    if (amount >= limit) {  //拉黑
        await resetAppUserState(useruuid, "off")
        delAppLogin(useruuid)  //清除登录数据，用户立即被强制登出
        winston.info("user :" + useruuid + " be disabled because of excess just now")
    }
}