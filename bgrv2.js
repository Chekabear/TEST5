const config = {
    'defaultLawBook': 'StGB'
}
let laws = {}
let CALCULATOR_WINDOW = null;
let SETTINGS_WINDOW = null;
let LAWYERS_WINDOW = null;
const COLOR_MAPPING = []
COLOR_MAPPING['highlight_color'] = '--color-highlighted'
COLOR_MAPPING['background_color'] = '--color-background'
COLOR_MAPPING['text_color'] = '--color-text'
COLOR_MAPPING['border_color'] = '--color-border'
COLOR_MAPPING['scrollbar_color'] = '--scrollbar-background'
COLOR_MAPPING['caution_color'] = '--color-caution'
const COLOR_INPUT_IDS = ['highlight_color', 'background_color', 'text_color', 'border_color', 'scrollbar_color', 'caution_color']


async function bgrInit() {
    CALCULATOR_WINDOW = document.querySelector('.bgr__wrapper')
    SETTINGS_WINDOW = document.querySelector('.settings')
    LAWYERS_WINDOW = document.querySelector('.lawyers')

    await fetch('./laws.json')
        .then(response => {
            return response.json();
        })
        .then(data => laws = data);

    loadSettings()

    await fetchLawyersFromSheet()
    loadNavigation()
    loadContent()
    initializeInfo()
    unselectButtonListener()
    clickRowListener()
    copyTextToClipboardListener()
    onAddTimeButtonClick()
    onSearchClick()
    drawWanteds()
    onNavItemClick()
    onClearSearchButtonClick()
    loadColors()
    onTextLayoutSelectChange()
    onColorSelectChange()
    onColorsResetButtonClick()

    updateInfos()
}

function loadSettings(){

    SETTINGS_WINDOW.querySelector('.bgr__infos__time input').checked = localStorage.getItem('bgr_addTime_new') !== 'false';
    if (localStorage.getItem('bgr_textLayout')) {
        SETTINGS_WINDOW.querySelector(`.bgr__infos__text option[value=${localStorage.getItem('bgr_textLayout')}]`).selected = true;
    }
    updateTime()
}

function clickRowListener() {
    CALCULATOR_WINDOW.querySelectorAll('.table__row').forEach(function (el) {
        el.addEventListener('click', function () {
            if (el.querySelector('input:checked')) {
                el.classList.toggle('active')
            } else {
                el.classList.toggle('active')
            }
            updateInfos()
        })
    })
}

function updateInfos(setCurrentTime = false) {

    let calculatedPenalty = getPenaltyAndParagraphs()

    let $penalty = 0
    $penalty = calculatedPenalty['penalty']
    if ($penalty <= 250000) {
        CALCULATOR_WINDOW.querySelector('.bgr__infos__penalty output').innerText = calculatedPenalty['penalty']
    } else {
        $penalty = 250000
        CALCULATOR_WINDOW.querySelector('.bgr__infos__penalty output').innerText = $penalty
    }

    let wantedsToDraw = 0
    let wantedsHtml = ''
    if (calculatedPenalty['wanteds'] <= 5) {
        wantedsToDraw = calculatedPenalty['wanteds']
    } else {
        wantedsToDraw = 5
    }

    for (let i = 0; i < wantedsToDraw; i++) {
        wantedsHtml += '⭐'
    }
    CALCULATOR_WINDOW.querySelector('.bgr__infos__wanteds output').innerHTML = wantedsHtml

    let wantedText = calculatedPenalty['paragraphs'] +' | '+ getCurrentDate()

    let layout = SETTINGS_WINDOW.querySelector('.bgr__infos__text').value ?? 'new'

    if ($penalty && layout === 'new'){
        wantedText += ` | `+$penalty+'$'
    }
    if (calculatedPenalty['wanteds']>0 && layout === 'new'){
        wantedText += ` | `+wantedsHtml
    }
    if (SETTINGS_WINDOW.querySelector('.bgr__infos__time input').checked || setCurrentTime) {
        wantedText += ` | ` + getCurrentTime() + ' Uhr'
    }
    
    CALCULATOR_WINDOW.querySelector('.bgr__infos__text output').innerText = wantedText
    if (calculatedPenalty["lawyerNeeded"] && calculatedPenalty['fibNeeded']) {
        CALCULATOR_WINDOW.querySelector('.bgr__infos__notice').innerHTML = 'ACHTUNG! Übergabe an Staatsanwalt und FIB.'
    } else if (calculatedPenalty["lawyerNeeded"]) {
        CALCULATOR_WINDOW.querySelector('.bgr__infos__notice').innerHTML = 'ACHTUNG! Übergabe an Staatsanwalt.'
    } else if (calculatedPenalty["fibNeeded"]) {
        CALCULATOR_WINDOW.querySelector('.bgr__infos__notice').innerHTML = 'ACHTUNG! Übergabe an FIB.'
    } else {
        CALCULATOR_WINDOW.querySelector('.bgr__infos__notice').innerHTML = ''
    }
}

