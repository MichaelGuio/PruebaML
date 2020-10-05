function getQueryString(QueryString){
    let ix = QueryString.indexOf('?') + 1, data = {};
    while(ix > 0){
        let ix2 = QueryString.indexOf('&', ix) < 0 ? QueryString.length : QueryString.indexOf('&', ix);
        data[QueryString.substring(ix, QueryString.indexOf('=', ix))] = QueryString.substring(QueryString.indexOf('=', ix) + 1, ix2);
        ix = QueryString.indexOf('&', ix) < 0 ? 0 : ix2 + 1;
    }
    return data;
}
async function httpGet(url, params, callback){
    let tx = "";
    for (let prop in params) tx += (`${prop}=${params[prop]}&`);
    tx = tx.slice(0, tx.length - 1);
    await axios.get(tx != "" ? `${url}?${tx}` : url)
    .then((res) => {
        callback(res.data);
    })
    .catch((e) => {
        console.log(e);
    });
    // .then(function () {
    // });
}
function extractProductId(url){
    return url.substring(url.lastIndexOf('/') + 1);
}
function convNum(num){
    return new Intl.NumberFormat('en-DE').format(num);
  }