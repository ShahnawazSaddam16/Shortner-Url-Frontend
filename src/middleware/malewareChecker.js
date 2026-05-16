const blockedDomains = [
    "malware.com",
    "phising.com"
]

const malwareCheck = (url) => {
    return blockedDomains.some(domain =>{
        url.includes(domain);
    });
};

module.exports = malwareCheck;