import { validateCgi } from "../../lib/validator"
import { categoryValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm, createdOk, deleteOK } from "../../lib/response"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { deleteByCategory, deleteCategory, getsearchAll, querycategorypic } from "../../model/mall/category"
import { deleteBySubcategory, deleteByCategory as deletegoods } from "../../model/mall/goods"
import { getCategory, getSubcategory, getByName, insert, findByPrimary, updateName, modifilyPic, updateOrder } from "../../model/mall/category"
import { categoryImgOpt, subcategoryImgOpt } from "../../config/resource"
import { removeAsync } from "../../lib/fs"
import { uploadAdsImage } from "../../lib/upload"
import * as path from "path"

export const router = Router()

/* GET adtype listing. */
router.get('/category', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
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
router.get('/subcategory', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    const { parent } = req.query
    try {
        validateCgi({ uuid: parent }, categoryValidator.UUID)
        let subcategory = await getSubcategory(parent)
        return sendOK(res, { subcategory: subcategory })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/:categoryuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let categoryuuid = req.params["categoryuuid"] as string
    try {
        validateCgi({ uuid: categoryuuid }, categoryValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: categoryuuid,
            glob: categoryImgOpt.glob,
            tmpDir: categoryImgOpt.tmpDir,
            maxSize: categoryImgOpt.maxSize,
            extnames: categoryImgOpt.extnames,
            maxFiles: categoryImgOpt.maxFiles,
            targetDir: categoryImgOpt.targetDir,
            fieldName: categoryImgOpt.fieldName,
        })
        await modifilyPic(categoryuuid, newPath)
        return createdOk(res, { path: newPath })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:categoryuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: string = (req as any).body.mediaName
    let categoryuuid = req.params["categoryuuid"] as string
    try {
        validateCgi({ uuid: categoryuuid }, categoryValidator.UUID)
        mediaName = path.join(categoryImgOpt.targetDir, categoryuuid, mediaName)
        await removeAsync(mediaName)
        //更新到数据库
        await modifilyPic(categoryuuid, null)
        return deleteOK(res, { msg: "删除成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/category', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body: any = (req as any).body
    const { name, parentname } = body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRW() && !info.isRoot())
            return sendNoPerm(res)
        validateCgi({ name: name, parentname: parentname }, categoryValidator.typaname)
        let category = await getByName(parentname, null)
        if (!category)
            category = await insert(parentname, undefined)
        let subcategory = await getByName(name, category.uuid)
        if (!subcategory) {
            subcategory = await insert(name, category.uuid)
        }
        return sendOK(res, { category: category, subcategory: subcategory })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, categoryValidator.UUID)
        let subcategory = await findByPrimary(uuid)
        return sendOK(res, { subcategory: subcategory })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch("/position", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { positions } = (req as any).body
    positions = JSON.parse(positions)
    try {
        for (let i = 0; i < positions.length; i++) {
            validateCgi({ position: parseInt(positions[i].order), uuid: positions[i].uuid }, categoryValidator.orderAndUuid)
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
    let { name } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRW() && !info.isRoot())
            return sendNoPerm(res)
        validateCgi({ uuid: uuid, name: name }, categoryValidator.updateName)
        let subcategory = await updateName(name, uuid)
        return sendOK(res, { subcategory: subcategory })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        const info: LoginInfo = (req as any).loginInfo
        validateCgi({ uuid: uuid }, categoryValidator.UUID)
        if (!info.isRoot())
            return sendNoPerm(res)
        let category = await findByPrimary(uuid)
        if (!category) {
            return sendOK(res, { category: "不存在该类" })
        }
        //判断是大类还是小类
        if (!category.parent) {//大类
            //删除大类，删除所对应的商品
            await deletegoods(uuid)
            //删除小类
            await deleteByCategory(uuid)
            //删除大类
            await deleteCategory(uuid)
        } else {
            //如果是小类，删除所对应的商品
            await deleteBySubcategory(uuid)
            //删除大类
            await deleteCategory(uuid)
        }
        return sendOK(res, { category: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//
router.post('/:subcategoryuuid/subimage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let subcategoryuuid = req.params["subcategoryuuid"] as string
    try {
        validateCgi({ uuid: subcategoryuuid }, categoryValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: subcategoryuuid,
            glob: subcategoryImgOpt.glob,
            tmpDir: subcategoryImgOpt.tmpDir,
            maxSize: subcategoryImgOpt.maxSize,
            extnames: subcategoryImgOpt.extnames,
            maxFiles: subcategoryImgOpt.maxFiles,
            targetDir: subcategoryImgOpt.targetDir,
            fieldName: subcategoryImgOpt.fieldName,
        })
        await modifilyPic(subcategoryuuid, newPath)
        return createdOk(res, { 'path': newPath })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/:subcategoryuuid/getsubimage',checkLogin,async function (req : Request, res: Response ,next:NextFunction){
    let subcategoryuuid = req.params["subcategoryuuid"];
    try{
        validateCgi({ uuid: subcategoryuuid }, categoryValidator.UUID)
        let re = await querycategorypic(subcategoryuuid);
        if(re){
            return sendOK(res,{'data' : re });
        }
        return sendOK(res,{'data' : 'null'});
    }catch(e){
        e.info(se,res,e);
    }
})
