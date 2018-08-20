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

const url = {
    isLength: {
        errmsg: "url错误！",
        param: [0, 400]
    }
}

const content = {
    require: 0,
    isLength: {
        errmsg: "content错误",
        param: [0, 40000]
    }
}
export const categoryValidator = {
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

    UUID: {
        uuid: uuid
    },

    updatePic: {
        uuid: uuid,
        pic: {
            isLength: {
                errmsg: "pic有误",
                param: [0, 256]
            }
        }
    },

    updateName: {
        uuid: uuid,
        name: {
            isLength: {
                errmsg: "name有误",
                param: [0, 100]
            }
        }
    }
}

export const logistics = {
    UUID: {
        uuid: uuid
    },
    code: {
        shipperCode: {
            isLength: {
                errmsg: "shipperCode有误",
                param: [0, 10]
            }
        },
        logisticCode: {
            isLength: {
                errmsg: "logisticCode有误",
                param: [0, 40]
            }
        },
        orderCode: {
            isLength: {
                errmsg: "orderCode有误",
                param: [0, 40]
            }
        }
    },
    twoCode: {
        shipperCode: {
            isLength: {
                errmsg: "shipperCode有误",
                param: [0, 10]
            }
        },
        logisticCode: {
            isLength: {
                errmsg: "logisticCode有误",
                param: [0, 40]
            }
        }
    },
    order: {
        orderCode: {
            isLength: {
                errmsg: "orderCode有误",
                param: [0, 40]
            }
        }
    },
    shipper: {
        shipperCode: {
            isLength: {
                errmsg: "shipperCode有误",
                param: [0, 10]
            }
        }
    },
    shippername: {
        shipperName: {
            isLength: {
                errmsg: "shipperName有误",
                param: [0, 20]
            }
        }
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
        errmsg: "start 有误",
        param: [0, 8]
    }
}

const searchdata = {
    require: 0,
    isLength: {
        errmsg: "searchdata 有误",
        param: [0, 255]
    }
}

const business = {
    isLength: {
        errmsg: "business错误！",
        param: [0, 200]
    }
}

const title = {
    isLength: {
        errmsg: "title错误！",
        param: [0, 200]
    }
}

export const goodsValidator = {
    setHot: {
        uuid: uuid,
        hot: {
            isLength: {
                errmsg: "hot错误！",
                param: [["yes", "no"]]
            }
        }
    },
    detail: {
        detailcontent: content,
        uuid: uuid
    },
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },

    titleAndPC: {
        title: {
            isLength: {
                errmsg: "title错误！",
                param: [0, 200]
            }
        },
        page: page,
        count: count
    },
    setState: {
        uuid: uuid,
        state: {
            isIn: {
                errmsg: "state有误",
                param: [["onsale", "offsale", "new", "virtualproduct"]]
            }
        }
    },
    bannerInfo: {
        externalurl: {
            isLength: {
                errmsg: 'externalurl错误！',
                param: [['true', 'false']]
            }
        },
        url: url,
        pic: {
            require: 0
        },
        state: {
            isIn: {
                errmsg: "state有误",
                param: [["on", "off"]]
            }
        },
        content: {
            isLength: {
                errmsg: "content错误！",
                param: [0, 400]
            }
        },
        description: {
            isLength: {
                errmsg: "description错误！",
                param: [0, 400]
            }
        },
        position: {
            isIn: {
                errmsg: "position错误！",
                param: [[1, 2, 3, 4, 5]]
            }
        }
    },

    bannerUrl: {
        uuid: uuid,
        url: url
    },

    goodsState: {
        uuid: uuid,
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [0, 20]
            }
        }
    },

    pageAndCount: {
        page: page,
        count: count
    },

    UUID: {
        uuid: uuid
    },

    creategoods: {
        volume: {
            require: 0,
            isLength: {
                errmsg: "volume错误！",
                param: { min: 0, max: 1000000000 }
            }
        }
    },

    goodsInfo: {
        state: {
            isIn: {
                errmsg: "state有误",
                param: [["onsale", "offsale", "new", "virtualproduct"]]
            }
        },
        title: {
            isLength: {
                errmsg: "title错误！",
                param: [0, 200]
            }
        },
        keyword: {
            isLength: {
                errmsg: "keyword错误！",
                param: [0, 200]
            }
        },
        price: {
            isLength: {
                errmsg: "price错误！",
                param: { min: 0, max: 1000000000 }
            }
        },
        realprice: {
            isLength: {
                errmsg: "realprice错误！",
                param: { min: 0, max: 1000000000 }
            }
        },
        content: content,
        specification: {
            isLength: {
                errmsg: "specification错误！",
                param: [0, 200]
            }
        },
        category: uuid,
        subcategory: uuid,
        tags: {
            require: 0
        },
        association: {
            require: 0
        },
        pics: {
            require: 0
        },
        points: {
            require: 0,
            isLength: {
                errmsg: "points错误！",
                param: { min: 0, max: 1000000000 }
            }
        }
    }
}

