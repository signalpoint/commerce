/**
 *
 */
function commerce_cart_add_to_cart_form(form, form_state, product_display) {
  try {
    //dpm('commerce_cart_add_to_cart_form');
    //dpm(product_display);
    
    // Set the form entity type and bundle.
    form.entity_type = 'commerce_product';
    form.bundle = product_display.type;
    
    // Determine the internal commerce field name for the product
    // display's entity reference(s). Note, this is not the same field
    // name used by the Product reference field on the node content
    // type.

    // @TODO - is this dynamic, or is it a static name chosen by the site builder?
    var product_entities_field_name = 'field_product_entities';
    
    // If there are any product entities...
    if (product_display[product_entities_field_name]) {
      
      // Keep track of the field names, so we can remove the bunk 0 index
      // property on their form element item later.
      var field_names = [];
      
      //dpm('commerce_product field_info_instances');
      var field_info_instances = drupalgap_field_info_instances('commerce_product', product_display.type);
      //dpm(field_info_instances);
      
      // For each field instance on this product, if it has cart
      // settings, and is an attributed field, iterate over each product
      // and extract the form element items required to build the
      // widget.
      $.each(field_info_instances, function(field_name, field) {

          // Skip fields that aren't part of the cart (e.g. price, images).
          // @TODO - These fields need be rendered as markup.
          if (
            typeof field.commerce_cart_settings === 'undefined' ||
            field.commerce_cart_settings.attribute_field != 1
          ) { return; }
          
          // Track the field name.
          field_names.push(field_name);

          // What widget module and widget type are being used on this
          // field?
          var module = field.widget.module;
          var type = field.widget.type;

          // Depending on the module, let's handle the widget type.
          //dpm(field_name);
          //dpm(field);
          switch (module) {
            
            // Handle options.
            case 'options':
              switch (type) {
                
                // Handle select options.
                case 'options_select':
                  
                  // Since this is a field, we need to bundle it into the
                  // the language code as an item.
                  form.elements[field_name] = {
                    title: field.label,
                    type: 'select',
                    required: field.required,
                    default_value: 1
                  };
                  form.elements[field_name][product_display.language] = {
                    0: {
                      options: { }
                    }
                  };
                  // Go over each product, extracting the options for
                  // this field.
                  $.each(product_display[product_entities_field_name], function(product_id, product) {
                      var value = parseInt(product[field_name]);
                      // Skip options that are already set.
                      if (typeof form.elements[field_name][product_display.language][0].options[value] !== 'undefined') { return; }
                      form.elements[field_name][product_display.language][0].options[value] = product[field_name + '_taxonomy_term_name'];
                  });
                  
                  break;

                default:
                  console.log('WARNING: commerce_cart_add_to_cart_form - unsupported type (' + type + ')');
                  break;

              }                      
              break;

            default:
              console.log('WARNING: commerce_cart_add_to_cart_form - unsupported module (' + module + ')');
              break;
          }
          
      });
      
    }
    
    // Add to cart submit button.
    form.elements.submit = {
      type: 'submit',
      value: 'Add to cart'
    };
    return form;
  }
  catch (error) { console.log('commerce_cart_add_to_cart_form - ' + error); }
}

/**
 * Define the form's submit function.
 */
function commerce_cart_add_to_cart_form_submit(form, form_state) {
  try {
    dpm(form_state);
    // Assemble the line item from the form state values.
    var line_item = {};
    // Get the user's current cart.
    commerce_cart_index(null, {
        success: function(result) {
          dpm('commerce_cart_index');
          dpm(result);
          if (result.length == 0) {
            // The cart doesn't exist yet, create it, then add the line item to it.
            commerce_cart_create({
                success: function(order) {
                  _commerce_line_item_add_to_order(order, line_item);
                }
            });
          }
          else {
            // The cart already exists, add the line item to it.
            $.each(result, function(order_id, order) {
              _commerce_line_item_add_to_order(order, line_item);
              return false; // Process only one cart.
            });
          }
        }
    });
  }
  catch (error) { console.log('commerce_cart_add_to_cart_form_submit - ' + error); }
}
// Item successfully added to your cart
// SKU
// Size
// Color
// Quantity
// Total
// Go to checkout
// Continue Shopping

/**
 *
 */
function _commerce_line_item_add_to_order(order, line_item) {
  try {
    dpm('_commerce_line_item_add_to_order');
    dpm(order);
    dpm(line_item);
    //commerce_line_item_create();
  }
  catch (error) { console.log('_commerce_line_item_add_to_order - ' + error); }
}


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
        dpm('commerce');
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
      
      // Generate markup that will place an empty div placeholder and pageshow
      // handler that will dynamically inject the cart into the page.
      var markup = 
        '<div id="' + commerce_cart_container_id(entity_type, entity.nid) + '"></div>' +
        drupalgap_jqm_page_event_script_code({
            page_id: drupalgap_get_page_id(),
            jqm_page_event: 'pageshow',
            jqm_page_event_callback:
              '_commerce_cart_field_formatter_view_pageshow',
            jqm_page_event_args: JSON.stringify({
                entity_type: entity_type,
                entity_id: entity.nid
            })
        });
      
      // Place the markup on delta zero of the element.
      element[0] = {
        markup: markup
      };
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
          // Inject the add to cart form html into the container.
          var form_html = drupalgap_get_form('commerce_cart_add_to_cart_form', product_display);
          $('#' + commerce_cart_container_id(entity_type, entity_id)).html(form_html).trigger('create');
        }
    });
  }
  catch (error) {
    console.log('_commerce_cart_field_formatter_view_pageshow - ' + error);
  }
}

/**
 * Given an entity type and entity id, this will return the html attribute id to
 * use on the empty div container.
 */
function commerce_cart_container_id(entity_type, entity_id) {
  try {
    return 'commerce_cart_container_' + entity_type + '_' + entity_id;
  }
  catch (error) { console.log('commerce_cart_container_id - ' + error); }
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
    Drupal.services.call(options);
  }
  catch (error) { console.log('commerce_line_item_create - ' + error); }
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

