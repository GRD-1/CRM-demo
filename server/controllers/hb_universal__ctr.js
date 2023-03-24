/*-----------------------------------------------------------------------------------------------*/
/*     универсальный контроллер для всех справочников                                            */
/*-----------------------------------------------------------------------------------------------*/

const srv_response = require('../controllers/srv_response__ctr');

/* обработчик универсального запроса. универсальный запрос приходит при запросе/отправке любых данных из справочника
    подключаем нужную модель данных
    отправляем запрос в базу
    обрабатываем ответ базы
    получаем путь к представлению (hbs шаблону)
    отправляем данные на клиент
*/
exports.request_handler = async function (request, response){
    try{
        // ++KHC260522 Если target = block_one_identity_N - отправляем соответствующую вьюшку в обход всех функций обработки
        if (/^block_one_identity_[0-9]/gm.test(request.body.target)) return await response_identity_type(request, response)

        let hb_title = await get_hb_title(request.body.source);
        request.body.hb_title = hb_title;
        let handbook_list = request.path.match('handbook_list');

        // подключаем модель данных
        let data_mod_path = await get_data_mod(request.body, hb_title, handbook_list)
        const data_mod = require(data_mod_path);

        // отправляем запрос в базу
        let db_response = await db_request(request.body, data_mod);

        // обрабатываем ответ базы
        let data = await data_handler(request.body, data_mod, hb_title, db_response)

        // получаем путь к представлению (hbs шаблону)
        let view = await get_view(request.path, request.body, handbook_list, hb_title);

        // отправляем данные на клиент
        await srv_response.response_dispatch(request, response, {data: data, view: view});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при обработке запроса сервером! причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err, clear: true});
    }
};

// отправляем запрос в базу
async function db_request(request_body, data_mod){
    try {
        let query = await get_db_query(request_body, data_mod);
        if(!query){return undefined}
        const db = require('../database/index');
        let db_response = await db.single_request(query);
        if(request_body.target === 'all' && db_response.rows[0]) {
            let subrequest = {source: request_body.source, target: 'tab_main', action: 'read', record_id: db_response.rows[0].id};
            let query2 = await get_db_query(subrequest, data_mod);
            let db_response2 = await db.single_request(query2);
            return {central_table: db_response.rows, tab_main: db_response2.rows[0]};
        }
        return db_response.rows;
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при запросе к БД. причина: ${err.message}`)
        }
        throw err;
    }
}

// получаем текст запроса к БД
async function get_db_query(request_body, data_mod){

    try {
        let query;
        switch (request_body.action) {
            case "file_loading":
                return undefined;
            case "read":
                if(request_body.record_id === "new_record"){
                    return undefined;
                }
                if(request_body.target.match("edit_form")){
                    let sp_query = Object.assign({}, request_body);
                    if(request_body.target === "edit_form"){
                        sp_query.target = "tab_main";
                    }
                    else {
                        sp_query.target = request_body.target.slice(10);
                    }
                    query = await data_mod.get_query(sp_query);
                }
                else {
                    query = await data_mod.get_query(request_body);
                }
                break;
            default:
                query = await data_mod.get_query(request_body);
        }
        return query;
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при получении запроса к базе. причина: ${err.message}`)
        }
        throw err;
    }
}

