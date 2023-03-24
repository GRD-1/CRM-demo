/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Заявки"                                                    */
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
                        return `SELECT id, measurement_number, measurement_date_of_request, customer_alias, object_title,
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_measurements__central_table where delete_mark = false order by measurement_number desc`;
                    case 'cent':
                        return `SELECT id, measurement_number, measurement_date_of_request, customer_alias, object_title,
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_measurements__central_table ${conditions} order by measurement_number desc`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_attachments':
                                return `SELECT * FROM data.attachments where table_id = 22222 and parent_record = ${request_body.record_id} and delete_mark = false order by date_of_entry desc`;
                            case 'tab_estimates':
                                return `SELECT * FROM views.hb_measurements__tab_estimates where measurement = ${request_body.record_id}`;
                            default:
                                return `SELECT * FROM views.hb_measurements__${request_body.target} where id = ${request_body.record_id}`;
                        }
                    case 'bloc':
                        switch (request_body.target) {
                            case 'block_measurement':
                                return `SELECT * FROM views.block_measurement ${conditions}`;
                            case 'block_one_attachment':
                                return `SELECT * FROM data.attachments ${conditions} and table_id = 22222`;
                        }
                }
                break;
            case 'insert':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        request_body.data["parent_record"] = request_body.data.measurement;
                        delete request_body.data["measurement"];
                        request_body.data["table_id"] = 22222;
                        data = await query_conditions.data_handler(request_body);
                        return `INSERT INTO data.attachments ${data.headers} VALUES ${data.values} RETURNING *`;
                    default:
                        return `INSERT INTO views.hb_measurements__tab_main ${data.headers} VALUES ${data.values} RETURNING *`;
                }
            case 'update':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        return `UPDATE data.attachments SET ${data} ${conditions} RETURNING *`;
                    case 'block_measurement':
                        return `UPDATE views.hb_measurements__tab_main SET ${data} ${conditions} RETURNING *`;
                    case 'tab_conditions':
                        return `UPDATE views.hb_measurements__tab_conditions SET ${data} ${conditions} RETURNING *`;
                    case 'tab_history':
                        return `UPDATE views.hb_measurements__tab_history SET ${data} ${conditions} RETURNING *`;
                    case 'tab_attachments':
                    case 'tab_contacts':
                    case 'tab_project_team':
                    case 'tab_estimates':
                        return undefined;
                    default:
                        return `UPDATE views.hb_measurements__${request_body.target} SET ${data} ${conditions} RETURNING *`;
                }
            case 'delete':
                return `DELETE FROM views.hb_measurements__tab_main WHERE ${conditions}`;
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
        const attachment_html = require('../functions/attachment__func');
        const project_team_func = require('../functions/project_team__func');
        let target = request_body.target.slice(0,4);

        // вкладка "основное". блок "заказчик"
        let customer_source_param = await customer_source.get_param(rec);
        let customer_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            if(!rec.id){
                customer_block_attributes = {blocked: true, "data-addfromlist": true, "data-addfromlist_btn": true};
            }
        }

        // вкладка "основное". блок "объект"
        let object_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            if(!rec.id){
                object_block_attributes = {blocked: true, "data-addfromlist": true, "data-addfromlist_btn": true};
            }
        }

        // вкладка "основное". блок "заявка"
        let measurement_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            measurement_block_attributes = {open: true};
        }

        // вкладка "контакты". блок "контакты заказчика"
        let contacts_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            contacts_block_attributes = {addremove_btn: true};
        }
        let customer_contacts = contacts_func.get_html(rec.customer_id,
            rec.customer_contacts,
            'Контакты заказчика',
            contacts_block_attributes,
            "block_one_contact",
            2,
            "customer");

        // вкладка "контакты". блок "контактные лица заказчика"
        let contact_persons_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            contact_persons_block_attributes = {addremove_btn: true};
        }
        let contact_persons = cont_persons.get_html(rec.contact_person_contacts,"Контактные лица заказчика", contact_persons_block_attributes);

        // вкладка "сметы"
        let estimate_block_attributes = {}, estimates;
        if(target === 'edit' || target === 'bloc'){
            // estimate_block_attributes = {addremove_btn: true}; // ++GRD 27072022 закомментировал
        }
        estimates = attachment_html.get_html(request_body.target, rec,'Добавить смету', estimate_block_attributes, "report");

        // вкладка "приложения"
        let attachments_block_attributes = {}, attachments;
        if(target === 'edit' || target === 'bloc'){
            attachments_block_attributes = {addremove_btn: true};
        }
        attachments = attachment_html.get_html(request_body.target, rec,'Добавить файл', attachments_block_attributes, "measurement");

        // вкладка "Условия", блок "Схема расчета"
        let estimate_cond_block_attributes = {blocked: true, open: true};
        if(target === 'edit' || target === 'bloc'){
            estimate_cond_block_attributes = {"data-addfromlist": true, open: true};
        }

        // вкладка "команда"
        let project_team_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            project_team_block_attributes = {};
        }
        let project_team = project_team_func.get_html(rec,'Добавить сотрудника', project_team_block_attributes);

        return {
            record_id: rec.id,
            measurement: rec.id,
            measurement_number: rec.measurement_number,
            measurement_type: rec.measurement_type,
            measurement_type_title: rec.measurement_type_title,
            measurement_quality: rec.measurement_quality,
            measurement_quality_title: rec.measurement_quality_title,
            measurement_status: rec.measurement_status,
            measurement_status_title: rec.measurement_status_title,
            measurement_method: rec.measurement_method,
            measurement_method_title: rec.measurement_method_title,
            object_acceptance: rec.object_acceptance,
            object_acceptance_title: rec.object_acceptance_title,
            measurement_department: rec.measurement_department,
            measurement_department_title: rec.measurement_department_title,
            measurement_date_of_request: rec.measurement_date_of_request,
            measurement_date_of_measurement: rec.measurement_date_of_measurement,
            measurement_date_of_estimate: rec.measurement_date_of_estimate,
            measurement_block_attributes: measurement_block_attributes,

            customer: rec.customer,
            customer_fullname: rec.customer_fullname,
            customer_alias: rec.customer_alias,
            customer_jname: rec.customer_jname,
            customer_family: rec.customer_family,
            customer_name: rec.customer_name,
            customer_patronymic: rec.customer_patronymic,
            source_type: rec.source_type,
            source_type_title: rec.source_type_title,
            customer_source_param: customer_source_param,
            customer_block_attributes: customer_block_attributes,

            object: rec.object,
            object_address: rec.object_address,
            object_number: rec.object_number,
            object_title: rec.object_title,
            object_city: rec.object_city,
            object_district: rec.object_district,
            object_street: rec.object_street,
            object_house_number: rec.object_house_number,
            object_building: rec.object_building,
            object_letter: rec.object_letter,
            object_apartment_number: rec.object_apartment_number,
            object_post_index: rec.object_post_index,
            object_block_attributes: object_block_attributes,

            customer_coef: rec.customer_coef,

            estimate_conditions: rec.estimate_conditions,
            estcond_title: rec.estcond_title,
            estcond_default: rec.estcond_default,
            estcond_default_title: rec.estcond_default_title,
            estcond_coef: rec.estcond_coef,
            estcond_special_price: rec.estcond_special_price,
            estcond_remote_control: rec.estcond_remote_control,
            estcond_restrictions: rec.estcond_restrictions,
            estcond_remoteness: rec.estcond_remoteness,
            estcond_discount: rec.estcond_discount,
            estcond_overhead_cost: rec.estcond_overhead_cost,
            estcond_chores: rec.estcond_chores,
            estimate_cond_block_attributes: estimate_cond_block_attributes,

            contacts_arr: customer_contacts,
            contact_persons: contact_persons,

            attachments_path: `twine_home/measurements/${rec.measurement_number}/`,
            attachments: attachments,
            estimates: estimates,

            project_team: project_team,
            project_team_block_attributes: project_team_block_attributes,

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