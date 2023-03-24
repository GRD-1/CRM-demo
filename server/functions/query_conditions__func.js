/*-----------------------------------------------------------------------------------------------*/
/*     функции возвращают параметры запроса к БД                                                 */
/*-----------------------------------------------------------------------------------------------*/

// функция преобразует данные запроса к серверу в параметры запроса к БД
exports.conditions_handler = async function (request_body, headers) {
    try{
        let i, j, amper = '', conditions = '';
        let query_conditions = request_body.conditions;
        switch (request_body.action) {
            case 'read':
                if(!request_body.conditions && !request_body.record_id){return ''}
                switch (request_body.target.slice(0,4)) {
                    case 'list':
                    case 'filt':
                        for(let key in query_conditions){
                            if(headers.has(key)){
                                conditions += amper + key + ' = ' + query_conditions[key]
                                amper = ' and ';
                            }
                        }
                        break;
                    default:
                        if(request_body.record_id) {
                            conditions = `id = ${request_body.record_id}`;
                        }
                        else {
                            for(let key in query_conditions){
                                if(key === "period_start"){
                                    conditions += `${amper} period > date('${query_conditions[key]}')`
                                }
                                else if(key === "period_start"){
                                    conditions += `${amper} period < date('${query_conditions[key]}')`
                                }
                                else{
                                    conditions += amper + key + ' = ' + query_conditions[key]
                                }
                                amper = ' and ';
                            }
                        }
                }
                break;
            case 'update':
            case 'delete':
                conditions = `id = ${request_body.record_id}`;
        }
        if(conditions.length > 2) {
            conditions = 'where ' + conditions;
        }
        return conditions;
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV3001', _stackTrace(), 'ошибка при обработке параметров запроса к бд. причина: ' + err.message)
        }
        throw err;
    }
};

// функция преобразует данные запроса к серверу для внесения их в бд
exports.data_handler = async function (request_body) {
    try {
        if(!request_body.data){return ''}
        let amper = '', headers = '(', values = '(', shielded_value, data='';

        switch (request_body.action) {
            case 'insert':
                switch (request_body.target) {
                    case 'error_log':
                    case 'event_log':
                        return request_body.data;
                    default:
                        for(let key in request_body.data){
                            headers += `${amper} ${key}`;
                            shielded_value = await shield_characters(request_body.data[key])
                            values += `${amper} '${shielded_value}'`;
                            amper = ',';
                        }
                }
                headers += ')';
                values += ')';
                return {headers: headers, values: values};
            case 'update':
                for(let key in request_body.data){
                    shielded_value = await shield_characters(request_body.data[key])
                    data += `${amper} ${key} = '${shielded_value}'`;
                    amper = ',';
                }
                return data;
        }
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV3001', _stackTrace(), 'ошибка при обработке данных для запроса к бд. причина: ' + err.message)
        }
        throw err;
    }
};

// функция экранирует символы, вызывающие ошибки в SQL
async function shield_characters(value) {
    try {
        if(typeof(value) === 'string'){
            value = value.replace(/'/g, '$');
            value = value.replace(/"/g, '$$');
        }
        return value;
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV3001', _stackTrace(), 'ошибка при экранировании символов, вызывающих ошибки в SQL. причина: ' + err.message)
        }
        throw err;
    }
}