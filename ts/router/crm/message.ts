import { validateCgi } from "../../lib/validator"
import { messageValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm } from "../../lib/response"
import { createMessage, getMessageByType, updateMessage, updateContent, getCount } from "../../model/users/message"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { timestamps } from "../../config/winston"
export const router = Router()

//创建消息
router.post('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { content, useruuid, title, username } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let obj = {
            useruuid: useruuid,
            username: username,
            content: content,
            state: 'new',
            title: title
        }
        validateCgi(obj, messageValidator.info)
        let message = await createMessage(obj)
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})

//根据类型获取消息
router.get('/state', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { state, start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        validateCgi({ state, start, length, searchdata: undefined }, messageValidator.typeValidator)
        let obj = {}
        if (searchdata) {
            obj = {
                state: state,
                $or: [
                    { content: { $like: '%' + searchdata + '%' } }
                ]
            }
        } else {
            obj = { state: state }
        }
        let recordsFiltered = await getCount(obj)
        let message = await getMessageByType(obj, parseInt(start), parseInt(length))
        return sendOK(res, { message: message, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        validateCgi({ start: start, length: length, searchdata: undefined }, messageValidator.pagination)
        let obj = {}
        if (searchdata) {
            obj = {
                $or: [
                    { content: { $like: '%' + searchdata + '%' } },
                    { title: { $like: '%' + searchdata + '%' } }
                ]
            }
        }
        let recordsFiltered = await getCount(obj)
        let message = await getMessageByType(obj, parseInt(start), parseInt(length))
        message.forEach(message => message.created = timestamps(message.created))
        return sendOK(res, { message: message, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//发送系统消息
router.put('/type/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        validateCgi({ uuid }, messageValidator.uuid)
        let message = await updateMessage(uuid)
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改消息内容
router.put('/content/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { content, title, username, useruuid } = (req as any).body
    let uuid = req.params["uuid"]
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        validateCgi({ uuid, content, title, username, useruuid }, messageValidator.contentValidator)
        let message = await updateContent(content, uuid, title, username, useruuid)
        return sendOK(res, { message: message })
    } catch (e) {
        e.info(se, res, e)
    }
})