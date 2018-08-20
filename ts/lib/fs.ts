import * as fs from "fs"
import * as  glob from "glob"

export function removeAsync(path: string) {
    return new Promise(resolve => fs.unlink(path, err => resolve()))
}

export function accessAsync(path: string, mode = fs.constants.F_OK) {
    return new Promise(resolve => fs.access(path, mode, err => {
        if (err)
            return resolve(false)
        return resolve(true)
    }))
}

export function mkdirAsync(path: string) {
    return new Promise((resolve, reject) => fs.mkdir(path, err => {
        if (err)
            return reject(err)
        return resolve()
    }))
}

export function renameAsync(oldPath: string, newPath: string) {
    return new Promise((resolve, reject) => fs.rename(oldPath, newPath, err => {
        if (err)
            return reject(err)
        return resolve()
    }))
}

export function readFileAsync(path: string) {
    return new Promise<Buffer>((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err)
                return reject(err)
            return resolve(data)
        })
    })
}

export function listFilesAsync(pattern: string, options?: glob.Options): Promise<string[]> {
    return new Promise((resolve, reject) => glob(pattern, options ? options : {}, (err, files) => {
        if (err)
            return reject(err)
        return resolve(files)
    }))
}
