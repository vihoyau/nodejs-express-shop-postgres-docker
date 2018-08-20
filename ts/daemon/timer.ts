import { findWaitPay, updateWaitPay, updateWaitRecv, updateWaitComment } from "../model/orders/orders"
import { updateNumber } from "../model/mall/goods"
//import { findAdsByOn, updateByStateUuid, findadsByApproved, updateHeat } from "../model/ads/ads"
import { downadsStatus } from "../router/crm/puton"
import { findplanBystatus1, findAllplanByadvertiseruuid } from "../model/puton/plan"
import { findAllunitByplanuuids, queryunitone } from "../model/puton/unit"
import { findPenMen } from "../model/ads/adslog"
import { delExp, findByPrimary } from "../model/users/users_ext"
import { getAllCoupon, couponAutoExpired } from "../model/mall/coupon"
import { usercouponAutoExpired } from "../model/users/usercoupon"
import { findAlloperationByunituuid } from "../model/ads/adsoperation"
import { findByName } from "../model/system/system"
import { updateAdstempStatus, updateadsstatus, deleteEmptyads, queryAdsByunituuid } from "../model/ads/ads"
import { deleteEmptyinfo } from "../model/ads/informationads"
import { finddailybudgetisZERO, findAlladvertiser, updatedailybudget } from "../model/ads/advertiser"
import { find_All_Activity, activityAutoOpen, activityAutoExpired } from "../model/mall/collectioncreate"
import { findByDateAndUUID, insertDaySum } from "../model/ads/daysum"
import { findExpiredGroup } from "../model/evaluate/evaluategroup"
import { cancelGroup } from "../router/crm/evaluate"
import { insertMonthSum } from "../model/ads/monthsum"
import * as logger from "winston"
import * as moment from "moment"

async function comparepro(arr: any, str: Array<string>, num: number) {
    for (let j = 0; j < arr.length; j++) {
        for (let i = 0; i < str.length; i++) {
            if (arr[j].type === str[i]) {
                if (arr[j].data) {
                    arr[j].data = await comparepro(arr[j].data, str, num)
                    return arr
                } else {
                    arr[j].stock = arr[j].stock + num + ""
                    return arr
                }
            }
        }
    }
}

export async function run() {
    try {
        setInterval(async () => {
            let tranction = await findByName('transaction')
            let orders = await findWaitPay(tranction.content.waitpay)
            for (let i = 0; i < orders.length; i++) {
                let good = orders[i].goods
                if (good) {
                    for (let i = 0; i < good.length; i++) {
                        //判断商品是否已下线
                        let newpropertySet = good[i].property.split(",")
                        if (good[i].tags) {
                            let arr = await comparepro(good[i].tags, newpropertySet, good[i].number)
                            await updateNumber(arr, good[i].gooduuid)
                        }
                    }
                }
            }
            await updateWaitPay(tranction.content.waitpay, 'cancel')
            await updateWaitRecv(tranction.content.waitrecv, 'wait-comment')
            await updateWaitComment(40, 'finish')
        }, 1000 * 60 * 60)
    } catch (e) {
        logger.error("auto update orders", e.message)
    }
}

export async function actStateCheck(){
    setInterval(async () => {
        let nowTime = new Date().getTime()
        let ac_ext = await find_All_Activity()
        for (let i = 0; i < ac_ext.length; i++) {
            let endtime = new Date(ac_ext[i].Endtime).getTime()
            let starttime = new Date(ac_ext[i].Starttime).getTime()
            if (ac_ext[i].State === 0) {
                if (starttime <= nowTime) {
                    let uuid = ac_ext[i].uuid
                    await activityAutoOpen(uuid)
                }
            }
            if (ac_ext[i].State === 1) {
                if (endtime <= nowTime) {
                    let uuid = ac_ext[i].uuid
                    await activityAutoExpired(uuid)
                }
            }
        }
    }, 10000)
}




//自动上下架广告

// async function updatestate(adss: any) {
//     for (let i = 0; i < adss.length; i++) {
//         let ads = adss[i]
//         if (ads.tsrange[1] < (new Date())) {
//             await updateByStateUuid('off', ads.uuid)
//             await updateHeat(ads.uuid, 0)//取消推荐
//         }
//     }
// }

// export async function autoOffsale() {
//     setInterval(async () => {
//         //查询所有已上线的广告
//         let ads = await findAdsByOn()
//         await updatestate(ads)
//     }, 1000 * 60 * 30)
// }

