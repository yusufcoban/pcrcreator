var express = require('express');
const QRCode = require('easyqrcodejs-nodejs');
const path = require('path');
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
var PORT = 3000;
var secret = "thisisthebiggestsecretonearth8719324912873";
var server = "http://ecocare.hopto.org";
const PizZip = require("pizzip");
var fs = require('fs');
var pdf = require('html-pdf');
var options = { format: 'Letter' };
const Docxtemplater = require("docxtemplater");
const Stream = require("stream").Transform;
const content = fs.readFileSync(__dirname + "/docMethod/vorlage.docx");
var JSZip = require('JSZip');
const TemplateHandler = require('easy-template-x');


// html generation 
const pug = require('pug');
app.set('view engine', 'pug');

// CryptoPart
var CryptoJS = require("crypto-js");

function cryptMessage(clearMessage) {
    return CryptoJS.AES.encrypt(clearMessage, secret).toString();
}

function encryptMessage(cryptedMessage) {
    var bytes = CryptoJS.AES.decrypt(cryptedMessage, secret);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// BarCode Creator
function createQRCode(encryptedData) {
    var options = {
        text: server + ":" + PORT + "/verificationQRCode?message=" + encryptedData
    };
    return new QRCode(options);
}

//ADDONs
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

async function generateQRCodeAndSAVE(inputClear) {
    var cryptData = cryptMessage(JSON.stringify(inputClear));
    console.log("CryptedData=");
    console.log(cryptData);
    var qrcode = createQRCode(cryptData);
    return saveQRCodeAsImage(qrcode);
}

// Server
app.use('/documentForMe', express.static(__dirname + "/report")); // images and css need them
app.use('/', express.static(__dirname + "/report")); // images and css need them

app.get('/verificationQRCode', function (req, res) {
    res.sendFile(__dirname + "/verification/index.html");
});

app.post('/getDocumentAsDoc', async (req, res) => {
    var inputRaw = req.body;
    await generateQRCodeAndSAVE(inputRaw);
    var zip = new PizZip(content);
    var doc = new Docxtemplater(zip);
    var dateOfBirth = new Date(inputRaw.birthday);
    var dataOfTestString = new Date(inputRaw.dateOfTest);
    var dateOfTestEntnahme = new Date(dataOfTestString);
    dateOfTestEntnahme.setHours(dateOfTestEntnahme.getHours() - 27);
    dateOfTestEntnahme.setMinutes(dateOfTestEntnahme.getMinutes() - 12);
    var sexOfPersonData = inputRaw.isMale ? "M/M" : "F/F";
    //{ image: __dirname + "report/ri_5.png" }
    doc.render({
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
    });

    var buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
    });
    await fs.writeFileSync(__dirname + "/docMethod/generated.docx", buffer);
    res.sendFile(__dirname + "/docMethod/generated.docx");
});

app.post("/docRenderedWithQRCODE", async (req, res) => {
    var inputRaw = req.body;
    await generateQRCodeAndSAVE(inputRaw);
    /* var zip = new PizZip(content);
     var doc = new Docxtemplater(zip);*/
    var dateOfBirth = new Date(inputRaw.birthday);
    var dataOfTestString = new Date(inputRaw.dateOfTest);
    var dateOfTestEntnahme = new Date(dataOfTestString);
    dateOfTestEntnahme.setHours(dateOfTestEntnahme.getHours() - 27);
    dateOfTestEntnahme.setMinutes(dateOfTestEntnahme.getMinutes() - 12);
    var sexOfPersonData = inputRaw.isMale ? "M/M" : "F/F";
    var ImageModule = require('open-docxtemplater-image-module');

    //Below the options that will be passed to ImageModule instance
    var opts = {}
    opts.centered = false; //Set to true to always center images
    opts.fileType = "docx"; //Or pptx

    //Pass your image loader
    opts.getImage = function (tagValue, tagName) {
        //tagValue is 'examples/image.png'
        //tagName is 'image'
        return fs.readFileSync(tagValue);
    }

    //Pass the function that return image size
    opts.getSize = function (img, tagValue, tagName) {
        //img is the image returned by opts.getImage()
        //tagValue is 'examples/image.png'
        //tagName is 'image'
        //tip: you can use node module 'image-size' here
        return [150, 150];
    }

    var imageModule = new ImageModule(opts);
    var zip = new PizZip(content);
    var doc = new Docxtemplater(zip)
        .attachModule(imageModule)
        .setData({ image: '__dirname + "/report/ri_5.png"' })
        .render({
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
        });

    var buffer = doc
        .getZip()
        .generate({ type: "nodebuffer" });

    fs.writeFile("test.docx", buffer);

})

