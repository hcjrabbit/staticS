/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var path = require('path'),
    fs = require('fs');

var tray = {
    init: function (serversData, S) {
        this.gui = global.gui;
        this.win = global.win;
        this.S = S;
        this.tray = new this.gui.Tray({ icon: path.join(fs.realpathSync('.'), 'app/v/img', (global.Sys == 'Mac' ? 'staticS-s.png' : 'staticS-w.png'))});
        this.render(serversData);
        return tray;
    },
    render: function (serversData) {
        if (!tray.gui)
            return;
        tray.menu = new tray.gui.Menu();

        serversData.lists.forEach(function (item, i) {
            tray.menu.append(new tray.gui.MenuItem({
                label: item.name,
                click: function () {
                    if (serversData.lists[i].isStart)
                        tray.S.stop(i);
                    else
                        tray.S.start(i);
                },
                icon: (serversData.lists[i].isStart ? path.join(fs.realpathSync('.'), 'app/v/img', 'tray_open.png') : '')
            }));
        });
        tray.menu.append(new tray.gui.MenuItem({ type: 'separator' }));
        tray.menu.append(new tray.gui.MenuItem({
            label: '全部开启',
            click: function () {
                tray.S.start('all');
            }}));
        tray.menu.append(new tray.gui.MenuItem({
            label: '全部停止',
            click: function () {
                tray.S.stop('all');
            }}));
        tray.menu.append(new tray.gui.MenuItem({ type: 'separator' }));
        tray.menu.append(new tray.gui.MenuItem({
            label: '显示主程序',
            click: function () {
                tray.win.show();
            }}));
        tray.tray.menu = tray.menu;
    }
};
module.exports = tray;