const password = {
    isLength: {
        errmsg: "密码长度错误！",
        param: [4, 64]
    }
}

const crmusername = {
    isLength: {
        errmsg: "用户名错误！",
        param: [4, 260]
    }
}

const phone = {
    isMobilePhone: {
        errmsg: "手机号格式错误！",
        param: ["zh-CN"]
    }
}

const uuid = {
    isUUID: {
        errmsg: "uuid有误！",
        param: 1
    }
}
const Activityuuid = {
    isUUID: {
        errmsg: "uuid有误！",
        param: 1
    }
}
const UserId = {
    isUUID: {
        errmsg: "uuid有误！",
        param: 1
    }
}
const Useruuid = {
    isUUID: {
        errmsg: "uuid有误！",
        param: 1
    }
}

const description = {
    require: 0,
    isLength: {
        errmsg: "description有误",
        param: [0, 200]
    }
}

const levels = {
    isLength: {
        errmsg: "levels有误",
        param: [0, 20]
    }
}

const company = {
    require: 0,
    isLength: {
        errmsg: "company有误",
        param: [0, 60]
    }
}

const contacts = {
    isLength: {
        errmsg: "contacts错误",
        param: [1, 200]
    }
}

const licence = {
    require: 0,
    isLength: {
        errmsg: "contacts错误",
        param: [1, 200]
    }
}

const address = {
    require: 0,
    isLength: {
        errmsg: "address错误",
        param: [1, 256]
    }
}

const points = {
    require: 0,
    isLength: {
        errmsg: "points错误",
        param: { min: 0, max: 100000 }
    }
}

const totalpoints = {
    require: 0,
    isLength: {
        errmsg: "totalpoints错误",
        param: { min: 0, max: 100000 }
    }
}

const state = {
    isIn: {
        errmsg: "state有误",
        param: [["on", "off"]]
    }
}

const page = {
    require: 0,
    isLength: {
        errmsg: "page错误！",
        param: { min: 1, max: 64 }
    }
}
const count = {
    isLength: {
        errmsg: "count错误！",
        param: { min: 1, max: 64 }
    }
}

const advType = {
    isLength: {
        errmsg: "adType错误",
        param: [["points", "modified"]]
    }
}

const start = {
    isLength: {
        errmsg: "start 有误",
        param: [0, 8]
    }
}

const length = {
    isLength: {
        errmsg: "length 有误",
        param: [0, 8]
    }
}

const start2 = {
    isInt: {
        errmsg: "start 有误",
        param: { min: 0, max: 100000 }
    }
}

const length2 = {
    isInt: {
        errmsg: "length 有误",
        param: { min: 0, max: 100000 }
    }
}

const searchdata = {
    require: 0,
    isLength: {
        errmsg: "searchdata 有误",
        param: [0, 255]
    }
}
const putresource = {
    isLength:{
        errmsg:"putresource 有误 ",
        param:[0,1]
    }
}
const dailybudget = {
    isLength:{
        errmsg:"dailybudget 有误 ",
        param:[0,255]
    }
}

export const invireRul = {
    UUID: {
        uuid: uuid
    },
    infoAndType: {
        type: {
            isLength: {
                errmsg: "type错误",
                param: [['register', 'answer']]
            }
        },
        useruuid: uuid,
        start: start,
        length: length,
        searchdata: searchdata
    },
    infomation: {
        useruuid: uuid,
        start: start,
        length: length,
        searchdata: searchdata
    },
    info: {
        content: {
            isLength: {
                errmsg: "content有误",
                param: [0, 200]
            }
        },
        invitepoint: {
            require: 0,
            isLength: {
                errmsg: "invitepoint有误",
                param: [0, 200]
            }
        },
        parentinvitepoint: {
            require: 0,
            isLength: {
                errmsg: "parentinvitepoint有误",
                param: [0, 200]
            }
        }
    }
}

