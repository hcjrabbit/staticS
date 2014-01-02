/**
 * User: chengjun.hecj
 *
 */
var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    path = require('path');

var flexCombo = require('./combin'),
    commonHostsIp = require('./config').commonHostsIp;

var PORT = 80;
var servers  = JSON.parse(fs.readFileSync(path.join(path.dirname(process.argv[1]),'server.json'),'utf8')).servers;


http.createServer(function (req, res) {
    var hostname = req.headers.host,
        pathname = url.parse(req.url).pathname,
        isMatchSys = false,
        matchItem;

    servers.forEach(function (item) {
        if (hostname == item.hostName && pathname.indexOf(item.projectPath) > -1) {
            matchItem = item;
            isMatchSys = true;
        }
    });
    if (!isMatchSys) {
        http.get({
            hostname: commonHostsIp[hostname], port: 80, path: pathname,headers:{"host":hostname}},function (res2) {
            var data = '';

            if(res2.statusCode !== 200){
                return;
            }
            res2.on('data', function (chunk) {
                data += chunk;
            });
            res2.on('end',function(){
                console.log('Remote&'+req.url);
                res.write(data);
                res.end();
            });

        }).on('error', function (e) {
                console.log('err&'+req.url + '请求不到！！');
            });
        return;
    }
    var urls = eval('({"'+ matchItem.projectPath +'" : "'+ matchItem.develop +'"})');
    flexCombo.init(urls,{
        servlet : matchItem.servlet,
        seperator: matchItem.seperator,
        charset: matchItem.charset,
        filter : {
            '\\?.+':'',
            '-min\\.js$':'.js',
            '-min\\.css$':'.css'
        },
        headers : {
            host : hostname
        },
        supportedFile: matchItem.supportedFile,
        urlBasedCharset:{},
        fns:[],
        hosts:eval('({"'+ hostname +'":"'+ matchItem.ip +'"})')
    })(req, res, function(){
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end();
    });
}).listen(PORT);
console.log('true');
