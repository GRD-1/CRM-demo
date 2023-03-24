/*-----------------------------------------------------------------------------------------------*/
/*      глобальные переменные                                                                    */
/*-----------------------------------------------------------------------------------------------*/

// пути к основным папкам
global._public = './public/';
global._uploads = './public/uploads/';
global._css = './public/css/';
global._js = './public/js/';
global._img = './public/images/';
global._fonts = './public/fonts/';

// функция возвращет текущий стек вызовов
global._stackTrace =
function (){
    let err = new Error();
    return err.stack;
};