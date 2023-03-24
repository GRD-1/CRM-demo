/*-----------------------------------------------------------------------------------------------------------*/
/*    скрипты страницы "Админка"                                                                             */
/*-----------------------------------------------------------------------------------------------------------*/

// Функция переключения пунктов меню
async function change_nav_position(target, path){
    try{
        let query = {};
        query.source = path;
        query.target = 'all';
        query.action = 'read';
        let srv_response = await srv_request(path, query);

        if (!srv_response.data.error){
            if (srv_response.data.string) $('.main_window .page_management').html(srv_response.data.string)
            else if (srv_response.data) $('.main_window .page_management').html(srv_response.data)
        }
        // [TASK] Иначе инициируем событие ошибки

        // Покажем верхнее меню навигации и футер доступные для класса вкладки, а остальные - скроем
        let nav_category = target.attr('nav_category')
        $('.page_management_nav_header .nav_header_category').hide()
        $('.page_management_nav_header .nav_header_category[nav_category="'+nav_category+'"]').show()

        $('.page_management_nav_footer .nav_footer_category').hide()
        $('.page_management_nav_footer .nav_footer_category[nav_category="'+nav_category+'"]').show()

        win_resize()
    }catch (e) {
        throw e;
    }
}

// Функция изменения размеров консолей
function win_resize(){
    try {
        // Инициализация окон
        let vis_win = $('#page_management').find('#logs_container .console_win:visible').length // Количество видимых окон
        // Если окон 2 или меньше - убираем ограничение по высоте
        if (vis_win <= 2) $('.console_win').css('max-height', '100%')
        // Если 1 окно
        if (vis_win === 1) {
            $('#logs_container .console_win:visible a.header_btn').addClass('console_disabled_btn') // кнопки отключаются
            $('#logs_container .console_win:visible').addClass('full_console_win') // показываются дополнительные скрытые поля
        }
    }catch (e) {
        throw e
    }
}

// Функция регистрации настроек в LocalStorage
function register_local_storage_settings(settings_obj){
    try{
        for (let key in settings_obj){
            if (!settings_obj.hasOwnProperty(key)) continue
            localStorage.setItem(key, settings_obj[key])
        }
    }catch (e) {
        throw e
    }
}

$(document).ready(function() {
    try{
        /*-----------------------------------------------------------------------------------------------*/
        /*     Логирование                                                                               */
        /*-----------------------------------------------------------------------------------------------*/

        win_resize()

        // Переключение пунктов сайдбара
        $('#page_management').on('click', '.sidebar_link', async function () {
            show_preloader()

            let path = $(this).attr('href')
            await change_nav_position($(this), path)

            hide_preloader()
        })

    // Переключение режима мультизадачности
    $('#page_management').on('click','#multi_window_mode', async function (){
        show_preloader()
        let path = '/management/multiwin_mode'
        let source = $('.sidebar_link_active').attr('href') // получаем href активной вкладки
        let query = {};
        //++GRD 23042022 update какой записи здесь происходит? для обновления записи БД нужен record_id, иначе мы обновим все строки таблицы
        query.source = path;
        query.target = 'all';
        query.action = 'update';
        query.data = { active_source : source };
        let srv_response = await srv_request(path, query);

            if (!srv_response.data.error) location.reload()
            // [TASK] Иначе инициируем событие ошибки

            hide_preloader()

        })

        // Нажатие на выпадающий список filter_list__users
        $('#page_management').on('mousedown', '.chosen-container[title="filter_list__users"] .chosen-single', async function(event){

            var box = this.parentElement;
            if(!$(box).is('.chosen-with-drop')){
                return
            }

        if(event.which === 1) {
            show_preloader();
            let path = '/management/filter_list__users'
            let query = {};
            query.source = path;
            query.target = 'all';
            query.action = 'read';

            let srv_response = await srv_request(path, query)
            $(box).siblings('select.chosen_select').html(srv_response.data.string).trigger('chosen:updated');
            hide_preloader();
        }
    });

        // Кнопка "Фильтрация логов"
        $('#page_management').on('click','#filter_logs_btn', async function(e){
            e.preventDefault();
            // [TASK] Определим на какой мы активной вкладке что бы знать к какому контроллеру обращаться
            show_preloader()
            let data = {}

            let user_name = $('.chosen-container[title="filter_list__users"] .chosen-single:not(.chosen-default)').children('span').text()
            let user_id = $('.chosen-container[title="filter_list__users"]').siblings('select').find('option[user_login="'+user_name+'"]').attr('user_id')
            let log_class = $('.chosen-container[title="filter_list__err_class"] .chosen-single:not(.chosen-default)').children('span').text()
            let period_start = $('.filter_date input[name="period_start"]').val()
            let period_end = $('.filter_date input[name="period_end"]').val()

            if (user_id !== undefined) data['user'] = user_id
            if (log_class.length !== 0) data['log_class'] = log_class
            if (period_start.length !== 0) data['period_start'] = period_start
            if (period_end.length !== 0) data['period_end'] = period_end

        let path = $('.sidebar_link_active').attr('href')
        let query = {};
        //++GRD 23042022 неверный параметр query.
        // Для условий запроса нужно использовать query.conditions, они будут обработаны серевером, как часть sql запроса [Where]
        // в query.data идут данные для записи в БД
        query.source = path;
        query.target = 'all';
        query.action = 'read';
        query.data = data;

        let srv_response = await srv_request(path, query);
        if (!srv_response.data.error){
            if (srv_response.data.string) $('.main_window .page_management').html(srv_response.data.string)
            else if (srv_response.data) $('.main_window .page_management').html(srv_response.data)
        }
        // [TASK] Иначе инициируем событие ошибки

            hide_preloader()

            win_resize()
            // [TASK] Сериализуем данные из формы
            // [TASK] Отправляем данные на сервер
        })

        /*-----------------------------------------------------------------------------------------------*/
        /*     Страница "Общие настройки"                                                                */
        /*-----------------------------------------------------------------------------------------------*/
        $('#page_management').on('click','button#save_settings', async function (e) {
            e.preventDefault();
            show_preloader()

            let serialize_form = {}

            $('.config_section').each(function () {
                let conf_name = $(this).attr('conf_name')
                serialize_form[ conf_name ] = {}

                $(this).find('.input-group input').each(function () {
                    if ( $(this).attr('type') === 'checkbox' ){ // Обработка чекбоксов
                        let cb_name = $(this).attr('conf_value')
                        serialize_form[ conf_name ][ cb_name ] = $(this).is(':checked')
                    }
                })
            })

        let path = '/management/set_settings'
        let query = {};
        //++GRD 23042022 update какой записи здесь происходит? для обновления записи БД нужен record_id, иначе мы обновим все строки таблицы
        query.source = path;
        query.target = 'all';
        query.action = 'update';
        query.data = serialize_form;
        let srv_response = await srv_request(path, query);

            if (!srv_response.data.error){
                register_local_storage_settings(serialize_form['client_config'])
                location.reload()
            }
            // [TASK] Иначе инициируем событие ошибки

            hide_preloader()

        })
    }catch (e){
        throw e
    }
})