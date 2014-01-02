/**
 * Auhor: chengjun.hecj
 * Descript:
 */

var Menus = {};



Menus.init = function(handles){
    Menus.liMenu = new global.gui.Menu();
    Menus.liMenu.append(new gui.MenuItem({
        label: '重命名',
        click: handles[0]
    }));
    Menus.liMenu.append(new gui.MenuItem({
        label: '删除',
        click: handles[1]
    }));
};

module.exports = Menus;