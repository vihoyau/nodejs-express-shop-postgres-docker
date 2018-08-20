import { validateCgi } from "../../lib/validator"
import { adsValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, createdOk, deleteOK, sendNoPerm, sendErrMsg } from "../../lib/response"
import { removeAsync, listFilesAsync } from "../../lib/fs"
import { queryunitone } from "../../model/puton/unit"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { uploadAdsImage, uploadAdsMovie } from "../../lib/upload"
import {
    queryPutonadsByuuid, updatePutonads, getByCompany, delet, findByPrimary as getByUuid, updateHeat,
    modifilyCoverpic, updateCommentAds, commentedads, encommentedlist, encommentedads, adsTop, getCrmHot,
    updateHotAdsPosition, getCrmHotCount, updateByUuid, insertAds, getCount, deleteBanner, updateBanner,
    getBanner, modifilyPics, findByPrimary as findByPrimarys, modifilyVideo, queryBalanceByadsuuid, queryBidByadsuuid,
    updateBalanceByadsuuid
} from "../../model/ads/ads"
import { upateVirtviews, findByPrimary as findViews } from "../../model/ads/ads_ext"
import { findByPrimary, inserMgruuids } from "../../model/ads/crmuser"
import { findByPrimary as advertiserFindByPrimary, finddailybudgetByuuid, /*findByCompany */} from "../../model/ads/advertiser"
import { adsImgOpt, adsMovOpt, adsCoverImgOpt } from "../../config/resource"
import { timestamps } from "../../config/winston"
import { queryadvertiserByadsuuid, updateAdsCommentsort, updateadsStatus, queryplanunitByadsuuid, queryunitByadauuid } from "../../model/ads/ads"
import { checkads } from "../../router/app/ads"
import { findByPrimary as usersExtFindByPrimary } from "../../model/users/users_ext"
import { insertBeforePutonads, addPointsBalance } from "../../model/ads/ads"
import { queryplanByunituuid, queryunitByadsuuid } from "../../model/puton/unit"
import { operationAcount } from "../../router/crm/adsoperation"
import { deleteadsByadsuuid } from "../../model/ads/adsoperation"
import * as path from "path"
export const router = Router()

