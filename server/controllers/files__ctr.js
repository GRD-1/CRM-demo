/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для работы с локальными файлами                                                */
/*-----------------------------------------------------------------------------------------------*/

const fs = require("fs");
const srv_response = require('../controllers/srv_response__ctr');

// Выдача локального файла по ссылке
exports.get_file = async (request, response) => {
    try {
        fs.readFile( './'+request.path, (err, data) => {
            if (err) response.status(404).send('Файл не найден')
            return response.end(data)
        });
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `не удалось получить файл из локальнгого хранилища. причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
}
