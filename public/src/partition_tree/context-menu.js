var contextMenuObj = {}

var getContextMenu = function () {
    contextMenuObj.menu = document.querySelector('#context-menu');
    contextMenuObj.menuItems = contextMenuObj.menu.querySelectorAll('.context-menu__item');
    contextMenuObj.menuState = 0;
    contextMenuObj.menuWidth;
    contextMenuObj.menuHeight;
    contextMenuObj.menuPosition;
    contextMenuObj.menuPositionX
    contextMenuObj.menuPositionY;

    contextMenuObj.windowWidth;
    contextMenuObj.windowHeight;

    return contextMenuObj
}