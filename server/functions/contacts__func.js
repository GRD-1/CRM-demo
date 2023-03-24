/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует из массива данных о контактах html модуль "контакты"                     */
/*-----------------------------------------------------------------------------------------------*/

exports.get_html = function (person_id, arr, title, att_arr, block_title, nesting, parent_record) {

    try {
        const hbs = require('hbs');
        const tab_buttons = require('./tab_buttons__func');
        let caption, contacts = [], first_part, second_part;
        let attributes='';
        for(let key in att_arr){attributes += ` ${key}=${att_arr[key]}`}

        // заголовок
        if(title){
            caption = tab_buttons.simple_caption(title, attributes);

            if(att_arr.addremove_btn){
                let extended_att = (attributes += ` parent_name="${parent_record}"`);
                if(att_arr.blocked){
                    caption = new hbs.SafeString(
                        tab_buttons.simple_caption(title, (attributes + ' ef_only = edit_record'))
                        + tab_buttons.bigbtn_new(title, (extended_att + ' ef_only = new_record'), 'customer_contacts'));
                }
                else{
                    caption = tab_buttons.bigbtn_new(title, extended_att, 'customer_contacts');
                }
            }
        }

        // кнопки
        let row_buttons = tab_buttons.btn_plug();
        if(att_arr.addremove_btn){
            row_buttons = tab_buttons.btn_del();
        }
        if(att_arr.checklist){
            row_buttons = tab_buttons.btn_checkbox();
        }

        // выпадающие списки
        let Isblocked;
        if(att_arr.forbidden || att_arr.blocked){
            Isblocked = true;
        }

        // записи
        if(arr){
            for (let i = 0; i < arr.length; i++) {
                first_part = new hbs.SafeString(
                    `<tr class="full_width_row">
                        <td ${attributes} title = '${block_title}' data-nesting="${nesting}"">
                            <table>
                                <tbody>
                                    <tr style="display: none" forbidden>
                                        <td>ID:</td>
                                        <td><input name="id" type="text" value="${arr[i].contact_id}" readonly tab_form_field></td>
                                    </tr>
                                    <tr style="display: none" forbidden>
                                        <td>ID родительской записи:</td>
                                        <td>
                                            <input name="${parent_record}" type="text" value="${arr[i][parent_record]}" data-parent_record readonly tab_form_field>
                                        </td>
                                    </tr>
                                    <tr style="display: none" forbidden>
                                        <td>Attached:</td>
                                        <td><input name="attached" type="text" value="${arr[i].attached}" readonly tab_form_field></td>
                                    </tr>
                                    <tr multiple ${arr[i].attached === 't' ? 'checked_row' : ''}>
                                        <td>
                                            <input name="type" class="left_column paired_field active_field" type="text" record_id="${arr[i].contact_type}" value="${arr[i].contact_type_title}" readonly tab_form_field>
                                            <div class="paired_field">`);
                second_part = new hbs.SafeString(
                                            `</div>
                                        </td>
                                        <td>
                                            <input name="value" class="" type="text" value="${arr[i].contact_value}" readonly tab_form_field>
                                        </td>
                                        ${row_buttons}
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>`);

                contacts.push({first_part, second_part});
            }
        }
        return new hbs.SafeString({caption: caption, contacts: contacts, blocked: Isblocked});
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};