function drawWanteds() {
    CALCULATOR_WINDOW.querySelectorAll('.bgr__table__content .table__item.wanted').forEach(function (el) {
        let wantedsHtml = ''
        if (el.getAttribute('data-wanteds') === '-1' || el.getAttribute('data-wanteds') > 5) {
            wantedsHtml = 'nach Sachlage'
        }
        if (el.getAttribute('data-wanteds') <= 5) {
            for (let i = 0; i < el.getAttribute('data-wanteds'); i++) {
                wantedsHtml += '&#11088;'
            }
        }
        el.innerHTML = wantedsHtml
    })
    CALCULATOR_WINDOW.querySelectorAll('.bgr__list__entry .penalty').forEach(function (el) {
        if (el.innerHTML === '-1') {
            el.innerHTML = 'nach Sachlage'
            el.setAttribute('class', 'penalty noMoney')
        }
    })
}

function getPenaltyAndParagraphs() {
    let lawBook = CALCULATOR_WINDOW.querySelectorAll('.bgr__table__content')
    let penalty = 0
    let wanteds = 0
    let paragraphs = ''
    let lawyerNeeded = false
    let fibNeeded = false

    lawBook.forEach(function (el) {
        let checkedEntries = el.querySelectorAll('.table__row.active')

        if (checkedEntries.length > 0) {
            paragraphs += el.getAttribute('id') + ' '
        }

        checkedEntries.forEach(function (el) {
            let elementPenalty = parseInt(el.querySelector('.penalty').innerHTML)
            let elementWanteds = parseInt(el.querySelector('.wanted').getAttribute('data-wanteds'))

            if (!isNaN(elementPenalty)) {
                penalty += elementPenalty
            }
            if (!isNaN(elementPenalty)) {
                wanteds += elementWanteds
            }
            paragraphs += el.querySelector('.paragraph').innerHTML.trim() + ' '
            if (el.getAttribute('data-lawyer')) {
                lawyerNeeded = true
            }
            if (el.getAttribute('data-fib')) {
                fibNeeded = true
            }
        })
    })

    return {
        'penalty': penalty,
        'wanteds': wanteds,
        'paragraphs': paragraphs,
        'lawyerNeeded': lawyerNeeded,
        'fibNeeded': fibNeeded
    }
}

function initializeInfo() {
    CALCULATOR_WINDOW.querySelector('.bgr__infos__penalty output').innerText = 0
    CALCULATOR_WINDOW.querySelector('.bgr__infos__text output').innerText = getCurrentDate()
}

function getCurrentDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    return dd + '.' + mm + '.' + yyyy
}

function getCurrentTime() {
    let today = new Date();
    let hh = String(today.getHours()).padStart(2, '0');
    let mm = String(today.getMinutes()).padStart(2, '0'); //January is 0!

    return hh + ':' + mm
}

function unselectButtonListener() {
    CALCULATOR_WINDOW.querySelector('.bgr__unselect').addEventListener('click', function () {
        CALCULATOR_WINDOW.querySelectorAll('.table__row.active').forEach(function (el) {
            el.classList.toggle('active')
            updateInfos()
        })
    })
}

