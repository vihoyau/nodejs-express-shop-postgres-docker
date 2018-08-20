import { validateCgi } from "../../lib/validator"
import { planValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm, sendErrMsg } from "../../lib/response"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { deleteplanByuuid, updateplanstatus, insertplan, queryplanselect, updateplan, queryplanone, queryplanperiod, queryplanAll, queryplanAllBypage, queryplanAllcount } from "../../model/puton/plan"
import { queryunitByuuids, queryunitByplan, delelteunitByuuid, /*queryplanByunituuid,*/ updateunitstatus, insertunit, queryunit, queryunitone, updateunit, queryunitAll, queryunitAllBypage, queryunitAllcount, updateunitStatusByplanuuid, findunitByplanuuid } from "../../model/puton/unit"
import { querycontroltime, updatecomtrotimeByhour } from "../../model/puton/controltime"
import {
    queryPutonadsByunituuids, deleteadsByunituuid, insertBeforePutonads, /*queryadvertiserAdsAll,*/ queryadsByunituuid,
    queryadsByunituuidcount, queryadvertiserAdsBypage, queryadvertiserAdsBypagecount, updateAdsByunituuid,
    undateAdsstatusByunituuids, undateAdsstatusByunituuids1, findadsByunituuid
} from "../../model/ads/ads"
import { findByPrimary } from "../../model/ads/crmuser"

// import { queryCrmuser } from "../../model/ads/crmuser"
// import { queryadvByuuid } from "../../model/ads/crmuser"
import { timestamps } from "../../config/winston"
import { findoneBycrmuuid } from "../../model/ads/advertiser"
import { deleteadsByadsuuids } from "../../model/ads/adsoperation"
import { findByName } from "../../model/system/system"
//import { findByPrimary } from "../../model/ads/advertiser"
//新添加
//import { finduuid } from "../../model/users/users_ext"
import { getview } from "../../model/ads/ads_ext"
export const router = Router();


/**
 * 计划 回显所有的值
 * 
 */
