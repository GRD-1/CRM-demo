/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для работы со Storage API                                                       */
/*-----------------------------------------------------------------------------------------------*/
const fs = require("fs"); // Модуль работы с файловой системой
const uf_ctr = require("../controllers/hb_universal__ctr");
const srv_response = require('../controllers/srv_response__ctr');

/* загрузка файлов
    в локальное хранилище
    создание записи в БД
 */
exports.writeFile = async (req, res) => {
    try{
        const fileData = new URLSearchParams();

        fileData.append('file', req.body.data.content);
        fileData.append('title', req.body.data.title);
        fileData.append('extname', req.body.data.extname);
        fileData.append('mimetype', req.body.data.mimetype);
        fileData.append('size', req.body.data.size);
        fileData.append('alias', req.body.data.alias);

        // запишем файл локально
        req.body.data.path = await write_file_local(fileData)

        // создадим запись о сохранении файла в БД
        delete req.body.data.content
        req.body.data.delete_key = "delete_key";
        req.body.data.url = "data_url";
        return await uf_ctr.request_handler(req, res);
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при загрузке файла. причина: ${err.message}`)
        }
        await srv_response.response_dispatch(req, res, {error: err});
    }
}

// Функция для локального сохранения файла
async function write_file_local(fd){
    try {
        const base64Data = fd.get('file').split(',')[1]
        const file_path = get_upload_path(fd.get('extname')) // Получим полный путь для записи и ссылку для доступа
        await fs.writeFile( file_path, base64Data, 'base64', function(err) {
            try {
                if(err) throw err;
            }
            catch (err) {
                err = new SRVError('SRV1001', _stackTrace(), `ошибка при загрузке файла в локальное хранилище. причина: ${err.message}`)
                throw err;
            }
        });
        return file_path
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при загрузке файла в локальное хранилище. причина: ${err.message}`)
        }
        throw err;
    }
}

// Функция получения адреса загрузки файла
function get_upload_path(extname){
    try {
        const { v1: uuidv1 } = require('uuid');

        let fileType
        let fileServerName = uuidv1() + extname

        switch (extname.toLowerCase()){
            case '.jpg':
            case '.jpeg':
            case '.png':
            case '.bmp':
            case '.gif':
                fileType = 'images'
                break
            case '.pdf':
            case '.epdf':
            case '.doc':
            case '.docx':
            case '.xlsx':
            case '.pptx':
            case '.odt':
            case '.ott':
            case '.docm':
            case '.rtf':
            case '.txt':
            case '.pptm':
            case '.ppsx':
            case '.ppt':
            case '.woff':
                fileType = 'documents'
                break
            case '.7z':
            case '.rar':
            case '.tgz':
            case '.zip':
            case '.zipx':
                fileType = 'archives'
                break
            default:
                fileType = 'other'
        }

        return `./uploads/${fileType}/${fileServerName}`
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `ошибка при получении адреса загрузки файла. причина: ${err.message}`)
        }
        throw err;
    }
}
