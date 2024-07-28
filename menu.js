let MENU = null;
let MENU_HIDDEN = true;

const MENU_BUTTONS_MAPPING={
    'calculator_menu_button':'calculator',
    'settings_menu_button':'settings',
    'lawyers_menu_button':'lawyers'
}

function menuInit() {
    MENU = document.querySelector('.menu__wrapper')
    hideMenu()
    onMenuIconClick()
    onMenuItemClick()
}

function hideMenu() {
    let menuWidth = MENU.querySelector('.menu').offsetWidth
    MENU.style.setProperty('--menu-left', (menuWidth * -1 - 5) + 'px')
    MENU_HIDDEN = true;
}

function showMenu() {
    let menuWidth = MENU.querySelector('.menu').offsetWidth
    MENU.style.setProperty('--menu-left', MENU.style.getPropertyValue('--menu-left--base'))
    MENU_HIDDEN = false;
}

function onMenuIconClick() {
    MENU.querySelector('.menu__icon').addEventListener('click', function () {
        if (MENU_HIDDEN) {
            showMenu()
        } else {
            hideMenu()
        }
    })
}

function onMenuItemClick() {
    let menuItems = MENU.querySelectorAll('.menu__item')
    menuItems.forEach(function (element){
        element.addEventListener('click', function (){
            document.querySelectorAll('.main_window_item').forEach(function (element){
                element.classList.add('hidden')
            })
            menuItems.forEach(function (menuItem){
                menuItem.classList.remove('selected')
            })
            element.classList.add('selected')
            document.querySelector('.'+MENU_BUTTONS_MAPPING[element.id]).classList.toggle('hidden')

        })
    })
}