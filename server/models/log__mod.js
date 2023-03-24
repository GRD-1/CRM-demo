/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для чтения/записи логов в БД                                                */
/*-----------------------------------------------------------------------------------------------*/

const query_conditions = require("../functions/query_conditions__func.js");

// функция возвращает текст запроса к БД
exports.get_query = async function (request_body){
    try{
        let query, headers, conditions;
        switch (request_body.action) {
            case "read":
                switch (request_body.target) {
                    case 'error_log':
                    case 'event_log':
                        headers = new Set(['']);
                        conditions = await query_conditions.conditions_handler(request_body, headers);
                        // query = `SELECT * FROM logs.app_${request_body.target} where ${conditions}`;
                        query = `SELECT * FROM logs.app_${request_body.target}`;
                        break;
                }
                break;
            case "insert":
                let data = await query_conditions.data_handler(request_body);
                let user_id = 1;
                switch (request_body.target) {
                    case 'error_log':
                    case 'event_log':
                        query = `insert into logs.app_${request_body.target}(user_id, class, code, stack, cause, source)
                                VALUES(${user_id}, '${data.name}', '${data.code}', '${data.stk}', '${data.cause}', '${request_body.source}')`;
                        break;
                }
                break;
        }
        return query;
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}