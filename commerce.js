// Holds onto the current product display.
var _commerce_product_display = null;

// Holds onto the current product display's referenced product entity field names.
var _commerce_product_attribute_field_names = null;

// Holds onto the currne tproduct display's referenced product id.
var _commerce_product_display_product_id = null;

/**
 * Implements hook_block_info().
 */
function commerce_block_info() {
  var blocks = {
    commerce_cart: {
      delta: 'commerce_cart',
      module: 'commerce'
    }
  };
  return blocks;
}

/**
 * Implements hook_block_view().
 */
function commerce_block_view(delta) {
  var content = '';
  if (delta == 'commerce_cart') {
    var page_id = drupalgap_get_page_id();
    var cart_container_id = page_id + '_cart';
    content = '<div id="' + cart_container_id + '"></div>' +
      drupalgap_jqm_page_event_script_code({
          page_id: page_id,
          jqm_page_event: 'pageshow',
          jqm_page_event_callback: '_commerce_block_view',
          jqm_page_event_args: JSON.stringify({
              cart_container_id: cart_container_id
          })
      });
  }
  return content;
}

/**
 *
 */
function _commerce_block_view(options) {
  try {
    commerce_cart_index(null, {
        success: function(result) {
          if (result.length != 0) {
            $.each(result, function(order_id, order) {
                var html = theme('commerce_cart_block', { order: order });
                $('#' + options.cart_container_id).html(html).trigger('create');            
                return false; // Process only one cart.
            });
          }
        }
    });
    
  }
  catch (error) { console.log('_commerce_block_view - ' + error); }
}

/**
 *
 */
function commerce_cart_add_to_cart_form(form, form_state, product_display) {
  try {
    //dpm('commerce_cart_add_to_cart_form');
    //dpm(product_display);
    
    // Set the global product display variable so we have access to it later.
    _commerce_product_display = product_display;
    
    // Prep array to hold attribute field names.
    _commerce_product_attribute_field_names = [];
    
    // Clear the referenced product id.
    _commerce_product_display_product_id = null;
    
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
          
          // Save this field name for later.
          _commerce_product_attribute_field_names.push(field_name);

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
                  
                  // Build the field items (only one), then go over each product,
                  // extracting the options for this field, sipping any that are
                  // already set. Then attach an onchange handler and attach the
                  // field items to the element. Save a reference to the first
                  // product id, in case the user adds the default product to
                  // the cart.
                  var field_items = { 0: { options: { attributes: {
                    onchange: '_commerce_cart_attribute_change()',
                    'class': '_commerce_cart_attribute',
                    field_name: field_name
                  } } } };
                  $.each(product_display[product_entities_field_name], function(product_id, product) {
                      if (!_commerce_product_display_product_id) { _commerce_product_display_product_id = product_id; }
                      var value = parseInt(product[field_name]);
                      if (typeof field_items[0].options[value] !== 'undefined') { return; }
                      field_items[0].options[value] = product[field_name + '_taxonomy_term_name'];
                  });
                  form.elements[field_name][product_display.language] = field_items;

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
    //dpm('commerce_cart_add_to_cart_form_submit');
    //dpm(form_state);
    // Get the user's current cart.
    commerce_cart_index(null, {
        success: function(result) {
          dpm('commerce_cart_index');
          dpm(result);
          if (result.length == 0) {
            // The cart doesn't exist yet, create it, then add the line item to it.
            commerce_cart_create({
                success: function(order) {
                  _commerce_line_item_add_to_order(order);
                }
            });
          }
          else {
            // The cart already exists, add the line item to it.
            $.each(result, function(order_id, order) {
              _commerce_line_item_add_to_order(order);
              return false; // Process only one cart.
            });
          }
        }
    });
  }
  catch (error) { console.log('commerce_cart_add_to_cart_form_submit - ' + error); }
}

/**
 *
 */
function _commerce_cart_attribute_change() {
  try {
    _commerce_product_display_product_id = _commerce_product_display_get_current_product_id();
  }
  catch (error) { console.log('_commerce_cart_attribute_change - ' + error); }
}

/**
 * Determines the current product id from the current page's product display
 * selected attributes. Returns the product id.
 */
function _commerce_product_display_get_current_product_id() {
  try {
    // Iterate over each attribute on the page, pull out the field_name and
    // value, and set them aside, so they can later be used to determine which
    // product is currently selected.
    var selector = '#' + drupalgap_get_page_id() + ' select._commerce_cart_attribute';
    var attributes = { };
    $(selector).each(function(index, object) {
        var field_name = $(object).attr('field_name')
        var value = $(object).val();
        attributes[field_name] = value;
    });
    // Now figure out which product id is currently selected by iterating over
    // the the referenced product entities on the current product display.
    var product_id = null;
    $.each(_commerce_product_display['field_product_entities'], function(pid, product) {
        var match = true;
        $.each(_commerce_product_attribute_field_names, function(index, field_name) {
            if (product[field_name] != attributes[field_name]) {
              match = false;
              return false;
            }
        });
        if (match) {
          product_id = pid;
          return false;
        }
    });
    return product_id;
  }
  catch (error) { console.log('_commerce_product_display_get_current_product_id - ' + error); }
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
function _commerce_line_item_add_to_order(order) {
  try {
    var product_id = _commerce_product_display_get_current_product_id();
    if (!product_id) {
      console.log('WARNING: _commerce_line_item_add_to_order - no product_id');
      return;
    }
    commerce_line_item_create({
        data: {
          order_id: order.order_id,
          type: 'product',
          commerce_product: product_id
        },
        success: function(result) {
          dpm('commerce_line_item_create');
          dpm(result);
        }
    });
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
      if (data.commerce) { drupalgap.commerce = data.commerce; }
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

/**
 * Theme a commerce cart block.
 */
function theme_commerce_cart_block(variables) {
  try {
    var html = '';
    var item_count = 0;
    if (variables.order.commerce_line_items) {
      item_count = variables.order.commerce_line_items.length;
    }
    if (item_count > 0) {
      var link_text = variables.order.commerce_order_total_formatted +
        ' (' + item_count + ' ' + drupalgap_format_plural(item_count, 'item', 'items') + ')';
      var link = l(link_text, 'cart');
      html += theme('jqm_item_list', { items: [link] });
    }
    return html;
  }
  catch (error) { console.log('theme_commerce_cart_block - ' + error); }
}

