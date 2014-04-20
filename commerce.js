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
        dpm(drupalgap.commerce);
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
      // Since each item needs to be fetched asynchronously via a product index,
      // we'll place an empty container for each, then fetch them, then populate
      // their containers.
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
            
            // If there are any product entities, extract the product ids so
            // a product index can be performed.
            if (product_display[product_entities_field_name]) {
              
              var product_ids = [];
              $.each(product_display[product_entities_field_name], function(product_id, product) {
                  product_ids.push(product_id);
              });
              var query = {
                filter: {
                  product_id: product_ids
                },
                filter_op: {
                  product_id: 'in'
                }
              };
              // Index the products, manually render them, then inject them
              // into their corresponding container(s).
              commerce_product_index(query, {
                  success: function(products) {
                    dpm('commerce_product_index');
                    dpm(products);
                    var delta = 0;
                    $.each(products, function(product_id, product) {
                        drupalgap_entity_render_content('commerce_product', product);
                        var container_id = _commerce_cart_field_formatter_view_container_id(
                          entity_type,
                          entity_id,
                          delta,
                          product_id
                        );
                        $('#' + container_id).append(product.content);
                        delta++;
                        dpm('Added product to container (' + container_id + ')...');
                    });
                  }
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

/**
* Perform a product index.
* @param {Object} query
* @param {Object} options
*/
function commerce_product_index(query, options) {
  try {
    // @TODO - we can't use jDrupal's entity_index API since the name of the
    // service is 'product' for the 'commerce_product' entity type. jDrupal
    // would either need to be patched to allow for a more flexible path to be
    // set on the entity_index API, or the Commerce Services module needs to
    // adhere to the strict entity type machine names when declaring service
    // resources.
    // The commerce_product index uses a service name of just 'product'.
    /*services_resource_defaults(options, 'commerce_product', 'index');
    options.service = 'product';
    entity_index('commerce_product', query, options);*/
    // Prepare the query string.
    var query_string = '';
    if (query.filter) {
      var filters = '';
      for (var filter in query.filter) {
          if (query.filter.hasOwnProperty(filter)) {
            var key = encodeURIComponent(filter);
            var value = query.filter[filter];
            // If the value is an array, each index needs to be placed into the
            // query string. Otherwise, just place the key value in the query
            // string.
            if ($.isArray(value)) {
              $.each(value, function(i, v) {
                  filters += key + '[' + i + ']=' + v + '&';
              });
            }
            else {
              filters += 'filter[' + key + ']=' + value + '&';
            }
          }
      }
      if (filters != '') {
        filters = filters.substring(0, filters.length - 1);
        query_string += '&' + filters;
      }
    }
    if (query.filter_op) {
      var filter_ops = '';
      for (var filter in query.filter_op) {
          if (query.filter_op.hasOwnProperty(filter)) {
            var key = encodeURIComponent(filter);
            var value = encodeURIComponent(query.filter_op[filter]);
            filter_ops += 'filter_op[' + key + ']=' + value + '&';
          }
      }
      if (filter_ops != '') {
        filter_ops = filter_ops.substring(0, filter_ops.length - 1);
        query_string += '&' + filter_ops;
      }
    }
    // Make a manual call to the product index service resource.
    options.method = 'GET';
    options.path = 'product.json' + query_string;
    options.service = 'product';
    options.resource = 'index';
    Drupal.services.call(options);
  }
  catch (error) { console.log('commerce_ - ' + error); }
}

