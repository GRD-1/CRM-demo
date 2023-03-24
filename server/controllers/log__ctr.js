/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для чтения/записи логов                                                        */
/*-----------------------------------------------------------------------------------------------*/

const srv_response = require('../controllers/srv_response__ctr');

// предварительная обработка запроса (на случай, если нужны множественные запросы к базе)
exports.request_preparation = async function (request, response){

    try{
        switch (request.body.action) {
            case "read":
                await request_handler(request, response);
                break;
            case "insert":
                switch (request.body.target) {
                    case 'error_log':
                        if(_error_logging) {
                            await request_handler(request, response);
                        }
                        if(_event_logging) {
                            request.body.target = "event_log";
                            await request_handler(request, response);
                        }
                        break;
                    case 'event_log':
                        if(_event_logging) {
                            await request_handler(request, response);
                        }
                }
        }
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при обработке запроса сервером! причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err, from_log__ctr: true});
    }
}

/* обработчик запроса
    подключаем нужную модель данных
    отправляем запрос в базу
    обрабатываем ответ базы
    получаем путь к представлению (hbs шаблону)
    отправляем данные на клиент
*/
async function request_handler(request, response){

    try{
        const data_mod = require('../models/log__mod.js');

        // отправляем запрос в базу
        let db_response = await db_request(request.body, data_mod);

        // обрабатываем ответ базы
        let data = await data_handler(request.body, data_mod, db_response)

        // получаем путь к представлению (hbs шаблону)
        let view = await get_view(request.path, request.body);

        // отправляем данные на клиент
        await srv_response.response_dispatch(request, response, {data: data, view: view, from_log__ctr: true});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка в обработчике запроса! причина: ${err.message}`)
        }
        throw err;
    }
}

// получаем текст запроса, отправляем запрос в базу
async function db_request(request_body, data_mod){
    try {
        let query = await data_mod.get_query(request_body);
        const db = require('../database/index');
        let db_response = await db.single_request(query);
        return db_response.rows;
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при запросе к БД. причина: ${err.message}`)
        }
        throw err;
    }
}

// обрабатываем данные, полученные из БД
async function data_handler(request_body, data_mod, db_response) {

    try{
        let data = {};
        switch (request_body.action) {
            case "read":
                switch (request_body.target) {
                    case 'error_log':
                    case 'event_log':
                        data = await data_mod.get_central_table(db_response, request_body.record_id);
                        break;
                }
                break;
            case "insert":
                data = `данные об ошибке сохранены в [${request_body.target}]`;
                break;
        }
        return data;
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не удалось обработать ответ базы. причина: ${err.message}`)
        }
        throw err;
    }
}

// получаем путь к hbs шаблону
async function get_view(request_path, request_body) {

    try {
        let view;
        switch (request_body.action) {
            case "read":
                switch (request_body.target) {
                    case 'error_log':
                    case 'event_log':
                        view = `partials/logs/${request_body.target}.hbs`;
                        break;
                }
                break;
            default:
                view = undefined;
        }
        return view;
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не удалось получить путь к представлению. причина: ${err.message}`)
        }
        throw err;
    }
}