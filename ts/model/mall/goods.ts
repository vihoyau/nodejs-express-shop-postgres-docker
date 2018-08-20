import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.goods"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {                                 // UUID
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        title: DataTypes.CHAR(1024),            // 商品标题
        keyword: DataTypes.TEXT,                // 搜索关键字
        price: DataTypes.INTEGER,               // 价格
        realprice: DataTypes.INTEGER,           // 特价
        content: DataTypes.TEXT,                // 商品详情html
        specification: DataTypes.TEXT,          // 商品规格html
        category: DataTypes.UUID,               // 大类UUID
        subcategory: DataTypes.UUID,            // 小类UUID
        tags: DataTypes.JSONB,                  // 商品标签文档
        association: DataTypes.ARRAY(DataTypes.UUID),   // 关联商品UUID数组
        pics: DataTypes.ARRAY(DataTypes.TEXT),          // 图片地址数组
        points: DataTypes.INTEGER,                      // 多少积分可以兑换，NULL表示不可兑换
        state: DataTypes.ENUM("onsale", "offsale", "new", 'virtualproduct'),  // 状态：onsale-在售 offset-下架 new-编辑  virtualproduct--虚拟商品
        businessuuid: DataTypes.UUID,               //商家id
        postage: DataTypes.INTEGER,                 //邮费
        deleted: DataTypes.INTEGER,             // 是否已经删除
        modified: DataTypes.TIME,               // 修改时间记录
        created: DataTypes.TIME,              // 创建时间记录
        deduction: DataTypes.CHAR(36),         //抵扣开关
        businessmen: DataTypes.CHAR(30),         //商家
        hot: DataTypes.ENUM("yes", "no"),                //是否是推荐商品
        detailpics: DataTypes.ARRAY(DataTypes.STRING),   //详情图片
        detailcontent: DataTypes.TEXT   //详情文字
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "goods"
        })
}

// ----------------------------- app -----------------------------
export async function findAll(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            state: "onsale",
            deleted: 0,
        },
        offset: cursor,
        limit: limit,
        order: [['created', 'DESC']]
    })
    return res.map(r => r.get())
}
//更改抵扣标签
export async function changeTag(tag: any, gooduuid: any) {
    let res = await getModel(modelName).update({ deduction: tag }, { where: { uuid: gooduuid } })
    return res
}

//查询商品抵扣资格
export async function searchpoints(gooduuid: any) {
    let res = await getModel(modelName).findOne({where:{uuid:gooduuid}})
    return res
}
export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

// 推荐商品列表
export async function findByRecommendGoods() {
    let res = await getModel(modelName).findAll({ where: { hot: 'yes', state: "onsale", deleted: 0 }, limit: 9, order: [['created', 'desc']] })
    return res ? res.map(r => r.get()) : undefined
}

// 根据商家名查询商品
export async function findByBusiness(businessmen: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { businessmen: businessmen, state: "onsale", deleted: 0 }, offset: cursor, limit: limit, order: [['created', 'desc']] })
    return res ? res.map(r => r.get()) : undefined
}

export async function findByState(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid, state: 'onsale', deleted: 0 } })
    return res ? res.get() : undefined
}

/**
 *
 */
export async function findByStateVir(uuid: string) {
    let res = await getModel(modelName).findOne({
        where: {
            uuid: uuid,
            $or: [{ state: 'onsale' }, { state: 'virtualproduct' }],
            deleted: 0
        }
    })
    return res ? res.get() : undefined
}
export async function findByKeyword(keyword: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            state: "onsale",
            deleted: 0,
            $or: [{ title: { like: '%' + keyword + '%' } }, { keyword: { like: '%' + keyword + '%' } }],
        },
        offset: cursor,
        limit: limit,
        order: [['created', 'DESC']]
    })
    return res.map(r => r.get())
}

export async function findByCategory(category: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            state: "onsale",
            deleted: 0,
            category: category,
        },
        offset: cursor,
        limit: limit,
        order: [['created', 'DESC']]
    })
    return res.map(r => r.get())
}

export async function findBySubcategory(subcategory: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            state: "onsale",
            deleted: 0,
            subcategory: subcategory,
        },
        offset: cursor,
        limit: limit,
        order: [['created', 'DESC']]
    })
    return res.map(r => r.get())
}

