/*-----------------------------------------------------------------------------------------------*/
/*     роутер для основных страниц                                                               */
/*-----------------------------------------------------------------------------------------------*/

const express = require("express");
const main__rout = express.Router();

// корневая страница
main__rout.get("/", function (request, response){response.redirect(301, '/measurements.html')});

// отдельные страницы справочников
const hb_page = require('../controllers/hb_page_universal__ctr');
main__rout.get("/measurements", function (request, response){response.redirect(301, '/measurements.html')});
main__rout.get("/measurements.html", hb_page.urequest);
main__rout.get("/contracts", function (request, response){response.redirect(301, '/contracts.html')});
main__rout.get("/contracts.html", hb_page.urequest);
main__rout.get("/reports", function (request, response){response.redirect(301, '/reports.html')});
main__rout.get("/reports.html", hb_page.urequest);

// страница "Справочники"
main__rout.get("/handbooks", function (request, response){response.redirect(301, '/handbooks.html')});
main__rout.get("/handbooks.html", hb_page.urequest);

// дочерние элементы страницы "Справочники" и части самих справочников
const hb_universal__ctr = require("../controllers/hb_universal__ctr.js");
main__rout.post("/handbooks/*", hb_universal__ctr.request_handler);

// страница "о программе"
const about_program__ctr = require('../controllers/page_about_program__ctr.js');
main__rout.get("/about_program(.html)?", about_program__ctr.urequest);
main__rout.post("/publish_document", about_program__ctr.publish_document);
main__rout.post("/update_document", about_program__ctr.update_document);
main__rout.post("/delete_document", about_program__ctr.delete_document);

// страница авторизации
const login__ctr = require('../controllers/page_login__ctr.js');
main__rout.get("/login(.html)?", login__ctr.urequest);

// запрос обновления скриптов
const get_scripts__ctr = require('../controllers/get_scripts__ctr.js');
main__rout.post("/get_scripts", get_scripts__ctr.urequest);

// загрузка журнала событий на клиент
const log__ctr = require('../controllers/log__ctr.js');
main__rout.post("/get_log", log__ctr.request_preparation);

// отчет об ошибке
main__rout.post("/error", log__ctr.request_preparation);

// ++24082021KHC Отправка отчета об ошибке
const send_report__ctr = require('../controllers/send_report__ctr.js');
main__rout.post("/send_report", send_report__ctr.send_report);

// ++11032022KHC загрузка/удаление файлов с сервера TWINE_Storage
const storage_api__ctr = require('../controllers/storage_api__ctr');
main__rout.post("/write_file", storage_api__ctr.writeFile);

// ++29042022KHC выдача файлов из директории uploads
const files__ctr = require('../controllers/files__ctr');
main__rout.get("/uploads/*", files__ctr.get_file);
module.exports = main__rout;
