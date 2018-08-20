import { validateCgi } from "../../lib/validator"
import { messageValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { updateMessage, getMySendMessage, getMyMessage, removemessage, findByPrimary, updateMessageSaw, getMyMessageCount } from "../../model/users/message"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { timestamps } from "../../config/winston"
export const router = Router()

//获取用户未读消息数
router.get('/messagecount', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let useruuid = (req as any).headers.uuid
        let count = useruuid ? (await getMyMessageCount(useruuid)) : 0

        return sendOK(res, { count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获取新消息
router.get('/state', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const info: LoginInfo = (req as any).loginInfo
        let message = await getMySendMessage(info.getUuid())
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})


//获取消息详情
router.get('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {

        validateCgi({ uuid: uuid }, messageValidator.uuid)
        let message = await findByPrimary(uuid)
        message.created = timestamps(message.created)
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})


//获取我的消息
router.get('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const info: LoginInfo = (req as any).loginInfo
        let message = await getMyMessage(info.getUuid())
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})

//发送系统消息
router.put('/type/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, messageValidator.uuid)
        let message = await updateMessage(uuid)
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改状态为已查看
router.put('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, messageValidator.uuid)
        let message = await updateMessageSaw(uuid)
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除消息
router.delete('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, messageValidator.uuid)
        await removemessage(uuid)
        return sendOK(res, { message: "删除成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})