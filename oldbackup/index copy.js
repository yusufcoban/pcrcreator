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
var ImageModule = require("docxtemplater-image-module");
const Docxtemplater = require("docxtemplater");
const Stream = require("stream").Transform;
const content = fs.readFileSync(__dirname + "/docMethod/vorlage.docx");


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
async function htmlToPdf(html) {
    /* pdf.create(html).toBuffer(function (err, buffer) {
         return Buffer.isBuffer(buffer);
     });
 */
    var options = {
        format: 'A4',
        base: 'file:///' + path.resolve('./report') + '/'
    };
    pdf.create(html, options).toStream(function (err, stream) {
        stream.pipe(fs.createWriteStream('./report/generatedPDF.pdf'));
    });
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
    var opts = {};
    opts.centered = false;
    opts.getImage = function (tagValue, tagName) {
        return fs.readFileSync(tagValue);
    };

    opts.getSize = function (img, tagValue, tagName) {
        return [150, 150];
    };

    var imageModule = new ImageModule(opts);

    var zip = new PizZip(content);
    var doc = new Docxtemplater(zip, {
        modules: [imageModule],
    });
    var dateOfBirth = new Date(inputRaw.birthday);
    var dataOfTestString = new Date(inputRaw.dateOfTest);
    var dateOfTestEntnahme = new Date(dataOfTestString);
    dateOfTestEntnahme.setHours(dateOfTestEntnahme.getHours() - 27);
    dateOfTestEntnahme.setMinutes(dateOfTestEntnahme.getMinutes() - 12);
    var sexOfPersonData = inputRaw.isMale ? "M/M" : "F/F";
    doc.setData({ image: __dirname + "report/ri_5.png" }).render({
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
app.get('/docMethod', function (req, res) {
    res.sendFile(__dirname + "/docMethod/index.html");
});

app.get('/fetchQrCode', function (req, res) {
    res.sendFile(__dirname + "/reports/ri_5.png");
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