export async function findBySubcategoryPrice(fromPrice: number, toPrice: number, cursor: number, limit: number, subcategory: string) {
    let res
    if (toPrice === 0) {
        res = await getModel(modelName).findAll({
            where: {
                state: "onsale",
                deleted: 0,
                subcategory: subcategory,
                $and: [{ realprice: { $gte: fromPrice } }]
            },
            offset: cursor,
            limit: limit,
            order: [['created', 'DESC']]
        })
    } else {
        res = await getModel(modelName).findAll({
            where: {
                state: "onsale",
                deleted: 0,
                subcategory: subcategory,
                $and: [{ realprice: { $gte: fromPrice } }, { realprice: { $lte: toPrice } }]
            },
            offset: cursor,
            limit: limit,
            order: [['created', 'DESC']]
        })
    }
    return res.map(r => r.get())
}

export async function findByPrice(fromPrice: number, toPrice: number, cursor: number, limit: number, category: string) {
    let res
    if (toPrice === 0) {
        res = await getModel(modelName).findAll({
            where: {
                state: "onsale",
                deleted: 0,
                category: category,
                $and: [{ realprice: { $gte: fromPrice } }]
            },
            offset: cursor,
            limit: limit,
            order: [['created', 'DESC']]
        })
    } else {
        res = await getModel(modelName).findAll({
            where: {
                state: "onsale",
                deleted: 0,
                category: category,
                $and: [{ realprice: { $gte: fromPrice } }, { realprice: { $lte: toPrice } }]
            },
            offset: cursor,
            limit: limit,
            order: [['created', 'DESC']]
        })
    }
    return res.map(r => r.get())
}

// sort：排序 desc-倒序 asc-正序
export async function findByKeywordPriceSort(keyword: string, sort: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            state: "onsale",
            deleted: 0,
            keyword: { $like: '%' + keyword + '%' },
        },
        offset: cursor,
        limit: limit,
        order: [['realprice', sort]]
    })
    return res.map(r => r.get())
}

// sort：排序 desc-倒序 asc-正序
export async function orderBySubcategoryPrice(subcategory: string, sort: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            state: "onsale",
            deleted: 0,
            subcategory: subcategory
        },
        offset: cursor,
        limit: limit,
        order: [['realprice', sort]]
    })
    return res.map(r => r.get())
}

// sort：排序 desc-倒序 asc-正序
export async function orderByPrice(category: string, sort: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            state: "onsale",
            deleted: 0,
            category: category
        },
        offset: cursor,
        limit: limit,
        order: [['realprice', sort]]
    })
    return res.map(r => r.get())
}