// export async function autoAdsOn() {
//     try {
//         setInterval(async () => {
//             //查询所有已上线的广告
//             let adsOff = await findadsByApproved()
//             await updatestateon(adsOff)
//             let adsOn = await findAdsByOn()
//             await updatestate(adsOn)
//         }, 1000 * 60)
//     } catch (e) {
//         logger.error("auto on or off ads", e.message)
//     }
// }

// async function updatestateon(adss: any) {
//     for (let i = 0; i < adss.length; i++) {
//         let ads = adss[i]
//         if (ads.tsrange[0] < (new Date()) && ads.tsrange[1] > (new Date())) {
//             await updateByStateUuid('on', ads.uuid)
//         }
//     }
// }

//新版广告下架


export async function nautoAdsoff(){
    try{
        setInterval(async () => {
            let plans = await findplanBystatus1();
            for (let i = 0; i < plans.length; i++) {
                let plan = plans[i]
                if(plan.enddate==undefined||plan.enddate==null){
                    continue;
                }
                if (plan.enddate < (new Date())) {
                    downadsStatus(plans[i].uuid);
                }
                let advertisers = await finddailybudgetisZERO();
                if(advertisers.length!=0){
                    updateadsstatus(advertisers);
                }
            }
        },1000*60)
    }catch(e){
        logger.info('nautoAdsoff', e.message)
    }
}



export async function deletebyEmptyads(){
    setInterval(async () => {
        let date = new Date();
        date.setHours(date.getHours()-1);
        deleteEmptyads(date);
        deleteEmptyinfo(date)
    }, 1000 * 60);
}

//新版广告因预存自动下架，到点自动上架

export async function upAdsBynextdat(){

    setInterval(async () => {
        if(new Date('23:58:00')<new Date()||new Date('00:02:00')>new Date()){
            updatedailybudget();
            updateAdstempStatus();
        }
    },1000*60*2)
}


export async function delexp() {
    try {
        let punishment = await findByName('punishment')
        setInterval(async () => {
            let useruuids = await findPenMen(punishment.content.pentime)
            for (let i = 0; i < useruuids.length; i++) {
                if (useruuids.indexOf(useruuids[i]) === i) {
                    let users_ext = await findByPrimary(useruuids[i])
                    if (users_ext.exp > punishment.content.penexp) {
                        await delExp(useruuids[i], punishment.content.penexp)
                    }
                }
            }
        }, punishment.content.pentime === 0 ? 1000 * 60 * 60 * 24 : 1000 * 60 * 60 * 24 * punishment.content.pentime)
    } catch (e) {
        logger.info('delexp', e.message)
    }
}



/**
 * 自动过期or自动变更可用
 */
export async function autoExpired() {
    setInterval(async () => {
        let couponons = await getAllCoupon('on')
        if (couponons)
            await updatecouponoff(couponons)
        let couponoffs = await getAllCoupon('off')
        if (couponoffs)
            await updatecouponon(couponoffs)

    }, 1000 * 60)
}

async function updatecouponoff(coupons: any) {
    for (let i = 0; i < coupons.length; i++) {
        let coupon = coupons[i]
        if (coupon.tsrange[0] > (new Date()) || (new Date()) > coupon.tsrange[1]) {
            await couponAutoExpired('off', coupon.uuid)//商家发放的优惠券自动过期
            await usercouponAutoExpired('expired', coupon.uuid)//用户所领取对应的优惠券自动过期
        }
    }
}

async function updatecouponon(coupons: any) {
    for (let i = 0; i < coupons.length; i++) {
        let coupon = coupons[i]
        if (coupon.tsrange[0] <= (new Date()) && (new Date()) <= coupon.tsrange[1]) {
            await couponAutoExpired('on', coupon.uuid)//商家发放的优惠券自动变更为可用
            await usercouponAutoExpired('new', coupon.uuid)//用户所领取对应的优惠券自动变更为可用
        }
    }
}

//自动汇总广告浏览记录，每天汇总一次,每小时轮询
export async function autoSummaryAdsOperation(seqz: any) {
    setInterval(async () => {
        let yesterdaydate = moment().subtract(1, 'days').format('YYYY-MM-DD')
        let todaydate = moment().format('YYYY-MM-DD')
        let advertiser = await findAlladvertiser()
        for (let i = 0; i < advertiser.length; i++) {//遍历全部的广告商
            let res = await findByDateAndUUID(yesterdaydate, advertiser[i].uuid)
            if (!res) {     //这个广告商昨日还未汇总
                await summary(seqz, advertiser[i].uuid, yesterdaydate + ' 00:00:00', todaydate + ' 00:00:00')
            }
        }
    }, 1000 * 60 * 60)
}

