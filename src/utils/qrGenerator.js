const QRCode = require("qrcode");

const GenerateQr = async(url) => {
    return await QRCode.toDataURL(url);
}

module.exports = GenerateQr;