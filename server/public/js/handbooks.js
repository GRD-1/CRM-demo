/*------------------------------------------------------------------------------------------------------------------------------------------*/
/*		скрипты для справочников (стр: справочники, договоры, замеры, отчеты)       													    */
/*------------------------------------------------------------------------------------------------------------------------------------------*/

/*-----------------------------------------------------------------------------------------------*/
/*    события и обработчики вкладок (вкладки правой колонки справочника и формы редактирования)  */
/*-----------------------------------------------------------------------------------------------*/

// события вкладок
function tab_listeners() {

    // одинарный клик по вкладке
    $('main').on('click', '.tabs', async function(event){

        if($(event.target).is('.tabs_link')){
            event.preventDefault();
            let container = await get_container();
            if($(event.target).attr('href') === $($(container).find('.tabs_link_active')[0]).attr('href')){return}
            if($(event.target).attr('inactive_element') !== undefined){return}

            if(container === '#hb_edit_form') {
                await check_ef_changes('.tabs_link', event);
                return;
            }
            await tab_handler(this, event.target, container);
        }
    });
}

// подключаем listeners
$(document).ready(function () {
    if(document.location.pathname === '/handbooks.html'
        || document.location.pathname === '/measurements.html'
        || document.location.pathname === '/contracts.html'
        || document.location.pathname === '/reports.html'){
        tab_listeners();
    }
});

/*  обработчик событий вкладок справочника:
    запрос на сервер
    делаем вкладку активной
    загрузка ответа сервера на вкладку
*/
async function tab_handler(event_source, tabsLinkTarget, target_container) {

    try {
        show_preloader();

        // отправляем запрос на сервер
        let path = $('#btn_default')[0].formAction;
        let query = {};
        query.source = await get_request_source(tabsLinkTarget, 'tab_link', target_container);
        query.target = await get_response_target(tabsLinkTarget, 'tab_link', target_container);
        query.record_id = await get_record_id(tabsLinkTarget, 'tab_link', query.target);
        query.action = "read";
        let srv_response;
        if(query.record_id){
            srv_response = await srv_request(path, query)
        }

        // делаем вкладку активной
        await show_tab(event_source, tabsLinkTarget);

        // загружаем ответа сервера на вкладку
        await srv_response_rendering(query, srv_response);
        hide_preloader();
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось обработать данные вкладки. причина: ${err.message}`)
        }
        await err_handler(err, $('#btn_default')[0].formAction);
    }
}

// функция делает вкладку активной
async function show_tab(event_source, tabsLinkTarget) {

    try{
        let tabsPaneTarget, tabsLinkActive, tabsPaneShow, linklineTarget, linklineActive;
        tabsPaneTarget = $(event_source).find(tabsLinkTarget.getAttribute('href'))[0];
        tabsLinkActive = $(event_source).find(".tabs_link_active")[0];
        linklineActive = tabsLinkActive.parentElement.parentElement;
        linklineTarget = tabsLinkTarget.parentElement.parentElement;
        tabsPaneShow = tabsPaneTarget.parentElement.querySelector('.tabs_pane_show');

        if (tabsLinkActive) {
            tabsLinkActive.classList.remove('tabs_link_active');
        }
        if (linklineActive) {
            linklineActive.classList.remove('order-3');
        }
        if (tabsPaneShow) {
            tabsPaneShow.classList.remove('tabs_pane_show');
        }

        // добавляем классы к элементам (в завимости от выбранной вкладки)
        tabsLinkTarget.classList.add('tabs_link_active');
        linklineTarget.classList.add('order-3');
        tabsPaneTarget.classList.add('tabs_pane_show');
        let eventTabShow = new CustomEvent('tab.show', { bubbles: true, detail: { tabsLinkPrevious: tabsLinkActive } });
        tabsLinkTarget.dispatchEvent(eventTabShow);
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `ошибка при переключении режима отображения вкладки. причина: ${err.message}`)
        }
        throw err;
    }
}

//  функция обновляет данные вкладки "основное"
async function reload_tab_main(target_container) {

    try {
        let event_source = $(target_container).find('.tabs')[0];
        let tabsLinkTarget = $(target_container).find('a[href = "#tab_main"]')[0];
        await tab_handler(event_source, tabsLinkTarget, target_container)
    }
    catch (err) {
        let error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
        error.message = 'Ошибка [' + error.code + '] - не удалось обновить данные вкладки. причина: ' + err.message;
        await err_handler(error, $('#btn_default')[0].formAction + '/' + 'filter_form/btn_reload');
    }
}
/*----------------------------------------------------------------------------------------------------*/
/*   события и обработчики полей ввода                                                                */
/*----------------------------------------------------------------------------------------------------*/

// события полей ввода
function input_listeners() {

    // получение фокуса полем ввода (только для "формы редактирования")
    $('#hb_edit_form').on('focus', '[tab_form_field]', function(event){
        let access = check_editing_rights(event.target);
        if(access){
            event.preventDefault();
            input_edit_mode(event.target);
        }
    });

    // двойной клик по любому полю ввода
    $('main').on('dblclick', '[tab_form_field]', function(event){

        let access = check_editing_rights(event.target);
        if(access){
            event.preventDefault();
            input_edit_mode(event.target);
        }
    });

    // изменение в поле ввода
    $('main').on('change', '[tab_form_field]', function(event){

        event.preventDefault();
        input_handler(event.target, event.target);
    });

    // изменение в выпадающем списке или в поле "дата"
    $('main').on('change', "div[class^='paired_field']", function(event) {

        let input = this.parentElement.firstElementChild;
        event.preventDefault();

        input_handler(input, this);
    });

    // потеря фокуса полем ввода
    $('main').on('blur', '[tab_form_field]', function(event){

        let target = event.target;
        target.setAttribute('readonly', '');
        deselectAll();
    });
}

// подключаем listeners
$(document).ready(function () {
    if(document.location.pathname === '/handbooks.html'
        || document.location.pathname === '/measurements.html'
        || document.location.pathname === '/contracts.html'
        || document.location.pathname === '/reports.html'){
        input_listeners();
    }
});

/*  обработчик данных в полях ввода:
    извлекаем введенные данные
    запрос на сервер
    подтверждение или откат значения в поле ввода, проверка зависимых полей/значений
    возврат поля ввода к исходному виду: readonly, active_field, deselect
    обновление контента страницы
*/
async function input_handler(input, caller) {
    try{
        show_preloader();
        let field_type = await get_field_type(caller);
        let field_data = await get_input_data(input, caller, field_type);
        let container = await get_container();

        // отправляем запрос на сервер
        let path = $('#btn_default')[0].formAction;
        let query = {};
        query.source = await get_request_source(input, field_type, container);
        query.target = await get_response_target(input, field_type, container, caller);
        query.record_id = await get_record_id(caller, field_type, query.target);
        query.action = await get_request_action(input, field_type, container, query.record_id, query.target);
        query.data = (query.action !== "read") ? {[field_data.name]:field_data.value} : undefined;

        let srv_response = await srv_request(path, query);

        // ++KHC 26052022 Если target = block_one_identity_N - загрузим ответ в соответствующее место на странице
        if (/^block_one_identity_[0-9]/gm.test(query.target)){
            return await add_new_identity(input, caller, srv_response)
        }

        // фиксируем данные в поле ввода и в зависимых полях (или откатываем, если сервер вернул ошибку)
        await fix_input_value(input, field_data, field_type, query.action, container, srv_response);

        // переключаем поле ввода в режим чтения
        await input_default_mode(input, caller, field_type);

        // обновляем контент страницы
        await refresh_the_page(query, srv_response);

        // загружаем данные в родительский блок details (с меньшим значением атрибута [nesting])
        // нужно прописать условие на action, иначе будет срабатывать при редактированиии записей
        // заморожено вместе с задачей https://remelle.atlassian.net/browse/TWINEHOME-576 21092022
        if(field_type === "block_header"){
            // let parent_record_field = $("#hb_edit_form").find(`[title=${query.target}]`).find("[data-parent_record]");
            // let parent_name = $(parent_record_field).attr("id");
            // let parent_id = $(parent_record_field).attr("value");
            // let parent_block_summary = $("#hb_edit_form").find(`[name=${parent_name.substr(6)}]`);
        }

        hide_preloader();
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось обработать данные поля [${input.name}]. причина: ${err.message}`)
        }
        await err_handler(err, $('#btn_default')[0].formAction);
    }
}

// получаем внесенные данные
async function get_input_data(input, caller, field_type) {
    try{
        switch (field_type) {
            case 'date':
                let arr = caller.firstElementChild.value.split('-');
                let mirror_val = arr[2] + '.' + arr[1] + '.' + arr[0];
                return {name:input.name, value:mirror_val};
            case 'dropdown_list':
            case 'block_header':
                return await get_list_record(caller, input.name);
            case 'dropdown_list_input':
                return await get_list_record(caller.parentElement.lastElementChild, input.name);
            case 'file':
                return {name:input.name, value:(await read_file(caller))};
            default:
                return {name:input.name, value:caller.value};
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось собрать данные поля ${caller.name}. причина: ${err.message}`)
        }
        throw err;
    }
}

/*  фиксируем данные в поле ввода и в зависимых полях (или откатываем, если сервер вернул ошибку)
    input           - поле ввода
    input_data      - внесенные данные
    caller          - DOM элемент, вызвавший событие: строка выпадающего списка, парное поле "дата", сам input
    field_type      - тип данных поля ввода (может не совпадать с input.type): text, date, file, list и пр.
    container       - [#hb_edit_form] или [.handbook]
    srv_response    - ответ сервера
 */
async function fix_input_value(input, input_data, field_type, action, container, srv_response) {
    try{
        if((srv_response.data !== undefined && srv_response.data.error === undefined) || (action === "without_dispatch")){
            await highlight_changed_field(input, container);
            switch (field_type) {
                case 'date':
                    input.setAttribute('value', input_data.value);
                    await show_related_fields(input, container);
                    return
                case 'dropdown_list':
                case 'block_header':
                    $(input).attr('record_id', input_data.value);
                    $(input).attr('value', input_data.text_value);
                    await show_related_fields(input, container);
                    break;
                case 'file':
                    break;
                default:
                    input.setAttribute('value', input_data.value);
            }
            await change_related_values(input, input_data, field_type, action, container);
        }
        else {
            input.style = 'outline: 1px solid red';
            setTimeout(function(){input.style = 'outline: none'}, 500);
            if(input.type !== 'file'){
                input.value = input.getAttribute('value');
            }
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось сохранить данные в поле ${input.name}. причина: ${err.message}`)
        }
        throw err;
    }
}