const parent1 = {
    require: 0,
    isUUID: {
        errmsg: "parent错误",
        param: 1
    }
}

const parent = {
    require: 0,
    isUUID: {
        errmsg: "parent有误！",
        param: 1
    }
}

export const commentValidator = {
    consult: {
        goodsuuid: uuid,
        content: true,
    },
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    uuid: {
        uuid: uuid
    },
    insertOptions: {
        content: content,
        goodsuuid: uuid,
        parent: parent,

    },
    consultValidator: {
        content: content,
        uuid: uuid
    },
    uuidAndState: {
        uuid: uuid,
        state: {
            isLength: {
                errmsg: "state有误",
                param: [["new", "on", "reject"]]
            }
        }
    },
    parent: {
        parent: parent1
    },
    pageAndCount: {
        page: page,
        count: count
    }
}

export const crmuserValidator = {
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    expValidator: {
        uuid: uuid,
        exp: {
            isLength: {
                errmsg: "EXP 有误",
                param: { min: 0 }
            }
        }
    },
    uuid: {
        uuid: uuid
    },
    usruuid: {
        useruuid: uuid
    }
    ,
    setPassword: {
        useruuid: uuid,
        password: password,
    },

    setState: {
        useruuid: uuid,
        state: {
            isIn: {
                errmsg: "state有误",
                param: [["on", "off"]]
            }
        }
    },

    findAll: {
        order: {
            isIn: {
                errmsg: "order有误",
                param: [["created", "username"]]
            }
        },
        desc: {
            isIn: {
                errmsg: "desc有误",
                param: [["desc", "aesc"]]
            }
        },
        start: start,
        length: length,
        searchdata: searchdata
    },

    login: {
        username: crmusername,
        password: password
    },

    pagecount: {
        page: page,
        count: count
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
        state: {
            isIn: {
                errmsg: "state有误",
                param: [["on", "off"]]
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
        }
    }
}

export const ordersValidator = {
    orderinfoValidator: {
        useruuid: uuid,
        goods: true,
        total_fee: {
            isLength: {
                errmsg: "total_fee 有误",
                param: { min: 0 }
            }
        },
        real_fee: {
            isLength: {
                errmsg: "real_fee 有误",
                param: { min: 0 }
            }
        },
        fee_info: true,
        address: {
            isLength: {
                errmsg: "fee_info 有误",
                param: [0, 255]
            }
        },
        message: {
            isLength: {
                errmsg: "message 有误",
                param: [0, 255]
            }
        },
        state: {
            isIn: {
                errmsg: "perm有误",
                param: [["wait-pay", "wait-send", "wait-recv", "wait-comment", "wait-ack", "cancel", "finish"]]
            }
        }
    },
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata,
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['', 'wait-pay', 'wait-send', 'wait-recv', 'wait-comment', 'wait-ack', 'cancel', 'finish']]
            }
        }
    },
    logisticsCode: {
        uuid: uuid,
        logisticscode: {
            isLength: {
                errmsg: "logisticscode有误",
                param: [1, 64]
            }
        },
        shippercode: {
            isLength: {
                errmsg: "shippercode有误",
                param: [1, 10]
            }
        }
    },

    stateUuid: {
        uuid: uuid,
        state: {
            isIn: {
                errmsg: "perm有误",
                param: [["onsale", "offsale", "new", "virtualproduct"]]
            }
        }
    },

    pagecount: {
        page: page,
        count: count
    },

    pageState: {
        page: page,
        count: count,
        state: {
            isIn: {
                errmsg: "perm有误",
                param: [["onsale", "offsale", "new", "virtualproduct"]]
            }
        }
    },

    UUID: {
        uuid: uuid
    }
}

export const logisticsValitater = {
    pagination: {
        start: start,
        length: length,
        searchdata: searchdata
    },
    pageAndCount: {
        page: page,
        count: count
    }
}
export const shoppingCartValidator = {
    uuid: {
        uuid: uuid
    },
    useruuid: {
        isUUID: {
            errmsg: "useruuid错误！",
            param: 1
        }
    },
    gooduuid: {
        isUUID: {
            errmsg: "gooduuid错误",
            param: 1
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
        number: {
            isLength: {
                errmsg: "number错误",
                param: { min: 1, max: 10000 }
            }
        }
    },
    pageAndCount: {
        page: page,
        count: count
    }
}

export const businessValidator = {
    UUID: {
        uuid: uuid
    },
    updatestate: {
        uuid: uuid,
    },
    insertOptions: {
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [["on", "off"]]
            }
        },
        business: {
            isLength: {
                errmsg: "business错误！",
                param: [0, 200]
            }
        },
        contacts: {
            isLength: {
                errmsg: "contacts错误！",
                param: [0, 200]
            }
        },
        phone: {
            isMobilePhone: {
                errmsg: "电话号码错误!",
                param: ["zh-CN"]
            }
        },
        description: {
            isLength: {
                errmsg: "description错误！",
                param: { min: 0 }
            }
        }
    },
    updatabusiness: {
        uuid: uuid,
        business: business,
        contacts: {
            isLength: {
                errmsg: "contacts错误！",
                param: [0, 200]
            }
        },
        phone: {
            isMobilePhone: {
                errmsg: "电话号码错误!",
                param: ["zh-CN"]
            }
        },
        description: {
            isLength: {
                errmsg: "description错误！",
                param: { min: 0 }
            }
        }
    }
}


