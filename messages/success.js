class CustomSuccess {
    constructor(code = 2000, data = null) {
        this.code = code;
        this.data = data;
        this.english = successList[code];
    }
}
const successList = {
    2000: 'Success',
    2001: 'Email sent',
    2002: 'Welcome back',
    2003: 'Welcome to Novacar',
    2004: 'Profile updated',
    2005: 'Session terminated',
    2006: 'Upload successful',
}
module.exports.CustomSuccess = CustomSuccess;