// функция проверяет, разрешено ли html атрибутами редкатирование поля
function check_editing_rights(target){

    let grandfather = target.parentElement.parentElement;
    let gggrandfather = target.parentElement.parentElement.parentElement.parentElement;
    let ggggrandfather = target.parentElement.parentElement.parentElement.parentElement.parentElement;

    // если редактирование поля запрещено
    if(grandfather.attributes.forbidden
        || gggrandfather.attributes.forbidden
        || ggggrandfather.attributes.forbidden
        || ($(grandfather).attr('data-addfromlist') === "true")
        || ($(gggrandfather).attr('data-addfromlist') === "true")
        || ($(ggggrandfather).attr('data-addfromlist') === "true")
        || grandfather.tagName === 'SUMMARY'
    ){
        return false;
    }
    else if(grandfather.attributes.blocked
        || gggrandfather.attributes.blocked
        || ggggrandfather.attributes.blocked
    ){
        let edit_form = $('#hb_edit_form[style="display: block"]')[0];
        let new_record = $('.ef_container[new_record]')[0];

        if(!edit_form || !new_record){
            return false;
        }
    }
    return true;
}

// переключаем поле ввода в режим редактирования
async function input_edit_mode(input) {
    try {
        let field_type = await get_field_type(input);
        switch (field_type) {
            case 'date':
            case 'date_input':
                let mirror_val = await from_text_to_date(input.value);
                let paired_field = $(input.parentElement).find("input[type='date']")[0];
                paired_field.value = mirror_val;
            case 'dropdown_list_input':
                input.classList.remove('active_field');
                input.parentElement.lastElementChild.classList.add('active_field');
                break;
            case 'block_header':
                break;
            case 'file':
                input.setAttribute('type', 'file');
                input.removeAttribute('readonly');
                break;
            default:
                input.removeAttribute('readonly');
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось переключить поле ${input.name} в режим редактирования. причина: ${err.message}`)
        }
        throw err;
    }
}

// переключаем поле ввода в режим чтения
async function input_default_mode(input, caller, field_type) {

    try {
        switch (field_type) {
            case 'date':
            case 'dropdown_list':
                caller.classList.remove('active_field');
                input.classList.add('active_field');
                break;
            case 'block_header':
                break;
            case 'file':
                // input.setAttribute('type', 'text'); // ++KHC18042022 Закомментили, мешает загрузке файла на сервер
                input.setAttribute('readonly', '');
                break;
            default:
                input.setAttribute('readonly', '');
        }
        deselectAll();
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось переключить поле ${input.name} в режим чтения. причина: ${err.message}`)
        }
        throw err;
    }
}

/* получаем тип данных html тега, вызвавшего событие. варианты:
    file                    - <input> для загрузки файла
    block_header            - <div>, в который обернут выпадающий список в заголовке блока <details> (блоки: заказчик, заявка, договор и пр.)
    dropdown_list           - <div>, в который обернут выпадающий список, не в заголовке блока
    dropdown_list_input     - <input>, в котором хранится значение выпадающего списка
    date                    - <input> для хранения даты в текстовом формате
    + стандартные для Html5 типы полей
 */
async function get_field_type(caller) {

    try {
        let field_type = caller.type;
        if(caller.hasAttribute('attachment')){
            field_type = 'file';
        }
        else if(caller.classList.contains('paired_field')){
            if(caller.tagName === "DIV"){
                if(caller.firstElementChild.title.match("list_")){
                    if(caller.parentElement.parentElement.tagName === 'SUMMARY'){
                        field_type = 'block_header';
                    }
                    else {
                        if (caller.parentElement.parentElement.parentElement.parentElement.parentElement.title === 'block_one_identity' ) field_type = 'block_header'
                        else field_type = 'dropdown_list'
                    }
                }
                else {
                    field_type = 'date';
                }
            }
            else {
                if($(caller.parentElement).find("input[type='date']")[0]){
                    field_type = 'date_input';
                }
                else {
                    field_type = 'dropdown_list_input';
                }
            }
        }
        return field_type;
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось получить тип данных поля ${caller.parentElement.firstElementChild.name}. причина: ${err.message}`)
        }
        throw err;
    }
}

// показать/скрыть зависимые поля
async function show_related_fields(input, container) {

    try{
        if(input.parentElement.parentElement.hasAttribute('primary_field')){
            let slave_arr = input.parentElement.parentElement.parentElement.querySelectorAll('[slave_field]');
            let slave_title;

            // заголовки зависимых полей
            switch (input.value) {
                case 'по рекомендации':
                    slave_title = 'Заказчик:';
                    break;
                case 'реклама':
                    slave_title = 'Реклама:';
                    break;
                default:
                    slave_title = 'Прочее:';
                    break;
            }

            // включаем соответствующее выбору зависимое поле
            for(var i=0; i<slave_arr.length; i++){

                slave_arr[i].setAttribute('slave_field', '');
                if(slave_arr[i].firstElementChild.textContent.match(slave_title)){
                    slave_arr[i].setAttribute('slave_field', 'active');
                }
            }

            // пиктограма "по рекомендации"
            if(input.value === 'по рекомендации'){
                $(container).find('.tabs_pane_show')[0].querySelector('[recommended]').setAttribute('recommended', 'true');
            }
            else {
                $(container).find('.tabs_pane_show')[0].querySelector('[recommended]').setAttribute('recommended', '');
            }
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось провести проверку зависимых полей. причина: ${err.message}`)
        }
        throw err;
    }
}

/* изменение значений в зависимых полях
*   для html блоков <details>, при выборе значения блока из выпадающего списка, сбрасываются значения в подчиненных блоках <details> (с меньшим индексом [nesting])
*   заполняется поле "полное имя" при изменении имени или фамилии
*   заполняется поле "полный адрес" при изенениях в полях: район, улица, индекс и пр.
*   номер заявки при изменении "типа заявки"
*   адреса ссылок
*/
async function change_related_values(input, input_data, field_type, action, container) {
    try {
        if(field_type === "block_header"){
            let all_blocks = $("#hb_edit_form .tabs_pane_show").find("[data-nesting]");
            let current_block_nesting = $(input.parentElement.parentElement.parentElement).attr("data-nesting")
            for(let i=0; i<all_blocks.length; i++){
                if($(all_blocks[i]).attr("data-nesting")>current_block_nesting){
                    erase_block_content(all_blocks[i]);
                }
            }
        }

        let ggggrandfater = input.parentElement.parentElement.parentElement.parentElement.parentElement;
        change_summary_fields(input, ggggrandfater, container);

        if(action !== 'without_dispatch') {
            let related_link = $(ggggrandfater).find("[link_for = '" + input.name + "']")[0];
            let related_title = $(ggggrandfater).find("[title_for]");
            if(related_link) related_link.href = input_data.file_path;
            for(var i=0; i<related_title.length; i++){
                let arr = related_title[i].getAttribute('title_for').split('; ');
                for(let j=0; j<arr.length; j++){
                    if(arr[j] === input.name){
                        if(action === 'file_loading'){
                            if(related_title[i].tagName === 'INPUT'){
                                related_title[i].value = input_data.file_name;
                            }
                            else {
                                related_title[i].innerHTML = input_data.file_name;
                            }
                        }
                        else{
                            related_title[i].innerHTML = input_data.text_value;
                        }
                    }
                }
            }
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось провести проверку зависимых значений. причина: ${err.message}`)
        }
        throw err;
    }
}

// преобразование из текста в дату и обратно
async function from_text_to_date(str) {

    try {
        if(str.match("-")) {
            let arr = str.split('-');
            return (arr[2] + '.' + arr[1] + '.' + arr[0]);
        }
        else {
            let arr = str.split('.');
            return (arr[2] + '-' + arr[1] + '-' + arr[0]);
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось преобразовать формат отображения даты. причина: ${err.message}`)
        }
        throw err;
    }
}

// функция подсвечивает поле ввода, если значение было изменено
async function highlight_changed_field(field, container) {
    try{
        if(container === '#hb_edit_form') {
            if (field.localName !== 'button') $(field).attr('changed_field', ""); // Исключение для button
            $(field.parentElement.parentElement).attr('changed', "");
            $('#btn_save')[0].setAttribute('changed','');
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `Ошибка [CL1001] в функции [highlight_changed_field]. причина: ${err.message}`)
        }
        throw err;
    }
}

