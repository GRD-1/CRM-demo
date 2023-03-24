/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для страницы "Админка"                                                         */
/*-----------------------------------------------------------------------------------------------*/
const hbs = require("hbs")
const ss = require('../config/style_and_script.js');
const styles = ss.get_stiles('/management');
const scripts = ss.get_scripts('/management');
const layouts = require('../config/layouts.js');
const db = require('../database/index');
const srv_response = require('../controllers/srv_response__ctr');

/*-----------------------------------------------------------------------------------------------*/
/*     Логирование                                                                               */
/*-----------------------------------------------------------------------------------------------*/

// Функция генерации табличной строки с ошибкой
function generate_row(log_obj, err_class){
    try{
        if (err_class === 'pg_error') {
            return `<tr class="${err_class}">
            <td class="log_time">${log_obj.log_time}</td>
            <td class="user_name">${log_obj.user_name}</td>
            <td class="database_name">${log_obj.database_name}</td>
            <td class="process_id">${log_obj.process_id}</td>
            <td class="connection_from">${log_obj.connection_from}</td>
            <td class="session_id">${log_obj.session_id}</td>
            <td class="session_line_num">${log_obj.session_line_num}</td>
            <td class="command_tag">${log_obj.command_tag}</td>
            <td class="session_start_time">${log_obj.session_start_time}</td>
            <td class="virtual_transaction_id">${log_obj.virtual_transaction_id}</td>
            <td class="transaction_id">${log_obj.transaction_id}</td>
            <td class="error_severity">${log_obj.error_severity}</td>
            <td class="sql_state_code">${log_obj.sql_state_code}</td>
            <td class="message">${log_obj.message}</td>
            <td class="detail">${log_obj.detail}</td>
            <td class="hint">${log_obj.hint}</td>
            <td class="internal_query">${log_obj.internal_query}</td>
            <td class="internal_query_pos">${log_obj.internal_query_pos}</td>
            <td class="context">${log_obj.context}</td>
            <td class="query">${log_obj.query}</td>
            <td class="query_pos">${log_obj.query_pos}</td>
            <td class="location">${log_obj.location}</td>
            <td class="application_name">${log_obj.application_name}</td>
            </tr>`
        }else{
            let date = new Date(log_obj.date_of_entry).toLocaleString()
            return `<tr class="${err_class}" ${ parseFloat(log_obj.delta) < 1 ? 'actual-row' : '' }><td class="err_id">${log_obj.id}</td><td class="err_date">[${date}]</td><td class="err_code">[${log_obj.code}]</td><td class="err_user_id">${log_obj.user_id}</td><td class="err_stack">${log_obj.stack}</td><td class="err_cause">${log_obj.cause}</td><td class="err_source">${log_obj.source}</td></tr>`
        }
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV3001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// Функция сборки шапки таблицы
function generate_console_header(err_class){
    try{
        let header_title = ''

        switch (err_class) {
            case 'client_error':
                header_title = 'Client Errors'
                break
            case 'server_error':
                header_title = 'Server Errors'
                break
            case 'database_error':
                header_title = 'DataBase Errors'
                break
            case 'undefined_error':
                header_title = 'Undefined Errors'
                break
            case 'all_error':
                header_title = 'All Errors'
                break
        }
        return `<div id="${err_class}_header" class="console_win_header"><div class="console_title">${header_title}</div><div class="header_btn_container"><a id="${err_class}_minimize" class="header_btn minimize_btn"><i class="fa fa-window-minimize" aria-hidden="true"></i></a><a id="${err_class}_full" class="header_btn full_btn"><i class="fa fa-window-maximize" aria-hidden="true"></i></a></div></div>`
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV3001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// Функция сортировки строк базы по переменным (в зависимости от класса ошибки)
function sort_errors(logs_arr, srv_err, cle_err, db_err, undefined_err){
    try{
        logs_arr.rows.forEach(function (log, i) { // Обходим массив с логами
            switch (log.class) {
                case "CLError" :
                    cle_err += generate_row(log, 'client_error')
                    break
                case "SRVError" :
                    srv_err += generate_row(log, 'server_error')
                    break
                case "DBError" :
                    db_err += generate_row(log, 'database_error')
                    break
                case "undefined" :
                    undefined_err += generate_row(log, 'undefined_error')
                    break
            }
        })
        return { cle_err : cle_err, srv_err : srv_err, db_err : db_err, undefined_err : undefined_err }
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV3001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// Функция генерации консолей
function generate_consoles(err_obj, table_head, content, dark_logs_mode){
    try{
        content += `<div id="logs_container" class="${ dark_logs_mode ? ' dark_logs_mode' : 'light_logs_mode' }">`
        if (err_obj.cle_err !== '')
            content += `<div id="client_console" class="console_win">${generate_console_header('client_error')}<div class="console_content"><table>${table_head}${err_obj.cle_err}</table></div></div>`
        if (err_obj.srv_err !== '')
            content += `<div id="server_console" class="console_win">${generate_console_header('server_error')}<div class="console_content"><table>${table_head}${err_obj.srv_err}</table></div></div>`
        if (err_obj.db_err !== '')
            content += `<div id="database_console" class="console_win">${generate_console_header('database_error')}<div class="console_content"><table>${table_head}${err_obj.db_err}</table></div></div>`
        if (err_obj.undefined_err !== '')
            content += `<div id="undefined_console" class="console_win">${generate_console_header('undefined_error')}<div class="console_content"><table>${table_head}${err_obj.undefined_err}</table></div></div>`
        content += `</div>`
        return content
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV3001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// Функция генерации консолей общего окна
function generate_consoles_all(all_err, table_head, content, dark_logs_mode){
    try{
        content += `<div id="logs_container" class="${ dark_logs_mode ? ' dark_logs_mode' : 'light_logs_mode' }">`
        if (all_err !== '')
            content += `<div id="all_err_console" class="console_win">${generate_console_header('all_error')}<div class="console_content"><table>${table_head}${all_err}</table></div></div>`
        content += `</div>`
        return content
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV3001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// Функция собирает целиком контент страницы категории "Логи"
async function generate_logs_body(logs_db_name, filters){
    try{
        let db_response = await db.multi_request(`SELECT value FROM th_config.client_config WHERE variable = 'multi_window_logs_mode'`, undefined, false) // Выводить в режиме мультиоконности
        let multiwin_mode = db_response.res.rows[0].value

        db_response = await db.multi_request(`SELECT value FROM th_config.client_config WHERE variable = 'dark_logs_mode'`, db_response.pool, false) // Выводить тёмную тему
        let dark_logs_mode = db_response.res.rows[0].value

        let content = '' // тело страницы "Логи"
        let table_head = '' // Шапка таблиц внутри консолей
        let query = '' // Запрос к базе

        if (logs_db_name !== 'postgres_log'){ // для логов "Ошибки" и "События"
            table_head = '<tr class="table_head"><th class="err_id">ID</th><th class="err_date">Date</th><th class="err_code">Code</th><th class="err_user_id">User</th><th class="err_stack">Stack Trace<a class="table-filter-btn show_more_btn" open-cell="false"><i class="fa fa-plus"></i></a></th><th class="err_cause">Cause</th><th class="err_source">Location<a class="table-filter-btn show_more_btn" open-cell="false"><i class="fa fa-plus"></i></a></th></tr>'

            // формируем фильтры к запросу в базу
            let query_filters = ''

            if (filters){
                query_filters += ' WHERE'

                if (filters.user) query_filters += ` user_id = ${filters.user} and`
                if (filters.log_class) query_filters += ` class = '${filters.log_class}' and`
                if (filters.period_start) query_filters += ` date_of_entry >= '${filters.period_start}' and`
                if (filters.period_end) query_filters += ` date_of_entry <= '${filters.period_end}' and`

                query_filters = query_filters.substring(0, query_filters.length-3) // удалим последний "and"
            }

            query = `SELECT *, date_trunc('minute',date_of_entry), ((EXTRACT(EPOCH FROM current_timestamp) - (EXTRACT(EPOCH FROM date_of_entry)))/(3600*24)) as delta FROM logs.${logs_db_name}${query_filters} ORDER BY date_of_entry DESC LIMIT 500`
        }else{ // для логов "postgres"
            table_head = '<tr class="table_head"><th class="log_time">Log time</th><th class="user_name">User name</th><th class="database_name">Database name</th><th class="process_id">Process id</th><th class="connection_from">Connection from</th><th class="session_id">Session id</th><th class="session_line_num">Session line num</th><th class="command_tag">Command tag</th><th class="session_start_time">Session start time</th><th class="virtual_transaction_id">Virtual transaction id</th><th class="transaction_id">Transaction id</th><th class="error_severity">Error severity</th><th class="sql_state_code">sql_state_code</th><th class="message">Message</th><th class="detail">Detail</th><th class="hint">Hint</th><th class="internal_query">Internal query</th><th class="internal_query_pos">Internal query pos</th><th class="context">Context</th><th class="query">Query</th><th class="query_pos">Query pos</th><th class="location">Location</th><th class="application_name">Application name</th></tr>'
            query = `SELECT * FROM logs.${logs_db_name} ORDER BY log_time DESC LIMIT 500`
        }

        db_response = await db.multi_request(query, db_response.pool, true)
        let logs_arr = await  db_response.res;

        if (logs_db_name !== 'postgres_log'){
            if (multiwin_mode){
                let srv_err = '' // контент серверных ошибок
                let cle_err = '' // контент клиентских ошибок
                let db_err = '' // контент ошибок базы
                let undefined_err = '' // контент неопознанных ошибок

                let err_obj = sort_errors(logs_arr, srv_err, cle_err, db_err, undefined_err) // Получим объект с массивами сортированных по классу ошибок
                content = generate_consoles(err_obj, table_head, content, dark_logs_mode) // Формируем консоли с ошибками (контент страницы)
            }else{
                let all_err = '' // контент всех ошибок

                logs_arr.rows.forEach(function (log, i) { // Обходим массив с логами
                    switch (log.class) {
                        case "CLError" :
                            all_err += generate_row(log, 'client_error')
                            break
                        case "SRVError" :
                            all_err += generate_row(log, 'server_error')
                            break
                        case "DBError" :
                            all_err += generate_row(log, 'database_error')
                            break
                        case "undefined" :
                            all_err += generate_row(log, 'undefined_error')
                            break
                    }
                })

                content = generate_consoles_all(all_err, table_head, content, dark_logs_mode) // Формируем консоли с ошибками (контент страницы)
            }
        }else{ // Вывод content для pg_log
            let pg_logs = '' // контент всех ошибок

            logs_arr.rows.forEach(function (log, i) { // Обходим массив с логами
                pg_logs += generate_row(log, 'pg_error')
            })

            content = generate_consoles_all(pg_logs, table_head, content, dark_logs_mode) // Формируем консоли с ошибками (контент страницы)
        }

        content += '<div id="log_minimize_panel"></div>'

        return content
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV3001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// Отрисовка страницы "Логи (Ошибки)" (как главная страница Админки)
exports.logs = async function (request, response){
    try{
        let param = {
            alias: "Админка",
            username: "Admin",
            style_stack: styles,
            script_stack: scripts,
            layout: await layouts.get_layout('/management')
        };
        if(param.layout === "layouts/maintenance") {
            let options = {
                view: "partials/preloader.hbs",
                data: param
            };
            return await srv_response.response_dispatch(request, response, options);
        }
        const dropdown_list__func = require("../functions/dropdown_list__func");
        await dropdown_list__func.all_filters();
        let content = await generate_logs_body('app_error_log')

        hbs.registerHelper("content", new hbs.SafeString(content))
        await srv_response.response_dispatch(request, response, {data: param, view: "management.hbs"});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Отрисовка страницы "Логи (Ошибки)"
exports.logs_errors = async function (request, response){
    try{
        let content = await generate_logs_body('app_error_log', request.body.data)
        await srv_response.response_dispatch(request, response, {data: content});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Отрисовка страницы "Логи (события)"
exports.log_events = async function (request, response){
    try{
        let content = await generate_logs_body('app_event_log', request.body.data)
        await srv_response.response_dispatch(request, response, {data: content});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Отрисовка страницы "Логи (Postgres)"
exports.logs_pg = async function (request, response){
    try{
        let content = await generate_logs_body('postgres_log')
        await srv_response.response_dispatch(request, response, {data: content});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Включение режима мультиоконности
exports.multiwin_mode = async function (request, response){
    try{
        let db_response = await db.single_request(`UPDATE th_config.client_config SET value = NOT value WHERE variable = 'multi_window_logs_mode'`);
        await srv_response.response_dispatch(request, response, {status: 200});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Фильтрация логов
exports.filter_list__users = async function (request, response){
    try{
        let user_list = await db.single_request(`SELECT id, login FROM th_accounts.users`);
        let content = '<option></option>'
        user_list.rows.forEach(function (user) {
            content += `<option user_id="${user.id}" user_login="${user.login}">${user.login}</option>`
        })
        await srv_response.response_dispatch(request, response, {data: content});
    }catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

/*-----------------------------------------------------------------------------------------------*/
/*     Общие настройки                                                                           */
/*-----------------------------------------------------------------------------------------------*/

// Функция создания группы инпутов из массива значений базы
function generate_input_group(config_arr){
    try{
        let content = ''
        config_arr.forEach(function (item) {
            content += `<div class="input-group">`
            content += `<label for="${item.variable}_checkbox">${item.description}</label>`
            content += `<input id="${item.variable}_checkbox" type="checkbox" conf_value="${item.variable}"`
            if ((item.value === true) || (item.value === 'true')) content += ' checked'
            content += `>`
            content += `</div>`
        })
        return content
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV3001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// Отрисовка страницы "Общие настройки"
exports.settings_general = async function (request, response){
    try{
        let param = {
            alias: "Админка",
            username: "Admin",
            style_stack: styles,
            script_stack: scripts,
        }

        let client_content = '' // Содержимое настроек клиента
        let db_content = '' // Содержимое настроек базы

        let db_response = await db.multi_request(`SELECT * FROM th_config.client_config`, undefined, false)
        client_content += generate_input_group(db_response.res.rows)

        db_response = await db.multi_request(`SELECT * FROM th_config.database_config`, db_response.pool, true)
        db_content += generate_input_group(db_response.res.rows)

        hbs.registerHelper("client_content", new hbs.SafeString(client_content))
        hbs.registerHelper("db_content", new hbs.SafeString(db_content))

        await srv_response.response_dispatch(request, response, {data: param, view: "partials/management/settings.hbs"});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Изменение настроек
exports.set_settings = async function (request, response){
    try{
        let form_obj = request.body.data;
        let query = '';

        for ( let config_category in form_obj ) {
            for ( let config_value in form_obj[config_category] ) {
                query += `UPDATE th_config.${config_category} SET value = '${form_obj[config_category][config_value]}' WHERE variable = '${config_value}';`
            }
        }
        await db.single_request(query);
        await srv_response.response_dispatch(request, response, {status: 200});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Получение параметров настроек
exports.get_settings = async function (request, response){
    try{
        let variable = request.body.data.target // Целевой variable
        let setting_value = await db.single_request(`SELECT value FROM th_config.client_config WHERE variable = '${variable}'`);
        await srv_response.response_dispatch(request, response, {data: setting_value.rows[0]});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// Страница "пользователи сотрудники"
exports.users_home = async function (request, response){
    try{
        let stub = `<h1 style="margin: 10% 20%">Здесь пока ничего нет, но не беспокойтесь, что-то обязательно появится!</h1>`;
        await srv_response.response_dispatch(request, response, {data: stub});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
}

// Страница "пользователи заказчики"
exports.users_web = async function (request, response){
    try{
        let stub = `<h1 style="margin: 10% 20%">Здесь пока ничего нет, но не беспокойтесь, что-то обязательно появится!</h1>`;
        await srv_response.response_dispatch(request, response, {data: stub});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
}

/*-----------------------------------------------------------------------------------------------*/
/*     Страницы в разработке                                                                     */
/*-----------------------------------------------------------------------------------------------*/

// раздел "удаление данных"
exports.erase = async function (request, response){
    try {
        let stub = `<h1 style="margin: 10% 20%">Здесь пока ничего нет, но не беспокойтесь, что-то обязательно появится!</h1>`;
        await srv_response.response_dispatch(request, response, {data: stub});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// раздел "резервное копирование"
exports.backup = async function (request, response){
    try {
        let stub = `<h1 style="margin: 10% 20%">Здесь пока ничего нет, но не беспокойтесь, что-то обязательно появится!</h1>`;
        await srv_response.response_dispatch(request, response, {data: stub});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};
