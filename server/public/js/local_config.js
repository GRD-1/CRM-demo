/*------------------------------------------------------------------------------------------------------------------------------------------*/
/*		параметры загрузки страниц ( версии для локального запуска проекта )                                                                */
/*------------------------------------------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------------------------------------------*/
/*		модуль ассоциирует скрипты и стили с конечными страницами ( версии для локального запуска проекта )                                 */
/*------------------------------------------------------------------------------------------------------------------------------------------*/

// подключаем стили
function get_stiles(path) {

    var style_stack = Array();

    // для всех страниц
    style_stack.push('css/main.min.css');

    // для страниц "справочники", "заявки", "договоры", "отчеты"
    if (path === '/handbooks.html'
        || path === '/measurements.html'
        || path === '/contracts.html'
        || path === '/reports.html') {

        style_stack.push('css/handbooks.min.css');
        style_stack.push('css/chosen.min.css');
    }

    // для страниц "справочники", "админка", "о программе"
    if (path === '/handbooks.html'
        || path === '/management.html'
        || path === '/about_program.html') {

        style_stack.push('css/two_column_pages.min.css');
    }

    // для страницы "выход" (стр авторизации)
    if (path === '/login.html'){

        style_stack.push('css/page_login.min.css');
    }

    return style_stack;
}

// ++KHC270921 подключаем стили, которые необходимо подключить в head
function get_scripts_head(path) {
    var head_scripts_stack = Array();

    // для страницы "о программе"
    if (path === '/about_program.html' || '/about_program') {
        head_scripts_stack.push('js/ckeditor.js');
    }

    console.log(get_scripts_head) //DEBUG

    return head_scripts_stack
}

// скрипты
function get_scripts(path) {

    var script_stack = Array();
    var hb_mini = path.match('handbook_');

    // для всех страниц, кроме "мини-справочников"
    if(!hb_mini){
        script_stack.push('js/main.js');
    }

    // для страниц "справочники", "заявки", "договоры", "отчеты"
    if (path === '/handbooks.html'
        || path === '/measurements.html'
        || path === '/contracts.html'
        || path === '/reports.html') {

        script_stack.push('js/handbooks.js');
        script_stack.push('js/chosen.js');
        script_stack.push('js/chosen_listeners.js');
    }

    // для мини-справочников
    if(hb_mini){
        script_stack.push('js/chosen.js');
    }

    return script_stack;
}
/*------------------------------------------------------------------------------------------------------------------------------------------*/
/*		параметры загрузки страниц: редиректы, стили, скрипты ( версии для локального запуска проекта )                                     */
/*------------------------------------------------------------------------------------------------------------------------------------------*/

var path = document.location.pathname;

// редиректы
function redirect() {

    // с корневой страницы на стр. "заявки"
    if (path === '/') {
        document.location.href = '/measurements.html';
    }
}
redirect();

// стили
function add_styles() {

    var StyleStack = get_stiles(path);
    for(var i=0; i<StyleStack.length; i++){
        var styles = document.createElement('link');
        var StyleCase = document.querySelector('head');
        styles.rel = "stylesheet";
        styles.type = "text/css";
        styles.href = StyleStack[i];
        StyleCase.append(styles);
    }
}
add_styles();

// скрипты
function add_scripts() {
console.log('Скрипты') //DEBUG
    var ScriptStack = get_scripts(path);
    var HeadScriptStack = get_scripts_head(path);
    var script = document.createElement('script');
    var ScriptCase = document.querySelector('#ScriptCase');
    var footer = document.querySelector('footer');
    var head = document.querySelector('head');

    console.log(HeadScriptStack) //DEBUG

    if(ScriptCase == null){
        ScriptCase = document.createElement('div');
        ScriptCase.id = '#ScriptCase';
        ScriptCase.style = 'display: none';
        footer.after(ScriptCase);
    }

    for(var i=0; i<ScriptStack.length; i++){
        script = document.createElement('script');
        script.src = ScriptStack[i];
        script.async = false;
        ScriptCase.append(script);
    }

    for(var j=0; i<HeadScriptStack.length; j++){
        script = document.createElement('script');
        script.src = HeadScriptStack[j];
        script.async = false;
        head.append(script);
    }
}

document.addEventListener("DOMContentLoaded", add_scripts);