// меняем значения в суммирующийх полях: "ФИО заказчика", "ФИО сотрудника", "полный адрес" и т.п.
async function change_summary_fields(input, ggggrandfater, container) {
    try {
        let SummaryValue, SummaryField;
        switch (ggggrandfater.title) {
            case "block_measurement":
                if(container !== "#hb_edit_form" && input.name === "measurement_type"){
                    SummaryValue = await get_measurement_number(ggggrandfater, Number($(input).attr("record_id")));
                    SummaryField = [$(ggggrandfater).find('[name="measurement"]').eq(0)];
                }
                else return;
                break;
            case "block_employee":
                if(input.name !== "employee_full_name"){
                    SummaryValue = $(ggggrandfater).find('[name = "employee_family_name"]')[0].value + " " + $(ggggrandfater).find('[name = "employee_first_name"]')[0].value;
                    SummaryField = [$(ggggrandfater).find('[name="employee_full_name"]').eq(0)];
                }
                else return;
                break;
            case "block_customer":
                if(input.name !== "customer_fullname"){
                    let family = $(ggggrandfater).find('[name = "customer_family"]')[0].value;
                    if(family.length<1) {family = ""} else family = family + " ";
                    let name = $(ggggrandfater).find('[name = "customer_name"]')[0].value;
                    if(name.length<1) {name = ""} else name = name.slice(0, 1) + ". ";
                    let patr = $(ggggrandfater).find('[name = "customer_patronymic"]')[0].value;
                    if(patr.length<1) {patr = ""} else patr = patr.slice(0, 1) + ". ";
                    let jname = $(ggggrandfater).find('[name = "customer_jname"]')[0].value;
                    if(jname && jname.length>0){
                        SummaryValue = jname;
                    }
                    else{
                        SummaryValue = family + name + patr;
                    }
                    SummaryField = [$(ggggrandfater).find('[name="customer_fullname"]')];
                }
                else return;
                break;
            case "block_object":
                let city = $(ggggrandfater).find('[name = "object_city"]')[0].value;
                if(city.length<1) {city = ""} else city = "г. " + city + ", ";
                let district = $(ggggrandfater).find('[name = "object_district"]')[0].value;
                if(district.length<1) {district = ""} else district = "р-н " + district + ", ";
                let street = $(ggggrandfater).find('[name = "object_street"]')[0].value;
                if(street.length<1) {street = ""} else street = "ул. " + street + " ";
                let house_number = $(ggggrandfater).find('[name = "object_house_number"]')[0].value;
                if(house_number.length<1) {house_number = ""} else house_number = "дом " + house_number + " ";
                let building = $(ggggrandfater).find('[name = "object_building"]')[0].value;
                if(house_number.length<1) {building = ""} else building = "к. " + building + " ";
                let letter = $(ggggrandfater).find('[name = "object_letter"]')[0].value;
                if(letter.length<1) {letter = ""} else letter = "лит. " + letter + " ";
                let apartment_number = $(ggggrandfater).find('[name = "object_apartment_number"]')[0].value;
                if(apartment_number.length<1) {apartment_number = ""} else apartment_number = "кв. " + apartment_number + " ";
                let post_index = $(ggggrandfater).find('[name = "object_post_index"]')[0].value;
                if(post_index.length<1) {post_index = ""}else post_index = "инд: " + post_index;

                SummaryValue = city + district + street + house_number + building + letter + apartment_number + post_index;
                if($(ggggrandfater).find('[name="object_title"]').attr("value") !== $(ggggrandfater).find('[name="object_address"]').attr("value")){
                    SummaryField = [$(ggggrandfater).find('[name="object_address"]')];
                }
                else {
                    SummaryField = [$(ggggrandfater).find('[name="object_title"]'), $(ggggrandfater).find('[name="object_address"]')];
                }
                break;
            default: return;
        }
        SummaryField.forEach(function(item, i , SummaryField){
            item.attr("value", SummaryValue);
            item.prop("value", SummaryValue);
            highlight_changed_field($(item)[0], container);
        });
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `ошибка при формировании SummaryValue`)
        }
        throw err;
    }
}
/*-----------------------------------------------------------------------------------------------*/
/*    левая колонка справочника (форма для фильтрации данных центральной таблицы)                */
/*-----------------------------------------------------------------------------------------------*/

// события формы hb_filter_form
function filter_form_listeners() {

    // клик по кнопке "Обновить"
    $('.handbook').on('click', '#btn_reload', async function(event){

        try {
            event.preventDefault();
            let source = event.target.formAction + '/' + 'filter_form/btn_reload';
            await reload_central_table(source);
            await reload_tab_main('.handbook');
        }
        catch (err) {
            let error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
            error.message = 'Ошибка [' + error.code + '] - не удалось обновить данные справочника ' + $('#btn_default')[0].value;
            await err_handler(error, $('#btn_default')[0].formAction + '/' + 'filter_form/btn_reload');
            hide_preloader();
        }
    });

    // клик по кнопке "По умолчанию"
    $('.handbook').on('click', '#btn_default', async function(event){

        try {
            show_preloader();
            event.preventDefault();
            let path = event.target.formAction;
            let query = {};
            query.source = event.target.formAction + '/filter_form/btn_default';
            query.target = 'all';
            query.action = 'read';
            let srv_response = await srv_request(path, query);
            await srv_response_rendering(query, srv_response);
            hide_preloader();
        }
        catch (err) {
            let error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
            error.message = 'Ошибка [' + error.code + '] - не удалось загрузить данные справочника';
            await err_handler(error, $('#btn_default')[0].formAction);
            hide_preloader();
        }
    });
}

// подключаем listeners
$(document).ready(function () {
    if(document.location.pathname === '/handbooks.html'
        || document.location.pathname === '/measurements.html'
        || document.location.pathname === '/contracts.html'
        || document.location.pathname === '/reports.html'){
        filter_form_listeners();
    }
});
/*-----------------------------------------------------------------------------------------------*/
/*    кнопки центральной колонки справочника: создать, изменить, удалить и пр.                   */
/*-----------------------------------------------------------------------------------------------*/

// события кнопок
function cc_btn_listeners() {

    // клик по кнопкам центральной таблицы
    $('.handbook').on('click', '#btn_add, #btn_update, #btn_delete', function(event){

        event.preventDefault();
        // Если кликнули на иконку внутри кнопки - изменим target на родительскую кнопку
        if (event.target.localName === 'i') event.target = $(event.target).parent('button')[0]
        cc_btn_handler(event.target);
    });

    // клик по не разработанным кнопкам центральной таблицы
    $('.handbook').on('click', '#btn_data_list, #btn_to_contract, #btn_letter', function(event){
        system_message("Заглушка");
    });
}

// подключаем listeners
$(document).ready(function () {
    if(document.location.pathname === '/handbooks.html'
        || document.location.pathname === '/measurements.html'
        || document.location.pathname === '/contracts.html'
        || document.location.pathname === '/reports.html'){
        cc_btn_listeners();
    }
});

/* обработчик событий кнопок центральной колонки справочника
    сбор данных
    запрос на сервер
    обработка ответа сервера
    обновляем контент страницы
 */
async function cc_btn_handler(event_source) {

    try {
        show_preloader();
        // запрос на сервер
        let path = $('#btn_default')[0].formAction;
        let query = {};
        query.source = await get_request_source(event_source, 'button', '.handbook');
        query.target = await get_response_target(event_source, 'button', '.handbook');
        query.record_id = await get_record_id(event_source, 'button', query.target);
        query.action = await get_request_action(event_source, 'button', '.handbook', query.record_id);
        query.data = await get_cc_data(event_source);
        let srv_response = await srv_request(path, query)

        // обновляем контент страницы
        await refresh_the_page(query, srv_response);
        hide_preloader();
    }
    catch (err) {
        let error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
        error.message = `Ошибка [${error.code}] - не удалось обработать нажатие кнопки ${event_source.id}`;
        err_handler(error, $('#btn_default')[0].formAction);
        hide_preloader();
    }
}

