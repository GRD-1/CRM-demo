/*------------------------------------------------------------------------------------------------*/
/*		скрипты для обработки ошибок на клиенте (коды ошибок описаны в документации)              */
/*------------------------------------------------------------------------------------------------*/

/*  классы пользовательских ошибок
        super   - форма вывода сообщение об ошибке (встроенный параметр конструктора)
        name    - название класса ошибок
        code    - код ошибки (описание кодов в документации: documents/readmy_dev.docx)
        stack   - стек вызовов той среды, где была поймана ошибка (на клиенте, сервере или в БД)
        stk     - стек вызовов в текстовом формате. (иначе не передать с клиента на сервер)
        cause   - текстовое сообщение либо сообщение родительской ошибки, если ошибка была делегирована
*/

// шаблон
class BaseErrTemplate extends Error {
    constructor(error_code, stk, cause) {
        super('[' + error_code + '] - ' + cause);
        this.name = this.constructor.name;
        this.code = error_code;
        this.stack;
        this.stk = stk;
        this.cause = cause;
    }
}

// ошибки на клиенте
class CLError extends BaseErrTemplate {}
/*-----------------------------------------------------------------------------------------------*/
/*    обработчики ошибок                                                                         */
/*-----------------------------------------------------------------------------------------------*/

// обработка ошибок перед отправкой на сервер
async function err_handler(err, source) {
    try {
        let query = {};
        query.source = source;
        query.target = 'error_log';
        query.action = 'insert';
        query.data = err;

        await srv_request('/error', query);
        let container = await get_container();
        console.error(err);
        system_message(err.message, container, 'error');
        hide_preloader();
    }
    catch (err) {
        var error = new CLError('CL1001', _stackTrace(), err.name + ': ' + err.message);
        error.message = 'Ошибка в обработчике ошибок! [' + error.code + '] - не удалось корректно обработать ошибку!';
    }
}

// функция возвращет текущий стек вызовов
function _stackTrace() {
    let err = new Error();
    return err.stack;
}