export const adstypeValidator = {
    orderAndUuid: {
        position: {
            isLength: {
                errmsg: "order错误！",
                param: { min: 0, max: 1000000000 }
            }
        },
        uuid: uuid
    },
    typaname: {
        name: {
            isLength: {
                errmsg: "name有误",
                param: [0, 100]
            }
        },
        parentname: {
            isLength: {
                errmsg: "parentname有误",
                param: [0, 100]
            }
        }
    },
    updatePo: {
        uuid: uuid,
        position: {
            isInt: {
                errmsg: "position 错误！",
                param: { min: 0, max: 100000 }
            }
        }
    },
    UUID: {
        uuid: uuid
    }
}

export const adsValidator = {
    commetads: {
        category: uuid,
        subcategory: uuid,
        uuid: uuid
    },
    uuid: {
        uuid: uuid
    },
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    mgruuids: {
        uuid: uuid,
        mgruuids: {
            require: 0,
            isLength: {
                errmsg: "mgruuids错误",
                param: { min: 0 }
            }
        }
    },
    adsByType: {
        adtypeuuid: uuid,
        subtypeuuid: uuid,
        page: page,
        count: count,
        state: state
    },
    adsinfo: {
        nice: {
            isInt: {
                errmsg: "nice错误！",
                param: { min: 0 }
            }
        },
        low: {
            isInt: {
                errmsg: "low错误！",
                param: { min: 0 }
            }
        },
        virtviews: {
            require: 0,
            isInt: {
                errmsg: "virtviews错误",
                param: { min: 0, max: 1000000000000000 }
            }
        },
        adsuuid: uuid,
        title: {
            isLength: {
                errmsg: "title有误",
                param: [0, 256]
            }
        },
        adtypeuuid: uuid,
        subtypeuuid: uuid,
        typedesc: {
            require: 0,
            isLength: {
                errmsg: "typedesc有误",
                param: [0, 256]
            }
        },
        address: address,
        addressinfo: address,
        question: {
            isLength: {
                errmsg: "question有误",
                param: [0, 256]
            }
        },
        question_ext: {
            isLength: {
                errmsg: "question_ext有误",
                param: [0, 1024]
            }
        },
        answer: {
            isLength: {
                errmsg: "answer有误",
                param: [0, 256]
            }
        },
        tsrange: {
            isLength: {
                errmsg: "tsrange有误",
                param: [0, 256]
            }
        },
        keyword: {
            isLength: {
                errmsg: "keyword有误",
                param: [0, 256]
            }
        },
        bonushint: {
            require: 0,
            isLength: {
                errmsg: "bonushint有误",
                param: [0, 256]
            }
        },
        points: points,
        totalpoint: points
    },

    adsState: {
        adsuuid: uuid,
        state: {
            isIn: {
                errmsg: "state有误",
                param: [['new', 'on', 'off', 'approved', 'rejected', 'wait-ack']]
            }
        },
        rejectmsg: {
            require: 0,
            isLength: {
                errmsg: "bonushint有误",
                param: [0, 256]
            }
        }
    },
    UUID: {
        adsuuid: uuid
    },
    newInfoCate: {
        name: {
            isLength: {
                errmsg: "名字有误",
                param: [1, 100]
            }
        },
        pic: {
            isLength: {
                errmsg: "图片地址有误",
                param: [1, 256]
            }
        },
        position: {
            isInt: {
                errmsg: "position有误",
                param: { min: 1, max: 256 }
            }
        }
    },
    updateInfoCate: {
        uuid: uuid,
        name: {
            isLength: {
                errmsg: "名字有误",
                param: [1, 100]
            }
        },
        pic: {
            isLength: {
                errmsg: "图片地址有误",
                param: [1, 256]
            }
        },
        position: {
            isInt: {
                errmsg: "position有误",
                param: { min: 1, max: 256 }
            }
        }
    }
}

export const userLoginLog = {
    get: {
        useruuid: uuid,
        start: start,
        length: length
    }
}