// собираем данные
async function get_cc_data(event_source) {
    try{
        switch (event_source.id) {
            case 'btn_delete':
                return {'delete_mark': true};
            default:
                return undefined;
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось собрать данные кнопки ${event_source.id}. причина: ${err.message}`)
        }
        throw err;
    }
}
/*-----------------------------------------------------------------------------------------------*/
/*    центральная таблица справочника                                                            */
/*-----------------------------------------------------------------------------------------------*/

// события центральной таблицы
function hb_central_table_listeners() {

    /* ++KHC300821 изменение логики щелчков по строкам таблицы
    * Одинарный клик выделяет строку и открывает вкладку справа
    * Двойной клик открывает окно "Изменить" для текущей выбранной строки
    */

    // одинарный клик по любой строке таблицы
    $('.handbook').on('click', '.central_table_body tr', async function(event){
        // Функция срабатывает только если нажатая строка еще не выбрана
        if (typeof $(this).attr('active_record') === 'undefined'){
            let target = event.target.parentElement;
            event.preventDefault();

            $('.central_table_body tr[active_record]').removeAttr('active_record');
            $(target).attr('active_record', '');
            await reload_tab_main('.handbook');
        }
    });

    // двойной клик по любой строке таблицы
    $('.handbook').on('dblclick', '.central_table_body tr', async function(event){
        event.preventDefault();
        cc_btn_handler(document.getElementById('btn_update'));
    });
}

// подключаем listeners
$(document).ready(function () {
    if(document.location.pathname === '/handbooks.html'
        || document.location.pathname === '/measurements.html'
        || document.location.pathname === '/contracts.html'
        || document.location.pathname === '/reports.html'){
        hb_central_table_listeners();
    }
});
/*-------------------------------------------------------------------------------------------------------------------*/
/*    диалоговое окно для редактирования данных справочников (вызов кнопками: создать, изменить)                     */
/*-------------------------------------------------------------------------------------------------------------------*/

// события формы hb_edit_form
function hb_edit_form_listeners() {

    // клик по кнопке "Сохранить"
    $('#hb_edit_form').on('click', '#btn_save', async function(event){

        event.preventDefault();
        await check_ef_changes('btn_save', event);
    });

    // клик по кнопке "Выход"
    $('#hb_edit_form').on('click', '#btn_cancel', async function(event){
        event.preventDefault();
        await check_ef_changes('btn_cancel', event);
    });

    // клик по пустому полю вокруг формы
    $('#hb_edit_form').on('click', '.ef_base', async function(event){
        event.preventDefault();
        await check_ef_changes('.ef_base', event);
    });

    // клик по кнопке "выбрать из списка" (три горизонтальные полосы)
    $('#hb_edit_form').on('click', '.tab_btn_addfromlist', function(event) {
        event.preventDefault();
        let gggrandfather = event.target.parentElement.parentElement.parentElement.parentElement;
        if ($(gggrandfather).attr("data-blocked_list")) return;
        let slave_blocks = $("#hb_edit_form .tabs_pane_show").find("[data-nesting]");
        btn_addfromlist_handler(event.target, ($(gggrandfather).attr('data-addfromlist') === 'true'), slave_blocks);
    });

    // клик по большой кнопке "создать" (большая кнопка с большим зеленым плюсом)
    $('#hb_edit_form').on('click', '.bigbtn_new, .tab_btn_new', function(e){
        e.preventDefault();

        if (!$(e.target).hasClass('.bigbtn_new')) e.target = $(e.target).closest('.bigbtn_new') // Заменяем target кнопкой, если нажат плюс или надпись

        // Проверим существование класса upload_attachments_btn у элемента или родителя
        let btn_id = $(this).attr('id')
        let content, iter
        let btn = $('#'+btn_id)

        switch (btn_id){
            case 'upload_attachments_btn':
                upload_file_explorer($(this))
                break
            case 'add_customer_contact':
                iter = btn.siblings('.tab_table').find('tr.new_contact_item').length
                content = get_contact_html(e, iter)
                add_page_new_contact(e, content)
                break
            case 'add_customer_contact_person':
                iter = btn.siblings('details.new_contact_person_item').length
                content = get_contact_person_html(e, iter)
                add_page_new_contact_person(e, content)
                break
            case 'add_document':
                iter = btn.siblings('details.new_identity').length
                content = get_identity_html(e, iter)
                add_page_new_identity(e, content)
                break
            case 'add_account':
                iter = btn.siblings('details.new_account').length
                content = get_account_html(e, iter)
                add_page_new_account(e, content)
                break
            default:
                system_message('клик по большой кнопке "создать"', '#hb_edit_form')
        }
    });

    // Drag & Drop для файлов на большую кнопку "создать" ++KHC231121
    $("html").on("dragover", function (e) {
        e.preventDefault();
        $('.upload_attachments_btn').hide()
        $('.drop_file_area').addClass('drag_over');
        e.stopPropagation();
    });

    // Drag & Drop для файлов на большую кнопку "создать" ++KHC231121
    $("html").on("drop", function (e) {
        e.preventDefault();
        $('.upload_attachments_btn').show()
        $('.drop_file_area').removeClass('drag_over');
        e.stopPropagation();
    });

    // Drag & Drop для файлов на большую кнопку "создать" ++KHC231121
    $('.drop_file_area').on('dragleave', function (e) {
        $('.upload_attachments_btn').show()
        $(e.target).removeClass('drag_over');
        return false;
    });

    // Drag & Drop для файлов на большую кнопку "создать" ++KHC231121
    $('#hb_edit_form').on('drop', '.drop_file_area', function (e) {
        e.preventDefault();
        $('.upload_attachments_btn').show()
        $(e.target).removeClass('drag_over');

        let dataTransfer = e.originalEvent.dataTransfer.files // Файлы полученные с Drag&Drop

        init_files(dataTransfer, e)

    }) // При попадании файлов в поле drag&drop

    // Действие при изменении содержимого скрытого поля input[file]
    $('#hb_edit_form').on('change', 'input.file-attachments-upload', function (e) {
        let dataFiles = $('.tabs_pane_show .file-attachments-upload').prop('files') // Получаем файлы, загруженные в input['file'] только что
        init_files(dataFiles, e)
    })

    // клик по кнопке "удалить" (красный крестик)
    $('#hb_edit_form').on('click', '.tab_btn_del', async function(event){
        event.preventDefault();
        show_preloader();
        let del_res
        let tab_id = $('#hb_edit_form').find('.tabs_pane_show:eq(0)').attr('id');

        switch (tab_id){
            case 'tab_attachments':
                del_res = await delete_attachment(event)
                break
            case 'tab_contacts':
                del_res = await delete_contact(event)
                break
        }
        hide_preloader();
    });

    // клик по кнопке "выбрать элемент" (серый чекбокс)
    $('#hb_edit_form').on('click', '.tab_btn_checkbox', function(event){
        event.preventDefault();
        let target = event.target;
        let ggrandfather = target.parentElement.parentElement.parentElement;

        highlight_changed_field(target.parentElement, '#hb_edit_form');
        if(ggrandfather.attributes.checked_row){
            ggrandfather.removeAttribute('checked_row');
        }
        else {
            ggrandfather.setAttribute('checked_row', '');
        }

        let tab_id = $('#hb_edit_form').find('.tabs_pane_show:eq(0)').attr('id');

        switch (tab_id){
            case 'tab_contacts':
                change_attached(event, ggrandfather.attributes.checked_row)
                break
            default:
                system_message('клик по кнопке "выбрать элемент"', '#hb_edit_form');
        }
    });
}

// подключаем listeners
$(document).ready(function () {
    if(document.location.pathname === '/handbooks.html'
        || document.location.pathname === '/measurements.html'
        || document.location.pathname === '/contracts.html'
        || document.location.pathname === '/reports.html'){
        hb_edit_form_listeners();
    }
});

// проверка, есть ли изменения на форме
async function check_ef_changes(source_alias, event) {
    try {
        let arr = $('#hb_edit_form').find('.tabs_pane_show').find('[changed_field]');
        if(!arr[0]) {
            switch (source_alias) {
                case 'btn_save':
                    break;
                case '.tabs_link':
                    await tab_handler($('#hb_edit_form').find('.tabs')[0], event.target, '#hb_edit_form');
                    break;
                case 'btn_cancel':
                case '.ef_base':
                case 'Escape':
                    await close_edit_form();
                    break;
            }
        }
        else {
            let path = $('#btn_default')[0].formAction;
            let target, callback;
            switch (source_alias) {
                case 'btn_save':
                    if(await check_obligatory_fields()) return;
                    await ef_handler(event.target);
                    break;
                case '.tabs_link':
                    target = event.target.href.slice(event.target.href.indexOf('#tab_'));
                    callback = async function(result){
                        if(result){
                            if(await check_obligatory_fields()) return;
                            await ef_handler($('#hb_edit_form [id="btn_save"]:eq(0)'));
                        }
                        let tabsLinkTarget = $('#hb_edit_form').find(`a[href="${target}"]`)[0];
                        let event_source = $('.ef_data.tabs');
                        await tab_handler(event_source, tabsLinkTarget, '#hb_edit_form');
                    };
                    await get_dialog_box(path + '/edit_form/' + target, 'check_ef_changes()', callback);
                    break;
                case 'btn_cancel':
                case '.ef_base':
                case 'Escape':
                    callback = async function(result){
                        if(result){
                            if(await check_obligatory_fields()) return;
                            await ef_handler($('#hb_edit_form [id="btn_save"]:eq(0)'));
                        }
                        await close_edit_form();
                    };
                    await get_dialog_box(path + '/edit_form/' + source_alias, 'check_ef_changes()', callback);
                    break;
            }
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось проверить изменения данных формы редактирования. причина: ${err.message}`)
        }
        throw err;
    }
}

/*  обработчик данных формы редактирования:
    формируем стек запросов
    запрос на сервер
    обновляем контент страницы
    изменение режима отображения формы
*/
async function ef_handler(event_source) {
    try {
        show_preloader();
        let path = $('#btn_default')[0].formAction;
        let source = await get_request_source(event_source, "button", "#hb_edit_form");
        let request_stack = await get_request_stack(source);

        for(let i=0; i<request_stack.object_keys.length; i++) {
            for(let block of request_stack.request_pile[request_stack.object_keys[i]].keys()){
                for(let rec_id in request_stack.request_pile[request_stack.object_keys[i]].get(block)){
                    let block_fields = request_stack.request_pile[request_stack.object_keys[i]].get(block)[rec_id];

                    let query = {};
                    query.source = source;
                    query.target = $(block).attr("title") ? $(block).attr("title") : $(block).attr("id");
                    query.record_id = ((query.target.slice(0,4) !== "tab_") ? rec_id : $("#hb_edit_form #tab_main section:first").attr("record_id"));
                    query.action = await get_request_action($("#hb_edit_form #btn_save")[0], "button", "#hb_edit_form", query.record_id);
                    query.data = block_fields;
                    if(query.record_id.slice(0,10) === 'new_record' && query.target.slice(0,4) === "bloc"){
                        query.data = Object.assign(block_fields, await get_parent_record(block));
                    }
                    let srv_response = await srv_request(path, query);

                    await srv_response_rendering(query, srv_response, block);
                    if(!srv_response || !srv_response.data || srv_response.data.error || srv_response.data.message){
                        hide_preloader();
                        return;
                    }
                    await remove_change_marks(block);
                }
            }
        }
        await ef_appearance();
        hide_preloader();
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось обработать данные формы редактирования. причина: ${err.message}`)
        }
        await err_handler(err, $('#btn_default')[0].formAction);
    }
}

/* функция формирует стек запросов к серверу на основе данных полей формы редактирования и иерархии html блоков формы
    иерархия определяется по значению атрибута [nesting] (см https://remelle.atlassian.net/wiki/spaces/TWINEHOME/pages/59900264/html)
    подробное описание здесь: https://remelle.atlassian.net/wiki/spaces/TWINEHOME/pages/60031108/request+stack
 */
async function get_request_stack() {
    try{
        let request_pile = {};
        let arr = $('#hb_edit_form').find('.tabs_pane_show').find('[changed_field]');
        let tab = $('#hb_edit_form .tabs_pane_show:eq(0)');
        let block, block_title, record_id, nesting_level;

        for(let i=0; i<arr.length; i++){
            block = arr[i].parentElement.parentElement.parentElement.parentElement.parentElement;
            nesting_level = $(block).attr('data-nesting');
            block_title = $(block).attr('title');
            record_id = undefined;

            if(!block_title){
                nesting_level = '0';
                block = tab;
            }
            let field_type = await get_field_type(arr[i]);
            record_id = await get_record_id(arr[i], field_type, "edit_form/" + block_title);

            if(!request_pile[nesting_level]) {
                request_pile[nesting_level] = new Map();
            }
            if(!request_pile[nesting_level].has(block)) {
                request_pile[nesting_level].set(block, {});
            }
            if(!request_pile[nesting_level].get(block)[record_id]) {
                request_pile[nesting_level].get(block)[record_id] = {};
            }

            if (arr[i].name === 'content'){
                request_pile[nesting_level].get(block)[record_id][arr[i].name] = await read_file(arr[i])
            }else{
                request_pile[nesting_level].get(block)[record_id][arr[i].name] = await get_field_data(arr[i]);
            }
        }

        let object_keys = Object.keys(request_pile).sort();
        if(object_keys.length>1 && object_keys[0] === '0'){
            let nesting_0 = object_keys.shift();
            object_keys.push(nesting_0);
        }
        return {object_keys: object_keys, request_pile: request_pile};
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось сформировать стек запросов. причина: ${err.message}`)
        }
        throw err;
    }
}

