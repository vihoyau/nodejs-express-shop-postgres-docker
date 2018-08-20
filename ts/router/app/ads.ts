import { validateCgi } from "../../lib/validator"
import { usersValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { getAnswerAds, saveAnswerAds } from "../../redis/history"
import { sendOK, sendError as se, sendNotFound, createdOk, deleteOK } from "../../lib/response"
import { checkAppLogin, LoginInfo, getLogininfo } from "../../redis/logindao"
import {
    querycrmuuidByadsuuid, updateBalanceByadsuuid, queryBidByadsuuid, updateadsStatus, queryPutonadsbyunituuid2, queryPutonadsbyunituuid3,
    queryunitByadauuid, queryBalanceByadsuuid, upadsBrowser, queryPutonadsbyunituuid, getByType,
    getByCategory, updateNice, updateLow, encommentedlist, getByKeyword, getHot, updateApplaud,
    getFavoriteByUuid, findByPrimary as getByUuid, updateByUuid, getBanner, modifilyCoverpic,
    queryCoverpic, updatepointamountByadsuuid, updateshowamountByadsuuid, updateAdvertiserByadsuuid,
    findadvertiserByadsuuid, upadspoints/* ,queryPutonadsByuuid  */
} from "../../model/ads/ads"

import { queryunitone } from "../../model/puton/unit"
import { getByKeywords, update, hotkeyInsert } from "../../model/ads/hotkey"
import { getAdsUuids, getByUserAds, favoriateInsert, deleteByUserAds } from "../../model/ads/favoriate"
import { insertAdsView, getAdsviewByuuid } from "../../model/ads/ads_view"
import { findByUseruuidAndAdsuuid } from "../../model/ads/applaud"
import { findByPrimary, addPointAndCashlottery } from "../../model/users/users"
import { updatePoints, updateAdsViews, modifiedAdsViews, findByPrimary as findUsersExt } from "../../model/users/users_ext"
import { insertReward } from "../../model/users/reward"
import { insertApplaud, deleteByAdsUuid } from "../../model/ads/applaud"
import { insertStatistics } from "../../model/users/statistics"
//import { getSubcategory, getSubcategory2 } from "../../model/ads/category"
import {  getSubcategory2 } from "../../model/ads/category"
import { findByName } from "../../model/system/system"
import { getByTwoUuid, insertAdslog, updateAdslog } from "../../model/ads/adslog"
import { updateViews, findByPrimary as findViews, updateNumber } from "../../model/ads/ads_ext"
import { getPageCount } from "../../lib/utils"
//linux环境对不被使用的变量编译不通过。
//import { postAsync } from "../../lib/request"
import { timestamps } from "../../config/winston"
import logger = require("winston")
import { adsCoverImgOpt } from "../../config/resource"
import { uploadAdsImage } from "../../lib/upload"
import { removeAsync } from "../../lib/fs"
import { /*querycontroltimeByweek_hour,*/queryunitbycontroltime } from "../../model/puton/controltime"
import { queryunitByadsuuid } from "../../model/puton/unit"
import { insertoperation } from "../../model/ads/adsoperation"
import { insertpaymoney } from "../../model/ads/paymoney"
import { amountcheck } from "../../lib/amountmonitor"
//import { getrent } from "../../model/ads/ads"
import * as path from "path"
export const router = Router()

//推荐广告列表（推荐页）
router.get("/commentlist", getLogininfo, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { category, page, count, ip } = (req as any).query
        let { cursor, limit } = getPageCount(page, count)
        let subcategorys = await getSubcategory2(category, cursor, limit)
        let adsarr = []
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (!loginInfo) { //记录访客
            let obj = {
                ip: ip ? ip : "IP"
            }
            await insertStatistics(obj)
        }

        for (let i = 0; i < subcategorys.length; i++) {
            let ads = await encommentedlist(subcategorys[i].uuid)
            for (let i = 0; i < ads.length; i++) {
                await checkads(req, res, next, ads[i].uuid)
            }
            let controltimeadsarr = await encommentedListControl(req, res, next) as any[]
            ads = await getshowads(req, res, next, ads, controltimeadsarr)
            ads.forEach(r => {
                r.balance = r.balance
                r.totalbalance = r.totalbalance
                r.allbalance = r.allbalance
                r.created = timestamps(r.created)
                r.tsrange[0] = timestamps(r.tsrange[0])
                r.tsrange[1] = timestamps(r.tsrange[1])
            })
            for (let i = 0; i < ads.length; i++) {
                let unit = await queryunitByadsuuid(req.app.locals.sequelize, ads[i].uuid)
                ads[i].method = unit.method
                ads[i].mode = unit.mode
            }
            adsarr.push({
                subcategory: subcategorys[i],
                ad: ads
            })
        }
        return sendOK(res, { adsarr: adsarr, page: parseInt(page) + 1, count })
    } catch (e) {
        e.info(se, res, e)
    }
})

