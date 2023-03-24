/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для запроса на обновление скриптов                                             */
/*-----------------------------------------------------------------------------------------------*/

const srv_response = require('../controllers/srv_response__ctr');

exports.urequest = async function (request, response){
    try{
        const path = request.body.source;
        const ss = require('../config/style_and_script.js');
        const scripts = ss.get_scripts(path);

        response.send(scripts);
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при загрузке скриптов. причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};