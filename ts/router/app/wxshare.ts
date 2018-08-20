// import { Router/* , Request, Response, NextFunction  */} from "express"
// //  import {sendOK} from "../../lib/response"
// // import { sendWxShare,getsign } from "../../lib/wxshare"
// // // import { checkLogin } from "../../redis/logindao"
// // import {wxOpt} from "../../config/wechat"
// export const router = Router()
// // router.get('/share', async function (req: Request, res: Response, next: NextFunction) {
   
// //         let {url} = req.query
// //         // let url = req.params["url"];
// //         //获取ticket
// //          let jsapiticket=await sendWxShare()
// //         // //获取签名
// //          let sign=await getsign(jsapiticket,url)
// //         // let ressign={noncestr:sign.ret.noncestr,timestamp:sign.ret.timestamp,appid:sign.appid,signature:sign.signature}
// //          return sendOK(res,sign /* ressign */)
// // })

import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { sendWxShare,getsign  } from "../../lib/wxshare"
export const router = Router()

/* GET adtype listing. */
router.get('/share', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let {url} = req.query
                // let url = req.params["url"];
                //获取ticket
                 let jsapiticket=await sendWxShare()
                // //获取签名
                 let sign=await getsign(jsapiticket,url)
                 let ressign={noncestr:sign.ret.noncestr,timestamp:sign.ret.timestamp,appid:sign.appid,signature:sign.signature}
                 //return sendOK(res,sign /* ressign */)
        return sendOK(res, ressign )
    } catch (e) {
        e.info(se, res, e)
    }
})