// обрабатываем данные, полученные из БД
async function data_handler(request_body, data_mod, hb_title, db_response) {

    try{
        const dropdown_list__func = require("../functions/dropdown_list__func");
        const central_table_records = require("../functions/central_table_records__func.js");

        let data = {}, cent_table_records = {}, details_tab_helpers = {}, ef_helpers = {};
        if(!request_body.response_preform){
            request_body.response_preform = {};
        }
        switch (request_body.action) {
            case "read":
                let target = request_body.target.slice(0,4);
                switch (target) {
                    case 'all':
                        cent_table_records = await central_table_records.get_html(db_response.central_table)
                        details_tab_helpers = await data_mod.get_helpers(request_body, db_response.tab_main);
                        await dropdown_list__func.all_lists(hb_title);
                        await dropdown_list__func.all_filters(hb_title);
                        data = Object.assign(request_body.response_preform, cent_table_records, details_tab_helpers);
                        break;
                    case 'cent':
                        data = await central_table_records.get_html(db_response);
                        break;
                    case 'tab_':
                        if(!db_response){return}
                        switch (request_body.target) {
                            case "tab_attachments":
                            case "tab_estimates":
                                data = await data_mod.get_helpers(request_body, db_response);
                                break;
                            default:
                                data = await data_mod.get_helpers(request_body, db_response[0]);
                        }
                        break;
                    case 'edit':
                        const edit_form__mod = require('../models/edit_form__mod');
                        ef_helpers = await edit_form__mod.get_helpers(request_body, hb_title);
                        if(db_response){
                            switch (request_body.target) {
                                case "edit_form/tab_attachments":
                                case "edit_form/tab_estimates":
                                    details_tab_helpers = await data_mod.get_helpers(request_body, db_response);
                                    break;
                                default:
                                    details_tab_helpers = await data_mod.get_helpers(request_body, db_response[0]);
                            }
                        }
                        else {
                            details_tab_helpers = await data_mod.get_helpers(request_body, {});
                        }
                        data = Object.assign(ef_helpers, details_tab_helpers);
                        break;
                    case 'list':
                    case 'filt':
                        data = await dropdown_list__func.certain_list(db_response);
                        break;
                    case 'bloc':
                        data = await data_mod.get_helpers(request_body, db_response[0]);
                        break;
                }
                break;
            case "insert":
            case "update":
                data = db_response;
                break;
            case "delete":
                break;
            case "file_loading":
                const file_loading = require("../functions/file_uploading__func.js");
                data = await file_loading.run(request_body.data[0])
                break;
        }
        return data;
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не удалось обработать ответ базы. причина: ${err.message}`)
        }
        throw err;
    }
}

// получаем путь к модели данных
async function get_data_mod(request_body, hb_title, handbook_list){
    try{
        let target = request_body.target.slice(0,4);
        switch (target) {
            case 'list':
            case 'filt':
                return '../models/dropdown_list__mod.js';
            case 'bloc':
                switch (request_body.target) {
                    case "block_contract":
                        return '../models/hb_contracts__mod.js';
                    case "block_customer":
                        return '../models/hb_customers__mod.js';
                    case "block_customer_contact_persons":
                        return '../models/hb_customers__mod.js';
                    case "block_customer_contacts":
                        return '../models/hb_customers__mod.js';
                    case "block_customer_identity":
                        return '../models/hb_customers__mod.js';
                    case "block_department":
                        return '../models/hb_departments__mod.js';
                    case "block_department_bank_account":
                        return '../models/hb_department_bank_accounts__mod.js';
                    case "block_employee":
                        return '../models/hb_employees__mod.js';
                    case "block_employee_contacts":
                        return '../models/hb_employees__mod.js';
                    case "block_employee_identity":
                        return '../models/hb_employees__mod.js';
                    case "block_estimate_condition":
                        return '../models/hb_estimate_conditions__mod.js';
                    case "block_measurement":
                        return '../models/hb_measurements__mod.js';
                    case "block_object":
                        return '../models/hb_objects__mod.js';
                    case "block_one_attachment":
                        switch (hb_title) {
                            case "hb_contracts":
                                return '../models/hb_contracts__mod.js';
                            case "hb_customers":
                                return '../models/hb_customers__mod.js';
                            case "hb_measurements":
                                return '../models/hb_measurements__mod.js';
                            case "hb_reports":
                                return '../models/hb_reports__mod.js';
                            case "hb_departments":
                                return '../models/hb_departments__mod.js';
                            case "hb_employees":
                                return '../models/hb_employees__mod.js';
                        }
                        break
                    case "block_one_contact":
                        switch (hb_title) {
                            case "hb_contracts":
                                return '../models/hb_contracts__mod.js';
                            case "hb_customers":
                            case "hb_measurements":
                                return '../models/hb_customers__mod.js';
                            case "hb_employees":
                                return '../models/hb_employees__mod.js';
                        }
                        break
                    case "block_one_contact_person":
                    case "block_one_contact_person_contact":
                        return '../models/hb_customers__mod.js';
                    case "block_one_identity":
                        switch (hb_title) {
                            case "hb_customers":
                                return '../models/hb_customers__mod.js';
                            case "hb_employees":
                                return '../models/hb_employees__mod.js';
                        }
                        break
                    case "block_payment_condition":
                        return '../models/hb_payment_conditions__mod.js';
                    case "block_report":
                        return '../models/hb_reports__mod.js';
                }
                break;
            default:
                if(handbook_list){
                    return '../models/hb_universal_list__mod.js';
                }
                return '../models/' + hb_title + '__mod.js';
        }
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не найдена модель данных. причина: ${err.message}`)
        }
        throw err;
    }
}

