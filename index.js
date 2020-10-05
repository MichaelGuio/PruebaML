const http = require('http');
const https = require('https');
const { setImmediate } = require('timers');
const fs = require('fs').promises;
//#region Server
var JsonData = [], mode = 0;/*1: product_list, 2: detail */
const port = 4500;
const server = http.createServer((req, res) => {
    let url;
    console.log('req url: ', req.url);
    if (req.url.includes('api')){
        let isDetail = null;
        if(req.url.includes('/items?')){
            url = 'https://api.mercadolibre.com/sites/MLA/search';
            isDetail = false;
            mode = 1;
        }
        else if(req.url.includes('/items/')){ 
            url = 'https://api.mercadolibre.com/items/' + extractProductId(req.url);
            isDetail = true;
            mode = 2;
        }
        sendResponse(res, url, getQueryString(req.url), isDetail);
    }else{
        url = "Content" + router(req.url);
        fs.readFile(__dirname + '\\' + url).then( content => {
            let type;
            switch (url.substring(url.lastIndexOf('.') + 1)) {
                case 'html':
                    type = 'text/html; charset=utf-8';
                    break;
                case 'css':
                    type = 'text/css; charset=utf-8';
                    break;
                case 'js':
                    type = 'text/javascript; charset=utf-8';
                    break;
                case 'jpeg':
                    type = 'image/jpeg';
                    break;
                case 'jpg':
                    type = 'image/jpeg';
                    break;
                case 'png':
                    type = 'image/png';
                    break;
                default:
                    type = 'text/plain; charset=utf-8';
                    break;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', type);
            res.end(content);
        }).catch((e) => {
            console.error(e);
            closeErrorConnection(res);
        });
    }
});
server.listen(port, function(){
    console.log('Working on port ' + port);
});
//#endregion
//#region Functions
function getUrl(url){
    return url.indexOf('?') < 0 ? url : url.substring(0, url.indexOf('?'));
}
function getQueryString(QueryString){
    let ix = QueryString.indexOf('?') + 1, data = {};
    while(ix > 0){
        let ix2 = QueryString.indexOf('&', ix) < 0 ? QueryString.length : QueryString.indexOf('&', ix);
        data[QueryString.substring(ix, QueryString.indexOf('=', ix))] = QueryString.substring(QueryString.indexOf('=', ix) + 1, ix2);
        ix = QueryString.indexOf('&', ix) < 0 ? 0 : ix2 + 1;
    }
    return data;
}
function router(url){
    if(url == "/" || url.includes("/items?search=") || (url.includes("/items/") && !url.includes("."))) url = "/search.html";
    else if(url.includes("/items/")) url = url.replace('/items','');
    else if(url.includes("?")) url = url.substring(0, url.indexOf("?"));
    return url;
}
function sendResponse(res, url, QueryString, isDetail){
    getEndPointInfo(url, QueryString, (data) =>{
        try {
            if(!isDetail){
                JsonData.push(data);
                let JsonRes = getJsonResponse();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/json; charset=utf-8');
                res.end(JsonRes);
            }else{
                url += '/description';
                isDetail = false;
                JsonData.push(data);
                setImmediate(sendResponse, res, url, QueryString, isDetail);
            }    
        } catch (e) {
            console.error(e);
            closeErrorConnection(res);    
        }
    },(e) =>{
        console.error(e);
        closeErrorConnection(res);
    });
}
function extractProductId(url){
    return url.substring(url.lastIndexOf('/') + 1);
}
function getEndPointInfo(url, params, callback, callback_e){
    let tx = "";
    for (let prop in params) if(prop != 'isDetail') tx += (`${prop}=${params[prop]}&`);
    tx = tx.slice(0, tx.length - 1);
    https.get(tx != "" ? `${url}?${tx}` : url, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];
        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                            `Expected application/json but received ${contentType}`);
        }
        if (error) {
            callback_e(error);
            res.resume();
            return;
        }
        let allData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { allData += chunk; });
        res.on('end', () => {
            try {
                callback(JSON.parse(allData));
            } catch (e) {
                callback_e(e);
            }
        });
    }).on('error', (e) => {
        callback_e(e);
    });
}
function closeErrorConnection(res){
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Error... Internal Error');
}
function getJsonResponse(){
    let JsonObj = {};
    JsonObj.author = {
        name: "Michael",
        lastname: 'Sanabria'   
    };
    if (mode == 1){
        JsonObj.categories = [];
        JsonObj.items = [];
        let results = [];
        for(let i = 0; i < 4; i++) results.push(JsonData[0].results[i]);
        results.forEach(res => {
            JsonObj.categories.push(res.category_id);
            JsonObj.items.push({
                "id": res.id,
                "title": res.title,
                "price": {
                    "currency": res.currency_id,
                    "amount": Math.trunc(res.price),
                    "decimals": res.price % 1
                },
                "picture": res.thumbnail,
                "condition": res.condition,
                "free_shipping": res.shipping.free_shipping,
                "state_name": res.address.state_name
            });
        });
    }else if(mode == 2){
        let general = JsonData[0];
        let detail = JsonData[1];
        JsonObj.item = {
            "id": general.id,
            "title": general.title,
            "price": {
                "currency": general.currency_id,
                "amount": Math.trunc(general.price),
                "decimals": general.price % 1
            },
            "picture": general.thumbnail,
            "condition": general.condition,
            "free_shipping": general.shipping.free_shipping,
            "sold_quantity": general.sold_quantity,
            "description": detail.plain_text
        };
    }
    JsonData = [];
    return JSON.stringify(JsonObj);
}
//#endregion