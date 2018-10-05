const express = require('express'),
    cors = require('cors'),
    jwt = require('jsonwebtoken'),
    bodyParser = require('body-parser'),
    crypto = require('crypto'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    randomstring = require("randomstring"),
    addRequestId = require('express-request-id')(),
    util = require('util'),
    expressSanitizer = require('express-sanitizer'),
    { body, check, validationResult, oneOf } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter'),
    Promise = require('bluebird'),
    request = require('request'),
    fs = require('fs'),
    multer = require('multer'),
    GoogleCloudStorage = require('@google-cloud/storage'),
    sharp = require('sharp'),
    cachegoose = require('cachegoose'),
    OneSignal = require('onesignal-node'),
    winston = require('winston'),
    { Loggly } = require('winston-loggly-bulk'),
    keys = require('./config/keys'),
    loggly = require('./controllers/logger').loggly,
    logline = require('./controllers/logger').logline,
    CustomError = require('./messages/errors').CustomError,
    genError = require('./messages/errors').genErrors,
    CustomSuccess = require('./messages/messages').CustomSuccess,
    genSuccess = require('./messages/messages').genSuccess;


// AUXILIARY FUNCS
const auxfuncs = require('./controllers/auxiliary_funcs')
const apiHandler = require('./controllers/api.js')


// DEBUG
let createDebug = require('debug')
createDebug.formatters.c = (v) => {
    console.log(v)
    return true
}
const debugAPI = createDebug('api')

// MONGOOSE
mongoose.connect(keys.mongoDBURL, { useNewUrlParser: true }).then(() => {
    console.log('Mongo connected')
}, err => {
    console.log("Mongo connection error: ", err)
    process.exit()
});

// CACHEGOOSE
cachegoose(mongoose);

// ONESIGNAL
var oneSignalClient = new OneSignal.Client(keys.oneSignal);

// MULTER
var multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, `avatar-${req.uid}.jpeg`)
    }
})
var upload = multer({ storage: multerStorage })







// MODELS
var User = require('./models/user')


// VALIDATORS
const validators = require('./validators/validators')

// APP
const app = express()
app.use(addRequestId)
app.use(expressSanitizer());
app.use(cors())
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
    // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
    verify: function (req, res, buf) {
        var url = req.originalUrl;
        // console.log("target url: ",url)
        if (url.startsWith('/api/webhookstripe')) {
            req.rawBody = buf.toString()
        }
    }
}));
app.use(apiHandler.initApiHandler) // add api object to req.api to use many helper functions



