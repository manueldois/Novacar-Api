class CustomError {
    constructor(code = 4000, data = null) {
        this.code = code;
        this.data = data;
        this.message = errorList[code];
    }
}

const errorList = {
    4001: 'No such user',
    4002: 'Invalid email',
    4003: 'Invalid access token',
    4004: 'Invalid user id',
    4005: 'User not logged in',
    4006: 'No active email validation code',
    4007: 'Email validation code expired',
    4008: 'Code revoked after 3 incorrect tries',
    4009: 'Code incorrect, you have more $$ tries',
    4010: 'This user already has an account',
    4011: 'Upload failed',
    4012: 'Invalid code',
    4013: 'Name must be longer than 3 characters and shorter than 30',
    4014: 'Invalid phone number',
    4015: 'Campus code must be 4 characters'
}
module.exports.CustomError = CustomError
