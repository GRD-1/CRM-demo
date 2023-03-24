/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует кнопки для полей ввода: [+], [x] и пр.                                   */
/*-----------------------------------------------------------------------------------------------*/

const hbs = require('hbs');

// кнопка "X"
exports.btn_del = function (attributes) {

    try{
        let html = `<td class="tab_form_buttons" ${attributes}><div class="tab_btn_del"><div></div></div></td>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// кнопка "X" для блока заголовков (summary)
exports.btn_del_cap = function (attributes) {

    try{
        let html = `<span class="tab_form_buttons" ${attributes}><div class="tab_btn_del"><div></div></div></span>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// кнопка "addfromlist" (выбрать из списка)
exports.btn_addfromlist = function (attributes) {

    try{
        let html = `<td class="tab_form_buttons" ${attributes}><div class="tab_btn_addfromlist"><div></div></div></td>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// кнопка "addfromlist" для блока заголовков (summary)
exports.btn_addfromlist_cap = function (attributes) {

    try{
        let html = `<span class="tab_form_buttons" ${attributes}><div class="tab_btn_addfromlist"><div></div></div></span>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// кнопка "+"
exports.btn_new = function (attributes) {

    try{
        let html = `<td class="tab_form_buttons" ${attributes}><div class="tab_btn_new"><div></div></div></td>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// кнопка "+" для блока заголовков (summary)
exports.btn_new_cap = function (attributes) {

    try{
        let html = `<span class="tab_form_buttons" ${attributes}><div class="tab_btn_new"><div></div></div></span>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// большая кнопка "+" на целую строку
exports.bigbtn_new = function (caption, attributes, button_type = '') {
    try{
        let e_id = '' // id кнопки bigbtn_new

        switch (button_type){
            case 'attachments':
                e_id = 'upload_attachments_btn'
                break
            case 'customer_contacts':
                e_id = 'add_customer_contact'
                break
            case 'customer_contact_persons':
                e_id = 'add_customer_contact_person'
                break
            case 'documents':
                e_id = 'add_document'
                break
            case 'accounts':
                e_id = 'add_account'
                break
        }

        let html = `<div${e_id !== '' ? ' id="'+e_id+'"' : '' } class="summary bigbtn_new" ${attributes}>
                        <span>${caption}</span>
                        <span></span>
                        <span class="tab_form_buttons"><div class="tab_btn_new"><div></div></div></span>
                    </div>`;


        // Если страница - приложения, то добавим скрытое поле выбора файлов
        if (button_type === 'attachments') html += `<input class="file-attachments-upload" type="file" name="file" style="display: none" multiple />
                                   <div class="drop_file_area"></div>
                                   <div class="attachments_to_upload_container"></div>`

        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// заголовок на целую строку без кнопки
exports.simple_caption = function (caption, attributes) {

    try{
        let html = `<div class="summary" ${attributes}>
                    <span>${caption}</span>
                </div>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// заглушка кнопки
exports.btn_plug = function (attributes) {

    try{
        let html = `<td class="tab_form_btn_plug" ${attributes}></td>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// заглушка кнопки для блока заголовков (summary)
exports.btn_plug_cap = function (attributes) {

    try{
        let html = `<span class="tab_form_btn_plug" ${attributes}></span>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// кнопка "чекбокс"
exports.btn_checkbox = function (attributes) {

    try{
        let html = `<td class="tab_form_buttons" ${attributes}><div class="tab_btn_checkbox"><div></div></div></td>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};

// кнопка "чекбокс" для блока заголовков (summary)
exports.btn_checkbox_cap = function (attributes) {

    try{
        let html = `<span class="tab_form_buttons" ${attributes}><div class="tab_btn_checkbox"><div></div></div></span>`;
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};
