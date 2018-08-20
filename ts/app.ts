///<reference path="../typings/index.d.ts" />
import logger = require('morgan')
import express = require('express')
import cookieParser = require('cookie-parser')
import bodyParser = require('body-parser')
import { initResource, initRouter } from "./init"
import winston = require("winston")
const path=require("path")
const app = express()
module.exports = app

async function main() {
 await initResource(app)

  app.use(logger('dev'))
  app.use(cookieParser())
  app.use(express.static(path.join(__dirname,'../public')));
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  

  // 跨域
  app.all('*', function (req: any, res: any, next: any) {
    res.header("Access-Control-Allow-Origin", "*") // TODO
    res.header("Access-Control-Allow-Headers", "X-Requested-With,token,uuid,content-type")
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS,PATCH")
    next()
  })

  await initRouter(app)

  app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.locals.message = '';
    let err = new Error('Not Found')
    next(err)
  })

  app.use(function (err, req, res, next) {
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    res.status(err.status || 500)
    res.end()
  })

  process.on("uncaughtException", (err: Error) => {
    winston.error("uncaughtException", err.stack)
  })
}

main()