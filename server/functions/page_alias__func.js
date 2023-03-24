/*-----------------------------------------------------------------------------------------------*/
/*     модуль возвращает кириллическое название страницы                                         */
/*-----------------------------------------------------------------------------------------------*/

// функция принимает путь к странице, возвращает кириллическое название
exports.get_alias = function (path) {
    try{
        switch (path) {
            case '/measurements':
                return 'Заявки';
            case '/contracts':
                return 'Договоры';
            case '/reports':
                return 'Отчеты';
            case '/handbooks':
                return 'Справочники';
            case '/login':
                return 'Авторизация';
            case '/management':
                return 'Админка';
            case '/about_program':
                return 'О программе';
        }
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), `ошибка при получении кириллического названия страницы! причина: ${err.message}`)
    }
};