//汇总广告商昨天的记录
export async function summary(seqz: any, advertiseruuid: any, yesterdaydate: any, todaydate: any) {
    let plans = await findAllplanByadvertiseruuid(advertiseruuid);
    let unitinfo = await findAllunitByplanuuids(seqz, plans);
    let unit: any, adsinfo: any, adss: any, consume = 0, points = 0, show = 0;
    for (let i = 0; i < unitinfo.length; i++) {
        let unitshow = 0, unitpoints = 0;
        unit = await queryunitone(unitinfo[i].uuid);
        adsinfo = await queryAdsByunituuid(unitinfo[i].uuid);
        adss = await findAlloperationByunituuid(seqz, adsinfo, new Date(yesterdaydate), new Date(todaydate));
        if (adss == undefined || adss.length == 0) {
            continue;
        }

        for (let j = 0; j < adss.length; j++) {
            if (adss[j].method == "adspoint" || adss[j].method == "adsurl") {
                points++; unitpoints++
            } else {
                show++; unitshow++
            }
        }

        if (unit.method == 'cpc') {
            consume += unitpoints * parseFloat(unit.bid)
        } else if (unit.method == 'cpm') {
            consume += parseInt((unitshow / 1000).toString()) * parseFloat(unit.bid)
        } else if (unit.method == 'cpe') {
            if (unit.cpe_type == 0) { //展示
                consume += parseInt((unitshow / 1000).toString()) * parseFloat(unit.bid)
            } else if (unit.cpe_type == 1) {  //点击
                consume += unitpoints * parseFloat(unit.bid)
            } else {    //租用
                consume += 0.00
            }
        }
        unitshow = 0, unitpoints = 0;
    }
    let obj = {
        advertiseruuid,
        date: moment(yesterdaydate).format('YYYY-MM-DD'),
        points,
        show,
        consume
    }
    await insertDaySum(obj)
    return { points, show, consume }
}

//汇总广告商某月的记录
export async function monthSummary(seqz: any, advertiseruuid: any, startmonth: any, nextmonth: any) {
    let plans = await findAllplanByadvertiseruuid(advertiseruuid);
    let unitinfo = await findAllunitByplanuuids(seqz, plans);
    let unit: any, adsinfo: any, adss: any, consume = 0, points = 0, show = 0;
    for (let i = 0; i < unitinfo.length; i++) {
        let unitshow = 0, unitpoints = 0;
        unit = await queryunitone(unitinfo[i].uuid);
        adsinfo = await queryAdsByunituuid(unitinfo[i].uuid);
        adss = await findAlloperationByunituuid(seqz, adsinfo, new Date(startmonth), new Date(nextmonth));
        if (adss == undefined || adss.length == 0) {
            continue;
        }

        for (let j = 0; j < adss.length; j++) {
            if (adss[j].method == "adspoint" || adss[j].method == "adsurl") {
                points++; unitpoints++
            } else {
                show++; unitshow++
            }
        }

        if (unit.method == 'cpc') {
            consume += unitpoints * parseFloat(unit.bid)
        } else if (unit.method == 'cpm') {
            consume += parseInt((unitshow / 1000).toString()) * parseFloat(unit.bid)
        } else if (unit.method == 'cpe') {
            if (unit.cpe_type == 0) { //展示
                consume += parseInt((unitshow / 1000).toString()) * parseFloat(unit.bid)
            } else if (unit.cpe_type == 1) {  //点击
                consume += unitpoints * parseFloat(unit.bid)
            } else {    //租用
                consume += 0.00
            }
        }
        unitshow = 0, unitpoints = 0;
    }
    let obj = {
        advertiseruuid,
        date: moment(startmonth).format('YYYY-MM'),
        points,
        show,
        consume
    }
    await insertMonthSum(obj)
    return { points, show, consume }
}

//自动取消那些没拼成功的团，猜猜购
export async function autoCancelGroup(seqz: any) {
    setInterval(async () => {
        let groups = await findExpiredGroup(seqz)
        for (let i = 0; i < groups.length; i++) {
            await cancelGroup(groups[i].uuid)
        }
    }, 1000 * 60 * 5)
}