router.get('/getAllplan', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let start = req.query.start;
    let length = req.query.length;
    let draw = req.query.draw;
    //广告商的uuid
    let advertiseruuid = req.query.advertiseruuid;
    let recordsFiltered;
    let search = req.query.search;

    let searchdata = (search as any).value

    try {
        if (loginInfo.isRoot()) {

            if (advertiseruuid == undefined) {
                let re = await queryplanAllBypage(searchdata,parseInt(start), parseInt(length));
                if(re.length==0){
                    return sendOK(res, { re, draw: draw, recordsFiltered: 0 });
                }
                let unitarr = await queryunitAll(searchdata,req.app.locals.sequelize, re);

                let ads = await queryPutonadsByunituuids(req.app.locals.sequelize, unitarr);

                for (let i = 0; i < unitarr.length; i++) {
                    let showamount = 0;
                    let pointmount = 0;
                    for (let j = 0; j < ads.length; j++) {
                        if (ads[j].unituuid == unitarr[i].uuid) {
                            ads[j].showamount = ads[j].showamount ? ads[j].showamount : 0
                            ads[j].pointmount = ads[j].pointmount ? ads[j].pointmount : 0

                            showamount = showamount + parseInt(ads[j].showamount);
                            pointmount = pointmount + parseInt(ads[j].pointmount);
                        }
                    }
                    unitarr[i].showamount = showamount;
                    unitarr[i].pointmount = pointmount;

                    unitarr[i].bid = unitarr[i].bid ? unitarr[i].bid : 0

                    if (unitarr[i].method == 'cpc') {
                        unitarr[i].consume = pointmount * parseFloat(unitarr[i].bid)

                    } else if (unitarr[i].method == 'cpm') {
                        unitarr[i].consume = parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)

                    } else if (unitarr[i].method == 'cpe') {
                        if (unitarr[i].cpe_type == 0) {
                            unitarr[i].consume = parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)
                        } else if (unitarr[i].cpe_type == 1) {
                            unitarr[i].consume = pointmount * parseFloat(unitarr[i].bid)
                        } else {
                            unitarr[i].consume = 0.00
                        }
                    } else {
                        unitarr[i].consume = 0.00
                    }

                    unitarr[i].CTR = showamount == 0 ? 0.00 : pointmount / showamount
                    //unitarr[i].Price_of_thousand = showamount==0?0.000: ((pointmount / showamount) * parseFloat(unitarr[i].bid) * 1000).toFixed(2);
                    unitarr[i].Price_of_thousand = parseInt((showamount / 100).toString()) * parseFloat(unitarr[i].bid)
                }

                for (let j = 0; j < re.length; j++) {

                    re[j].startdate = timestamps(re[j].startdate)
                    if (re[j].enddate != undefined) {
                        re[j].enddate = timestamps(re[j].enddate)
                    }
                    re[j].pointmount =0;
                    re[j].showamount = 0;
                    re[j].consume = 0.00;
                    re[j].bid = 0;
                    re[j].Price_of_thousand = 0;
                    re[j].CTR = 0;

                    for (let i = 0; i < unitarr.length; i++) {
                        if (re[j].uuid && unitarr[i].planuuid && re[j].uuid == unitarr[i].planuuid) {
                            re[j].pointmount = parseInt(re[j].pointmount) + parseInt(unitarr[i].pointmount);
                            re[j].showamount = parseInt(re[j].showamount) + parseInt(unitarr[i].showamount);
                            re[j].consume = parseFloat(re[j].consume) + parseFloat(unitarr[i].consume)
                            re[j].bid = re[j].pointmount == 0 ? 0.00 : parseFloat(re[j].consume) / parseInt(re[j].pointmount)
                            //re[j].Price_of_thousand = re[j].showamount==0?0.000:parseFloat(re[j].bid)==0?0: (parseInt(re[j].pointmount) / parseInt(re[j].showamount) / parseFloat(re[j].bid) * 1000).toFixed(2);
                            re[j].Price_of_thousand = parseFloat(re[j].Price_of_thousand) + parseFloat(unitarr[i].Price_of_thousand)
                            re[j].CTR = parseInt(re[j].showamount) == 0 ? 0.00 : parseInt(re[j].pointmount) / parseInt(re[j].showamount)

                        }
                    }
                    re[j].consume = (re[j].consume).toFixed(2)
                    re[j].bid = (re[j].bid).toFixed(2)
                    re[j].Price_of_thousand = re[j].showamount >= 1000 ? (re[j].consume / parseInt((re[j].showamount / 1000).toString())).toFixed(2) : "0.00"
                    re[j].CTR = (re[j].CTR).toFixed(2)
                }


                recordsFiltered = await queryplanAllcount(req.app.locals.sequelize);
                return sendOK(res, { re, draw: draw, recordsFiltered: recordsFiltered[0].count });
            } else {
                let re = await queryplanAllBypage(searchdata, parseInt(start), parseInt(length), advertiseruuid);
                if (re.length == 0) {
                    return sendOK(res, { re, draw: draw, recordsFiltered: 0 });
                }
                let unitarr = await queryunitAll(searchdata,req.app.locals.sequelize, re);

                let ads = await queryPutonadsByunituuids(req.app.locals.sequelize, unitarr);

                for (let i = 0; i < unitarr.length; i++) {
                    let showamount = 0;
                    let pointmount = 0;
                    let allbalance = 0
                    for (let j = 0; j < ads.length; j++) {
                        if (ads[j].unituuid == unitarr[i].uuid) {
                            ads[j].showamount = ads[j].showamount ? ads[j].showamount : 0
                            ads[j].pointmount = ads[j].pointmount ? ads[j].pointmount : 0

                            showamount = showamount + parseInt(ads[j].showamount);
                            pointmount = pointmount + parseInt(ads[j].pointmount);
                            allbalance = ads[j].allbalance ? ads[j].allbalance : 0
                        }
                    }
                    unitarr[i].showamount = showamount;
                    unitarr[i].pointmount = pointmount;

                    unitarr[i].bid = unitarr[i].bid ? unitarr[i].bid : 0

                    if (unitarr[i].method == 'cpc') {
                        unitarr[i].consume = pointmount * parseFloat(unitarr[i].bid)

                    } else if (unitarr[i].method == 'cpm') {
                        unitarr[i].consume = parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)

                    } else if (unitarr[i].method == 'cpe') {
                        if (unitarr[i].cpe_type == 0) { //展示
                            unitarr[i].consume = parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)
                        } else if (unitarr[i].cpe_type == 1) {  //点击
                            unitarr[i].consume = pointmount * parseFloat(unitarr[i].bid)
                        } else {    //租用？？还消费个毛线啊
                            unitarr[i].consume = 0.00
                        }
                    } else {
                        unitarr[i].consume = 0.00
                    }
                    unitarr[i].consume += allbalance
                    unitarr[i].CTR = showamount == 0 ? 0.000 : (pointmount / showamount).toFixed(2);
                    unitarr[i].Price_of_thousand = (parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                }

                for (let j = 0; j < re.length; j++) {

                    re[j].startdate = timestamps(re[j].startdate)
                    if (re[j].enddate != undefined) {
                        re[j].enddate = timestamps(re[j].enddate)
                    }

                    re[j].pointmount =0;
                    re[j].showamount = 0;
                    re[j].consume = 0.00;
                    re[j].bid = 0;
                    re[j].Price_of_thousand = 0;
                    re[j].CTR = 0;

                    for (let i = 0; i < unitarr.length; i++) {
                        if (re[j].uuid && unitarr[i].planuuid && re[j].uuid == unitarr[i].planuuid) {
                            re[j].pointmount = parseInt(re[j].pointmount) + parseInt(unitarr[i].pointmount);
                            re[j].showamount = parseInt(re[j].showamount) + parseInt(unitarr[i].showamount);
                            re[j].consume = parseFloat(re[j].consume) + parseFloat(unitarr[i].consume)
                            re[j].bid = parseInt(re[j].pointmount) == 0 ? 0.00 : parseFloat(re[j].consume) / parseInt(re[j].pointmount)
                            re[j].Price_of_thousand = parseFloat(re[j].Price_of_thousand) + parseFloat(unitarr[i].Price_of_thousand)
                            re[j].CTR = parseInt(re[j].showamount) == 0 ? 0.00 : parseInt(re[j].pointmount) / parseInt(re[j].showamount)
                        }
                    }
                    re[j].consume = (re[j].consume).toFixed(2)
                    re[j].bid = (re[j].bid).toFixed(2)
                    re[j].Price_of_thousand = re[j].showamount >= 1000 ? (re[j].consume / parseInt((re[j].showamount / 1000).toString())).toFixed(2) : "0.00"
                    re[j].CTR = (re[j].CTR).toFixed(2)
                }

                let tempnum = await queryplanAllcount(req.app.locals.sequelize, advertiseruuid);
                return sendOK(res, { re, draw: draw, recordsFiltered: parseInt(tempnum[0].count) });
            }

        } else {
            let re = await queryplanAllBypage(searchdata, parseInt(start), parseInt(length), advertiseruuid);
            if (re.length == 0) {
                return sendOK(res, { re, draw: draw, recordsFiltered: 0 });
            }
            let unitarr = await queryunitAll(searchdata,req.app.locals.sequelize, re);

            let ads = await queryPutonadsByunituuids(req.app.locals.sequelize, unitarr);

            for (let i = 0; i < unitarr.length; i++) {
                let showamount = 0;
                let pointmount = 0;
                let allbalance = 0;
                for (let j = 0; j < ads.length; j++) {
                    if (ads[j].unituuid == unitarr[i].uuid) {
                        ads[j].showamount = ads[j].showamount ? ads[j].showamount : 0
                        ads[j].pointmount = ads[j].pointmount ? ads[j].pointmount : 0

                        showamount = showamount + parseInt(ads[j].showamount);
                        pointmount = pointmount + parseInt(ads[j].pointmount);
                        allbalance = ads[j].allbalance ? ads[j].allbalance : 0
                    }
                }
                unitarr[i].showamount = showamount;
                unitarr[i].pointmount = pointmount;

                unitarr[i].bid = unitarr[i].bid ? unitarr[i].bid : 0

                if (unitarr[i].method == 'cpc') {
                    unitarr[i].consume = pointmount * parseFloat(unitarr[i].bid)
                } else if (unitarr[i].method == 'cpm') {
                    unitarr[i].consume = parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)
                } else if (unitarr[i].method == 'cpe') {
                    if (unitarr[i].cpe_type == 0) {
                        unitarr[i].consume = parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)
                    } else if (unitarr[i].cpe_type == 1) {
                        unitarr[i].consume = pointmount * parseFloat(unitarr[i].bid)
                    } else {
                        unitarr[i].consume = 0.00
                    }
                } else {
                    unitarr[i].consume = 0.00
                }
                unitarr[i].consume += allbalance
                unitarr[i].CTR = showamount == 0 ? 0.00 : pointmount / showamount
                unitarr[i].Price_of_thousand = unitarr[i].consume / parseInt((showamount / 1000).toString())
            }

            for (let j = 0; j < re.length; j++) {

                re[j].startdate = timestamps(re[j].startdate)
                if (re[j].enddate != undefined) {
                    re[j].enddate = timestamps(re[j].enddate)
                }
                re[j].pointmount =0;
                re[j].showamount = 0;
                re[j].consume = 0.00;
                re[j].bid = 0;
                re[j].Price_of_thousand = 0;
                re[j].CTR = 0;
                for (let i = 0; i < unitarr.length; i++) {
                    if (re[j].uuid == unitarr[i].planuuid) {
                        re[j].pointmount = parseInt(re[j].pointmount) + parseInt(unitarr[i].pointmount);
                        re[j].showamount = parseInt(re[j].showamount) + parseInt(unitarr[i].showamount);
                        re[j].consume = parseFloat(re[j].consume) + parseFloat(unitarr[i].consume)
                        re[j].bid = parseInt(re[j].pointmount) == 0 ? 0.00 : parseInt(re[j].consume) / parseInt(re[j].pointmount)
                        re[j].Price_of_thousand = parseFloat(re[j].Price_of_thousand) + parseFloat(unitarr[i].Price_of_thousand)
                        re[j].CTR = parseInt(re[j].showamount) == 0 ? 0.00 : parseInt(re[j].pointmount) / parseInt(re[j].showamount)
                    }
                }
                re[j].consume = (re[j].consume).toFixed(2)
                re[j].bid = (re[j].bid).toFixed(2)
                re[j].Price_of_thousand = re[j].showamount >= 1000 ? (re[j].consume / parseInt((re[j].showamount / 1000).toString())).toFixed(2) : "0.00"
                re[j].CTR = (re[j].CTR).toFixed(2)
            }
            let tempnum = await queryplanAllcount(req.app.locals.sequelize, advertiseruuid);
            return sendOK(res, { re, draw: draw, recordsFiltered: parseInt(tempnum[0].count) });

        }

    } catch (e) {
        e.info(se, res, e);
    }
})

