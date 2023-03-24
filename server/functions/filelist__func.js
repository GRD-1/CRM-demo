/*-----------------------------------------------------------------------------------------------*/
/*     модуль возвращает список файлов в указанной папке                                         */
/*-----------------------------------------------------------------------------------------------*/

const fs = require('fs');

/* ++KHC160921 Получим список файлов и файлов внутри каталогов */
exports.getFiles = function (dir, files_) {
    try{
        files_ = files_ || [];
        var files = fs.readdirSync(dir);
        for (var i in files) {
            var name = dir + '/' + files[i];
            if (fs.statSync(name).isDirectory()) {
                exports.getFiles(name, files_);
            } else {
                files_.push(name);
            }
        }
        return files_;
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};
