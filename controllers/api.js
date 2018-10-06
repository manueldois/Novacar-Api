const debugAPI = require('debug')('api'),
    { validationResult } = require('express-validator/check'),
    mongoose = require('mongoose'),
    GoogleCloudStorage = require('@google-cloud/storage'),
    sharp = require('sharp'),
    fs = require('fs'),
    loggly = require('./logger').loggly,
    CError = require('../messages/error').CustomError


// NO CACHE ON SHARP
sharp.cache(false);

// GOOGLE STORAGE
var Gstorage = new GoogleCloudStorage({
    projectId: 'ionic-test-1-3eb9b',
    keyFilename: './config/google-ionic-service-keys.json'
})
const GSBucket = Gstorage.bucket('ionic-test-1-3eb9b.appspot.com');

const invalidChars = '+×÷=%_€£¥₩§!@#$/^&*()-:;,?`´^~\'\"\\|ºª<>{}[]°•○●□■♤♡◇♧☆▪¤《》¡¿'.split('') // Basic char blacklist
const invalidCharsNumbers = invalidChars.concat('1234567890'.split(''))


// apiHandler class gets initialized for each request
class apiHandler {

    // HTML ERRORS
    // 400 user error
    // 500 server error

    constructor(req, res) {
        this.req = req; // req contains req.id, generated by 'express-request-id';
        this.res = res;
        this.req_id = req.id;
        this.logs = [] // Group all logs throughtout the request life and send them all in the end (response, success, or error), along with response data
        this.hrstart = process.hrtime()
        this.logRequestLocal()
    }

    // Log everything
    logRequestLocal() {
        let reqlog = this.getReqLog()
        console.log(`\n ---------------- ${reqlog.method} ${reqlog.path} UID: ${this.req.params.uid} ----------------`)
        console.log('REQUEST: ', this.req.body)
    }
    logLogglySuccess(reqlog, reslog) {
        loggly.info('API response', { request: reqlog, response: reslog, exectime_ms: this.getExecms(), logs: this.logs })
    }
    logLogglyError(reqlog, errlog) {
        loggly.error('API error', { request: reqlog, errorlog: errlog, exectime_ms: this.getExecms(), logs: this.logs })
    }
    log(message, arg) {
        console.log(message, arg) // Log to console right away
        this.logs.push({ arg, message }) // Push to logs to send to loggly in the end
    }
    getExecms() {
        let hrdiff = process.hrtime(this.hrstart)
        let exectime_ms = Math.ceil(hrdiff[0] * 1000 + hrdiff[1] / 1000 / 1000)
        return exectime_ms
    }
    getReqLog() {
        let reqlog = {
            method: this.req.method,
            path: this.req.path,
            req_id: this.req.id,
            uid: this.req.params.uid,
            body: this.req.body
        }
        return reqlog
    }

    // Check for errors from express-validator
    checkValidation() {
        const result = validationResult(this.req);
        if (!result.isEmpty()) {
            let errors = result.array()
            // Push them all into logs
            this.logs.push({ errors: errors })
            // Pick the first and send to frontend
            let first_error = errors[0]
            this.error(first_error.msg)

            return true
        } else {
            return false
        }
    }


    // Three methods of closure - error 400 or 500 (send to frontend if it's custom error), success 200 (just an ok with possible response for frontend), respond 200 (send data and optional message)
    error(error) {
        console.log("API error: ", error)

        // Send to frontend on response and log to logly on errorLog
        let response;

        if (error instanceof Error) {
            // Is internal error
            
            response = {
                success: false,
                error: {
                    code: '5000',
                    data: null,
                    english: 'internal server error'
                },
                type: 'internal error',
                req_id: this.req_id
            }
            this.res.status(500).json(response)

            // Log to logly
            let reqlog = this.getReqLog();
            let errlog = {
                message: error.message,
                stack: error.stack,
                code: 5000,
                type: 'internal server error'
            }
            this.logLogglyError(reqlog, errlog)
        }

        if (error instanceof CError) {
            // Is custom error
            response = {
                success: false,
                error: error,
                req_id: this.req_id
            }
            this.res.status(400).json(response)

            // Log to logly
            let reqlog = this.getReqLog();
            let errlog = {
                message: error.english,
                code: error.code,
                data: error.data,
                type: error.type
            }
            this.logLogglyError(reqlog, errlog)
        }


    }
    success(message = null) {
        let reqlog = this.getReqLog()
        let reslog = {
            type: 'success',
            success: true,
            message
        }
        console.log(`SUCCESS: `, message)
        this.logLogglySuccess(reqlog, reslog)

        this.res.status(200).json({
            type: 'success',
            success: true,
            message,
            req_id: this.req_id
        })
    }
    respond(data, message = null) {
        let reqlog = this.getReqLog()
        let reslog = {
            type: 'response',
            success: true,
            data: data,
            message: message
        }
        this.logLogglySuccess(reqlog, reslog)
        console.log(`RESPONSE: `, data, message)

        this.res.status(200).json({
            type: 'response',
            success: true,
            message,
            data,
            req_id: this.req_id
        })
    }
}

module.exports.apiHandler = apiHandler
module.exports.initApiHandler = function (req, res, next) {
    const api = new apiHandler(req, res)
    req.api = api;
    next()
}
module.exports.checkMongoID = uid => {
    if (mongoose.Types.ObjectId.isValid(uid)) {
        return true
    } else {
        return false
    }
}

module.exports.cleanString = (string, clean_numbers = false) => {
    const blacklist = clean_numbers ? invalidCharsNumbers : invalidChars
    const filtered = string.split('').filter(char => {
        return !blacklist.includes(char)
    })
    return filtered.join('').trim()
}

function uploadToGS(localFileLocation) {
    return GSBucket.upload(localFileLocation, { public: true }).then(file => {
        return file[0].metadata.mediaLink
    })
}
module.exports.uploadToGS = uploadToGS
module.exports.uploadAvatar = async (file) => {
    const filepath = file.path
    const filename = file.filename.split('.')[0]

    // Resize
    let p_resize1 = sharp(filepath).resize(600, 600).toFile(`uploads/resized/${filename}-lg.jpeg`)
    let p_resize2 = sharp(filepath).resize(250, 250).toFile(`uploads/resized/${filename}-md.jpeg`)
    let p_resize3 = sharp(filepath).resize(80, 80).toFile(`uploads/resized/${filename}-sm.jpeg`)

    await Promise.all([p_resize1, p_resize2, p_resize3])

    // Upload to Gstorage
    let p_store1 = uploadToGS(`./uploads/resized/${filename}-lg.jpeg`)
    let p_store2 = uploadToGS(`./uploads/resized/${filename}-md.jpeg`)
    let p_store3 = uploadToGS(`./uploads/resized/${filename}-sm.jpeg`)

    let urls = await Promise.all([p_store1, p_store2, p_store3])
    urls = {
        sm: urls[2],
        md: urls[1],
        lg: urls[0]
    }
    console.log("URLS: ", urls)

    // Delete photos after upload

    function deleteCB(err) {
        if (err) {
            throw err
        }
    }
    fs.unlink(filepath, deleteCB)
    fs.unlink(`./uploads/resized/${filename}-lg.jpeg`, deleteCB)
    fs.unlink(`./uploads/resized/${filename}-md.jpeg`, deleteCB)
    fs.unlink(`./uploads/resized/${filename}-sm.jpeg`, deleteCB)

    return urls
}