// TESTING FUNCTIONS
function testing() {
    function testJWT() {
        const payload = {
            name: "Manuel",
            age: 30,
            likes: {
                dance: true,
                swimming: false
            }
        }
        User.findOne({ email: 'manuel@gmail.com' }).lean().then(user => {
            const secret = user.secret
            console.log("Secret: ", secret)
            jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '2m' }, (err, token) => {
                if (err) console.log(err)
                console.log("Token: ", token)
            })
        })
    }
    async function testMongoose() {
        const user = await User.findById('5b748c31e3ad3a23e42f1c4c')
        console.log("Found user: ", user)
        console.log("User id: ", user.id)
        console.log("is valid: ", mongoose.Types.ObjectId.isValid('5b748c31e3ad3a23e42f1c4c'))
    }
    function testMoment() {
        console.log("Now: ", moment().toISOString())
        var a = moment();
        var b = moment().add(1, 'hour').toISOString();
        console.log("A: ", a, " B: ", b)
        diff = a.diff(b, 'minutes', false);
        console.log("Diff: ", diff)
    }
    function testCharBlacklist() {
        const string = 'Manuel@£§€{[]!#$} Luís Si<%#%/)=[{}?lva'
        console.log(apiHandler.cleanString(string))
    }
    function testFS() {
        fs.writeFile('input.txt', 'Simply Easy Learning!', function (err) {
            if (err) {
                return console.error(err);
            }

            console.log("Data written successfully!");
            console.log("Let's read newly written data");
            fs.readFile('input.txt', function (err, data) {
                if (err) {
                    return console.error(err);
                }
                console.log("Asynchronous read: " + data.toString());
            });
        });
    }
    function testRequest() {
        request('https://picsum.photos/300/300/?random', doneRequest).pipe(fs.createWriteStream('doodle.png'))
        function doneRequest(err, req) {
            console.log("Done request")
            if (err) {
                console.log("Request error: ", err)
                return
            }
        }
    }
    function testGS() {
        console.log("testGS ran")
        let localFileLocation = './doodle.png'
        GSBucket.upload(localFileLocation, { public: true }).then(file => {
            console.log("File saved: ", file[0])
            console.log("File URL: ", file[0].metadata.mediaLink)
        }).catch(err => {
            console.log("Upload error: ", err)
        })

        // Gstorage
        // .bucket(GSBucket)
        // .getFiles()
        // .then(results => {
        //   const files = results[0];

        //   console.log('Files:');
        //   files.forEach(file => {
        //     console.log(file.name);
        //   });
        // })
        // .catch(err => {
        //   console.error('ERROR:', err);
        // });

    }
    function testURLuploadtoGS() {
        request('https://picsum.photos/300/300/?random', doneRequest).pipe(fs.createWriteStream('file.png'))
        function doneRequest(err, req) {
            console.log("Done request")
            if (err) {
                console.log("Request error: ", err)
                return
            }
            uploadToGS('./file.png')

        }
    }
    function uploadToGS(localFileLocation) {
        return GSBucket.upload(localFileLocation, { public: true }).then(file => {
            return file[0].metadata.mediaLink
        })
    }
    function testResize() {
        sharp('uploads/avatar-1534968089307.jpeg')
            .resize(300, 200)
            .toFile('output.jpg', function (err) {
                console.log("Resize complete. err: ", err)
                // output.jpg is a 300 pixels wide and 200 pixels high image
                // containing a scaled and cropped version of input.jpg
            });
    }
    function testOnesignal() {
        var notificationeveryone = new OneSignal.Notification({
            headings: {
                en: "Header",
                pt: "Titulo"
            },
            contents: {
                en: "Test notification",
                pt: "Notificação de teste"
            },
            data: {
                apples: 120,
                cars: ["Ferrari"]
            },
            buttons: [{ "id": "id1", "text": "button1", "icon": "ic_menu_share" }, { "id": "id2", "text": "button2", "icon": "ic_menu_send" }],

            included_segments: ["Active Users", "Inactive Users"]
        });

        var notificationsingular = new OneSignal.Notification({
            headings: {
                en: 'Just 4u',
                pt: 'Só para ti'
            },
            contents: {
                en: 'must have english content lol ok',
                pt: 'fizemos alguma coisa <3'
            },
            include_player_ids: ['2b82d155-e57f-480f-9b40-6b5bfa50068b']
        })

        oneSignalClient.sendNotification(notificationsingular, function (err, httpResponse, data) {
            debugAPI("Notification sent")
            if (err) {
                debugAPI("ERR: %c", err)
            } else {
                debugAPI("Data: %c", data)
                debugAPI("httpResponse: %c", httpResponse)
            }
        });
    }
    function testDebug() {
        debugAPI("This is an object: %c", { apples: 10, vinegar: 'acid' })
    }
}


// MIDDLEWARE
async function verifyJWT(req, res, next) {
    // Gets user id and jwt , decodes jwt
    // If decoding failed, end chain
    // Uses cachegoose for fast access to user secret
    // Does NOT return user
    const api = req.api

    try {
        // Validation error
        if (api.checkValidation()) return

        // Get data
        const token = req.headers.authorization.replace('Bearer ', '');
        const uid = req.params.uid;

        // JWT and UID validation
        if (!token || typeof token != 'string') {
            throw genError.invalid_token;
        }
        if (!apiHandler.checkMongoID(uid)) {
            throw genError.invalid_uid;
        }


        // Logic
        let user = await User.findById(uid, 'secret is_loggedin').lean().cache(0, `userauth-${uid}`)
        if (!user) { 
            throw genError.no_such_user;
        }
        if (!user.is_loggedin) { 
            throw genError.user_not_loggedin;
        }
        const key = user.secret
        if (key == null) {
            throw genError.invalid_token;
        }

        // TODO set maxAge on token
        jwt.verify(token, key, { algorithms: ['HS256'] }, (err, payload) => {
            if (err) {
                throw genError.invalid_token;
            } else {
                req.uid = uid
                req.jwt_data = payload
                debugAPI("End verifyJWT")
                next()
            }
        })

    } catch (error) {
        api.error(error)
        return false
    }
}



// ROUTES