// извлекаем данные измененных полей формы
async function get_field_data(field) {

    try{
        if($(field).attr('record_id')){
            return Object[field.name] = $(field).attr('record_id');
        }
        else {
            return Object[field.name] = field.value;
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось собрать данные поля формы редактирования. причина: ${err.message}`)
        }
        throw err;
    }
}

/*  изменение режима отображения формы:
    скрываем пометки об изменениях в полях
    если форма была в режиме создания записи:
        переводим в "режим редактиования"
        разблокируем заблокированные вкладки
 */
async function ef_appearance() {

    try{
        // await remove_change_marks('default');
        await remove_change_marks();
        if($('.ef_container[new_record]')[0]){
            $('.ef_container').removeAttr('new_record');
            $('.ef_title_method').text('редактирование записи');
            let arr = $('#hb_edit_form').find('[inactive_element]');
            for(let i=0; i<arr.length; i++){
                $(arr[i]).removeAttr('inactive_element');
            }
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `ошибка при переключении режима формы редактирования. причина: ${err.message}`)
        }
        throw err;
    }
}

/* удаляем пометки об изменениях на форме редактирования
    если target !== undefined, удаляем пометку из конкретного поля
    если target == undefined, удаляем все пометки на форме
*/
async function remove_change_marks(target) {
    try{
        if(target && $(target).attr("title")){
            $(target).find('[changed_field]:eq(0)').removeAttr('changed_field');
            $(target).find('[changed]:eq(0)').removeAttr('changed');
        }
        else {
            let arr, arr2;
            arr = $('#hb_edit_form').find('[changed_field]');
            arr2 = $('#hb_edit_form').find('[changed]');
            for(let i=0; i<arr.length; i++){
                $(arr[i]).removeAttr('changed_field')
            }
            for(let i=0; i<arr2.length; i++){
                $(arr2[i]).removeAttr('changed')
            }
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось удалить пометки об изменениях в полях ввода. причина: ${err.message}`)
        }
        throw err;
    }
}

/* обработчик клика по кнопке "выбрать из списка" (три горизонтальные зеленые/серые полосы)
    переключает режим отображения блока: "режим выбора из списка" и "режим создания новой записи"
    при переходе к "созданию новой записи":
        скрывает выпадающий список в заголовке
        очищает поля ввода
        разблокирует поля для редактирования
    при переходе к "выбору из списка":
        показывает выпадающий список в заголовке
        очищает поля ввода
        блокирует поля ввода для редактирования

    принимает параметры:
        target              - кнопка, по которой нажали (обязательный)
        turn_off_the_list   - переключить блок из режима "выпадающего списка" в режим "создания новой записи" (обязательный)
        slave_blocks        - массив подчиненных блоков, с бОльшим значением атрибута [nesting] (необязательный)
*/
async function btn_addfromlist_handler(target, turn_off_the_list, slave_blocks) {
    try {
        let ggrandfather = target.parentElement.parentElement.parentElement;
        let gggrandfather = target.parentElement.parentElement.parentElement.parentElement;
        let input = ggrandfather.children[1].firstElementChild;
        let select_input = ggrandfather.children[1].lastElementChild;

        // очищаем поля блока и сбрасываем пометки об изменениях
        erase_block_content(gggrandfather);

        // для блоков в режиме "создания новой записи" генерим id вида [new_record_*] (уникальные id нужны для функции get_request_stack)
        let id_field = $(gggrandfather).find('>table>tbody:first-child input[name="id"]')[0];
        if(!id_field.value || !id_field.value.match('new_record_')){
            let new_records = $('#hb_edit_form').find('.tabs_pane_show').find('input[name="id"][value^="new_record_"]');
            let block_record_id = 'new_record_0';
            let arr=[];
            if(new_records[0]){
                for(let i=0; i<new_records.length; i++){
                    arr.push($(new_records[i]).attr('value'));
                }
                arr.sort();
                block_record_id = 'new_record_' + (arr[arr.length-1].slice(11)*1 + 1);
            }
            id_field.value = block_record_id;
            $(id_field).attr('value', block_record_id);
        }

        // переключаем блок из режима "выпадающего списка" в режим "создания новой записи" и обратно
        if(turn_off_the_list){
            $(gggrandfather).attr('data-addfromlist', false);
            $(gggrandfather).attr("open", "");
            input.classList.add('active_field');
            $(input).attr("value", "новая запись");
            select_input.classList.remove('active_field');
        }
        else {
            $(gggrandfather).attr('data-addfromlist', true);
            $(gggrandfather).removeAttr("open");
            input.classList.remove('active_field');
            $(input).attr("value", "");
            select_input.classList.add('active_field');
        }

        // переключаем режим подчиненных блоков, с бОльшим значением атрибута [nesting]
        if(slave_blocks){
            for(let i=0; i<slave_blocks.length; i++) {
                if($(slave_blocks[i]).attr("data-nesting")>$(gggrandfather).attr("data-nesting")){
                    if (!turn_off_the_list) $(slave_blocks[i]).removeAttr("data-blocked_list")
                    else $(slave_blocks[i]).attr("data-blocked_list", true);

                    target = $(slave_blocks[i]).find(".tab_btn_addfromlist >div")[0];
                    if(target) btn_addfromlist_handler(target, turn_off_the_list);
                }
            }
        }

        // сбрасываем значения в зависимых от блока полях
        let related_values = $(gggrandfather).find('[title_for]');
        for(var i=0; i<related_values.length; i++){
            $(related_values[i]).text('');
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось обработать клик по кнопке [tab_btn_addfromlist]. причина: ${err.message}`)
        }
        throw err;
    }
}

/* проверяем значения полей, обязательных к заполнению (поля, отмеченные звездочкой)
    функция возвращает true если обнаружены незаполненные поля и false, если не обнаружены */
async function check_obligatory_fields() {
    try{
        let arr = $('#hb_edit_form').find('.tabs_pane_show').find('[data-obligatory_field]');
        for(let i=0; i<arr.length; i++){
            let field_value = $(arr[i]).find('[tab_form_field]:eq(0)').attr('value');
            let valuefromlist = $(arr[i].parentElement.parentElement.parentElement).attr("data-addfromlist") === "true";
            if((field_value === undefined || field_value.length<1) && !valuefromlist){
                $(arr[i]).attr("style", "background: rgba(246, 153, 153, 0.6)");
                $(arr[i].parentElement.parentElement.parentElement).attr("style", "outline: 2px solid red");
                $('#hb_edit_form [id="btn_save"]').attr("style", "background: rgba(246, 153, 153, 0.6)");
                system_message("нужно заполнить все поля, отмеченные звездочкой", "#hb_edit_form", 'notification');
                setTimeout(()=>{
                    $(arr[i]).attr("style", "");
                    $(arr[i].parentElement.parentElement.parentElement).attr("style", "");
                    $('#hb_edit_form [id="btn_save"]').attr("style", "");
                }, 500);
                return true;
            }
        }
        return false;
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось проверить поля, обязательные к заполнению. причина: ${err.message}`)
        }
        throw err;
    }
}

// функция обновляет данные центральной таблицы и вкладку "основное" справочника
async function close_edit_form() {
    try {
        $('#hb_edit_form').attr('style','display: none');
        let record_id = await get_record_id($('#btn_cancel:eq(0)'), 'button', 'central_table');
        if(record_id !== "new_record"){
            let source = $('#btn_default')[0].formAction;
            await reload_central_table(source, record_id);
            await reload_tab_main(".handbook");
        }
    }
    catch (err) {
        let error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
        error.message = 'Ошибка [' + error.code + '] - при закрытии формы редактирования. причина: ' + err.message;
        await err_handler(error, $('#btn_default')[0].formAction + '/' + 'filter_form/btn_reload');
    }
}
/*----------------------------------------------------------------------------------------------------*/
/*   функции общего назначения                                                                        */
/*----------------------------------------------------------------------------------------------------*/

// функция возвращает id в БД и текстовое значение выделенного элемента списка chosen-select
async function get_list_record(list, input_name) {

    try{
        let records = ($(list).find('li[class*="selected"]'));
        let record = $($(list.firstElementChild).find('option')[$(records[records.length-1]).attr("data-option-array-index")]);
        return {name: input_name,
            value: record.attr("record_id"),
            text_value: record[0].innerText
        };
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), `не удалось получить данные записи выпадающего списка! причина: ${err.message}`)
    }
}

// процедура возвращает имя, путь для сохранения и контент файла
async function read_file(input) {

    try{
        // let data={};
        let file = input.files[0];
        if(file){
            let result = new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function() {
                    resolve(reader.result)
                };
                reader.onerror = function () {
                    reject(new Error('ошибка чтения файла! ' + file.name));
                }
            });
            return await result;
        }
        else {
            let container = await get_container();
            system_message('файл не выбран!', container);
        }
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), `не удалось сохранить файл! причина: ${err.message}`)
    }
}

// снимаем выделение с текста в полях формы
async function deselectAll() {

    try{
        let element = document.activeElement;

        if (element && /INPUT|TEXTAREA/i.test(element.tagName) && element.type === 'text') {
            if ('selectionStart' in element) {
                element.selectionEnd = element.selectionStart;
            }
            element.blur();
        }

        if (window.getSelection) { // All browsers, except IE <=8
            window.getSelection().removeAllRanges();
        } else if (document.selection) { // IE <=8
            document.selection.empty();
        }
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), ` причина: ${err.message}`)
    }
}

// удаляем контент html блока
async function clear_content(srv_request, container) {

    try {
        switch (srv_request.target.slice(0,4)) {
            case 'all':
                $('.handbook').html('');
                break;
            case 'cent':
                if(!srv_request.record_id) {
                    $('.central_table_body').html('');
                }
                break;
            case 'tab_':
                $('.handbook').find('#' + srv_request.target).html('');
                break;
            case 'edit':
                if(srv_request.target === "edit_form") {
                    $('#hb_edit_form').html('');
                }
                else {
                    $('#hb_edit_form').find('#' + srv_request.target.slice(10)).html('');
                }
                break;
            case 'bloc':
                $(container).find(`details[title="${srv_request.target}"]`).find(`table[class='tab_table']`).html('');
                break;
            case 'list':
                $(container).find(`select[title="${srv_request.target}"]`).html('')
                break;
        }
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), `не удалось очистить контент html блока! причина: ${err.message}`)
    }
}

/* функция для удаления контента в html блоках <details>
    удаляет контент из полей ввода
    убирает пометки об изменениях (зеленую подсветку)
    сбрасывает значения выпадающих списков и выставляет в значение плейсхолдера
 */