router.get('/getAllunit', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let start = req.query.start;
    let length = req.query.length;
    let draw = req.query.draw;
    let recordsFiltered: number;
    let advertiseruuid = req.query.advertiseruuid;
    let search = req.query.search;
    let searchdata = (search as any).value
    try {
        let unitlength = 0;
        let pushlength = 0;
        if (loginInfo.isRoot()) {
            if (advertiseruuid == undefined) {
                recordsFiltered = 0
                let unitarr = [];
                let re = await queryplanAll();
                //re[j].get('uuid')
                //for (let j = 0; j < re.length; j++) {
                let units
                if (unitlength <= parseInt(length)) {
                    units = await queryunitAll(searchdata,req.app.locals.sequelize, re);
                }
                if (units) {
                    for (let x = 0; x < units.length; x++) {
                        if (pushlength >= parseInt(start) && unitlength <= parseInt(length)) {
                            unitarr.push(units[x]);
                            unitlength++
                        }
                        pushlength++;
                    }
                }

                let ads = await queryPutonadsByunituuids(req.app.locals.sequelize, unitarr);

                for (let i = 0; i < unitarr.length; i++) {
                    let showamount = 0;
                    let pointmount = 0;
                    for (let j = 0; j < ads.length; j++) {
                        if (ads[j].unituuid == unitarr[i].uuid) {
                            showamount = showamount + parseInt(ads[j].showamount);
                            pointmount = pointmount + parseInt(ads[j].pointmount);
                        }
                    }
                    unitarr[i].showamount = showamount;
                    unitarr[i].pointmount = pointmount;

                    if (unitarr[i].method == 'cpc') {
                        unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                    } else if (unitarr[i].method == 'cpm') {
                        unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                    } else if (unitarr[i].method == 'cpe') {
                        if (unitarr[i].cpe_type == 0) {
                            unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                        } else if (unitarr[i].cpe_type == 1) {
                            unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                        } else {
                            unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                            unitarr[i].consume = (unitarr[i].consume + pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                        }
                    }

                    //unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                    unitarr[i].CTR = showamount == 0 ? 0.000 : (pointmount / showamount).toFixed(2);
                    //unitarr[i].Price_of_thousand =showamount==0?0: ((pointmount / showamount) * parseFloat(unitarr[i].bid) * 1000).toFixed(2);
                    unitarr[i].Price_of_thousand = (parseInt((showamount / 1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                    for (let j = 0; j < re.length; j++) {
                        if (re[j].uuid == unitarr[i].planuuid) {
                            unitarr[i].planname = re[j].name;
                            unitarr[i].putresource = re[j].putresource;
                            unitarr[i].dailybudget = re[j].dailybudget;
                        }
                    }
                }


                for (let j = 0; j < re.length; j++) {
                    let tempnum = await queryunitAllcount(req.app.locals.sequelize, re[j].uuid);
                    recordsFiltered = recordsFiltered + parseInt(tempnum[0].count);
                }

                return sendOK(res, { 're': unitarr, draw: draw, recordsFiltered: recordsFiltered });
            } else {
                let unitarr = [];
                recordsFiltered = 0
                let tempnum;
                let re = await queryplanAll(advertiseruuid);
                //for (let j = 0; j < re.length; j++) {
                let units = null
                if (unitlength <= parseInt(length)) {
                    units = await queryunitAll(searchdata,req.app.locals.sequelize, re);
                }
                if (units) {
                    for (let x = 0; x < units.length; x++) {
                        if (pushlength >= parseInt(start) && unitlength <= parseInt(length)) {
                            unitarr.push(units[x]);
                            unitlength++
                        }
                        pushlength++;
                    }
                }

                let ads = await queryPutonadsByunituuids(req.app.locals.sequelize, unitarr);


                for (let i = 0; i < unitarr.length; i++) {
                    let showamount = 0;
                    let pointmount = 0;
                    for (let j = 0; j < ads.length; j++) {
                        if (ads[j].unituuid == unitarr[i].uuid) {
                            showamount = showamount + parseInt(ads[j].showamount);
                            pointmount = pointmount + parseInt(ads[j].pointmount);
                        }
                    }
                    unitarr[i].showamount = showamount;
                    unitarr[i].pointmount = pointmount;

                    if (unitarr[i].method == 'cpc') {
                        unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                    } else if (unitarr[i].method == 'cpm') {
                        unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                    } else if (unitarr[i].method == 'cpe') {
                        if (unitarr[i].cpe_type == 0) {
                            unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                        } else if (unitarr[i].cpe_type == 1) {
                            unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                        } else {
                            unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                            unitarr[i].consume = (unitarr[i].consume + pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                        }
                    }

                    //unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                    unitarr[i].CTR = showamount == 0 ? 0.000 : (pointmount / showamount).toFixed(2);
                    //unitarr[i].Price_of_thousand =showamount==0?0:  ((pointmount / showamount) * parseFloat(unitarr[i].bid) * 1000).toFixed(2);
                    unitarr[i].Price_of_thousand = (parseInt((showamount/1000).toString())*parseFloat(unitarr[i].bid)).toFixed(2)
                    for(let j = 0; j < re.length; j++){
                        if(re[j].uuid==unitarr[i].planuuid){
                            unitarr[i].planname = re[j].name;
                            unitarr[i].putresource = re[j].putresource;
                            unitarr[i].dailybudget = re[j].dailybudget;
                        }
                    }
                }


                for (let j = 0; j < re.length; j++) {
                    tempnum = await queryunitAllcount(req.app.locals.sequelize, re[j].uuid);
                    if (tempnum != undefined) {
                        recordsFiltered = recordsFiltered + parseInt(tempnum[0].count);
                    }
                }

                return sendOK(res, { 're': unitarr, draw: draw, recordsFiltered: recordsFiltered });
            }

        } else {
            let unitarr = [];
            recordsFiltered = 0
            let tempnum;
            let re = await queryplanAll(advertiseruuid);
            //for (let j = 0; j < re.length; j++) {
            let units = null
            if (unitlength <= parseInt(length)) {
                units = await queryunitAll(searchdata,req.app.locals.sequelize, re);
            }



            if (units) {
                for (let x = 0; x < units.length; x++) {
                    if (pushlength >= parseInt(start) && unitlength <= parseInt(length)) {
                        unitarr.push(units[x]);
                        unitlength++
                    }
                    pushlength++;
                }
            }

            let ads = await queryPutonadsByunituuids(req.app.locals.sequelize, unitarr);


            for (let i = 0; i < unitarr.length; i++) {
                let showamount = 0;
                let pointmount = 0;
                for (let j = 0; j < ads.length; j++) {
                    if (ads[j].unituuid == unitarr[i].uuid) {
                        showamount = showamount + parseInt(ads[j].showamount);
                        pointmount = pointmount + parseInt(ads[j].pointmount);
                    }
                }
                unitarr[i].showamount = showamount;
                unitarr[i].pointmount = pointmount;

                if (unitarr[i].method == 'cpc') {
                    unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                } else if (unitarr[i].method == 'cpm') {
                    unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                } else if (unitarr[i].method == 'cpe') {
                    if (unitarr[i].cpe_type == 0) {
                        unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                    } else if (unitarr[i].cpe_type == 1) {
                        unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                    } else {
                        unitarr[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(unitarr[i].bid)).toFixed(2)
                        unitarr[i].consume = (unitarr[i].consume + pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                    }
                }

                // unitarr[i].consume = (pointmount * parseFloat(unitarr[i].bid)).toFixed(2)
                unitarr[i].CTR = showamount == 0 ? 0.000 : (pointmount / showamount).toFixed(2);
                //unitarr[i].Price_of_thousand =showamount==0?0:  ((pointmount / showamount) * parseFloat(unitarr[i].bid) * 1000).toFixed(2);
                unitarr[i].Price_of_thousand = (parseInt((showamount/1000).toString())*parseFloat(unitarr[i].bid)).toFixed(2);
                for(let j = 0; j < re.length; j++){
                    if(re[j].uuid==unitarr[i].planuuid){
                        unitarr[i].planname = re[j].name
                        unitarr[i].putresource = re[j].putresource;
                        unitarr[i].dailybudget = re[j].dailybudget;
                    }
                }
            }


            for (let j = 0; j < re.length; j++) {
                tempnum = await queryunitAllcount(req.app.locals.sequelize, re[j].uuid);
                if (tempnum != undefined) {
                    recordsFiltered = recordsFiltered + parseInt(tempnum[0].count);
                }
            }
            return sendOK(res, { 're': unitarr, draw: draw, recordsFiltered: recordsFiltered });
        }
    } catch (e) {
        e.info(se, res, e);
    }
})

router.get('/:planuuid/getunitAll', async function (req: Request, res: Response, next: NextFunction) {
    let planuuid = req.params['planuuid'];
    let start = req.query.start;
    let length = req.query.length;
    let draw = req.query.draw;
    let recordsFiltered;
    try {
        let plan = await queryplanone(planuuid);
        let re = await queryunitAllBypage(parseInt(start), parseInt(length), planuuid);


        let ads = await queryPutonadsByunituuids(req.app.locals.sequelize, re);

        for (let i = 0; i < re.length; i++) {
            let showamount = 0;
            let pointmount = 0;
            let allbalance = 0
            for (let j = 0; j < ads.length; j++) {
                if (ads[j].unituuid == re[i].uuid) {
                    showamount = showamount + parseInt(ads[j].showamount);
                    pointmount = pointmount + parseInt(ads[j].pointmount);
                    allbalance = ads[j].allbalance ? ads[j].allbalance : 0
                }
            }
            re[i].showamount = showamount;
            re[i].pointmount = pointmount;

            if (re[i].method == 'cpc') {
                re[i].consume = (pointmount * parseFloat(re[i].bid)).toFixed(2)
            } else if (re[i].method == 'cpm') {
                re[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(re[i].bid)).toFixed(2)
            } else if (re[i].method == 'cpe') {
                if (re[i].cpe_type == 0) {
                    re[i].consume = (parseInt((showamount/1000).toString()) * parseFloat(re[i].bid)).toFixed(2)
                } else if (re[i].cpe_type == 1) {
                    re[i].consume = (pointmount * parseFloat(re[i].bid)).toFixed(2)
                } else {
                    re[i].consume = 0.00
                }
            } else {
                re[i].consume = 0.00
            }
            re[i].consume = (parseFloat(re[i].consume) + allbalance).toFixed(2)
            re[i].CTR = showamount == 0 ? 0.000 : (pointmount / showamount).toFixed(2);
            re[i].bid = re[i].pointmount ? (re[i].consume / re[i].pointmount).toFixed(2) : '0.00'
            re[i].Price_of_thousand = showamount > 999 ? (re[i].consume / parseInt((showamount / 1000).toString())).toFixed(2) : '0.00'
        }




        for (let j = 0; j < re.length; j++) {
            re[j].planname = plan.name;
            re[j].putresource = plan.putresource;
            re[j].dailybudget = plan.dailybudget;
            re[j].startdate = timestamps(re[j].startdate)
            if (re[j].enddate != undefined) {
                re[j].enddate = timestamps(re[j].enddate)
            }
        }
        recordsFiltered = await queryunitAllcount(req.app.locals.sequelize, planuuid);
        return sendOK(res, { re, draw: draw, recordsFiltered: recordsFiltered[0].count });
    } catch (e) {
        e.info(se, res, e);
    }
})

async function addPlanuuid(currre: any, controlre: any, num: number, planuuid: string) {
    for (let i = 0; i < currre.length; i++) {
        let hour = currre[i];
        for (let j = 0 + (num - 1) * 24; j < num * 24; j++) {
            if (controlre[j].ads_week == num) {
                if (controlre[j].ads_hour == hour) {
                    let exiest = false;
                    if (controlre[j].planuuids) {
                        for (let n = 0; n < controlre[j].planuuids.length; n++) {
                            if (planuuid != controlre[j].planuuids[n]) {
                                exiest = true;
                            }
                        }
                        if (exiest) {
                            controlre[j].planuuids.push(planuuid);
                        }
                    } else {
                        let controlarr = [];
                        controlarr.push(planuuid);
                        controlre[j].planuuids = controlarr;
                    }
                    updatecomtrotimeByhour(controlre[j]);
                }
            }
        }
    }
}

async function updateadsControltime(req: Request, res: Response, next: NextFunction, planuuid: string) {
    let re = await queryplanperiod(req.app.locals.sequelize, planuuid);
    let controlre = await querycontroltime(req.app.locals.sequelize);
    let period = await parseFormatperiod(re[0].period);
    if (re[0].status == 0) {
        for (let i = 0; i < period.length; i++) {
            let currre = period[i];
            await addPlanuuid(currre, controlre, i + 1, planuuid);
        }
    }


    // if (re[0].period[1]) {
    //     let currre: any = re[0].period[1];
    //     await addPlanuuid(currre, controlre, 1, planuuid);
    // } else if (re[0].period[2]) {
    //     let currre: any = re[0].period[2];
    //     await addPlanuuid(currre, controlre, 2, planuuid);
    // } else if (re[0].period[3]) {
    //     let currre: any = re[0].period[3];
    //     await addPlanuuid(currre, controlre, 3, planuuid);
    // } else if (re[0].period[4]) {
    //     let currre: any = re[0].period[4];
    //     await addPlanuuid(currre, controlre, 4, planuuid);
    // } else if (re[0].period[5]) {
    //     let currre: any = re[0].period[5];
    //     await addPlanuuid(currre, controlre, 5, planuuid);
    // } else if (re[0].period[6]) {
    //     let currre: any = re[0].period[6];
    //     await addPlanuuid(currre, controlre, 6, planuuid);
    // } else if (re[0].period[7]) {
    //     let currre: any = re[0].period[7];
    //     await addPlanuuid(currre, controlre, 7, planuuid);
    // }

}
/**
 * 新建plan
 * period:{ 1:[1,2,3,4],2:[],3:[],4:[],5:[],6:[],7:[] }
 */
router.post('/newplan', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    //let {name,putresource,dailybudget,startdate,enddate,period,advertiseruuid} = req.query;
    const loginInfo: LoginInfo = (req as any).loginInfo;

    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let body = (req as any).body;
    let name = body.name;
    let putresource = body.putresource;
    let dailybudget = body.dailybudget;
    let startdate = body.startdate;
    let enddate = body.enddate;
    let period = body.period;
    let advertiser = body.advertiseruuid
    let plan;
    let status = 0;

    if (enddate != -1) {
        plan = {
            name: name,
            putresource: putresource,
            dailybudget: dailybudget,
            startdate: startdate,
            enddate: enddate,
            period: period,
            advertiseruuid: advertiser,
            status: status
        }
        plan.enddate = new Date(plan.enddate)
    } else {
        plan = {
            name: name,
            putresource: putresource,
            dailybudget: dailybudget,
            startdate: startdate,
            period: period,
            advertiseruuid: advertiser,
            status: status
        }
    }

    try {
        plan.period = JSON.parse(plan.period);

        plan.putresource = parseInt(plan.putresource)

        plan.startdate = new Date(plan.startdate)

        validateCgi(plan, planValidator.planobject);
        let plans = await insertplan(plan);
        updateadsControltime(req, res, next, plans.get().uuid);
        return sendOK(res, { 'plan': plans.get() })
    } catch (e) {
        e.info(se, res, e);
    }
})

export async function parseFormatperiod(period: any) {
    let planarr = [];
    for (let i = 0; i < period.week.length; i++) {
        let planarrweek = [];
        for (let j = 0; j < period.week[i].length; j++) {
            if (period.week[i][j] == 1) {
                planarrweek.push(j);
            }
        }
        planarr.push(planarrweek);
    }
    return planarr;
}


router.get('/getplanselect', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    try {
        if (loginInfo.isRoot()) {
            let re = await queryplanselect();
            let planarr = [];
            for (let j = 0; j < re.length; j++) {
                planarr.push(re[j]);
            }
            return sendOK(res, planarr);
        } else {
            let advertiser = await findoneBycrmuuid(loginInfo.getUuid())
            let planarr = [];
            let re = await queryplanselect(advertiser.uuid);
            for (let j = 0; j < re.length; j++) {
                planarr.push(re[j]);
            }
            return sendOK(res, planarr);
        }
    } catch (e) {
        e.info(se, res, e);
    }
})

router.post('/updateplan', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let body = (req as any).body;
    let name = body.name;
    let putresource = body.putresource;
    let dailybudget = body.dailybudget;
    let startdate = body.startdate;
    let enddate = body.enddate;
    let period = body.period;
    let planuuid = body.planuuid;
    try {
        let plan = {
            name: name,
            putresource: putresource,
            dailybudget: dailybudget,
            startdate: startdate,
            enddate: enddate,
            period: period,
            planuuid: planuuid
        }
        validateCgi(plan, planValidator.planobject);
        plan.period = JSON.parse(plan.period)
        plan.startdate = new Date(plan.startdate)
        plan.enddate = new Date(plan.enddate)
        let re = await updateplan(plan);
        updateadsControltime(req, res, next, planuuid);
        return sendOK(res, { 'data': re });
    } catch (e) {
        e.info(se, res, e);
    }
})
router.get('/:planuuid/getplanByuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let planuuid = req.params['planuuid'];
    try {
        validateCgi({ uuid: planuuid }, planValidator.planuuid);
        let re = await queryplanone(planuuid);
        re.startdate = timestamps(re.startdate);
        if (re.enddate != undefined) {
            re.enddate = timestamps(re.enddate);
        }
        return sendOK(res, re);
    } catch (e) {
        e.info(se, res, e);
    }
})


router.post('/planstatus', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let planuuid = (req as any).body.planuuid
    let status = (req as any).body.status;
    try {
        validateCgi({ uuid: planuuid }, planValidator.planuuid);
        if(status==0){
            let units = await updateunitStatusByplanuuid(planuuid);
            undateAdsstatusByunituuids(req.app.locals.sequelize,units);
        }
        let re = await updateplanstatus(planuuid, status);
        
        return sendOK(res, { "date": re })
    } catch (e) {
        e.info(se, res, e);
    }
})

