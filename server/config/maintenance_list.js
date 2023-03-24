/*--------------------------------------------------------------------------------------------------------------------------------------------------
        файл-заглушка переключает определенные страницы на заглушку "ремонтные работы"
        чтобы включить заглушку, раскомментировать строку нужной страницы и прописать дату окончания работ в формате "ГГГГ, ММ, ДД, ЧЧ, ММ -1, СС"
        файл добавлен в исключения гита, поэтому не препятствует загрузке обновлений
        используется только модулем [server/config/layouts.js]
---------------------------------------------------------------------------------------------------------------------------------------------------*/

const hbs = require("hbs");
const maintenance_list = {};
// maintenance_list["all"] = new Date(2022,8,13,15,15,10);
// maintenance_list["/measurements"] = new Date(2022,8,14,15,15,10);
// maintenance_list["/contracts"] = new Date(2022,8,13,15,15,10);
// maintenance_list["/reports"] = new Date(2022,8,8,15,15,10);
// maintenance_list["/login"] = new Date();
// maintenance_list["/management"] = new Date();
// maintenance_list["/handbooks"] = new Date(2022,8,22,15,15,10);
// maintenance_list["/about_program"] = new Date(2022,8,10,22,15,0);


/* получаем список разделов, закрытых на обслуживание и время окончания работ
    задаем время в формате "ГГГГ, ММ, ДД, ЧЧ, ММ -1, СС"
    месяцы отсчитываются начиная с 0. это странная особенность функции new Date()
    если указанная дата уже прошла, в сроках окончания будет выведено "не известно"
 */
exports.get_list = async function(route){
    try{
        let html;
        if(Object.keys(maintenance_list).length > 0){
            if(maintenance_list["all"]){
                let deadline = maintenance_list["all"] - new Date() > 0 ? maintenance_list["all"].toLocaleString() : "не известно";
                html = `<ul><li><div><div>Все страницы</div> <div>окончание работ: &nbsp ${deadline}</div></div></li></ul>`;
            }
            else {
                const page_alias = require('../functions/page_alias__func.js');
                html = `<ul>`;
                for(let item in maintenance_list){
                    let alias = await page_alias.get_alias(item);
                    let deadline = maintenance_list[item] - new Date() > 0 ? maintenance_list[item].toLocaleString() : "не известно";
                    html += `<li><div><div>Страница [${alias}]</div> <div>окончание работ: &nbsp ${deadline}</div></div></li>`;
                }
                html += `</ul>`;
            }
            hbs.registerHelper("maintenance_list", function () {
                return new hbs.SafeString(html);
            });
        }
        await get_message(route, maintenance_list);
        return maintenance_list;
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), `не удалось получить список разделов, закрытых на обслуживание. причина: ` + err.message)
    }
}

// получаем сообщение о сроках окончания ремонтных работ в разделе
async function get_message(route, maintenance_list){
    try{
        let html;
        let deadline = maintenance_list[route];

        if(maintenance_list["all"]){
            deadline = maintenance_list["all"];
        }

        if ((deadline - new Date()) > 0) {
            html = `
                Мы все починим через:
                <div style="display: none" data-maintenance_finish="${deadline}">${deadline}</div>
                <div class="timer">
                    <div class="timer__items">
                        <div class="timer__item timer__days">00</div>
                        <div class="timer__item timer__hours">00</div>
                        <div class="timer__item timer__minutes">00</div>
                        <div class="timer__item timer__seconds">00</div>
                    </div>
                </div>
            `;
        }
        else {
            html = `Мы скоро все починим!`;
        }
        hbs.registerHelper("maintenance_message", function () {
            return new hbs.SafeString(html);
        });
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), `не удалось получить сообщение о сроках окончания ремонтных работ. причина:` + err.message)
    }
}
