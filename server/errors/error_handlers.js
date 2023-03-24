/*-----------------------------------------------------------------------------------------------*/
/*      Обработчики ошибок на стороне сервера                                                    */
/*-----------------------------------------------------------------------------------------------*/

const log__ctr = require('../controllers/log__ctr.js');

// сохраняем запись об ошибке в БД и выводим детали в консоль
exports.handler = async function (err, source){

    try {
        let request = {};
        request.path = "/srv_error";
        request.body = {};
        request.body.source = source;
        request.body.target = "error_log";
        request.body.action = "insert";
        request.body.data = JSON.stringify([err]);

        let response = {};
        response.send = function(data){console.log(data)};

        console.log('\n/errors/error_handlers.handler:');
        console.error(err);
        if(err.code === "SRV4001") return; // если удалить это условие, при падении базы получишь бесконечный цикл
        await log__ctr.request_preparation(request, response);
    }
    catch (err) {
        console.log('\n/errors/error_handlers.handler: ');
        console.error('\n ОШИБКА ПРИ ОБРАБОТКЕ ОШИБКИ! причина: ' + err);
    }
};