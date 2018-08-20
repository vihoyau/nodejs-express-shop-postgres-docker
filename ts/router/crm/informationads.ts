import { validateCgi } from "../../lib/validator"
import { infoValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, createdOk, deleteOK, sendNoPerm, sendErrMsg } from "../../lib/response"
import { removeAsync, listFilesAsync } from "../../lib/fs"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { uploadAdsImage, uploadAdsMovie, uploadinfoImage } from "../../lib/upload"
import { findByPrimary as advertiserFindByPrimary/* , finddailybudgetByuuid */ } from "../../model/ads/advertiser"
import { timestamps } from "../../config/winston"
import {
    getCount, getCount2, getByCompany, getByAdvertiseruuid, insertInfoAds, updateByUuid, delet, findByPrimarys, modifilyCoverpic,
    modifilyPics, modifilyVideo, addPointsBalance
} from "../../model/ads/informationads"
import { querycrmcomment, queryCountcrmcommnet, updatePendingcomment } from "../../model/ads/infocomment"
import { findByPrimary as usersExtFindByPrimary } from "../../model/users/users_ext"
import { findByPrimary } from "../../model/ads/crmuser"
import { createInfoCate, delInfoCate, updateInfoCate, getAllInfoCate } from "../../model/ads/informationcategory"
import { infoCoverImgOpt, infoImgOpt, infoMovOpt, infoCateImgOpt } from "../../config/resource"

import * as path from "path"
export const router = Router()

