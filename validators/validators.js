const { body, check, validationResult, oneOf } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter'),
    apiHandler = require('../controllers/api');

module.exports.requestemailcode = [check('email').isEmail()]

module.exports.verifyemailcode = [check('email').isEmail(), check('code').isNumeric()]

module.exports.signup = [sanitizeBody('name').customSanitizer(apiHandler.cleanString, true), check('name').isLength({ min: 3, max: 30 }), check('campus').isNumeric().isLength({ max: 4 }), check('phone_number').isMobilePhone("pt-PT")]

module.exports.updateaccount = oneOf([check('avatar_url.*').isURL(), check('campus').isNumeric().isLength({ min: 3, max: 30 }), check('phone_number').isMobilePhone("pt-PT")])