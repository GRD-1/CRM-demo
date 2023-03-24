/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "список типы заявок"                                        */
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
                        return `SELECT id, title, suffix, replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                                                
                                FROM data.list__measurement_type where delete_mark = false order by title`;
                    case 'cent':
                        return `SELECT id, title, suffix, replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                                                
                                FROM data.list__measurement_type ${conditions} order by title`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_main':
                                return `SELECT * FROM data.list__measurement_type where id = ${request_body.record_id}`;
                        }
                        break;
                }
                break;
            case 'insert':
                return `INSERT INTO data.list__measurement_type ${data.headers} VALUES ${data.values} RETURNING *`;
            case 'update':
                return `UPDATE data.list__measurement_type SET ${data} ${conditions} RETURNING *`;
            case 'delete':
                return `DELETE FROM data.list__measurement_type WHERE ${conditions}`;
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
        return {
            record_id: rec.id,
            handbook_alias: request_body.alias,
            handbook_path: request_body.source,
            measurement_type_title: rec.title,
            measurement_suffix: rec.suffix,
            comment: rec.comment,
        };
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}