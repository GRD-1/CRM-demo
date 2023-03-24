/*-----------------------------------------------------------------------------------------------*/
/*     модуль загружает указанные файлы с клиента на сервер                                      */
/*-----------------------------------------------------------------------------------------------*/

exports.run = async function (query_data) {

    try {
        const fs = require('fs');
        let file_path = query_data.file_path;
        let file_content = query_data.file_content;
        let file_data;

        if(file_content){

            // вырезаем из файла подпись о кодировке, созданную при чтении (иначе не будет работать)
            file_data = file_content.replace(/^data:.+?;base64,/, "");
            return new Promise((resolve, reject) => {
                fs.writeFile( _public + file_path, file_data, 'base64', function (error) {
                    if(error){
                        reject(error);
                    }
                    else {
                        resolve({message: 'файл "' + query_data.file_name + '" загружен на сервер'});
                    }
                });
            })
        }
        else {
            new Error('получен пустой файл');
        }
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), " ошибка при загрузке файла! " + query_data.file_name + " причина: " + err.message)
    }
};