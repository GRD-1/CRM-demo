/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Расчетные счета Ремэлль"                                   */
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
                        return `SELECT id, department_title, dba_title, dba_default_title, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_dep_bank_acc where delete_mark = false`;
                    case 'cent':
                        return `SELECT id, department_title, dba_title, dba_default_title, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_dep_bank_acc ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_main':
                                return `SELECT * FROM views.hb_dep_bank_acc where id = ${request_body.record_id}`;
                        }
                        break;
                    case 'bloc':
                        return `SELECT * FROM views.block_department_bank_account ${conditions}`;
                }
                break;
            case 'insert':
                return `INSERT INTO views.hb_dep_bank_acc ${data.headers} VALUES ${data.values} RETURNING *`;
            case 'update':
                return `UPDATE views.hb_dep_bank_acc SET ${data} ${conditions} RETURNING *`;
            case 'delete':
                return `DELETE FROM views.hb_dep_bank_acc WHERE ${conditions}`;
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
        let target = request_body.target.slice(0,4);

        // вкладка "Основное", блок "Подразделение"
        let department_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            if(!rec.id){
                department_block_attributes = {blocked: true, "data-addfromlist": true};
            }
        }

        // вкладка "Основное", блок "Группа реквизитов"
        let dba_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            dba_block_attributes = {open: true};
        }

        return {
            record_id: rec.id,
            department: rec.department,
            department_title: rec.department_title,
            department_jname: rec.department_jname,
            department_address: rec.department_address,
            department_inn: rec.department_inn,
            department_ogrn: rec.department_ogrn,
            department_block_attributes: department_block_attributes,

            dba: rec.id,
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