/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Подразделения"                                             */
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
                        return `SELECT id, department_title, department_address,
                                       replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_departments__tab_main where delete_mark = false`;
                    case 'cent':
                        return `SELECT id, department_title, department_address,
                                       replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_departments__tab_main ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_attachments':
                                return `SELECT * FROM data.attachments where table_id = 55555 and parent_record = ${request_body.record_id} and delete_mark = false order by date_of_entry desc`;
                            default:
                                return `SELECT * FROM views.hb_departments__${request_body.target} where id = ${request_body.record_id}`;
                        }
                    case 'bloc':
                        switch (request_body.target) {
                            case 'block_department':
                                return `SELECT * FROM views.block_department ${conditions}`;
                            case 'block_one_attachment':
                                return `SELECT * FROM data.attachments ${conditions} and table_id = 55555`;
                        }
                }
                break;
            case 'insert':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        request_body.data["parent_record"] = request_body.data.department;
                        delete request_body.data["department"];
                        request_body.data["table_id"] = 55555;
                        data = await query_conditions.data_handler(request_body);
                        return `INSERT INTO data.attachments ${data.headers} VALUES ${data.values} RETURNING *`;
                    default:
                        return `INSERT INTO views.hb_departments__tab_main ${data.headers} VALUES ${data.values} RETURNING *`;
                }
            case 'update':
                switch (request_body.target) {
                    case 'block_one_attachment':
                        return `UPDATE data.attachments SET ${data} ${conditions} RETURNING *`;
                    default:
                        return `UPDATE views.hb_departments__tab_main SET ${data} ${conditions} RETURNING *`;
                }
            case 'delete':
                return `DELETE FROM views.hb_departments__tab_main WHERE ${conditions}`;
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
        const attachment_html = require('../functions/attachment__func');
        let target = request_body.target.slice(0,4);

        // вкладка "Основное", блок "Подразделение"
        let department_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            department_block_attributes = {open: true};
        }

        // вкладка "приложения"
        let attachments_block_attributes = {}, attachments;
        if(target === 'edit' || target === 'bloc'){
            attachments_block_attributes = {addremove_btn: true};
        }
        attachments = attachment_html.get_html(request_body.target, rec,'Добавить файл', attachments_block_attributes, "department");

        return  {
            record_id: rec.id,
            department: rec.id,
            department_title: rec.department_title,
            department_jname: rec.department_jname,
            department_address: rec.department_address,
            department_inn: rec.department_inn,
            department_ogrn: rec.department_ogrn,
            department_block_attributes: department_block_attributes,

            attachments_path: `twine_home/departments/${rec.id}/`,
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
