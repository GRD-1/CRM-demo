/*------------------------------------------------------------------------------------------------------------------------------------------*/
/*		 модуль для подключения к базе данных. параметры подключения [_db_options] настраиваются тут: server/config/database.js             */
/*------------------------------------------------------------------------------------------------------------------------------------------*/

const db = require('../config/database.js');

// используем этот метод, когда нужно отправить только один запрос
exports.single_request = async function (query) {
    try {
        const { Client } = require('pg');
        let client;
        try {
            client = new Client(db.get_options());
            await client.connect();
        }
        catch (err) {
            throw new SRVError('SRV4001', _stackTrace(), `не удалось подключиться к БД. причина: ${err.message}`);
        }
        const res = await client.query(query)
        client.end();
        return res;
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new DBError('DB1001', _stackTrace(), err.message)
        }
        throw err;
    }
}

/* используем этот метод, когда нужно отправлять несколько запросов подряд. описание тут: https://node-postgres.com/features/connecting
*   функция принимает:
*                       query       - текст запроса к БД
*                       pool        - ссылку на соединение с БД. Его обязательно нужно погасить после завершения серии запросов.
*                       terminate   - указание гасить или нет соединение с БД
*   функция возвращает:
*                       res         - ответ БД
*                       pool        - ссылку на соединение с БД. Ее нужно будет передать назад в функцию в следующем запросе
*/
exports.multi_request = async function (query, pool, terminate) {
    try {
        let client;
        try {
            if(pool === undefined){
                const { Pool } = require('pg');
                pool = new Pool(db.get_options());
            }
            client = await pool.connect()
        }
        catch (err) {
            throw new SRVError('SRV4001', _stackTrace(), `не удалось подключиться к БД. причина: ${err.message}`)
        }
        let res = await client.query(query);
        client.release();
        if(terminate) pool.end();
        return {res, pool};
    }
    catch (err) {
        if(!err.code || !String(err.code).match('SRV')) {
            err = new DBError('DB1001', _stackTrace(), err.message)
        }
        throw err;
    }
}