import * as path from "path"
import { FormOptions, Form } from "multiparty"

/*{
     "err": null,
     "files": {
         "image": [
             {
                 "fieldName": "image",
                 "originalFilename": "users.test.js",
                 "path": "public\\files\\kQpp43xBiszHPGmXdt9qfadP.js",
                 "headers": {
                     "content-disposition": "form-data; name=\"image\"; filename=\"users.test.js\"",
                     "content-type": "application/javascript"
                 },
                 "size": 1420
             }
         ]
     },
     "fields": {
         "image": [
             {
                 "fieldName": "image",
                 "originalFilename": "users.test.js",
                 "path": "public\\files\\kQpp43xBiszHPGmXdt9qfadP.js",
                 "headers": {
                     "content-disposition": "form-data; name=\"image\"; filename=\"users.test.js\"",
                     "content-type": "application/javascript"
                 },
                 "size": 1420
             }
         ]
     },
     "status": 0
 }*/

import { accessAsync, removeAsync, mkdirAsync, listFilesAsync, renameAsync } from "./fs"
function uploadOneFile(req: any, fieldName: string, opt: FormOptions) {
    return new Promise((resolve, reject) => {
        let form = new Form(opt)
        form.parse(req, async (err, fields, files) => {
            if (err)
                return reject(err)
            // 上传名字是否正确
            let fileInfoArr = files[fieldName]
            if (fileInfoArr && (fileInfoArr as Array<any>).length == 1) {
                return resolve(fileInfoArr[0])
            }

            for (let k in files) {
                for (let kk in files[k]) {
                    let m = files[k][kk]
                    await removeAsync(m.path)   //删除非法临时文件
                }
            }

            reject("invalid files")
        })
    })
}

interface UploadOption {
    uuid: string,
    tmpDir: string,
    maxSize: number,
    targetDir: string,
    fieldName: string,
    extnames: Array<string>,
}

interface infoUploadOption {
    tmpDir: string,
    maxSize: number,
    targetDir: string,
    fieldName: string,
    extnames: Array<string>,
}

interface UploadAdsMediaOption extends UploadOption {
    glob: string,
    maxFiles: number,
}

interface UploadInfoAdsMediaOption extends infoUploadOption {
    glob: string,
    maxFiles: number,
}

async function uploadinfoMediaAsync(req: any, opt: UploadInfoAdsMediaOption): Promise<string> {
    let dir = `${opt.targetDir}`

    // 创建目录
    if (! await accessAsync(dir))
        await mkdirAsync(dir)

    // 广告目录下的照片数量是否超限
    let files = await listFilesAsync(`${dir}/${opt.glob}`)
    if (files.length >= opt.maxFiles)
        throw new Error("too many files")

    // 上传单张照片
    let fileInfo: any = await uploadOneFile(req, opt.fieldName, { uploadDir: opt.tmpDir, maxFields: 1, maxFilesSize: opt.maxSize })

    // 后缀
    let tmpPath = fileInfo.path
    let extname = path.extname(tmpPath)
    let find = false
    for (let v of opt.extnames) {
        if (extname === v) {
            find = true
            break
        }
    }

    if (!find) {
        await removeAsync(tmpPath)
        throw new Error("invalid image type")
    }
    // 重命名
    let newPath = `${dir}/${path.basename(tmpPath)}`
    try {
        await renameAsync(tmpPath, newPath)
    } catch (e) {
        await removeAsync(tmpPath)
        throw e
    }

    return `/${path.basename(tmpPath)}`
}

async function uploadMediaAsync(req: any, opt: UploadAdsMediaOption): Promise<string> {
    let dir = `${opt.targetDir}/${opt.uuid}`

    // 创建目录
    if (! await accessAsync(dir))
        await mkdirAsync(dir)

    // 广告目录下的照片数量是否超限
    let files = await listFilesAsync(`${dir}/${opt.glob}`)
    if (files.length >= opt.maxFiles)
        throw new Error("too many files")

    // 上传单张照片
    let fileInfo: any = await uploadOneFile(req, opt.fieldName, { uploadDir: opt.tmpDir, maxFields: 1, maxFilesSize: opt.maxSize })

    // 后缀
    let tmpPath = fileInfo.path
    let extname = path.extname(tmpPath)
    let find = false
    for (let v of opt.extnames) {
        if (extname === v) {
            find = true
            break
        }
    }

    if (!find) {
        await removeAsync(tmpPath)
        throw new Error("invalid image type")
    }
    // 重命名
    let newPath = `${dir}/${path.basename(tmpPath)}`
    try {
        await renameAsync(tmpPath, newPath)
    } catch (e) {
        await removeAsync(tmpPath)
        throw e
    }

    return `${opt.uuid}/${path.basename(tmpPath)}`
}
 // 上传多张照片
async function uploadCollectionAsync(req: any, opt: UploadAdsMediaOption): Promise<string> {
    let dir = `${opt.targetDir}/${opt.uuid}`

    // 创建目录
    if (! await accessAsync(dir))
        await mkdirAsync(dir)

    // 广告目录下的照片数量是否超限
    let files = await listFilesAsync(`${dir}/${opt.glob}`)
    if (files.length >= opt.maxFiles)
        throw new Error("too many files")

    // 上传单张照片
    let fileInfo: any = await uploadOneFile(req, opt.fieldName, { uploadDir: opt.tmpDir, maxFields: 15, maxFilesSize: opt.maxSize })

    // 后缀
    let tmpPath = fileInfo.path
    let extname = path.extname(tmpPath)
    let find = false
    for (let v of opt.extnames) {
        if (extname === v) {
            find = true
            break
        }
    }

    if (!find) {
        await removeAsync(tmpPath)
        throw new Error("invalid image type")
    }
    // 重命名
    let newPath = `${dir}/${path.basename(tmpPath)}`
    try {
        await renameAsync(tmpPath, newPath)
    } catch (e) {
        await removeAsync(tmpPath)
        throw e
    }

    return `${opt.uuid}/${path.basename(tmpPath)}`
}
export async function uploadAdsMovie(req: any, opt: UploadAdsMediaOption): Promise<string> {
    return await uploadMediaAsync(req, opt)
}

export async function uploadAdsImage(req: any, opt: UploadAdsMediaOption): Promise<string> {
    return await uploadMediaAsync(req, opt)
}

export async function uploadinfoImage(req: any, opt: UploadInfoAdsMediaOption): Promise<string> {
    return await uploadinfoMediaAsync(req, opt)
}

export async function uploadCollectionImage(req: any, opt: UploadAdsMediaOption): Promise<string> {
    return await uploadCollectionAsync(req, opt)
}

export async function uploadHeadImg(req: any, opt: UploadOption): Promise<string> {
    // 上传单张照片
    let fileInfo: any = await uploadOneFile(req, opt.fieldName, { uploadDir: opt.tmpDir, maxFields: 1, maxFilesSize: opt.maxSize })

    // 重命名
    let tmpPath = fileInfo.path
    let extname = path.extname(tmpPath)
    let find = false
    for (let v of opt.extnames) {
        if (extname === v) {
            find = true
            break
        }
    }

    if (!find) {
        await removeAsync(tmpPath)
        throw new Error("invalid image type")
    }

    let newPath = `${opt.targetDir}/${opt.uuid}${path.extname(tmpPath)}`
    try {
        await renameAsync(tmpPath, newPath)
    } catch (e) {
        await removeAsync(tmpPath)
        throw e
    }
    return `${opt.uuid}${path.extname(tmpPath)}`
}
