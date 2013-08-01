drupalgap.services.commerce = {
  "product-display":{
    "index":{},
    "retrieve":{
      "options":{
        "type":"get",
        "path":"product-display/%nid.json",
        "success":function(data){
          try {
          }
          catch (error) { drupalgap_error(error); }
        },
      },
      "call":function(options){
        try {
          if (!options.nid) { drupalgap_error('missing nid'); }
          else {
            var api_options = drupalgap_chain_callbacks(
              drupalgap.services.commerce['product-display'].retrieve.options,
              options
            );
            api_options.path = 'product-display/' + options.nid + '.json';
            drupalgap.api.call(api_options);
          }
        }
        catch (error) { drupalgap_error(error); }
      }
    }
  }, /* end: product-display */
  "product":{
    "index":{},
    "retrieve":{
      "options":{
        "type":"get",
        "path":"product/%product_id.json",
        "success":function(product){
          try {
          }
          catch (error) { drupalgap_error(error); }
        },
      },
      "call":function(options){
        try {
          if (!options.product_id) { drupalgap_error('missing product_id'); }
          else {
            var api_options = drupalgap_chain_callbacks(
              drupalgap.services.commerce['product'].retrieve.options,
              options
            );
            api_options.path = 'product/' + options.product_id + '.json';
            drupalgap.api.call(api_options);
          }
        }
        catch (error) { drupalgap_error(error); }
      }
    },
    "create":{},
    "update":{},
    "delete":{}
  }, /* end: product */
  "cart":{
    "index":{},
    "retrieve":{}
  },
  "order":{
    "index":{},
    "retrieve":{},
    "create":{},
    "update":{},
    "delete":{},
    "line_items":{}
  },
  "line-item":{
    "index":{},
    "retrieve":{},
    "create":{},
    "update":{},
    "delete":{}
  }
};

/**
 * Implements hook_install().
 */
/*function commerce_install() {
  try {
    // Implement the Commerce Services and attach to the drupalgap.services
    // object.
    
    var services = {
      
    };
    $.each(services, function(name, service){
        drupalgap.services.commerce[name] = service.resources;
    });
  }
  catch (error) {
    alert('commerce_install - ' + error);
  }
}*/

/**
 * Implements hook_services_preprocess().
 */
/*function commerce_services_preprocess(api, call_options, caller_options) {
  try {
    // Before the node retrieve resource is called, overwrite the caller
    // option's path to use the product display resource.
    if (caller_options.service == 'node' && caller_options.resource == 'retrieve') {
      caller_options.path = 'product-display/' + caller_options.nid + '.json';
    }
  }
  catch (error) {
    alert('hook_services_preprocess - ' + error);
  }
}*/

/**
 * Implements hook_services_success().
 */
function commerce_services_success(options, data) {
  try {
    //console.log(JSON.stringify(options));
    // Extract the commerce object from the drupalgap system connect result.
    // THIS commented out line is for the 7.x-1.x-alpha-services branch
    //if (options.service == 'drupalgap_system' && options.resource == 'connect') {
    if (options == 'drupalgap_system/connect.json') {
      if (data.commerce) {
        drupalgap.commerce = data.commerce;
      }
      else {
        alert('commerce_services_success - failed to extract commerce object ' +
              'from system connect, is the commerce_drupalgap module enabled ' +
              'on your Drupal site?');
      }
    }
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Returns JSON with data about the types of commerce products.
 */
function commerce_product_types() {
  try {
    console.log(JSON.stringify(drupalgap.commerce.commerce_product_types));
    return drupalgap.commerce.commerce_product_types;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Returns JSON with data about the node types that have a commerce product
 * reference field attached to the content type.
 */
function commerce_product_reference_node_types() {
  try {
    console.log(JSON.stringify(drupalgap.commerce.commerce_product_reference_node_types));
    return drupalgap.commerce.commerce_product_reference_node_types;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_formatter_view().
 */
function commerce_cart_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {
    var element = {};
    if (!drupalgap_empty(items)) {
      console.log('ITEMS');
      console.log(JSON.stringify(items));
      /*$.each(items, function(delta, item){
          
      });*/
      //console.log(JSON.stringify(drupalgap_entity_get_info('commerce_product')));
      //console.log(JSON.stringify(drupalgap_field_info_instances('commerce_product', entity.type)));
      //console.log(JSON.stringify(drupalgap_field_info_instances('commerce_product')));
      //commerce_product_types();
      //commerce_product_reference_node_types();
      //var field_info_instances = drupalgap_field_info_instances('node', entity.type);
      //console.log(JSON.stringify(field_info_instances));
      
      // Load the product display.
      var product_display = commerce_product_display_load(entity.nid);
      if (product_display) {
        
        // Determine the internal commerce field name for the product display's
        // entity reference(s). Note, this is not the same field name used by
        // the Product reference field on the node content type.
        var product_entities_field_name = 'field_' + entity.type + '_product_entities';
        
        // If there are any product entities, iterate over them.
        if (product_display[product_entities_field_name]) {
          var delta = 0;
          $.each(product_display[product_entities_field_name], function(product_id, product){
              var loaded_product = commerce_product_load(product_id);
              //console.log(JSON.stringify(loaded_product));
              //console.log(JSON.stringify(drupalgap_field_info_instances('commerce_product', loaded_product.type)));
              drupalgap_entity_render_content('commerce_product', loaded_product);
              //console.log('CONTENT');
              //console.log(JSON.stringify(loaded_product.content));
              element[delta] = {markup:loaded_product.content};
              delta++;
              return false;
          });
        }
        else {
          drupalgap_error(product_entities_field_name + ' does not exist in ' + 
                          'product display!');
        }
      }
      else {
        drupalgap_error('Failed to load product display for node (' + entity.nid + ').');
      }
    }
    /*$.each(items, function(delta, item){
        element[delta] = {
          markup:item.value
        };
        return false;
    });*/
    return element;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Given a node id, this will return the product display JSON data, or false if
 * the product display fails to load.
 */
function commerce_product_display_load(nid) {
  var product_display = false;
  drupalgap.services.commerce['product-display'].retrieve.call({
      nid:nid,
      async:false,
      success:function(data){
        product_display = data;
      }
  });
  return product_display;
}

/**
 * Given a product id, this will return the product display JSON data, or false
 * if the product fails to load.
 */
function commerce_product_load(product_id) {
  
  console.log('LOADING PRODUCT ' + product_id);
  
  // Grab any options.
  var options = null;
  if (arguments[2]) { options = arguments[2]; }
  
  // Get the local storage key. 
  var local_storage_key = entity_local_storage_key('commerce_product', product_id);
  
  // Process options if necessary.
  if (options) {
    // If we are resetting, remove the item from localStorage.
    if (options.reset) { window.localStorage.removeItem(local_storage_key); }
  }
  
  // Attempt to load the product from local storage.
  var product = window.localStorage.getItem(local_storage_key);
  if (product) {
    console.log('LOADED FROM LOCAL STORAGE!');
    return JSON.parse(product);
  }
  
  // Load the product from Drupal.
  drupalgap.services.commerce.product.retrieve.call({
      product_id:product_id,
      async:false,
      success:function(data){
        product = data;
        window.localStorage.setItem(local_storage_key, JSON.stringify(product));
        console.log('SAVED TO LOCAL STORAGE! (' + local_storage_key + ')');
      }
  });
  return product;
}