app.post('/api/requestemailcode', validators.requestemailcode, async (req, res) => {
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return

        // Get body data
        const email = req.body.email.trim().toLowerCase();

        // Logic
        let user = await User.findOne({ email: email })
        const code = auxfuncs.getRandomInt(100000, 999999)
        if (user) { // User is signing on a new device, or token expired
            // Update user. secret remains valid until code is verified
            user.email_verification.code = code;
            user.email_verification.code_sent_date = moment().toISOString();
            user.email_verification.number_of_attempts = 0;
            user.email_verification.is_verified = false;
            user.is_loggedin = false;
            user.save()

            // Send code by email
            await sendEmailCode(code, email)
            api.success(new CustomSuccess('Email sent', 2001))

        } else { // New user
            // Make new temp user
            let temp_user = new User({
                email: email,
                email_verification: {
                    code: code,
                    number_of_attempts: 0,
                }
            })
            temp_user.save()

            // Send code by email
            await sendEmailCode(code, email)
            api.success(new CustomSuccess('Email sent', 2001))
        }

        function sendEmailCode(code, email) {
            console.log("Sending code " + code + " to " + email)
            return Promise.resolve()
        }

    } catch (error) {
        api.error(error)
    }
})

app.post('/api/verifyemailcode', validators.verifyemailcode, async (req, res) => {
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return

        // Get body data
        const email = req.body.email
        const code = req.body.code

        // Logic
        let user = await User.findOne({ email: email }, 'email email_verification')
        if (!user) { throw genError.no_such_user }
        if (user.email_verification.code == 0) throw new CustomError('No active email validation code', 4006)

        if (codeIsExpired(user.toObject())) {
            user.email_verification.code = 0;
            user.save();
            throw new CustomError('Email validation code expired', 4007)
        }
        if (user.email_verification.code != code) {
            user.email_verification.number_of_attempts++;
            if (user.email_verification.number_of_attempts > 2) {
                user.email_verification.code = 0;
                user.save()
                throw new CustomError('Code revoked after 3 incorrect tries', 4008)
            } else {
                user.save()
                throw new CustomError('Code incorrect, you have more $$ tries', 4009, 3 - user.email_verification.number_of_attempts)
            }

        }

        // If everything ok
        // Generate part two of shared secret
        const secret_2 = randomstring.generate(42) // Send to client
        const secret = code + secret_2 // Save to DB

        user.secret = secret;
        user.email_verification.code = 0;
        user.email_verification.is_verified = true;
        user.is_loggedin = true;
        user.save()

        // Clear userauth-${uid} from cachegoose
        cachegoose.clearCache(`userauth-${user.uid}`);

        if (user.is_complete) {
            // User already has a fb account with its mongo uid
            api.respond({
                is_complete: true,
                uid: user.id, // Asign user id from mongo, used for the rest of the API instead of email
                secret_2, // New shared secret
            }, new CustomSuccess('Welcome back $$', 2002, user.email))
            return
        } else {
            // New user, make firebase account and return token
            api.respond({
                is_complete: false,
                uid: user.id,
                secret_2
            }, new CustomSuccess('Welcome to Novacar $$', 2003, user.email))
            return
        }


        function codeIsExpired(user) {
            const now = moment();
            const code_sent_date = user.email_verification.code_sent_date;
            const diff = now.diff(code_sent_date, 'minutes')
            if (diff >= 15) {
                return true  // code is expired
            } else {
                return false // code is not expired
            }
        }

    } catch (error) {
        api.error(error)
    }
})

app.post('/api/user/:uid/signup', validators.signup, verifyJWT, async (req, res) => {
    // Minimum info to be a user
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return


        // Get body data
        const { name, phone_number, campus } = req.body
        const uid = req.uid
        console.log("Got signup: ", name, phone_number, campus)

        // Get user
        let user = await User.findById(uid, 'is_complete')

        // If user has already completed signup, reject this
        if (user.is_complete) {
            throw new CustomError('This user already has an account', 4010)
        }

        // Get user device data TODO

        // Update user
        user.name = name
        user.campus = campus
        user.is_complete = true
        user.phone_number = phone_number
        await user.save()


        api.success(new CustomSuccess('Welcome to Novacar $$', 2003, user.name))
    } catch (error) {
        api.error(error)
    }
})

