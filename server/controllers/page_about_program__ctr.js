/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для сборки страницы "о программе"                                              */
/*-----------------------------------------------------------------------------------------------*/

const db = require('../database/index');
const srv_response = require('../controllers/srv_response__ctr');

// сборка страницы "о программе"
exports.urequest = async function (request, response){
    try{
        const hbs = require("hbs")

        // получаем стили и скрипты
        const ss = require('../config/style_and_script.js')
        const styles = ss.get_stiles('/about_program')
        const head_scripts = ss.get_head_scripts('/about_program');
        const scripts = ss.get_scripts('/about_program')
        const layouts = require('../config/layouts.js');

        let param = {
            alias: "О программе",
            username: "Admin",
            style_stack: styles,
            script_stack: scripts,
            head_script_stack: head_scripts,
            layout: await layouts.get_layout('/about_program')
        }
        if(param.layout === "layouts/maintenance") {
            let options = {
                view: "partials/preloader.hbs",
                data: param
            };
            return await srv_response.response_dispatch(request, response, options);
        }

        let content = "" // тело записи
        let menu = "" // сайдбар
        let select = "<select><option value='0' selected>Без родителя</option>" // выпадающий список для выбора родителя

        let manual_obj = await db.single_request(`SELECT * FROM views.user_manual WHERE parent IS NULL AND delete_mark != true`); // возвращаем массив строк
        manual_obj.rows.forEach(function (item, i) { // Обходим верхний уровень объекта
            i++

            content += `<article id="manual_${i}">`
            content += `<h1 class="manual_title">${i}. ${item.title}</h1>`
            content += `<section class="manual_content">${item.body === null ? '' : item.body}`

            menu += `<details class="${item.children !== null ? '' : 'manual_nav_nochild'}"><summary><a class="sidebar_link${ i === 1 ? ' sidebar_link_active' : '' }" href="#manual_${i}" document_id="${item.id}">${i}. ${item.title}</a></summary>`

            select += `<option value="${item.id}">${i}. ${item.title}</option>`

            if (item.children !== null){
                let new_child = generate_manual_child(item.children, i, content, menu, select)
                content = new_child.content
                menu = new_child.menu
                select = new_child.select
            }

            menu += `</details>`
            content += `<section/></article>`

        })

        select += `</select>`

        hbs.registerHelper("about_content", new hbs.SafeString(content))
        hbs.registerHelper("about_menu", new hbs.SafeString(menu))
        hbs.registerHelper("about_select", new hbs.SafeString(select))

        // отправляем данные на клиент
        await srv_response.response_dispatch(request, response, {data: param, view: "about_program.hbs"});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
};

// создание новой статьи на странице
exports.publish_document = async function (request, response) {
    try{
        if (request.body.parent === '0') request.body.parent = null
        let query = `INSERT INTO data.user_manual(parent, title, body) VALUES (${request.body.parent},${request.body.title},${request.body.body}) RETURNING id`;
        let db_response = await db.single_request(query);
        await srv_response.response_dispatch(request, response, {status: 200});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `Ошибка при попытке опубликовать документацию. Причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
}

// редактирование статьи
exports.update_document = async function (request, response) {
    try{
        if (request.body.parent === '0') request.body.parent = null;
        let query = `UPDATE data.user_manual SET parent = ${request.body.parent}, title = ${request.body.title}, body = ${request.body.body} WHERE id = ${request.body.id} RETURNING id`;
        await db.single_request(query);
        await srv_response.response_dispatch(request, response, {status: 200});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `Ошибка при попытке обновить документацию. Причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
}

// удаление статьи
exports.delete_document = async function (request, response) {
    try{
        await db.single_request(`UPDATE views.user_manual SET delete_mark = true WHERE id = ${request.body.id}`);
        await srv_response.response_dispatch(request, response, {status: 200});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), `Ошибка при попытке опубликовать документацию. Причина: ${err.message}`)
        }
        await srv_response.response_dispatch(request, response, {error: err});
    }
}

// ???
function generate_manual_child(child, iter, content, menu, select) {
    try{
        child.forEach(function (arr_item, j){ // обходим массив дочерних элементов
            j++

            let iter_id = String(iter).replace('.','_')

            content += `<article id="manual_${iter_id}_${j}">`
            content += `<h2 class="manual_title">${iter}.${j}. ${arr_item.title}</h2>`
            content += `<section class="manual_content">${arr_item.body === null ? '<img src="https://pbs.twimg.com/media/C3FxXtPWYAAD5oV.jpg" width="100px">' : arr_item.body}`

            menu += `<details class="${arr_item.children !== null ? '' : 'manual_nav_nochild'}"><summary><a class="sidebar_link" href="#manual_${iter_id}_${j}" document_id="${arr_item.id}">${iter}.${j}. ${arr_item.title}</a></summary>`

            select += `<option value="${arr_item.id}">${iter}.${j}. ${arr_item.title}</option>`

            if (arr_item.children !== null){
                let new_child = generate_manual_child(arr_item.children, `${iter}.${j}`, content, menu, select)
                content = new_child.content
                menu = new_child.menu
                select = new_child.select
            }

            menu += `</details>`
            content += `<section/></article>`
        })

        return { content : content, menu : menu, select : select }
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        throw err;
    }
}