export async function encommentedListControl(req: Request, res: Response, next: NextFunction) {
    let date = new Date()
    let hour = date.getHours()
    let day = date.getDay() ? date.getDay() : 7
    let unituuid = await queryunitbycontroltime(req.app.locals.sequelize, day, hour)
    let controltimeadsarr = new Array();
    let controltimeads = await queryPutonadsbyunituuid(req.app.locals.sequelize, unituuid);
    for (let i = 0; i < controltimeads.length; i++) {
        controltimeadsarr.push(controltimeads[i].uuid);
    }
    return controltimeadsarr;
}

export async function encommentedListControl2(req: Request, res: Response, next: NextFunction, category: any) {
    let date = new Date()
    let hour = date.getHours()
    let day = date.getDay() ? date.getDay() : 7
    let unituuid = await queryunitbycontroltime(req.app.locals.sequelize, day, hour)
    let controltimeadsarr = new Array();
    let controltimeads = await queryPutonadsbyunituuid2(req.app.locals.sequelize, unituuid, category);
    for (let i = 0; i < controltimeads.length; i++) {
        controltimeadsarr.push(controltimeads[i].uuid);
    }
    return controltimeadsarr;
}

export async function encommentedListControl3(req: Request, res: Response, next: NextFunction, category: any) {
    let date = new Date()
    let hour = date.getHours()
    let day = date.getDay() ? date.getDay() : 7
    let unituuid = await queryunitbycontroltime(req.app.locals.sequelize, day, hour)
    let controltimeadsarr = new Array();
    let controltimeads = await queryPutonadsbyunituuid3(req.app.locals.sequelize, unituuid, category);
    for (let i = 0; i < controltimeads.length; i++) {
        controltimeadsarr.push(controltimeads[i].uuid);
    }
    return controltimeadsarr;
}

export async function compArea(userinfoArea: any, unitArea: string) {
    if (unitArea == '全国型' || userinfoArea.city == '全国') {
        return true;
    } else {
        let unitAreas = unitArea.split('-')
        if (unitAreas[0] == unitArea) {
            if (unitArea == userinfoArea.area)
                return true
            else if (unitArea == userinfoArea.province)
                return true
        }

        if (unitArea[0] == userinfoArea.province && unitArea[1] == userinfoArea.city)
            return true
    }
    return false
}
export async function getshowads(req: Request, res: Response, next: NextFunction, ads: any[], controltimeads: any[]) {
    let adsarr = [];
    for (let x = 0; x < ads.length; x++) {
        if (controltimeads.indexOf(ads[x].uuid) >= 0) {
            let unit = await queryunitone(ads[x].unituuid)
            if (unit) {
                ads[x].method = unit.method
                ads[x].mode = unit.mode
                ads[x].cpe_type = unit.cpe_type
            }
            adsarr.push(ads[x])
            if (ads[x].showamount > 0 && ads[x].showamount % 1000 == 0 && ((ads[x].method == 'cpm') || (ads[x].method == 'cpe' && ads[x].cpe_type == 0))) {
                appAdsPay(req, res, next, ads[x].uuid, '', ads[x].method, 'show')
            } else {
                insertoperation(ads[x].uuid, "", "adsshow", new Date())
            }
            updateshowamountByadsuuid(ads[x].uuid)
        }
    }
    return adsarr
}

