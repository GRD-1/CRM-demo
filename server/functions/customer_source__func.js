/*-----------------------------------------------------------------------------------------------*/
/*     модуль возвращает параметры зависимых полей html блока "Источник заказчика"               */
/*-----------------------------------------------------------------------------------------------*/

// поля, зависимые от поля "источник": "реклама", "по рекомендации", "прочее"
exports.get_param = async function customer_source(record) {

    try {
        if(!record) return;
        let marketing_status='', referred_customer_status='', other_status='';
        let marketing_value='', referred_customer_value='', other_value='';
        let marketing_id='', referred_customer_id='', other_id='', caption;

        switch (record.source_type) {
            case 5:
                marketing_status = 'active';
                marketing_id = record.source_value;
                marketing_value = record.source_marketing_title;
                caption = record.source_marketing_title;
                break;
            case 6:
                referred_customer_status = 'active';
                referred_customer_id = record.source_value;
                referred_customer_value = record.source_customer_title;
                caption = record.source_customer_title;
                break;
            case 7:
                other_status = 'active';
                other_id = record.source_value;
                other_value = record.source_other_title;
                caption = record.source_other_title;
                break;
        }
        return {
            marketing_status: marketing_status,
            marketing_id: marketing_id,
            marketing_value: marketing_value,
            referred_customer_status: referred_customer_status,
            referred_customer_id: referred_customer_id,
            referred_customer_value: referred_customer_value,
            other_status: other_status,
            other_id: other_id,
            other_value: other_value,
            caption: caption,
        }
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
}