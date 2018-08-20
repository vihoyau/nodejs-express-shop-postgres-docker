import { validateCgi } from "../../lib/validator"
import { goodsValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, createdOk, deleteOK, sendNoPerm, sendErrMsg } from "../../lib/response"
import { removeAsync } from "../../lib/fs"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { uploadAdsImage } from "../../lib/upload"
import {
    insertGoods, updateGoods, updateState, deleteGoods, findGoodsHotCount, getPrizeCount, getCount,
    findPrizeGoods, findGoods, updateGoodsTags, findGoodsByHot, findByPrimary, modifilyPics, updateGoodsHot,
    modifilyDetailPics ,changeTag,searchpoints
} from "../../model/mall/goods"
// import { findByPrimary as findPrize, updatePrizeInfo, findAllPrize } from "../../model/mall/prize"
import { goodsImgOpt, goodsTagsImgOpt, goodsDetailImgOpt } from "../../config/resource"
import * as path from "path"
export const router = Router()

/*put*/
router.patch('/:uuid/tags', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body = (req as any).body
    let uuid = req.params["uuid"]
    const { tags, realprice, price, points } = body
    try {
        //const loginInfo: LoginInfo = (req as any).loginInfo
        // if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        //     return sendNoPerm(res)
        // }
        let goods = await updateGoodsTags(uuid, JSON.parse(tags), parseFloat(realprice) * 100, parseFloat(price) * 100, parseInt(points))
        /*let prizes = await findAllPrize()
        for (let i = 0; i < prizes.length; i++) {
            if (prizes[i].prize.uuid === uuid) {
                let prize = await findPrize(prizes[i].uuid)
                prize.prize.tags = JSON.parse(tags)
                await updatePrizeInfo({ prize: prize }, prizes[i].uuid)//修改奖品成功
            }
        }*/
        return sendOK(res, { goods: goods })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 添加推荐
router.patch("/:uuid/addHot", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    let { hot } = (req as any).body
    try {
        validateCgi({ uuid: uuid, hot: hot }, goodsValidator.setHot)
        let goodsUnmber = await findGoodsHotCount(req.app.locals.sequelize)
        let goods
        if (goodsUnmber < 9) {
            goods = await updateGoodsHot(uuid, hot)
			if(goods){}
            return sendOK(res, "true")
        } else {
            return sendOK(res, "false")
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

// 取消推荐
router.patch("/:uuid/removeHot", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    let { hot } = (req as any).body
    try {
        validateCgi({ uuid: uuid, hot: hot }, goodsValidator.setHot)
        let goods = await updateGoodsHot(uuid, hot)
        return sendOK(res, { goods: goods })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/hot", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        // 查询热门商品的个数
        let goods = await findGoodsByHot(req.app.locals.sequelize)
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
        })
        return sendOK(res, { goods: goods })
    } catch (e) {
        e.info(se, res, e)
    }
})

/*insert*/
router.post('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { volume } = (req as any).body
    try {

        let obj = {
            state: 'new',  // 状态：onsale-在售 offset-下架 new-编辑
            deleted: 0,
            volume: volume
        }
        //validateCgi({ volume: volume }, goodsValidator.creategoods)
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }

        let goodsuuid = await insertGoods(req.app.locals.sequelize, obj, parseInt(volume))
        return createdOk(res, { goodsuuid: goodsuuid })
    } catch (e) {
        e.info(se, res, e)
    }
})
// 商品标签修改
router.post("/goodsTag",checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let { tag ,gooduuid} = (req as any).body
        let goods:any=await searchpoints(gooduuid)
        let points=goods.points
        if(points>0&&points){
            return sendOK(res, { restag:"false"})
        }
         await changeTag(tag,gooduuid)
        return sendOK(res, { restag:"true"})
    } catch (e) {
        e.info(se, res, e)
    }
})
router.put('/detail', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { detailcontent, detailpics, uuid } = (req as any).body
    validateCgi({ detailcontent, uuid }, goodsValidator.detail)

    try {
        let r = await updateGoods(uuid, { detailcontent, detailpics: JSON.parse(detailpics) })
        if (r)
            return sendOK(res, { msg: "ok" })
        return sendErrMsg(res, "fail", 500)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

router.put('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body = (req as any).body
    let uuid = req.params["uuid"]
    const { title, keyword, state, content, specification, category, subcategory } = body
    let { pics, postage, businessmen, businessuuid } = body
    postage = parseFloat(postage) * 100
    try {
        let obj = {
            title: title,
            keyword: keyword,
            content: content,
            specification: specification,
            category: category,
            subcategory: subcategory,
            state: state,
            postage: postage,
            businessmen: businessmen,
            businessuuid: businessuuid,
            pics: JSON.parse(pics),
            hot: "no"
        }
        if (state == "onsale") {
            delete obj.hot
        }
        // validateCgi(obj, goodsValidator.goodsInfo)
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }

        let goods = await updateGoods(uuid, obj)
        return sendOK(res, { goods: goods })
    } catch (e) {
        e.info(se, res, e)
    }
})

