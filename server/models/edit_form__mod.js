/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для формы редактирования справочников                                       */
/*-----------------------------------------------------------------------------------------------*/

exports.get_helpers = async function (request_body, hb_title){
    try{
        let form_task='';
        let method = "редактирование записи";
        if(request_body.source.match('/btn_add')){
            form_task = 'new_record';
            method = "создание записи";
        }

        let ef_helpers = {
            handbook_title: hb_title,
            handbook_alias: request_body.alias,
            handbook_path: request_body.source,
            handbook_method: method,
            record_id: request_body.record_id,
            form_task: form_task,
        };
        return ef_helpers;
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
};
