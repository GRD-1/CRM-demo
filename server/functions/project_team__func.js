/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует html блок "команда проекта"                                              */
/*-----------------------------------------------------------------------------------------------*/

exports.get_html = function (db_resp, title, att_arr) {

    try {
        return JSON.stringify(db_resp)
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
}
