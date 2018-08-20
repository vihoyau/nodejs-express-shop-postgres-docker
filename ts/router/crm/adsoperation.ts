
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendErrMsg } from "../../lib/response"
import { findAlloperationByadsuuid_date, findAlloperationByunituuid/* , findAlloperationByadsuuid */, createdoperation } from "../../model/ads/adsoperation"
import { queryunitByadsuuid, queryunitone, findAllunitByplanuuid, findAllunitByplanuuids, findunitByplanuuid } from "../../model/puton/unit"
import { findadsByunituuid, queryAdsByunituuid } from "../../model/ads/ads"
import { findAllplanByadvertiseruuid } from "../../model/puton/plan"
import { sortByTime, getNewStartEndTime } from "../../lib/adsoperation"
import { queryplanselect } from "../../model/puton/plan"
import { findAlladvertiser } from "../../model/ads/advertiser"
import { findByDateAndUUID } from "../../model/ads/daysum"
import { findByMonthAndUUID } from "../../model/ads/monthsum"
import { summary, monthSummary } from "../../daemon/timer"
import * as moment from "moment"
export const router = Router()

router.get('/getData', async function (req: Request, res: Response, next: NextFunction) {
    //时间  ， 时间单位 ， 类型
    let { uuid, startdate, enddate, datetype, ad_company_uuid, type, page, count, draw } = (req as any).query
    if (enddate == undefined || enddate == '') {
        enddate = new Date().toLocaleDateString();
    }
    try {
        if (type == "ad") {
            let adss, days2
            if ("hour" == datetype) {
                let date = new Date();
                adss = await findAlloperationByadsuuid_date(uuid, new Date(date.toLocaleDateString() + " " + startdate), new Date(date.toLocaleDateString() + " " + enddate));
            } else if ('day' == datetype) {
                let { starttime, endtime, days } = getNewStartEndTime(startdate, enddate, page, count)
                days2 = days
                adss = await findAlloperationByadsuuid_date(uuid, new Date(starttime), new Date(endtime));
            } else {
                adss = await findAlloperationByadsuuid_date(uuid, new Date(startdate), new Date(enddate));
            }

            let unit = await queryunitByadsuuid(req.app.locals.sequelize, uuid);
            if (adss.length == 0) {
                return sendOK(res, {
                    data: [{
                        Price_of_thousand: 0,
                        time: 0,
                        pointamount: 0,
                        showmount: 0,
                        consume: 0,
                        CTR: 0,
                        bid: 0
                    }], recordsFiltered: 0, draw: draw
                });
            }//无操作记录
            if (unit == undefined) {
                return sendErrMsg(res, "旧广告", 402);
            }
            if ("hour" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let no
                for (let i = 0; i < adss.length; i++) {
                    no = moment(adss[i].created).format('YYYY-MM-DD HH')
                    if (pointShowMap.get(no) == undefined) {
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [1, 0]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [0, 1]);
                    } else {
                        let val = pointShowMap.get(no)
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [val[0] + 1, val[1]]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [val[0], val[1] + 1]);
                    }
                }
                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                pointShowMap.forEach((pointShow, time) => {
                    let consume = 0
                    if (unit.method == 'cpc') {
                        consume += pointShow[0] * parseFloat(unit.bid)
                    } else if (unit.method == 'cpm') {
                        consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                    } else if (unit.method == 'cpe') {
                        if (unit.cpe_type == 0) { //展示
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.cpe_type == 1) {  //点击
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else {    //租用
                            consume += 0.00
                        }
                    }
                    let obj = {
                        Price_of_thousand: pointShow[1] / 1000,
                        time: time,
                        pointamount: pointShow[0],
                        showmount: pointShow[1],
                        consume: consume,
                        CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                        bid: unit.bid
                    }

                    let val = totalMap.get(obj.time);
                    if (val != undefined) {
                        totalMap.set(obj.time, {
                            time: obj.time,
                            pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                            showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                            consume: parseFloat(val.consume) + obj.consume,
                            CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                            Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                            bid: parseFloat(val.consume) + obj.consume
                        })
                    } else {
                        totalMap.set(obj.time, obj);
                    }
                })
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    r.time = moment(r.time).format('YYYY-MM-DD HH:00:00') + '~' + moment(r.time).add(1, 'hours').format('YYYY-MM-DD HH:00:00')
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            } else if ("day" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let no
                for (let i = 0; i < adss.length; i++) {
                    no = moment(adss[i].created).format('YYYY-MM-DD')
                    if (pointShowMap.get(no) == undefined) {
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [1, 0]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [0, 1]);
                    } else {
                        let val = pointShowMap.get(no)
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [val[0] + 1, val[1]]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [val[0], val[1] + 1]);
                    }
                }
                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                pointShowMap.forEach((pointShow, time) => {
                    let consume = 0
                    if (unit.method == 'cpc') {
                        consume += pointShow[0] * parseFloat(unit.bid)
                    } else if (unit.method == 'cpm') {
                        consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                    } else if (unit.method == 'cpe') {
                        if (unit.cpe_type == 0) { //展示
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.cpe_type == 1) {  //点击
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else {    //租用
                            consume += 0.00
                        }
                    }
                    let obj = {
                        Price_of_thousand: pointShow[1] / 1000,
                        time: time,
                        pointamount: pointShow[0],
                        showmount: pointShow[1],
                        consume,
                        CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                        bid: unit.bid
                    }

                    let val = totalMap.get(obj.time);
                    if (val != undefined) {
                        totalMap.set(obj.time, {
                            time: obj.time,
                            pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                            showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                            consume: parseFloat(val.consume) + obj.consume,
                            CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                            Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                            bid: parseFloat(val.consume) + obj.consume
                        })
                    } else {
                        totalMap.set(obj.time, obj);
                    }
                })
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: days2, draw: draw });
            } else if ("month" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let no
                for (let i = 0; i < adss.length; i++) {
                    no = moment(adss[i].created).format('YYYY-MM')
                    if (pointShowMap.get(no) == undefined) {
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [1, 0]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [0, 1]);
                    } else {
                        let val = pointShowMap.get(no)
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [val[0] + 1, val[1]]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [val[0], val[1] + 1]);
                    }
                }

                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                pointShowMap.forEach((pointShow, time) => {
                    let consume = 0
                    if (unit.method == 'cpc') {
                        consume += pointShow[0] * parseFloat(unit.bid)
                    } else if (unit.method == 'cpm') {
                        consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                    } else if (unit.method == 'cpe') {
                        if (unit.cpe_type == 0) { //展示
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.cpe_type == 1) {  //点击
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else {    //租用
                            consume += 0.00
                        }
                    }
                    let obj = {
                        Price_of_thousand: pointShow[1] / 1000,
                        time: time,
                        pointamount: pointShow[0],
                        showmount: pointShow[1],
                        consume,
                        CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                        bid: unit.bid
                    }

                    let val = totalMap.get(obj.time);
                    if (val != undefined) {
                        totalMap.set(obj.time, {
                            time: obj.time,
                            pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                            showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                            consume: parseFloat(val.consume) + obj.consume,
                            CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                            Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                            bid: parseFloat(val.consume) + obj.consume
                        })
                    } else {
                        totalMap.set(obj.time, obj);
                    }
                })
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });

            } else if ("all" == datetype) {
                let adspointNum = 0;
                let adsshowNum = 0;

                for (let i = 0; i < adss.length; i++) {

                    if (adss[i].method == "adspoint" || adss[i].method == "adsurl") {
                        adspointNum++;
                    }

                    if (adss[i].method == "adsshow") {
                        adsshowNum++;
                    }
                }

                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量

                let returnarr = [];

                let obj = {
                    Price_of_thousand: Math.floor(adsshowNum / 1000),
                    pointamount: adspointNum,
                    showmount: adsshowNum,
                    consume: (adspointNum * parseFloat(unit.bid)).toFixed(2),
                    CTR: (adspointNum / adsshowNum).toFixed(2),
                    bid: (adspointNum * parseFloat(unit.bid) / adspointNum).toFixed(2),
                    time: startdate
                }
                obj.bid = obj.bid == 'NaN' ? "0.00" : obj.bid
                returnarr.push(obj);
                return sendOK(res, { data: returnarr, recordsFiltered: returnarr.length, draw: draw });
            }
            return sendOK(res, 'error');
        } else if (type == "unit") {
            let unit = await queryunitone(uuid);
            let adsinfo = await findadsByunituuid(uuid);

            let adss, days2
            if ("hour" == datetype) {
                let date = new Date();
                adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(date.toLocaleDateString() + " " + startdate), new Date(date.toLocaleDateString() + " " + enddate));
            } else if ('day' == datetype) {
                let { starttime, endtime, days } = getNewStartEndTime(startdate, enddate, page, count)
                days2 = days
                adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(starttime), new Date(endtime));
            } else {
                adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(startdate), new Date(enddate));
            }

            if (adss.length == 0 || adss == undefined) {
                return sendOK(res, {
                    data: [{
                        Price_of_thousand: 0,
                        time: 0,
                        pointamount: 0,
                        showmount: 0,
                        consume: 0,
                        CTR: 0,
                        bid: 0
                    }], recordsFiltered: 0, draw: draw
                });
            }
            if (unit == undefined) {
                return sendErrMsg(res, "旧广告", 402);
            }
            if ("hour" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let no

                for (let i = 0; i < adss.length; i++) {
                    no = moment(adss[i].created).format('YYYY-MM-DD HH')
                    if (pointShowMap.get(no) == undefined) {
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [1, 0]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [0, 1]);
                    } else {
                        let val = pointShowMap.get(no)
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [val[0] + 1, val[1]]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [val[0], val[1] + 1]);
                    }
                }
                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                pointShowMap.forEach((pointShow, time) => {
                    let consume = 0
                    if (unit.method == 'cpc') {
                        consume += pointShow[0] * parseFloat(unit.bid)
                    } else if (unit.method == 'cpm') {
                        consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                    } else if (unit.method == 'cpe') {
                        if (unit.cpe_type == 0) { //展示
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.cpe_type == 1) {  //点击
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else {    //租用
                            consume += 0.00
                        }
                    }
                    let obj = {
                        Price_of_thousand: pointShow[1] / 1000,
                        time: time,
                        pointamount: pointShow[0],
                        showmount: pointShow[1],
                        consume,
                        CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                        bid: unit.bid
                    }

                    let val = totalMap.get(obj.time);
                    if (val != undefined) {
                        totalMap.set(obj.time, {
                            time: obj.time,
                            pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                            showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                            consume: parseFloat(val.consume) + obj.consume,
                            CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                            Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                            bid: parseFloat(val.consume) + obj.consume
                        })
                    } else {
                        totalMap.set(obj.time, obj);
                    }
                })
                pointShowMap.clear()
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    r.time = moment(r.time).format('YYYY-MM-DD HH:00:00') + '~' + moment(r.time).add(1, 'hours').format('YYYY-MM-DD HH:00:00')
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: days2, draw: draw });
            } else if ("day" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let no
                for (let i = 0; i < adss.length; i++) {
                    no = moment(adss[i].created).format('YYYY-MM-DD')
                    if (pointShowMap.get(no) == undefined) {
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [1, 0]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [0, 1]);
                    } else {
                        let val = pointShowMap.get(no)
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [val[0] + 1, val[1]]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [val[0], val[1] + 1]);
                    }
                }
                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                pointShowMap.forEach((pointShow, time) => {
                    let consume = 0
                    if (unit.method == 'cpc') {
                        consume += pointShow[0] * parseFloat(unit.bid)
                    } else if (unit.method == 'cpm') {
                        consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                    } else if (unit.method == 'cpe') {
                        if (unit.cpe_type == 0) { //展示
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.cpe_type == 1) {  //点击
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else {    //租用
                            consume += 0.00
                        }
                    }
                    let obj = {
                        Price_of_thousand: pointShow[1] / 1000,
                        time: time,
                        pointamount: pointShow[0],
                        showmount: pointShow[1],
                        consume,
                        CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                        bid: unit.bid
                    }

                    let val = totalMap.get(obj.time);
                    if (val != undefined) {
                        totalMap.set(obj.time, {
                            time: obj.time,
                            pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                            showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                            consume: parseFloat(val.consume) + obj.consume,
                            CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                            Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                            bid: parseFloat(val.consume) + obj.consume
                        })
                    } else {
                        totalMap.set(obj.time, obj);
                    }
                })
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: days2, draw: draw });
            } else if ("month" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let no
                for (let i = 0; i < adss.length; i++) {
                    no = moment(adss[i].created).format('YYYY-MM')
                    if (pointShowMap.get(no) == undefined) {
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [1, 0]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [0, 1]);
                    } else {
                        let val = pointShowMap.get(no)
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                            pointShowMap.set(no, [val[0] + 1, val[1]]);
                        else if (adss[i].method == 'adsshow')
                            pointShowMap.set(no, [val[0], val[1] + 1]);
                    }
                }

                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                pointShowMap.forEach((pointShow, time) => {
                    let consume = 0
                    if (unit.method == 'cpc') {
                        consume += pointShow[0] * parseFloat(unit.bid)
                    } else if (unit.method == 'cpm') {
                        consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                    } else if (unit.method == 'cpe') {
                        if (unit.cpe_type == 0) { //展示
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.cpe_type == 1) {  //点击
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else {    //租用
                            consume += 0.00
                        }
                    }
                    let obj = {
                        Price_of_thousand: pointShow[1] / 1000,
                        time: time,
                        pointamount: pointShow[0],
                        showmount: pointShow[1],
                        consume,
                        CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                        bid: unit.bid
                    }

                    let val = totalMap.get(obj.time);
                    if (val != undefined) {
                        totalMap.set(obj.time, {
                            time: obj.time,
                            pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                            showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                            consume: parseFloat(val.consume) + obj.consume,
                            CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                            Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                            bid: parseFloat(val.consume) + obj.consume
                        })
                    } else {
                        totalMap.set(obj.time, obj);
                    }
                })
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            } else if ("all" == datetype) {
                let adspointNum = 0;
                let adsshowNum = 0;

                for (let i = 0; i < adss.length; i++) {

                    if (adss[i].method == "adspoint" || adss[i].method == "adsurl") {
                        adspointNum++;
                    }

                    if (adss[i].method == "adsshow") {
                        adsshowNum++;
                    }
                }

                // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量

                let returnarr = [];

                let obj = {
                    Price_of_thousand: Math.floor(adsshowNum / 1000),
                    pointamount: adspointNum,
                    showmount: adsshowNum,
                    consume: (adspointNum * parseFloat(unit.bid)).toFixed(2),
                    CTR: (adspointNum / adsshowNum).toFixed(2),
                    bid: (adspointNum * parseFloat(unit.bid) / adspointNum).toFixed(2),
                    time: startdate
                }
                obj.bid = obj.bid == 'NaN' ? "0.00" : obj.bid
                returnarr.push(obj);

                return sendOK(res, { data: returnarr, recordsFiltered: returnarr.length, draw: draw });
            }
            return sendOK(res, 'error');
        } else if (type == "plan") {
            let unitinfo = await findAllunitByplanuuid(uuid);
            let allbid = 0;
            if ("hour" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let unit: any, adsinfo: any, adss: any, no, allbid = 0
                for (let y = 0; y < unitinfo.length; y++) {
                    unit = await queryunitone(unitinfo[y].uuid);
                    adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    let date = new Date();
                    adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(date.toLocaleDateString() + " " + startdate), new Date(date.toLocaleDateString() + " " + enddate));
                    if (adss == undefined || adss.length == 0) {
                        continue;
                    }

                    allbid = allbid + unit.bid;

                    for (let i = 0; i < adss.length; i++) {
                        no = moment(adss[i].created).format('YYYY-MM-DD HH')
                        if (pointShowMap.get(no) == undefined) {
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [1, 0]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [0, 1]);
                        } else {
                            let val = pointShowMap.get(no)
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [val[0] + 1, val[1]]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [val[0], val[1] + 1]);
                        }
                    }
                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                    pointShowMap.forEach((pointShow, time) => {
                        let consume = 0
                        if (unit.method == 'cpc') {
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else if (unit.method == 'cpm') {
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.method == 'cpe') {
                            if (unit.cpe_type == 0) { //展示
                                consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                            } else if (unit.cpe_type == 1) {  //点击
                                consume += pointShow[0] * parseFloat(unit.bid)
                            } else {    //租用
                                consume += 0.00
                            }
                        }
                        let obj = {
                            Price_of_thousand: pointShow[1] / 1000,
                            time: time,
                            pointamount: pointShow[0],
                            showmount: pointShow[1],
                            consume,
                            CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                            bid: unit.bid
                        }

                        let val = totalMap.get(obj.time);
                        if (val != undefined) {
                            totalMap.set(obj.time, {
                                time: obj.time,
                                pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                                showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                                consume: parseFloat(val.consume) + obj.consume,
                                CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                                Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                                bid: parseFloat(val.consume) + obj.consume / allbid / unitinfo.length
                            })
                        } else {
                            totalMap.set(obj.time, obj);
                        }
                    })
                    pointShowMap.clear()
                }
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    r.time = moment(r.time).format('YYYY-MM-DD HH:00:00') + '~' + moment(r.time).add(1, 'hours').format('YYYY-MM-DD HH:00:00')
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            } else if ("day" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let unit: any, adsinfo: any, adss: any, no, allbid = 0
                let { starttime, endtime, days } = getNewStartEndTime(startdate, enddate, page, count)
                for (let y = 0; y < unitinfo.length; y++) {
                    unit = await queryunitone(unitinfo[y].uuid);
                    adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(starttime), new Date(endtime));
                    if (adss == undefined || adss.length == 0) {
                        continue;
                    }
                    allbid = allbid + unit.bid;
                    for (let i = 0; i < adss.length; i++) {
                        no = moment(adss[i].created).format('YYYY-MM-DD')
                        if (pointShowMap.get(no) == undefined) {
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [1, 0]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [0, 1]);
                        } else {
                            let val = pointShowMap.get(no)
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [val[0] + 1, val[1]]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [val[0], val[1] + 1]);
                        }
                    }
                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                    pointShowMap.forEach((pointShow, time) => {
                        let consume = 0
                        if (unit.method == 'cpc') {
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else if (unit.method == 'cpm') {
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.method == 'cpe') {
                            if (unit.cpe_type == 0) { //展示
                                consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                            } else if (unit.cpe_type == 1) {  //点击
                                consume += pointShow[0] * parseFloat(unit.bid)
                            } else {    //租用
                                consume += 0.00
                            }
                        }
                        let obj = {
                            Price_of_thousand: pointShow[1] / 1000,
                            time: time,
                            pointamount: pointShow[0],
                            showmount: pointShow[1],
                            consume,
                            CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                            bid: unit.bid
                        }

                        let val = totalMap.get(obj.time);
                        if (val != undefined) {
                            totalMap.set(obj.time, {
                                time: obj.time,
                                pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                                showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                                consume: parseFloat(val.consume) + obj.consume,
                                CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                                Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                                bid: parseFloat(val.consume) + obj.consume / allbid / unitinfo.length
                            })
                        } else {
                            totalMap.set(obj.time, obj);
                        }

                    })
                    pointShowMap.clear()
                }
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: days, draw: draw });
            } else if ("month" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let unit: any, adsinfo: any, adss: any, no, allbid = 0
                for (let y = 0; y < unitinfo.length; y++) {
                    unit = await queryunitone(unitinfo[y].uuid);
                    adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(startdate), new Date(enddate));
                    if (adss == undefined || adss.length == 0) {
                        continue;
                    }

                    allbid = allbid + unit.bid;

                    for (let i = 0; i < adss.length; i++) {
                        no = moment(adss[i].created).format('YYYY-MM')
                        if (pointShowMap.get(no) == undefined) {
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [1, 0]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [0, 1]);
                        } else {
                            let val = pointShowMap.get(no)
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [val[0] + 1, val[1]]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [val[0], val[1] + 1]);
                        }
                    }
                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                    pointShowMap.forEach((pointShow, time) => {
                        let consume = 0
                        if (unit.method == 'cpc') {
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else if (unit.method == 'cpm') {
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.method == 'cpe') {
                            if (unit.cpe_type == 0) { //展示
                                consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                            } else if (unit.cpe_type == 1) {  //点击
                                consume += pointShow[0] * parseFloat(unit.bid)
                            } else {    //租用
                                consume += 0.00
                            }
                        }
                        let obj = {
                            Price_of_thousand: pointShow[1] / 1000,
                            time: time,
                            pointamount: pointShow[0],
                            showmount: pointShow[1],
                            consume,
                            CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                            bid: unit.bid
                        }

                        let val = totalMap.get(obj.time);
                        if (val != undefined) {
                            totalMap.set(obj.time, {
                                time: obj.time,
                                pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                                showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                                consume: parseFloat(val.consume) + obj.consume,
                                CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                                Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                                bid: parseFloat(val.consume) + obj.consume / allbid / unitinfo.length
                            })
                        } else {
                            totalMap.set(obj.time, obj);
                        }

                    })
                    pointShowMap.clear()
                }
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            } else if ("all" == datetype) {
                let returnarr = [];
                for (let y = 0; y < unitinfo.length; y++) {
                    let unit = await queryunitone(unitinfo[y].uuid);
                    let adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    let adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(startdate), new Date(enddate));
                    if (adss == undefined || adss.length == 0) {
                        continue;
                    }
                    let adspointNum = 0;
                    let adsshowNum = 0;
                    allbid = allbid + unit.bid;
                    for (let i = 0; i < adss.length; i++) {

                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl") {
                            adspointNum++;
                        }

                        if (adss[i].method == "adsshow") {
                            adsshowNum++;
                        }
                    }
                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量

                    let obj = {
                        //Price_of_thousand: (adspointNum / adsshowNum * parseFloat(unit.bid) * 1000).toFixed(2),
                        // Price_of_thousand: parseInt((adsshowNum / 1000).toString()) * unit.bid,
                        Price_of_thousand: Math.floor(adsshowNum / 1000),
                        pointamount: adspointNum,
                        showmount: adsshowNum,
                        consume: adspointNum * parseFloat(unit.bid),
                        CTR: (adspointNum / adsshowNum).toFixed(2),
                        bid: unit.bid,
                        time: startdate
                    }
                    returnarr.push(obj);

                }
                if (returnarr.length == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }//无操作记录
                if (returnarr.length == 0) {
                    return sendOK(res, '无操作记录');
                }
                let totalMap = new Map();
                for (let x = 0; x < returnarr.length; x++) {
                    let val = totalMap.get("all");
                    if (val != undefined) {
                        totalMap.set("all", {
                            pointamount: parseInt(val.pointamount) + returnarr[x].pointamount,
                            showmount: parseInt(val.showmount) + returnarr[x].showmount,
                            consume: (parseFloat(val.consume) + returnarr[x].consume).toFixed(2),
                            CTR: ((parseFloat(val.pointamount) + returnarr[x].pointamount) / (parseInt(val.showmount) + returnarr[x].showmount)).toFixed(2),
                            //Price_of_thousand: ((parseFloat(val.pointamount) + returnarr[x].pointamount) / ((parseInt(val.showmount) + returnarr[x].showmount) * (parseFloat(val.consume) + returnarr[x].consume) / (parseInt(val.pointamount) + returnarr[x].pointamount) * 1000)).toFixed(2),
                            Price_of_thousand:  parseFloat(val.Price_of_thousand) + returnarr[x].Price_of_thousand,
                            bid: ((parseFloat(val.consume) + returnarr[x].consume) / allbid / unitinfo.length).toFixed(2),
                            time: startdate
                        })
                    } else {
                        totalMap.set("all", returnarr[x]);
                    }
                }
                let totalarr = [];
                let totalMapKeys = totalMap.keys()
                while (true) {
                    let keyObj = totalMapKeys.next();
                    if (keyObj.value == undefined) {
                        break;
                    }
                    let val = totalMap.get(keyObj.value);
                    val.bid = (val.consume / val.pointamount).toFixed(2)
                    val.bid = val.bid == "NaN" ? "0.00" : val.bid
                    totalarr.push(val);
                }
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            }
            return sendOK(res, 'error');
        } else if (type == "user") {
            let plans = await findAllplanByadvertiseruuid(ad_company_uuid);
            let unitinfo = await findAllunitByplanuuids(req.app.locals.sequelize, plans);
            if ("hour" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let unit: any, adsinfo: any, adss: any, no, allbid = 0
                for (let y = 0; y < unitinfo.length; y++) {
                    unit = await queryunitone(unitinfo[y].uuid);
                    adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    let date = new Date();
                    adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(date.toLocaleDateString() + " " + startdate), new Date(date.toLocaleDateString() + " " + enddate));
                    if (adss == undefined || adss.length == 0) {
                        continue;
                    }

                    allbid = allbid + unit.bid;

                    for (let i = 0; i < adss.length; i++) {
                        no = moment(adss[i].created).format('YYYY-MM-DD HH')
                        if (pointShowMap.get(no) == undefined) {
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [1, 0]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [0, 1]);
                        } else {
                            let val = pointShowMap.get(no)
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [val[0] + 1, val[1]]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [val[0], val[1] + 1]);
                        }
                    }

                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                    pointShowMap.forEach((pointShow, time) => {
                        let consume = 0
                        if (unit.method == 'cpc') {
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else if (unit.method == 'cpm') {
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.method == 'cpe') {
                            if (unit.cpe_type == 0) { //展示
                                consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                            } else if (unit.cpe_type == 1) {  //点击
                                consume += pointShow[0] * parseFloat(unit.bid)
                            } else {    //租用
                                consume += 0.00
                            }
                        }
                        let obj = {
                            Price_of_thousand: pointShow[1] / 1000,
                            time: time,
                            pointamount: pointShow[0],
                            showmount: pointShow[1],
                            consume,
                            CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                            bid: unit.bid
                        }

                        let val = totalMap.get(obj.time);
                        if (val != undefined) {
                            totalMap.set(obj.time, {
                                time: obj.time,
                                pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                                showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                                consume: parseFloat(val.consume) + obj.consume,
                                CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                                Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                                bid: parseFloat(val.consume) + obj.consume / allbid / unitinfo.length
                            })
                        } else {
                            totalMap.set(obj.time, obj);
                        }

                    })
                    pointShowMap.clear()
                }
                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }

                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    r.time = moment(r.time).format('YYYY-MM-DD HH:00:00') + '~' + moment(r.time).add(1, 'hours').format('YYYY-MM-DD HH:00:00')
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            } else if ("day" == datetype) {

                let totalMap = new Map(), pointShowMap = new Map();
                let unit: any, adsinfo: any, adss: any, no, allbid = 0
                let { starttime, endtime, days } = getNewStartEndTime(startdate, enddate, page, count)

                let startdate2 = moment(starttime).format('YYYY-MM-DD')
                let enddate2 = moment(endtime).format('YYYY-MM-DD')
                //从汇总表里面拿出往日的数据汇总，没有的话，可以马上统计
                while (1) {
                    if (startdate2 == enddate2)
                        break;

                    let daysum = await findByDateAndUUID(startdate2, ad_company_uuid)
                    if (daysum) {
                        totalMap.set(startdate2, {
                            time: startdate2,
                            pointamount: daysum.points,
                            showmount: daysum.show,
                            consume: daysum.consume,
                            CTR: daysum.show ? daysum.points / daysum.show : 0.00,   //点击率
                            Price_of_thousand: daysum.show / 1000,  //千次展示量
                            bid: daysum.consume / daysum.points //平均点击价格
                        })
                    } else {//这天的数据没有统计汇总
                        let tomorrow = moment(startdate2).add(1, 'days').format('YYYY-MM-DD')
                        let { points, show, consume } = await summary(req.app.locals.sequelize, ad_company_uuid,
                            startdate2 + ' 00:00:00', tomorrow + ' 00:00:00')

                        totalMap.set(startdate2, {
                            time: startdate2,
                            pointamount: points,
                            showmount: show,
                            consume: consume,
                            CTR: show ? points / show : 0.00,   //点击率
                            Price_of_thousand: show / 1000,  //千次展示量
                            bid: consume / points //平均点击价格
                        })
                    }
                    startdate2 = moment(startdate2).add(1, 'days').format('YYYY-MM-DD')
                }

                //统计零头数据
                enddate2 = enddate2 + ' 00:00:00'
                for (let y = 0; y < unitinfo.length; y++) {
                    unit = await queryunitone(unitinfo[y].uuid);
                    adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(enddate2), new Date(endtime));
                    if (adss == undefined || adss.length == 0) {
                        continue;
                    }

                    allbid = allbid + unit.bid;

                    for (let i = 0; i < adss.length; i++) {//map的value是数组，01下标分别存点击数和展示数
                        no = moment(adss[i].created).format('YYYY-MM-DD')
                        if (pointShowMap.get(no) == undefined) {
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [1, 0]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [0, 1]);
                        } else {
                            let val = pointShowMap.get(no)
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [val[0] + 1, val[1]]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [val[0], val[1] + 1]);
                        }
                    }
                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                    pointShowMap.forEach((pointShow, time) => {
                        let consume = 0
                        if (unit.method == 'cpc') {
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else if (unit.method == 'cpm') {
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.method == 'cpe') {
                            if (unit.cpe_type == 0) { //展示
                                consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                            } else if (unit.cpe_type == 1) {  //点击
                                consume += pointShow[0] * parseFloat(unit.bid)
                            } else {    //租用
                                consume += 0.00
                            }
                        }
                        let obj = {
                            Price_of_thousand: pointShow[1] / 1000,
                            time: time,
                            pointamount: pointShow[0],
                            showmount: pointShow[1],
                            consume,
                            CTR: pointShow[1] == 0 ? 0 : parseFloat(pointShow[1]) / parseInt(pointShow[1]),
                            bid: unit.bid
                        }

                        let val = totalMap.get(obj.time);
                        if (val != undefined) {
                            totalMap.set(obj.time, {
                                time: obj.time,
                                pointamount: parseInt(val.pointamount) + parseInt(obj.pointamount),
                                showmount: parseInt(val.showmount) + parseInt(obj.showmount),
                                consume: parseFloat(val.consume) + obj.consume,
                                CTR: (parseFloat(val.pointamount) + parseInt(obj.pointamount)) / (parseInt(val.showmount) + parseInt(obj.showmount)),
                                Price_of_thousand: parseFloat(val.Price_of_thousand) + obj.Price_of_thousand,
                                bid: parseFloat(val.consume) + obj.consume / allbid / unitinfo.length
                            })
                        } else {
                            totalMap.set(obj.time, obj);
                        }
                    })
                    pointShowMap.clear()
                }

                if (totalMap.size == 0)
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });

                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.Price_of_thousand)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: days, draw: draw });
            } else if ("month" == datetype) {
                let totalMap = new Map(), pointShowMap = new Map();
                let unit: any, adsinfo: any, adss: any, no, allbid = 0

                let startmonth = moment(startdate).format('YYYY-MM')
                let endmonth = moment(enddate).format('YYYY-MM')

                //从汇总表里面拿出往月的数据汇总，没有的话，可以马上统计
                while (1) {
                    if (startmonth == endmonth)
                        break;

                    let monthsum = await findByMonthAndUUID(startmonth, ad_company_uuid)
                    if (monthsum) {
                        totalMap.set(startmonth, {
                            time: startmonth,
                            pointamount: monthsum.points,
                            showmount: monthsum.show,
                            consume: monthsum.consume,
                            CTR: monthsum.points / monthsum.show,   //点击率
                            Price_of_thousand: monthsum.show / 1000,  //千次展示量
                            bid: monthsum.consume / monthsum.points //平均点击价格
                        })
                    } else {//这月的数据没有统计汇总
                        let nextmonth = moment(startmonth).add(1, 'months').format('YYYY-MM')
                        let { points, show, consume } = await monthSummary(req.app.locals.sequelize, ad_company_uuid,
                            startmonth + '-01 00:00:00', nextmonth + '-01 00:00:00')

                        totalMap.set(startmonth, {
                            time: startmonth,
                            pointamount: points,
                            showmount: show,
                            consume: consume,
                            CTR: points / show,   //点击率
                            Price_of_thousand: show / 1000,  //千次展示量
                            bid: consume / points //平均点击价格
                        })
                    }
                    startmonth = moment(startmonth).add(1, 'months').format('YYYY-MM')
                }
                //统计零头数据,可以先试图从每日汇总表中拿数据以减少时间开销
                let startdate2 = startmonth + '-01'
                let enddate2 = moment(enddate).format('YYYY-MM-DD')
                while (1) {
                    if (startdate2 == enddate2)
                        break;

                    let val = totalMap.get(startmonth)
                    let daysum = await findByDateAndUUID(startdate2, ad_company_uuid)
                    if (daysum) {
                        totalMap.set(startmonth, {
                            time: startmonth,
                            pointamount: val ? daysum.points + val.pointamount : daysum.points,
                            showmount: val ? daysum.show + val.showmount : daysum.show,
                            consume: val ? daysum.consume + val.consume : daysum.consume,
                            CTR: daysum.points / daysum.show,   //点击率
                            Price_of_thousand: daysum.show / 1000,  //千次展示量
                            bid: daysum.consume / daysum.points //平均点击价格
                        })
                    } else {//这天的数据没有统计汇总
                        let tomorrow = moment(startdate2).add(1, 'days').format('YYYY-MM-DD')
                        let { points, show, consume } = await summary(req.app.locals.sequelize, ad_company_uuid,
                            startdate2 + ' 00:00:00', tomorrow + ' 00:00:00')

                        totalMap.set(startmonth, {
                            time: startmonth,
                            pointamount: val ? points + val.pointamount : points,
                            showmount: val ? show + val.showmount : show,
                            consume: val ? consume + val.consume : consume,
                            CTR: points / show,   //点击率
                            Price_of_thousand: show / 1000,  //千次展示量
                            bid: consume / points //平均点击价格
                        })
                    }
                    startdate2 = moment(startdate2).add(1, 'days').format('YYYY-MM-DD')
                }
                startdate2 = startdate2 + ' 00:00:00'
                for (let y = 0; y < unitinfo.length; y++) {//统计所选的最后一天的零头数据
                    unit = await queryunitone(unitinfo[y].uuid);
                    adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(startdate2), new Date(enddate));
                    if (adss.length == 0) {
                        continue;
                    }

                    allbid = allbid + unit.bid;
                    for (let i = 0; i < adss.length; i++) {//map的value是数组，01下标分别存点击数和展示数
                        no = moment(adss[i].created).format('YYYY-MM')
                        if (pointShowMap.get(no) == undefined) {
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [1, 0]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [0, 1]);
                        } else {
                            let val = pointShowMap.get(no)
                            if (adss[i].method == "adspoint" || adss[i].method == "adsurl")
                                pointShowMap.set(no, [val[0] + 1, val[1]]);
                            else if (adss[i].method == 'adsshow')
                                pointShowMap.set(no, [val[0], val[1] + 1]);
                        }
                    }
                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                    let pointShow = pointShowMap.get(startmonth)
                    let consume = 0
                    if (unit.method == 'cpc') {
                        consume += pointShow[0] * parseFloat(unit.bid)
                    } else if (unit.method == 'cpm') {
                        consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                    } else if (unit.method == 'cpe') {
                        if (unit.cpe_type == 0) { //展示
                            consume += parseInt((pointShow[1] / 1000).toString()) * parseFloat(unit.bid)
                        } else if (unit.cpe_type == 1) {  //点击
                            consume += pointShow[0] * parseFloat(unit.bid)
                        } else {    //租用
                            consume += 0.00
                        }
                    }
                    let val = totalMap.get(startmonth)
                    totalMap.set(startmonth, {
                        time: startmonth,
                        pointamount: pointShow[0] + val.pointamount,
                        showmount: pointShow[1] + val.showmount,
                        consume: val.consume + consume,
                        CTR: val.CTR,   //点击率
                        Price_of_thousand: val.Price_of_thousand,  //千次展示量
                        bid: val.bid //平均点击价格
                    })
                }

                if (totalMap.size == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }
                let totalarr: any[] = []

                totalMap.forEach(r => {
                    r.CTR = r.showmount ? (r.pointamount / r.showmount).toFixed(2) : '0.00'
                    r.Price_of_thousand = Math.floor(r.showmount / 1000)
                    r.bid = r.pointamount ? (r.consume / r.pointamount).toFixed(2) : '0.00'  //这个bid字段被前端展示为“平均点击价格”
                    r.consume = (r.consume).toFixed(2)
                    totalarr.push(r)
                })
                sortByTime(totalarr)
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            } else if ("all" == datetype) {
                let returnarr = [];
                let allbid = 0;
                for (let y = 0; y < unitinfo.length; y++) {
                    let unit = await queryunitone(unitinfo[y].uuid);
                    let adsinfo = await queryAdsByunituuid(unitinfo[y].uuid);
                    let adss = await findAlloperationByunituuid(req.app.locals.sequelize, adsinfo, new Date(startdate), new Date(enddate));
                    if (adss.length == 0) {
                        continue;
                    }
                    let adspointNum = 0;
                    let adsshowNum = 0;

                    allbid = allbid + unit.bid;

                    for (let i = 0; i < adss.length; i++) {
                        if (adss[i].method == "adspoint" || adss[i].method == "adsurl") {
                            adspointNum++;
                        }

                        if (adss[i].method == "adsshow") {
                            adsshowNum++;
                        }
                    }
                    // 需要返回数据 : 日期，点击，展示，消费，点击率，平均点击价格，千次展示量
                    let obj = {
                        //Price_of_thousand: (adspointNum / adsshowNum * parseFloat(unit.bid) * 1000).toFixed(2),
                        // Price_of_thousand: parseInt((adsshowNum / 1000).toString()) * unit.bid,
                        Price_of_thousand: Math.floor(adsshowNum / 1000),
                        pointamount: adspointNum,
                        showmount: adsshowNum,
                        consume: adspointNum * parseFloat(unit.bid),
                        CTR: (adspointNum / adsshowNum).toFixed(2),
                        bid: unit.bid,
                        time: startdate
                    }
                    returnarr.push(obj);
                }
                if (returnarr.length == 0) {
                    return sendOK(res, {
                        data: [{
                            Price_of_thousand: 0,
                            time: 0,
                            pointamount: 0,
                            showmount: 0,
                            consume: 0,
                            CTR: 0,
                            bid: 0
                        }], recordsFiltered: 0, draw: draw
                    });
                }//无操作记录
                if (returnarr.length == 0) {
                    return sendOK(res, '无操作数据')
                }
                let totalMap = new Map();
                for (let x = 0; x < returnarr.length; x++) {
                    let val = totalMap.get("all");
                    if (val != undefined) {
                        totalMap.set("all", {
                            pointamount: parseInt(val.pointamount) + returnarr[x].pointamount,
                            showmount: parseInt(val.showmount) + returnarr[x].showmount,
                            consume: (parseFloat(val.consume) + returnarr[x].consume).toFixed(2),
                            CTR: ((parseFloat(val.pointamount) + returnarr[x].pointamount) / (parseInt(val.showmount) + returnarr[x].showmount)).toFixed(2),
                            //Price_of_thousand: ((parseFloat(val.pointamount) + returnarr[x].pointamount) / ((parseInt(val.showmount) + returnarr[x].showmount) * (parseFloat(val.consume) + returnarr[x].consume) / (parseInt(val.pointamount) + returnarr[x].pointamount) * 1000)).toFixed(2),
                            Price_of_thousand: parseFloat(val.Price_of_thousand) + returnarr[x].Price_of_thousand,
                            bid: (parseFloat(val.consume) + returnarr[x].consume / allbid / unitinfo.length).toFixed(2),
                            time: startdate
                        })
                    } else {
                        totalMap.set("all", returnarr[x]);
                    }
                }
                let totalarr = [];
                let totalMapKeys = totalMap.keys()
                while (true) {
                    let keyObj = totalMapKeys.next();
                    if (keyObj.value == undefined) {
                        break;
                    }
                    let val = totalMap.get(keyObj.value);
                    totalarr.push(val);
                }
                return sendOK(res, { data: totalarr, recordsFiltered: totalarr.length, draw: draw });
            }
            return sendOK(res, 'error');
        }
    } catch (e) {
        se(res, e)
    }
})

