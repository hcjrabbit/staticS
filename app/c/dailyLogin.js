
/**
 * Auhor: chengjun.hecj
 * Descript:
 */

var http = require('http'),
    fs = require('fs');


var dailyLogin = {
    init: function (type,callback) {
        var config = global.config;
        var data = JSON.stringify({
            appName: config.name
        });

        var options = {
            hostname: config.update.hostname,
            path: '/'+type,
            method: 'POST',
            headers: {
                Connection: 'keep-alive',
                Accept: 'text/html, application/xhtml+xml, */*',
                'Accept-Language': 'zh-CN',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        var req = http.request(options,function(res){

            if(type != 'dailyLoginOut'){
                if(res.statusCode != '200'){
//                    callback(null);
                    return;
                }
                var data = '';
                res.on('data',function(chunk){
                    data  += chunk;
                });
                res.on('end',function(){
                    data = JSON.parse(data);
                    if(data.success){
                        callback(data);
                    }
                })
            }
        }).on('error', function (e) {
//                console.log('err&'+req.url + '请求不到！！');
            });
        req.write(data + '\n');
        req.end();
    }
};

module.exports = dailyLogin;