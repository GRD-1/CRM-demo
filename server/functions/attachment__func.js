/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует html блок "приложения" (прикрепленные файлы)                             */
/*-----------------------------------------------------------------------------------------------*/

exports.get_html = function (target, files, title, att_arr, parent_record) {

    try {
        let allowed = {"tab_attachments": true, "edit_form/tab_attachments": true, "tab_estimates": true, "edit_form/tab_estimates": true};
        if(!allowed[target]) return;

        const hbs = require('hbs');
        const tab_buttons = require('./tab_buttons__func');
        let html = '';
        let attributes='';
        for(let key in att_arr){attributes += ` ${key}=${att_arr[key]}`}

        // заголовок и кнопки
        let btn_del_cap ='';
        if(att_arr.addremove_btn){
            let extended_att = (attributes += ` parent_name="${parent_record}"`);
            html = tab_buttons.bigbtn_new(title, extended_att, 'attachments');
            btn_del_cap = tab_buttons.btn_del_cap();
        }
        let btn_plug = tab_buttons.btn_plug();

        // записи
        if(files){
            for (let i = 0; i < files.length; i++) {

                // ++KHC040522 Определяем иконку для файла
                function get_ico_html(extname){
                    let ico_title = ''

                    if (extname) extname = extname.toLowerCase()

                    switch (extname){
                        case '.jpg':
                        case '.png':
                        case '.gif':
                        case '.bmp':
                            ico_title = 'file-image-o'
                            break;
                        case '.pdf':
                            ico_title = 'file-pdf-o'
                            break;
                        case 'txt':
                            ico_title = 'file-text-o'
                            break;
                        case 'doc':
                        case 'docx':
                            ico_title = 'word-o'
                            break;
                        case 'xls':
                        case 'xlsx':
                            ico_title = 'file-excel-o'
                            break;
                        case 'zip':
                        case 'rar':
                        case '7z':
                            ico_title = 'file-archive-o'
                            break;
                        default:
                            ico_title = 'file-o'
                            break;

                    }

                    return '<i class="fa fa-'+ico_title+'" aria-hidden="true"></i>'
                } // Возвращает html код иконки

                files[i].ico = get_ico_html(files[i].extname)

                html +=
                    `<details ${attributes} title = 'block_one_attachment' data-nesting="5">
                        <summary>
                            <span>${files[i].date}</span>
                            <span><a href="${files[i].path}" target="_blank" title_for="description; path" link_for="path">${files[i].alias}&nbsp;${files[i].ico}</a></span>
                            
                            ${btn_del_cap}
                        </summary>
                        <table class="tab_table">
                            <tr style="display: none" forbidden>
                                <td>ID:</td>
                                <td><input name="id" type="text" value="${files[i].id}" readonly tab_form_field></td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>ID родительской записи:</td>
                                <td>
                                    <input name="${parent_record}" type="text" value="${files[i].parent_record}" data-parent_record readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>тело файла:</td>
                                <td>
                                    <input name="content" type="file" readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>оригинальное название файла:</td>
                                <td>
                                    <input name="title" type="text" value="${files[i].title}" readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>расширение:</td>
                                <td>
                                    <input name="extname" type="text" value="${files[i].extname}" readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>mimetype:</td>
                                <td>
                                    <input name="mimetype" type="text" value="${files[i].mimetype}" readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>размер файла:</td>
                                <td>
                                    <input name="size" type="text" value="${files[i].size}" readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>delete_key:</td>
                                <td>
                                    <input name="delete_key" type="text" value="${files[i].delete_key}" readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" forbidden>
                                <td>url:</td>
                                <td>
                                    <input name="url" type="text" value="${files[i].url}" readonly tab_form_field>
                                </td>
                            </tr>
                            <tr style="display: none" multiple>
                                <td>путь:</td>
                                <td><input name="path" class="attachment" type="text" value="${files[i].path}" readonly tab_form_field attachment></td>
                            </tr>
                            <tr multiple>
                                <td>описание:</td>
                                <td><input name="alias" type="text" value="${files[i].alias}" title_for="path" readonly tab_form_field></td>
                                ${btn_plug}
                            </tr>
                        </table>
                    </details>`
            }
        }
        return new hbs.SafeString(html);
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err)
    }
}