export const infoValidator = {
    newInfoCate: {
        name: {
            isLength: {
                errmsg: "名字有误",
                param: [1, 100]
            }
        },
        pic: {
            isLength: {
                errmsg: "图片地址有误",
                param: [1, 256]
            }
        },
        position: {
            isInt: {
                errmsg: "position有误",
                param: { min: 1, max: 256 }
            }
        }
    },
    UUID: {
        adsuuid: uuid
    },
    updateInfoCate: {
        uuid: uuid,
        name: {
            isLength: {
                errmsg: "名字有误",
                param: [1, 100]
            }
        },
        pic: {
            isLength: {
                errmsg: "图片地址有误",
                param: [1, 256]
            }
        },
        position: {
            isInt: {
                errmsg: "position有误",
                param: { min: 1, max: 256 }
            }
        }
    },
    updatePositon: {
        uuid: uuid,
        position: {
            isInt: {
                errmsg: "position有误",
                param: { min: 1, max: 256 }
            }
        }
    },
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    infoUpdate: {
        uuid: uuid,
        title: {
            isLength: {
                errmsg: "title有误",
                param: [0, 256]
            }
        },
        category: uuid,
        content: {
            isLength: {
                errmsg: "content有误",
                param: [0, 20480]
            }
        },
        addressinfo: {
            isLength: {
                errmsg: "addressinfo有误",
                param: [0, 200]
            }
        },
        adsinfourl: {
            isLength: {
                errmsg: "adsinfourl有误",
                param: [0, 512]
            }
        },
        points: points,
        addpoints: totalpoints,
        addbalance: totalpoints,
        nice: {
            isInt: {
                errmsg: "nice错误！",
                param: { min: 0 }
            }
        },
        low: {
            isInt: {
                errmsg: "low错误！",
                param: { min: 0 }
            }
        },
        sumcontent: {
            isLength: {
                errmsg: "sumcontent有误",
                param: [0, 20480]
            }
        },
        mold: {
            isIn: {
                errmsg: "mold有误",
                param: [['two', 'point', 'balance']]
            }
        },
        banner: {
            isIn: {
                errmsg: "banner有误",
                param: [['on', 'off']]
            }
        },
        pic_mode: {
            isIn: {
                errmsg: "pic_mode有误",
                param: [['big', 'small', 'three']]
            }
        }
    },
    adsState: {
        adsuuid: uuid,
        state: {
            isIn: {
                errmsg: "state有误",
                param: [['on', 'rejected', 'wait-ack']]
            }
        },
        rejectmsg: {
            isLength: {
                errmsg: "rejectmsg有误",
                param: [0, 128]
            }
        }
    },
    pending: {
        commentuuid: uuid,
        state: {
            isIn: {
                errmsg: "state有误",
                param: [['on', 'rejected']]
            }
        },
        rejectcontent: {
            isLength: {
                errmsg: "rejectmsg有误",
                param: [0, 128]
            }
        }
    }
}

export const crmuserValidator = {
    sort: {
        pointsort: {
            isLength: {
                errmsg: "pointsort错误！",
                param: [['asc', 'desc']]
            }
        },
        balancesort: {
            isLength: {
                errmsg: "balancesort错误！",
                param: [['asc', 'desc']]
            }
        }
    },
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    uuid: {
        uuid: uuid
    },

    setPassword: {
        useruuid: uuid,
        password: password,
    },
    pageAndCount: {
        page: page,
        count: count,
    },

    setState: {
        uuid: uuid,
        state: state
    },

    findAll: {
        page: page,
        count: count
    },

    login: {
        username: crmusername,
        password: password
    },

    create: {
        username: {
            isLength: {
                errmsg: "username有误",
                param: [1, 64]
            }
        },
        password: password,
        description: description,
        realname: {
            isLength: {
                errmsg: "realname有误",
                param: [1, 64]
            }
        },
        company: company,
        state: state
    },
    role: {
        isIn: {
            errmsg: "role有误",
            param: [["admin", "advertiser"]]
        }
    },
    perm: {
        isIn: {
            errmsg: "perm有误",
            param: [["adminRW", "adminRO", "adsRW", "adsRO"]]
        }
    },
    phone: phone,
    email: {
        isEmail: {
            errmsg: "email有误",
            param: 1
        }
    },
    setMgruuids: {
        uuid: uuid,
        mgruuids: {
            isLength: {
                errmsg: "mgruuids有误",
                param: [1, 200]
            }
        }
    }
}


