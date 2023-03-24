/*-----------------------------------------------------------------------------------------------*/
/*     модуль формирует выпадающие списки для справочников                                       */
/*-----------------------------------------------------------------------------------------------*/

const hbs = require("hbs");

// функция возвращает записи в виде html строк выпадающего списка
exports.certain_list = function(records){

    let n=0, arr=[];
    return new Promise(function(resolve, reject) {
        try{
            let rows='<option></option>', id, value;
            if(records){
                for(let i=0; i<records.length; i++){

                    n=0; arr=[];
                    for(let key in records[i]){
                        arr[n]=key;
                        n++;
                    }
                    id = records[i][arr[0]];
                    value = records[i][arr[1]];
                    if(value !== null && value !== ''){
                        rows += `<option record_id = ${id}>${value}</option>`;
                    }
                }
            }
            resolve(rows)
        }
        catch (err) {
            reject(new SRVError('SRV3001', _stackTrace(), err));
        }
    })
};

// функция регистрирует хелперы для всех возможных выпадающих списков
exports.all_lists = function (hb_title){

    return new Promise(function(resolve, reject) {
        try{
            // номера договоров
            hbs.registerHelper("list__contract", function () {

                let result = get_list("list__contract", 'Номер договора');
                return new hbs.SafeString(result);
            });

            // типы договоров
            hbs.registerHelper("list__contract_type", function () {

                let result = get_list("list__contract_type", 'Тип договора');
                return new hbs.SafeString(result);
            });

            // статусы договоров
            hbs.registerHelper("list__contract_status", function () {

                let result = get_list("list__contract_status", 'Статус договора');
                return new hbs.SafeString(result);
            });

            // номера заявок
            hbs.registerHelper("list__measurement", function () {

                let result = get_list("list__measurement", 'Номер заявки');
                return new hbs.SafeString(result);
            });

            // типы заявок
            hbs.registerHelper("list__measurement_type", function () {

                let result = get_list("list__measurement_type", 'Тип заявки');
                return new hbs.SafeString(result);
            });

            // качество заявок
            hbs.registerHelper("list__measurement_quality", function () {

                let result = get_list("list__measurement_quality", 'Качество заявки');
                return new hbs.SafeString(result);
            });

            // статусы заявок
            hbs.registerHelper("list__measurement_status", function () {

                let result = get_list("list__measurement_status", 'Статус заявки');
                return new hbs.SafeString(result);
            });

            // методы заявок (способ обращения)
            hbs.registerHelper("list__measurement_method", function () {

                let result = get_list("list__measurement_method", 'Способ обращения');
                return new hbs.SafeString(result);
            });

            // типы отчетов
            hbs.registerHelper("list__report_type", function () {

                let result = get_list("list__report_type", 'Тип отчета');
                return new hbs.SafeString(result);
            });

            // статусы отчетов
            hbs.registerHelper("list__report_status", function () {

                let result = get_list("list__report_status", 'Статус отчета');
                return new hbs.SafeString(result);
            });

            // заказчики
            hbs.registerHelper("list__customer", function () {

                let result = get_list("list__customer", 'ФИО заказчика');
                return new hbs.SafeString(result);
            });

            // заказчики, рекомендовавшие другим (тот же список, но другие зависимости фильтрации в dropdown_list__mod)
            hbs.registerHelper("list__referred_customer", function () {

                let result = get_list("list__referred_customer", 'ФИО заказчика');
                return new hbs.SafeString(result);
            });

            // объекты
            hbs.registerHelper("list__object", function () {

                let result = get_list("list__object", 'Адрес объекта');
                return new hbs.SafeString(result);
            });

            // подразделения
            hbs.registerHelper("list__department", function () {

                let result = get_list("list__department", 'Подразделение');
                return new hbs.SafeString(result);
            });

            // подразделения оформления заявки (для совместимости с представлениями БД)
            hbs.registerHelper("list__measurement_department", function () {

                let result = get_list("list__measurement_department", 'Подразделение заявки');
                return new hbs.SafeString(result);
            });

            // подразделения подписания договора (для совместимости с представлениями БД)
            hbs.registerHelper("list__contract_department", function () {

                let result = get_list("list__contract_department", 'Подразделение договора');
                return new hbs.SafeString(result);
            });

            // группы реквизитов подразделений
            hbs.registerHelper("list__dba", function () {

                let result = get_list("list__dba", 'Группа реквизитов');
                return new hbs.SafeString(result);
            });

            // сотрудники
            hbs.registerHelper("list__employee", function () {

                let result = get_list("list__employee", 'ФИО сотрудника');
                return new hbs.SafeString(result);
            });

            // должности
            hbs.registerHelper("list__employee_position", function () {

                let result = get_list("list__employee_position", 'Должность');
                return new hbs.SafeString(result);
            });

            // статусы сотрудников
            hbs.registerHelper("list__employee_status", function () {

                let result = get_list("list__employee_status", 'Статус сотрудника');
                return new hbs.SafeString(result);
            });

            // замерщики
            hbs.registerHelper("list__measurer", function () {

                let result = get_list("list__measurer", 'Замерщик');
                return new hbs.SafeString(result);
            });

            // менеджеры
            hbs.registerHelper("list__manager", function () {

                let result = get_list("list__manager", 'Менеджер');
                return new hbs.SafeString(result);
            });

            // прорабы
            hbs.registerHelper("list__foreman", function () {

                let result = get_list("list__foreman", 'Прораб');
                return new hbs.SafeString(result);
            });

            // дизайнеры
            hbs.registerHelper("list__designer", function () {

                let result = get_list("list__designer", 'Дизайнер');
                return new hbs.SafeString(result);
            });

            // схемы расчета смет
            hbs.registerHelper("list__estimate_conditions", function () {

                let result = get_list("list__estimate_conditions", 'Схема расчета');
                return new hbs.SafeString(result);
            });

            // схемы оплаты
            hbs.registerHelper("list__payment_conditions", function () {

                let result = get_list("list__payment_conditions", 'Схема оплаты');
                return new hbs.SafeString(result);
            });

            // тип источника заказчика (откуда узнал о Ремэлль)
            hbs.registerHelper("list__source_type", function () {

                let result = get_list("list__source_type", 'Источник');
                return new hbs.SafeString(result);
            });

            // тип рекламы
            hbs.registerHelper("list__marketing", function () {

                let result = get_list("list__marketing", 'Тип рекламы');
                return new hbs.SafeString(result);
            });

            // типы контактов
            hbs.registerHelper("list__contact_type", function () {

                let result = get_list("list__contact_type", 'Тип контакта');
                return new hbs.SafeString(result);
            });

            // ++KHC20052022 Типы документов
            hbs.registerHelper("list__identity_type", function () {

                let result = get_list("list__identity_type", 'Тип документа');
                return new hbs.SafeString(result);
            });

            // список "да/нет"
            hbs.registerHelper("list__true_false", function () {

                let result = get_list("list__true_false", 'Да/Нет');
                return new hbs.SafeString(result);
            });

            resolve();
        }
        catch (err) {
            reject(new SRVError('SRV3001', _stackTrace(), err));
        }
    });
};

