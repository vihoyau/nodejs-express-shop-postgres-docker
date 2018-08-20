import { Router, Request, Response, NextFunction } from "express"
import { checkLogin, LoginInfo } from "../../redis/logindao"
export const router = Router()
import { sendOK, sendError as se, /*sendNotFound,*/ sendNoPerm, sendErrMsg, createdOk } from "../../lib/response"
import { validateCgi } from "../../lib/validator"
import { collectionValidator } from "./validator"
//创建收集道具活动
import {
    addcollection, find_ActivityName_Info, findByPrimary, updateCollectionActivity
    , deleteActivity, find_All_Activity
    , updatecollection, getCount, findColInfo, findimgByPrimary
    , findColInfo1, getCount1, createCardcollection, addcollectionimg
    , addcollectionjrayimg, addcollectionrewardImage, addcollectionbackimg, addcollectionprimaryimg,getisNoFortune,shutdown
} from "../../model/mall/collectioncreate"
import { collectionCoverImgOpt } from "../../config/resource"
import { uploadCollectionImage } from "../../lib/upload"
//创建收集活动信息
router.post('/collect', checkLogin, async function (req: Request, res: Response, next: NextFunction) {

    let { ActivityName, Tag, Starttime, Endtime, Point
        , Gooduuid, rewardmethod, cardIdAmounts, RedPacket, Couponid
        , goodtitle, Coupontitle, chipIdAmounts, Reward, ActivityRule, isNoFortune ,rewardNumber} = (req as any).body
    validateCgi({
        ActivityName: ActivityName, Tag: Tag
        , Starttime: Starttime, Endtime: Endtime
        , Point: Point, Gooduuid: Gooduuid, rewardmethod: rewardmethod
        , cardIdAmounts: cardIdAmounts, RedPacket: RedPacket
        , Couponid: Couponid, goodtitle: goodtitle, Coupontitle: Coupontitle
        , chipIdAmounts: chipIdAmounts, Reward: Reward
        , ActivityRule: ActivityRule, isNoFortune: isNoFortune
        ,rewardNumber:rewardNumber
    }, collectionValidator.add)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let tmp = {
            ActivityName: ActivityName,//活动名称
            Tag: Tag,//标签
            Starttime: Starttime,//开始时间
            Endtime: Endtime,//结束时间
            Point: Point,//奖励积分
            Gooduuid: Gooduuid,//商品URL
            RedPacket: RedPacket,//红包金额
            Couponid: Couponid,//优惠券URL
            goodtitle: goodtitle,//商品名称
            Coupontitle: Coupontitle,//优惠券名称
            CardIdAmounts: cardIdAmounts,//卡牌数量
            ChipIdAmounts: chipIdAmounts,//卡牌数量
            rewardmethod: rewardmethod,
            Reward: Reward,//奖励方式
            ActivityRule: ActivityRule,//活动
            isNoFortune: isNoFortune,//是否展示运势
            rewardNumber:rewardNumber//领奖人数
        }
        if (!Gooduuid) {
            delete tmp.Gooduuid
        }
        if (!Couponid) {
            delete tmp.Couponid
        }
        if (!Gooduuid && !Couponid) {
            delete tmp.Couponid
            delete tmp.Gooduuid
        }
        let ads_ActivityName = await find_ActivityName_Info()         //查找收集道具活动名称字段的所有值
        let num = ads_ActivityName.length

        for (let i = 0; i < num; i++) {
            if (tmp.ActivityName == ads_ActivityName[i].ActivityName)
                return sendErrMsg(res, "活动名称重复！", 409)
        }
        // validateCgi(tmp, advertiserValidator.advertiserInfo)
        let addcollections = await addcollection(tmp)
        return sendOK(res, addcollections)
    } catch (e) {
        e.info(se, res, e)
    }
})
//收集道具活动修改功能
router.post('/modify/informationbase', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, Tag, Starttime, Endtime
        , Point, Gooduuid, RedPacket, Couponid,  Coupontitle, goodtitle, rewardmethod, Reward, ActivityRule, isNoFortune,rewardNumber } = (req as any).body
    // validateCgi({
    //     ActivityName: ActivityName, Tag: Tag
    //     , Starttime: Starttime, Endtime: Endtime
    //     , Point: Point, Gooduuid: Gooduuid, rewardmethod: rewardmethod
    //     , cardIdAmounts: cardIdAmounts, RedPacket: RedPacket
    //     , Couponid: Couponid, goodtitle: goodtitle, Coupontitle: Coupontitle
    //     , chipIdAmounts: chipIdAmounts, Reward: Reward
    //     , ActivityRule: ActivityRule, isNoFortune: isNoFortune
    // }, collectionValidator.update)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let ads = await findByPrimary(uuid)   //查找活动
        //更新活动
            ads.Tag = Tag,
            ads.Starttime = Starttime,
            ads.Endtime = Endtime,
            ads.Point = Point,
            ads.Gooduuid = Gooduuid,
            ads.RedPacket = RedPacket,
            ads.Couponid = Couponid,
            ads.Coupontitle = Coupontitle,
            ads.goodtitle = goodtitle,
            ads.Reward = Reward,
            ads.rewardmethod = rewardmethod,
            ads.ActivityRule = ActivityRule,
            ads.isNoFortune=isNoFortune,
            ads.rewardNumber=rewardNumber
        if (!Gooduuid) {
            delete ads.Gooduuid
        }
        if (!Couponid) {
            delete ads.Couponid
        }
        if (!Gooduuid && !Couponid) {
            delete ads.Couponid
            delete ads.Gooduuid
        }
        // let ads_ActivityName = await find_ActivityName_Info()         //查找收集道具所有活动名字字段的所有值
        // let num = ads_ActivityName.length
        // for (let i = 0; i < num; i++) {
        //     if (ads.ActivityName == ads_ActivityName[i].ActivityName)
        //         return sendErrMsg(res, "活动名重复！", 409)
        // }
        let update = await updateCollectionActivity(ads, ads.uuid)
        return sendOK(res, update)
    } catch (e) {
        e.info(se, res, e)
    }
})
//收集道具活动删除功能
router.post('/delete', checkLogin, async function (req: Request, res: Response, next: NextFunction) {

    let { uuid } = (req as any).body
    validateCgi({ uuid }, collectionValidator.del)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        await deleteActivity(uuid)   //删除活动
        return sendOK(res, { "data": "deleteOk" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//收集道具活动查看所有的活动管理功能
router.get('/selectAll', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const info: LoginInfo = (req as any).loginInfo
        //              validateCgi({ uuid: uuid }, advertiserValidator.UUID)
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let ac_ext = await find_All_Activity()
        return sendOK(res, { ac_ext: ac_ext })            //返回ac_ext的信息
    } catch (e) {
        e.info(se, res, e);
    }
})
//一键激活
router.post('/update', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, Starttime, Endtime } = (req as any).body
    // validateCgi({ uuid, Starttime, Endtime }, collectionValidator.restart)
    try {
        let tmp = {
            uuid: uuid,
            Starttime: Starttime,
            Endtime: Endtime
        }
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let updatecollections = await updatecollection(tmp)
        return sendOK(res, updatecollections)
    } catch (e) {
        e.info(se, res, e)
    }
})
//crm展示
router.get("/collectionInfo", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length, search, State } = req.query
    // validateCgi({ start, length, searchdata: search, Statedata: State }, collectionValidator.view)
    try {
        let searchdata = (search as any).value
        let Statedata = State
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let obj = {}
        obj = {
            $or: [
                { ActivityName: { $like: '%' + searchdata + '%' } },
                { Tag: { $like: '%' + searchdata + '%' } }
            ], State: Statedata
        }
        let obj1 = {}
        obj1 = {
            $or: [
                { ActivityName: { $like: '%' + searchdata + '%' } },
                { Tag: { $like: '%' + searchdata + '%' } }
            ]
        }
        if (!Statedata) {
            let recordsFiltered = await getCount1(searchdata)
            let collection = await findColInfo1(obj1, parseInt(start), parseInt(length))
            return sendOK(res, { collection: collection, recordsFiltered: recordsFiltered })
        } else {
            let recordsFiltered = await getCount(searchdata, Statedata)
            let collection = await findColInfo(obj, parseInt(start), parseInt(length))
            return sendOK(res, { collection: collection, recordsFiltered: recordsFiltered })
        }
    } catch (e) {
        e.info(se, res, e)
    }
})
//卡牌图片上传
router.post('/:uuid/:index/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let uuid = req.params["uuid"];
    let index = req.params["index"];
    // let index=1
    // let uuid='e0534c14-4eca-40c7-907f-54532ba571ae'
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    try {
        let newPath = await uploadCollectionImage(req, {
            uuid: uuid,
            glob: collectionCoverImgOpt.glob,
            tmpDir: collectionCoverImgOpt.tmpDir,
            maxSize: collectionCoverImgOpt.maxSize,
            extnames: collectionCoverImgOpt.extnames,
            maxFiles: collectionCoverImgOpt.maxFiles,
            targetDir: collectionCoverImgOpt.targetDir,
            fieldName: collectionCoverImgOpt.fieldName
        })
        let col = await findimgByPrimary(uuid)
        // col.Images = col.Images == null ? [] :col.Images
        if (!col.Images) {
            switch (col.CardIdAmounts) {
                case 5: col.Images = [0, 0, 0, 0, 0]
                    break
                case 6: col.Images = [0, 0, 0, 0, 0, 0]
                    break
                case 7: col.Images = [0, 0, 0, 0, 0, 0, 0]
                    break
                case 8: col.Images = [0, 0, 0, 0, 0, 0, 0, 0]
                    break
                case 9: col.Images = [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    break
                case 10: col.Images = [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    break
            }
            let img = col.Images
            img[index] = newPath
            await addcollectionimg(img, uuid)
            return createdOk(res, { path: newPath, pics: col.Images })
        } else {
            let img = col.Images
            img[index] = newPath
            await addcollectionimg(img, uuid)
            return createdOk(res, { path: newPath, pics: col.Images })
        }

    } catch (e) {
        e.info(se, res, e)
    }
})

//活动创建2
router.post('/collectedcre', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, Filename, cardProbability, chipProbability } = (req as any).body
    // validateCgi({ uuid, Filename, cardProbability, chipProbability }, collectionValidator.add1)
    try {
        let tmp = {
            uuid: uuid,
            Filename: (JSON.parse(Filename)),
            // Filename: Filename,
            //  CardProbability: cardProbability,
            // ChipProbability:  chipProbability
            CardProbability: (JSON.parse(cardProbability)),
            ChipProbability: (JSON.parse(chipProbability))
        }
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let createCardcollections = await createCardcollection(tmp)
        return sendOK(res, createCardcollections)
    } catch (e) {
        e.info(se, res, e)
    }
})
//收集道具活动卡牌修改功能
router.post('/modify/informationcard', checkLogin, async function (req: Request, res: Response, next: NextFunction) {

    let { uuid, cardProbability, chipProbability
        , Filename } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let ads = await findByPrimary(uuid)   //查找活动
        //更新活动
        ads.CardProbability = (JSON.parse(cardProbability)),
            ads.ChipProbability = (JSON.parse(chipProbability)),
            ads.Filename = (JSON.parse(Filename)),
            await updateCollectionActivity(ads, ads.uuid)
        return sendOK(res, { "data": "收集道具活动信息修改成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})
//卡牌图片上传修改
router.post('/:uuid/:index/jrayimage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let uuid = req.params["uuid"];
    let index = req.params["index"];
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    try {
        let newPath = await uploadCollectionImage(req, {
            uuid: uuid,
            glob: collectionCoverImgOpt.glob,
            tmpDir: collectionCoverImgOpt.tmpDir,
            maxSize: collectionCoverImgOpt.maxSize,
            extnames: collectionCoverImgOpt.extnames,
            maxFiles: collectionCoverImgOpt.maxFiles,
            targetDir: collectionCoverImgOpt.targetDir,
            fieldName: collectionCoverImgOpt.fieldName
        })
        let col = await findimgByPrimary(uuid)
        if (!col.jrayImages) {
            switch (col.CardIdAmounts) {
                case 5: col.jrayImages = [0, 0, 0, 0, 0]
                    break
                case 6: col.jrayImages = [0, 0, 0, 0, 0, 0]
                    break
                case 7: col.jrayImages = [0, 0, 0, 0, 0, 0, 0]
                    break
                case 8: col.jrayImages = [0, 0, 0, 0, 0, 0, 0, 0]
                    break
                case 9: col.jrayImages = [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    break
                case 10: col.jrayImages = [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    break
            }
            let img = col.jrayImages
            img[index] = newPath
            await addcollectionjrayimg(img, uuid)
            return createdOk(res, { path: newPath, pics: col.jrayImages })
        } else {
            let img = col.jrayImages
            img[index] = newPath
            await addcollectionjrayimg(img, uuid)
            return createdOk(res, { path: newPath, pics: col.jrayImages })
        }
    } catch (e) {
        e.info(se, res, e)
    }
})


//奖励图片上传修改
router.post('/:uuid/rewardImage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let uuid = req.params["uuid"];
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    try {
        let newPath = await uploadCollectionImage(req, {
            uuid: uuid,
            glob: collectionCoverImgOpt.glob,
            tmpDir: collectionCoverImgOpt.tmpDir,
            maxSize: collectionCoverImgOpt.maxSize,
            extnames: collectionCoverImgOpt.extnames,
            maxFiles: collectionCoverImgOpt.maxFiles,
            targetDir: collectionCoverImgOpt.targetDir,
            fieldName: collectionCoverImgOpt.fieldName
        })
        let col = await findimgByPrimary(uuid)
        let img = col.rewardImages
        img = newPath
        await addcollectionrewardImage(img, uuid)
        return createdOk(res, { path: newPath, pics: col.rewardImages })

    } catch (e) {
        e.info(se, res, e)
    }
})
//奖励图片上传修改
router.post('/:uuid/backImage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let uuid = req.params["uuid"];
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    try {
        let newPath = await uploadCollectionImage(req, {
            uuid: uuid,
            glob: collectionCoverImgOpt.glob,
            tmpDir: collectionCoverImgOpt.tmpDir,
            maxSize: collectionCoverImgOpt.maxSize,
            extnames: collectionCoverImgOpt.extnames,
            maxFiles: collectionCoverImgOpt.maxFiles,
            targetDir: collectionCoverImgOpt.targetDir,
            fieldName: collectionCoverImgOpt.fieldName
        })
        let col = await findimgByPrimary(uuid)

        let img = col.backImages
        img = newPath
        await addcollectionbackimg(img, uuid)
        return createdOk(res, { path: newPath, pics: col.rewardImages })
    } catch (e) {
        e.info(se, res, e)
    }
})
//奖励图片上传修改
router.post('/:uuid/primaryImage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let uuid = req.params["uuid"];
    // validateCgi({ uuid }, collectionValidator.UUID)
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    try {
        let newPath = await uploadCollectionImage(req, {
            uuid: uuid,
            glob: collectionCoverImgOpt.glob,
            tmpDir: collectionCoverImgOpt.tmpDir,
            maxSize: collectionCoverImgOpt.maxSize,
            extnames: collectionCoverImgOpt.extnames,
            maxFiles: collectionCoverImgOpt.maxFiles,
            targetDir: collectionCoverImgOpt.targetDir,
            fieldName: collectionCoverImgOpt.fieldName
        })
        let col = await findimgByPrimary(uuid)
        let img = col.primaryImages
        img = newPath
        await addcollectionprimaryimg(img, uuid)
        return createdOk(res, { path: newPath, pics: col.rewardImages })
    } catch (e) {
        e.info(se, res, e)
    }
})
//运势开关
router.post('/isNoFortune', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { isNoFortune,uuid } = (req as any).body
    // validateCgi({ uuid, Starttime, Endtime }, collectionValidator.restart)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let isNoFortunes = await getisNoFortune(isNoFortune,uuid)
        return sendOK(res, isNoFortunes)
    } catch (e) {
        e.info(se, res, e)
    }
})
//中途关闭活动
router.post('/shutdown', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid } = (req as any).body
    // validateCgi({ uuid, Starttime, Endtime }, collectionValidator.restart)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let Endtime="2038-01-06 23:52:59"
        let Starttime="2038-02-06 23:52:59"
        let stop = await shutdown(uuid,Endtime,Starttime)
        return sendOK(res, stop)
    } catch (e) {
        e.info(se, res, e)
    }
})