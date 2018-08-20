import { validateCgi } from "../../lib/validator"
import { goodsValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm, createdOk, deleteOK } from "../../lib/response"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { uploadAdsImage } from "../../lib/upload"
import { goodsBannerImgOpt } from "../../config/resource"
import { removeAsync } from "../../lib/fs"
import * as path from "path"
import { getBanner, getBannerAll, getCount, insertBanner, updateContent, updatePic, updateUrl, update, deleteByuuid, findByPrimary } from "../../model/mall/banner"
export const router = Router()



router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"] as string
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRW() && !info.isRoot()) {
            return sendNoPerm(res)
        } else {
            validateCgi({ uuid: uuid }, goodsValidator.UUID)
            let adslogs = await findByPrimary(uuid)
            return sendOK(res, { adslogs: adslogs })
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

/* GET adtype listing. */
router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRO() && !info.isRoot() && !info.isGoodsRW()) {
            return sendNoPerm(res)
        } else {
            validateCgi({ start, length, searchdata }, goodsValidator.pagination)
            let obj = {
                $or: [{
                    url: { $like: '%' + searchdata + '%' },
                    content: { $like: '%' + searchdata + '%' },
                    description: { $like: '%' + searchdata + '%' }
                }]
            }
            let recordsFiltered = await getCount(obj)
            let adslogs = await getBannerAll(obj, parseInt(start), parseInt(length))
            return sendOK(res, { adslogs: adslogs, draw: draw, recordsFiltered: recordsFiltered })
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

// router.post('/:uuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
//     let uuid = req.params["uuid"] as string
//     try {
//         validateCgi({ uuid: uuid }, goodsValidator.UUID)
//         let newPath = await uploadAdsImage(req, {
//             uuid: uuid,
//             glob: goodsBannerImgOpt.glob,
//             tmpDir: goodsBannerImgOpt.tmpDir,
//             maxSize: goodsBannerImgOpt.maxSize,
//             extnames: goodsBannerImgOpt.extnames,
//             maxFiles: goodsBannerImgOpt.maxFiles,
//             targetDir: goodsBannerImgOpt.targetDir,
//             fieldName: goodsBannerImgOpt.fieldName,
//         })
//         return createdOk(res, { path: newPath })
//     } catch (e) {
//         e.info(se, res, e)
//     }
// })

router.post('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let banners = await insertBanner()
        return sendOK(res, banners)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.put('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let uuid = req.params["uuid"] as string
    const { url, pic, content, state, description, position, externalurl } = (req as any).body
    try {
        let banner = {
            uuid: uuid,
            url: url,
            pic: pic,
            content: content,
            description: description,
            position: parseInt(position),
            state: state,
            externalurl: externalurl
        }
        validateCgi(banner, goodsValidator.bannerInfo)
        let getbanners = await getBanner(0, 10)
        if (state == "on" && getbanners.length > 4)
            return sendOK(res, { updatestate: "false" })
        let banners = await update(banner, uuid)
        return sendOK(res, banners)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.put('/url/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body: any = (req as any).body
    const { uuid, url } = body
    try {
        validateCgi({ uuid: uuid, url: url }, goodsValidator.bannerUrl)
        let banner = await updateUrl(url, uuid)
        return sendOK(res, banner)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.put('/pic/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let body: any = (req as any).body
    const { uuid, pic } = body
    try {
        validateCgi({ uuid: uuid }, goodsValidator.UUID)
        let banner = await updatePic(pic, uuid)
        return sendOK(res, banner)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.put('/content/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let { content, uuid } = (req as any).body
    try {
        validateCgi({ uuid: uuid }, goodsValidator.UUID)
        let banner = await updateContent(content, uuid)
        return sendOK(res, banner)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/:uuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"] as string
    try {
        validateCgi({ uuid: uuid }, goodsValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: uuid,
            glob: goodsBannerImgOpt.glob,
            tmpDir: goodsBannerImgOpt.tmpDir,
            maxSize: goodsBannerImgOpt.maxSize,
            extnames: goodsBannerImgOpt.extnames,
            maxFiles: goodsBannerImgOpt.maxFiles,
            targetDir: goodsBannerImgOpt.targetDir,
            fieldName: goodsBannerImgOpt.fieldName,
        })
        return createdOk(res, { path: newPath })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:uuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: any = (req as any).body.mediaName
    let uuid = req.params["uuid"] as string
    try {
        validateCgi({ uuid: uuid }, goodsValidator.UUID)
        mediaName = path.join(goodsBannerImgOpt.targetDir, uuid, mediaName)
        await removeAsync(mediaName)
        return sendOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"] as string
    try {
        validateCgi({ uuid: uuid }, goodsValidator.UUID)
        await deleteByuuid(uuid)
        return deleteOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})