/*-----------------------------------------------------------------------------------------------*/
/*     модель данных для выпадающих списков справочников                                         */
/*-----------------------------------------------------------------------------------------------*/

const query_conditions = require("../functions/query_conditions__func.js");

/*  функция возвращает текст запроса к БД
    headers - набор зависимостей списка, заголовки других списков, которые влияют на выборку.
    с клиента в переменной request_body.conditions приходят значения всех выпадающих списков на форме !== null,
    функция conditions_handler отбирает из параметров запроса только значимые для выборки конкретного списка
 */
exports.get_query = async function (request_body) {
    try{
        let headers, conditions='';
        let target = request_body.target.replace('filter_','');
        switch (target) {
            case 'list__contract':
                headers = new Set(['customer', 'object', 'measurement']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT contract, max(contract_number) FROM views.list__biggest_lists ${conditions} group by contract order by max(contract_number)`;
            case 'list__contract_type':
                headers = new Set(['']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT id, title FROM data.list__contract_type ${conditions}`;
            case 'list__contract_status':
                return `SELECT id, title FROM data.list__contract_status order by title`;
            case 'list__measurement':
                headers = new Set(['customer', 'object']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT measurement, max(measurement_number) FROM views.list__biggest_lists ${conditions} group by measurement order by max(measurement_number)`;
            case 'list__measurement_type':
                return `SELECT id, title FROM data.list__measurement_type order by title`;
            case 'list__measurement_quality':
                return `SELECT id, title FROM data.list__measurement_quality order by title`;
            case 'list__measurement_status':
                return `SELECT id, title FROM data.list__measurement_status order by title`;
            case 'list__measurement_method':
                return `SELECT id, title FROM data.list__measurement_method order by title`;
            case 'list__report_type':
                return `SELECT id, title FROM data.list__report_type order by title`;
            case 'list__report_status':
                return `SELECT id, title FROM data.list__report_status order by title`;
            case 'list__customer':
                headers = new Set(['']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT customer, max(customer_name) FROM views.list__biggest_lists ${conditions} group by customer order by max(customer_name)`;
            case 'list__referred_customer':
                headers = new Set(['']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT customer, max(customer_name) FROM views.list__biggest_lists ${conditions} group by customer order by max(customer_name)`;
            case 'list__object':
                headers = new Set(['customer']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT object, max(object_address) FROM views.list__biggest_lists ${conditions} group by object order by max(object_address)`;
            case 'list__department':
                headers = new Set(['']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT department, max(department_title) FROM views.list__department_options ${conditions} group by department order by max(department_title)`;
            case 'list__measurement_department':
                headers = new Set(['']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT department, max(department_title) FROM views.list__department_options ${conditions} group by department order by max(department_title)`;
            case 'list__contract_department':
                headers = new Set(['']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT department, max(department_title) FROM views.list__department_options ${conditions} group by department order by max(department_title)`;
            case 'list__dba':
                headers = new Set(['department']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT dba, max(dba_title) FROM views.list__department_options ${conditions} group by dba order by max(dba_title)`;
            case 'list__employee':
                return `SELECT id, full_name FROM data.employees order by full_name`;
            case 'list__employee_position':
                return `SELECT id, title FROM data.list__employee_position order by title`;
            case 'list__employee_status':
                return `SELECT id, title FROM data.list__employee_status order by title`;
            case 'list__measurer':
                return `SELECT id, full_name FROM data.employees WHERE position in (1,2,6) order by full_name`;
            case 'list__manager':
                return `SELECT id, full_name FROM data.employees WHERE position in (3,4,11,12,13) and status<>3 and delete_mark=false order by full_name`;
            case 'list__foreman':
                return `SELECT id, full_name FROM data.employees WHERE position=5 order by full_name`;
            case 'list__designer':
                return `SELECT id, full_name FROM data.employees WHERE position=4 order by full_name`;
            case 'list__estimate_conditions':
                headers = new Set(['customer']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT id, title FROM data.estimate_conditions ${conditions}
                        union
                        SELECT id, title FROM data.estimate_conditions where customer is null
                        order by title`;
            case 'list__payment_conditions':
                headers = new Set(['customer']);
                conditions = await query_conditions.conditions_handler(request_body, headers);
                return `SELECT id, title FROM data.payment_conditions ${conditions}
                        union
                        SELECT id, title FROM data.payment_conditions where customer is null
                        order by title`;
            case 'list__source_type':
                return `SELECT id, title FROM data.list__source_type order by title`;
            case 'list__marketing':
                return `SELECT id, title FROM data.list__marketing order by title`;
            case 'list__contact_type':
                return `SELECT id, title FROM data.list__contact_type order by title`;
            case 'list__project_type':
                return `SELECT id, title FROM data.list__project_type order by title`;
            case 'list__true_false':
                return `SELECT id, title FROM data.list__true_false`;
            case 'list__identity_type': // ++KHC20052022 Типы документов
                return `SELECT * FROM data.list__employee_identity_type`;
            default:
                throw new SRVError('SRV2001', _stackTrace(), `выпадающий список ${request_body.target} не найден`)
        }
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new SRVError('SRV2001', _stackTrace(), err.message)
        }
        throw err;
    }
}