export const couponValidator = {
    insertOptions: {
        businessuuid: uuid,
        business: business,
        kind: {
            isLength: {
                errmsg: "kind错误！",
                param: [["mall", "business"]]
            }
        },
        title: title,
        price: {
            isLength: {
                errmsg: "price错误!",
                param: { min: 0 }
            }
        },
        point: {
            isLength: {
                errmsg: "point错误!",
                param: { min: 0 }
            }
        },
        num: {
            isLength: {
                errmsg: "num错误！",
                param: { min: 0 }
            }
        },
        coupontype: {
            isLength: {
                errmsg: "coupontype错误！",
                param: [['discount', 'fulldown', 'cash']]
            }
        }
    },
    UUID: {
        uuid: uuid
    },
    updateOptions: {
        uuid: uuid,
        businessuuid: uuid,
        business: business,
        kind: {
            isLength: {
                errmsg: "kind错误！",
                param: [["mall", "business"]]
            }
        },
        title: title,
        price: {
            isLength: {
                errmsg: "price错误!",
                param: { min: 0 }
            }
        },
        point: {
            isLength: {
                errmsg: "point错误!",
                param: { min: 0 }
            }
        },
        num: {
            isLength: {
                errmsg: "num错误！",
                param: { min: 0 }
            }
        },
        coupontype: {
            isLength: {
                errmsg: "coupontype错误！",
                param: [['discount', 'fulldown', 'cash']]
            }
        }
    }
}

export const prizeValidator = {
    UUID: {
        uuid: uuid,
    },
    insertOptions: {
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['goods', 'coupon', 'point', 'balance']]
            }
        },
        title: {
            isLength: {
                errmsg: "title错误！",
                param: [0, 200]
            }
        }
    },
    updateOptions: {
        uuid: uuid,
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['goods', 'coupon', 'point', 'balance']]
            }
        },
        title: {
            isLength: {
                errmsg: "title错误！",
                param: [0, 200]
            }
        }
    }
}

export const lotterylevelValidator = {
    state: {
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['pointlottery', 'cashlottery']]
            }
        }
    },
    UUID: {
        uuid: uuid,
    },
    insertOptions: {
        level: {
            isInt: {
                errmsg: "level错误！",
                param: [[1, 2, 3, 4, 5]]
            }
        },
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['pointlottery', 'cashlottery']]
            }
        },
        limitcount: {
            isInt: {
                errmsg: "次数限制必须大于0！",
                param: { min: 0 }
            }
        },
    },
    updateOptions: {
        uuid: uuid,
        level: {
            isInt: {
                errmsg: "level错误！",
                param: [[1, 2, 3, 4, 5]]
            }
        },
        num: {
            isInt: {
                errmsg: "num错误！",
                param: { min: 0 }
            }
        },
        awardnum: {
            isInt: {
                errmsg: "awardnum错误！",
                param: { min: 0 }
            }
        },
        limitcount: {
            isInt: {
                errmsg: "次数限制必须大于0！",
                param: { min: 0 }
            }
        },
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['pointlottery', 'cashlottery']]
            }
        },
        title: {
            isLength: {
                errmsg: "title错误！",
                param: [0, 225]
            }
        },
        prizeuuid: uuid
    }
}

export const awardusersValidator = {
    UUID: {
        uuid: uuid
    },
    getOptions: {
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['pointlottery', 'cashlottery']]
            }
        },
        receive: {
            isLength: {
                errmsg: "receive错误！",
                param: [['false', 'true']]
            }
        }
    },
    insertOptions: {
        useruuid: uuid,
        username: {
            isLength: {
                errmsg: "username错误！",
                param: [0, 225]
            }
        },
        level: {
            isInt: {
                errmsg: "level错误！",
                param: { min: 0, max: 2 }
            }
        },
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['pointlottery', 'cashlottery']]
            }
        }
    }
}
export const userprizeValidator = {
    stateAndlotterytype: {
        state: {
            isLength: {
                errmsg: "state错误！",
                param: [['goods', 'coupon', 'point', 'balance']]
            }
        },
        lotterytype: {
            isLength: {
                errmsg: "lotterytype错误！",
                param: [['pointlottery', 'cashlottery']]
            }
        },
        receive: {
            isLength: {
                errmsg: "receive错误！",
                param: [['true', 'false']]
            }
        },
    }
}

export const usercouponValidator = {
    pagination: {
        kind: {
            isLength: {
                errmsg: "kind错误！",
                param: [["mall", "business"]]
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

