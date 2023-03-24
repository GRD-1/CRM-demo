/*-----------------------------------------------------------------------------------------------------------*/
/*                       Функции для создания новых документов на странице "О программе"                     */
/*-----------------------------------------------------------------------------------------------------------*/
$(document).ready(function() {
    try {
        // При нажатии на пункт меню раскроем / скроем список и подсветим заголовок по якорю
        $('.sidebar_link').on('click',function () {
            let article_id = $(this).attr('href')
            $('h1, h2').removeClass('finded_title')
            $(article_id).children('h1, h2').addClass('finded_title')
        })

        // Кнопка "Новый документ"
        $('#create_document').on('click', function(){
            if ($("#cke_editor").length === 0) CKEDITOR.replace( 'editor');
            $('#update_document').text('Опубликовать').attr('id','publish_document')
            $('#document_title_input').val('')
            $('#cke_editor iframe').contents().find('body').html('')
            $('#document_parent select option[value=0]').prop('selected', true);

            $('#dialog_box').show()
        })

        // Скроем диалоговое окно при нажатии на "Выход" или за пределы окна
        $('#btn_cancel, #dialog_box').on('click', function(){
            $('#dialog_box').hide()
        })

        // Остановим срабатывание предыдущего события для его дочерних элементов
        $('#dialog_box #create_document_container').on('click', function(e){
            e.stopPropagation();
        })

        // Отправляем запрос на публикацию документа
        $('#create_document_container').on('click', '#publish_document', function () {
            let title = $('#document_title_input').val()
            if (title === ""){
                alert ('Заголовок не может быть пустым!')
                return 0
            }

            show_preloader()
            let body = $('#cke_editor iframe').contents().find('body').html()
            let parent = $('#document_parent select').val()

            $.ajax({
                url: '/publish_document',
                data: { title: title, body : body, parent : parent },
                type: 'POST',
                success: function (data) {
                    hide_preloader()
                    let conf = confirm("Новый документ успешно добавлен! Страница будет перезагружена.");
                    if (conf) location.reload(); // Перезагрузим страницу для обновления данных
                },
                error: function (err) {
                    hide_preloader()
                    alert('Произошла ошибка: '+err)
                    // [TASK] Здесь нужно вывести сообщение об ошибке в футер и логи
                }
            });
        })

        // Отправляем запрос на обновление документа
        $('#create_document_container').on('click', '#update_document', function () {
            show_preloader()

            let id = $('.sidebar_link_active').attr('document_id')
            let title = $('#document_title_input').val()
            let body = $('#cke_editor iframe').contents().find('body').html()
            let parent = $('#document_parent select').val()

            $.ajax({
                url: '/update_document',
                data: { id : id, title : title, body : body, parent : parent },
                type: 'POST',
                success: function (data) {
                    hide_preloader()
                    let conf = confirm("Документ успешно обновлен! Страница будет перезагружена.");
                    if (conf) location.reload(); // Перезагрузим страницу для обновления данных
                },
                error: function (err) {
                    hide_preloader()
                    alert('Произошла ошибка: '+err)
                    // [TASK] Здесь нужно вывести сообщение об ошибке в футер и логи
                }
            });
        })

        // Удаление записи
        $('#document_remove').on('click', function () {
            let curr_nav_item = $('.sidebar_link_active')

            let conf = confirm("Вы уверены? Запись '"+curr_nav_item.text()+"' будет удалена.");
            if (conf){
                show_preloader()

                $.ajax({
                    url: '/delete_document',
                    data: { id : curr_nav_item.attr('document_id') },
                    type: 'POST',
                    success: function (data) {
                        hide_preloader()
                        location.reload(); // Перезагрузим страницу для обновления данных
                    },
                    error: function (err) {
                        hide_preloader()
                        console.log(err)
                        alert('Произошла ошибка: '+err)
                        // [TASK] Здесь нужно вывести сообщение об ошибке в футер и логи
                    }
                });
            }
        })

        // Редактировать запись
        $('#document_edit').on('click', function (){
            show_preloader()

            if ($("#cke_editor").length === 0) CKEDITOR.replace( 'editor')
            $('#publish_document').text('Обновить').attr('id','update_document')

            let curr_nav_item = $('.sidebar_link_active')
            let curr_nav_item_href = curr_nav_item.attr('href')

            let full_title = curr_nav_item.text()
            let index = full_title.indexOf(' ')
            let title = full_title.substring( index , full_title.length + 1 )

            $('#document_title_input').val(title)

            let parent_id = curr_nav_item.parent('summary').parent('details').parent('details').find('a.sidebar_link').attr('document_id')
            if (parent_id) $('#document_parent select option[value=' + parent_id + ']').prop('selected', true);

            let manual_html = $(curr_nav_item_href).html()

            let timer = window.setInterval( function(){
                if ($('#cke_editor iframe').contents().find('body').length !== 0){
                    let cke_editor = $('#cke_editor iframe').contents().find('body')
                    cke_editor.html(manual_html)
                    cke_editor.find('.manual_title').remove()
                    cke_editor.find('article').remove()

                    clearInterval(timer);

                    $('#dialog_box').show()
                    hide_preloader()
                }
            } , 100)
        })

        $( "#document_parent select" ).change(function() {
            let option_index = $(this).val()
            let option_text = $(this).find('option[value="'+option_index+'"]').text()
            let option_iter = option_text.split(' ')[0]

            let regex = new RegExp(/\./g)
            let count = option_iter.match(regex).length;

            if (count >= 6){
                alert('Максимальный уровень вложенности документации = 6')
                $(this).find('option[value="0"]').prop('selected', true);
            }
        });

    } catch (e) {
        console.log('Произошла ошибка при выполнении скрипта about_program.js : ' + e)
    }
})