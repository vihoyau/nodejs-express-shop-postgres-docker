import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { getLotterylevel } from "../../model/mall/lotterylevel"
import { findByName } from "../../model/system/system"
export const router: Router = Router()

//获奖名单
router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let sys = await findByName('model')
        let lotterylevel
        if (sys) {
            lotterylevel = await getLotterylevel(sys.content.type)
        }
        return sendOK(res, { lotterylevel: lotterylevel })
    } catch (e) {
        e.info(se, res, e)
    }
})
//获取抽奖活动状态
router.get("/eventstate", async function (req: Request, res: Response, next: NextFunction) {
    try {
      let operation = await findByName('operationstatus')//获得system.system表中的开关操作标志状态值记录
      let status = operation.content.status     //获得system.system表中的开关操作标志状态值
      let result = await findByName('state')//获得system.system表中的开关状态标志状态值记录
      let lotterystate = result.content.lotterystate     //获得system.system表中的开关状态标志状态值   
      return sendOK(res, { lotterystate: lotterystate, status: status })        //返回开关状态信息    {"on" "1"} => 已开启  {"off","2"} : 已关闭
    } catch (e) {
      e.info(se, res, e)
    }
  })
  