function copyTextToClipboardListener() {
    let isBusy = false
    CALCULATOR_WINDOW.querySelector('.bgr__infos__text output').addEventListener('click', function () {
        if (!isBusy) {
            isBusy = true
            navigator.clipboard.writeText(this.innerText)
            let notification = CALCULATOR_WINDOW.querySelector('.bgr__copy__notification')
            notification.style.top = '-20px'
            setTimeout(function () {
                notification.style.top = '-80px'
                isBusy = false
            }, 1500)
        }
    })
}

function onAddTimeButtonClick() {
    SETTINGS_WINDOW.querySelector('.bgr__infos__time input').addEventListener('click', function (e) {
        if (!e.target.checked) {
            localStorage.setItem('bgr_addTime_new', false)
            updateTime(false)
            updateInfos()

        }else{
            updateTime()
            localStorage.setItem('bgr_addTime_new', true)
            updateInfos()
        }
    })
}

function updateTime(isButtonActive = true){
    let setCurrentTime = setInterval(function () {
        // need to check if checkbox is selected because clear timeout does nothing?!
        if (SETTINGS_WINDOW.querySelector('.bgr__infos__time input').checked){
            updateInfos(true)
        }
    }, 5000)
    if (!isButtonActive){
        clearTimeout(setCurrentTime)
    }
}

function onTextLayoutSelectChange(){
    let textLayoutSelect = SETTINGS_WINDOW.querySelector('.bgr__infos__text')
    textLayoutSelect.addEventListener('change', function (e) {
        localStorage.setItem('bgr_textLayout', textLayoutSelect.value)
        updateInfos()
    })
}

function onSearchClick() {
    CALCULATOR_WINDOW.querySelector('.bgr__searchbar input[type="text"]').addEventListener('input', function () {
        getSearchResults()
    })
}

function getSearchResults() {
    let entries = CALCULATOR_WINDOW.querySelectorAll('.table__row') || []

    entries.forEach(function (entry) {
        let searchTerm = CALCULATOR_WINDOW.querySelector('.bgr__searchbar input[type="text"]').value.toLowerCase()
        entry.classList.remove('hidden')
        if (entry.querySelector('.table__item.paragraph').innerHTML.toLowerCase().includes(searchTerm, -2) || entry.querySelector('.table__item.text').innerHTML.toLowerCase().includes(searchTerm, -2)) return;

        entry.classList.toggle('hidden')
    })
}

function loadNavigation() {
    Object.keys(laws).forEach(function (name) {
        CALCULATOR_WINDOW.querySelector('.bgr__table__nav').innerHTML += `<div class="nav__item">${name}</div>`
    })
}

function loadContent() {
    Object.keys(laws).forEach(function (key) {
        let bookMarkup = `<div class="bgr__table__content hidden" id="${key}">`
        laws[key]['paragraphs'].forEach(function (data) {
            bookMarkup += `
            <div class="table__row" data-lawyer="${data['lawyer']}" data-fib="${data['fib']}">
                <div class="table__item paragraph">
                    ${data['paragraph']}
                </div>
                <div class="table__item text">
                    ${data['text']}
                </div>
                <div class="table__item info">
                    ${data['info']}
                </div>
                <div class="table__item exclusion">
                    ${data['exclusion']}
                </div>
                <div class="table__item penalty">
                    ${data['penalty'] !== '-1' ? data['penalty'] : 'Nach Sachlage'}
                </div>
                <div class="table__item wanted" data-wanteds="${data['wanted']}">
                </div>
                <input type="checkbox" class="hidden">
            </div>`
        })
        bookMarkup += `</div>`
        CALCULATOR_WINDOW.querySelector('.bgr__table').innerHTML += bookMarkup;
    })
}