// функция регистрирует хелперы для всех возможных фильтров блока филтрации (левая колонка справочника)
exports.all_filters = function (hb_title){

    return new Promise(function(resolve, reject) {
        try{
            // номера договоров
            hbs.registerHelper("filter_list__contract", function () {

                let result = get_list("filter_list__contract", 'Номер договора');
                return new hbs.SafeString(result);
            });

            // типы договоров
            hbs.registerHelper("filter_list__contract_type", function () {

                let result = get_list("filter_list__contract_type", 'Тип договора');
                return new hbs.SafeString(result);
            });

            // статусы договоров
            hbs.registerHelper("filter_list__contract_status", function () {

                let result = get_list("filter_list__contract_status", 'Статус договора');
                return new hbs.SafeString(result);
            });

            // номера заявок
            hbs.registerHelper("filter_list__measurement", function () {

                let result = get_list("filter_list__measurement", 'Номер заявки');
                return new hbs.SafeString(result);
            });

            // типы заявок
            hbs.registerHelper("filter_list__measurement_type", function () {

                let result = get_list("filter_list__measurement_type", 'Тип заявки');
                return new hbs.SafeString(result);
            });

            // качество заявок
            hbs.registerHelper("filter_list__measurement_quality", function () {

                let result = get_list("filter_list__measurement_quality", 'Качество заявки');
                return new hbs.SafeString(result);
            });

            // статусы заявок
            hbs.registerHelper("filter_list__measurement_status", function () {

                let result = get_list("filter_list__measurement_status", 'Статус заявки');
                return new hbs.SafeString(result);
            });

            // методы заявок (способ обращения)
            hbs.registerHelper("filter_list__measurement_method", function () {

                let result = get_list("filter_list__measurement_method", 'Способ обращения');
                return new hbs.SafeString(result);
            });

            // типы отчетов
            hbs.registerHelper("filter_list__report_type", function () {

                let result = get_list("filter_list__report_type", 'Тип отчета');
                return new hbs.SafeString(result);
            });

            // статусы отчетов
            hbs.registerHelper("filter_list__report_status", function () {

                let result = get_list("filter_list__report_status", 'Статус отчета');
                return new hbs.SafeString(result);
            });

            // заказчики
            hbs.registerHelper("filter_list__customer", function () {

                let result = get_list("filter_list__customer", 'ФИО заказчика');
                return new hbs.SafeString(result);
            });

            // объекты
            hbs.registerHelper("filter_list__object", function () {

                let result = get_list("filter_list__object", 'Адрес объекта');
                return new hbs.SafeString(result);
            });

            // подразделения
            hbs.registerHelper("filter_list__department", function () {

                let result = get_list("filter_list__department", 'Подразделение');
                return new hbs.SafeString(result);
            });

            // сотрудники
            hbs.registerHelper("filter_list__employee", function () {

                let result = get_list("filter_list__employee", 'ФИО сотрудника');
                return new hbs.SafeString(result);
            });

            // должности
            hbs.registerHelper("filter_list__employee_position", function () {

                let result = get_list("filter_list__employee_position", 'Должность');
                return new hbs.SafeString(result);
            });

            // статусы сотрудников
            hbs.registerHelper("filter_list__employee_status", function () {

                let result = get_list("filter_list__employee_status", 'Статус сотрудника');
                return new hbs.SafeString(result);
            });

            // замерщики
            hbs.registerHelper("filter_list__measurer", function () {

                let result = get_list("filter_list__measurer", 'Замерщик');
                return new hbs.SafeString(result);
            });

            // менеджеры
            hbs.registerHelper("filter_list__manager", function () {

                let result = get_list("filter_list__manager", 'Менеджер');
                return new hbs.SafeString(result);
            });

            // прорабы
            hbs.registerHelper("filter_list__foreman", function () {

                let result = get_list("filter_list__foreman", 'Прораб');
                return new hbs.SafeString(result);
            });

            // дизайнеры
            hbs.registerHelper("filter_list__designer", function () {

                let result = get_list("filter_list__designer", 'Дизайнер');
                return new hbs.SafeString(result);
            });

            // тип источника заказчика
            hbs.registerHelper("filter_list__source_type", function () {

                let result = get_list("filter_list__source_type", 'Источник');
                return new hbs.SafeString(result);
            });

            // тип рекламы
            hbs.registerHelper("filter_list__marketing", function () {

                let result = get_list("filter_list__marketing", 'Тип рекламы');
                return new hbs.SafeString(result);
            });

            // типы контактов
            hbs.registerHelper("filter_list__contact_type", function () {

                let result = get_list("filter_list__contact_type", 'Тип контакта');
                return new hbs.SafeString(result);
            });

            // список пользователей
            hbs.registerHelper("filter_list__users", function () {

                let result = get_list("filter_list__users", 'Список пользователей');
                return new hbs.SafeString(result);
            });

            // универсальный фильтр для справочников-списков
            hbs.registerHelper("filter_list__universal_list", function () {

                let list_title = hb_title.replace('hb_list__', 'filter_list__');
                let result = get_list(list_title, 'Наименование');
                return new hbs.SafeString(result);
            });

            resolve();
        }
        catch (err) {
            reject(new SRVError('SRV3001', _stackTrace(), err));
        }
    });
};

// функция формирует выпадающий список и выставляет в нем выбранное значение (если есть)
function get_list(title, placeholder) {

    try{
        return `<select title="${title}" class="chosen_select before_parsing" data-placeholder="${placeholder}">
                    <option></option>
                </select>`;
    }
    catch (err) {
        throw new SRVError('SRV3001', _stackTrace(), err);
    }
}
