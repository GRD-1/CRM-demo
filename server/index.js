/*-----------------------------------------------------------------------------------------------*/
/*    index.js                                                                                   */
/*-----------------------------------------------------------------------------------------------*/

// библиотека ошибок, глобальные переменные
require('./errors/error_lib');
require('./config/variables');

// фреймворк для роутинга и сборки страниц
const express = require("express");
const app = express();
const hbs = require("hbs");

// роутеры
const management__rout = require('./routs/management__rout.js');
const main__rout = require('./routs/main__rout.js');

// парсер запросов
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: true, limit: '10mb'});
app.use(bodyParser.json({ limit: '10mb' }));

// движок для рендеринга
app.set("view engine", "hbs");

// путь к "представлениям" - макетам страниц
app.set("views", __dirname + "/views");

// путь к "частичным представлениям"
hbs.registerPartials( "./views/partials");

// путь к "песочнице" - расшаренной папке
app.use(express.static(__dirname + "/public"));

// роутеры
app.use("/management(.html)?", urlencodedParser, management__rout);
app.use("/", urlencodedParser, main__rout);

app.use("/403", function (req, res, next) {
    res.status(302).render("error.hbs", {status: 403, message: "Недостаточно прав для просмотра страницы!"});
});
app.use(function (req, res, next) {
    res.status(404).render("error.hbs", {status: 404, message: "Страница не найдена!"});
});

app.listen(8080);
