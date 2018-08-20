const password = {
    isLength: {
        errmsg: "密码长度错误！",
        param: [4, 64]
    }
}

const phone = {
    isMobilePhone: {
        errmsg: "手机号格式错误！",
        param: ["zh-CN"]
    }
}

const smscode = {
    isLength: {
        errmsg: "验证码错误",
        param: [4, 4]
    }
}

const uuid = {
    isUUID: {
        errmsg: "uuid有误！",
        param: 1
    }
}

const idcard = {
    require: 0,
    isLength: {
        errmsg: "身份证号码有误",
        param: [18, 18]
    }
}

const nickname = {
    require: 0,
    isLength: {
        errmsg: "nickname有误",
        param: [1, 200]
    }
}

const address = {
    require: 0,
    isLength: {
        errmsg: "address有误",
        param: [0, 200]
    }
}

const headurl = {
    require: 0,
    isLength: {
        errmsg: "headurl有误",
        param: [0, 200]
    }
}

const wxappid = {
    require: 0,
    isLength: {
        errmsg: "wxappid有误",
        param: [0, 200]
    }
}

const alipayid = {
    require: 0,
    isLength: {
        errmsg: "alipayid有误",
        param: [0, 200]
    }
}

const sex = {
    isLength: {
        errmsg: "sex有误",
        param: [0, 200]
    }
}

const birthday = {
    require: 0,
    isLength: {
        errmsg: "birthday有误",
        param: [0, 200]
    }
}

const interest = {
    require: 0,
    isLength: {
        errmsg: "interest有误",
        param: [0, 200]
    }
}

