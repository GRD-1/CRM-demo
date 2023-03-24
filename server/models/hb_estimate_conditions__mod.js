/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для справочника "Схемы расчета смет"                                        */
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
                        return `SELECT  id, replace(replace(quote_nullable(customer), 'NULL', '-- --'), $$'$$, '') as customer_id,
                                        replace(replace(quote_nullable(customer_alias), 'NULL', '-- --'), $$'$$, '') as customer_alias,
                                        estcond_title, estcond_default_title,
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_estimate_conditions where delete_mark = false order by customer desc`;
                    case 'cent':
                        return `SELECT  id, replace(replace(quote_nullable(customer), 'NULL', '-- --'), $$'$$, '') as customer_id,
                                        replace(replace(quote_nullable(customer_alias), 'NULL', '-- --'), $$'$$, '') as customer_alias,
                                        estcond_title, estcond_default_title,
                                        replace(replace(delete_mark::text, 'false', '-- --'), 'true', 'del') as delete_mark
                                FROM views.hb_estimate_conditions ${conditions} order by customer desc`;
                    case 'tab_':
                        switch (request_body.target) {
                            case 'tab_main':
                                return `SELECT * FROM views.hb_estimate_conditions where id = ${request_body.record_id}`;
                        }
                        break;
                    case 'bloc':
                        return `SELECT * FROM views.block_estimate_condition ${conditions}`;
                }
                break;
            case 'insert':
                return `INSERT INTO views.hb_estimate_conditions ${data.headers} VALUES ${data.values} RETURNING *`;
            case 'update':
                return `UPDATE views.hb_estimate_conditions SET ${data} ${conditions} RETURNING *`;
            case 'delete':
                return `DELETE FROM views.hb_estimate_conditions WHERE ${conditions}`;
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
                customer_block_attributes = {blocked: true, "data-addfromlist": true};
            }
        }

        // вкладка "основное", блок "Схема расчета"
        let estimate_cond_block_attributes = {open: true};
        if(target === 'edit' || target === 'bloc'){
            estimate_cond_block_attributes = {open: true};
        }

        return {
            record_id: rec.id,
            estimate_conditions: rec.id,
            estcond_title: rec.estcond_title,
            estcond_default: rec.estcond_default,
            estcond_default_title: rec.estcond_default_title,
            estcond_coef: rec.estcond_coef,
            estcond_special_price: rec.estcond_special_price,
            estcond_remote_control: rec.estcond_remote_control,
            estcond_restrictions: rec.estcond_restrictions,
            estcond_remoteness: rec.estcond_remoteness,
            estcond_discount: rec.estcond_discount,
            estcond_overhead_cost: rec.estcond_overhead_cost,
            estcond_chores: rec.estcond_chores,
            estimate_cond_block_attributes: estimate_cond_block_attributes,

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