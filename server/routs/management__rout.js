/*-----------------------------------------------------------------------------------------------*/
/*     роутер для страницы "Админка"                                                             */
/*-----------------------------------------------------------------------------------------------*/
const express = require("express");
const management_ctr = require("../controllers/page_management__ctr.js");
const management__rout = express.Router();
const universal_ctr = require('../controllers/hb_universal__ctr');

// Первая страница, загружаемая в админке
management__rout.get("/", management_ctr.logs);

// Логирование
management__rout.post("/logs_errors", management_ctr.logs_errors);
management__rout.post("/log_events", management_ctr.log_events);
management__rout.post("/logs_pg", management_ctr.logs_pg);
management__rout.post("/multiwin_mode", management_ctr.multiwin_mode);
management__rout.post("/filter_list__users", management_ctr.filter_list__users);

// Общие настройки
management__rout.post("/settings_general", management_ctr.settings_general);
management__rout.post("/set_settings", management_ctr.set_settings);
management__rout.post("/get_settings", management_ctr.get_settings);

// Страницы в разработке
management__rout.post("/handbook_users_home(.html)?", management_ctr.users_home);
management__rout.post("/handbook_users_web(.html)?", management_ctr.users_web);
management__rout.post("/erase(.html)?", management_ctr.erase);
management__rout.post("/backup(.html)?", management_ctr.backup);

module.exports = management__rout;