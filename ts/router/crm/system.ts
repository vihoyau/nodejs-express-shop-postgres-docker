import { validateCgi } from "../../lib/validator"
import { systemValidator } from "./validator"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm} from "../../lib/response"
import { insertSystem, updateSystem, findByName } from "../../model/system/system"
import { getOffCount, getAllOffUsers } from "../../model/users/users"
import { timestamps } from "../../config/winston"
export const router = Router()

router.post('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { name, content } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (!loginInfo.isRoot() && !loginInfo.isGoodsRW())
            return sendNoPerm(res)
        validateCgi({ name: name, content: content }, systemValidator.contentValidator)
        let result = await insertSystem(content, name)
        return sendOK(res, result ? result : { msg: "failed" })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.put('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { name, content } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (name == 'informationEntrance') {
            if (!loginInfo.isAdvertiserRW() && !loginInfo.isRoot())
                return sendNoPerm(res)
        } else {
            if (!loginInfo.isRoot() && !loginInfo.isGoodsRW())
                return sendNoPerm(res)
        }

        validateCgi({ name, content }, systemValidator.contentValidator)

        

        let operation = await findByName('operationstatus')//获得system.system表中的开关操作标志状态值记录
        let status = operation.content.status     //获得system.system表中的status状态值
        let state = await findByName('state')//获得system.system表中的lotterystates状态值记录
        let lotterystate = state.content.lotterystate     //获得system.system表中的lotterystates状态值

        if (lotterystate === "on" && status === "1") {
            return sendOK(res, { message: '抽奖按钮已开启，不能修改抽奖设置' }) //返回操作信息和按钮状态
        }
        let event = await findByName('eventname')//得到eventname的记录
        let eventstate = event.content     //取出content的内容
        let eventstate_change = JSON.stringify(eventstate)
        if (eventstate_change === content) {
            return sendOK(res, {message: '活动名重复,请重新设置活动名称'})          
        } else {
            if (name === "eventname") {
                await updateSystem(JSON.parse('{"status": "0"}'), 'operationstatus')          //更新status的状态,使到可以开启抽奖按钮
            }
        }
        await updateSystem(JSON.parse(content), name)
        return sendOK(res, { message: '抽奖设置修改成功' })

    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { name } = req.query
    try {
        validateCgi({ name }, systemValidator.sysname)
        let result = await findByName(name)
        if (result)
            result.modified = timestamps(result.modified);
        return sendOK(res, result ? result : { msg: "no data" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得禁用用户
router.get('/offUsers', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length } = (req as any).query
    validateCgi({ start, length }, systemValidator.offUsers)

    try {
        let recordsFiltered = await getOffCount()
        let users = await getAllOffUsers(start, length)
        users.forEach(r => {
            delete r.password
        })
        return sendOK(res, { users, recordsFiltered })
    } catch (e) {
        se(res, e)
    }
})