export const levelsValidator = {
    uuid: {
        uuid: uuid
    },
    levels_add: {
        levels: levels,
        discount: {
            isInt: {
                errmsg: "discount错误",
                param: { min: 0, max: 100 }
            }
        }
    },
    levels_update: {
        uuid: uuid,
        levels: levels,
        discount: {
            isInt: {
                errmsg: "discount错误",
                param: { min: 0, max: 100 }
            }
        }
    },
    toexp: {
        isInt: {
            errmsg: "toexp有误！",
            param: { min: 0, max: 100000 }
        }
    }
    ,
    levels_exp: {
        exp: {
            isInt: {
                errmsg: "exp不合法！",
                param: { min: 0, max: 100000 }
            }
        }
    }
}

export const advertiserValidator = {
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    advertiserInfo: {
        company: company,
        contacts: contacts,
        description: description,
        phone: phone,
        licence: licence,
        state: state,
        address: address,
        points: points,
        totalpoints: totalpoints
    },
    UUID: uuid,
    pageAndCount: {
        page: page,
        count: count
    },
    adType: {
        isLength: {
            errmsg: "adType错误",
            param: [["points", "modified"]]
        }
    },
    pointUuid: {
        uuid: uuid,
        points: points
    },
    updteadv: {
        advType: advType,
        company: company,
        contacts: contacts,
        description: description,
        phone: phone,
        state: state,
        address: address,
        points: points,
        totalpoints: totalpoints
    }

}

export const messageValidator = {
    uuid: {
        uuid: uuid
    },
    contentValidator: {
        uuid: uuid,
        content: {
            isLength: {
                errmsg: "content有误",
                param: [0, 1000000]
            }
        },
        title: {
            isLength: {
                errmsg: "title有误！",
                param: [0, 10000000]
            }
        },
        useruuid: {
            require: 0,
            isUUID: {
                errmsg: "useruuid有误！",
                param: 1
            }
        },
        username: {
            require: 0,
            isMobilePhone: {
                errmsg: "手机号格式错误！",
                param: ["zh-CN"]
            }
        }
    },
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    typeValidator: {
        state: {
            isLength: {
                errmsg: "content有误",
                param: [['new', 'send', 'saw']]
            }
        },
        start: start,
        length: length,
        searchdata: searchdata
    },
    info: {
        username: {
            require: 0,
            isMobilePhone: {
                errmsg: "手机号格式错误！",
                param: ["zh-CN"]
            }
        },
        useruuid: {
            require: 0,
            isUUID: {
                errmsg: "uuid有误！",
                param: 1
            }
        },
        content: {
            isLength: {
                errmsg: "content有误",
                param: [0, 1000000]
            }
        },
        state: {
            isLength: {
                errmsg: "state有误",
                param: [['new', 'send', 'saw']]
            }
        },
        title: {
            isLength: {
                errmsg: "title有误！",
                param: [0, 1000000]
            }
        }
    }

}

const name = {
    isLength: {
        errmsg: "name有误",
        param: [0, 1000000]
    }
}
const content = {
    isLength: {
        errmsg: "content有误",
        param: [0, 1000000]
    }
}
export const systemValidator = {
    sysname: {
        name: name
    },
    contentValidator: {
        name: name,
        content: content
    },
    offUsers: {
        start: start2,
        length: length2
    }
}

export const adsLogValidator = {
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    pageCount: {
        page: page,
        count: count
    },
    uuid: {
        uuid: uuid
    },
    uuidAndPageCount: {
        adsuuid: uuid,
        count: count,
        page: page
    }
}

