/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует записи центральной таблицы справочника                                   */
/*-----------------------------------------------------------------------------------------------*/

const hbs = require("hbs");

// получаем данные центральной таблицы
exports.get_html = async function (records) {

    try {
        if(!records) return;
        let row = '', result='', i;
        let active_record = 'active_record';

        for (i = 0; i < records.length; i++) {
            let hidden_value = true;
            for (let key in records[i]) {
                if (hidden_value) {
                    row += `<td style='display: none'>${records[i][key]}</td>`;
                }
                else {
                    row += `<td>${records[i][key]}</td>`;
                }
                hidden_value = false;
            }
            result += `<tr ${active_record}>${row}</tr>`;
            row = '';
            active_record = '';
        }
        return {table_records: new hbs.SafeString(result)};
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};