export async function downadsStatus(planuuid:string){

    let units = await findunitByplanuuid(planuuid);
    undateAdsstatusByunituuids1(units);

}

router.post('/unitstatus', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let unituuid = (req as any).body.unituuid
    let status = (req as any).body.status;
    try {
        validateCgi({ uuid: unituuid }, planValidator.planuuid);
        let re ;
        if(status==1){
            re = await updateunitstatus(unituuid, status);
            let plan = await queryplanone(re[0].get('planuuid'))
            if(plan.status==0){
                return sendOK(res, "notxxx");
            }
        }
       
        if(status==0){
           updateAdsByunituuid(unituuid);
           re = await updateunitstatus(unituuid, status);

        }
        return sendOK(res, { "date": re });
    } catch (e) {
        e.info(se, res, e);
    }
})

/**
 * 单元名称,推广方式，投放地域，性别，年龄，计费方式，出价
 */
router.post('/newunit', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let body = (req as any).body;
    let name = body.name;
    let mode = body.mode;
    let area = body.area;
    let sex = body.sex;
    let age = body.age;
    let method = body.method;
    let bid = body.bid;
    let planuuid = body.planuuid;
    let cpe_type = body.cpe_type;
    let advertiser = await findoneBycrmuuid(loginInfo.getUuid());
    let unit = {
        name: name,
        mode: mode,
        area: area,
        sex: sex,
        age: age,
        method: method,
        bid: bid,
        planuuid: planuuid,
        cpe_type: cpe_type
    }
    let minbid = await findByName('minbid')

    if (method == 'cpc' && bid < parseFloat(minbid.content.val_cpc)) {
        return sendErrMsg(res, "出价太低", 500)
    } else if (method == 'cpm' && bid < parseFloat(minbid.content.val_cpm)) {
        return sendErrMsg(res, "出价太低", 500)
    } else if (method == 'cpe' && cpe_type == 1 && bid < parseFloat(minbid.content.val_cpe_click)) {//点击
        return sendErrMsg(res, "出价太低", 500)
    } else if (method == 'cpe' && cpe_type == 0 && bid < parseFloat(minbid.content.val_cpe_show)) {
        return sendErrMsg(res, "出价太低", 500)
    }

    try {
        unit.mode = parseInt(unit.mode);
        unit.sex = parseInt(unit.sex);
        unit.age = JSON.parse(unit.age);
        unit.age = await timeformat(unit.age, 1);
        let units = await insertunit(unit);
        let plan = await queryplanone(units.get('planuuid'));
        if (advertiser == undefined) {
            return sendErrMsg(res, "找不到广告商", 500)
        } else {
            let crmuser = await findByPrimary(advertiser.crmuuid);
            if (!crmuser)
                return sendErrMsg(res, "广告商crm帐号不存在", 500);

            let ads = await insertBeforePutonads(req.app.locals.sequelize, '十金十代', units.get().uuid, advertiser, crmuser.username);
            return sendOK(res, { "unit": units.get(), "plan": plan, "ads": ads.get() });
        }
    } catch (e) {
        e.info(se, res, e);
    }
})
router.get('/:planuuid/getunitselect', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let planuuid = req.params['planuuid'];
    try {
        validateCgi({ uuid: planuuid }, planValidator.planuuid);
        let re = await queryunit(planuuid);
        for (let i = 0; i < re.length; i++) {
            re[i].get().age = await timeformat(re[i].get().age, 2);
        }
        return sendOK(res, re);
    } catch (e) {
        e.info(se, res, e);
    }
})