app.post("/docRenderedWithQRCODE2", async (req, res) => {
    var inputRaw = req.body;
    await generateQRCodeAndSAVE(inputRaw);
    /* var zip = new PizZip(content);
     var doc = new Docxtemplater(zip);*/
    var dateOfBirth = new Date(inputRaw.birthday);
    var dataOfTestString = new Date(inputRaw.dateOfTest);
    var dateOfTestEntnahme = new Date(dataOfTestString);
    dateOfTestEntnahme.setHours(dateOfTestEntnahme.getHours() - 27);
    dateOfTestEntnahme.setMinutes(dateOfTestEntnahme.getMinutes() - 12);
    var sexOfPersonData = inputRaw.isMale ? "M/M" : "F/F";



    var doc = new Docxtemplater(zip)
        .attachModule(imageModule)
        .setData({ image: '__dirname + "/report/ri_5.png"' })
        .render({
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
        });
    // 1. read template file
    const templateFile = fs.readFileSync(__dirname + "/docMethod/vorlage.docx")

    // 2. process the template
    const data = {
        posts: [
            {
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
                image: {
                    _type: "image",
                    source: fs.readFileSync("hero.png"),
                    format: MimeType.Png,
                    width: 200,
                    height: 200
                }
            },

        ]
    };

    const handler = new TemplateHandler();
    const doc = await handler.process(templateFile, data);

    // 3. save output
    fs.writeFileSync('myTemplate - output.docx', doc);
    var buffer = doc
        .getZip()
        .generate({ type: "nodebuffer" });

    fs.writeFile("test.docx", buffer);

})

function buffer() {
    import * as fs from 'fs';



}
app.get('/docMethod', function (req, res) {
    res.sendFile(__dirname + "/docMethod/index.html");
});

app.get('/fetchQrCode', function (req, res) {
    res.sendFile(__dirname + "/report/ri_5.png");
});

app.post("/generateQRCODEONLY", async (req, res) => {
    var data = req.body;
    await generateQRCodeAndSAVE(data);
    return res.send('QRCode generated.');
});

app.post('/documentRendered', async (req, res) => {
    var data = req.body;
    await generateQRCodeAndSAVE(data);
    var sexOfPersonData;
    var dateOfBirth = new Date(data.dateOfBirth);
    var dataOfTestString = new Date(data.testDate);
    var dateOfTestEntnahme = new Date(dataOfTestString);
    dateOfTestEntnahme.setHours(dateOfTestEntnahme.getHours() - 27);
    dateOfTestEntnahme.setMinutes(dateOfTestEntnahme.getMinutes() - 12);

    if (data.isMale) {
        sexOfPersonData = "M/M";
    } else {
        sexOfPersonData = "F/F";
    }
    res.render(__dirname + "/report/index_pug.pug", {
        fullName: data.fullName,
        dateOfBirth: dateOfBirth.toLocaleDateString('de-DE'),
        sexOfPerson: sexOfPersonData,
        adressOfPerson: data.adressOfPerson, // straße + hausnummer
        numberOfPerson: data.numberOfPerson,
        dateOfTest: dataOfTestString.toLocaleString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit' }),
        dateOfTestMinusOne: dateOfTestEntnahme.toLocaleString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit' }),
        randomNumber: getRandomArbitrary(1123111, 1999111),
        cityOfPerson: data.stadtOfPerson + ", Deutschland"
    });
});

app.get('/documentForMe', function (req, res) {
    res.sendFile(__dirname + "/report/index.htm");
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/report/start.html");
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
            path: __dirname + '/report/ri_5.png' // file path
        }).then(data => {
            resolve('resolved');
        });
    });
}