export async function findByKeywordPriceRange(fromPrice: number, toPrice: number, keyword: string, cursor: number, limit: number) {
    let res
    if (toPrice === 0) {
        res = await getModel(modelName).findAll({
            where: {
                state: "onsale",
                deleted: 0,
                keyword: { $like: '%' + keyword + '%' },
                $and: [{ realprice: { $gte: fromPrice } }]
            },
            offset: cursor,
            limit: limit,
            order: [['created', 'DESC']]
        })
    } else {
        res = await getModel(modelName).findAll({
            where: {
                state: "onsale",
                deleted: 0,
                keyword: { $like: '%' + keyword + '%' },
                $and: [{ realprice: { $gte: fromPrice } }, { realprice: { $lte: toPrice } }]
            },
            offset: cursor,
            limit: limit,
            order: [['created', 'DESC']]
        })
    }
    return res.map(r => r.get())
}
// ----------------------------- crm -----------------------------
export async function updateGoodsTags(uuid: string, tags: any, realprice: number, price: number, points: number) {
    let [number, res] = await getModel(modelName).update({ tags: tags, realprice: realprice, price: price, points: points }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findGoodsByHot(sequelize: Sequelize) {
    let res = await sequelize.query(`select ge.volume,ge.sales,g.tags, c1."name" category,c2."name" subcategory,c1."name" category,
    c2."name" subcategory,g.hot,g.uuid,g.title,g.pics,g.keyword,g.realprice,g.price,g.points,g.association,g."state" ,g.detailpics,g.detailcontent
    from mall.goods_ext ge, mall.goods g,mall.category c1 ,mall.category c2 where g.category=c1.uuid and g.uuid=ge.uuid and
     g.subcategory=c2.uuid and g.state='onsale' and g.deleted=0 and g.hot='yes' order by g.created desc `, { type: "select" }) as any[]
    return res
}

export async function findGoodsHotCount(sequelize: Sequelize) {
    let res = await sequelize.query(`select count(*) from mall.goods_ext ge, mall.goods g,mall.category c1 ,mall.category c2 where g.category=c1.uuid and g.uuid=ge.uuid and g.subcategory=c2.uuid and g.state='onsale' and g.deleted=0 and g.hot='yes' `, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function updateState(uuid: string, state: string) {
    let obj: any
    if (state != "onsale") {
        obj = {
            state: state,
            hot: "no",
        }
    } else {
        obj = {
            state: state
        }
    }
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

// 设置推荐商品
export async function updateGoodsHot(uuid: string, hot: string) {
    let [number, res] = await getModel(modelName).update({ hot: hot }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateGoods(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function insertGoods(seqz: Sequelize, obj: any, volume: number) {
    return await seqz.transaction(async t => {
        let goods = await getModel(modelName).create(obj, { transaction: t, returning: true })
        let uuid = goods.get("uuid")
        await getModel("mall.goods_ext").create({ uuid: uuid, volume: volume }, { transaction: t })
        return uuid
    })
}

export async function deleteGoods(uuid: string) {
    await getModel(modelName).update({ deleted: 1 }, { where: { uuid: uuid } })
}

export async function findPrizeGoods(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select ge.volume,ge.sales,g.tags,g.postage, c1."name" category,c2."name" subcategory,g.hot,g.uuid,g.title,g.pics,g.keyword,
    g.realprice,g.price,g.businessmen,g.points,g.association,g."state",g.detailpics,g.detailcontent
    from mall.goods_ext ge, mall.goods g,mall.category c1 ,mall.category c2 where g.category=c1.uuid and
     g.uuid=ge.uuid and g.subcategory=c2.uuid and g.deleted=0 and
     (g.state='onsale' or g.state='virtualproduct' ) and
     (c1.name like '%${searchdata}%' or c2.name like '%${searchdata}%' or
      g.title like '%${searchdata}%' or g.keyword  like '%${searchdata}%' or
      g.businessmen  like '%${searchdata}%') ORDER BY g.created DESC OFFSET ${cursor}  LIMIT ${limit} `, { type: "select" }) as any[]
    return res
}

export async function findGoods(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select ge.volume,ge.sales,g.tags,g.postage, c1."name" category,c2."name" subcategory,g.hot,g.uuid,
    g.title,g.pics,g.keyword,g.realprice,g.price,g.businessmen,g.points,g.association,g."state",g.detailpics,g.detailcontent,g.deduction
    from mall.goods_ext ge, mall.goods g,mall.category c1 ,mall.category c2 where g.category=c1.uuid and
     g.uuid=ge.uuid and g.subcategory=c2.uuid and g.deleted=0 and
     (c1.name like '%${searchdata}%' or c2.name like '%${searchdata}%' or
      g.title like '%${searchdata}%' or g.keyword  like '%${searchdata}%' or
       g.businessmen  like '%${searchdata}%')
       ORDER BY g.created DESC OFFSET ${cursor}  LIMIT ${limit} `, { type: "select" }) as any[]
    return res
}

export async function getPrizeCount(sequelize: Sequelize, searchdata: string) {
    let res = await sequelize.query(`select count(*) from  mall.goods g,mall.category c1 ,mall.category c2 where g.category=c1.uuid  and g.subcategory=c2.uuid and g.deleted=0 and(g.state='onsale' or g.state='virtualproduct' ) and (c1.name like '%${searchdata}%' or c2.name like '%${searchdata}%' or g.title like '%${searchdata}%' or g.keyword  like '%${searchdata}%' or g.businessmen  like '%${searchdata}%') `, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function getCount(sequelize: Sequelize, searchdata: string) {
    let res = await sequelize.query(`select count(*) from  mall.goods g,mall.category c1 ,mall.category c2 where g.category=c1.uuid  and g.subcategory=c2.uuid and g.deleted=0 and (c1.name like '%${searchdata}%' or c2.name like '%${searchdata}%' or g.title like '%${searchdata}%' or g.keyword  like '%${searchdata}%' or g.businessmen  like '%${searchdata}%') `, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function modifilyPics(uuid: string, pics: string) {
    let [number, res] = await getModel(modelName).update({ pics: pics }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function modifilyDetailPics(uuid: string, pics: string) {
    let [number, res] = await getModel(modelName).update({ detailpics: pics }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function deleteByCategory(category: string) {
    let [number, res] = await getModel(modelName).update({ deleted: 1 }, { where: { category: category }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function deleteBySubcategory(subcategory: string) {
    let [number, res] = await getModel(modelName).update({ deleted: 1 }, { where: { subcategory: subcategory }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateNumber(tags: any, uuid: string) {
    let [number, res] = await getModel(modelName).update({ tags: tags }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}