const description = {
    require: 0,
    isLength: {
        errmsg: "description有误",
        param: [0, 200]
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

export const usersValidator = {
    moment: {
        uuid: uuid,
        moment: {
            isInt: {
                errmsg: "moment错误！",
                param: { min: 0 }
            }
        }
    },
    exchange: {
        points: {
            isInt: {
                errmsg: "points有误！",
                param: { min: 0 }
            }
        },
        balance: {
            isInt: {
                errmsg: "balance有误！",
                param: { min: 0 }
            }
        }
    },
    obj: {
        loginnumber: {
            isInt: {
                errmsg: "loginnumber错误",
                param: { min: 0, max: 1 }
            }
        },
        searchnumber: {
            isInt: {
                errmsg: "searchnumber错误",
                param: { min: 0, max: 1 }
            }
        },
        favoritenumber: {
            isInt: {
                errmsg: "favoritenumber错误",
                param: { min: 0, max: 1 }
            }
        },
        type: {
            isLength: {
                errmsg: "type错误",
                param: [["ads", "goods"]]
            }
        }
    },
    answers: {
        adsuuid: uuid,
        answer: {
            isLength: {
                errmsg: "answer错误！",
                param: { min: 1, max: 64 }
            }
        }
    },

    register: {
        password: password,
        username: phone,
        code: smscode
    },
    wxqq: {
        code: smscode,
        username: phone
    },
    code: {
        username: phone
    },
    wxcode: {
        code: {
            isLength: {
                errmsg: "code err",
                param: [1, 128]
            }
        }
    },
    checkcode: {
        username: phone,
        code:smscode
    },

    setPassword: {
        password: password,
        username: phone,
        code: smscode
    },

    phone: {
        phone: phone
    },

    uuid: {
        uuid: uuid
    },
    token: {
        token: {
            isLength: {
                errmsg: "token err",
                param: [1, 128]
            }
        }
    },
    information: {
        uuid: uuid,
        idcard: idcard,
        nickname: nickname,
        realname: {
            require: 0,
            isLength: {
                errmsg: "realname有误",
                param: [0, 200]
            }
        },
        address: address,
        headurl: headurl,
        wxappid: wxappid,
        alipayid: alipayid,
        sex: sex,
        birthday: birthday,
        interest: interest,
        description: description
    },

    patchInfo: {
        uuid: uuid,
        nickname: {
            require: 0,
            isLength: {
                errmsg: "nickname有误",
                param: [0, 20]
            }
        },
        address: address,
        headurl: {
            require: 0,
            isLength: {
                errmsg: "headurl有误",
                param: [0, 200]
            }
        },
        sex: {
            require: 0,
            isLength: {
                errmsg: "sex错误",
                param: [0, 2]
            }
        },
        birthday: {
            require: 0,
            isLength: {
                errmsg: "birthday错误",
                param: [0, 50]
            }
        }
    },

    applogin: {
        username: phone,
        password: password
    },

    reg: {
        username: phone,
        password: password
    },

    bind: {
        username: phone,
        password: password
    },

    setPoints: {
        uuid: uuid,
        points: {
            isInt: {
                errmsg: "points有误！",
                param: { min: 0, max: 100000 }
            }
        },
        balance: {
            isInt: {
                errmsg: "balance有误！",
                param: { min: 0, max: 100000 }
            }
        },
        exp: {
            isInt: {
                errmsg: "exp不合法！",
                param: { min: 0, max: 100000000 }
            }
        }
    },
    withdraw: {
        useruuid: uuid,
        balance: {
            isInt: {
                errmsg: "balance有误！",
                param: { min: 0, max: 100000 }
            }
        },
        description: {
            isLength: {
                errmsg: "描述信息错误！",
                param: { min: 1, max: 64 }
            }
        }
    },
    pagecount: {
        page: page,
        count: count
    },
    bytype: {
        subcategory: {
            require: 0,
            isLength: {
                errmsg: "类型错误！",
                param: { min: 1, max: 64 }
            }
        },
        page: page,
        count: count
    },
    keywords: {
        keyword: {
            require: 0,
            isLength: {
                errmsg: "keyword错误！",
                param: { min: 1, max: 64 }
            }
        },
        count: count
    }
}

export const addressValidator = {
    uuid: {
        uuid: uuid
    },
    create: {
        useruuid: uuid,
        address: address,
        contact: nickname,
        phone: phone,
        defaul: {
            isLength: {
                errmsg: "defual错误",
                param: [["yes", "no"]]
            }
        }
    },
    update: {
        uuid: uuid,
        contact: nickname,
        phone: phone,
        defaul: {
            isLength: {
                errmsg: "defaul错误",
                param: [["yes", "no"]]
            }
        }
    },
    state: {
        useruuid: uuid,
        uuid: uuid
    }
}

export const goodsValidator = {
    business: {
        business: {
            isLength: {
                errmsg: "business错误！",
                param: [0, 200]
            }
        }
    },
    uuid: {
        uuid: uuid
    },
    keywords: {
        keyword: {
            require: 0,
            isLength: {
                errmsg: "keyword错误！",
                param: { min: 1, max: 64 }
            }
        },
        page: page,
        count: count
    },
    range_price: {
        fromPrice: {
            isInt: {
                errmsg: "fromPrice有误！",
                param: { min: 0, max: 10000 }
            }
        },
        toPrice: {
            require: 0,
            isInt: {
                errmsg: "toPrice有误！",
                param: { min: 0 }
            }
        },
        page: page,
        count: count
    },
    pagecount: {
        page: page,
        count: count
    }
}

const number = {
    isInt: {
        errmsg: "number错误",
        param: { min: -1, max: 1 }
    }
}

export const shoppingCartValidator = {
    uuid: {
        uuid: uuid
    },
    useruuid: {
        useruuid: uuid
    },
    gooduuid: {
        gooduuid: uuid
    },
    insertGoods: {
        gooduuid: uuid,
        property: {
            isLength: {
                errmsg: "property错误",
                param: [0, 200]
            }
        },
        goodprice: {
            isInt: {
                errmsg: "goodprice错误！",
                param: { min: 0 }
            }
        },
        goodpoint: {
            isInt: {
                errmsg: "goodpoint错误！",
                param: { min: 0 }
            }
        },
        stock: {
            isInt: {
                errmsg: "stock错误！",
                param: { min: 0 }
            }
        }
    },
    modified: {
        require: 0,
        isLength: {
            errmsg: "modified错误",
            param: [0, 200]
        }
    },
    created: {
        require: 0,
        isLength: {
            errmsg: "created错误",
            param: [0, 200]
        }
    },
    numberAndUuid: {
        uuid: uuid,
        number: number
    },
    pageAndCount: {
        page: page,
        count: count
    }
}


/**
 * common 表的验证
 */
const content = {
    isLength: {
        errmsg: "content错误",
        param: [0, 400]
    }
}
const goodsuuid = {
    isUUID: {
        errmsg: "goodsuuid错误",
        param: 1
    }
}
const parent1 = {
    require: 0,
    isUUID: {
        errmsg: "parent错误",
        param: 1
    }
}
const state = {
    require: 0,
    isLength: {
        errmsg: "state错误",
        param: [1, 200]
    }
}
const parent = {
    require: 0,
    isUUID: {
        errmsg: "parent有误！",
        param: 1
    }
}

export const commnetValidator = {
    parent: {
        parent: uuid
    },
    consult: {
        goodsuuid: uuid,
        content: true,
    },
    uuid: {
        uuid: uuid
    },
    insertOptions: {
        content: content,
        goodsuuid: goodsuuid,
        parent: parent,
    },
    uuidAndState: {
        uuid: uuid,
        state: state
    },
    parentAndPC: {
        parent: parent1,
        page: page,
        count: count
    },
    pageAndCount: {
        page: page,
        count: count
    }

}

/**
 * favoriate(商品收藏表)验证
 */
const gooduuid = {
    isUUID: {
        errmsg: "gooduuid错误",
        param: 1
    }
}
export const favoriateValitator = {
    gooduuid: {
        gooduuid: gooduuid
    },
    pageAndCount: {
        page: page,
        count: count
    }
}


export const paymentValidator = {
    pay: {
        useruuid: uuid,
        amount: {
            isInt: {
                errmsg: "number错误",
                param: { min: 1 }
            }
        },
        description: {
            isLength: {
                errmsg: "description有误",
                param: [0, 200]
            }
        }
    }
}

export const wxpayValidator = {
    momentvalidator: {
        moment: {
            isInt: {
                errmsg: "moment有误",
                param: { min: 0 }
            }
        }
    },
    pay: {
        orderuuid: uuid
    },
    grouppay: {
        uuid: uuid,
        addressuuid: uuid
    }
}


export const messageValidator = {
    uuid: {
        uuid: uuid
    }
}

export const ordersCartValidator = {
    updateOrders: {
        uuid: uuid,
        state: {
            isLength: {
                errmsg: "state错误",
                param: [['wait-pay', 'wait-send', 'wait-recv', 'wait-comment', 'wait-ack', 'cancel', 'finish']]
            }
        }
    },
    postOreders: {
        useruuid: uuid,
        total_fee: {
            isInt: {
                errmsg: "total_fee错误"
            }
        },
        real_fee: {
            isInt: {
                errmsg: "total_fee错误"
            }
        },
        message: {
            isLength: {
                errmsg: "message错误",
                param: [0, 2000]
            }
        },
        state: {
            isLength: {
                errmsg: "state错误",
                param: [['wait-pay', 'wait-send', 'wait-recv', 'wait-comment', 'wait-ack', 'cancel', 'finish']]
            }
        }
    }
}

export const systemValidator = {
    sysname: {
        name: {
            isLength: {
                errmsg: "name有误",
                param: [0, 1000000]
            }
        }
    },
    contentValidator: {
        name: {
            isLength: {
                errmsg: "name有误",
                param: [0, 1000000]
            }
        },
        content: {
            isLength: {
                errmsg: "content有误",
                param: [0, 1000000]
            }
        }
    }
}

export const logistics = {
    order: {
        orderCode: {
            isLength: {
                errmsg: "orderCode有误",
                param: [0, 40]
            }
        }
    }
}

export const alipayValidator = {
    pay: {
        orderuuid: uuid
    },
    paygroup: {
        activityuuid: uuid,
        addressuuid: uuid
    }
}

export const usercouponValidator = {
    UUID: {
        uuid: uuid
    },
    total_fee: {
        total_fee: {
            isInt: {
                errmsg: "total_fee错误！",
                param: { min: 0 }
            }
        }
    },
    business: {
        business: {
            isLength: {
                errmsg: "business错误！",
                param: [0, 200]
            }
        }
    },
    insertOptions: {
        couponuuid: uuid
    },
    pagination: {
        kind: {
            isLength: {
                errmsg: "kind错误！",
                param: [["mall", "business", "entity"]]
            }
        },
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [["new", "used", "expired"]]
            }
        }
    }
}

