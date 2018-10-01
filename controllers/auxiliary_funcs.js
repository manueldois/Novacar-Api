module.exports.getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
module.exports.deepcopy = function (mainObj) {
    let objCopy1 = {}; // objCopy will store a copy of the mainObj
    let key;
    for (key in mainObj) {
        if (typeof mainObj[key] == 'object') {
            objCopy1[key] = arguments.callee(mainObj[key])
        } else {
            if ((mainObj[key] != null) && (mainObj[key] != undefined)) {
                objCopy1[key] = mainObj[key]; // copies each property to the objCopy object
            }
        }
    }
    return objCopy1;
}
module.exports.copy = function (mainObj) {
    return JSON.parse(JSON.stringify(mainObj))
}