router.get('/:unituuid/getunitByuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let unituuid = req.params['unituuid'];
    try {
        validateCgi({ uuid: unituuid }, planValidator.unituuid);
        let re = await queryunitone(unituuid);
        re.age = await timeformat(re.age, 2);
        let num = 0;
        for (let i = 0; i < re.age.length; i++) {
            if (re.age[i] == 1) {
                num++;
            }
            if (num == 6) {
                re.age = -1;
            }
        }
        let plan = await queryplanone(re.planuuid);
        return sendOK(res, { unit: re, plan: plan });
    } catch (e) {
        e.info(se, res, e);
    }
})

router.post('/updateunit', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let body = (req as any).body
    let name = body.name;
    let mode = body.mode;
    let area = body.area;
    let sex = body.sex;
    let age: any = body.age;
    let method = body.method;
    let bid = body.bid;
    let unituuid = body.unituuid;
    let unit = {
        name: name,
        mode: mode,
        area: area,
        sex: sex,
        age: age,
        method: method,
        bid: bid,
        unituuid: unituuid
    }
    try {
        let minbid = await findByName('minbid')
        minbid = minbid.content.val
        if (bid < minbid)
            return sendErrMsg(res, "出价太低", 500)

        unit.age = JSON.parse(unit.age);
        unit.age = await timeformat(unit.age, 1)
        let re = await updateunit(unit);
        return sendOK(res, re);
    } catch (e) {
        e.info(se, res, e);
    }
})