export const couponValidator = {
    pagination: {
        kind: {
            isLength: {
                errmsg: "kind错误！",
                param: [['mall', 'business']]
            }
        }
    },
    business: {
        business: {
            isLength: {
                errmsg: "business错误！",
                param: [0, 200]
            }
        }
    }
}

export const userprizeValidator = {
    UUID: {
        uuid: uuid
    },
    lotterytype: {
        lotterytype: {
            isLength: {
                errmsg: "lotterytype错误！",
                param: [['point', 'cash']]
            }
        }
    }
}

export const ordersValidator = {
    fee_type: {
        fee_type: {
            isLength: {
                errmsg: "fee_type错误！",
                param: [['wait-pay', 'wxpay', 'alipay', 'pointpay', 'balancepay', 'cardpay']]
            }
        }
    }
}

export const adscommentValidator = {
    insertComment: {
        content: content,
        useruuid: uuid,
        adsuuid: uuid
    },
    insertparentComment:{
        content: content,
        useruuid: uuid,
        adsuuid: uuid,
        parent :uuid
    },
    commentuuid:{
        commentUUID : uuid
    }

}
export const adscoverValidator = {
    adsuuid: {
        uuid: uuid
    }
}

const bid = {
    isFloat: {
        errmsg: "出价不对",
        param: { min: 0.0, max: 100000.0 }
    }
}

