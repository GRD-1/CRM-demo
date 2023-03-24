/*-----------------------------------------------------------------------------------------------*/
/*      библиотека ошибок                                                                        */
/*-----------------------------------------------------------------------------------------------*/

/*  классы пользовательских ошибок
        super   - форма вывода сообщение об ошибке (встроенный параметр конструктора)
        name    - название класса ошибок
        code    - код ошибки (описание кодов в документации: https://remelle.atlassian.net/wiki/spaces/TWINEHOME/pages/59965528)
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
global.CLError = class CLError extends BaseErrTemplate {};

// ошибки на сервере
global.SRVError = class SRVError extends BaseErrTemplate {};

// ошибки в базе
global.DBError = class DBError extends BaseErrTemplate {};
