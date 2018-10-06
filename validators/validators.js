const { body, check, validationResult, oneOf } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter'),
    apiHandler = require('../controllers/api'),
    CError = require('../messages/error').CustomError

module.exports.requestemailcode = [check('email').isEmail().withMessage(new CError(4002))]

module.exports.verifyemailcode = [check('email').isEmail().withMessage(new CError(4002)), check('code').isNumeric().withMessage(new CError(4012))]

module.exports.signup = [sanitizeBody('name').customSanitizer(apiHandler.cleanString, true), check('name').isLength({ min: 3, max: 30 }).withMessage(new CError(4013)), check('campus').isNumeric().isLength(3).withMessage(new CError(4015)), check('phone_number').isMobilePhone("pt-PT").withMessage(new CError(4014))]

module.exports.updateaccount = oneOf([check('avatar_url.*').isURL(), check('campus').isNumeric().isLength(3).withMessage(new CError(4015)), check('phone_number').isMobilePhone("pt-PT").withMessage(new CError(4014))])