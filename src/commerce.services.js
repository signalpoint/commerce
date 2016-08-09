/**
 * Implements hook_services_preprocess().
 */
function commerce_services_preprocess(options) {
  try {
    //dpm(options);
    // Since the Commerce Services doesn't use a fully qualified namespace
    // prefix on their resources, we have to manually set the correct path for
    // the service resource calls.
    switch (options.service) {
      case 'commerce_line_item':
        if (options.resource == 'update' || options.resource == 'delete') {
          options.path = options.path.replace(
              'commerce_line_item',
              'line-item'
          );
        }
        break;
      case 'commerce_order':
        if (options.resource == 'retrieve' || options.resource == 'update') {
          options.path = options.path.replace(
              'commerce_order',
              'order'
          );
        }
        break;
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
 * Creates a cart.
 * @param {Object} options
 */
function commerce_cart_create(options) {
  try {
    options.method = 'POST';
    options.contentType = 'application/x-www-form-urlencoded';
    options.path = 'cart.json';
    if (typeof options.flatten_fields !== 'undefined' && options.flatten_fields === false) {
      options.path += '&flatten_fields=false';
    }
    options.service = 'cart';
    options.resource = 'create';
    Drupal.services.call(options);
  }
  catch (error) { console.log('commerce_cart_create - ' + error); }
}

/**
 * Performs a cart index.
 * @param {Object} query
 * @param {Object} options
 */
function commerce_cart_index(query, options) {
  try {
    options.method = 'GET';
    options.path = 'cart.json';
    options.service = 'cart';
    options.resource = 'index';
    Drupal.services.call(options);
  }
  catch (error) { console.log('commerce_cart_index - ' + error); }
}

/**
 * Creates a cart.
 * @param {Object} options
 */
function commerce_line_item_create(options) {
  try {
    options.method = 'POST';
    options.contentType = 'application/x-www-form-urlencoded';
    options.path = 'line-item.json';
    if (typeof options.flatten_fields !== 'undefined' && options.flatten_fields === false) {
      options.path += '&flatten_fields=false';
    }
    options.service = 'line-item';
    options.resource = 'create';
    // Since the service resource is expecting URL encoded data, change the data
    // object into a string.
    if (options.data) {
      var data = '';
      for (var property in options.data) {
        if (options.data.hasOwnProperty(property)) {
          data += property + '=' + options.data[property] + '&';
        }
      }
      // Remove last ampersand.
      if (data != '') {
        data = data.substring(0, data.length - 1);
        options.data = data;
      }
    }
    Drupal.services.call(options);
  }
  catch (error) { console.log('commerce_line_item_create - ' + error); }
}

/**
 * Update a line item.
 * @param {Object} line_item
 * @param {Object} options
 */
function commerce_line_item_update(line_item, options) {
  try {
    services_resource_defaults(options, 'commerce_line_item', 'update');
    entity_update('commerce_line_item', null, line_item, options);
  }
  catch (error) { console.log('commerce_line_item_update - ' + error); }
}

/**
 * Deletes a line item.
 */
function commerce_line_item_delete(ids, options) {
  try {
    services_resource_defaults(options, 'commerce_line_item', 'delete');
    entity_delete('commerce_line_item', ids, options);
  }
  catch (error) { console.log('commerce_line_item_delete - ' + error); }
}

/**
 * Retrieves an order.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_order_retrieve(ids, options) {
  try {
    services_resource_defaults(options, 'commerce_order', 'retrieve');
    entity_retrieve('commerce_order', ids, options);
  }
  catch (error) { console.log('commerce_order_retrieve - ' + error); }
}

/**
 * Updates an order.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_order_update(order, options) {
  try {
    order.order_id = parseInt(order.order_id);
    var path = 'commerce_order/' + order.order_id + '.json' /* &flatten_fields=false */;
    Drupal.services.call({
      method: 'PUT',
      path: path,
      service: 'commerce_order',
      resource: 'update',
      entity_type: 'commerce_order',
      entity_id: order.order_id,
      bundle: null,
      data: JSON.stringify(order),
      success: function(data) {
        try {
          if (options.success) { options.success(data); }
        }
        catch (error) { console.log('commerce_order_update - success - ' + error); }
      },
      error: function(xhr, status, message) {
        try {
          if (options.error) { options.error(xhr, status, message); }
        }
        catch (error) { console.log('commerce_order_update - error - ' + error); }
      }
    });
  }
  catch (error) { console.log('commerce_order_update - ' + error); }
}


/**
 * Retrieves a product display.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_display_retrieve(ids, options) {
  try {
    services_resource_defaults(options, 'commerce_product_display', 'retrieve');
    entity_retrieve('commerce_product_display', ids, options);
  }
  catch (error) { console.log('commerce_product_display_retrieve - ' + error); }
}

/**
 * Retrieves a commerce product.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_retrieve(ids, options) {
  try {
    services_resource_defaults(options, 'commerce_product', 'retrieve');
    entity_retrieve('commerce_product', ids, options);
  }
  catch (error) { console.log('commerce_product_retrieve - ' + error); }
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
  catch (error) { console.log('commerce_product_index - ' + error); }
}
