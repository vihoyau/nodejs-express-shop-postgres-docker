import { getPageCount } from "./utils"
import * as moment from "moment"
export function sortByTime(arr: any) {
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - 1 - i; j++) {
            if (arr[j].time < arr[j + 1].time) {
                let temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            }
        }
    }
    return arr
}

export function getNewStartEndTime(starttime: any, endtime: any, page: any, count: any) {
    let start = new Date(starttime)
    let end = new Date(endtime)
    let interval = end.getTime() - start.getTime()  //相差的毫秒数
    let days = Math.ceil(interval / (24 * 3600 * 1000))    //相差天数,向上取整
    let { cursor, limit } = getPageCount(page, count)
    if (cursor == 0) {
        if (limit >= days)
            return { starttime, endtime, days }
        else {
            end.setTime(start.getTime() + (limit * 24 * 3600 * 1000))
            return { starttime, endtime: moment(end).format('YYYY-MM-DD 00:00:00'), days }
        }
    } else {
        if (cursor > days)
            return { starttime: moment().format('YYYY-MM-DD HH:mm:ss'), endtime: moment().format('YYYY-MM-DD HH:mm:ss'), days }
        else if (cursor + limit > days) {
            start.setTime(start.getTime() + (cursor * 24 * 3600 * 1000))
            return { starttime: moment(start).format('YYYY-MM-DD 00:00:00'), endtime, days }
        } else {
            start.setTime(start.getTime() + (cursor * 24 * 3600 * 1000))
            end.setTime(start.getTime() + (limit * 24 * 3600 * 1000))
            return { starttime: moment(start).format('YYYY-MM-DD 00:00:00'), endtime: moment(end).format('YYYY-MM-DD 00:00:00'), days }
        }
    }
}