const time = { "time": [[0, 18], [19, 24], [25, 29], [30, 39], [40, 49], [50, 1000]] };
export async function timeformat(timeJson: any, mode: number) {
    //如果是前端打来后端就mode==1
    //timeJson =[0,0,0,0,0,0]
    if (mode == 1) {
        let temptime = [];
        for (let i = 0; i < time.time.length; i++) {
            if (timeJson[i] == 1) {
                temptime.push(time.time[i]);
            }
        }
        return temptime;
    } else if (mode == 2) {
        //如果后端 打给前端用来回显  mode==2
        //timeJson =[[0,18],[19,24],[25,29],[30,39],[40,49],[50,1000]]
        let temptime = [];
        if (timeJson != null && timeJson.length != 0 &&timeJson!=undefined) {
            for (let i = 0; i < time.time.length; i++) {
                if (timeJson[i] != undefined) {
                    if (timeJson[i][0] == time.time[i][0] && timeJson[i][1] == time.time[i][1]) {
                        temptime.push(1)
                    } else {
                        temptime.push(0)
                    }
                }
            }
            return temptime;
        }
        return [0,0,0,0,0,0];
    } else {
        return undefined;
    }
}

router.get('/getadsAll', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let start = req.query.start;
    let length = req.query.length;
    let draw = req.query.draw;
    let advertiseruuid = req.query.advertiseruuid;
    let recordsFiltered;
    let search = req.query.search;
    let searchdata = (search as any).value
    try {
        if (loginInfo.isRoot()) {
            if (advertiseruuid == null) {
                let re = await queryadvertiserAdsBypage(searchdata,parseInt(start), parseInt(length));
                let unit = await queryunitByuuids(req.app.locals.sequelize, re);

                for (let i = 0; i < re.length; i++) {
                    for (let j = 0; j < unit.length; j++) {
                        if (re[i].unituuid == unit[j].uuid) {
                            re[i].method = unit[j].method;
                            if (unit[j].method == 'cpc') {
                                re[i].consume = (parseFloat(unit[j].bid) * parseInt(re[i].pointmount)).toFixed(2);
                            } else if (unit[j].method == 'cpm') {
                                re[i].consume = (parseFloat(unit[j].bid) * parseInt((re[i].showamount/1000).toString())).toFixed(2);
                            } else if (unit[j].method == 'cpe') {
                                if (unit[j].cpe_type == 0) {
                                    re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                                } else if (unit[j].cpe_type == 1) {
                                    re[i].consume = (re[i].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                                } else {
                                    re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                                    re[i].consume = (unit[j].consume + re[i].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                                }
                            }


                            //re[i].consume = (parseFloat(unit[j].bid) * parseInt(re[i].pointmount)).toFixed(2);
                            re[i].bid = unit[j].bid;
                            //re[i].Price_of_thousand = parseInt(re[i].showamount) ==0 ?0: ((parseInt(re[i].pointmount) / parseInt(re[i].showamount)) * parseFloat(unit[j].bid) * 1000).toFixed(2);
                            re[i].Price_of_thousand = parseInt((parseInt(re[i].showamount)/1000).toString())*parseFloat(unit[j].bid)
                            re[i].mode = unit[j].mode;
                        }
                    }
                    re[i].CTR = parseInt(re[i].showamount)==0 ? 0.000: (parseInt(re[i].pointmount) / parseInt(re[i].showamount)).toFixed(2);
                }
                let view = await getview()
                for (let i = 0; i < re.length; i++) {
                    for(let j = 0; j < view.length; j++){
                        if(re[i].uuid==view[j].uuid){
                           re[i].view = view[j].virtviews;
                        }
                    }
                }
                recordsFiltered = await queryadvertiserAdsBypagecount(req.app.locals.sequelize)

                return sendOK(res, { re, draw: draw, recordsFiltered: recordsFiltered[0].count });
            } else {
                let re = await queryadvertiserAdsBypage(searchdata,parseInt(start), parseInt(length), advertiseruuid);
                let unit = await queryunitByuuids(req.app.locals.sequelize, re);

                for (let i = 0; i < re.length; i++) {
                    for (let j = 0; j < unit.length; j++) {
                        if (re[i].unituuid == unit[j].uuid) {
                            re[i].method = unit[j].method;

                            if (unit[j].method == 'cpc') {
                                re[i].consume = (parseFloat(unit[j].bid) * parseInt(re[i].pointmount)).toFixed(2);
                            } else if (unit[j].method == 'cpm') {
                                re[i].consume = (parseFloat(unit[j].bid) * parseInt((re[i].showamount/1000).toString())).toFixed(2);
                            } else if (unit[j].method == 'cpe') {
                                if(unit[j].cpe_type!=undefined){
                                    if (unit[j].cpe_type == 0) {
                                        re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                                    } else if (unit[j].cpe_type == 1) {
                                        re[i].consume = (re[i].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                                    } else {
                                        re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                                        re[i].consume = (unit[j].consume + re[j].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                                    }
                                }
                            }

                            //re[i].consume = (parseFloat(unit[j].bid) * parseInt(re[i].pointmount)).toFixed(2);
                            re[i].bid = unit[j].bid;
                            //re[i].Price_of_thousand = parseInt(re[i].showamount) ==0 ?0: ((parseInt(re[i].pointmount) / parseInt(re[i].showamount)) * parseFloat(unit[j].bid) * 1000).toFixed(2);
                            re[i].Price_of_thousand = parseInt((parseInt(re[i].showamount)/1000).toString())*parseFloat(unit[j].bid)
                            re[i].mode = unit[j].mode;
                        }
                    }
                    re[i].CTR = parseInt(re[i].showamount)==0 ? 0.000: (parseInt(re[i].pointmount) / parseInt(re[i].showamount)).toFixed(2);
                }
                let view = await getview()
                for (let i = 0; i < re.length; i++) {
                    for(let j = 0; j < view.length; j++){
                        if(re[i].uuid==view[j].uuid){
                           re[i].view = view[j].virtviews;
                        }
                    }
                }

                recordsFiltered = await queryadvertiserAdsBypagecount(req.app.locals.sequelize, advertiseruuid);


                return sendOK(res, { re, draw: draw, recordsFiltered: recordsFiltered[0].count });
            }
        }
        let re = await queryadvertiserAdsBypage(searchdata,parseInt(start), parseInt(length), advertiseruuid);
        let unit = await queryunitByuuids(req.app.locals.sequelize, re);

        for (let i = 0; i < re.length; i++) {
            for (let j = 0; j < unit.length; j++) {
                if (re[i].unituuid == unit[j].uuid) {
                    re[i].method = unit[j].method;
                    if (unit[j].method == 'cpc') {
                        re[i].consume = (parseFloat(unit[j].bid) * parseInt(re[i].pointmount)).toFixed(2);
                    } else if (unit[j].method == 'cpm') {
                        re[i].consume = (parseFloat(unit[j].bid) * parseInt((re[i].showamount/1000).toString())).toFixed(2);
                    } else if (unit[j].method == 'cpe') {
                        if(unit[j].cpe_type){
                            if (unit[j].cpe_type == 0) {
                                re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                            } else if (unit[j].cpe_type == 1) {
                                re[i].consume = (re[i].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                            } else {
                                re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                                re[i].consume = (unit[j].consume + re[i].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                            }
                        } else {
                            re[i].consume = "0.00"
                        }
                    }
                    // re[i].consume = (parseFloat(unit[j].bid) * parseInt(re[i].pointmount)).toFixed(2);
                    re[i].bid = unit[j].bid;
                    //re[i].Price_of_thousand = parseInt(re[i].showamount) ==0 ?0:((parseInt(re[i].pointmount) / parseInt(re[i].showamount)) * parseFloat(unit[j].bid) * 1000).toFixed(2);
                    re[i].Price_of_thousand = parseInt((parseInt(re[i].showamount)/1000).toString())*parseFloat(unit[j].bid)
                    re[i].mode = unit[j].mode;
                }
            }
            re[i].CTR = parseInt(re[i].showamount)==0 ? 0.000: (parseInt(re[i].pointmount) / parseInt(re[i].showamount)).toFixed(2);
        }
        let view = await getview()
        for (let i = 0; i < re.length; i++) {
            for(let j = 0; j < view.length; j++){
                if(re[i].uuid==view[j].uuid){
                   re[i].view = view[j].virtviews;
                }
            }
        }
        recordsFiltered = await queryadvertiserAdsBypagecount(req.app.locals.sequelize, advertiseruuid);
        return sendOK(res, { re, draw: draw, recordsFiltered: recordsFiltered[0].count });
    } catch (e) {
        e.info(se, res, e);
    }
})

router.get('/:unituuid/getadsAll', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let unituuid = req.params['unituuid'];
    let start = req.query.start
    let length = req.query.length;
    let draw = req.query.draw;
    let recordsFiltered;
    try {
        let re = await queryadsByunituuid(parseInt(start), parseInt(length), unituuid);
        let unit = await queryunitByuuids(req.app.locals.sequelize, re);
        for (let i = 0; i < re.length; i++) {
            for (let j = 0; j < unit.length; j++) {
                if (re[i].unituuid == unit[j].uuid) {
                    re[i].method = unit[j].method;

                    if (unit[j].method == 'cpc') {
                        re[i].consume = (parseFloat(unit[j].bid) * parseInt(re[i].pointmount)).toFixed(2);
                    } else if (unit[j].method == 'cpm') {
                        re[i].consume = (parseFloat(unit[j].bid) * parseInt((re[i].showamount/1000).toString())).toFixed(2);
                    } else if (unit[j].method == 'cpe') {
                        if (unit[j].cpe_type == 0) {
                            re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                        } else if (unit[j].cpe_type == 1) {
                            re[i].consume = (re[i].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                        } else {
                            re[i].consume = (parseInt((re[i].showamount/1000).toString()) * parseFloat(unit[j].bid)).toFixed(2)
                            re[i].consume = (unit[j].consume + re[i].pointmount * parseFloat(unit[j].bid)).toFixed(2)
                        }
                    }
                    re[i].consume = (parseFloat(re[i].consume) + (re[i].allbalance ? re[i].allbalance : 0)).toFixed(2)
                    re[i].bid = re[i].pointmount ? (re[i].consume / re[i].pointmount).toFixed(2) : '0.00'
                    re[i].Price_of_thousand = re[i].showamount > 999 ? (re[i].consume / parseInt((parseInt(re[i].showamount) / 1000).toString())).toFixed(2) : '0.00'
                    re[i].mode = unit[j].mode;
                }
            }
            re[i].CTR = parseInt(re[i].showamount) == 0 ? 0 : (parseInt(re[i].pointmount) / parseInt(re[i].showamount)).toFixed(2);
        }
        let view = await getview()
        for (let i = 0; i < re.length; i++) {
            for(let j = 0; j < view.length; j++){
                if(re[i].uuid==view[j].uuid){
                   re[i].view = view[j].virtviews;
                }
            }
        }
        let plan = await queryunitone(unituuid);
        recordsFiltered = await queryadsByunituuidcount(req.app.locals.sequelize, unituuid)
        return sendOK(res, { re, plan, draw: draw, recordsFiltered: recordsFiltered[0].count })
    } catch (e) {
        e.info(se, res, e);
    }
});

router.delete('/:unituuid/deleteunit', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let unituuid = req.params['unituuid'];
    try {
        delelteunitByuuid(req.app.locals.sequelize, unituuid);
        let adss = await findadsByunituuid(unituuid);
        deleteadsByadsuuids(req.app.locals.sequelize,adss);
        deleteadsByunituuid(req.app.locals.sequelize, unituuid);
        return sendOK(res, { 'date': 'succ' });
    } catch (e) {
        e.info(se, res, e);
    }
})

router.delete('/:planuuid/deleteplan', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    if (loginInfo.isAdminRO() || loginInfo.isAdsRO()) {
        return sendNoPerm(res);
    }
    let planuuid = req.params['planuuid'];
    try {
        let unit = await queryunitByplan(planuuid);
        await deleteplanByuuid(req.app.locals.sequelize, planuuid);
        for (let i = 0; i < unit.length; i++) {
            if (unit[i] != undefined) {
                await delelteunitByuuid(req.app.locals.sequelize, unit[i].uuid);
                let adss = await findadsByunituuid(unit[i].uuid);
                deleteadsByadsuuids(req.app.locals.sequelize, adss);
                await deleteadsByunituuid(req.app.locals.sequelize, unit[i].uuid);
            }
        }
        return sendOK(res, { 'date': 'succ' });
    } catch (e) {
        e.info(se, res, e);
    }
})
