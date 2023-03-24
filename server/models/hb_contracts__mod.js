/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Договоры"                                                  */
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
                        return `SELECT id, contract_number, ctr_date_of_signing, customer_alias, object_title, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_contracts__central_table where delete_mark = false`;
                    case 'cent':
                        return `SELECT id, contract_number, ctr_date_of_signing, customer_alias, object_title, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_contracts__central_table ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_attachments':
                                return `SELECT * FROM data.attachments where table_id = 33333 and parent_record = ${request_body.record_id} and delete_mark = false order by date_of_entry desc`;
                            case 'tab_period':
                            case 'tab_cost':
                            case 'tab_history':
                                return undefined;
                            default:
                                return `SELECT * FROM views.hb_contracts__${request_body.target} where id = ${request_body.record_id}`;
                        }
                    case 'bloc':
                        switch (request_body.target) {
                            case 'block_contract':
                                return `SELECT * FROM views.block_contract ${conditions}`;
                            case 'block_one_attachment':
                                return `SELECT * FROM data.attachments ${conditions} and table_id = 33333`;
                        }
                }
                break;
            case 'insert':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        request_body.data["parent_record"] = request_body.data.contract;
                        delete request_body.data["contract"];
                        request_body.data["table_id"] = 33333;
                        data = await query_conditions.data_handler(request_body);
                        return `INSERT INTO data.attachments ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'block_one_contact':
                        return `INSERT INTO views.block_contract_contacts ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'block_one_contact_person':
                        return `INSERT INTO views.block_contract_contact_persons ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'block_one_contact_person_contact':
                        return `INSERT INTO data.customer_contact_person_contacts ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'block_one_identity':
                        return `INSERT INTO data.customer_identity ${data.headers} VALUES ${data.values} RETURNING *`;
                    case 'tab_cost':
                    case 'tab_history':
                    case 'tab_period':
                    case 'tab_requisites':
                        return undefined;
                    default:
                        return `INSERT INTO views.hb_contracts__tab_main ${data.headers} VALUES ${data.values} RETURNING *`;
                }
            case 'update':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        return `UPDATE data.attachments SET ${data} ${conditions} RETURNING *`;
                    case 'block_one_contact':
                        return `UPDATE views.block_contract_contacts SET ${data} ${conditions} RETURNING *`;
                    case 'block_one_contact_person':
                        return `UPDATE views.block_contract_contact_persons SET ${data} ${conditions} RETURNING *`;
                    case 'block_one_contact_person_contact':
                        return `UPDATE data.customer_contact_person_contacts SET ${data} ${conditions} RETURNING *`;
                    case 'block_one_identity':
                        return `UPDATE data.customer_identity SET ${data} ${conditions} RETURNING *`;
                    case 'block_contract':
                        return `UPDATE views.hb_contracts__tab_main SET ${data} ${conditions} RETURNING *`;
                    case 'tab_attachments':
                    case 'tab_contacts':
                    case 'tab_cost':
                    case 'tab_history':
                    case 'tab_period':
                    case 'tab_requisites':
                        return undefined;
                    default:
                        return `UPDATE views.hb_contracts__${request_body.target} SET ${data} ${conditions} RETURNING *`;
                }
            case 'delete':
                return `DELETE FROM views.hb_contracts__tab_main WHERE ${conditions}`;
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
        const reports_func = require('../functions/reports__func');
        const attachment_func = require('../functions/attachment__func');
        const contacts_func = require('../functions/contacts__func');
        const cont_persons = require('../functions/contact_persons__func');
        const identity_docs_func = require('../functions/identity_docs__func');
        const project_team_func = require('../functions/project_team__func');
        let target = request_body.target.slice(0,4);

        // вкладка "основное". блок "заказчик"
        let customer_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            customer_block_attributes = {blocked: 'true', "data-addfromlist": true, "data-addfromlist_btn": true};
        }
        let customer_source_param = await customer_source.get_param(rec);

        // вкладка "основное". блок "объект"
        let object_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            object_block_attributes = {blocked: true, "data-addfromlist": true, "data-addfromlist_btn": true};
        }

        // вкладка "основное". блок "заявка"
        let measurement_block_attributes = {blocked: true, ef_only: true};
        if(target === 'edit' || target === 'bloc'){
            measurement_block_attributes = {blocked: true, ef_only: true, "data-addfromlist": true, "data-addfromlist_btn": true};
        }

        // вкладка "основное". блок "договор"
        let contract_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            contract_block_attributes = {open: true};
        }

        // вкладка "контакты", блок "контакты заказчика по договору"
        let contacts_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            contacts_block_attributes = {checklist: true, addremove_btn: true};
        }
        let customer_contacts = contacts_func.get_html(rec.customer_id,
            rec.ctr_cust_contacts,
            'Контакты заказчика по договору',
            contacts_block_attributes,
            "block_one_contact",
            2,
            "customer");

        // вкладка "контакты", блок "контактные лица заказчика по договору"
        let contact_persons_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            contact_persons_block_attributes = {checklist: true, addremove_btn: true};
        }
        let contact_persons = cont_persons.get_html(rec.ctr_cont_persons,"Контактные лица заказчика по договору", contact_persons_block_attributes);

        // вкладка "отчеты"
        let reports_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            reports_block_attributes = {blocked: true};
        }
        let reports = reports_func.get_html(rec.reports, request_body.target, reports_block_attributes);

        // вкладка "приложения"
        let attachments_block_attributes = {}, attachments;
        if(target === 'edit' || target === 'bloc'){
            attachments_block_attributes = {addremove_btn: true};
        }
        attachments = attachment_func.get_html(request_body.target, rec,'Добавить файл', attachments_block_attributes, "contract");

        // вкладка "Реквизиты", блок "Документы заказчика"
        let identity_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            // identity_block_attributes = {"data-addfromlist": true, "data-addfromlist_btn": true}; //кнопка ["data-addfromlist_btn"] отключена для первого релиза
            identity_block_attributes = {checklist: true};
        }
        let identity_docs = identity_docs_func.get_html(rec.customer_identity,"Документы заказчика", "customer", identity_block_attributes);

        // вкладка "Реквизиты", блок "Подразделение"
        let department_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            department_block_attributes = {"data-addfromlist": true};
        }

        // вкладка "Реквизиты", блок "Группа реквизитов"
        let dba_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            dba_block_attributes = {"data-addfromlist": true};
        }

        // вкладка "Условия", блок "Схема расчета"
        let estimate_cond_block_attributes = {blocked: true, open: true};
        if(target === 'edit' || target === 'bloc'){
            // estimate_cond_block_attributes = {"data-addfromlist": true, "data-addfromlist_btn": true, open: true}; //кнопка ["data-addfromlist_btn"] отключена для первого релиза
            estimate_cond_block_attributes = {"data-addfromlist": true, open: true};
        }

        // вкладка "Условия", блок "Схема оплаты"
        let payment_cond_block_attributes = {blocked: true, open: true};
        if(target === 'edit' || target === 'bloc'){
            // payment_cond_block_attributes = {"data-addfromlist": true, "data-addfromlist_btn": true, open: true}; //кнопка ["data-addfromlist_btn"] отключена для первого релиза
            payment_cond_block_attributes = {"data-addfromlist": true, open: true};
        }

        // вкладка "команда"
        let project_team_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            project_team_block_attributes = {};
        }
        let project_team = project_team_func.get_html(rec,'Добавить сотрудника', project_team_block_attributes);

        return {
            record_id: rec.id,
            contract: rec.id,
            contract_number: rec.contract_number,
            contract_type: rec.contract_type,
            contract_type_title: rec.contract_type_title,
            contract_category: rec.contract_category,
            contract_category_title: rec.contract_category_title,
            contract_status: rec.contract_status,
            contract_status_title: rec.contract_status_title,
            contract_department: rec.contract_department,
            contract_department_title: rec.contract_department_title,
            ctr_date_of_signing: rec.ctr_date_of_signing,
            contract_block_attributes: contract_block_attributes,
            comment: rec.comment,

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

            measurement: rec.measurement,
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
            measurer: rec.measurer,
            measurer_title: rec.measurer_title,
            measurement_manager: rec.measurement_manager,
            measurement_manager_title: rec.measurement_manager_title,
            measurement_date_of_request: rec.measurement_date_of_request,
            measurement_block_attributes: measurement_block_attributes,

            attachments_path: `twine_home/contracts/${rec.contract_number}/`,
            attachments: attachments,

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

            payment_conditions: rec.payment_conditions,
            paycond_title: rec.paycond_title,
            paycond_default: rec.paycond_default,
            paycond_default_title: rec.paycond_default_title,
            paycond_prepayment: rec.paycond_prepayment,
            paycond_prepayment_title: rec.paycond_prepayment_title,
            paycond_possible_debt: rec.paycond_possible_debt,
            payment_cond_block_attributes: payment_cond_block_attributes,

            contacts_arr: customer_contacts,
            contact_persons: contact_persons,

            first_estimate_path: 'downloads/1.jpg',
            first_estimate_cost: '202000',
            first_estimate_date: '17.08.2020',
            last_estimate_path: 'downloads/1.jpg',
            last_estimate_cost: '202000',
            last_estimate_date: '17.08.2020',
            last_work_report_path: 'downloads/1.jpg',
            last_work_report_cost: '202000',
            last_work_report_date: '17.08.2020',
            last_mat_report_path: 'downloads/1.jpg',
            last_mat_report_cost: '202000',
            last_mat_report_date: '17.08.2020',
            request_date: rec.meas_date_of_request,
            measurement_date: rec.date_of_measurement,
            estimate_date: '17.08.2020',
            signing_date: '17.08.2020',
            design_start_date: '17.08.2020',
            project_signing_date: '17.08.2020',
            work_start_date: '17.08.2020',
            work_end_date: '17.08.2020',

            reports: reports,

            identity_docs: identity_docs,
            identity_block_attributes: identity_block_attributes,

            department: rec.department,
            department_title: rec.department_title,
            department_jname: rec.department_jname,
            department_address: rec.department_address,
            department_inn: rec.department_inn,
            department_ogrn: rec.department_ogrn,
            department_block_attributes: department_block_attributes,

            dba: rec.dba,
            dba_title: rec.dba_title,
            dba_default: rec.dba_default,
            dba_default_title: rec.dba_default_title,
            dba_bank: rec.dba_bank,
            dba_account_number: rec.dba_account_number,
            dba_cor_account_number: rec.dba_cor_account_number,
            dba_bik: rec.dba_bik,
            dba_kpp: rec.dba_kpp,
            dba_inn: rec.dba_inn,
            dba_block_attributes: dba_block_attributes,

            project_team: project_team,
            project_team_block_attributes: project_team_block_attributes,
        };
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}