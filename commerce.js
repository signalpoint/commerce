/**
 * Implements hook_install().
 */
function commerce_install() {
  try {
    // Implement the Commerce Services and attach to the drupalgap.services object.
    drupalgap.services.commerce = {};
    var services = {
      "product_display":{"resources":["index", "retrieve"]},
      "product":{"resources":["index", "retrieve", "create", "update", "delete"]},
      "cart":{"resources":["index", "retrieve"]},
      "order":{"resources":["index", "retrieve", "create", "update", "delete", "line_items"]},
      "line_item":{"resources":["index", "retrieve", "create", "update", "delete"]},
    };
    $.each(services, function(name, service){
        drupalgap.services.commerce[name] = service.resources;
    });
    console.log(JSON.stringify(drupalgap.services));
  }
  catch (error) {
    alert('commerce_install - ' + error);
  }
}
