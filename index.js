import express from 'express';
import QRCode from 'easyqrcodejs-nodejs';
import path from 'path';
//const TemplateHandler from "easy-template-x");
import { MimeType, TemplateHandler } from 'easy-template-x';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Server
app.use('/documentForMe', express.static("./report")); // images and css need them
app.use('/', express.static("./report")); // images and css need them

var PORT = 3000;
var secret = "thisisthebiggestsecretonearth8719324912873";
var server = "http://evocare.toh.info";

var router = express.Router();

import fs from 'fs';
// html generation 
import pug from 'pug';
app.set('view engine', 'pug');

// CryptoPart
import CryptoJS from "crypto-js";

function cryptMessage(clearMessage) {
    var relevantData = {
        "fullName": clearMessage.firstName + " " + clearMessage.fullName,
        "dateOfBirth": clearMessage.dateOfBirth,
        "testDate": clearMessage.testDate
    }
    return CryptoJS.AES.encrypt(JSON.stringify(relevantData), secret).toString();
}

function encryptMessage(cryptedMessage) {
    var bytes = CryptoJS.AES.decrypt(cryptedMessage, secret);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// BarCode Creator
function createQRCode(encryptedData) {
    var options = {
        text: server + ":" + PORT + "/verify?message=" + encryptedData
    };
    return new QRCode(options);
}

//ADDONs
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

async function generateQRCodeAndSAVE(inputClear) {
    var cryptData = cryptMessage(inputClear);
    console.log("CryptedData=");
    console.log(cryptData);
    var qrcode = createQRCode(cryptData);
    return saveQRCodeAsImage(qrcode);
}

app.get('/verify', function (req, res) {
    res.sendFile("/verification/index.html", { root: "." });
});

app.post("/docRenderedWithQRCODE2", async (req, res) => {
    var inputRaw = req.body;
    await generateQRCodeAndSAVE(inputRaw);
    var dateOfBirth = new Date(inputRaw.birthday);
    var dataOfTestString = new Date(inputRaw.dateOfTest);
    var dateOfTestEntnahme = new Date(dataOfTestString);
    dateOfTestEntnahme.setHours(dateOfTestEntnahme.getHours() - 27);
    dateOfTestEntnahme.setMinutes(dateOfTestEntnahme.getMinutes() - 12);
    var sexOfPersonData = inputRaw.isMale ? "M/M" : "F/F";

    // 1. read template file
    const templateFile = fs.readFileSync("./vorlage/vorlage.docx")

    // 2. process the template
    const data = {
        posts: [
            {
                image: {
                    _type: "image",
                    source: fs.readFileSync("./report/ri_5.png"),
                    format: MimeType.Png,
                    width: 25,
                    height: 25
                },
                fullName: inputRaw.firstName + " " + inputRaw.Name,
                dateOfBirth: dateOfBirth.toLocaleDateString('de-DE'),
                sexOfPerson: sexOfPersonData,
                adressOfPerson: inputRaw.adress, // straße + hausnummer
                numberOfPerson: inputRaw.phone,
                dateOfTest: dataOfTestString.toLocaleString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit' }),
                dateOfTest2: dataOfTestString.toLocaleString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit' }),
                dateOfTestMinusOne: dateOfTestEntnahme.toLocaleString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit' }),
                randomNumber: getRandomArbitrary(1123111, 1999111),
                cityOfPerson: inputRaw.city
            },
        ]
    };

    const handler = new TemplateHandler();
    const doc = await handler.process(templateFile, data);

    // 3. save output
    await fs.writeFileSync('./randomize.docx', doc);
    res.sendStatus(200);
})

app.get('/secretPage', function (req, res) {
    res.sendFile("/docMethod/index.html", { root: "." });
});

app.post('/validateData', function (request, res) {
    try {
        var message = request.body.message.replace(/ /g, '+');
        encryptedData = encryptMessage(message);
        res.status(200).send(encryptedData);
    } catch (error) {
        res.status(404).send();
    }
});

app.listen(PORT, function () {
    console.log('Server is running on PORT:', PORT);
});

function saveQRCodeAsImage(qrCodeObject) {
    return new Promise(resolve => {
        qrCodeObject.saveImage({
            path: './report/ri_5.png' // file path
        }).then(data => {
            resolve('resolved');
        });
    });
}
