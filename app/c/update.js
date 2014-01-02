/**
 * Auhor: chengjun.hecj
 * Descript:
 */

var http = require('http'),
    fs = require('fs');


var Req = {
    init: function (callback,isAuto) {
        var config = global.config;
        var data = JSON.stringify({
            name: config.name
        });

        var options = {
            hostname: config.update.hostname,
            path: '/update',
            method: 'POST',
            headers: {
                Connection: 'keep-alive',
                Accept: 'text/html, application/xhtml+xml, */*',
                'Accept-Language': 'zh-CN',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        var req = http.request(options, function (res) {
            if (res.statusCode !== 200) {
                callback('服务器异常，请稍后重试。。。。!');
                return;
            }
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end',function(){
                data = JSON.parse(data);
                if (data.success && data.data) {
                    if (data.data.currentVersion != config.version)
                        callback('',data.data);
                    else if(!isAuto)
                        callback('已经是最新版本！');
                }else{
                    callback('服务器异常，请稍后重试。。。。!');
                }
            });
        });

        req.on('error', function (e) {
            callback('problem with request: ' + e.message);
        });

        req.write(data + '\n');
        req.end();
    }
};

module.exports = Req;