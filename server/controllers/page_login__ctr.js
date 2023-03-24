/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для страницы авторизации                                                       */
/*-----------------------------------------------------------------------------------------------*/

const srv_response = require('../controllers/srv_response__ctr');

exports.urequest = async function (request, response){

    try {
        const ss = require('../config/style_and_script.js');
        const styles = ss.get_stiles('/login');
        const scripts = ss.get_scripts('/login');
        const layouts = require('../config/layouts.js');

        let param = {
            alias: "Вход",
            username: "",
            style_stack: styles,
            script_stack: scripts,
            layout: await layouts.get_layout('/login')
        };
        if(param.layout === "layouts/maintenance") {
            let options = {
                view: "partials/preloader.hbs",
                data: param
            };
            return await srv_response.response_dispatch(request, response, options);
        }
        await srv_response.response_dispatch(request, response, {data: param, view: "login.hbs"});
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err, clear: true});
    }
};
