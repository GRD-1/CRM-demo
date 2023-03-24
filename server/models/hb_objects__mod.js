/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Объекты"                                                   */
/*-----------------------------------------------------------------------------------------------*/

const query_conditions = require("../functions/query_conditions__func.js");

// функция возвращает текст запроса к БД
exports.get_query = async function (request_body){
    try{
        let conditions = await query_conditions.conditions_handler(request_body);
        let data = await query_conditions.data_handler(request_body);
        switch (request_body.action) {
            case 'read':
                let target = request_body.target.slice(0,4);
                switch (target) {
                    case 'all':
                        return `SELECT id, object_number, object_title, object_address, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_objects__central_table where delete_mark = false`;
                    case 'cent':
                        return `SELECT id, object_number, object_title, object_address, 
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark                        
                                FROM views.hb_objects__central_table ${conditions}`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_main':
                            case 'tab_properties':
                                return `SELECT * FROM views.hb_objects where id = ${request_body.record_id}`;
                        }
                        break;
                    case 'bloc':
                        return `SELECT * FROM views.block_object ${conditions}`;
                }
                break;
            case 'insert':
                return `INSERT INTO views.hb_objects ${data.headers} VALUES ${data.values} RETURNING *`;
            case 'update':
                return `UPDATE views.hb_objects SET ${data} ${conditions} RETURNING *`;
            case 'delete':
                return `DELETE FROM views.hb_objects WHERE ${conditions}`;
        }
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}

// данные вкладок блока "детализация" (и формы редактирования)
exports.get_helpers = async function (request_body, rec){
    try{
        if(!rec) return;
        const customer_source = require('../functions/customer_source__func');
        let target = request_body.target.slice(0,4);

        // вкладка "основное". блок "заказчик"
        let customer_source_param = await customer_source.get_param(rec);
        let customer_block_attributes = {blocked: true};
        if(target === 'edit' || target === 'bloc'){
            if(!rec.id){
                customer_block_attributes = {blocked: 'true', "data-addfromlist": true, "data-addfromlist_btn": true};
            }
        }

        // вкладка "основное". блок "объект"
        let object_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            object_block_attributes = {open: true};
        }

        return  {
            record_id: rec.id,
            customer: rec.customer,
            customer_fullname: rec.customer_fullname,
            customer_alias: rec.customer_alias,
            customer_jname: rec.customer_jname,
            customer_family: rec.customer_family,
            customer_name: rec.customer_name,
            customer_patronymic: rec.customer_patronymic,
            source_type: rec.source_type,
            source_type_title: rec.source_type_title,
            customer_source_param: customer_source_param,
            customer_block_attributes: customer_block_attributes,

            object: rec.id,
            object_number: rec.object_number,
            object_address: rec.object_address,
            object_title: rec.object_title,
            object_city: rec.object_city,
            object_district: rec.object_district,
            object_street: rec.object_street,
            object_house_number: rec.object_house_number,
            object_building: rec.object_building,
            object_letter: rec.object_letter,
            object_apartment_number: rec.object_apartment_number,
            object_post_index: rec.object_post_index,
            object_block_attributes: object_block_attributes,

            object_square: rec.object_square,
            object_room_count: rec.object_room_count,
            object_bathroom_count: rec.object_bathroom_count,

            comment: rec.comment,
        };
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}