//如果是展示扣费，这里就该扣广告商的钱了（cpm广告，cpe的展示扣费模式）
export async function getshowads2(req: Request, res: Response, next: NextFunction, ads: any[], useruuid: any) {
    let adsarr = [];
    for (let x = 0; x < ads.length; x++) {
        let unit = await queryunitone(ads[x].unituuid)
        if (unit) {
            ads[x].method = unit.method
            ads[x].mode = unit.mode
            ads[x].cpe_type = unit.cpe_type
        }

        if (ads[x].showamount > 0 && ads[x].showamount % 1000 == 0 && ((ads[x].method == 'cpm') || (ads[x].method == 'cpe' && ads[x].cpe_type == 0))) {
            appAdsPay(req, res, next, ads[x].uuid, '', ads[x].method, 'show')
        } else {
            insertoperation(ads[x].uuid, "", "adsshow", new Date())
        }

        updateshowamountByadsuuid(ads[x].uuid)
        checkads(req, res, next, ads[x].uuid)
        let read = false    //阅读标记
        if (useruuid) {
            let adslog = await getByTwoUuid(ads[x].uuid, useruuid)
            if (adslog)
                read = true
        }
        ads[x].read = read
        adsarr.push(ads[x])
    }
    return adsarr
}

//没被调用2018-02-05
router.get('/:adsuuid/geturl', async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params['adsuuid'];
    let useruuid = (req as any).headers.uuid
    try {
        //let re = await queryunitByadauuid(req.app.locals.sequelize, adsuuid);
        await appAdsPay(req, res, next, adsuuid, useruuid, 'cpc', 'point');
        await upadsBrowser(adsuuid);
    } catch (e) {
        e.info(se, res, e);
    }
})
/* GET ads listing.
GET ads/ads?type=xxx&page=1&count=10
*/

