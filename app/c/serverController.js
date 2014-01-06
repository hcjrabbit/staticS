/**
 * User: chengjun.hecj
 *
 */
var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec;

var flexCombo = require('./combin'),
    commonHostsIp = require('./config').commonHostsIp;

var PORT = 80;


var Server = {
    init: function (servers,recordRequest) {
        this.server = http.createServer(function (req, res) {
            var hostname = req.headers.host,
                pathname = url.parse(req.url).pathname,
                isMatchSys = false,
                matchItem;


            servers.forEach(function (item) {
                if(hostname == item.hostName && item.ip != ''){
                    commonHostsIp[hostname] = item.ip;
                }
                if (hostname == item.hostName && pathname.indexOf(item.projectPath) > -1) {
                    matchItem = item;
                    isMatchSys = true;
                }
            });
            if (!isMatchSys) {
                http.get({
                    hostname: commonHostsIp[hostname], port: 80, path: pathname,headers:{"host":hostname}},function (res2) {
                    var data = '';
                    console.log('err&' +res2.statusCode)

                    if(res2.statusCode !== 200){
                        recordRequest('err',req.url);
                        return;
                    }
                    res2.on('data', function (chunk) {
                        data += chunk;
                    });
                    res2.on('end',function(){
                        recordRequest('Remote',req.url);
                        res.write(data);
                        res.end();
                    });
                }).on('error', function (e) {
                        recordRequest("err",req.url + '请求不到！！');
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
            },recordRequest)(req, res, function(){
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end();
            });
        });
    },
    start: function (servers,callback,recordRequest) {
        if(global.Sys == 'Windows'){
            Server.init(servers,recordRequest);
            Server.server.listen(PORT, callback);
        }else {
            var str = '{"servers":[' ;

            servers.forEach(function(item,i){
                str += JSON.stringify(item);
                if( i != servers.length - 1)
                    str += ',';
            });
            str += ']}';

            fs.writeFileSync(path.join(fs.realpathSync('.'),'app/c/server.json'),str);

            var sysPassword = global.localStorage.sysPassword;
            if (!sysPassword) {
                sysPassword = window.prompt("请输入管理员密码", "");
                global.localStorage.sysPassword = sysPassword;
            }
            var cmd = 'echo "'+ sysPassword +'" | sudo -k -S /usr/local/bin/node '+ __dirname +'/server.js';
            global.childProcess = exec(cmd);
            global.childProcess.on('exit',function(err,stdin,stdout){
                if (err){
                    if(err == '8'){
                        callback('','80端口被占用！请先关闭。。');
                    }else if(err == '1'){
                        sysPassword = '';
                        global.localStorage.sysPassword = sysPassword;
                        callback('','你还未安装Nodejs或系统密码错误');
                    }
                }});
            global.childProcess.stdout.on('data',function(data){
                console.log(data)
                data = String(data).replace(/\?\?\n/g,'');
                if(data.replace('\n','') == 'true'){
                    callback();
                    return;
                }
                if(data == '')
                    return;
                var arr = data.split('\n');
                if(arr[arr.length -1] == '')
                    arr.pop();
                arr.forEach(function(item){
                    var str = item.split('&');
                    recordRequest(str[0],String(str[1]).replace(/err|Local|Not found|Cache|Remote/g,''));
                });
            });
        }

    },
    stop: function (callback) {
        if(global.Sys == 'Windows'){
            if(Server.server){
                Server.server.close(callback);
                Server.server = null;
            }else{
                callback(null,true)
            }
        }else {
            if(global.childProcess){
                global.childProcess.kill('SIGHUP');
                global.childProcess = exec('echo "' + global.localStorage.sysPassword + '\\n" | sudo -S kill '+ (global.childProcess.pid + 3),function(){
                    callback();
                });
            }else {
                callback(null,true);
            }

        }

    }
};
module.exports = Server;