function erase_block_content(block) {
    try {
        let placeholder = $(block).find("summary [data-placeholder]").attr("data-placeholder");
        $(block).find("summary a.chosen-single").addClass("chosen-default")
            .html(`<span>${placeholder}</span><div><b></b></div>`)

        let fields = $(block).find('input[tab_form_field]');
        for(let i=0; i<fields.length; i++){
            if($(fields[i]).attr('value') !== 'new_record') $(fields[i]).attr('value', '')
        }

        $(block).find('[changed]').removeAttr('changed');
        $(block).find('[changed_field]').removeAttr('changed_field')
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось удалить контент блока. причина: ${err.message}`)
        }
        throw err;
    }
}

// загружаем данные ответа сервера на страницу
async function srv_response_rendering(srv_request, srv_response, request_source) {
    try {
        let container = await get_container();
        try {
            if(srv_request.action === 'without_dispatch'){return}
            if(srv_response.data.error) {
                console.error(srv_response.data.error);
                system_message(srv_response.data.error, container, 'error');
                return;
            }
            else if(srv_response.data.message) {
                console.log(srv_response.data.message);
                system_message(srv_response.data.message, container);
                return;
            }
        }
        catch (e) {
            await clear_content(srv_request, container);
            return;
        }

        switch (srv_request.action) {
            case 'read':
                await clear_content(srv_request, container);
                switch (srv_request.target.slice(0,4)) {
                    case 'all':
                        $('.handbook').html(srv_response.data);
                        break;
                    case 'cent':
                        if(!srv_request.record_id) {
                            $('.central_table').html(srv_response.data);
                        }
                        else {
                            let targetrow = $('.central_table tr[active_record]')[0];
                            $(targetrow).removeAttr("active_record");
                            if(targetrow && $(targetrow).find("td:eq(0)").prop("innerText") === srv_request.record_id) {
                                targetrow.insertAdjacentHTML('afterend', srv_response.data.table_records.string);
                                targetrow.remove();
                            }
                            else {
                                $(targetrow).removeAttr("active_record");
                                targetrow = $('.central_table_body table')[0];
                                targetrow.insertAdjacentHTML('afterbegin', srv_response.data.table_records.string);
                            }
                        }
                        break;
                    case 'tab_':
                        $('.handbook').find('#' + srv_request.target).html(srv_response.data);
                        break;
                    case 'edit':
                        if(srv_request.target === "edit_form") {
                            let hb_alias;
                            $('#hb_edit_form').html(srv_response.data)
                                .attr('style', 'display: block');

                            if($('#btn_default').attr('formaction').match("handbook_list")) {
                                hb_alias = $('.sidebar_link_active')[0].text
                            }
                            else {
                                hb_alias = $('#btn_default')[0].value
                            }
                            $('.ef_title_title').html(`Справочник "${hb_alias}".`);
                        }
                        else {
                            $('#hb_edit_form').find('#' + srv_request.target.slice(10)).html(srv_response.data);
                        }
                        break;
                    case 'bloc':
                        $(container).find(`details[title="${srv_request.target}"]`).find(`>table[class='tab_table']`).html(srv_response.data);
                        break;
                    case 'list':
                    case 'filt':
                        $(container).find(`select[title="${srv_request.target}"]`).html(srv_response.data)
                            .trigger('chosen:updated');
                        break;
                    case 'dial':
                        $('#dialog_box').html(srv_response.data)
                        break;
                }
                break;
            case 'insert':
                switch (srv_request.target.slice(0,4)) {
                    case 'tab_':
                        $(request_source).find('section:first').attr("record_id", srv_response.data[0].id)
                        break;
                    case 'bloc':
                        $(request_source).find('input[name="id"]:eq(0)').attr("value", srv_response.data[0].id)
                                                                        .val(srv_response.data[0].id);
                        let hb_title = await get_handbook_title(srv_request.source);
                        if(hb_title.includes(srv_request.target.slice(7), 10)){
                            $("#hb_edit_form #tab_main section:first").attr("record_id", srv_response.data[0].id);
                        }
                        if(srv_request.target === "block_one_attachment"){
                            $(request_source).find(">summary>span:eq(1)>a:eq(0)").attr("href", srv_response.data[0].path);
                            $(request_source).find("input[name='delete_key']").attr("value", srv_response.data[0].delete_key);
                        }
                        break;
                }
                break;
            case 'update':
                break;
            case 'delete':
                break;
        }
        $.getScript('js/chosen.js');
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), `не удалось загрузить ответ сервера на страницу! причина: ${err.message}`)
    }
}

// обновляем контент страницы
async function refresh_the_page(srv_request, srv_response) {
    try {
        await srv_response_rendering(srv_request, srv_response);
        if(srv_request.action === 'insert' || srv_request.action === 'update') {
            if(!srv_response || !srv_response.data || srv_response.data.error || srv_response.data.message){return}
            let record_id = $($('.handbook').find('.tabs_pane_show>section:first')[0]).attr("record_id");
            await reload_central_table(srv_request.source, record_id);
        }
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), `не удалось обновить контент страницы! причина: ${err.message}`)
    }
}

// функция обновляет данные центральной таблицы
async function reload_central_table(source, record_id) {
    try {
        show_preloader();
        let path = $('#btn_default')[0].formAction;
        let query = {};
        query.source = source;
        query.target = 'central_table';
        query.record_id = record_id;
        query.action = 'read';
        if(!record_id) {
            query.conditions = await get_query_conditions('central_table');
        }
        let srv_response = await srv_request(path, query);
        await srv_response_rendering(query, srv_response);
        hide_preloader();
    }
    catch (err) {
        let error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
        error.message = 'Ошибка [' + error.code + '] - не удалось обновить данные центральной таблицы. причина: ' + err.message;
        err_handler(error, $('#btn_default')[0].formAction + '/' + 'filter_form/btn_reload');
        hide_preloader();
    }
}

// получаем имя справочника
async function get_handbook_title(path) {
    try{
        let arr = path.split("/");
        for(let i=0;i<arr.length; i++){
            if(arr[i].match('handbook_')){
                return arr[i].replace('.html', '');
            }
        }
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), `- не удалось получить имя справочника. причина: ${err.message}`)
    }
}

// генерим номер заявки из id заявки и типа
async function get_measurement_number(ggggrandfater, type_id) {
    try{
        switch (type_id) {
            case 1:
                return ("000000" + $(ggggrandfater).find('[name = "id"]')[0].value + 'REM').substr(-9, 9);
            case 2:
                return ("000000" + $(ggggrandfater).find('[name = "id"]')[0].value + 'DIZ').substr(-9, 9);
            case 3:
                return ("000000" + $(ggggrandfater).find('[name = "id"]')[0].value + 'MEB').substr(-9, 9);
            case 4:
                return ("000000" + $(ggggrandfater).find('[name = "id"]')[0].value + 'KLI').substr(-9, 9);
            case 5:
                return ("000000" + $(ggggrandfater).find('[name = "id"]')[0].value + 'STR').substr(-9, 9);
            default:
                throw new Error("неопознанный тип заявки");
        }
    }
    catch (err) {
        throw new CLError('CL1001', _stackTrace(), `- не удалось получить номер заявки. причина: ${err.message}`)
    }
}
/*-----------------------------------------------------------------------------------------------*/
/*    функции для сбора данных фильтров (выпадающих списков)                                     */
/*-----------------------------------------------------------------------------------------------*/

/*  извлекаем данные формы фильтрации справочника (левая колонка)
    фильтры формы фильтруют друг друга и записи центральной таблицы справочника
*/
async function get_filterform_filters() {

    try {
        let handbook_list = $('#btn_default')[0].formAction.match('handbook_list');
        let filter_form_data = {};
        let item_placeholder, records, record, record_id;
        let selects = document.querySelectorAll('.col1_bottom>.filter_select');
        let dates = document.querySelectorAll('.col1_bottom>.filter_date');
        let checkboxes = document.querySelectorAll('.col1_bottom>.filter_checkbox');

        if (selects.length > 0) {
            selects.forEach(function (item) {
                records = ($(item).find('li[class*="selected"]'));
                record = records[records.length-1];
                item_placeholder = item.firstElementChild.getAttribute('data-placeholder');
                let record_value = $(item.lastElementChild).find('>a>span').text();
                if(record){
                    if (record_value !== item_placeholder) {
                        record_id = $($(item.firstElementChild).find('option')[ $(record).attr("data-option-array-index")]).attr("record_id");
                        if(handbook_list){
                            filter_form_data['id'] = record_id;
                        }
                        else {
                            let list_title = item.firstElementChild.title.slice(item.firstElementChild.title.indexOf('list__')+6);
                            filter_form_data[list_title] = record_id;
                        }
                    }
                }
            });
        }
        if (dates.length > 0) {
            if (dates[0].firstElementChild.value !== "") {
                filter_form_data[dates[0].firstElementChild.name] = dates[0].firstElementChild.value;
            }
            if (dates[0].lastElementChild.value !== "") {
                filter_form_data[dates[0].lastElementChild.name] = dates[0].lastElementChild.value;
            }
        }
        if (checkboxes.length > 0) {
            checkboxes.forEach(function (item) {
                if (!item.lastElementChild.checked) {
                    filter_form_data[item.lastElementChild.id] = false;
                }
            });
        }
        return filter_form_data;
    }
    catch (err) {
        let error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
        error.message = 'Ошибка [' + error.code + '] - не удалось получить данные блока фильтров!';
        err_handler(error, $('#btn_default')[0].formAction);
    }
}

/*  извлекаем данные выпадающих списков из вкладок справочника
    значения выпадающих списков фильтруют записи других выпадающих списков на вкладке
    функция применяется для вкладок справочника (правая колонка) и вкладок формы редактирования (кнопка "редактировать")
 */
async function get_tab_filters() {

    try{
        let filters = {};
        let container = await get_container();
        let arr = $(container).find('input[class ~= "paired_field"]');

        for(let i=0; i<arr.length; i++){
            let list_record_id = $(arr[i]).attr("record_id");
            if(list_record_id !== undefined && list_record_id !==''){
                filters[arr[i].name] = list_record_id;
            }
        }
        return filters;
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось собрать данные выпадающих списков. причина: ${err.message}`)
        }
        throw err;
    }
}
/*-------------------------------------------------------------------------------------------------------------------*/
/*    функции для генерации блоков контактов и контактных лиц                                                        */
/*-------------------------------------------------------------------------------------------------------------------*/