// получаем путь к hbs шаблону
async function get_view(request_path, request_body, handbook_list, hb_title) {
    try {
        let folder;
        if(handbook_list){
            folder = 'partials/hb_list/';
        }
        else {
            folder = 'partials/' + hb_title + '/';
        }

        let target = request_body.target.slice(0,4);
        switch (request_body.action) {
            case 'read':
                switch (target) {
                    case 'all':
                        if (hb_title === 'hb_users_web'){
                            return folder + 'all.hbs';
                        }else if(request_body.response_preform.handbook_name) {
                            return 'handbooks.hbs';
                        }
                        else {
                            return folder + 'all.hbs';
                        }
                    case 'cent':
                        if(request_body.record_id) {
                            return undefined;
                        }
                        else {
                            return folder + 'central_table.hbs';
                        }
                    case 'tab_':
                        return folder + request_body.target + '.hbs';
                    case 'edit':
                        if(request_body.source.match("btn_add") || request_body.source.match("btn_update")) {
                            const edit_form_build = require('../functions/edit_form_build__func');
                            await edit_form_build.run(hb_title, "tab_main", request_body.record_id);
                            return 'partials/hb_edit_form.hbs';
                        }
                        else {
                            return folder + request_body.target.slice(10) + '.hbs';
                        }
                    case 'bloc':
                        if (request_body.target === 'block_one_identity'){
                            return `partials/blocks/identities/${request_body.target}.hbs`;
                        }
                        return `partials/blocks/${request_body.target}.hbs`;
                }
                break;
            case 'insert':
            case 'update':
            case 'delete':
            case 'file_loading':
                return undefined;
        }
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не удалось получить путь к представлению. причина: ${err.message}`)
        }
        throw err;
    }
}

// получаем имя справочника
async function get_hb_title(path) {

    try{
        let hb_title;
        let arr = path.split("/");
        for(let i=0;i<arr.length; i++){
            if(arr[i].match('handbook_')){
                hb_title = (arr[i].replace('.html', '')).replace('handbook_', 'hb_');
            }
        }
        return hb_title;
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не удалось получить имя справочника. причина: ${err.message}`)
        }
        throw err;
    }
}

/* ++KHC26052022 отправляем вьюшку не заполненную данными без обработки (для типов документов) */
async function response_identity_type(request, response){
    try {
        let view_name
        let type_id = request.body.target.replace('block_one_identity_','')

        switch (type_id){
            case '1':
                view_name = 'passport'
                break
            case '2':
                view_name = 'TIN'
                break
            case '3':
                view_name = 'snils'
                break
            default:
                new Error()
        }
        return await srv_response.response_dispatch(request, response, {view: `partials/blocks/identities/block_identity_${view_name}.hbs`});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не удалось получить шаблон документа. причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
}
