import { validateCgi } from "../../lib/validator"
import { crmcommmentValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm } from "../../lib/response"
import { queryCrmuser } from "../../model/ads/crmuser"
import { querycrmcomment, updatePendingcomment, queryCountcrmcommnet } from "../../model/ads/comment"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { timestamps } from "../../config/winston"
//import { getPageCount } from "../../lib/utils"
export const router = Router();


/**
 * 返回该管理员可操作的广告
 */

router.get('/commentads', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo
    let commentarr = [];
    let crmuuid = loginInfo.getUuid();
    let { start, length, draw, state } = (req as any).query
    let recordsFiltered;
    try {
        if (loginInfo.isRoot || loginInfo.isAdminRW || loginInfo.isAdminRO) {
            let data = await querycrmcomment(req.app.locals.sequelize, parseInt(start), parseInt(length), state);
            recordsFiltered = await queryCountcrmcommnet(req.app.locals.sequelize, state);
            for (let j = 0; j < data.length; j++) {
                data[j].created = timestamps(data[j].created);
                let e = data[j].state;
                if (e == 'new') {
                    data[j].state = '待审核'
                } else if (e == 'on') {
                    data[j].state = '已通过'
                } else if (e == 'reject') {
                    data[j].state = '未通过'
                } else if (e == 'replied') {
                    data[j].state = '已回复'
                }
            }
            commentarr.push(
                {
                    'data': data
                });
            return sendOK(res, { 'datas': commentarr, draw: draw, recordsFiltered: recordsFiltered });
        }

        if (loginInfo.isAdsRO || loginInfo.isAdsRW) {
            validateCgi({ commentuuid: crmuuid }, crmcommmentValidator.commentuuid);
            let mgruuids = await queryCrmuser(crmuuid);
            if (!mgruuids) {
                return sendOK(res, { data: '没数据', draw: draw });
            }
            for (let i = 0; i < mgruuids.length; i++) {
                let data = await querycrmcomment(req.app.locals.sequelize, parseInt(start), parseInt(length), state, mgruuids[i]);
                recordsFiltered = await queryCountcrmcommnet(req.app.locals.sequelize, state, mgruuids[i]);
                for (let j = 0; j < data.length; j++) {
                    data[j].created = timestamps(data[j].created);
                    let e = data[j].state;
                    if (e == 'new') {
                        data[j].state = '待审核'
                    } else if (e == 'on') {
                        data[j].state = '已上架'
                    } else if (e == 'reject') {
                        data[j].state = '拒绝'
                    } else if (e == 'replied') {
                        data[j].state = '已回复'
                    }
                }
                commentarr.push(
                    {
                        'data': data
                    });

            }
            return sendOK(res, { 'datas': commentarr, draw: draw, recordsFiltered: recordsFiltered })
        } else {
            return sendNoPerm(res);
        }

    } catch (e) {
        e.info(se, res, e);
    }

});

/**
 * state   postgres  check ' new 为未审核  on 审核通过  reject 审核没通过  replied 已回复 '
 */

router.post('/pending', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo;
    let commentuuid = (req as any).body.commentuuid;
    let state = (req as any).body.state;
    let rejectcontent = (req as any).body.rejectcontent;
    try {
        if (state == '1') {
            state = 'new';
        } else if (state == '2') {
            state = 'on'
        } else if (state == '3') {
            state = 'reject'
        } else if (state == '4') {
            state = 'replied'
        }
        if (loginInfo.isRoot || loginInfo.isAdminRW || loginInfo.isAdsRW) {
            await updatePendingcomment(commentuuid, state, rejectcontent);
            return sendOK(res, { 'data': 'succ' })
        } else {
            return sendNoPerm(res);
        }
    } catch (e) {
        e.info(se, res, e);
    }
})