// Функция генерации блока контактов для заказчика/сотрудника
function get_contact_html(e, i){
    let parent_name = $(e.target).attr('parent_name')

    return `<tr class="full_width_row new_contact_item" changed>
                <td checklist="true" addremove_btn="true" parent_name="${parent_name}" title='block_one_contact' nesting="2">
                    <table>
                        <tr style="display: none" forbidden>
                            <td>ID:</td>
                            <td><input name="id" type="text" value="new_record_${i}" readonly tab_form_field></td>
                        </tr>
                        <tr style="display: none" forbidden>
                            <td>ID родительской записи:</td>
                            <td>
                                <input name="${parent_name}" type="text" value="" data-parent_record readonly tab_form_field>
                            </td>
                        </tr>
                        <tr data-obligatory_field multiple>
                            <td>
                                <input name="type" class="left_column paired_field" type="text" record_id="" value="" readonly tab_form_field placeholder="Тип контакта" changed_field>
                                <div class="paired_field active_field" data-ddlist_only>
                                    <select title="list__contact_type" class="chosen_select before_parsing" data-placeholder="Тип контакта">
                                        <option></option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                <input name="value" class="" type="text" value="" readonly tab_form_field changed_field>
                            </td>
                            <td class="tab_form_buttons" checklist="true" addremove_btn="true" parent_name="${parent_name}"><div class="tab_btn_del"><div></div></div></td>
                        </tr>
                    </table>
                </td>
            </tr>`
}

// Функция генерации блока контактов для контактного лица по договору
function get_contact_person_html(e, i){
    let parent_name = $(e.target).attr('parent_name')

    return `<details class="new_contact_person_item" checklist="true" addremove_btn="true" title="block_one_contact_person" data-nesting="2" open="">
                <summary changed="">
                    <span>Новый контакт</span>
                    <span></span>
                    <td class="tab_form_buttons" checklist="true" addremove_btn="true" parent_name="${parent_name}"><div class="tab_btn_del"><div></div></div></td>
                </summary>
                <table class="tab_table">
                    <tbody>
                        <tr style="display: none" forbidden="">
                            <td>ID:</td>
                            <td><input name="id" type="text" value="new_record_person_${i}" readonly="" tab_form_field=""></td>
                        </tr>
                        <tr style="display: none" forbidden="">
                            <td>ID родительской записи:</td>
                            <td>
                                <input name="${parent_name}" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                            </td>
                        </tr>
                        <tr multiple="" changed="">
                            <td>ФИО конт лица:</td>
                            <td>
                                <input name="full_name" class="active_field" type="text" value="" tab_form_field="" changed_field readonly="">
                            </td>
                            <td class="tab_form_btn_plug"></td>
                        </tr>
                        <tr class="full_width_row">
                            <td checklist="true" addremove_btn="true" title="block_one_contact_person_contact" data-nesting="3" "="">
                                <table>
                                    <tbody>
                                        <tr style="display: none" forbidden="">
                                            <td>ID:</td>
                                            <td><input name="id" type="text" value="new_record_person_${i}_0" readonly="" tab_form_field=""></td>
                                        </tr>
                                        <tr style="display: none" forbidden="">
                                            <td>ID родительской записи:</td>
                                            <td>
                                                <input name="contact_person" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                                            </td>
                                        </tr>
                                        <tr multiple="" changed="" checked_row="">
                                            <td>
                                                <input name="type" class="left_column paired_field" type="text" record_id="" value=1 readonly tab_form_field placeholder="Тип контакта" changed_field>
                                                <div class="paired_field active_field" data-ddlist_only>
                                                    <select title="list__contact_type" class="chosen_select before_parsing" data-placeholder="Тип контакта">
                                                        <option></option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <input name="value" class="" type="text" record_id="" value="" readonly="" tab_form_field="" changed_field>
                                            </td>
                                            <td class="tab_form_buttons" ><div class="tab_btn_checkbox"><div></div></div></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr class="full_width_row">
                            <td checklist="true" addremove_btn="true" title="block_one_contact_person_contact" data-nesting="3" "="">
                                <table>
                                    <tbody>
                                        <tr style="display: none" forbidden="">
                                            <td>ID:</td>
                                            <td><input name="id" type="text" value="new_record_person_${i}_0" readonly="" tab_form_field=""></td>
                                        </tr>
                                        <tr style="display: none" forbidden="">
                                            <td>ID родительской записи:</td>
                                            <td>
                                                <input name="contact_person" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                                            </td>
                                        </tr>
                                        <tr multiple="" changed="" checked_row="">
                                            <td>
                                                <input name="type" class="left_column paired_field" type="text" record_id="" value=1 readonly tab_form_field placeholder="Тип контакта" changed_field>
                                                <div class="paired_field active_field" data-ddlist_only>
                                                    <select title="list__contact_type" class="chosen_select before_parsing" data-placeholder="Тип контакта">
                                                        <option></option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <input name="value" class="" type="text" record_id="" value="" readonly="" tab_form_field="" changed_field>
                                            </td>
                                            <td class="tab_form_buttons" ><div class="tab_btn_checkbox"><div></div></div></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr class="full_width_row">
                            <td checklist="true" addremove_btn="true" title="block_one_contact_person_contact" data-nesting="3" "="">
                                <table>
                                    <tbody>
                                        <tr style="display: none" forbidden="">
                                            <td>ID:</td>
                                            <td><input name="id" type="text" value="new_record_person_${i}_0" readonly="" tab_form_field=""></td>
                                        </tr>
                                        <tr style="display: none" forbidden="">
                                            <td>ID родительской записи:</td>
                                            <td>
                                                <input name="contact_person" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                                            </td>
                                        </tr>
                                        <tr multiple="" changed="" checked_row="">
                                            <td>
                                                <input name="type" class="left_column paired_field" type="text" record_id="" value=1 readonly tab_form_field placeholder="Тип контакта" changed_field>
                                                <div class="paired_field active_field" data-ddlist_only>
                                                    <select title="list__contact_type" class="chosen_select before_parsing" data-placeholder="Тип контакта">
                                                        <option></option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <input name="value" class="" type="text" record_id="" value="" readonly="" tab_form_field="" changed_field>
                                            </td>
                                            <td class="tab_form_buttons" ><div class="tab_btn_checkbox"><div></div></div></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr class="full_width_row">
                            <td checklist="true" addremove_btn="true" title="block_one_contact_person_contact" data-nesting="3" "="">
                                <table>
                                    <tbody>
                                        <tr style="display: none" forbidden="">
                                            <td>ID:</td>
                                            <td><input name="id" type="text" value="new_record_person_${i}_0" readonly="" tab_form_field=""></td>
                                        </tr>
                                        <tr style="display: none" forbidden="">
                                            <td>ID родительской записи:</td>
                                            <td>
                                                <input name="contact_person" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                                            </td>
                                        </tr>
                                        <tr multiple="" changed="" checked_row="">
                                            <td>
                                                <input name="type" class="left_column paired_field" type="text" record_id="" value=1 readonly tab_form_field placeholder="Тип контакта" changed_field>
                                                <div class="paired_field active_field" data-ddlist_only>
                                                    <select title="list__contact_type" class="chosen_select before_parsing" data-placeholder="Тип контакта">
                                                        <option></option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <input name="value" class="" type="text" record_id="" value="" readonly="" tab_form_field="" changed_field>
                                            </td>
                                            <td class="tab_form_buttons" ><div class="tab_btn_checkbox"><div></div></div></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr class="full_width_row">
                            <td checklist="true" addremove_btn="true" title="block_one_contact_person_contact" data-nesting="3" "="">
                                <table>
                                    <tbody>
                                        <tr style="display: none" forbidden="">
                                            <td>ID:</td>
                                            <td><input name="id" type="text" value="new_record_person_${i}_0" readonly="" tab_form_field=""></td>
                                        </tr>
                                        <tr style="display: none" forbidden="">
                                            <td>ID родительской записи:</td>
                                            <td>
                                                <input name="contact_person" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                                            </td>
                                        </tr>
                                        <tr multiple="" changed="" checked_row="">
                                            <td>
                                                <input name="type" class="left_column paired_field" type="text" record_id="" value=1 readonly tab_form_field placeholder="Тип контакта" changed_field>
                                                <div class="paired_field active_field" data-ddlist_only>
                                                    <select title="list__contact_type" class="chosen_select before_parsing" data-placeholder="Тип контакта">
                                                        <option></option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <input name="value" class="" type="text" record_id="" value="" readonly="" tab_form_field="" changed_field>
                                            </td>
                                            <td class="tab_form_buttons" ><div class="tab_btn_checkbox"><div></div></div></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </details>`
}

// Функция добавления на страницу нового контакта
function add_page_new_contact(e, content){
    $(e.target).siblings('table.tab_table').prepend(content)
    $.getScript('js/chosen.js') // Инициализируем новый chosen
}

// Функция добавления на страницу нового контакта по договору
function add_page_new_contact_person(e, content){
    $(e.target).after(content)
    $.getScript('js/chosen.js') // Инициализируем новый chosen
}

// Функция удаления контакта
async function delete_contact(e){
    try{
        let query = {}
        let contact_block = $(e.target).closest('td[title=block_one_contact]') // Для контакта

        if (contact_block.length === 0){
            contact_block = $(e.target).closest('details[title=block_one_contact_person]') // Для контактного лица
            query.target = 'block_one_contact_person';
        }else{
            query.target = 'block_one_contact';
        }

        let contact_block_id = contact_block.find('input[name=id]').attr('value');

        // Если в ID присутствует "new_record_" или "new_record_person_" - удаляем только из DOM
        if (contact_block_id.indexOf('new_record_') !== -1 || contact_block_id.indexOf('new_record_person_') !== -1){
            contact_block.remove()
            return false
        }

        e.target.id = 'tab_btn_del'

        let path = $('#btn_default')[0].formAction


        query.source = await get_request_source(e.target, 'button', '#hb_edit_form')

        query.record_id = contact_block_id
        query.action = 'update'
        query.data = { delete_mark: true }

        let srv_response = await srv_request(path, query)

        if (srv_response) contact_block.remove()

        return {
            query: query,
            srv_response: srv_response
        }
    }catch (e) {
        throw e;
    }
}