//新建一个资讯类
router.post('/category', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { name, pic, position } = (req as any).body
    validateCgi({ name, pic, position }, infoValidator.newInfoCate)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await createInfoCate({ name, pic, position })
        return sendOK(res, { msg: "创建成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//上传资讯类图片
router.post('/catePic', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let newPath = await uploadinfoImage(req, {
            glob: infoCateImgOpt.glob,
            tmpDir: infoCateImgOpt.tmpDir,
            maxSize: infoCateImgOpt.maxSize,
            extnames: infoCateImgOpt.extnames,
            maxFiles: infoCateImgOpt.maxFiles,
            targetDir: infoCateImgOpt.targetDir,
            fieldName: infoCateImgOpt.fieldName,
        })
        return createdOk(res, { path: newPath })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除资讯类图片
router.delete('/delInfoCataPic', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, mediaName } = (req as any).body
    try {
        mediaName = path.join(infoCateImgOpt.targetDir, mediaName)
        await removeAsync(mediaName)
        await updateInfoCate(uuid, { pic: "" })
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除一个资讯类
router.delete("/info", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid } = (req as any).body
    validateCgi({ adsuuid: uuid }, infoValidator.UUID)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await delInfoCate(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//修改一个资讯类
router.put("/updateInfoCate", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, name, pic, position } = (req as any).body
    validateCgi({ uuid, name, pic, position }, infoValidator.updateInfoCate)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await updateInfoCate(uuid, { name, pic, position })
        return sendOK(res, { msg: "修改成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//修改一个资讯类下标
router.put("/updatePosition", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, position } = (req as any).body
    validateCgi({ uuid, position }, infoValidator.updatePositon)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await updateInfoCate(uuid, { position })
        return sendOK(res, { msg: "修改成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查询全部的资讯类，量少不做分页
router.get("/infoCate", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let arr = await getAllInfoCate()
    return sendOK(res, { arr })
})

//查看资讯
router.get('/info', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { adtype, state, start, length, draw, search } = req.query

    state = state ? state : ""
    adtype = adtype ? adtype : ""

    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdsRO() || loginInfo.isAdsRW()) {
            return sendNoPerm(res)
        }
        let searchdata = (search as any).value
        if (loginInfo.isRoot()) {
            validateCgi({ start: start, length: length, searchdata: undefined }, infoValidator.pagination)
            let company = undefined
            let recordsFiltered = await getCount(res.app.locals.sequelize, searchdata, state, company)
            let ads = await getByCompany(req.app.locals.sequelize, searchdata, state, company, parseInt(start), parseInt(length))
            ads.forEach(r => {
                r.created = timestamps(r.created)
            })
            return sendOK(res, { ads: ads, draw: draw, recordsFiltered: recordsFiltered })
        } else {
            validateCgi({ start: start, length: length, searchdata: undefined }, infoValidator.pagination)
            let advertiseruuid = new Array()
            let advertiser
            let crmUser = await findByPrimary(loginInfo.getUuid());
            if (crmUser.mgruuids) {
                for (let i = 0; i < crmUser.mgruuids.length; i++) {
                    advertiser = await advertiserFindByPrimary(crmUser.mgruuids[i])
                    if (advertiser) {
                        advertiseruuid.push(advertiser.uuid)
                    }
                }
            }

            let recordsFiltered = await getCount2(res.app.locals.sequelize, searchdata, state, advertiseruuid)
            let ads = await getByAdvertiseruuid(req.app.locals.sequelize, searchdata, state, advertiseruuid, parseInt(start), parseInt(length))
            ads.forEach(r => {
                r.created = timestamps(r.created)
            })
            return sendOK(res, { ads: ads, draw: draw, recordsFiltered: recordsFiltered })
        }
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//预先 增加一条资讯
router.post('/ads', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (!loginInfo.isAdvertiserRW()) {
            return sendNoPerm(res)
        }

        let crmUser = await findByPrimary(loginInfo.getUuid())
        if (!crmUser.mgruuids) {
            return sendNoPerm(res)
        }

        if (!crmUser.mgruuids[0]) {
            return sendNoPerm(res)
        }

        let company = null
        let advertiseruuid = null
        if (crmUser.mgruuids && crmUser.mgruuids.length > 0) {
            let advertiser = null
            for (let i = 0; i < crmUser.mgruuids.length; i++) {
                advertiser = await advertiserFindByPrimary(crmUser.mgruuids[i])
                if (advertiser)
                    break
            }
            if (!advertiser)
                return sendErrMsg(res, "找不到广告商", 500)

            company = advertiser.company
            advertiseruuid = advertiser.uuid
            let adss = await insertInfoAds(req.app.locals.sequelize, company, crmUser.username, advertiseruuid)
            return createdOk(res, adss)
        }
        return sendErrMsg(res, "找不到广告商", 500)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//修改资讯
router.put('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body: any = (req as any).body
    let uuid = req.params["uuid"]
    let { title, content, sumcontent, address, addressinfo, balance, addbalance,
        question_ext, nice, low, category, coverpic, adsinfourl,
        points, addpoints, pics, video, mold, banner, pic_mode } = body

    let state = 'wait-ack'
    addpoints = addpoints ? addpoints : 0
    addbalance = addbalance ? addbalance : 0
    points = points ? points : 0
    balance = balance ? balance : 0
    pics = pics ? pics : "[]"
    video = video ? video : "[]"
    question_ext = question_ext ? question_ext : "{}"
    coverpic = coverpic ? coverpic : "[]"
    address = address ? address : "{}"
    nice = nice ? nice : 0
    low = low ? low : 0
    banner = banner ? banner : 'off'
    pic_mode = pic_mode ? pic_mode : 'big'
    addressinfo = addressinfo ? addressinfo : "default"
    adsinfourl = adsinfourl ? adsinfourl : "default"
    mold = mold ? mold : "balance"

    validateCgi({
        uuid, title, category, content, addressinfo, adsinfourl,
        points, addpoints, addbalance, nice, low, sumcontent, mold, banner, pic_mode
    }, infoValidator.infoUpdate)

    try {
        const loginInfo: LoginInfo = (req as any).loginInfo

        let ads = {
            state,
            title,
            content,
            sumcontent,
            pics: JSON.parse(pics),
            video: JSON.parse(video),
            category,
            coverpic: JSON.parse(coverpic),
            address: JSON.parse(address),
            addressinfo,
            question_ext: JSON.parse(question_ext),
            points: parseInt(points),
            adsinfourl: adsinfourl,
            balance: parseFloat(balance),
            nice: parseInt(nice),
            low: parseInt(low),
            banner,
            pic_mode,
            mold
        }
        if (!loginInfo.isAdvertiserRW())
            return sendNoPerm(res)

        let info = await updateByUuid(ads, uuid)
        let advertiser = await advertiserFindByPrimary(info.advertiseruuid)
        let crmuser = await findByPrimary(advertiser.crmuuid)
        let user_ext = await usersExtFindByPrimary(crmuser.uuid)

        addbalance = parseFloat(addbalance)
        addpoints = parseFloat(addpoints)

        if (addbalance > 0 || addpoints > 0) {
            if (user_ext.crm_balance > (addbalance * 100) && user_ext.crm_points > addpoints)//给这个资讯增加总零钱，扣减广告商的积分和零钱
                await addPointsBalance(req.app.locals.sequelize, uuid, addbalance, addpoints, user_ext.uuid)
            else
                return sendErrMsg(res, "零钱积分不足", 501)
        }

        return createdOk(res, info)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除一个资讯
router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const infouuid: string = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo

        validateCgi({ adsuuid: infouuid }, infoValidator.UUID)

        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }
        await delet(infouuid)
        return sendOK(res, { ads: "succ" })
    } catch (e) {
        return deleteOK(res, e)
    }
})

//审核一个资讯，审核通过则直接能再app看到，不用再自行投放
router.patch('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body: any = (req as any).body
    let { state, rejectmsg } = body
    let uuid = req.params["uuid"]
    rejectmsg = rejectmsg ? rejectmsg : ""
    validateCgi({ adsuuid: uuid, state, rejectmsg }, infoValidator.adsState)

    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO())
            return sendNoPerm(res)

        let ads = rejectmsg ? { state, rejectmsg } : { state }

        let adss = await updateByUuid(ads, uuid)
        return createdOk(res, adss)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//上传资讯封面图片
router.post('/:infouuid/:index/coverimage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let infouuid = req.params['infouuid'] as string;
    let index: any = req.params['index']; index = parseInt(index)  //上传的位置，in(0, 1, 2)

    try {
        let newPath = await uploadAdsImage(req, {
            uuid: infouuid,
            glob: infoCoverImgOpt.glob,
            tmpDir: infoCoverImgOpt.tmpDir,
            maxSize: infoCoverImgOpt.maxSize,
            extnames: infoCoverImgOpt.extnames,
            maxFiles: infoCoverImgOpt.maxFiles,
            targetDir: infoCoverImgOpt.targetDir,
            fieldName: infoCoverImgOpt.fieldName
        })
        let info = await findByPrimarys(infouuid)

        info.coverpic = info.coverpic == null ? [] : info.coverpic
        info.coverpic.splice(index, 0, newPath)  //把图片路径插到指定的index
        await modifilyCoverpic(infouuid, info.coverpic)
        return createdOk(res, { path: newPath, pics: info.coverpic })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除资讯封面图片
router.delete('/:infouuid/coverimage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO())
        return sendNoPerm(res)

    let mediaName: string = (req as any).body.mediaName
    let infouuid = req.params["infouuid"] as string
    try {
        mediaName = path.join(infoCoverImgOpt.targetDir, infouuid, mediaName)
        await removeAsync(mediaName)
        let info = await findByPrimarys(infouuid)
        let coverArr = []

        for (let i = 0; i < info.coverpic.length; i++) {
            if (-1 == mediaName.indexOf(info.coverpic[i].split('/')[1])) {
                coverArr.push(info.coverpic[i])
            }
        }
        //更新到数据库
        await modifilyCoverpic(infouuid, coverArr)
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除资讯图片
router.delete('/:infouuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO())
        return sendNoPerm(res)

    let { mediaName, sumcontent } = (req as any).body
    let infouuid = req.params["infouuid"] as string
    try {
        mediaName = path.join(infoImgOpt.targetDir, infouuid, mediaName)
        await removeAsync(mediaName)
        let info = await findByPrimarys(infouuid)
        let Arr = []

        for (let i = 0; i < info.pics.length; i++) {
            if (-1 == mediaName.indexOf(info.pics[i].split('/')[1])) {
                Arr.push(info.pics[i])
            }
        }
        //更新到数据库
        await updateByUuid({ pics: Arr, sumcontent }, infouuid)
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//上传资讯图片
router.post('/:infouuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let infouuid = req.params["infouuid"] as string
    try {
        validateCgi({ adsuuid: infouuid }, infoValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: infouuid,
            glob: infoImgOpt.glob,
            tmpDir: infoImgOpt.tmpDir,
            maxSize: infoImgOpt.maxSize,
            extnames: infoImgOpt.extnames,
            maxFiles: infoImgOpt.maxFiles,
            targetDir: infoImgOpt.targetDir,
            fieldName: infoImgOpt.fieldName,
        })
        let info = await findByPrimarys(infouuid)

        info.pics = info.pics ? info.pics : []
        info.pics.push(newPath)
        await modifilyPics(infouuid, info.pics)
        return createdOk(res, { path: newPath, pics: info.pics })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//上传资讯视频
router.post('/:infouuid/movie', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let infouuid = req.params["infouuid"] as string
    try {
        validateCgi({ adsuuid: infouuid }, infoValidator.UUID)
        let newPath = await uploadAdsMovie(req, {
            uuid: infouuid,
            glob: infoMovOpt.glob,
            tmpDir: infoMovOpt.tmpDir,
            maxSize: infoMovOpt.maxSize,
            extnames: infoMovOpt.extnames,
            maxFiles: infoMovOpt.maxFiles,
            targetDir: infoMovOpt.targetDir,
            fieldName: infoMovOpt.fieldName,
        })
        let info = await findByPrimarys(infouuid)

        info.video = info.video ? info.video : []
        info.video.push(newPath)
        let infoo = await modifilyVideo(infouuid, info.video)
        return createdOk(res, { path: newPath, infoo })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//获得资讯视频列表
router.get('/:infouuid/movie', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    return listAdsFiles(req, res, infoMovOpt)
})

//获得资讯图片列表
router.get('/:infouuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    return listAdsFiles(req, res, infoImgOpt)
})

async function listAdsFiles(req: Request, res: Response, opt: any) {
    let infouuid = req.params["infouuid"] as string
    try {
        validateCgi({ adsuuid: infouuid }, infoValidator.UUID)
        let pattern = path.join(opt.targetDir, infouuid, opt.glob)
        let files = await listFilesAsync(pattern)

        for (let i = 0; i < files.length; i++) {
            files[i] = files[i].substr(opt.targetDir.length + 1)
        }
        return sendOK(res, { files: files })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
}

//删除资讯视频
router.delete('/:infouuid/movie', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: any = (req as any).body.mediaName
    let infouuid = req.params["infouuid"] as string
    try {
        validateCgi({ adsuuid: infouuid }, infoValidator.UUID)
        mediaName = path.join(infoMovOpt.targetDir, infouuid, mediaName)
        await removeAsync(mediaName)
        await modifilyVideo(infouuid, null)
        return sendOK(res, { msg: 'succ' })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看资讯的未审核的评论
router.get('/commentinfo', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo
    let { start, length, state } = (req as any).query
    let commentarr = []
    try {
        if (loginInfo.isAdsRO || loginInfo.isAdsRW || loginInfo.isRoot || loginInfo.isAdminRW || loginInfo.isAdminRO) {
            let com = await querycrmcomment(req.app.locals.sequelize, start, length, state)
            let recordsFiltered = await queryCountcrmcommnet(req.app.locals.sequelize, state)
            for (let j = 0; j < com.length; j++) {
                com[j].created = timestamps(com[j].created)
                let e = com[j].state
                if (e == 'new') {
                    com[j].state = '待审核'
                } else if (e == 'on') {
                    com[j].state = '已通过'
                } else if (e == 'rejected') {
                    com[j].state = '未通过'
                } else if (e == 'replied') {
                    com[j].state = '已回复'
                }
            }
            commentarr.push(com)
            return sendOK(res, { data: commentarr, recordsFiltered: parseInt(recordsFiltered) });
        } else
            return sendNoPerm(res)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//审核评论
router.post('/pending', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let { commentuuid, state, rejectcontent } = (req as any).body
    try {
        validateCgi({ commentuuid, state, rejectcontent }, infoValidator.pending)

        if (loginInfo.isRoot || loginInfo.isAdminRW || loginInfo.isAdsRW) {
            await updatePendingcomment(commentuuid, state, rejectcontent);
            return sendOK(res, { 'data': 'succ' })
        } else
            return sendNoPerm(res)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})