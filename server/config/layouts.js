/*--------------------------------------------------------------------------------------------------------------------------------*/
/*   layouts - шаблоны для сборки страниц.
        * в этом модуле можно подключить специальный режим отображения страницы для конкретного пользователя или группы
        * переключить страницу в режим заглушки "ведуться технические работы" можно здесь: server/config/maintenance_list.js
        * сами лейауты хранятся здесь: server/views/layouts
        * инструкция по подключению новых лейаутов тут: server/views/layouts/readme.txt
/*--------------------------------------------------------------------------------------------------------------------------------*/

const maintenance_list = require("./maintenance_list");

// получаем layout
exports.get_layout = async function(route, username){
    try{
        let list = await maintenance_list.get_list(route);
        if(list["all"] || list[route]){
            return "layouts/maintenance";
        }
        else {
            return await get_layout_path(route, username);
        }
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), `не удалось получить layout. маршрут [${route}], пользователь [${username}]. причина: ` + err.message)
    }
}

// получаем путь к шаблону страницы (layout)
async function get_layout_path(route, username){
    try{
        switch (route) {
            case "/measurements":
            case "/contracts":
            case "/reports":
                return "layouts/big_handbook";
            case "/login":
                return "layouts/login";
            case "/management":
                return "layouts/management";
            case "/handbooks":
            case "/about_program":
                return "layouts/main";
            default:
                return "layouts/maintenance";
        }
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), `не удалось получить путь к шаблону страницы (layout). причина: ` + err.message)
    }
}