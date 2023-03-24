/*-----------------------------------------------------------------------------------------------*/
/*                модель данных для справочника "Пользователи"                                   */
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
                        return `SELECT id, customer, customer_fullname, source_type_title, customer_coef, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                                
                                FROM views.hb_customers__central_table where delete_mark = false limit 50`;
                    case 'cent':
                        return `SELECT id, customer, customer_fullname, source_type_title, customer_coef, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                                
                                FROM views.hb_customers__central_table ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_attachments':
                                return `SELECT * FROM data.attachments where table_id = 11111 and parent_record = ${request_body.record_id} and delete_mark = false order by date_of_entry desc`;
                            default:
                                return `SELECT * FROM views.hb_customers__${request_body.target} where id = ${request_body.record_id}`;
                        }
                    case 'bloc':
                        switch (request_body.target) {
                            case 'block_customer':
                                return `SELECT * FROM views.block_customer ${conditions}`;
                            case 'block_customer_contact_persons':
                                return `SELECT * FROM views.hb_customers__tab_contacts ${conditions}`;
                            case 'block_customer_contacts':
                                return `SELECT * FROM views.hb_customers__tab_contacts ${conditions}`;
                            case 'block_customer_identity':
                                return `SELECT * FROM twine_home.data.customer_identity ${conditions}`;
                            case 'block_one_attachment':
                                return `SELECT * FROM data.attachments ${conditions} and table_id = 11111`;
                            case 'block_one_contact':
                                return `SELECT * FROM views.block_customer_contacts ${conditions}`;
                            case 'block_one_contact_person':
                                return `SELECT * FROM data.customer_contact_persons ${conditions}`;
                            case 'block_one_contact_person_contact':
                                return `SELECT * FROM data.customer_contact_person_contacts ${conditions}`;
                            case 'block_one_identity':
                                return `SELECT * FROM data.customer_identity ${conditions}`;
                        }
                }
                break;
            case 'insert':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        request_body.data[0].name = "parent_record";
                        request_body.data[request_body.data.length] = {name: 'table_id', value: '11111'};
                        data = await query_conditions.data_handler(request_body);
                        return `INSERT INTO data.attachments ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'tab_contacts':
                    case 'tab_documents':
                        return undefined;
                    default:
                        return `INSERT INTO views.hb_customers__tab_main ${data.headers} VALUES ${data.values} RETURNING *`;
                }
            case 'update':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        return `UPDATE data.attachments SET ${data} ${conditions} RETURNING *`;
                    case 'tab_attachments':
                    case 'tab_contacts':
                    case 'tab_documents':
                        return undefined;
                    default:
                        return `UPDATE views.hb_customers__${request_body.target} SET ${data} ${conditions} RETURNING *`;
                }
            case 'delete':
                return `DELETE FROM views.hb_customers__tab_main WHERE ${conditions}`;
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
        const customer_source = require('../functions/customer_source__func');
        const contacts_func = require('../functions/contacts__func');
        const cont_persons = require('../functions/contact_persons__func');
        const attachment_func = require('../functions/attachment__func');
        const identity_docs_func = require('../functions/identity_docs__func');
        let target = request_body.target.slice(0,4);

        // вкладка "основное". блок "заказчик"
        let customer_source_param = await customer_source.get_param(rec);
        let customer_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            customer_block_attributes = {open: true};
        }

        // вкладка "контакты". блок "контакты заказчика"
        let contacts_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            contacts_block_attributes = {addremove_btn: true};
        }
        let customer_contacts = contacts_func.get_html(rec.customer_id,
            rec.customer_contacts,
            'Контакты заказчика',
            contacts_block_attributes,
            "block_one_contact",
            2,
            "customer_id");

        // вкладка "контакты". блок "контактные лица заказчика"
        let contact_persons_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            contact_persons_block_attributes = {addremove_btn: true};
        }
        let contact_persons = cont_persons.get_html(rec.contact_person_contacts,"Контактные лица заказчика", contact_persons_block_attributes);

        // вкладка "приложения"
        let attachments_block_attributes = {}, attachments;
        if(target === 'edit' || target === 'bloc'){
            attachments_block_attributes = {addremove_btn: true};
        }
        attachments = attachment_func.get_html(request_body.target, rec,'Добавить файл', attachments_block_attributes, "customer");

        // вкладка "документы"
        let identity_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            identity_block_attributes = {addremove_btn: true};
        }
        let identity_docs = identity_docs_func.get_html(rec.docs,"Документы заказчика", "customer", identity_block_attributes);

        return {
            record_id: rec.id,
            customer: rec.id,
            customer_fullname: rec.customer_fullname,
            customer_jname: rec.customer_jname,
            customer_family: rec.customer_family,
            customer_name: rec.customer_name,
            customer_patronymic: rec.customer_patronymic,
            source_type: rec.source_type,
            source_type_title: rec.source_type_title,
            customer_source_param: customer_source_param,
            customer_block_attributes: customer_block_attributes,
            customer_coef: rec.customer_coef,
            comment: rec.comment,

            contacts_arr: customer_contacts,
            contact_persons: contact_persons,

            identity_docs: identity_docs,
            identity_block_attributes: identity_block_attributes,

            login: rec.login,
            nickname: rec.nickname,
            avatar: rec.avatar,
            notifications: rec.notifications,
            notifications_title: rec.notifications_title,

            attachments_path: `twine_home/customers/${rec.id}/`,
            attachments: attachments
        };
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}
