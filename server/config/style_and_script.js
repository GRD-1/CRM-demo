/*------------------------------------------------------------------------------------------------------------------------------------------*/
/*		модуль для подключения скриптов и стилей (серверная версия)                                                                         */
/*------------------------------------------------------------------------------------------------------------------------------------------*/

// подключаем стили
exports.get_stiles = function (path){

    let style_stack = Array();

    // для всех страниц
    style_stack.push('css/main.min.css');

    // для страниц "справочники", "заявки", "договоры", "отчеты"
    if (path === '/handbooks'
        || path === '/measurements'
        || path === '/contracts'
        || path === '/reports') {

        style_stack.push('css/handbooks.min.css');
        style_stack.push('css/chosen.min.css');
    }

    // для страниц "справочники", "админка", "о программе"
    if (path === '/handbooks'
        || path === '/management'
        || path === '/about_program') {

        style_stack.push('css/two_column_pages.min.css');
    }

    // для страницы "Админка"
    if (path === '/management'){
        style_stack.push('css/chosen.min.css');
    }

    // для страницы "О программе"
    if (path === '/about_program'){
        // style_stack.push('libs/ckeditor/styles.css');
    }

    // для страницы "выход" (стр авторизации)
    if (path === '/login'){
        style_stack.push('css/page_login.min.css');
    }

    return style_stack;
};

// подключаем скрипты
exports.get_scripts = function (path){

    let script_stack = Array();
    let hb_mini = path.match('handbook_');

    // для всех страниц
    script_stack.push('js/jquery.js');

    // для всех страниц, кроме "мини-справочников"
    if(!hb_mini){
        script_stack.push('js/errors.js');
        script_stack.push('js/main.js');
    }

    // для страниц "справочники", "заявки", "договоры", "отчеты"
    if (path === '/handbooks'
        || path === '/measurements'
        || path === '/contracts'
        || path === '/reports') {

        script_stack.push('js/handbooks.js');
        script_stack.push('js/chosen.js');
        script_stack.push('js/chosen_listeners.js');
    }

    // для страницы "Админка"
    if (path === '/management'){
        script_stack.push('js/management.js');
        script_stack.push('js/logs.js');
        script_stack.push('js/chosen.js');
        // script_stack.push('js/chosen_listeners.js');
    }

    // для страницы "О программе"
    if (path === '/about_program'){
        script_stack.push('js/about_program.js');
    }

    // для мини-справочников
    if(hb_mini){
        script_stack.push('js/chosen.js');
    }

    return script_stack;
};

// подключаем скрипты в head
exports.get_head_scripts = function (path){

    let head_scripts_stack = Array();

    // для страницы "О программе"
    if (path === '/about_program'){
        head_scripts_stack.push('https://cdn.ckeditor.com/4.14.0/standard/ckeditor.js');
    }

    return head_scripts_stack;
};