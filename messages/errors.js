class CustomError {
    constructor(message, code = 4000, data = null) {
        this.message = message;
        this.code = code;
        this.data = data;
    }
}

const errorList = [
    // General named errors
    ['No such user', 4001],
    ['Invalid email', 4002],
    ['Invalid session token', 4003],
    ['Invalid user id', 4004],
    ['User not logged in', 4005],

    // Unamed errors used in-codes
    // Email code validation
    ['No active email validation code', 4006],
    ['Email validation code expired', 4007],
    ['Code revoked after 3 incorrect tries', 4008],
    ['Code incorrect, you have more $$ tries', 4009],

    // Signup
    ['This user already has an account', 4010],

    // Upload
    ['Upload failed', 4011],
    ['Invalid code', 4012]
]

module.exports.CustomError = CustomError
module.exports.genErrors = {
    no_such_user: new CustomError(...errorList[0]),
    invalid_email: new CustomError(...errorList[1]),
    invalid_token: new CustomError(...errorList[2]),
    invalid_uid: new CustomError(...errorList[3]),
    invalid_code: new CustomError(...errorList[11]),
    user_not_loggedin: new CustomError(...errorList[4]),

    upload_failed: new CustomError(...errorList[10])
}