const winston = require('winston'),
    { Loggly } = require('winston-loggly-bulk'),
    keys = require('../config/keys'),
    Transport = require('winston-transport');


// LOG ALL API REQUESTS AND REPONSES TO LOGGLY WITH WINSTON
// WINSTON-LOGGLY
const formatToLoggly = winston.format.printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${JSON.stringify(info.message)}: ${JSON.stringify(info.metadata)}`;
});
const loggly = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'api logger' }),
        winston.format.timestamp(),
        formatToLoggly
    ),
    transports: [new winston.transports.File({ filename: 'logs.txt' }), new Loggly({
        token: keys.loggly.token,
        subdomain: keys.loggly.subdomain,
        tags: ["Winston-NodeJS"],
        json: true
    })]
});



function logline(){
    console.log('------------------------')
}


module.exports.loggly = loggly
module.exports.logline = logline