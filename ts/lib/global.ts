import { Application } from "express"
import { Sequelize } from "sequelize"

let app: Application
export function setApplication(appp: Application) {
    app = appp
}

export function getModel(name: string) {
    let seqz = app.locals.sequelize as Sequelize
    return seqz.model(name)
}


