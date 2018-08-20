import { findByUseruuid, findNumberByUseruuidGooduuid, updateByUseruuidAndGooduuid } from "../../model/orders/shopping_cart"
import { updateNumberByUuid, deleteByUuid, insertShoppingCart } from "../../model/orders/shopping_cart"
import { checkAppLogin } from "../../redis/logindao"
import { LoginInfo } from "../../redis/logindao"
import { validateCgi } from "../../lib/validator"
import { shoppingCartValidator } from "./validator"
import { sendOK, sendError as se } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { getPageCount } from "../../lib/utils"
export const router = Router()

/**
 * 根据useruuid查询其所对应的的购物车列表
 */
router.get('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, shoppingCartValidator.pageAndCount)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let { cursor, limit } = getPageCount(page, count)
        let cart = await findByUseruuid(req.app.locals.sequelize, loginInfo.getUuid(), cursor, limit)
        cart.forEach(r => {
            r.goodprice = r.goodprice / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, cart)
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 添加购物车信息
 */
router.post('/goods', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { gooduuid, property, number, pic, goodpoint, goodprice, stock } = (req as any).body
    try {
        validateCgi({ gooduuid: gooduuid, property: property, goodpoint: parseInt(goodpoint), goodprice: parseInt(goodprice), stock: parseInt(stock) }, shoppingCartValidator.insertGoods)
        const loginInfo: LoginInfo = (req as any).loginInfo
        goodprice = parseFloat(goodprice) * 100
        let numbers = await findNumberByUseruuidGooduuid(loginInfo.getUuid(), gooduuid, property)
        let cart
        if (numbers == undefined) {
            cart = await insertShoppingCart(loginInfo.getUuid(), gooduuid, property, parseInt(number), pic, parseInt(goodpoint), parseInt(goodprice), parseInt(stock))
        } else {
            cart = await updateByUseruuidAndGooduuid(loginInfo.getUuid(), gooduuid, property, numbers + parseInt(number))
        }
        return sendOK(res, cart)
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 通过+/-来修改购买商品的数量
 */
router.put('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid: string = req.params["uuid"]
    const { number } = (req as any).body
    try {
        validateCgi({ uuid: uuid, number: number }, shoppingCartValidator.numberAndUuid)
        let cart = await updateNumberByUuid(uuid, parseInt(number))
        return sendOK(res, cart)
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 删除购物车中指定的商品
 */
router.delete('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid: string = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, shoppingCartValidator.uuid)
        let cart = await deleteByUuid(uuid)
        return sendOK(res, { cart: cart })
    } catch (e) {
        e.info(se, res, e)
    }
})