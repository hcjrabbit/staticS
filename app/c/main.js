/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var config = require('../c/config');

var gui = require('nw.gui'),
    win = gui.Window.get();
var fs = require('fs');


global.navigator = navigator;

var tray = require('../c/tray'),
    Menu = require('../c/menu'),
    Server = require('../c/serverController'),
    Sys = require('../c/sysVision'),
    dailyLogin = require('../c/dailyLogin'),
    update = require('../c/update');


global.$ = $ = jQuery;
global.gui = gui;
global.win = win;
global.config = config;
global.Sys = Sys;
global.localStorage = localStorage;

var $listsPanel = $('#listsPanel');

var serversData;

var S = {
    init: function () {
        $(document).tooltip();
        //初始化数据
//        localStorage.serversData = '';
        if (!localStorage.serversData) {
            serversData = {
                lists: [],
                currentIndex: 0
            };
            S.addServer();
        } else {
            serversData = JSON.parse(localStorage.serversData);

            serversData.lists.forEach(function(item){
                item.isStart = false;

            });
            localStorage.serversData = serversData;
        }

        this.listsRender();

        Menu.init([
            function () {
                S.rename(window.prompt("请输入名称", ""));
            },
            S.delServer
        ]);
        this.bindEvent();

        $listsPanel.find('li:eq(0)').click();
    },
    bindEvent: function () {
        win.on('close', function () {
            S.closeWindow();
        });
        //关闭窗口
        $('#closeWin').on('click', function () {
            win.close();
        });
        //最小化窗口
        $('#minimize').on('click', function () {
            win.minimize();
        });
        $('#help').on('click', this.openHelp);
        $('#useInfo').bind('click', function () {
            $("#caseDialog").dialog({
                width: 600,
                dialogClass: "no-close",
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            var $this = $(this);
                            S.effectClose($this.parent(), function () {
                                $this.dialog('close');
                            });
                        }
                    }
                ]
            });
        });
        $('#addServer').bind('click', this.addServer);
        $('#delServer').bind('click', this.delServer);
        $('.fileBtn').bind('click', function () {
            $(this).next().click();
        });
        $('.fileBtnInput').bind('change', function () {
            if ($(this)[0].id == 'file1') {
                $('#path1').val(this.value);
                S.changeAtt('develop', this.value);
            }
            else {
                $('#path2').val(this.value);
                S.changeAtt('product', this.value);
            }
        });
        $('#main input[type=text],#main input[type=text]').bind('change', function () {
            S.changeAtt($(this).attr('name'), this.value);
            if (this.name == 'hostName')
                for (key in config.commonHostsIp) {
                    if (key == $.trim(this.value)){
                        $('#main input[name=ip]').val(config.commonHostsIp[key]);
                        serversData.lists[serversData.currentIndex].ip = config.commonHostsIp[key];
                    }
                }
        });
        $('#dataDetail input[type=checkbox]').bind('change', function () {
            S.changeAtt($(this).attr('name'), this.checked);
        });
        $('#dataDetail input[type=text]').bind('change', function () {
            S.changeAtt($(this).attr('name'), this.value);
        });
        $('#start').bind('click', function(){
            S.start(serversData.currentIndex);
        });
        $('#stop').bind('click', function(){
            S.stop(serversData.currentIndex);
        });
        $('#restart').bind('click', S.restart);
        $('#requestRec').bind('click', function () {
            if ($('#status').css('display') != 'block')
                $('#status').css({
                    'display': 'block'
                });
            else
                S.effectClose($('#status'), function () {
                    $('#status').removeAttr('style');
                });
        });
        $('body').bind('click', function (e) {
            var $this = e.target;
            if ($this.id != 'status' && $('#status').css('display') == 'block' && $this.id != 'requestRec')
                S.effectClose($('#status'), function () {
                    $('#status').removeAttr('style');
                });

        });
        $('#cleanRecord').bind('click',function(){
            $('#status .detail').html('');
        });
    },
    effectClose: function (el, callback) {
        var effect = ['explode', 'blind', 'bounce', 'clip', 'drop', 'fade', 'fold', 'highlight', 'puff', 'pulsate'];
        el.effect(effect[parseInt(Math.random() * 10)], {}, 500, callback);
    },
    showTip: function (msg) {
        $('#winTip').attr('title', msg).trigger('mouseenter');
        setTimeout(function () {
            $('#winTip').trigger('mouseout');
        }, 1000);
    },
    addServer: function () {
        serversData.lists.push({
            name: '新建静态服务',
            id: Date.parse(new Date()),
            isDebug: true,
            hostName: '',
            projectPath: '',
            supportedFile: '\\.js|\\.css|\\.png|\\.gif|\\.jpg|\\.swf|\\.xml|\\.less|\\.svg|\\.ttf|\\.mp3',
            charset: 'GBK',
            servlet: '?',
            seperator: ',',
            develop: '',
            product: '',
            ip: '',
            isStart: false
        });
        S.changeServersData();
    },
    delServer: function (index) {
        if ($listsPanel.find('li').length == 1) {
            S.showTip('最后一个服务器不能删除！');
            return;
        }
        serversData.lists.splice(isNaN(index) ? $listsPanel.find('li.active').attr('data-index') : index, 1);
        S.changeServersData();
        $listsPanel.find('li:eq(0)').click();
    },
    rename: function (name) {
        serversData.lists[S.currentLocalLiPopIndex].name = name;
        S.changeServersData();
    },
    changeAtt: function (attName, value) {
        serversData.lists[serversData.currentIndex][attName] = value;
        S.changeServersData();
    },
    changeServersData: function () {
        localStorage.serversData = JSON.stringify(serversData);
        S.listsRender();
        tray.render(serversData);
    },
    listsRender: function () {
        $listsPanel.find('li').unbind();
        $listsPanel.html(new EJS({url: ('../v/view/serverItem.ejs')}).render({serversData: serversData}));
        $listsPanel.find('li').bind({
            'click': S.showActive,
            'contextmenu': S.menuClick
        });
    },
    showActive: function () {
        $listsPanel.find('li').removeClass('active');
        serversData.currentIndex = $(this).addClass('active').attr('data-index');
        S.startEndButtonRender(serversData.currentIndex);
        S.extendRender(serversData.lists[serversData.currentIndex]);
        S.mainRender(serversData.lists[serversData.currentIndex]);
        S.changeServersData();
    },
    menuClick: function (e) {
        var menu = Menu.liMenu;
        S.currentLocalLiPopIndex = $(e.target).attr('data-index');
        menu.popup(e.clientX, e.clientY);
    },
    startEndButtonRender: function (index) {
        if (serversData.lists[index].isStart) {
            $('#stop').removeClass('btn_disable');
            $('#start').addClass('btn_disable');
        } else {
            $('#start').removeClass('btn_disable');
            $('#stop').addClass('btn_disable');
        }
    },
    mainRender: function (data) {
        var $input = $('#main input[type=text]');
        $input.eq(0).val(data.hostName);
        $input.eq(1).val(data.projectPath);
        $input.eq(2).val(data.develop);
        $input.eq(3).val(data.product);
        $input.eq(4).val(data.ip);
    },
    extendRender: function (data) {
        $('#serverName').html(data.name);
        $('#supportedFile').val(data.supportedFile);
        $('#outCharset').val(data.charset);
        $('#comboServlet').val(data.servlet);
        $('#comboSeperator').val(data.seperator);
        $('#debugCheck')[0].checked = data.isDebug;
    },
    start: function (index) {
        if ($(this).hasClass('btn_disable'))
            return;

        if (isNaN(index)) {
            serversData.lists.forEach(function (item) {
                if (!item.hostName) {
                    S.showTip(item.name + ' ' + '请输入域名！！！');
                    return;
                }
                if (!item.projectPath) {
                    S.showTip(item.name + ' ' + '请输入项目地址！！！');
                    return;
                }
                if (!item.develop) {
                    S.showTip(item.name + ' ' + '请输入开发环境目录！！！');
                    return;
                }
                if (!item.isDebug && !item.product) {
                    S.showTip(item.name + ' ' + '请输入生成环境目录！！！');
                    return;
                }
                item.isStart = true;
            });
            S.startEndButtonRender(serversData.currentIndex);
        } else {
            var item = serversData.lists[index];
            if (!item.hostName) {
                S.showTip(item.name + ' ' + '请输入域名！！！');
                return;
            }
            if (!item.projectPath) {
                S.showTip(item.name + ' ' + '请输入项目地址！！！');
                return;
            }
            if (!item.develop) {
                S.showTip(item.name + ' ' + '请输入开发环境目录！！！');
                return;
            }
            if (!item.isDebug && !item.product) {
                S.showTip(item.name + ' ' + '请输入生成环境目录！！！');
                return;
            }
            serversData.lists[index].isStart = true;
            S.startEndButtonRender(index);
        }
        S.changeServersData();
        S.stop(null);
        return false;
    },
    stop: function (index) {
        if ($(this).hasClass('btn_disable'))
            return;

        S.stopServer(index);
    },
    restart: function () {
        S.start(serversData.currentIndex);
    },
    recordQuest: function (type, msg) {
        var color = '#ccc';
        switch (type) {
            case 'Local' :
                color = 'green';
                break;
            case 'Not found' :
                color = 'red';
            case 'Cache' :
                color = 'blue';
                break;
            case 'Remote' :
                color = 'gray';
                break;
            case 'err' :
                color = 'red';
                break;
            default:
                break;
        }

        $('#status .detail').append('<p style="color: ' + color + ';">' + msg + '</p>');
    },
    startServer: function () {
        var servers = [];
        serversData.lists.forEach(function (item) {
            if(item.isStart){
                servers.push(item);
                item.isStart = false;
            }
        });
        if(servers.length == 0)
            return;
        S.changeServersData();
        Server.start(servers, function (err, msg) {
            if (msg) {
                S.showTip(msg);
                S.stop('all');
                return;
            }
            if (err) {
                S.recordQuest('err', err);
                S.stop('all');
            } else {
                S.recordQuest('Local', '静态服务已启动，正在监听80端口。。。');
                $('#status').css({
                    'display': 'block',
                    'opacity': 1
                });
                servers.forEach(function(item){
                    serversData.lists.forEach(function(item1){
                        if(item.id == item1.id)
                            item1.isStart = true;
                    });
                });
                S.changeServersData();
            }
        }, S.recordQuest);
    },
    stopServer: function (index) {
        Server.stop(function (err,isFirst) {
            if (err)
                !isFirst && S.recordQuest('err', err);
            else {
                !isFirst && S.recordQuest('err', '服务已停止！！');
                if (!isNaN(index) && (index || index == 0)) {
                    serversData.lists[index].isStart = false;
                } else if(index){
                    serversData.lists.forEach(function (item) {
                        item.isStart = false;
                    });
                }

                S.startEndButtonRender(!isNaN(index) && index ? index : serversData.currentIndex);
                S.changeServersData();

                if(!isNaN(index) || !index){
                    S.startServer();
                }
            }

        });
    },
    closeWindow: function () {
        S.stop('all');
        win.close(true);
    },
    openHelp : function(){
        $("#helpDialog").find('button').button();
        $('#checkUpdate').click(function () {
            localStorage.staticSisUpdateLater = 0;
            update.init(S.updateDialogInit,false);
            $("#helpDialog").dialog('close');
        });
        $("#helpDialog").dialog();
    },
    updateDialogInit: function (err,data) {
        if(err){
            S.showTip(err);
            return;
        }
        if(localStorage.staticSisUpdateLater == '0'){
            var $dialog = $('#updateDialog');
            $dialog.dialog();
            $dialog.find('button').button();
            $('#updateBtn').click(function(){
                $dialog.dialog('close');
                alert('下载地址: \r\n'+ 'http://' +config.update.hostname + '/download/staticS/staticS-'+ Sys + '-'+ data.currentVersion + '.zip' );
            });
            $('#updateLaterBtn').click(function () {
                localStorage.staticSisUpdateLater = 1;
                $dialog.dialog('close');
            });
            $('#updateCancelBtn').click(function () {
                $dialog.dialog('close');
            });
        }
    }
};

$(function () {
    win.show();
    S.init();
    update.init(S.updateDialogInit,true);
    tray.init(serversData, S);
    if(localStorage.staticSnotFirstLogin){
        dailyLogin.init('dailyLoginOut');
    }
    dailyLogin.init('dailyLoginIn',function(){
        setInterval(function(){
            dailyLogin.init('getOnlineNum',function(data){
                $('#onlineNum').html(data.num);
            });
        },5000);
        localStorage.staticSnotFirstLogin = 1;
    });

});