//上传详情图片
router.post('/:goodsuuid/detailPics', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let goodsuuid = req.params["goodsuuid"] as string
    try {
        validateCgi({ uuid: goodsuuid }, goodsValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: goodsuuid,
            glob: goodsDetailImgOpt.glob,
            tmpDir: goodsDetailImgOpt.tmpDir,
            maxSize: goodsDetailImgOpt.maxSize,
            extnames: goodsDetailImgOpt.extnames,
            maxFiles: goodsDetailImgOpt.maxFiles,
            targetDir: goodsDetailImgOpt.targetDir,
            fieldName: goodsDetailImgOpt.fieldName,
        })
        let goods = await findByPrimary(goodsuuid)
        goods.detailpics = goods.detailpics ? goods.detailpics : []
        goods.detailpics.push(newPath)
        await modifilyDetailPics(goodsuuid, goods.detailpics)
        return createdOk(res, { path: newPath })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除详情图片
router.delete('/:goodsuuid/detailImg', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { mediaName, detailcontent, pics } = (req as any).body
    let goodsuuid = req.params["goodsuuid"] as string
    try {
        validateCgi({ uuid: goodsuuid }, goodsValidator.UUID)
        mediaName = path.join(goodsDetailImgOpt.targetDir, goodsuuid, mediaName)
        await removeAsync(mediaName)

        let pic = pics ? JSON.parse(pics) : null
        let goods = await updateGoods(goodsuuid, { detailpics: pic, detailcontent })
        return sendOK(res, { pics: goods.detailpics })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

router.patch('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { state } = (req as any).body
    let uuid = req.params["uuid"]

    try {
        validateCgi({ uuid: uuid, state: state }, goodsValidator.setState)
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }
        let goods = await updateState(uuid, state)
        return sendOK(res, { goods: goods })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]

    try {
        validateCgi({ uuid: uuid }, goodsValidator.UUID)
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }

        await deleteGoods(uuid)
        return sendOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/:goodsuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let goodsuuid = req.params["goodsuuid"] as string
    try {
        validateCgi({ uuid: goodsuuid }, goodsValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: goodsuuid,
            glob: goodsImgOpt.glob,
            tmpDir: goodsImgOpt.tmpDir,
            maxSize: goodsImgOpt.maxSize,
            extnames: goodsImgOpt.extnames,
            maxFiles: goodsImgOpt.maxFiles,
            targetDir: goodsImgOpt.targetDir,
            fieldName: goodsImgOpt.fieldName,
        })
        let goods = await findByPrimary(goodsuuid)
        if (goods.pics == null)
            goods.pics = []
        goods.pics.push(newPath)
        await modifilyPics(goodsuuid, goods.pics)
        return createdOk(res, { path: newPath })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/:goodsuuid/tagsImage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let goodsuuid = req.params["goodsuuid"] as string
    try {
        validateCgi({ uuid: goodsuuid }, goodsValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: goodsuuid,
            glob: goodsTagsImgOpt.glob,
            tmpDir: goodsTagsImgOpt.tmpDir,
            maxSize: goodsTagsImgOpt.maxSize,
            extnames: goodsTagsImgOpt.extnames,
            maxFiles: goodsTagsImgOpt.maxFiles,
            targetDir: goodsTagsImgOpt.targetDir,
            fieldName: goodsTagsImgOpt.fieldName,
        })
        return createdOk(res, { path: newPath })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch("/:goodsuuid/image", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { pics } = (req as any).body
    let goodsuuid = req.params["goodsuuid"] as string
    if (pics != undefined) {
        let pic = JSON.parse(pics)
        if (pic) {
            await modifilyPics(goodsuuid, pic)
        }
    }
})

router.delete('/:goodsuuid/tagsImage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: string = (req as any).body.mediaName
    let goodsuuid = req.params["goodsuuid"] as string
    try {
        validateCgi({ uuid: goodsuuid }, goodsValidator.UUID)
        mediaName = path.join(goodsTagsImgOpt.targetDir, goodsuuid, mediaName)
        await removeAsync(mediaName)
        return deleteOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:goodsuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let pics = (req as any).body.pics
    let mediaName: string = (req as any).body.mediaName
    let goodsuuid = req.params["goodsuuid"] as string
    try {
        validateCgi({ uuid: goodsuuid }, goodsValidator.UUID)
        mediaName = path.join(goodsImgOpt.targetDir, goodsuuid, mediaName)
        await removeAsync(mediaName)
        let pic
        if (pics) {
            pic = JSON.parse(pics)
        } else {
            pic = null
        }
        await modifilyPics(goodsuuid, pic)
        return deleteOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})

// router.get('/title', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
//     let { title, start, length, draw} = req.query
//     try {
//         // validateCgi({ title: title, page: page, count: count }, goodsValidator.titleAndPC)
//         // let { cursor, limit } = getPageCount(page, count)
//         let obj = {
//             state: "onsale",
//             deleted: 0,
//             $or: [{ title: { like: '%' + title + '%' } }, { keyword: { like: '%' + title + '%' } }],
//         }
//         let recordsFiltered = await getCount(obj)
//         let goods = await findByKeyword(title, parseInt(start), parseInt(length))
//         return sendOK(res, { goods: goods, draw: draw, recordsFiltered: recordsFiltered })
//     } catch (e) {
//         e.info(se, res, e)
//     }
// })
router.get('/prize', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, goodsValidator.pagination)
        let recordsFiltered = await getPrizeCount(req.app.locals.sequelize, searchdata)
        let goods = await findPrizeGoods(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length))
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid }, goodsValidator.UUID)
        let goods = await findByPrimary(uuid)
        goods.realprice = goods.realprice / 100
        goods.price = goods.price / 100
        goods.postage = goods.postage / 100
        return sendOK(res, { goods: goods })
    } catch (e) {
        e.info(se, res, e)
    }
})


router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, goodsValidator.pagination)
        let recordsFiltered = await getCount(req.app.locals.sequelize, searchdata)
        let goods = await findGoods(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length))
        goods.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
            r.postage = r.postage / 100
        })
        return sendOK(res, { goods: goods, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})