const start = {
    isInt: {
        errmsg: "start错误！",
        param: { min: 0, max: 10000 }
    }
}

const length = {
    isInt: {
        errmsg: "length错误！",
        param: { min: 0, max: 10000 }
    }
}

export const evaluateValidator = {
    opengroup: {
        activityuuid: uuid,
        /*addressuuid: uuid,*/
        bid: bid
    },
    creategroup: {
        activityuuid: uuid
    },
    joingroup: {
        groupuuid: uuid,
        //addressuuid: uuid,
        bid: bid
    },
    addgroup: {
        groupuuid: uuid
    },
    get: {
        page: start,
        count: length
    },
    uuid: {
        uuid: uuid
    }
}

export const infoValidator = {
    getInfo: {
        category: uuid,
        page: page,
        count: count
    },
    getKey: {
        page: page,
        count: count
    }
}

export const trendValidator = {
    newTrend: {
        uuid: uuid,
        /* content: {
            isLength: {
                errmsg: "长度错误！",
                param: [0, 1000]
            }
        }, */
        mold: {
            isIn: {
                errmsg: "mold err",
                param: [['default', 'redpaper', 'reward']]
            }
        }
    },
    answer_mold: {
        mold: {
            isIn: {
                errmsg: "mold err",
                param: [['point', 'balance']]
            }
        },
        type: {
            isIn: {
                errmsg: "type err",
                param: [['random', 'quota']]
            }
        },
        amount: {
            isInt: {
                errmsg: "amount err",
                param: { min: 0, max: 10000000 }
            }
        },
        total: {
            isFloat: {
                errmsg: "total err",
                param: { min: 0, max: 10000000 }
            }
        }
    },
    com: {
        trenduuid: uuid,
        content: content
    },
    commentuuid: {
        commentUUID: uuid
    },
    uuid: {
        uuid: uuid
    },
    reflect: {
        uuid: uuid
    },
    reward: {
        commentuuid: uuid,
        trenduuid: uuid
    },
    getTrend: {
        page: page,
        count: count
    },
    getAnswer: {
        trenduuid: uuid,
        page: page,
        count: count
    },
    getAll: {
        page: page,
        count: count
    }
}