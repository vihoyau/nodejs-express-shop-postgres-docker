import { insertComment, updateComment, listComment, getCount, deleteComment, getcomentByparent } from "../../model/mall/comment"
import { LoginInfo, checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se, sendNoPerm } from "../../lib/response"
import { commentValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { Router, Request, Response, NextFunction } from "express"
import { timestamps } from "../../config/winston"
export const router = Router()

/**
 * 新增评论
 */
router.post("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { content, goodsuuid, parent } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isGoodsRO() && !info.isGoodsRW())
            return sendNoPerm(res)
        validateCgi({ content: content, goodsuuid: goodsuuid, parent: parent }, commentValidator.insertOptions)
        let comment = await insertComment(content, goodsuuid, info.getUuid(), parent, "new")
        await updateComment(parent, 'replied')
        return sendOK(res, comment)
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 查看回复内容
 */
router.get("/replied", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { uuid } = req.query
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isGoodsRO() && !info.isGoodsRW())
            return sendNoPerm(res)
        validateCgi({ uuid: uuid }, commentValidator.uuid)
        let comment = await getcomentByparent(uuid)
        return sendOK(res, comment)
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 对评论进行审批
 */
router.patch("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { state } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isGoodsRO() && !info.isGoodsRW())
            return sendNoPerm(res)
        validateCgi({ uuid: uuid, state: state }, commentValidator.uuidAndState)
        let comment = await updateComment(uuid, state)
        return sendOK(res, comment)
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 列表显示需要审批的用户评论
 */
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isGoodsRO() && !info.isGoodsRW())
            return sendNoPerm(res)
        validateCgi({ start: start, length: length, searchdata: searchdata }, commentValidator.pagination)
        let recordsFiltered = await getCount(req.app.locals.sequelize, searchdata)
        let comment = await listComment(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length))
        comment.forEach(comment => {
            comment.created = timestamps(comment.created)
            comment.grealprice = comment.grealprice / 100
            comment.gprice = comment.gprice / 100
        })
        return sendOK(res, { comment: comment, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 删除评论
 */
router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isGoodsRO() && !info.isGoodsRW())
            return sendNoPerm(res)
        validateCgi({ uuid: uuid }, commentValidator.uuid)
        let comment = await deleteComment(uuid)
        return sendOK(res, comment)
    } catch (e) {
        e.info(se, res, e)
    }
})