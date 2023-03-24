/*-----------------------------------------------------------------------------------------------*/
/*     контроллер для сборки страниц справочников (заявки, договоры, отчеты и пр.)               */
/*-----------------------------------------------------------------------------------------------*/

const srv_response = require('../controllers/srv_response__ctr');
const ss = require('../config/style_and_script.js');
const layouts = require('../config/layouts.js');
const page_alias = require('../functions/page_alias__func.js');
const hb_universal__ctr = require('./hb_universal__ctr.js');

exports.urequest = async function (request, response){
    try{
        let hb_path = request.path.replace('.html', '');
        let hb_alias = await page_alias.get_alias(hb_path);

        request.body.source = request.path.replace('/', '/handbook_');
        request.body.target = 'all';
        request.body.action = 'read';
        request.body.alias = hb_alias;

        let param = {};
        param.alias = hb_alias;
        param.username = "Admin";
        param.style_stack = await ss.get_stiles(hb_path);
        param.script_stack = await ss.get_scripts(hb_path);
        param.layout = await layouts.get_layout(hb_path);

        if(param.layout === "layouts/maintenance") {
            let options = {
                view: "partials/preloader.hbs",
                data: param
            };
            return await srv_response.response_dispatch(request, response, options);
        }

        if (hb_alias === 'Справочники') {
            request.body.source = '/handbooks/handbook_contracts';
            param.handbook_name = 'Договоры';
        }

        request.body.response_preform = param;
        await hb_universal__ctr.request_handler(request, response);
    }
    catch (err) {
        if(!err.code || (!String(err.code).match('SRV') && !String(err.code).match('DB'))) {
            err = new SRVError('SRV1001', _stackTrace(), err.message)
        }
        await srv_response.response_dispatch(request, response, {error: err, clear: true});
    }
};
