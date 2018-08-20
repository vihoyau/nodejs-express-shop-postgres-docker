import { businessValidator, crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { insertbusiness, getbusinesslist, getByPrimary, getCount, updatebusiness, getbusiness } from "../../model/mall/business"
export const router: Router = Router()

//新增商家
router.post("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { business, contacts, state, phone, address, detailaddr, description } = (req as any).body
    try {
        validateCgi({ business, contacts, state, phone, description }, businessValidator.insertOptions)
        let obj = { business, contacts, phone, state, address, description, detailaddr }
        await insertbusiness(obj)
        return sendOK(res, { msg: '添加成功!' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得所有商家名称
router.get("/title", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let business = await getbusiness()
        return sendOK(res, { business })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得商家列表
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        let recordsFiltered = await getCount(searchdata)
        let business = await getbusinesslist(parseInt(start), parseInt(length), searchdata)
        return sendOK(res, { draw, business, recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得商家详情
router.get("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params["uuid"]
        validateCgi({ uuid }, businessValidator.UUID)
        let business = await getByPrimary(uuid)
        return sendOK(res, { business })
    } catch (e) {
        e.info(se, res, e)
    }

})

//修改商家信息
router.patch("/businessinfo/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { business, contacts, phone, address, description, detailaddr } = (req as any).body
    try {
        validateCgi({ uuid, business, contacts, phone, description }, businessValidator.updatabusiness)
        let obj = { business, contacts, address, phone, description, detailaddr }
        await updatebusiness(obj, uuid)
        return sendOK(res, { msg: '修改成功!' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//启用和禁用商家
router.patch("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { state } = (req as any).body
    try {
        validateCgi({ uuid }, businessValidator.updatestate)
        let obj = { state }
        await updatebusiness(obj, uuid)
        return sendOK(res, { msg: '修改成功!' })
    } catch (e) {
        e.info(se, res, e)
    }
})