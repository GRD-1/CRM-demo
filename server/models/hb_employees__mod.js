/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Сотрудники"                                                */
/*-----------------------------------------------------------------------------------------------*/

const query_conditions = require("../functions/query_conditions__func.js");

// функция возвращает текст запроса к БД
exports.get_query = async function (request_body){
    try{
        let conditions = await query_conditions.conditions_handler(request_body);
        let data = await query_conditions.data_handler(request_body);
        switch (request_body.action) {
            case 'read':
                let target = request_body.target.slice(0,4);
                switch (target) {
                    case 'all':
                        return `SELECT id, full_name, position, status,
                                       replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_employees__central_table where delete_mark = false`;
                    case 'cent':
                        return `SELECT id, full_name, position, status,
                                       replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_employees__central_table ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_attachments':
                                return `SELECT * FROM data.attachments where table_id = 44444 and parent_record = ${request_body.record_id} and delete_mark = false order by date_of_entry desc`;
                            case "tab_personal_account":
                                return `SELECT * FROM views.hb_employees__tab_main where id = ${request_body.record_id}`;
                            default:
                                return `SELECT * FROM views.hb_employees__${request_body.target} where id = ${request_body.record_id}`;
                        }
                    case 'bloc':
                        switch (request_body.target) {
                            case "block_employee":
                                return `SELECT * FROM views.hb_employees__tab_main ${conditions}`;
                            case "block_employee_contacts":
                                return `SELECT * FROM views.hb_employees__tab_contacts ${conditions}`;
                            case "block_employee_identity":
                                return `SELECT * FROM views.hb_employees__tab_documents ${conditions}`;
                            case 'block_one_attachment':
                                return `SELECT * FROM data.attachments ${conditions} and table_id = 44444`;
                            case 'block_one_contact':
                                return `SELECT * FROM views.block_employee_contacts ${conditions}`;
                            case 'block_one_identity':
                                return `SELECT * FROM data.employee_identity ${conditions}`;
                        }
                }
                break;
            case 'insert':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        request_body.data["parent_record"] = request_body.data.employee;
                        delete request_body.data["employee"];
                        request_body.data["table_id"] = 44444;
                        data = await query_conditions.data_handler(request_body);
                        return `INSERT INTO data.attachments ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'block_one_contact':
                        return `INSERT INTO data.employee_contacts ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'block_one_identity':
                        return `INSERT INTO data.employee_identity ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'tab_contacts':
                    case 'tab_documents':
                        return undefined;
                    default:
                        return `INSERT INTO views.hb_employees__tab_main ${data.headers} VALUES ${data.values} RETURNING *`;
                }
            case 'update':
                switch (request_body.target) {
                    case "block_employee":
                        return `UPDATE views.hb_employees__tab_main SET ${data} ${conditions} RETURNING *`;
                    case 'block_one_attachment':
                        return `UPDATE data.attachments SET ${data} ${conditions} RETURNING *`;
                    case 'block_one_contact':
                        return `UPDATE data.employee_contacts SET ${data} ${conditions} RETURNING *`;
                    case 'block_one_identity':
                        return `UPDATE data.employee_identity SET ${data} ${conditions} RETURNING *`;
                    case 'tab_attachments':
                    case 'tab_contacts':
                    case 'tab_documents':
                        return undefined;
                    default:
                        return `UPDATE views.hb_employees__${request_body.target} SET ${data} ${conditions} RETURNING *`;
                }
            case 'delete':
                return `DELETE FROM views.hb_employees__tab_main WHERE ${conditions}`;
        }
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// данные вкладок блока "детализация" (и формы редактирования)
exports.get_helpers = async function (request_body, rec){
    try{
        if(!rec) return;
        const identity_docs_html = require('../functions/identity_docs__func');
        const contacts__func = require('../functions/contacts__func');
        const attachment_html = require('../functions/attachment__func');
        const accounts_func = require('../functions/accounts__func');
        let target = request_body.target.slice(0,4);

        // вкладка "основное". блок "сотрудник"
        let employee_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            employee_block_attributes = {open: true};
        }

        // вкладка "документы"
        let identity_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            identity_block_attributes = {addremove_btn: true};
        }
        let identity_docs = identity_docs_html.get_html(rec.docs,"Добавить документ", "employee", identity_block_attributes)
        let accounts = accounts_func.get_html(rec.accounts,"Добавить банк", "employee", identity_block_attributes) // ++KHC 20052022 Добавляем блок "Реквизиты"

        // вкладка "контакты"
        let contacts_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            contacts_block_attributes = {addremove_btn: true};
        }
        let employee_contacts = contacts__func.get_html(rec.employee_id,
            rec.employee_contacts,
            'Контакты сотрудника',
            contacts_block_attributes,
            "block_one_contact",
            2 ,
            "employee");

        // вкладка "приложения"
        let attachments_block_attributes = {}, attachments;
        if(target === 'edit' || target === 'bloc'){
            attachments_block_attributes = {addremove_btn: true};
        }
        attachments = attachment_html.get_html(request_body.target, rec,'Добавить файл', attachments_block_attributes, "employee");

        return {
            record_id: rec.id,
            employee: rec.id,
            employee_number: rec.employee_number,
            employee_full_name: rec.employee_full_name,
            employee_family_name: rec.employee_family_name,
            employee_first_name: rec.employee_first_name,
            employee_patronymic: rec.employee_patronymic,
            employee_position: rec.employee_position,
            employee_position_title: rec.employee_position_title,
            employee_status: rec.employee_status,
            employee_status_title: rec.employee_status_title,
            employee_block_attributes: employee_block_attributes,

            identity_docs: identity_docs,
            accounts: accounts,
            identity_block_attributes: identity_block_attributes,

            contacts_arr: employee_contacts,
            attachments_path: `twine_home/employees/${rec.id}/`,
            attachments: attachments,

            comment: rec.comment
        };
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}
