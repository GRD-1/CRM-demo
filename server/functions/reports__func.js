/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует контент для вкладки "отчеты" справочника "договоры"                      */
/*-----------------------------------------------------------------------------------------------*/

exports.get_html = async function (arr) {
    try{
        const hbs = require('hbs');
        const tab_buttons = require('./tab_buttons__func');
        let html = [], first_part, second_part = '', third_part;
        let capton_buttons = tab_buttons.btn_plug_cap();

        if(arr){
            for (let i = 0; i < arr.length; i++) {

                first_part = new hbs.SafeString(
                    `<details>
                    <summary>
                        <span>${arr[i].date}</span>
                        <span>${arr[i].type}</span>
                        ${capton_buttons}
                     </summary>
                    <table class="tab_table">`);

                if(arr[i].attachments) {
                    for (let n = 0; n < arr[i].attachments.length; n++) {
                        second_part +=
                            `<tr>
                        <td>${arr[i].attachments[n].description}</td>
                        <td><a href="${arr[i].attachments[n].path}" target="_blank">ссылка</a></td>
                    </tr>`
                    }
                    second_part = new hbs.SafeString(second_part);
                }
                else {second_part = ''}

                third_part = new hbs.SafeString(
                    `</table>
            </details>`);
                html.push({first_part, second_part, third_part});
            }
        }
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};
