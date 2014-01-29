drupalgap.services.commerce = {
  "product-display":{
    "index":{},
    "retrieve":{}
  },
  "product":{
    "index":{},
    "retrieve":{},
    "create":{},
    "update":{},
    "delete":{}
  },
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
 * Implements hook_services_preprocess().
 */
function commerce_services_preprocess(options) {
  try {
    //dpm(options);
    // Set the correct path for the service call(s).
    if (options.service == 'commerce_product_display' &&
      options.resource == 'retrieve') {
      options.path = options.path.replace(
        'commerce_product_display',
        'product-display'
      );
    }
  }
  catch (error) { console.log('commerce_services_preprocess - ' + error); }
}

/**
 * Implements hook_services_success().
 */
function commerce_services_postprocess(options, data) {
  try {
    // Extract the commerce object from the system connect result data.
    if (options.service == 'system' && options.resource == 'connect') {
      if (data.commerce) {
        drupalgap.commerce = data.commerce;
      }
      else {
        console.log('commerce_services_postprocess - failed to extract ' +
          ' commerce object from system connect. Is the commerce_drupalgap ' +
          ' module enabled on your Drupal site?');
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
    //console.log(JSON.stringify(drupalgap.commerce.commerce_product_types));
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
    //console.log(JSON.stringify(drupalgap.commerce.commerce_product_reference_node_types));
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
    if (!empty(items)) {
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
      commerce_product_display_load(entity.nid, {
          success: function(product_display) {
            // Determine the internal commerce field name for the product display's
            // entity reference(s). Note, this is not the same field name used by
            // the Product reference field on the node content type.
            var product_entities_field_name = 'field_' + entity.type + '_product_entities';
            
            // If there are any product entities, iterate over them.
            if (product_display[product_entities_field_name]) {
              var delta = 0;
              $.each(product_display[product_entities_field_name], function(product_id, product){
                  commerce_product_load(product_id, {
                      success: function(loaded_product) {
                        //console.log(JSON.stringify(loaded_product));
                        //console.log(JSON.stringify(drupalgap_field_info_instances('commerce_product', loaded_product.type)));
                        drupalgap_entity_render_content('commerce_product', loaded_product);
                        //console.log('CONTENT');
                        //console.log(JSON.stringify(loaded_product.content));
                        element[delta] = {markup:loaded_product.content};
                        delta++;
                        return false;
                      }
                  });
              });
            }
          }
      });
    }
    /*$.each(items, function(delta, item){
        element[delta] = {
          markup:item.value
        };
        return false;
    });*/
    return element;
  }
  catch (error) { console.log('commerce_cart_field_formatter_view - ' + error); }
}

/**
 * Retrieves a node.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_display_load(ids, options) {
  try {
    services_resource_defaults(options, 'commerce_product_display', 'retrieve');
    entity_retrieve('commerce_product_display', ids, options);
  }
  catch (error) { console.log('commerce_product_display_load - ' + error); }
}

/**
 * Retrieves a node.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_load(ids, options) {
  try {
    services_resource_defaults(options, 'commerce_product', 'retrieve');
    entity_retrieve('commerce_product', ids, options);
  }
  catch (error) { console.log('commerce_product_load - ' + error); }
}

