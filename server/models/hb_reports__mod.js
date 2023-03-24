/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Отчеты"                                                    */
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
                        return `SELECT id, measurement_number, rep_date_of_entry, type, customer_alias, object_title,  
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_reports__central_table where delete_mark = false`;
                    case 'cent':
                        return `SELECT id, measurement_number, rep_date_of_entry, type, customer_alias, object_title,  
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_reports__central_table ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_attachments':
                                return `SELECT * FROM views.hb_reports__tab_attachments where report = ${request_body.record_id}`;
                            default:
                                return `SELECT * FROM views.hb_reports__${request_body.target} where id = ${request_body.record_id}`;
                        }
                    case 'bloc':
                        switch (request_body.target) {
                            case 'block_one_attachment':
                                return `SELECT * FROM views.report_attachments ${conditions}`;
                        }
                }
                break;
            case 'insert':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        return `INSERT INTO views.hb_reports__tab_attachments ${data.headers} VALUES ${data.values} RETURNING *`;
                    default:
                        return `INSERT INTO views.hb_reports__tab_main ${data.headers} VALUES ${data.values} RETURNING *`;
                }
            case 'update':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        return `UPDATE views.hb_reports__tab_attachments SET ${data} ${conditions} RETURNING *`;
                    case 'block_report':
                        return `UPDATE views.hb_reports__tab_main SET ${data} ${conditions} RETURNING *`;
                    default:
                        return `UPDATE views.hb_reports__${request_body.target} SET ${data} ${conditions} RETURNING *`;
                }
            case 'delete':
                return `DELETE FROM views.hb_reports__tab_main WHERE ${conditions}`;
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
        const attachment_html = require('../functions/attachment__func');
        const project_team_func = require('../functions/project_team__func');
        let target = request_body.target.slice(0,4);

        // вкладка "основное". блок "заказчик"
        let customer_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            if(!rec.id){
                customer_block_attributes = {blocked: 'true', "data-addfromlist": true};
            }
        }
        let customer_source_param = await customer_source.get_param(rec);

        // вкладка "основное". блок "объект"
        let object_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            if(!rec.id){
                object_block_attributes = {blocked: true, "data-addfromlist": true};
            }
        }

        // вкладка "основное". блок "заявка"
        let measurement_block_attributes = {blocked: true, ef_only: true};
        if(target === 'edit' || target === 'bloc'){
            if(!rec.id){
                measurement_block_attributes = {blocked: true, ef_only: true, "data-addfromlist": true};
            }
        }

        // вкладка "основное". блок "отчет"
        let report_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            report_block_attributes = {};
        }

        // вкладка "приложения"
        let attachments_block_attributes = {}, attachments;
        if(target === 'edit' || target === 'bloc'){
            attachments_block_attributes = {addremove_btn: true};
        }
        attachments = attachment_html.get_html(request_body.target, rec,'Добавить файл', attachments_block_attributes, "report");

        // вкладка "команда"
        let project_team_block_attributes = {};
        if(target === 'edit' || target === 'bloc'){
            project_team_block_attributes = {};
        }
        let project_team = project_team_func.get_html(rec,'Добавить сотрудника', project_team_block_attributes);

        return {
            record_id: rec.id,
            report: rec.id,
            report_number: rec.report_number,
            report_title: rec.report_title,
            report_type: rec.report_type,
            report_type_title: rec.report_type_title,
            report_status: rec.report_status,
            report_status_title: rec.report_status_title,
            report_maker: rec.report_maker,
            report_maker_title: rec.report_maker_title,
            rep_date_of_entry: rec.rep_date_of_entry,
            report_block_attributes: report_block_attributes,
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
            measurement_date_of_request: rec.measurement_date_of_request,
            measurement_block_attributes: measurement_block_attributes,

            attachments_path: `twine_home/reports/${rec.report_number}/`,
            attachments: attachments,

            rep_date_of_shipment: rec.rep_date_of_shipment,
            rep_date_of_receipt: rec.rep_date_of_receipt,
            rep_date_of_button: rec.rep_date_of_button,

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