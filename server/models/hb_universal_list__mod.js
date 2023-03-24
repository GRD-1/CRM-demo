/*-----------------------------------------------------------------------------------------------*/
/*     универсальная модель данных для справочников типа "список"                                */
/*-----------------------------------------------------------------------------------------------*/
const query_conditions = require("../functions/query_conditions__func.js");

// функция возвращает текст запроса к БД
exports.get_query = async function (request_body){
    try{
        let arr = request_body.source.split('/');
        let hb_name;
        let conditions = await query_conditions.conditions_handler(request_body);
        let data = await query_conditions.data_handler(request_body);
        arr.forEach((item)=>{
            if(item.match('list__')){
                hb_name = item.replace('handbook_', '').replace('.html', '');
            }
        })

        switch (request_body.action) {
            case 'read':
                let target = request_body.target.slice(0,4);
                switch (target) {
                    case 'all':
                        return `SELECT id, title, replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                                                
                                FROM data.${hb_name} where delete_mark = false limit 50`;
                    case 'cent':
                        return `SELECT id, title, replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                                                
                                FROM data.${hb_name} ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_main':
                                return `SELECT * FROM data.${hb_name} where id = ${request_body.record_id}`;
                        }
                        break;
                }
                break;
            case 'insert':
                return `INSERT INTO data.${hb_name} ${data.headers} VALUES ${data.values} RETURNING *`;
            case 'update':
                return `UPDATE data.${hb_name} SET ${data} ${conditions} RETURNING *`;
            case 'delete':
                return `DELETE FROM data.${hb_name} WHERE ${conditions}`;
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
            title: rec.title,
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