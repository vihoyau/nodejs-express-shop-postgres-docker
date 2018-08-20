import { validateCgi } from "../../lib/validator"
import { goodsValidator } from "./validator"
import { getPageCount } from "../../lib/utils"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { insertGoodsView, updateGoodsView, getGoodsviewByuuid } from "../../model/mall/goods_view"
import { findFavoriateByUuid } from "../../model/mall/favoriate"
import { insertStatistics } from "../../model/users/statistics"
import { findAll, findByPrimary, findByBusiness, findByRecommendGoods, findByKeywordPriceSort, orderByPrice, findByPrice, findByCategory, findBySubcategory, orderBySubcategoryPrice, findBySubcategoryPrice, findByKeywordPriceRange } from "../../model/mall/goods"
import { orderBySales, orderBySubCategoryCSales, updateViews, findByViews, findByKeywordSales } from "../../model/mall/goods_ext"

export const router = Router()

router.get("/subcategory/sales", async function (req: Request, res: Response, next: NextFunction) {
    const { page, count, subcategory } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ page: page, count: count }, goodsValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await orderBySubCategoryCSales(req.app.locals.sequelize, cursor, limit, subcategory)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/subcategory/price_range", async function (req: Request, res: Response, next: NextFunction) {
    const { fromPrice, toPrice, page, count, subcategory } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ fromPrice: fromPrice, toPrice: toPrice, page: page, count: count }, goodsValidator.range_price)
        let { cursor, limit } = getPageCount(page, count)
        let toPrices;
        if (!toPrice) {
            toPrices = 0
        } else {
            toPrices = parseInt(toPrice)
        }
        let goods = await findBySubcategoryPrice(parseInt(fromPrice) * 100, toPrices * 100, cursor, limit, subcategory)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/subcategory/price_sort", async function (req: Request, res: Response, next: NextFunction) {
    const { sort, page, count, subcategory } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ page: page, count: count }, goodsValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await orderBySubcategoryPrice(subcategory, sort, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/keyword/sales", async function (req: Request, res: Response, next: NextFunction) {
    const { keyword, page, count } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ keyword: keyword, page: page, count: count }, goodsValidator.keywords)
        let { cursor, limit } = getPageCount(page, count)
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        let goods = await findByKeywordSales(keyword, req.app.locals.sequelize, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/keyword/price_range", async function (req: Request, res: Response, next: NextFunction) {
    const { fromPrice, toPrice, keyword, page, count, } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ keyword: keyword, page: page, count: count }, goodsValidator.keywords)
        let { cursor, limit } = getPageCount(page, count)
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        let goods = await findByKeywordPriceRange(parseInt(fromPrice) * 100, parseInt(toPrice) * 100, keyword, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/keyword/price_sort", async function (req: Request, res: Response, next: NextFunction) {

    const { keyword, page, count, sort } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ keyword: keyword, page: page, count: count }, goodsValidator.keywords)
        let { cursor, limit } = getPageCount(page, count)
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        let goods = await findByKeywordPriceSort(keyword, sort, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/business", async function (req: Request, res: Response, next: NextFunction) {

    const { business, page, count } = req.query
    try {
        validateCgi({ business: business, page: page, count: count }, goodsValidator.business)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await findByBusiness(business, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 热门商品列表
router.get("/hotGoods", async function (req: Request, res: Response, next: NextFunction) {
    try {
        let hotGoods = await findByViews(res.app.locals.sequelize)
        hotGoods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { hotGoods: hotGoods })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 推荐商品列表
router.get("/recommendGoods", async function (req: Request, res: Response, next: NextFunction) {
    try {
        let goods = await findByRecommendGoods()
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/category", async function (req: Request, res: Response, next: NextFunction) {
    const { category, page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, goodsValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await findByCategory(category, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/subcategory", async function (req: Request, res: Response, next: NextFunction) {
    const { subcategory, page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, goodsValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await findBySubcategory(subcategory, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/price_range", async function (req: Request, res: Response, next: NextFunction) {
    const { fromPrice, toPrice, page, count, category } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ fromPrice: fromPrice, toPrice: toPrice, page: page, count: count }, goodsValidator.range_price)
        let { cursor, limit } = getPageCount(page, count)
        let toPrices;
        if (!toPrice) {
            toPrices = 0
        } else {
            toPrices = parseInt(toPrice)
        }
        let goods = await findByPrice(parseInt(fromPrice) * 100, toPrices * 100, cursor, limit, category)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/price_sort", async function (req: Request, res: Response, next: NextFunction) {
    const { sort, page, count, category } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ page: page, count: count }, goodsValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await orderByPrice(category, sort, cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/sales", async function (req: Request, res: Response, next: NextFunction) {
    let useruuid = (req as any).headers.uuid
    const { page, count, category } = req.query
    try {
        validateCgi({ page: page, count: count }, goodsValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await orderBySales(req.app.locals.sequelize, cursor, limit, category)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'goods',
            }
            await insertStatistics(obj)
        }
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/:uuid", async function (req: Request, res: Response, next: NextFunction) {
    let useruuid = (req as any).headers.uuid
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, goodsValidator.uuid)
        let goods = await findByPrimary(uuid)
        await updateViews(uuid)
        if (goods != undefined) {
            goods.realprice = goods.realprice / 100
            goods.price = goods.price / 100
            goods.postage = goods.postage / 100
        }
        //根据useruuid和gooduuid查询浏览记录
        let favorite
        if (useruuid != "undified") {
            let goodsviewuuid = await getGoodsviewByuuid(useruuid, uuid)
            let obj
            if (goodsviewuuid) {
                await updateGoodsView(goodsviewuuid)
            } else {
                obj = {
                    useruuid: useruuid,
                    gooduuid: uuid
                }
                //添加商品浏览记录
                await insertGoodsView(obj)
            }

            let favor = await findFavoriateByUuid(uuid, useruuid)

            favorite = favor ? 1 : 0
        }
        return sendOK(res, { goods: goods, favorite: favorite })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/", async function (req: Request, res: Response, next: NextFunction) {
    let { page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, goodsValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let goods = await findAll(cursor, limit)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})