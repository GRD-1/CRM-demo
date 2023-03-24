/*-----------------------------------------------------------------------------------------------------------*/
/*    скрипты страницы "Логи"                                                                                */
/*-----------------------------------------------------------------------------------------------------------*/

$(document).ready(function(){
    // Инициализация окон
    let vis_win = $('#logs_container .console_win:visible').length // Количество видимых окон
    // Если окон 2 или меньше - убираем ограничение по высоте
    if (vis_win <= 2) $('.console_win').css('max-height','100%')
    // Если 1 окно
    if (vis_win === 1){
        $('#logs_container .console_win:visible a.header_btn').addClass('console_disabled_btn') // кнопки отключаются
        $('#logs_container .console_win:visible').addClass('full_console_win') // показываются дополнительные скрытые поля
    }

    // Свернуть окно
    $('#page_management').on('click','.console_win .minimize_btn',function (callback) {
        $(this).closest('.console_win').hide()

        // Показ иконки скрытого окошка
        let id = $(this).closest('.console_win').attr('id')
        let title = $(this).closest('.console_win_header').children('.console_title').text()

        $('#log_minimize_panel').append(`<div class="mini_console_btn" wind-id="${id}"><div class="console_title">${title}</div><a class="header_btn minimize_btn"><i class="fa fa-window-minimize" aria-hidden="true"></i></a><a class="header_btn full_btn"><i class="fa fa-window-maximize" aria-hidden="true"></i></a></div>`)

        let vis_win = $('#logs_container .console_win:visible').length // Количество видимых окон

        // Если после нажатия остается 2 или меньше элементов - убираем ограничение по высоте
        if (vis_win <= 2) $('.console_win').css('max-height','100%')

        // Если осталось 1 окно
        if (vis_win === 1){
            $('#logs_container .console_win:visible a.header_btn').addClass('console_disabled_btn') // кнопки отключаются
            $('#logs_container .console_win:visible').addClass('full_console_win') // показываются дополнительные скрытые поля
        }
    })

    // Развернуть минифицированое окна
    $('#page_management').on('click','#log_minimize_panel .minimize_btn',function () {
        let win_id = $(this).closest('.mini_console_btn').attr('wind-id')

        $('#'+win_id).show()
        $(this).closest('.mini_console_btn').remove()

        // Если после нажатия видимы более 2-х окон - возвращаем ограничение по высоте
        if ($('#logs_container .console_win:visible').length > 2) $('.console_win').css('max-height','50%')

        $('#logs_container .console_win a.header_btn').removeClass('console_disabled_btn')
        $('#logs_container .console_win').removeClass('full_console_win') // показываются дополнительные скрытые поля
    })

    // Окно на полный экран
    $('#page_management').on('click','.full_btn',function () {
        let id = $(this).closest('.console_win').attr('id')

        let other_win_arr = $('#logs_container .console_win:visible:not(#'+id+')')

        // создаем минифицированные вкладки
        $.each(other_win_arr, function(index, value){
            value = $(value)

            let id = value.attr('id')
            let title = value.find('.console_title').text()

            value.hide()

            $('#log_minimize_panel').append(`<div class="mini_console_btn" wind-id="${id}"><div class="console_title">${title}</div><a class="header_btn minimize_btn"><i class="fa fa-window-minimize" aria-hidden="true"></i></a><a class="header_btn full_btn"><i class="fa fa-window-maximize" aria-hidden="true"></i></a></div>`)
        });

        $('.console_win').css('max-height','100%')
        $('#logs_container .console_win:visible a.header_btn').addClass('console_disabled_btn')
        $('#logs_container .console_win:visible').addClass('full_console_win') // показываются дополнительные скрытые поля
    })

    // Минифицированое окно на полный экран
    $('#page_management').on('click','#log_minimize_panel .full_btn',function () {
        let win_id = $(this).closest('.mini_console_btn').attr('wind-id')

        let other_win_arr = $('#logs_container .console_win:visible:not(#'+win_id+')')

        // создаем минифицированные вкладки
        $.each(other_win_arr, function(index, value){
            value = $(value)

            let id = value.attr('id')
            let title = value.find('.console_title').text()

            value.hide()

            $('#log_minimize_panel').append(`<div class="mini_console_btn" wind-id="${id}"><div class="console_title">${title}</div><a class="header_btn minimize_btn"><i class="fa fa-window-minimize" aria-hidden="true"></i></a><a class="header_btn full_btn"><i class="fa fa-window-maximize" aria-hidden="true"></i></a></div>`)
        });

        $('#'+win_id).show()
        $(this).closest('.mini_console_btn').remove()

        // Убираем ограничение по высоте
        $('.console_win').css('max-height','100%')
        $('#logs_container .console_win:visible a.header_btn').addClass('console_disabled_btn')
        $('#logs_container .console_win:visible').addClass('full_console_win') // показываются дополнительные скрытые поля
    })

    // Раскрыть / свернуть содержимое ячейки
    $('#page_management').on('click','.show_more_btn', function () {
        let button_open = $(this).attr('open-cell')
        let modify_class = $(this).closest('th').attr('class')

        if (button_open === "true"){
            $(this).html('<i class="fa fa-plus"></i>').attr('open-cell', false)
            $('.full_console_win .'+modify_class).css('max-width','200px')
        }else{
            $(this).html('<i class="fa fa-minus"></i>').attr('open-cell', true)
            $('.full_console_win .'+modify_class).css('max-width','none')
        }
    })
})