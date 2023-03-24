/*----------------------------------------------------------------------------------------------------*/
/*   обработчики событий выпадающих списков chosen                                                    */
/*----------------------------------------------------------------------------------------------------*/

// одинарный клик левой клавиши мыши по выпадающему списку
$('main').on('mousedown', '.chosen-single', function(event){

  var box = this.parentElement;
  if(!$(box).is('.chosen-with-drop')){
    return
  }
  if(event.which === 1) {
    one_click_handler(box);
  }
});

// нажатие кнопки "пробел" над полем выпадающего списка
$('main').on('keydown', '.chosen-container', function(event) {

  if(event.which === 32) {
    one_click_handler(this);
  }
});

// функция загружает данные в выпадающий список
async function one_click_handler(event_source) {
  try{
    show_preloader();
    let container = await get_container();
    let path = $('#btn_default')[0].formAction;
    let query = {};
    query.source = await get_request_source(event_source, 'chosen_dropdown_list', container);
    query.target = await get_response_target(event_source, 'chosen_dropdown_list', container);
    query.action = "read";
    query.conditions = await get_query_conditions(query.target);

    let srv_response = await srv_request(path, query)
    await srv_response_rendering(query, srv_response);
    hide_preloader();
  }
  catch (err) {
    if(!err.code) {
      err = new CLError('CL1001', _stackTrace(), `не удалось загрузить данные выпадающего списка ${target}! причина: ${err.message}`)
    }
    await err_handler(err, $('#btn_default')[0].formAction);
    hide_preloader();
  }
}