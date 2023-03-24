/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует html блок "документ" (удостоверение личности или выписка из ЕГРЮЛ)       */
/*-----------------------------------------------------------------------------------------------*/

const fs = require("fs");

exports.get_html = function (arr, title, parent_record, att_arr, request_body) {

    try{
        const hbs = require('hbs');
        const tab_buttons = require('./tab_buttons__func');
        let documents = [], caption, item;
        let attributes='';
        for(let key in att_arr){attributes += ` ${key}=${att_arr[key]}`}

        hbs.registerHelper('ifCond', function(v1, v2, options) {
            if(v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        // заголовок
        if(title){
            caption = tab_buttons.simple_caption(title, attributes);

            if(att_arr.addremove_btn){
                let extended_att = (attributes += ` parent_name="${parent_record}"`);
                if(att_arr.blocked){
                    caption = new hbs.SafeString(
                        tab_buttons.simple_caption(title, (attributes + ' ef_only = edit_record'))
                        + tab_buttons.bigbtn_new(title, (extended_att + ' ef_only = new_record'), 'documents'));
                }
                else{
                    caption = tab_buttons.bigbtn_new(title, extended_att, 'documents');
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

        if(!arr){
            return new hbs.SafeString({caption: caption});
        }

        // записи
        if(arr[0]) {
            for (let i = 0; i < arr.length; i++) {
                item = new hbs.SafeString(
                    `<span>Документ</span>
                    <span><a href="${arr[i].path}" target="_blank" title_for="description; path" link_for="path">${arr[i].type_title}</a></span>
                    ${caption_buttons}`);

                documents.push({
                    attributes: new hbs.SafeString(attributes),
                    content: item,
                    type: arr[i].type_title,
                    data: arr[i],
                    parent_record: parent_record
                });
            }
        }
        return new hbs.SafeString({caption: caption, documents: documents});
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
};