//请求小类广告
router.get('/type', getLogininfo, async function (req: Request, res: Response, next: NextFunction) {
    const { subtype, page, count, address } = req.query
    try {
        let useruuid = (req as any).headers.uuid
        let addressComponent
        if (address) {
            addressComponent = JSON.parse(address)
        } else {
            addressComponent = {
                city: null,
                province: null,
                area: null
            }
        }
        validateCgi({ subcategory: subtype, page: page, count: count }, usersValidator.bytype)
        let { cursor, limit } = getPageCount(page, count)
        let controltimeadsarr = await encommentedListControl3(req, res, next, subtype) as any[]
        let ads = await getByType(req.app.locals.sequelize, subtype, addressComponent, controltimeadsarr, cursor, limit)
        ads = await getshowads2(req, res, next, ads, useruuid)
        return sendOK(res, { ads, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e);
    }
})

//请求大类广告
router.get('/category', getLogininfo, async function (req: Request, res: Response, next: NextFunction) {
    const { category, page, count, address } = req.query
    try {
        let useruuid = (req as any).headers.uuid
        let addressComponent
        if (address) {
            addressComponent = JSON.parse(address)
        } else {
            addressComponent = {
                city: null,
                province: null,
                area: null
            }
        }
        validateCgi({ subcategory: category, page: page, count: count }, usersValidator.bytype)
        let { cursor, limit } = getPageCount(page, count)
        let controltimeadsarr = await encommentedListControl2(req, res, next, category) as any[]
        let ads = await getByCategory(req.app.locals.sequelize, category, addressComponent, controltimeadsarr, cursor, limit)
        ads = await getshowads2(req, res, next, ads, useruuid)

        for (let i = 0; i < ads.length; i++) {
            let read = false, answered = false
            if (useruuid) {
                let adslog = await getByTwoUuid(ads[i].uuid, useruuid)
                if (adslog) {
                    read = true
                    if (adslog.state)
                        answered = true
                }
            }
            ads[i].read = read
            ads[i].answered = answered
        }
        return sendOK(res, { ads, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/keyword', async function (req: Request, res: Response, next: NextFunction) {
    const { keyword, page, count, address } = req.query
    let useruuid = (req as any).headers.uuid
    try {
        let addressComponent
        if (address) {
            addressComponent = JSON.parse(address)
        } else {
            addressComponent = {
                city: null,
                province: null,
                area: null
            }
        }

        validateCgi({ keyword: keyword, page: page, count: count }, usersValidator.keywords)

        let { cursor, limit } = getPageCount(page, count)
        let keywords = await getByKeywords(keyword)

        if (keywords && !!keywords.keyword) {
            await update(keywords.id)
        } else {
            await hotkeyInsert(keyword)
        }
        let ads = await getByKeyword(req.app.locals.sequelize, keyword, cursor, limit, addressComponent)
        if (useruuid) {
            let obj = {
                useruuid: useruuid,
                loginnumber: 0,
                searchnumber: 1,
                favoritenumber: 0,
                type: 'ads',
            }
            await insertStatistics(obj)
        }

        return sendOK(res, { ads: ads, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})


router.get('/hot', async function (req: Request, res: Response, next: NextFunction) {
    let { page, count, address } = req.query
    try {
        let addressComponent
        if (address) {
            addressComponent = JSON.parse(address)
        } else {
            addressComponent = {
                city: null,
                province: null,
                area: null
            }
        }

        validateCgi({ page: page, count: count }, usersValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let ads = await getHot(req.app.locals.sequelize, cursor, limit, addressComponent)
        return sendOK(res, { ads: ads, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

/*
GET /favorite?page&limit
 */
router.get('/favorite', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { page, count } = req.query

    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ page: page, count: count }, usersValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let favorite = await getAdsUuids(loginInfo.getUuid(), cursor, limit)
        let favo = new Array<string>()
        let ads = new Array<any>()
        if (favorite) {
            for (let i = 0; i < favorite.length; i++) {
                favo[i] = favorite[i].aduuid
            }

            if (favo.length > 0) {
                ads = await getFavoriteByUuid(req.app.locals.sequelize, favo)
                //ads = ads.map(r => new AdsVO(r))
            }
        }

        return sendOK(res, { ads: ads, page: parseInt(page) + 1, count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获取banner图
router.get('/banner', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let ads = await getBanner()
        for (let i = 0; i < ads.length; i++) {
            await checkads(req, res, next, ads[i].uuid)
        }
        let controltimeadsarr = await encommentedListControl(req, res, next) as any[]
        ads = await getshowads(req, res, next, ads, controltimeadsarr)
        for (let i = 0; i < ads.length; i++) {
            let unit = await queryunitByadsuuid(req.app.locals.sequelize, ads[i].uuid)
            ads[i].method = unit.method
            ads[i].mode = unit.mode
        }
        return sendOK(res, { banner: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

//没被调用2018-02-05
router.put('/ads_ext/:uuid', async function (req: Request, res: Response, next: NextFunction) {
    const uuid: string = req.params["uuid"]
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)
        let ads_ext = await updateNumber(uuid)
        await appAdsPay(req, res, next, uuid, useruuid, 'cpc', 'point');
        return sendOK(res, { ads_ext: ads_ext })
    } catch (e) {
        e.info(se, res, e)
    }
})

/* GET ads info. 这时候应该扣点击扣费的广告*/
router.get('/:uuid', async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["uuid"]
    const { ip } = (req as any).query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ uuid: adsuuid }, usersValidator.uuid)
        let re = await queryunitByadauuid(req.app.locals.sequelize, adsuuid);

        if (re[0].method == 'cpc' || (re[0].method == 'cpe' && re[0].cpe_type == 1)) {
            appAdsPay(req, res, next, adsuuid, '', re[0].method, 'point')
        } else {
            insertoperation(adsuuid, useruuid, 'adspoint', new Date());
        }

        await updatepointamountByadsuuid(adsuuid);
        await updateViews(adsuuid)
        let ads = await getByUuid(adsuuid)
        let answered = 0
        let views = 0
        let applaud = null
        let favo = "0"
        if (useruuid) {
            let user = await findByPrimary(useruuid);
            //获取答题记录
            let adslog = await getByTwoUuid(adsuuid, useruuid)
            if (adslog && adslog.state)
                answered = 1

            if (!adslog) {
                let adlog = {
                    aduuid: adsuuid,
                    useruuid: user.uuid,
                    username: user.username,
                    openid: user.openid
                }

                await insertAdslog(adlog)
            }
            //拿到该广告的浏览记录
            views = await findViews(ads.uuid)
            //拿到广告收藏
            let favorite = await getByUserAds(adsuuid, useruuid)
            if (favorite)
                favo = "1"
            //let adsVo = new AdsVO(ads as any)
            //根据useruuid和adsviewuuid查询浏览记录
            let adsviewuuid = await getAdsviewByuuid(useruuid, adsuuid)
            let obj
            if (adsviewuuid) {
                obj = {
                    uuid: adsviewuuid,
                    useruuid: useruuid,
                    adsuuid: adsuuid,
                    modified: new Date
                }
            } else {
                obj = {
                    useruuid: useruuid,
                    adsuuid: adsuuid,
                    modified: new Date
                }
                await updateAdsViews(useruuid, 1)//增加用户的广告浏览数
            }
            //添加用户广告浏览记录
            await insertAdsView(obj)

            let users_ext = await findUsersExt(useruuid)
            let laud = await findByUseruuidAndAdsuuid(adsuuid, useruuid)//点赞记录
            if (laud) {
                applaud = laud.state
            }
            let system = await findByName('numcondition')
            if (users_ext.views >= parseInt(system.content.adsnum)) {
                await addPointAndCashlottery(useruuid, 1, 0)//增加一次免费抽奖机会
                await modifiedAdsViews(useruuid, parseInt(system.content.adsnum))//减少记录免费抽奖的广告数
            }
        } else {    //没登陆的用户，记录访客
            let obj = {
                aduuid: adsuuid,
                ip: ip ? ip : "IP",
            }
            await insertAdslog(obj)
        }
        let questionindex = null//随机问题下标
        if (ads.question_ext) {
            questionindex = Math.floor(Math.random() * (ads.question_ext.length))//产生随机数

            //***************************************数组随机排列函数******************************************* */
            /**
             * 随机打乱数组顺序
             * @param input
             */
            async function shuffle(input: any[]) {
                for (let i = input.length - 1; i >= 0; i--) {
                    let randomIndex = Math.floor(Math.random() * (i + 1));
                    let itemAtIndex = input[randomIndex]
                    input[randomIndex] = input[i]
                    input[i] = itemAtIndex
                }
                return input
            }
            //************************************************************************************************* */
            let newquestion = await shuffle(ads.question_ext[questionindex].option)
            ads.question_ext[questionindex].option = newquestion//改变答案的位置
            ads.question_ext = ads.question_ext[questionindex]//输出随机出的答案
        }
        ads.totalbalance = ads.totalbalance
        ads.balance = ads.balance
        ads.allbalance = ads.allbalance
        return sendOK(res, { ads: ads, views: views, questionindex: questionindex, favorite: favo, answer: answered, applaud: applaud, method: re[0].method })
    } catch (e) {
        e.info(se, res, e)
    }
})

export async function appAdsPay(req: Request, res: Response, next: NextFunction, adsuuid: string, useruuid: string, method: string, mode: string) {

    let re = await queryunitByadauuid(req.app.locals.sequelize, adsuuid);

    if (method == re[0].method) {
        let balance = await queryBalanceByadsuuid(req.app.locals.sequelize, adsuuid);
        let bid = await queryBidByadsuuid(req.app.locals.sequelize, adsuuid);

        let advertiser = await findadvertiserByadsuuid(req.app.locals.sequelize, adsuuid);

        if (advertiser.dailybudget == -1) {
            let money = parseFloat(balance[0].crm_balance) - parseFloat(bid[0].bid) * 100;
            if (method == 'cpc' && mode == "point") {
                updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);

            } else if (method == 'cpm' && mode == "show") {
                updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);

            } else if (method == 'cpe') {
                if (mode == "point") {
                    updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
                } else if (mode == "show") {
                    updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
                }
            }
        } else if (advertiser.tempdailybudget > 0) {
            let tempmoney = (advertiser.dailybudget * advertiser.tempdailybudget / 100) - parseFloat(bid[0].bid);
            let money = 0;
            if (tempmoney <= 0) {
                money = parseFloat(balance[0].crm_balance) - advertiser.dailybudget * advertiser.tempdailybudget / 100;
                updateadsStatus(adsuuid, 0);
            } else {
                money = parseFloat(balance[0].crm_balance) - parseFloat(bid[0].bid) * 100;
            }

            if (method == 'cpc' && mode == "point") {
                updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
            } else if (method == 'cpm' && mode == "show") {
                updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
            } else if (method == 'cpe') {
                if (mode == "point") {
                    updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
                } else if (mode == "show") {
                    updateBalanceByadsuuid(req.app.locals.sequelize, adsuuid, money);
                }
            }
        }


        // //做流水
        let ree = await querycrmuuidByadsuuid(req.app.locals.sequelize, adsuuid);
        insertpaymoney(ree[0].crmuuid, bid[0].bid, new Date(), 'ads');

        //增加广告操作表
        insertoperation(adsuuid, useruuid, 'ads' + mode, new Date());

    }
}

export async function checkads(req: Request, res: Response, next: NextFunction, adsuuid: string) {
    let balance = await queryBalanceByadsuuid(req.app.locals.sequelize, adsuuid);

    if (balance == null || balance == undefined || balance.length == 0) {
        return false;
    } else if (balance[0].crm_balance <= 0) {
        //让广告下架  展示时对投放 做过滤 这里就不做了
        await updateadsStatus(adsuuid, 0);
        updateAdvertiserByadsuuid(req.app.locals.sequelize, adsuuid, 2);
        return false
    }
    return true;
}

/*
POST /favorite {adsuuid=xxx} & uuid
 */
router.post('/favorite/:adsuuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        //validateCgi({ adsuuid: adsuuid }, usersValidator.uuid)
        let user = await findByPrimary(loginInfo.getUuid())
        if (!user) {
            return sendNotFound(res, "用户不存在！")
        }

        let ads = await getByUuid(adsuuid)
        if (!ads) {
            return sendNotFound(res, "广告不存在！")
        }

        let favorite = await getByUserAds(loginInfo.getUuid(), adsuuid)

        let obj = {
            useruuid: loginInfo.getUuid(),
            loginnumber: 0,
            searchnumber: 0,
            favoritenumber: 1,
            type: 'ads',
        }
        await insertStatistics(obj)
        let state
        if (!favorite) {
            await favoriateInsert(user.uuid, adsuuid)
            state = "1"
        }

        return createdOk(res, { favorite: state })
    } catch (e) {
        e.info(se, res, e)
    }
})

/*
DELETE /favorite {adsuuid=xxx} & uuid
 */
router.delete('/favorite/:adsuuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        //validateCgi({ adsuuid: adsuuid }, usersValidator.uuid)
        await deleteByUserAds(adsuuid, loginInfo.getUuid())
        return deleteOK(res, { favorite: "0" })
    } catch (e) {
        e.info(se, res, e)
    }
})

async function array_remove_repeat(a: Array<string>) { // 去重
    let r = [];
    for (let i = 0; i < a.length; i++) {
        let flag = true;
        let temp = a[i];
        for (let j = 0; j < r.length; j++) {
            if (temp === r[j]) {
                flag = false;
                break;
            }
        }
        if (flag) {
            r.push(temp);
        }
    }
    return r;
}

async function array_intersection(a: Array<string>, b: Array<string>) { // 交集
    let result = [];
    for (let i = 0; i < b.length; i++) {
        let temp = b[i];
        for (let j = 0; j < a.length; j++) {
            if (temp === a[j]) {
                result.push(temp);
                break;
            }
        }
    }
    return await array_remove_repeat(result);
}

async function array_union(a: Array<string>, b: Array<string>) { // 并集
    return await array_remove_repeat(a.concat(b));
}
/*answer question*/
router.put('/answer/:adsuuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    let { answer, questionindex } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let opt = await getAnswerAds(adsuuid)
        if (opt && opt === loginInfo.getUuid()) {
            return sendNotFound(res, "不能重复提交")
        } else {
            await saveAnswerAds(adsuuid, loginInfo.getUuid())
        }
        logger.info(adsuuid, loginInfo.getUuid(), "answer");
        //validator.validateCgi({ adsuuid: adsuuid, answer: answer }, adsValidator["answers"])
        let adslog = await getByTwoUuid(adsuuid, loginInfo.getUuid())
        if (adslog && adslog.state)
            return sendNotFound(res, "不能重复答题")
        let points = 0
        let rebalance = 0
        let appUser = await findByPrimary(loginInfo.getUuid())
        let ads = await getByUuid(adsuuid)
        let answerSet
        let newAnswerSet
        let union
        let intersectionSet
        //*********************************************答题*********************************************** */
        if (questionindex === null || questionindex === undefined) {//之前版本题目
            answerSet = Array.from(new Set<string>(ads.question.answer))//正确答案
            newAnswerSet = Array.from(new Set<string>(answer))//回答的答案
            union = await array_union(answerSet, newAnswerSet)//并集
            intersectionSet = await array_intersection(answerSet, newAnswerSet)//交集
        } else {
            answerSet = Array.from(new Set<string>(ads.question_ext[questionindex].answer))//真确答案
            newAnswerSet = Array.from(new Set<string>(answer))//回答的答案
            union = await array_union(answerSet, newAnswerSet)//并集
            intersectionSet = await array_intersection(answerSet, newAnswerSet)//交集
        }
        //*************************************************************************************************** */

        //全对用户加points广告totalpoints减广告points
        if (intersectionSet.length === answerSet.length && intersectionSet.length === newAnswerSet.length) {
            switch (ads.mold) {
                case "point":
                    points = ads.points
                    rebalance = 0
                    break;
                case "balance":
                    points = 0
                    rebalance = ads.balance
                    break;
                case "two":
                    points = ads.points
                    rebalance = ads.balance
                    break;
            }
        } else if ((union.length - intersectionSet.length) == (answerSet.length - newAnswerSet.length) && newAnswerSet.length > 0) {
            switch (ads.mold) {
                case "point":
                    points = Math.floor(ads.points / 2)
                    rebalance = 0
                    break;
                case "balance":
                    points = 0
                    rebalance = Math.floor(ads.balance / 2)
                    break;
                case "two":
                    points = Math.floor(ads.points / 2)
                    rebalance = Math.floor(ads.balance / 2)
                    break;
            }
        }
        let adstotalpoints = ads.totalpoints - points
        let adstotalbalance = ads.totalbalance - rebalance
        let upd = {
            totalpoints: adstotalpoints,
            totalbalance: adstotalbalance
        }
        let updateUser = {
            points: points,
            balance: rebalance * 100,
            exp: points
        }
        if (adstotalpoints >= 0 && adstotalbalance >= 0) {//修改后的积分和零钱大于零
            await updateByUuid(upd, ads.uuid)//广告减积分和零钱
            await updatePoints(appUser.uuid, updateUser)//用户加积分零钱和经验
        } else {
            points = -1
            rebalance = -1
        }


        //修改广告记录
        if (!adslog) {//不存在广告记录
            let newadslog = {
                aduuid: adsuuid,
                useruuid: loginInfo.getUuid(),
                points: points,
                balance: rebalance,
                openid: appUser.openid,
                answercount: 1,
                state: 'fin'
            }
            await insertAdslog(newadslog)//添加广告记录

        } else {//存在广告记录

            if (!adslog.points) {//如果积分不存在
                adslog.points = points
            } else {//积分存在
                adslog.points = adslog.points + points
            }

            if (adslog.answercount) {//答题数不存在
                adslog.answercount = 1
            } else {//答题数存在
                adslog.answercount = adslog.answercount + 1
            }

            if (adslog.balance) {//积分不存在
                adslog.balance = rebalance
            } else {//积分存在
                adslog.balance = adslog.balance + rebalance
            }

            let updateadslog = {
                points: adslog.points,
                balance: adslog.rebalance,
                answercount: adslog.answercount,
                state: 'fin'
            }

            await updateAdslog(updateadslog, adslog.uuid)//修改答题记录
        }

        let reward = {
            useruuid: loginInfo.getUuid(),
            username: appUser.username,
            realname: appUser.realname,
            point: points,
            balance: rebalance,
            type: 'answer'
        }
        if (reward.point !== -1 || reward.balance !== -1) {
            await insertReward(reward)
            await amountcheck(req.app.locals.sequelize, loginInfo.getUuid(), "answer", rebalance, reward.point)
        }

        /*  if (ads.mold == 'balance' || ads.mold == 'two') {
             if (rebalance > 100) {
                 let form = {
                     amount: rebalance,
                     description: 'immediate'
                 }
                 let headers = {
                     uuid: loginInfo.getUuid(),
                     token: loginInfo.getToken()
                 }
                 let result = await postAsync({
                     form: form,
                     headers: headers,
                     //url: `https://192.168.0.130/app/api/payment/${loginInfo.getUuid()}`
                     // url: `https://www.shijinsz.net/app/api/payment/${loginInfo.getUuid()}`
                     url: `https://39.108.171.104/app/api/payment/${loginInfo.getUuid()}`
                 })
                 if (result && JSON.parse(result).msg === '已经发送请求！') {
                     let adslogstate = {
                         paytype: 'immediate'
                     }
                     await updateAdslog(adslogstate, adslog.uuid)
                 }
 
             }
         } */
        ads.totalbalance = ads.totalbalance - rebalance
        ads.balance = ads.balance
        ads.allbalance = ads.allbalance
        ads.totalpoints = ads.totalpoints - points
        if (questionindex != null && questionindex != undefined) {
            return createdOk(res, { answers: ads.question_ext[questionindex].answer, points: points + '', balance: rebalance + '', ads: ads })
        } else {
            return createdOk(res, { answers: ads.question.answer, points: points + '', balance: rebalance + '', ads: ads })
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

/*answer question*/
router.put('/iosanswer/:adsuuid', async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    let { answer, questionindex } = (req as any).body
    try {
        //validator.validateCgi({ adsuuid: adsuuid, answer: answer }, adsValidator["answers"])
        let ads = await getByUuid(adsuuid)
        let answerSet
        let newAnswerSet
        let union
        let intersectionSet
        if (questionindex === null || questionindex === undefined) {//之前的答题
            answerSet = Array.from(new Set<string>(ads.question.answer))
            newAnswerSet = Array.from(new Set<string>(answer))
            union = await array_union(answerSet, newAnswerSet)
            intersectionSet = await array_intersection(answerSet, newAnswerSet)
            //全对用户加points广告totalpoints减广告points
            if (intersectionSet.length === answerSet.length && intersectionSet.length === newAnswerSet.length) {
                return createdOk(res, { answers: ads.question.answer, msg: '回答正确', ads: ads })
            } else if ((union.length - intersectionSet.length) == (answerSet.length - newAnswerSet.length) && newAnswerSet.length > 0) {
                return createdOk(res, { answers: ads.question.answer, msg: '答对部分', ads: ads })
            }

            return createdOk(res, { answers: ads.question.answer, msg: '回答错误', ads: ads })

        } else {//v2.1答题
            answerSet = Array.from(new Set<string>(ads.question_ext[questionindex].answer))//真确答案
            newAnswerSet = Array.from(new Set<string>(answer))//回答的答案
            union = await array_union(answerSet, newAnswerSet)//并集
            intersectionSet = await array_intersection(answerSet, newAnswerSet)//交集
            //全对用户加points广告totalpoints减广告points
            if (intersectionSet.length === answerSet.length && intersectionSet.length === newAnswerSet.length) {
                return createdOk(res, { answers: ads.question_ext[questionindex].answer, msg: '回答正确', ads: ads })
            } else if ((union.length - intersectionSet.length) == (answerSet.length - newAnswerSet.length) && newAnswerSet.length > 0) {
                return createdOk(res, { answers: ads.question_ext[questionindex].answer, msg: '答对部分', ads: ads })
            }
            return createdOk(res, { answers: ads.question_ext[questionindex].answer, msg: '回答错误', ads: ads })
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 广告点赞(好评)
 */
router.put('/nice/:adsuuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        await updateNice(adsuuid)
        await insertApplaud(adsuuid, loginInfo.getUuid(), 'nice')
        return sendOK(res, { applaud: "nice" })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 广告踩（差评）
 */
router.put('/low/:adsuuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        await updateLow(adsuuid)
        await insertApplaud(adsuuid, loginInfo.getUuid(), 'low')
        return sendOK(res, { applaud: "low" })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 取消点赞
 */
router.put('/cancel/:adsuuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { applaud } = (req as any).body
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (applaud === 'low') {
            await updateApplaud(adsuuid, 1, 0)//减少差评
        } else {
            await updateApplaud(adsuuid, 0, 1)//减少好评
        }
        let laud = await findByUseruuidAndAdsuuid(adsuuid, loginInfo.getUuid())//点赞记录
        await deleteByAdsUuid(laud.uuid)
        return sendOK(res, { applaud: null })
    } catch (e) {
        e.info(se, res, e)
    }
})
//返回标题图的相对路径
router.get('/:adsuuid/getcoverimage', async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params['adsuuid'];
    try {
        //validateCgi({adsuuid : adsuuid} , adscoverValidator.adsuuid);
        let re = await queryCoverpic(adsuuid);
        if (re) {
            return sendOK(res, { 'data': re })
        }
        return sendOK(res, { 'data': 'null' });
    } catch (e) {
        e.info(se, res, e)
    }

});

router.post('/:adsuuid/coverimage', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params['adsuuid'] as string;

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
        await modifilyCoverpic(adsuuid, newPath)
        return createdOk(res, { path: newPath })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:adsuuid/coverimage', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: string = (req as any).body.mediaName
    let adsuuid = req.params["adsuuid"] as string
    try {
        mediaName = path.join(adsCoverImgOpt.targetDir, adsuuid, mediaName)
        await removeAsync(mediaName)
        //更新到数据库
        await modifilyCoverpic(adsuuid, null);
        return deleteOK(res, { msg: "succ" })
    } catch (e) {
        e.info(se, res, e)
    }
})


//没被调用2018-02-05
router.post('/CPCpay', async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = (req as any).body.adsuuid;
    try {
        await upadspoints(adsuuid);
        await updateViews(adsuuid);
        await appAdsPay(req, res, next, adsuuid, '', 'cpc', 'point');
        return sendOK(res, 'succ');
    } catch (e) {
        e.info(res, se, e)
    }
})