router.get('/getselectplan', async function (req: Request, res: Response, next: NextFunction) {
    let advertiseruuid = req.query.advertiseruuid;

    try {
        let plan = await queryplanselect(advertiseruuid);
        return sendOK(res, { data: plan.map(r => r.get()) });
    } catch (e) {
        e.info(res, se, e);
    }

})

router.get('/getselectunit', async function (req: Request, res: Response, next: NextFunction) {
    let planuuid = req.query.planuuid;
    try {
        let unit = await findunitByplanuuid(planuuid);
        return sendOK(res, { data: unit })
    } catch (e) {
        e.info(res, se, e);
    }
})

router.get('/getselectads', async function (req: Request, res: Response, next: NextFunction) {
    let unituuid = req.query.unituuid;
    try {
        let ads = await queryAdsByunituuid(unituuid);
        return sendOK(res, { data: ads });
    } catch (e) {
        e.info(res, se, e)
    }
})

router.get('/getselectadvertiser', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let advertiser = await findAlladvertiser();
        return sendOK(res, { data: advertiser });
    } catch (e) {
        e.info(res, se, e)
    }
})

export async function bashInsertAdsoperation(amount: number, adsuuid: string, method: string) {
    let array = new Array;
    for (let i = 0; i <amount;i++){
        let obj={
            adsuuid:adsuuid,
            method:method,
            created:new Date()
        }
        array.push(obj)
    }
    createdoperation(array);
}

export async function operationAcount(showamount: number, pointamount: number, adsuuid: string) {
    bashInsertAdsoperation(showamount, adsuuid, 'adsshow');
    bashInsertAdsoperation(pointamount, adsuuid, 'adspoint');
}