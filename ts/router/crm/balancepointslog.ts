
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { balancePointLog } from "./validator"
import { sendOK, sendErrMsg } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { findPointByUserUUID, findBalanceByUserUUID, getPointCountByUser, getBalanceCountByUser } from "../../model/users/amountlog"
export const router: Router = Router()

//获取用户的零钱积分流水
router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid, start, length, starttime, endtime, type } = (req as any).query
    validateCgi({ useruuid, start, length }, balancePointLog.get)
    try {
        let recordsFiltered, logs
        if (type == 'point') {
            recordsFiltered = await getPointCountByUser(req.app.locals.sequelize, useruuid, starttime, endtime)
            logs = await findPointByUserUUID(req.app.locals.sequelize, useruuid, start, length, starttime, endtime)
        } else {
            recordsFiltered = await getBalanceCountByUser(req.app.locals.sequelize, useruuid, starttime, endtime)
            logs = await findBalanceByUserUUID(req.app.locals.sequelize, useruuid, start, length, starttime, endtime)
        }

        for (let i = 0; i < logs.length; i++) {
            switch (logs[i].mode) {
                case 'answer': logs[i].mode = '答题'; break;
                case 'invite': logs[i].mode = '邀请'; break;
                case 'lottery': logs[i].mode = '抽奖'; break;
                case 'collection': logs[i].mode = '集道具'; break;
                case 'reward': logs[i].mode = '打赏'; break;
                case 'recharge': logs[i].mode = '充值'; break;
                case 'withdraw': logs[i].mode = '提现'; break;
                default: break;
            }
        }
        return sendOK(res, { logs, recordsFiltered })
    } catch (e) {
        sendErrMsg(res, e, 500)
    }
})