const request = require('request');

const webhook = '' //discord webhook url
let products = {}

init();

function init() {
    request({
        uri: 'https://kbdfans.com/products.json',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3107.4 Safari/537.36',
        }
    }, (err, res, body) => {
        try {
            body = JSON.parse(body);
        } catch (e) { return console.error(e) }
        let items = body.products
        items.map(item => {
            let handle = item.handle;
            item.variants.map(variant => {
                variant.hanlde = handle;
                let id = variant.id;
                products[id] = variant;
            })
        });
        return check();
    })
}

function check() {
    setInterval(() => {
        request({
            uri: 'https://kbdfans.com/products.json',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3107.4 Safari/537.36',
            }
        }, (err, res, body) => {
            try {
                body = JSON.parse(body);
            } catch (e) { return console.error(e) }
            let items = body.products
            items.map(item => {
                let handle = item.handle;
                let pName = item.title
                item.variants.map(variant => {
                    variant.handle = handle;
                    variant.productName = pName;
                    let id = variant.id;
                    if (products[id] == null) {
                        products[id] = variant; //update products
                        send(variant);
                    } else { //product already found
                        if (products[id].available != variant.available) { //send webhook;
                            products[id] = variant; //update products
                            send(variant);
                        }
                    }
                })
            });
        })
    }, 60000);
}

function send(product) {
    let colorCode = 65280;
    let message = 'Product In-Stock!'
    if (!product.available) {
        colorCode = 16711680;
        message = 'Product Sold-Out!'
    }
    if (product.title == 'Default Title') {
        product.title = 'Single Variant';
    }
    request({
        url: webhook,
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        json: {
            "embeds": [
                {
                    "color": colorCode,
                    "timestamp": new Date().toISOString(),
                    "footer": {
                        "icon_url": "https://cdn.discordapp.com/attachments/522439436353536002/524299073147371523/logo.png",
                        "text": "Vehicle Monitor by Dollon"
                    },
                    "author": {
                        "name": "Vehicle Monitor",
                        "url": "https://discordapp.com",
                        "icon_url": "https://cdn.discordapp.com/attachments/522439436353536002/524299073147371523/logo.png"
                    },
                    "title": message,
                    "fields": [
                        {
                            "name": "Title",
                            "value": product.productName,
                            "inline": false
                        },
                        {
                            "name": "Variant",
                            "value": product.title,
                            "inline": false
                        },
                        {
                            "name": "Price",
                            "value": `$${product.price}`,
                            "inline": true
                        },
                        {
                            "name": "Link",
                            "value": `https://kbdfans.com/products/${product.handle}?variant=${product.id}`,
                            "inline": false
                        }
                    ],
                    "image": {
                        "url": product.src
                    }
                }
            ]
        }
    }, (error, response, html) => {
        return;
    });
}