/**
 * Implements hook_services_preprocess().
 */
function commerce_services_preprocess(options) {
  try {
    //dpm(options);
    // Set the correct path for the service resource call.
    switch (options.service) {
      case 'commerce_product_display':
        if (options.resource == 'retrieve') {
          options.path = options.path.replace(
            'commerce_product_display',
            'product-display'
          );  
        }
        break;
      case 'commerce_product':
        if (options.resource == 'retrieve') {
          options.path = options.path.replace(
            'commerce_product',
            'product'
          );  
        }
        break;
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
    return drupalgap.commerce.commerce_product_reference_node_types;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_field_formatter_view().
 */
function commerce_cart_field_formatter_view(entity_type, entity, field,
  instance, langcode, items, display
) {
  try {
    var element = {};
    if (!empty(items)) {
      // Since each item needs to be fetched asynchronously, we'll place an
      // empty container for each, then fetch them, then populate their
      // containers.
      var last_delta;
      $.each(items, function(delta, item){
          element[delta] = _commerce_cart_field_formatter_view_container(
            entity_type,
            entity.nid,
            delta,
            item
          );
          last_delta = delta;
      });
      
      // Now set up a jQM pageshow handler to fetch the products. We'll place
      // the script code onto the last delta of the item collection.
      element[last_delta].markup += drupalgap_jqm_page_event_script_code({
          page_id: drupalgap_get_page_id(),
          jqm_page_event: 'pageshow',
          jqm_page_event_callback:
            '_commerce_cart_field_formatter_view_pageshow',
          jqm_page_event_args: JSON.stringify({
              entity_type: entity_type,
              entity_id: entity.nid
          })
      });
    }
    return element;
  }
  catch (error) {
    console.log('commerce_cart_field_formatter_view - ' + error);
  }
}

/**
 *
 */
function _commerce_cart_field_formatter_view_pageshow(options) {
  try {
    var entity_type = options.entity_type;
    var entity_id = options.entity_id;
    // Load the product display.
    commerce_product_display_load(entity_id, {
        success: function(product_display) {
          try {
            // Determine the internal commerce field name for the product
            // display's entity reference(s). Note, this is not the same field
            // name used by the Product reference field on the node content
            // type.
            // @TODO - is this dynamic, or is it a static name like we have it?
            var product_entities_field_name = 'field_product_entities';
            
            // If there are any product entities, iterate over them.
            if (product_display[product_entities_field_name]) {
              var delta = 0;
              $.each(product_display[product_entities_field_name], function(product_id, product){
                  commerce_product_load(product_id, {
                      success: function(loaded_product) {
                        drupalgap_entity_render_content('commerce_product', loaded_product);
                        var container_id = _commerce_cart_field_formatter_view_container_id(
                          entity_type,
                          entity_id,
                          delta,
                          product_id
                        );
                        $('#' + container_id).append(loaded_product.content);
                      }
                  });
              });
            }
          }
          catch (error) {
            console.log(
              '_commerce_cart_field_formatter_view_pageshow - ' + 
              'commerce_product_display_load - success - ' + error
            );
          }
        }
    });
  }
  catch (error) {
    console.log('_commerce_cart_field_formatter_view_pageshow - ' + error);
  }
}

/**
 * 
 * @param {String} entity_type
 * @param {Number} entity_id
 * @param {Number} delta
 * @param {Object} item
 * @return {String}
 */
function _commerce_cart_field_formatter_view_container(
  entity_type,
  entity_id,
  delta,
  item
) {
  try {
    var id = _commerce_cart_field_formatter_view_container_id(
      entity_type,
      entity_id,
      delta,
      item.product_id
    );
    return {
      markup: '<div id="' + id + '"></div>'
    };
  }
  catch (error) {
    console.log('_commerce_cart_field_formatter_view_container - ' + error);
  }
}

/**
 *
 */
function _commerce_cart_field_formatter_view_container_id(
  entity_type,
  entity_id,
  delta,
  product_id
) {
  try {
    return entity_type + '_' + entity_id + '_' + delta + '_' + product_id +
      '_commerce_cart_container';
  }
  catch (error) {
    console.log('_commerce_cart_field_formatter_view_container_id - ' + error);
  }
}

/**
 * Implements hook_field_formatter_view().
 */
function commerce_price_field_formatter_view(entity_type, entity, field,
  instance, langcode, items, display
) {
  try {
    var element = {};
    if (!empty(items)) {
      // The items sent in are not like typical a typical item/delta collection.
      // It just contains the amount and currency code, so we'll just use a
      // delta of zero.
      var markup = '';
      switch (items.currency_code) {
        case 'USD':
          markup += '$';
          break;
        default:
          markup += items.currency_code + ' ';
          break;
      }
      markup += (items.amount/100).toFixed(2);
      element[0] = {
        markup: markup
      };
    }
    return element;
  }
  catch (error) {
    console.log('commerce_price_field_formatter_view - ' + error);
  }
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