app.post('/api/user/:uid/updateaccount', validators.updateaccount, verifyJWT, async (req, res) => {
    // User can update avatar_url, campus, phone_number
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return

        // Get body data
        const { avatar_url, campus, phone_number } = req.body
        const uid = req.uid
        // Check avatarurl is firebase link

        let user = await User.findById(uid, '')

        // Update user
        if (avatar_url) {
            user.avatar_url = avatar_url
        }
        if (campus) {
            user.campus = campus
        }
        if (phone_number) {
            user.phone_number = phone_number
        }
        await user.save()
        api.success(new CustomSuccess('Profile updated', 2004))

    } catch (error) {
        api.error(error)
    }
})

app.post('/api/user/:uid/logout', verifyJWT, async (req, res) => {
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return

        // Get data
        const uid = req.uid

        // Get user
        let user = await User.findById(uid, '')

        // Clear JWT secret and set is_loggedin to false
        user.secret = null;
        user.is_loggedin = false;
        await user.save()

        // Clear userauth-${uid} from cachegoose
        cachegoose.clearCache(`userauth-${uid}`);

        api.success(new CustomSuccess('Session terminated', 2005))

    } catch (error) {
        api.error(error)
    }
})

app.post('/api/user/:uid/avatar', verifyJWT, upload.single('file'), async (req, res) => {
    // Get profile pictures from client, resize in 3 and upload to Gstorage
    // picture can be an upload from client or facebook pic url
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return

        // Logic
        let file
        if (req.file) { // file uploaded from client
            file = req.file
        } else {
            let facebook_avatar_url = req.body.facebook_avatar_url
            if (facebook_avatar_url) {
                await new Promise((resolve, reject) => {
                    request(facebook_avatar_url, doneRequest).pipe(fs.createWriteStream(`./uploads/avatar-${req.uid}.jpeg`))
                    function doneRequest(err, download) {
                        if (err) {
                            throw err
                        }
                        file = {
                            path: `./uploads/avatar-${req.uid}.jpeg`,
                            filename: `avatar-${req.uid}.jpeg`
                        }
                        resolve()
                    }
                })
            } else {
                throw genError.upload_failed;
            }
        }


        // Upload and get google storage urls back
        const urls = await apiHandler.uploadAvatar(file)
        // Save to user profile
        const saved = await User.findByIdAndUpdate(req.uid, { avatar_url: urls })

        api.respond({ avatar_urls: urls }, genSuccess.upload_success )

    } catch (error) {
        api.error(error)
    }
})

app.get('/api/user/:uid/route', verifyJWT, async (req, res) => {
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return

        // Get body data
        const uid = req.uid

        let options = {
            origin: { placeId: "ChIJuxJuC17MHg0RQ0d0gvPaYb8" },
            destination: { placeId: "ChIJKdAFmPXOHg0R-kf1ztIKAJI" },
            travelMode: 'DRIVING',
            waypoints: [{ location: { placeId: "ChIJ_x2ptsfNHg0Rg4rySJ1SDmQ" }, stopover: false }]
        }

        api.respond(options)


    } catch (error) {
        api.error(error)
    }
})



// TEST ROUTES
app.post('/test/user/:uid/verifytoken', verifyJWT, async (req, res) => {
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return
        api.log('Verified token for uid: ', req.params.uid)
        api.respond({ jwt_data: req.jwt_data })


    } catch (error) {
        api.error(error)
    }
})
app.post('/test/user/:uid/error', check('email').isEmail(), async (req, res) => {
    const api = req.api
    try {
        // Validation error
        if (api.checkValidation()) return

        // Get body data

        // Custom error
        if (0) {
            console.log("Custom error")
            const user = await User.findOne({ email: 'noemail' })
            if (user) {

            } else {
                throw genError.no_such_user
                return
            }
        }

        // Server error
        if (1) {
            JSON.parse(nothing)
        }

        // Success
        if (0) {
            api.success('Did something well today')
        }

        // Respond with data
        if (0) {
            api.respond({
                apples: 10,
                email: 'manuel@gmail.com',
                colors: ['red', 'cyan', 'yellow']
            }, 'got apples successfully')
        }
    } catch (error) {
        api.error(error)
    }
})



// API MODEL
if (0) {
    app.post('', [], async (req, res) => {
        const api = req.api
        try {
            // Validation error
            if (api.checkValidation()) return

            // Get body data


        } catch (error) {
            api.error(error)
        }
    })
}


app.listen(3000, () => console.log('Server started on port 3000'));





