import { validateCgi } from "../../lib/validator"
import { usersValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { getCategory, getSubcategory, findByPrimary, getsearchAll } from "../../model/mall/category"
export const router = Router()

/* GET adtype listing. */
router.get('/category', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let category = await getCategory()
        let searchAll = await getsearchAll("查看所有")
        let coupon = await getsearchAll("优惠券")
        return sendOK(res, { category: category, searchAll: searchAll, coupon: coupon })
    } catch (e) {
        e.info(se, res, e)
    }
})

/* GET adslog listing. */
router.get('/subcategory', async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    const { parent } = req.query
    try {
        validateCgi({ uuid: parent }, usersValidator.uuid)
        let subcategory = await getSubcategory(parent)
        return sendOK(res, { subcategory: subcategory })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/:uuid', async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)
        let subcategory = await findByPrimary(uuid)
        return sendOK(res, { subcategory: subcategory })
    } catch (e) {
        e.info(se, res, e)
    }
})
