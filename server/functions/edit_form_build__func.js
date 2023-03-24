/*--------------------------------------------------------------------------------------------------*/
/*     модуль собирает форму редактирования справочника и записывает ее в файл hb_edit_form.hbs     */
/*--------------------------------------------------------------------------------------------------*/

const fs = require("fs");
const filelist = require('../functions/filelist__func.js');

exports.run = async function (hb_title, current_tab, record_id) {

    try{
        let tabs = '', tab_panes = '', arr=[], tab_title, param, active_tab, tab_pane, active_pane, single_tab;

        let tablist;
        if(hb_title.match('hb_list')){
            tablist = filelist.getFiles(`./views/partials/hb_list`);
        }
        else {
            tablist = filelist.getFiles('./views/partials/' + hb_title);
        }

        if(tablist.length<4){single_tab = 'single_tab'}
        for (let i = 0; i < tablist.length; i++) {
            if(tablist[i].match('tab_')){
                arr = tablist[i].split('/');
                tab_title = arr[arr.length-1].replace('.hbs', '');
                param = await tab_properties(tab_title, record_id);
                if(tab_title === current_tab){
                    active_tab = 'tabs_link_active';
                    active_pane = 'tabs_pane_show';
                }
                else {
                    active_tab = '';
                    active_pane = '';
                }

                tabs += `<div class="col ${param.tab_order}">
                            <a class="tabs_link ${active_tab} ${single_tab}" href='#${tab_title}' ${param.availability} ${param.attributes}>${param.tab_alias}</a>
                        </div>`;
                tab_pane = fs.readFileSync(tablist[i], "utf8");
                tab_panes += `<form class="tabs_pane ${active_pane}" id="${tab_title}">${tab_pane}</form>`;
            }
        }
        await write_to_file(tabs, tab_panes);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// функция возвращает кириллическое название и порядок следования вкладки
async function tab_properties(tab_title, record_id) {

    try{
        let availability='';
        if(record_id === "new_record") {
            availability = 'inactive_element';
        }
        switch (tab_title) {
            case 'tab_main':
                return {tab_alias: 'Основное', tab_order: 'order-1'};
            case 'tab_applications':
                return {tab_alias: 'Приложения', tab_order: 'order-2', availability: availability, attributes: ''};
            case 'tab_contacts':
                return {tab_alias: 'Контакты', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_estimates':
                return {tab_alias: 'Сметы', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_history':
                return {tab_alias: 'История', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_conditions':
                return {tab_alias: 'Условия', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_period':
                return {tab_alias: 'Сроки', tab_order: 'order-24', availability: availability, attributes: 'repair_work'};
            case 'tab_requisites':
                return {tab_alias: 'Реквизиты', tab_order: 'order-23', availability: availability, attributes: 'repair_work'};
            case 'tab_cost':
                return {tab_alias: 'Стоимость', tab_order: 'order-24', availability: availability, attributes: 'repair_work'};
            case 'tab_attachments':
                return {tab_alias: 'Приложения', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_documents':
                return {tab_alias: 'Документы', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_personal_account':
                return {tab_alias: 'ЛК', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_properties':
                return {tab_alias: 'Детали', tab_order: 'order-24', availability: availability, attributes: ''};
            case 'tab_project_team':
                return {tab_alias: 'Команда', tab_order: 'order-24', availability: availability, attributes: 'repair_work'};
            case 'tab_messages':
                return {tab_alias: 'Чат', tab_order: 'order-24', availability: availability, attributes: 'repair_work'};
            default:
                return {tab_alias: tab_title, tab_order: 'order-24', availability: availability, attributes: ''};
        }
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err.message)
    }
}

// пишем html код в hbs файл формы редактирования
async function write_to_file(tabs, tab_panes) {

    try {
        let html =
            `<div class="ef_base"></div>
            <div class='ef_container' {{form_task}}>
                <div class='ef_wrapper'>
                    <div>
                        <div class='ef_title'>
                            <span class='ef_title_title'>Справочник "{{handbook_alias}}":  </span>
                            <span class='ef_title_method'>{{handbook_method}}</span>
                        </div>
            
                        <div class='ef_alert'></div>
            
                        <div class='ef_data tabs'>
                            <div class="tab_headers"><div class="row no-gutters">${tabs}</div></div>
                            <div class="tab_body">${tab_panes}</div>
                        </div>
            
                        <div class='ef_buttons'>
                            <div class="btn_wrapper">
                                <button class="btn" id="btn_save" formaction="{{handbook_path}}" value="{{handbook_title}}" record_id="{{record_id}}">Сохранить</button>
                                <button class="btn" id="btn_cancel">Выход</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        fs.writeFileSync('./views/partials/hb_edit_form.hbs', html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
}
