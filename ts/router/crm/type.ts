import { crmuserValidator, adstypeValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm, deleteOK, createdOk, sendErrMsg } from "../../lib/response"
import { LoginInfo, checkLogin } from "../../redis/logindao"
import { updateDeleted, updateDeletedsub } from "../../model/ads/ads"
import { deleteCategory, deleteSubCategory } from "../../model/ads/category"
import { getCategory, getSubcategory, getByName, insert, updatePositon, modifilyPic, findByPrimary, updateNameAndPositon, updateOrder, getsearchAll } from "../../model/ads/category"
import { adscategoryImgOpt } from "../../config/resource"
import { removeAsync } from "../../lib/fs"
import { uploadAdsImage } from "../../lib/upload"
import * as path from "path"

export const router = Router()

router.post('/:adtypeuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let adtypeuuid = req.params["adtypeuuid"] as string
    try {
        validateCgi({ uuid: adtypeuuid }, adstypeValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: adtypeuuid,
            glob: adscategoryImgOpt.glob,
            tmpDir: adscategoryImgOpt.tmpDir,
            maxSize: adscategoryImgOpt.maxSize,
            extnames: adscategoryImgOpt.extnames,
            maxFiles: adscategoryImgOpt.maxFiles,
            targetDir: adscategoryImgOpt.targetDir,
            fieldName: adscategoryImgOpt.fieldName,
        })
        await modifilyPic(adtypeuuid, newPath)
        return createdOk(res, { path: newPath })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:adtypeuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: string = (req as any).body.mediaName
    let adtypeuuid = req.params["adtypeuuid"] as string
    try {
        validateCgi({ uuid: adtypeuuid }, adstypeValidator.UUID)
        mediaName = path.join(adscategoryImgOpt.targetDir, adtypeuuid, mediaName)
        await removeAsync(mediaName)
        //更新到数据库
        await modifilyPic(adtypeuuid, null)
        return deleteOK(res, { msg: "删除成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})

/* GET adtype listing. */
router.get('/adtype', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let ip = await getClientIp(req)
        console.log("remoteAddress = " + req.connection.remoteAddress);// 未发生代理时，请求的ip
        console.log("ip===>", ip)
        let adtype = await getCategory()
        let searchAll = await getsearchAll("查看所有")
        let coupon = await getsearchAll("优惠券")
        let recommend = await getsearchAll("推荐")
        return sendOK(res, { adtype: adtype, searchAll: searchAll, coupon: coupon, recommend: [recommend] })
    } catch (e) {
        e.info(se, res, e)
    }
})
/* async function getClientIp(req: any) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}; */
async function getClientIp(req: any) {
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if (ip.split(',').length > 0) {
        ip = ip.split(',')[0]
    }
    return ip;
};

/* GET adslog listing. */
router.get('/subtype', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    const { parentuuid } = req.query
    try {
        validateCgi({ uuid: parentuuid }, crmuserValidator.uuid)
        let subtype = await getSubcategory(parentuuid)
        return sendOK(res, { subtype })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/type', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body: any = (req as any).body
    const { name, parentname, position } = body
    try {
        validateCgi({ name, parentname }, adstypeValidator.typaname)
        let adtype = await getByName(parentname)
        if (!adtype)
            adtype = await insert(parentname, undefined, position)

        let subtype
        if (name) {
            subtype = await insert(name, adtype.uuid, position)
        }
        return sendOK(res, { adtype, subtype })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改类的position,就是优先放前面
router.put('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, position } = (req as any).body
    validateCgi({ uuid, position }, adstypeValidator.updatePo)
    try {
        let r = await updatePositon(uuid, position)
        if (r)
            return sendOK(res, { msg: "succ" })
        return sendErrMsg(res, "failed", 500)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid }, crmuserValidator.uuid)
        let subtype = await findByPrimary(uuid)
        return sendOK(res, { subtype })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch("/position", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { positions } = (req as any).body
    positions = JSON.parse(positions)
    try {
        for (let i = 0; i < positions.length; i++) {
            validateCgi({ position: parseInt(positions[i].order), uuid: positions[i].uuid }, adstypeValidator.orderAndUuid)
            await updateOrder(positions[i].uuid, parseInt(positions[i].order))
        }
        return sendOK(res, { category: "true" })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let uuid = req.params["uuid"]
    const { name, position } = (req as any).body
    try {
        validateCgi({ uuid }, crmuserValidator.uuid)
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let subtype = await updateNameAndPositon(name, position, uuid)
        return sendOK(res, { subtype })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        const info: LoginInfo = (req as any).loginInfo
        validateCgi({ uuid }, adstypeValidator.UUID)
        if (!info.isRoot())
            return sendNoPerm(res)

        let category = await findByPrimary(uuid)
        if (!category)
            return sendOK(res, { category: "不存在该类" })

        //判断是大类还是小类
        if (!category.parent) {
            //删除大类，删除所对应的广告
            await updateDeleted(uuid)
            //删除小类
            await deleteSubCategory(uuid)
            //删除大类
            await deleteCategory(uuid)
        } else {
            //如果是小类，删除所对应的广告
            await updateDeletedsub(uuid)
            //删除大类
            await deleteCategory(uuid)
        }
        return sendOK(res, { category: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})