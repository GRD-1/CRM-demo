/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует html блок "контактные лица"                                              */
/*-----------------------------------------------------------------------------------------------*/

exports.get_html = function (arr, title, att_arr) {

    try {
        const hbs = require('hbs');
        const contacts_html = require('./contacts__func');
        const tab_buttons = require('./tab_buttons__func');
        let caption, contact_persons = [], first_part, second_part, third_part;
        let attributes='';
        for(let key in att_arr){attributes += ` ${key}=${att_arr[key]}`}

        // заголовок
        if(title){
            caption = tab_buttons.simple_caption(title, attributes);

            if(att_arr.addremove_btn){
                let extended_att = (attributes += ` parent_name="customer"`);
                if(att_arr.blocked){
                    caption = new hbs.SafeString(
                        tab_buttons.simple_caption(title, (attributes + ' ef_only = edit_record'))
                        + tab_buttons.bigbtn_new(title, (extended_att + ' ef_only = new_record'), 'customer_contact_persons'));
                }
                else{
                    caption = tab_buttons.bigbtn_new(title, extended_att, 'customer_contact_persons');
                }
            }
        }

        // кнопки заголовков
        let caption_buttons='';
        if(att_arr.addremove_btn){
            caption_buttons = tab_buttons.btn_del_cap();
        }
        if(att_arr.checklist){
            caption_buttons = tab_buttons.btn_checkbox_cap();
        }

        // выпадающие списки
        let Isblocked;
        if(att_arr.forbidden || att_arr.blocked){
            Isblocked = true;
        }

        att_arr.addremove_btn = false // ++KHC 27052022 Убираем крестик и плюсик для контактных лиц

        // записи
        if(arr) {
            for (let i = 0; i < arr.length; i++) {
                first_part = new hbs.SafeString(
                    `<details open='open' ${attributes} title='block_one_contact_person' data-nesting="2">
                        <summary>
                            <span>${arr[i].name}</span>
                            <span></span>
                            ${caption_buttons}
                        </summary>
                        <table class="tab_table">
                            <tbody>
                                <tr style="display: none" forbidden>
                                    <td>ID:</td>
                                    <td><input name="id" type="text" value="${arr[i].id}" readonly tab_form_field></td>
                                </tr>
                                <tr style="display: none" forbidden>
                                    <td>ID родительской записи:</td>
                                    <td>
                                        <input name="customer" type="text" value="${arr[i].customer}" data-parent_record readonly tab_form_field>
                                    </td>
                                </tr>
                                <tr multiple>
                                    <td>ФИО конт лица:</td>
                                    <td>
                                        <input name="cont_person_name" class="active_field" type="text" value="${arr[i].name}" readonly tab_form_field>
                                    </td>
                                    <td class="tab_form_btn_plug"></td>
                                </tr>`);

                if(arr[i].contacts) {
                    second_part = contacts_html.get_html(arr[i].id, arr[i].contacts,
                        null, att_arr,
                        'block_one_contact_person_contact',
                        3,
                        "contact_person");
                }
                else {second_part = ''}

                third_part = new hbs.SafeString(
                    `</tbody>
                        </table>
                    </details>`);
                contact_persons.push({first_part, second_part, third_part});
            }
        }
        return new hbs.SafeString({caption: caption, contact_persons: contact_persons, blocked: Isblocked});
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};