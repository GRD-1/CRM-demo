/*------------------------------------------------------------------------------------------------------------------------------------------*/
/*		 параметры подключения к базе данных (само подключение тут: server/database/index.js)                                               */
/*------------------------------------------------------------------------------------------------------------------------------------------*/

// логирование в базу включить/выключить
global._event_logging = false;
global._error_logging = true;

// параметры подключения к БД (чтобы изменить базу назначения, нужно поменть только эти 2 строки)
const dbname = "crm_demo";
const dblocal = true;

// получаем параметры подключения к БД
exports.get_options = function () {
    try {
        switch (dbname) {
            case "crm_demo":
                return {
                    user: "developer",
                    host: 'localhost',
                    database: "crm_demo",
                    password: "Latepia",
                    port: 5432,
                }
            default:
                throw new Error(`нет такой базы - [${dbname}]`);
        }
    }
    catch (err) {
        throw new Error(`не удалось получить параметры подключения. причина: ${err.message}`)
    }
}