// Функция изменения чекбокса Attached
function change_attached(e, checked){
    let attached_parent = $(e.target).closest('td[title=block_one_contact]')
    if (attached_parent.length === 0) attached_parent = $(e.target).closest('details[title=block_one_contact_person]')

    let attached_input = attached_parent.find('input[name=attached]')

    attached_input.attr('changed_field','true')

    if (checked) attached_input.attr('value','t')
    else attached_input.attr('value','f')
}
/*-------------------------------------------------------------------------------------------------------------------*/
/*    функции для генерации блоков документов и блоков банковских реквизитов                                         */
/*-------------------------------------------------------------------------------------------------------------------*/

// ++KHC26052022 Добавляем новый документ на страницу
async function add_new_identity(input, caller, srv_response){
    let parent_table = $(input).closest('table.tab_table')

    /* Если на странице уже есть больше 3х полей - удалим */
    let rows = parent_table.children('tbody').children('tr')
    if (rows.length > 3){
        $(rows).each(function (index){
            if (index >= 3) rows[index].remove()
        })
    }

    /* Удалим ненужные поля, пришедшие из вьюшки */
    $(srv_response.data).each(function (index){
        if (index < 6) return true
        else parent_table.append($(srv_response.data)[index])
    })
    hide_preloader();
    return true
}

// Функция генерации блока документа
function get_identity_html(e, i){

    let parent_name = $(e.target).attr('parent_name')
    return `<details addremove_btn="true" title="block_one_identity" class="new_identity_item" data-nesting="2" open>
                <summary changed>
                    <span>Документ</span>
                    <span>Новый документ</span>
                    <span class="tab_form_buttons"><div class="tab_btn_del"><div></div></div></span>
                </summary>
                <table class="tab_table">
                    <tbody>
                        <tr style="display: none" forbidden="">
                            <td>ID:</td>
                            <td><input name="id" type="text" value="new_record_identity_${i}" readonly="" tab_form_field=""></td>
                        </tr>
                        <tr style="display: none" forbidden="">
                            <td>ID родительской записи:</td>
                            <td>
                                <input name="${parent_name}" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                            </td>
                        </tr>
                        <tr multiple="" changed="">
                            <td>Тип документа</td>
                            <td>
                                <input name="type" class="paired_field" type="text" record_id="new_record_identity_${i}" value="" readonly tab_form_field placeholder="Тип документа" changed_field>
                                <div class="paired_field active_field" data-ddlist_only>
                                    <select title="list__identity_type" class="chosen_select before_parsing" data-placeholder="Тип документа">
                                        <option></option>
                                    </select>
                                </div>
                            </td>
                            <td class="tab_form_btn_plug"></td>
                        </tr>
                    </tbody>
                </table>
            </details>`
}

// Функция добавления на страницу нового документа
function add_page_new_identity(e, content){
    $(e.target).after(content)
    $.getScript('js/chosen.js') // Инициализируем новый chosen
}

// Функция генерации блока реквизита
function get_account_html(e, i){
    let parent_name = $(e.target).attr('parent_name')

    return `<details addremove_btn="true" title="block_one_account" class="new_account_item" data-nesting="2" open>
                <summary changed>
                    <span>Банк</span>
                    <span>Новый банк</span>
                    <span class="tab_form_buttons"><div class="tab_btn_del"><div></div></div></span>
                </summary>
                <table class="tab_table">
                    <tbody>
                        <tr style="display: none" forbidden="">
                            <td>ID:</td>
                            <td><input name="id" type="text" value="new_record_account_${i}" readonly="" tab_form_field=""></td>
                        </tr>
                        <tr style="display: none" forbidden="">
                            <td>ID родительской записи:</td>
                            <td>
                                <input name="${parent_name}" type="text" value="" data-parent_record="" readonly="" tab_form_field="">
                            </td>
                        </tr>
                        <tr data-obligatory_field multiple>
                            <td>Наименование:</td>
                            <td>
                                <input name="bank" type="text" value="" readonly tab_form_field>
                            </td>
                        </tr>
                        <tr data-obligatory_field multiple>
                            <td>Р/С:</td>
                            <td><input name="account_number" type="text" value="" readonly="" tab_form_field=""></td>
                        </tr>
                        <tr multiple="">
                            <td>К/С:</td>
                            <td><input name="cor_account_num" type="text" value="" readonly="" tab_form_field=""></td>
                        </tr>
                        <tr multiple="">
                            <td>БИК:</td>
                            <td><input name="bik" type="text" value="" readonly="" tab_form_field=""></td>
                        </tr>
                        <tr multiple="">
                            <td>КПП:</td>
                            <td><input name="kpp" type="text" value="" readonly="" tab_form_field=""></td>
                        </tr>
                        <tr multiple="">
                            <td>ИНН:</td>
                            <td><input name="inn" type="text" value="" readonly="" tab_form_field=""></td>
                        </tr>
                    </tbody>
                </table>
            </details>`
}

// Функция добавления на страницу нового реквизита
function add_page_new_account(e, content){
    $(e.target).after(content)
    $.getScript('js/chosen.js') // Инициализируем новый chosen
}
/*-------------------------------------------------------------------------------------------------------------------*/
/*    функции для генерации блоков прикрепленных файлов (приложений)                                                 */
/*-------------------------------------------------------------------------------------------------------------------*/

// Функция создает html контейнер для загружаемого файла ++KHC231121
function get_file_html(file, i) {
    try {
        let split_name = file.name.split('.')
        let handbook_type = $('#tab_attachments .upload_attachments_btn').attr('parent_name')
        let name = '', extname = ''
        if (split_name.length !== 0){
            extname = '.' + split_name.pop();
            name = split_name.join('_')
        }else name = file.name

        return `<details title = 'block_one_attachment' data-nesting="5">
                <summary changed="">
                    <span>новый файл</span>
                    <span><a target="_blank" title_for="description; path" link_for="path">${file.name}<i class="fa fa-file-image-o" aria-hidden="true"></i></a></span>
                    <span class="tab_form_buttons">
                        <div class="tab_btn_del"><div></div></div>
                    </span>
                </summary>
                <table class="tab_table">
                    <tr style="display: none" forbidden>
                        <td>ID:</td>
                        <td><input name="id" type="text" value="new_record_${i}" readonly tab_form_field></td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>ID родительской записи:</td>
                        <td>
                            <input name="${handbook_type}" type="text" value="" data-parent_record readonly tab_form_field>
                        </td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>тело файла:</td>
                        <td>
                            <input name="content" type="file" readonly tab_form_field attachment changed_field fileloading>
                        </td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>оригинальное название файла:</td>
                        <td>
                            <input name="title" type="text" value="${name}" readonly tab_form_field changed_field>
                        </td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>расширение:</td>
                        <td>
                            <input name="extname" type="text" value="${extname}" readonly tab_form_field changed_field>
                        </td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>mimetype:</td>
                        <td>
                            <input name="mimetype" type="text" value="${file.type}" readonly tab_form_field changed_field>
                        </td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>размер файла:</td>
                        <td>
                            <input name="size" type="text" value="${file.size}" readonly tab_form_field changed_field>
                        </td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>delete_key:</td>
                        <td>
                            <input name="delete_key" type="text" value="${file.delete_key}" readonly tab_form_field>
                        </td>
                    </tr>
                    <tr style="display: none" forbidden>
                        <td>url:</td>
                        <td>
                            <input name="url" type="text" value="${file.url}" readonly tab_form_field changed_field>
                        </td>
                    </tr>
                    <tr style="display: none" multiple>
                        <td>путь:</td>
                        <td><input name="path" class="attachment" type="text" value="${file.path}" readonly tab_form_field attachment></td>
                    </tr>
                    <tr multiple>
                        <td>описание:</td>
                        <td><input name="alias" type="text" value="${file.name}" title_for="path" readonly tab_form_field changed_field></td>
                    </tr>
                </table>
            </details>`
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось создать html контейнер для файла . причина: ${err.message}`)
        }
        throw err;
    }
}

// Функция инициализации файлов из инпута files ++KHC231121
function init_files(files, e){
    try{
        for (let file of files){
            let file_iter = $('.attachments_to_upload_container').find('details[title=block_one_attachment]').length
            let content = get_file_html(file, file_iter)
            $(e.target).siblings('.attachments_to_upload_container').append(content)
        }

        // обходим массив инпутов и зададим для каждого файл
        $.each( $('.attachments_to_upload_container').find('input[name=content][fileloading]'), async function(index, file_input){
            let dt = new DataTransfer() // Создадим новое хранилище файлов
            dt.items.add(files[index])
            let fileList = dt.files
            $(file_input).prop('files', fileList).removeAttr('fileloading')
        })
        $('#btn_save')[0].setAttribute('changed','');
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось загрузить указанные файлы. причина: ${err.message}`)
        }
        throw err;
    }
}

// Функция открытия проводника для выбора файла и генерации списка загружаемых файлов ++KHC231121
function upload_file_explorer($this){
    try {
        $this.siblings('input.file-attachments-upload').trigger('click')
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось загрузить файл. причина: ${err.message}`)
        }
        throw err;
    }
}

// Функция удаления файла из списка загружаемых ++KHC231121
async function delete_attachment(e){
    try{
        let attachment_block = $(e.target).closest('details[title=block_one_attachment]')
        let attachment_block_id = attachment_block.find('input[name=id]').attr('value')

        // Если в ID присутствует "new_record_" - удаляем только из DOM
        if (attachment_block_id.indexOf('new_record_') !== -1){
            attachment_block.remove()
            return false
        }

        e.target.id = 'tab_btn_del_' + attachment_block.index('#tab_attachments section.tab_data > details[title=block_one_attachment]')

        let path = 'http://localhost:8080/delete_file'

        let query = {};
        query.source = await get_request_source(e.target, 'button', '#hb_edit_form')
        query.target = 'block_one_attachment'
        query.record_id = attachment_block_id
        query.action = 'update'
        query.data = {
            delete_mark: true,
            delete_key: attachment_block.find('input[name=delete_key]').attr('value'),
        }

        let srv_response = await srv_request(path, query)

        if (srv_response) attachment_block.remove()

            return {
            query: query,
            srv_response: srv_response
        }
    }
    catch (err) {
        if(!err.code) {
            err = new CLError('CL1001', _stackTrace(), `не удалось удалить файл. причина: ${err.message}`)
        }
        throw err;
    }
}