//取消推荐广告（推荐页）
router.put("/encommentads/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params["uuid"]
        validateCgi({ adsuuid: uuid }, adsValidator.UUID)
        let ads = await encommentedads(req.app.locals.sequelize, uuid)
        return sendOK(res, { ads: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

//设为推荐广告（推荐页）
router.put("/commentads/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params["uuid"]
        const { category, subcategory } = (req as any).body
        validateCgi({ uuid: uuid, category: category, subcategory: subcategory }, adsValidator.commetads)
        let ads = await commentedads(req.app.locals.sequelize, category, subcategory, uuid)
        return sendOK(res, { ads: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改推荐广告排列位置
router.patch("/commentads", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { rise, drop } = (req as any).body
        validateCgi({ uuid: drop }, adsValidator.uuid)
        validateCgi({ uuid: rise, }, adsValidator.uuid)
        await updateCommentAds(req.app.locals.sequelize, rise, drop)
        return sendOK(res, { ads: '修改成功！' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//推荐广告列表（推荐页）
router.get("/commentlist",/*  checkLogin, */ async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { subcategory } = (req as any).query
        validateCgi({ adsuuid: subcategory }, adsValidator.UUID)
        let ads = await encommentedlist(subcategory)
        ads.forEach(r => {
            r.balance = r.balance
            r.totalbalance = r.totalbalance
            r.allbalance = r.allbalance
            r.created = timestamps(r.created)
            r.tsrange[0] = timestamps(r.tsrange[0])
            r.tsrange[1] = timestamps(r.tsrange[1])
            r.Ncommentcount = r.ncommentcount
        })
        return sendOK(res, { ads: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

/*insert 废弃*/
router.post('/ads', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }

        let crmUser = await findByPrimary(loginInfo.getUuid())
        if (loginInfo.isAdsRW() && !crmUser.mgruuids) {
            return sendNoPerm(res)
        }

        if (loginInfo.isAdsRW() && !crmUser.mgruuids[0]) {
            return sendNoPerm(res)
        }

        let company = null
        let advertiseruuid = null
        if (crmUser.mgruuids && crmUser.mgruuids.length > 0) {
            let advertiser = await advertiserFindByPrimary(crmUser.mgruuids[0])
            if (!advertiser)
                return sendErrMsg(res, "找不到广告商", 500)

            company = advertiser.company
            advertiseruuid = advertiser.uuid

            let adss = await insertAds(req.app.locals.sequelize, company, crmUser.username, advertiseruuid)
            return createdOk(res, { adss: adss.dataValues })
        }

        return sendErrMsg(res, "找不到广告商", 500)
    } catch (e) {
        e.info(se, res, e)
    }
})



/* GET ads by. */
router.get('/ads', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { adtype, state, subtype, start, length, draw, search } = req.query

    state = state ? state : ""
    adtype = adtype ? adtype : ""
    subtype = subtype ? subtype : ""

    try {
        let searchdata = (search as any).value
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isRoot()) {
            validateCgi({ start: start, length: length, searchdata: undefined }, adsValidator.pagination)
            let advertiseruuids = undefined
            let recordsFiltered = await getCount(res.app.locals.sequelize, searchdata, state, advertiseruuids)
            let ads = await getByCompany(req.app.locals.sequelize, searchdata, state, advertiseruuids, parseInt(start), parseInt(length))
            for (let i = 0; i < ads.length; i++) {
                ads[i].created = timestamps(ads[i].created)

                if (ads[i].tsrange != undefined && ads[i].tsrange.length != 0) {
                    ads[i].tsrange[0] = timestamps(ads[i].tsrange[0])
                    ads[i].tsrange[1] = timestamps(ads[i].tsrange[1])
                }
            }
            return sendOK(res, { ads: ads, draw: draw, recordsFiltered: recordsFiltered })
        } else {
            validateCgi({ start: start, length: length, searchdata: undefined }, adsValidator.pagination)
            let advertiseruuids = new Array()
            let crmUser = await findByPrimary(loginInfo.getUuid());
            if (crmUser.mgruuids) {
                for (let i = 0; i < crmUser.mgruuids.length; i++) {
                    advertiseruuids.push(crmUser.mgruuids[i])
                }
            }

            if (loginInfo.isAdsRO() && !advertiseruuids[0]) {
                return sendNoPerm(res)
            }

            if (loginInfo.isAdsRW() && !advertiseruuids[0]) {
                return sendNoPerm(res)
            }
            let recordsFiltered = await getCount(res.app.locals.sequelize, searchdata, state, advertiseruuids)
            let ads = await getByCompany(req.app.locals.sequelize, searchdata, state, advertiseruuids, parseInt(start), parseInt(length))

            for (let i = 0; i < ads.length; i++) {
                ads[i].created = timestamps(ads[i].created)

                if (ads[i].tsrange != undefined && ads[i].tsrange.length != 0) {
                    ads[i].tsrange[0] = timestamps(ads[i].tsrange[0])
                    ads[i].tsrange[1] = timestamps(ads[i].tsrange[1])
                }
            }
            return sendOK(res, { ads: ads, draw: draw, recordsFiltered: recordsFiltered })
        }


    } catch (e) {
        e.info(se, res, e)
    }
})

//获取banner图
router.get('/banner', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let ads = await getBanner()
        ads.forEach(ads => ads.created = timestamps(ads.created))
        return sendOK(res, { banner: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

//设置广告的position
router.put('/position/:adsuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let { position } = (req as any).body
        let adsuuid = req.params["adsuuid"]
        await updateByUuid({ position }, adsuuid)
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

router.put('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body: any = (req as any).body
    let uuid = req.params["uuid"]
    const { title, adtypeuuid, content, sumcontent, typedesc, addressinfo, keyword, address,
        balance, totalbalance, question, question_ext, option, answer, bonushint,
        nice, low, subtypeuuid, hot, mold, adsinfourl, points, totalpoint, tsrange,
        pics, video, virtviews, gooduuid, goodtitle } = body

    try {

        const loginInfo: LoginInfo = (req as any).loginInfo
        if (virtviews == undefined) {
            validateCgi({
                adsuuid: uuid,
                title: title,
                adtypeuuid: adtypeuuid,
                subtypeuuid: subtypeuuid,
                typedesc: typedesc,
                address: address,
                addressinfo: addressinfo,
                question: question,
                question_ext: question_ext,
                answer: answer,
                tsrange: tsrange,
                keyword: keyword,
                bonushint: bonushint,
                points: points,
                totalpoint: totalpoint,
                nice: parseInt(nice),
                low: parseInt(low)
            }, adsValidator.adsinfo)
        } else {
            validateCgi({
                adsuuid: uuid,
                title: title,
                adtypeuuid: adtypeuuid,
                subtypeuuid: subtypeuuid,
                typedesc: typedesc,
                address: address,
                addressinfo: addressinfo,
                question: question,
                question_ext: question_ext,
                answer: answer,
                tsrange: tsrange,
                keyword: keyword,
                bonushint: bonushint,
                points: points,
                totalpoint: totalpoint,
                virtviews: parseInt(virtviews),
                nice: parseInt(nice),
                low: parseInt(low),
            }, adsValidator.adsinfo)

        }

        let ads = {
            state: 'new',
            title: title,
            content: content,
            sumcontent: sumcontent,
            pics: JSON.parse(pics),
            video: JSON.parse(video),
            category: adtypeuuid,
            subcategory: subtypeuuid,
            typedesc: typedesc,
            address: address,
            newaddress: address,
            addressinfo: addressinfo,
            question: { question: question, option: JSON.parse(option), answer: answer, bonushint: bonushint },
            question_ext: JSON.parse(question_ext),
            keyword: keyword,
            points: parseInt(points),
            // totalpoints: parseInt(totalpoint),
            hot: hot,
            tsrange: JSON.parse(tsrange),
            mold: mold,
            adsinfourl: adsinfourl,
            balance: parseFloat(balance),
            // totalbalance: parseFloat(totalbalance),
            // allbalance: parseFloat(totalbalance),
            // allpoint: parseInt(totalpoint),
            nice: parseInt(nice),
            low: parseInt(low),
            gooduuid: gooduuid === '' ? null : gooduuid,
            goodtitle: goodtitle === '' ? null : goodtitle
        }
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO() /*|| loginInfo.isRoot()*/) {
            return sendNoPerm(res)
        }

        let adss = await updateByUuid(ads, uuid)
        let advertiser = await advertiserFindByPrimary(adss.advertiseruuid)
        let crmuser = await findByPrimary(advertiser.crmuuid)
        let user_ext = await usersExtFindByPrimary(crmuser.uuid)

        if (totalpoint > 0 || totalbalance > 0) {
            if (user_ext.crm_balance > (totalbalance * 100) && user_ext.crm_points > totalpoint)//给这个广告增加总零钱，扣减广告商的积分和零钱
                await addPointsBalance(req.app.locals.sequelize, uuid, totalbalance, totalpoint, user_ext.uuid)
            else
                return sendErrMsg(res, "零钱积分不足", 501)
        }

        //let adss = await updateByUuid(ads, uuid)
        if (virtviews != undefined)
            await upateVirtviews(uuid, parseInt(virtviews))
        let ads_ext = await findViews(uuid)
        return createdOk(res, { adss: adss, ads_ext: ads_ext })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改热门广告排列位置
router.patch("/position", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { rise, drop } = (req as any).body
        validateCgi({ uuid: rise, }, adsValidator.uuid)
        validateCgi({ uuid: drop }, adsValidator.uuid)
        await updateHotAdsPosition(req.app.locals.sequelize, rise, drop)
        return sendOK(res, { ads: '修改成功！' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//广告置顶
router.patch("/top/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params['uuid']
        validateCgi({ uuid: uuid }, adsValidator.uuid)
        await adsTop(req.app.locals.sequelize, uuid)
        return sendOK(res, { ads: '置顶成功！' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//设为（取消热门广告）热门广告
router.patch("/heat/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params['uuid']
        const { heat } = (req as any).body
        validateCgi({ uuid: uuid }, adsValidator.uuid)
        let ads = await updateHeat(uuid, parseInt(heat))
        return sendOK(res, { ads: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let body: any = (req as any).body
    let { state, rejectmsg } = body
    let uuid = req.params["uuid"]

    rejectmsg = rejectmsg ? rejectmsg : ""

    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({
            adsuuid: uuid,
            state: state,
            rejectmsg: rejectmsg
        }, adsValidator.adsState)

        let ads
        if (rejectmsg) {
            ads = {
                state: state,
                rejectmsg: rejectmsg
            }
        } else {
            if (state == "off") {
                ads = {
                    state: state,
                    banner: 'off',
                    heat: 0
                }
            } else {
                ads = {
                    state: state,
                }

            }
        }

        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }

        let adss = await updateByUuid(ads, uuid)
        return createdOk(res, { adss: adss })
    } catch (e) {
        e.info(se, res, e)
    }
})

/*delete by uuid */
router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo

        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)

        if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
            return sendNoPerm(res)
        }

        let ads = await delet(adsuuid)
        deleteadsByadsuuid(req.app.locals.sequelize,adsuuid);
        return sendOK(res, { ads: ads })
    } catch (e) {
        return deleteOK(res, e)
    }
})

//获得热门广告列表
router.get("/position", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start: start, length: length, searchdata: searchdata }, adsValidator.pagination)
        let recordsFiltered = await getCrmHotCount(req.app.locals.sequelize, searchdata)
        let ads = await getCrmHot(req.app.locals.sequelize, parseInt(start), parseInt(length), searchdata)
        ads.forEach(r => {
            r.tsrange[0] = timestamps(r.tsrange[0])
            r.tsrange[1] = timestamps(r.tsrange[1])
            r.created = timestamps(r.created)
        })
        return sendOK(res, { ads: ads, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

/* GET ads info. */
router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["uuid"]
    try {
        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        let ads = await getByUuid(adsuuid)

        if (ads.tsrange && ads.tsrange[0]) {
            ads.tsrange[0] = timestamps(ads.tsrange[0])
            ads.tsrange[1] = timestamps(ads.tsrange[1])
        }
        let ads_ext = await findViews(adsuuid)
        return sendOK(res, { ads: ads, ads_ext: ads_ext })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/:adsuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params["adsuuid"] as string
    try {
        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        let newPath = await uploadAdsImage(req, {
            uuid: adsuuid,
            glob: adsImgOpt.glob,
            tmpDir: adsImgOpt.tmpDir,
            maxSize: adsImgOpt.maxSize,
            extnames: adsImgOpt.extnames,
            maxFiles: adsImgOpt.maxFiles,
            targetDir: adsImgOpt.targetDir,
            fieldName: adsImgOpt.fieldName,
        })
        let ads = await findByPrimarys(adsuuid)

        ads.pics = ads.pics ? ads.pics : []
        ads.pics.push(newPath)
        let adss = await modifilyPics(adsuuid, ads.pics)
        return createdOk(res, { path: newPath, pics: adss.pics })
    } catch (e) {
        e.info(se, res, e)
    }
})


router.post('/:adsuuid/movie', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params["adsuuid"] as string
    try {
        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        let newPath = await uploadAdsMovie(req, {
            uuid: adsuuid,
            glob: adsMovOpt.glob,
            tmpDir: adsMovOpt.tmpDir,
            maxSize: adsMovOpt.maxSize,
            extnames: adsMovOpt.extnames,
            maxFiles: adsMovOpt.maxFiles,
            targetDir: adsMovOpt.targetDir,
            fieldName: adsMovOpt.fieldName,
        })
        let ads = await findByPrimarys(adsuuid)

        ads.video = ads.video ? ads.video : []
        ads.video.push(newPath)
        let adss = await modifilyVideo(adsuuid, ads.video)
        return createdOk(res, { path: newPath, adss: adss })
    } catch (e) {
        e.info(se, res, e)
    }
})

async function listAdsFiles(req: Request, res: Response, opt: any) {
    let adsuuid = req.params["adsuuid"] as string
    try {
        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        let pattern = path.join(opt.targetDir, adsuuid, opt.glob)
        let files = await listFilesAsync(pattern)

        for (let i = 0; i < files.length; i++) {
            files[i] = files[i].substr(opt.targetDir.length + 1)
        }
        return sendOK(res, { files: files })
    } catch (e) {
        e.info(se, res, e)
    }
}

router.get('/:adsuuid/movie', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    return listAdsFiles(req, res, adsMovOpt)
})

router.get('/:adsuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    return listAdsFiles(req, res, adsImgOpt)
})

router.delete('/:adsuuid/image', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { mediaName, pics } = (req as any).body
    let adsuuid = req.params["adsuuid"] as string
    try {
        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        mediaName = path.join(adsImgOpt.targetDir, adsuuid, mediaName)
        await removeAsync(mediaName)

        await modifilyPics(adsuuid, JSON.parse(pics))
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:adsuuid/movie', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: any = (req as any).body.mediaName
    let adsuuid = req.params["adsuuid"] as string
    try {
        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        mediaName = path.join(adsMovOpt.targetDir, adsuuid, mediaName)
        await removeAsync(mediaName)
        await modifilyVideo(adsuuid, null)
        return sendOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})


router.delete('/banner/:adsuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo

        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO() || loginInfo.isAdsRW()) {
            return sendNoPerm(res)
        }
        await deleteBanner(adsuuid)
        return sendOK(res, { move: "OK" })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.put('/banner/:adsuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo

        validateCgi({ adsuuid: adsuuid }, adsValidator.UUID)
        if (loginInfo.isAdminRO() || loginInfo.isAdsRO() || loginInfo.isAdsRW()) {
            return sendNoPerm(res)
        }
        let ads = await getByUuid(adsuuid);
        if(ads.status==0){
            return sendOK(res,{data: "noopen"});
        }

        let adss = await getBanner()
        if (adss.length < 10) {
            await updateBanner(adsuuid)
            return sendOK(res, { add: "OK" })
        }

        return sendOK(res, { add: "false" })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch("/:uuid/mgruuids", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params["uuid"]
        const { mgruuids } = (req as any).body
        validateCgi({ uuid: uuid, mgruuids: mgruuids }, adsValidator.mgruuids)
        let mgruuid = JSON.parse(mgruuids)
        let crmuser = await inserMgruuids(uuid, mgruuid)
        return sendOK(res, { crmuser: crmuser })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/NadscommentSort', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = (req as any).body.adsuuid;
    let Ncommentcount = (req as any).body.Ncommentcount;
    try {
        await updateAdsCommentsort(adsuuid, Ncommentcount);
        return sendOK(res, { 'data': 'succ' });
    } catch (e) {
        e.info(se, res, e)
    }
})

//新的提交广告的接口,加了虚拟点击
router.post('/puton/updateAds', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let { adsuuid, title, description, url, quesMsg, type, awards, method, keyword,
        views, nice, gooduuid, goodtitle, sumcontent, pic_mode, showamount, pointmount,isads,low } = (req as any).body
    let click = pointmount;
    let state = 'wait-ack';

    try {
        let advertiseruuid = await queryadvertiserByadsuuid(req.app.locals.sequelize, adsuuid);
        type = JSON.parse(type);
        awards = JSON.parse(awards);
        let category = type.adtype;
        let subcategory = type.subtype;
        let point = 0, allpoint = 0, balance = 0, allbalance = 0, mold = ''
        let date = new Date();
        let date1 = new Date(1);
        let tsrange = [];
        tsrange.push(date1.toLocaleString());
        tsrange.push(date.toLocaleString());

        if (awards.point.length != 0) {
            point = awards.point[0];
            allpoint = awards.point[1];
            mold = 'point'
        } else if (awards.cash.length != 0) {
            balance = awards.cash[0];
            allbalance = awards.cash[1];
            mold = 'balance'
        } else {
            point = awards.two[0][0];
            allpoint = awards.two[0][1];
            balance = awards.two[1][0];
            allbalance = awards.two[1][1];
            mold = 'two';
        }

        if (method == 'cpe') {
            if (mold == 'point' || mold == 'two') {
                if (point == 0 || point == undefined)
                    return sendErrMsg(res, "积分有误", 500)
                if (allpoint == 0 || allpoint == undefined)
                    return sendErrMsg(res, "总积分有误", 500)
            }
            if (mold == 'balance' || mold == 'two') {
                if (balance == 0 || balance == undefined)
                    return sendErrMsg(res, "零钱有误", 500)
                if (allbalance == 0 || allbalance == undefined)
                    return sendErrMsg(res, "总零钱有误", 500)
            }
        }

        let ads;
        if (loginInfo.isRoot()) {
            if (method == 'cpe') {
                ads = {
                    title: title,
                    description: description,
                    adsinfourl: url,
                    question_ext: quesMsg,
                    category: category,
                    subcategory: subcategory,
                    points: point,
                    balance: balance,
                    low: low,
                    nice: nice,
                    gooduuid: gooduuid,
                    showamount: showamount,
                    sumcontent: sumcontent,
                    goodtitle: goodtitle,
                    state: state,
                    advertiseruuid: advertiseruuid[0].advertiseruuid,
                    pointmount: click,
                    keyword: keyword,
                    deleted: 0,
                    pic_mode: pic_mode,
                    tsrange: tsrange,
                    mold: mold,
                    status: 0,
                    isads: isads,
                    commentcatg: null,//推荐广告大类备份字段
                    commentsubcatg: null//推荐广告小类备份字段
                }
                if (gooduuid == '' || goodtitle == '') {
                    delete ads.goodtitle
                    delete ads.gooduuid
                }
                
                ads.question_ext = JSON.parse(quesMsg);
            } else if (method == 'cpm') {
                ads = {
                    title: title,
                    description: description,
                    adsinfourl: url,
                    question_ext: quesMsg,
                    category: category,
                    subcategory: subcategory,
                    keyword: keyword,
                    low: low,
                    nice: nice,
                    gooduuid: gooduuid,
                    sumcontent: sumcontent,
                    goodtitle: goodtitle,
                    showamount: showamount,
                    state: state,
                    advertiseruuid: advertiseruuid[0].advertiseruuid,
                    deleted: 0,
                    pointmount: click,
                    pic_mode: pic_mode,
                    tsrange: tsrange,
                    status: 0,
                    isads: isads,
                    commentcatg: null,//推荐广告大类备份字段
                    commentsubcatg: null//推荐广告小类备份字段
                }
                if (gooduuid == '' || goodtitle == '') {
                    delete ads.goodtitle
                    delete ads.gooduuid
                }

                ads.question_ext = JSON.parse(quesMsg);
            } else if (method == 'cpc') {
                ads = {
                    title: title,
                    description: description,
                    adsinfourl: url,
                    category: category,
                    subcategory: subcategory,
                    question_ext: quesMsg,
                    keyword: keyword,
                    low: low,
                    nice: nice,
                    gooduuid: gooduuid,
                    sumcontent: sumcontent,
                    goodtitle: goodtitle,
                    showamount: showamount,
                    state: state,
                    advertiseruuid: advertiseruuid[0].advertiseruuid,
                    deleted: 0,
                    pointmount: click,
                    pic_mode: pic_mode,
                    tsrange: tsrange,
                    status: 0,
                    isads: isads,
                    commentcatg: null,//推荐广告大类备份字段
                    commentsubcatg: null,//推荐广告小类备份字段
                }
                if (gooduuid == '' || goodtitle == '') {
                    delete ads.goodtitle
                    delete ads.gooduuid
                }

                ads.question_ext = JSON.parse(quesMsg);
            }
            let oldads = await queryPutonadsByuuid(adsuuid);

            operationAcount(ads.showamount, ads.pointmount, adsuuid);

            ads.pointmount = parseInt(ads.pointmount) + parseInt(oldads.pointmount);
            ads.showamount = parseInt(ads.showamount) + parseInt(oldads.showamount);
        } else {
            if (method == 'cpe') {
                ads = {
                    title: title,
                    description: description,
                    adsinfourl: url,
                    question_ext: quesMsg,
                    category: category,
                    subcategory: subcategory,
                    points: point,
                    balance: balance,
                    gooduuid: gooduuid,
                    sumcontent: sumcontent,
                    goodtitle: goodtitle,
                    state: state,
                    advertiseruuid: advertiseruuid[0].advertiseruuid,
                    keyword: keyword,
                    deleted: 0,
                    pic_mode: pic_mode,
                    tsrange: tsrange,
                    mold: mold,
                    status: 0,
                    isads: isads,
                    commentcatg: null,//推荐广告大类备份字段
                    commentsubcatg: null//推荐广告小类备份字段
                }
                if (gooduuid == '' || goodtitle == '') {
                    delete ads.goodtitle
                    delete ads.gooduuid
                }

                ads.question_ext = JSON.parse(quesMsg);
            } else if (method == 'cpm') {
                ads = {
                    title: title,
                    description: description,
                    adsinfourl: url,
                    question_ext: quesMsg,
                    category: category,
                    subcategory: subcategory,
                    keyword: keyword,
                    gooduuid: gooduuid,
                    sumcontent: sumcontent,
                    goodtitle: goodtitle,
                    state: state,
                    advertiseruuid: advertiseruuid[0].advertiseruuid,
                    deleted: 0,
                    pic_mode: pic_mode,
                    tsrange: tsrange,
                    status: 0,
                    isads: isads,
                    commentcatg: null,//推荐广告大类备份字段
                    commentsubcatg: null//推荐广告小类备份字段
                }
                if (gooduuid == '' || goodtitle == '') {
                    delete ads.goodtitle
                    delete ads.gooduuid
                }

                ads.question_ext = JSON.parse(quesMsg);
            } else if (method == 'cpc') {
                ads = {
                    title: title,
                    description: description,
                    adsinfourl: url,
                    category: category,
                    subcategory: subcategory,
                    question_ext: quesMsg,
                    keyword: keyword,
                    gooduuid: gooduuid,
                    sumcontent: sumcontent,
                    goodtitle: goodtitle,
                    state: state,
                    advertiseruuid: advertiseruuid[0].advertiseruuid,
                    deleted: 0,
                    pic_mode: pic_mode,
                    tsrange: tsrange,
                    status: 0,
                    isads: isads,
                    commentcatg: null,//推荐广告大类备份字段
                    commentsubcatg: null//推荐广告小类备份字段
                }
                if (gooduuid == '' || goodtitle == '') {
                    delete ads.goodtitle
                    delete ads.gooduuid
                }

                ads.question_ext = JSON.parse(quesMsg);
            }
        }

        let adss = await getByUuid(adsuuid)
        let advertiser = await advertiserFindByPrimary(advertiseruuid[0].advertiseruuid)
        let crmuser = await findByPrimary(advertiser.crmuuid)
        let user_ext = await usersExtFindByPrimary(crmuser.uuid)
        let result = undefined
        if (allbalance > 0 || allpoint > 0) {
            result = await addPointsBalance(req.app.locals.sequelize, adss.uuid, allbalance, allpoint, user_ext.uuid)

            if (result)
                adss = await updatePutonads(adsuuid, ads);
            else
                return sendErrMsg(res, "积分或者零钱不足", 501)

        } else {
            await updatePutonads(adsuuid, ads)
        }

        crmadsPay(req, adsuuid, parseInt((showamount / 1000).toString()), "show");
        crmadsPay(req, adsuuid, click, "point");

        if (loginInfo.isRoot()) {
            upateVirtviews(adsuuid, views);
        }
        return sendOK(res, adss);
    } catch (e) {
        e.info(se, res, e);
    }
})
router.get('/puton/getAdsByuuid', async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.query.adsuuid;
    try {
        //let view = await findByPrimary(adsuuid)
        let re = await queryPutonadsByuuid(adsuuid);
        let unit = await queryunitone(re.unituuid);
        let view = await findViews(adsuuid);
        //in:[{"answer": ["1"], "option": ["1", "2", "3", "4"], "question": "1"}, {"answer": ["a", "b"], "option": ["a", "b", "c", "d"], "question": "ab"}]
        //our:[{question:'题目标题',"option":['a,'b','c','d'],"answer":'abcd'},{}]
        let quesarr = [];
        if (re.question_ext != undefined) {
            for (let i = 0; i < re.question_ext.length; i++) {
                let answerarr = [];

                for (let j = 0; j < re.question_ext[i].answer.length; j++) {

                    for (let x = 0; x < re.question_ext[i].option.length; x++) {

                        if (re.question_ext[i].option[x] == re.question_ext[i].answer[j]) {

                            if (x == 0) {
                                answerarr.push('a')
                            } else if (x == 1) {
                                answerarr.push('b')
                            } else if (x == 2) {
                                answerarr.push('c')
                            } else if (x == 3) {
                                answerarr.push('d')
                            }

                        }
                    }
                }
                let obj = {
                    'question': re.question_ext[i].questions,
                    'option': re.question_ext[i].option,
                    'answer': answerarr
                } as any
                quesarr.push(obj);
            }
        }
        re.quesMsg_ext = quesarr;

        let cash = [] as any[];
        let point = [] as any[];
        let two = [] as any[];
        let awards = { cash, point, two }
        if (!re.points || !re.allpoint) {

            let two_cash = [] as any[];
            let two_point = [] as any[];

            cash.push(re.balance);
            cash.push(re.allbalance);

            awards.cash = cash;
            awards.two.push(two_cash);
            awards.two.push(two_point);
        } else if (!re.balance || !re.balance) {

            let two_cash = [] as any[];
            let two_point = [] as any[];
            point.push(re.points)
            point.push(re.allpoint)
            awards.point = point
            awards.two.push(two_cash);
            awards.two.push(two_point);
        } else {
            let two_cash = [] as any[];
            let two_point = [] as any[];
            two_cash.push(re.balance);
            two_cash.push(re.allbalance);
            two_point.push(re.points)
            two_point.push(re.allpoint)

            awards.two.push(two_point);
            awards.two.push(two_cash);
        }
        re.awards = awards;
        let parentname = await queryplanunitByadsuuid(req.app.locals.sequelize, adsuuid);
        return sendOK(res, { re, unit, parentname: parentname[0], view: view.virtviews });
    } catch (e) {
        e.info(se, res, e);
    }
});

router.post('/puton/updateadsStatus', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let { adsuuid, status } = (req as any).body;

    try {
        if (parseInt(status) == 1) {
            let ads = await queryPutonadsByuuid(adsuuid);
            if (ads.state == 'on') {
                if (!await checkads(req, res, next, adsuuid)) {
                    await updateadsStatus(adsuuid, 0)
                    return sendOK(res, "notallow");
                } else {
                    let unit = await queryunitByadsuuid(req.app.locals.sequelize, adsuuid);
                    let plan = await queryplanByunituuid(req.app.locals.sequelize, unit.uuid)
                    if (unit.status != 1 || plan[0].status != 1) {
                        await updateadsStatus(adsuuid, 0);
                        return sendOK(res, "notxxx");
                    }
                    await updateadsStatus(adsuuid, 1);
                }
            } else if (ads.state == 'wait-ack') {
                return sendOK(res, "notread");
            }
        } else {
            await updateadsStatus(adsuuid, 0);
        }
        return sendOK(res, "succ");
    } catch (e) {
        e.info(se, res, e);
    }
})

//预先新增一个广告
router.get('/:unituuid/Outnewads', async function (req: Request, res: Response, next: NextFunction) {
    let unituuid = req.params['unituuid'];
    try {
        let plan = await queryplanByunituuid(req.app.locals.sequelize, unituuid);
        let unit = await queryunitone(unituuid);
        if (plan[0].advertiseruuid == null) {
            return sendErrMsg(res, "找不到广告商", 500);
        } else {
            let advertiser = await advertiserFindByPrimary(plan[0].advertiseruuid)
            if (!advertiser)
                return sendErrMsg(res, "找不到广告商", 500);

            let crmuser = await findByPrimary(advertiser.crmuuid);
            if (!crmuser)
                return sendErrMsg(res, "广告商crm帐号不存在", 500);

            let ads = await insertBeforePutonads(req.app.locals.sequelize, '个人用户', unituuid, advertiser, crmuser.username);
            return sendOK(res, { "unit": unit, "ads": ads.get() });
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/:adsuuid/:index/coverimage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let adsuuid = req.params['adsuuid'] as string;
    let index: any = req.params['index']; index = parseInt(index)  //上传的位置，in(0, 1, 2)

    try {
        let newPath = await uploadAdsImage(req, {
            uuid: adsuuid,
            glob: adsCoverImgOpt.glob,
            tmpDir: adsCoverImgOpt.tmpDir,
            maxSize: adsCoverImgOpt.maxSize,
            extnames: adsCoverImgOpt.extnames,
            maxFiles: adsCoverImgOpt.maxFiles,
            targetDir: adsCoverImgOpt.targetDir,
            fieldName: adsCoverImgOpt.fieldName
        })
        let ads = await findByPrimarys(adsuuid)

        ads.coverpic = ads.coverpic == null ? [] : ads.coverpic
        ads.coverpic.splice(index, 0, newPath)  //把图片路径插到指定的index
        let adss = await modifilyCoverpic(adsuuid, ads.coverpic);
        return createdOk(res, { path: newPath, pics: adss.coverpic })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:adsuuid/coverimage', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let mediaName: string = (req as any).body.mediaName
    let adsuuid = req.params["adsuuid"] as string
    try {
        mediaName = path.join(adsCoverImgOpt.targetDir, adsuuid, mediaName)
        await removeAsync(mediaName)
        let ads = await findByPrimarys(adsuuid);
        let coverArr = [];

        for (let i = 0; i < ads.coverpic.length; i++) {
            if (-1 == mediaName.indexOf(ads.coverpic[i].split('/')[1])) {
                coverArr.push(ads.coverpic[i]);
            }
        }
        //更新到数据库
        await modifilyCoverpic(adsuuid, coverArr);
        return deleteOK(res, { msg: "succ" })
    } catch (e) {
        e.info(se, res, e)
    }
})


async function crmadsPay(req: Request, adsuuid: string, amount: number, method: string) {
    let ads = await queryBalanceByadsuuid(req.app.locals.sequelize, adsuuid);
    let bid = await queryBidByadsuuid(req.app.locals.sequelize, adsuuid);

    let dailybudget = await finddailybudgetByuuid(ads[0].advertiseruuid);
    let unitmethod = await queryunitByadauuid(req.app.locals.sequelize, adsuuid);

    if (dailybudget.dailybudget == -1) {
        let money = parseFloat(ads[0].crm_balance) - parseFloat(bid[0].bid) * 100 * amount;
        if (unitmethod[0].method == 'cpc' && method == "point") {
            await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
        } else if (unitmethod[0].method == 'cpm' && method == "show") {
            await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);

        } else if (unitmethod[0].method == 'cpe') {
            if (method == "point") {
                await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
            } else if (method == "show") {
                await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
            }
        }
    } else {
        if (dailybudget.tempdailybudget > 0) {
            let tempmoney = (dailybudget.dailybudget * dailybudget.tempdailybudget / 100) - parseFloat(bid[0].bid) * amount;
            let money = 0;
            if (tempmoney <= 0) {
                money = parseFloat(ads[0].crm_balance) - dailybudget.dailybudget * dailybudget.tempdailybudget / 100;
                updateadsStatus(adsuuid, 0);
            } else {
                money = parseFloat(ads[0].crm_balance) - parseFloat(bid[0].bid) * 100 * amount;
            }

            if (unitmethod[0].method == 'cpc' && method == "point") {
                await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);

            } else if (unitmethod[0].method == 'cpm' && method == "show") {
                await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);

            } else if (unitmethod[0].method == 'cpe') {
                if (method == "point") {
                    await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
                } else if (method == "show") {
                    await updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
                }
            }
        }
    }


}