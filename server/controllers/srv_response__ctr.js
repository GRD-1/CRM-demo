/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для отправки ответа на клиент                                                  */
/*-----------------------------------------------------------------------------------------------*/

const error_handlers = require('../errors/error_handlers');

/* отправляем данные на клиент. параметры:
    request         - запрос, который пришел на сервер
    response        - встроенная функция-ответ, позволяющая отправить ответ на клиент
    param.data      - данные из базы и параметры рендеринга hbs представления
    param.view      - путь к hbs представлению (для рендеринга данных)
    param.status    - статус ответа, переданный контроллером
    param.error     - сообщение об ошибке (для логов и вывода на клиент)
    param.clear     - команду "очистить поле" (для полей ввода на клиенте)
 */
exports.response_dispatch = async function(request, response, param){
    try {
        if(param.error){
            if(param.error.code){
                if(param.error.code === "SRV4001") response.render("error.hbs", {status: 504, message: "не удалось подключиться к базе данных"});
                else response.send({error: param.error.message, clear: param.clear});
            }
            else{
                response.send({error: param.error.message});
            }
            if(param.from_log__ctr){
                console.log('\n/controllers/srv_response__ctr.response_dispatch: ');
                console.error(param.error);
                return;
            }
            await error_handlers.handler(param.error, request.body.source);
        }
        else{
            if(param.view){
                response.render(param.view, param.data);
            }
            else if(param.status){
                response.sendStatus(param.status);
            }
            else {
                response.send(param.data);
            }
        }
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при отправке данных на клиент. причина: ${err.message}`)
        }
        response.send({error: err});
        if(param.from_log__ctr){
            console.log('\n/controllers/srv_response__ctr.response_dispatch: ');
            console.error(param.error);
            return;
        }
        await error_handlers.handler(err, request.body.source);
    }
}