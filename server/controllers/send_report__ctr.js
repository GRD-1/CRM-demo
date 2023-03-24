/*----------------------------------------------------------------------------------------------------------------------*/
/*     Контроллер, отвечающий за обработку и отправку сообщений об ошибках, а также генерацию скриншотов                */
/*----------------------------------------------------------------------------------------------------------------------*/

const srv_response = require('../controllers/srv_response__ctr');
const fs = require('fs');

exports.send_report = async function (request, response){
    try{
        let curr_time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/ /g, '_').replace(/:/g, '-')
        let html_err_content = `<div style="position: absolute; bottom: 0; width: 100%; background-color: rgba(0,0,0,.8); padding: 20px 10px; color: white; font-weight: bold;">${request.body.text_message}</div><img src="${request.body.canvas}">`

        // Создаем файл
        fs.writeFile(
            'error_reports/'+curr_time+'__error-report.html', html_err_content , async (err) => {
                if (err) throw err;
                response.sendStatus(200)
            }
        );
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV0000', _stackTrace(), `ошибка при отправке отчета об ошибке. причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err, clear: true});
    }
}