function onNavItemClick() {
    let defaultLawBook = CALCULATOR_WINDOW.querySelector(`.bgr__table__content#${config.defaultLawBook}`)
    let navbar = CALCULATOR_WINDOW.querySelector('.bgr__table__nav')
    let link = CALCULATOR_WINDOW.querySelector('.bgr__table__link')
    defaultLawBook.classList.toggle('hidden')

    navbar.querySelectorAll('.nav__item').forEach(function (navItem) {
        if (navItem.innerHTML !== config.defaultLawBook) return
        navItem.classList.toggle('active')
        link.href = laws[config.defaultLawBook]['link']
    })

    CALCULATOR_WINDOW.querySelectorAll('.bgr__table__nav .nav__item').forEach(function (item) {
        item.addEventListener('click', function (e) {
            let activeItem = navbar.querySelector('.active')
            CALCULATOR_WINDOW.querySelector(`.bgr__table__content#${activeItem.innerText}`).classList.toggle('hidden')
            activeItem.classList.toggle('active')
            e.target.classList.toggle('active')
            CALCULATOR_WINDOW.querySelector(`.bgr__table__content#${e.target.innerText}`).classList.toggle('hidden')
            link.href = laws[e.target.innerText]['link']
        })
    })

}

async function fetchLawyersFromSheet() {
    let apiKey = 'AIzaSyAzr0fEm6RGdcpYdYf3Fq3rVC9E9Am7wiI'
    let sheetId = '1c5lMFTcck5ihpSBAI6JnR27ZEGuDDCXy0wDcfPlDLRg'
    const ranges = ["'Offizielle Rechtsanwaltsliste'!F9:L47"];
    let lawyers = []


    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${ranges}?key=${apiKey}`)
        .then(response => {
            return response.json();
        })
        .then(function (data) {
            if (!data.values) return
            data.values.forEach(function (row) {
                if (row.length === 0 || row.length < 6 || row[1] === '') return
                lawyers.push(row)
            })
        })
    loadLawyers(lawyers)
}

function loadLawyers(data) {
    data.forEach(function (lawyer) {

        let caution = ''
        if (lawyer[6]==='FALSE'){
            caution = 'caution'
        }

        let lawyerItem = `<div class="list__row ${caution}">
                <div class="list__item">
                ${lawyer[2]}
                </div>
                <div class="list__item">
                ${lawyer[3]}
                </div>
                <div class="list__item">
                ${lawyer[1]}
                </div>
            </div>`

        LAWYERS_WINDOW.querySelector('.lawyers__list').innerHTML += lawyerItem;
    })
}

function onClearSearchButtonClick() {
    CALCULATOR_WINDOW.querySelector('.bgr__search__clear').addEventListener('click', function () {
        CALCULATOR_WINDOW.querySelector('.bgr__searchbar input[type="text"]').value = ''
        getSearchResults()
    })
}

function loadColors() {
    COLOR_INPUT_IDS.forEach(function (id) {
        let localStorageValue = localStorage.getItem(id)

        if (localStorageValue) {
            SETTINGS_WINDOW.querySelector('.bgr__color #'+id).value = localStorageValue
            document.querySelector('body').style.setProperty(COLOR_MAPPING[id], localStorageValue)
        } else {
            SETTINGS_WINDOW.querySelector('.bgr__color #'+id).value = getComputedStyle(CALCULATOR_WINDOW).getPropertyValue(COLOR_MAPPING[id])
        }
    })
}

function onColorSelectChange() {
    colorInputs = SETTINGS_WINDOW.querySelectorAll('.bgr__color input[type="color"]')

    colorInputs.forEach(function (colorInput) {
        colorInput.addEventListener('change', function (e) {
            let element = e.target
            document.querySelector('body').style.setProperty(COLOR_MAPPING[element.id], element.value)
            localStorage.setItem(element.id, element.value)
        })
    })
}

function onColorsResetButtonClick() {
    SETTINGS_WINDOW.querySelector('.bgr__color__reset').addEventListener('click', function () {
        COLOR_INPUT_IDS.forEach(function (id){
            localStorage.setItem(id, getComputedStyle(CALCULATOR_WINDOW).getPropertyValue(COLOR_MAPPING[id]+'--base'))
        })
        loadColors()
    })
}