export const crmcommmentValidator = {
    commentuuid:{
        commentuuid:uuid
    }
}

/**
 * 
 * let plan ={
            name : name,
            putresource : putresource,
            dailybudget : dailybudget,
            startdate : startdate,
            enddate : enddate,
            period : period
        }
 */

export const bid = {
    isFloat: {
        errmsg: "出价有误",
        param: { min: 0.01, max: 100000.0 }
    }
}

export const planValidator = {
     planobject:{
        name:name,
        putresource : putresource,
        dailybudget : dailybudget,
    },
    planuuid:{
        uuid:uuid
    },
    unituuid: {
        uuid: uuid
    },
    newunit: {
        bid: bid
    }
}
const tag = {
    isLength: {
        errmsg: "标签有误",
        param: [0, 32]
    }
}

const search = {
    isLength: {
        errmsg: "搜索内容有误",
        param: [0, 32]
    }
}
const State = {
    isLength: {
        errmsg: "标签有误",
        param: [0, 32]
    }
}
const rewardNumber = {
    isLength: {
        errmsg: "人数长度有误",
        param: [0, 32]
    }
}
const isNoFortune = {
    isLength: {
        errmsg: "是否设置运势有误",
        param: [0, 32]
    }
}
const Reward = {
    isLength: {
        errmsg: "奖励有误",
        param: [0, 32]
    }
}
const ActivityRule = {
    isLength: {
        errmsg: "活动规则有误",
        param: [0, 32]
    }
}
const Point = {
    isLength: {
        errmsg: "积分有误",
        param: [0, 32]
    }
}
const Gooduuid = {
    isLength: {
        errmsg: "商品uuid有误",
        param: [0, 32]
    }
}
const rewardmethod = {
    isLength: {
        errmsg: "奖励方式有误",
        param: [0, 32]
    }
}
const cardIdAmounts = {
    isLength: {
        errmsg: "卡牌数量有误",
        param: [0, 32]
    }
}
const goodtitle = {
    isLength: {
        errmsg: "商品标题有误",
        param: [0, 32]
    }
}
const RedPacket = {
    isLength: {
        errmsg: "红包有误",
        param: [0, 32]
    }
}
const Couponid = {
    isLength: {
        errmsg: "优惠券uuid有误",
        param: [0, 32]
    }
}
const chipIdAmounts = {
    isLength: {
        errmsg: "碎片数量有误",
        param: [0, 32]
    }
}
const Coupontitle = {
    isLength: {
        errmsg: "优惠券标题有误",
        param: [0, 32]
    }
}
const Tag = {
    isLength: {
        errmsg: "标签有误",
        param: [0, 32]
    }
}
const Filename = {
    isLength: {
        errmsg: "卡牌名称有误",
        param: [0, 20]
    }
}
const cardProbability = {
    isLength: {
        errmsg: "卡牌概率有误",
        param: [0, 20]
    }
}
const chipProbability = {
    isLength: {
        errmsg: "碎片概率有误",
        param: [0, 20]
    }
}
const ActivityName = {
    isLength: {
        errmsg: "活动名称有误",
        param: [0, 20]
    }
}
const Starttime = {
    isLength: {
        errmsg: "时间有误",
        param: [0, 20]
    }
}
const Endtime = {
    isLength: {
        errmsg: "时间有误",
        param: [0, 20]
    }
}
const time = {
    isLength: {
        errmsg: "时间有误",
        param: [0, 20]
    }
}
const amount = {
    isInt: {
        errmsg: "活动人数有误！",
        param: { min: 0, max: 100000 }
    }
}
// const evstate = {
//     isIn: {
//         errmsg: "活动状态有误",
//         param: [["notstart", "processing", "finish"]]
//     }
// }

const price = {
    isFloat: {
        errmsg: "价格不对",
        param: { min: 0.0, max: 100000.0 }
    }
}

