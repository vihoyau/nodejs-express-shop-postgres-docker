import { updateConsultByUuid, getCount, findBy, findByPrimary, deleteConsult } from "../../model/mall/consult"
import { LoginInfo, checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se, sendNoPerm } from "../../lib/response"
import { commentValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { Router, Request, Response, NextFunction } from "express"
import { timestamps } from "../../config/winston"
export const router = Router()

/**
 * 咨询回复
 */
router.post("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { content, uuid } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isGoodsRW() && !info.isGoodsRO())
            return sendNoPerm(res)
        validateCgi({ content: content, uuid: uuid }, commentValidator.consultValidator)
        //查找当前用户是否对当前商品评论
        let contents = await findByPrimary(req.app.locals.sequelize, uuid)
        let content1, comment
        content1 = contents[0].content
        content1.push(JSON.parse(content))
        comment = await updateConsultByUuid(content1, uuid, "reply")
        return sendOK(res, { consult: comment })
    } catch (e) {
        e.info(se, res, e)
    }
})


/**
 * 列表显示咨询回复
 */
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isGoodsRW() && !info.isGoodsRO())
            return sendNoPerm(res)
        validateCgi({ start: start, length: length, searchdata: searchdata }, commentValidator.pagination)
        let recordsFiltered = await getCount(req.app.locals.sequelize, searchdata)
        let consult = await findBy(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length))
        consult.forEach(r => {
            r.created = timestamps(r.created)
            r.modified = timestamps(r.modified)
        })
        return sendOK(res, { consult: consult, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, commentValidator.uuid)
        let consult = await findByPrimary(req.app.locals.sequelize, uuid)
        consult.forEach(r => {
            r.content.forEach((rs: any) => {
                rs.time = timestamps(rs.time)
            })
        })
        return sendOK(res, { consult: consult })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 删除客服信息
 */
router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, commentValidator.uuid)
        await deleteConsult(uuid)
        return sendOK(res, { msg: "删除成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})