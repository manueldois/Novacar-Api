class CustomSuccess {
    constructor(message, code = 2000, data = null) {
        this.message = message;
        this.code = code;
        this.data = data;
    }
}

const successList = [
    ['Email sent', 2001],
    ['Welcome back', 2002],
    ['Welcome to Novacar', 2003],
    ['Profile updated', 2004],
    ['Session terminated', 2005],

    // Upload
    ['Upload successful', 2006]
]
module.exports.CustomSuccess = CustomSuccess;
module.exports.genSuccess = {
    upload_success: new CustomSuccess(...successList[5])
}