const probability = {
    isFloat: {
        errmsg: "概率不对",
        param: { min: 0.0, max: 1.0 }
    }
}
const keyword = {
    isLength: {
        errmsg: "关键字不对",
        param: [0, 32]
    }
}

export const evaluateValidator = {
    add: {
        tag: tag,
        starttime: time,
        endtime: time,
        amount: amount,
        gooduuid: uuid,
        marketprice: price,
        reserveprice: price,
        freeprobability: probability
    },
    update: {
        uuid: uuid,
        tag: tag,
        starttime: time,
        endtime: time,
        amount: amount,
        gooduuid: uuid,
        marketprice: price,
        reserveprice: price,
        freeprobability: probability
    },
    del: {
        uuid
    },
    getAll: {
        activityuuid: uuid,
        start: start2,
        length: length2
    },
    his: {
        activityuuid: uuid,
        state: {
            isIn: {
                errmsg: "state有误",
                param: [['fulfill', 'cancelled']]
            }
        },
        start: start2,
        length: length2
    },
    getAllact: {
        start: start2,
        length: length2,
    },
    getAllactTag: {
        search: keyword
    },
    stop: {
        uuid: uuid
    },
    fulfill: {
        groupuuid: uuid
    },
    restart: {
        uuid: uuid,
        starttime: time,
        endtime: time
    }
}

export const collectionValidator = {
    UUID: {
        Activityuuid: Activityuuid
    },
    UserId:
    {UserId:UserId,
        Activityuuid:  Activityuuid
    },
    lofo:
    {Useruuid:Useruuid,
        Activityuuid:  Activityuuid
    },
   
    add1: {
        uuid, Filename, cardProbability, chipProbability
    },
    add: {
        ActivityName: ActivityName,
        Tag:Tag,
        Starttime:Starttime,
        Endtime:Endtime,
        State:State,
        Point:Point,
        Gooduuid:Gooduuid,
        rewardmethod:rewardmethod,
        cardIdAmounts:cardIdAmounts,
        RedPacket:RedPacket,
        Couponid:Couponid,
        goodtitle:goodtitle,
        Coupontitle:Coupontitle,
        chipIdAmounts:chipIdAmounts,
        Reward:Reward,
        ActivityRule:ActivityRule,
        isNoFortune:isNoFortune,
        rewardNumber:rewardNumber
    },
    update: {
        ActivityName: ActivityName,
        Tag:Tag,
        Starttime:Starttime,
        Endtime:Endtime,
        State:State,
        Point:Point,
        Gooduuid:Gooduuid,
        rewardmethod:rewardmethod,
        cardIdAmounts:cardIdAmounts,
        RedPacket:RedPacket,
        Couponid:Couponid,
        goodtitle:goodtitle,
        Coupontitle:Coupontitle,
        chipIdAmounts:chipIdAmounts,
        Reward:Reward,
        ActivityRule:ActivityRule,
        isNoFortune:isNoFortune
    },
    del: {
        uuid
    },
    restart: {
        uuid,Starttime,Endtime
    },
    view: { 
        start
        , length
        ,searchdata: search
        ,Statedata:State
    }
}

export const trendValidator = {
    getAll: {
        state: {
            isIn: {
                errmsg: "state err",
                param: [['on', 'rejected']]
            }
        },
        start: start,
        length: length
    },
    getAllC: {
        start: start,
        length: length
    },
    getAllR: {
        state: {
            isIn: {
                errmsg: "state err",
                param: [['new', 'accepted']]
            }
        },
        start: start,
        length: length
    },
    del: {
        type: {
            isIn: {
                errmsg: "type err",
                param: [['comment', 'trend']]
            }
        },
        uuid: uuid
    },
    updateR: {
        reflectuuid: uuid
    },
    forbiden: {
        useruuid: uuid
    }
}

export const balancePointLog = {
    get: {
        useruuid: uuid,
        start: start,
        length: length
    }
}