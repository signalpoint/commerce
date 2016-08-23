function _commerce_addressfield_inject_onto_pane(order) {
  try {
    console.log(drupalgap_router_path_get(), order);
    switch (drupalgap_router_path_get()) {
      case 'checkout/%':
        // If there is billing information on the order, inject it into the address field.
        if (order.commerce_customer_billing) {
          _commerce_addressfield_inject_components(order, 'commerce_customer_billing');
        }
        break;
      case 'checkout/shipping/%':
        // If there is billing information on the order, inject it into the address field.
        if (order.commerce_customer_shipping) {
          _commerce_addressfield_inject_components(order, 'commerce_customer_shipping');
        }
        break;
    }
  }
  catch (error) { console.log('_commerce_addressfield_inject_onto_pane', error); }
}

/**
 * Given an order object and an address field machine name, this will inject the address
 * components into the address widget on the current checkout pane.
 * @param {Object} order
 * @param {String} field_name
 * @private
 */
function _commerce_addressfield_inject_components(order, field_name) {
  var field_name_wrap = field_name + '_entities';
  var address = order[field_name_wrap][order[field_name]]['commerce_customer_address'];
  var form_id = drupalgap_router_path_get() == 'checkout/%' ? 'commerce_checkout_view' : 'commerce_checkout_shipping_view';
  var addressfield_name = form_id == 'commerce_checkout_view' ? 'billing_information' : 'shipping_information';
  var prefix = drupalgap_form_get_element_id(addressfield_name, form_id);
  // @TODO use the new addressfield_inject_components() helper here instead!
  $.each(address, function(component, value) {
    var id = prefix + '-' + component;
    var input = $('#' + id);
    if (input.get(0)) {
      // If the address' country differs from the widgets country, force change the
      // country, which then in turn re triggers this via a services post process.
      if (component == 'country' && value != 'US' && value != $(input).val()) {
        $(input).val(value).selectmenu('refresh', true).change();
        return false;
      }
      if ($(input).attr('type') == 'text') {
        $(input).val(value);
      }
      else if ($(input).get(0).tagName == 'SELECT') {
        $(input).val(value).selectmenu('refresh', true);
      }
    }
  });
}


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
    content = '<div id="' + cart_container_id + '" class="commerce_cart"></div>' +
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
            var html = theme('commerce_cart_block', {order: order});
            $('#' + options.cart_container_id).html(html).trigger('create');
            return false; // Process only one cart.
          });
        }
      }
    });
  }
  catch (error) {
    console.log('_commerce_block_view - ' + error);
  }
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
 *
 */
function commerce_cart_view() {
  try {
    return '<div id="commerce_cart"></div>';
  }
  catch (error) { console.log('commerce_cart_view - ' + error); }
}

/**
 *
 */
function commerce_cart_view_pageshow() {
  try {
    commerce_cart_index(null, {
      success: function(result) {
        if (result.length != 0) {
          $.each(result, function(order_id, order) {
            // Set aside the order so it can be used later without fetching
            // it again.
            _commerce_order[order_id] = order;
            // Theme the cart and render it on the page.
            var html = theme('commerce_cart', { order: order });
            $('#commerce_cart').html(html).trigger('create');
            return false; // Process only one cart.
          });
        }
      }
    });
  }
  catch (error) { console.log('commerce_cart_view_pageshow - ' + error); }
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
 *
 */
function commerce_checkout_complete_view(order_id) {
  try {
    return '<div id="commerce_checkout_complete_' + order_id + '"></div>';
  }
  catch (error) {
    console.log('commerce_checkout_complete_view - ' + error);
  }
}


/**
 *
 */
function commerce_checkout_complete_view_pageshow(order_id) {
  try {
    commerce_checkout_complete({
      data: {
        order_id: order_id,
      },
      success: function(result) {
        var checkout_complete_html = '<div>Checkout Complete</div>';
        $('#commerce_checkout_complete_' + order_id).html(checkout_complete_html).trigger('create');
      },
      error: function(xhr, status, message) {
        try {
          if (options.error) {
            options.error(xhr, status, message);
          }
        }
        catch (error) {
          console.log('commerce_checkout_complete - error - ' + error);
        }
      }
    });

  }
  catch (error) {
    console.log('commerce_checkout_complete_view_pageshow - ' + error);
  }
}

/**
 * The checkout page.
 */
function commerce_checkout_view(form, form_state, order_id) {
  try {
    // @NOTE - when testing, if you sent the app's front page to the checkout
    // page, the drupalgap.commerce object may not be available yet. It's better
    // to set the front page to the cart page instead.

    // @TODO - Need dynamic checkout pane retrieval here.
    // @TODO - utilize the new addressfield form element available in addressfield.js

    // Order ID
    form.elements['order_id'] = {
      type: 'hidden',
      default_value: order_id
    };

    form.elements['billing_information'] = {
      type: 'addressfield_form_element',
      title: t('Billing information'),
      default_country: 'US',
      required: true,
      value_callback: 'addressfield_field_value_callback'
    };

    // Buttons
    form.elements['submit'] = {
      type: 'submit',
      value: 'Continue to next step'
    };
    form.buttons['cancel'] = drupalgap_form_cancel_button();

    return form;
  }
  catch (error) { console.log('commerce_checkout_view - ' + error); }
}

/**
 * The checkout page pageshow handler.
 */
function commerce_checkout_view_pageshow(form_id, order_id) {
  try {
    // Load the order, so we can inject potential addressfield info
    // into the pane via a services post process hook
    commerce_order_load(order_id, {
      success: function(order) {

      }
    });
    //commerce_checkout_customer_profile_copy_toggle();
  }
  catch (error) { console.log('commerce_checkout_view_pageshow - ' + error); }
}

/**
 *
 */
function commerce_checkout_view_validate(form, form_state) {
  try {
    // If the shipping info checkbox is checked, fill in the shipping fields
    // with the billing fields.
    if (form_state.values['customer_profile_copy']) {
      var names = commerce_checkout_shipping_element_names();
      $.each(names, function(index, name) {
        var _name = name.replace('shipping', 'billing');
        form_state.values[name] = form_state.values[_name];
      });
    }
  }
  catch (error) { console.log('commerce_checkout_view_validate - ' + error); }
}

/**
 *
 */
function commerce_checkout_view_submit(form, form_state) {
  try {
    //console.log(form_state.values);

    variable_set('commerce_checkout_form_state', form_state);
    var order_id = form_state.values.order_id;

    // Load the order...
    commerce_order_load(order_id, {
      success: function(order) {
        //console.log(order);

        // When continuing, send them along to review their order unless shipping is enabled,
        // then send them off to shipping first.
        var done = function() {
          drupalgap_goto(
              drupalgap.commerce.commerce_shipping ?
              'checkout/shipping/' + order_id : 'checkout/review/' + order_id
          );
        };

        // If there is no billing customer profile on the order, create the customer
        // profile and attach it to the order,
        if (!order.commerce_customer_billing) {
          commerce_customer_profile_create({
            type: 'billing',
            commerce_customer_address: form_state.values.billing_information
          }, {
            success: function(customer_profile) {
              order.commerce_customer_billing = customer_profile.profile_id;
              commerce_order_update(order, { success: done });
            }
          });
        }
        else {
          // They already have a billing customer profile on the order, update the customer profile
          // then continue.
          var profile_id = order.commerce_customer_billing;
          var customer_profile = order.commerce_customer_billing_entities[profile_id];
          customer_profile.commerce_customer_address = form_state.values.billing_information;
          commerce_customer_profile_update(customer_profile, { success: done });
        }

      }
    });
  }
  catch (error) { console.log('commerce_checkout_view_submit - ' + error); }
}

function commerce_checkout_review_order_container_id(order_id) {
  return 'commerce-checkout-review-order-' + order_id;
}

function commerce_checkout_review_order_page(order_id) {
  return '<div id="' + commerce_checkout_review_order_container_id(order_id) + '"></div>';
}

function commerce_checkout_review_order_pageshow(order_id) {
  commerce_order_load(order_id, {
    success: function(order) {
      var content = {};

      // Render line items.
      var items = [];
      $.each(order.commerce_line_items_entities, function(line_item_id, line_item) {
        var item = theme('commerce_cart_line_item_review', {
          line_item: line_item,
          order: order
        });
        items.push(item);
      });
      content['line-items'] = {
        theme: 'jqm_item_list',
        items: items
      };

      // Render the order total..
      content['order-total'] = {
        theme: 'commerce_cart_total',
        order: order
      };

      // Render the review order form.
      content['form'] = {
        markup: drupalgap_get_form('commerce_checkout_review_order_view', order)
      };

      // Inject the html into the container
      var id = commerce_checkout_review_order_container_id(order_id);
      $('#' + id).html(drupalgap_render(content)).trigger('create');
    }
  });
}

/**
 *
 */
function commerce_checkout_review_order_view(form, form_state, order) {
  try {
    //console.log(order);

    // Grab the checkout form state.
    //var checkout_info = JSON.parse(variable_get('commerce_checkout_form_state', {}));

    // Order ID
    var order_id = order.order_id;
    form.elements['order_id'] = {
      type: 'hidden',
      default_value: order_id
    };
    // Account Information
    var markup = '<p><strong>Username</strong>: ' + Drupal.user.name + '</p>';
    markup += '<p><strong>E-mail address</strong>: ' + Drupal.user.mail + '</p>';
    form.elements['account_information'] = {
      title: t('Account information'),
      markup: markup
    };

    // Billing Information
    var profile_id = order.commerce_customer_billing;
    var customer_profile = order.commerce_customer_billing_entities[profile_id];
    form.elements['billing_information'] = {
      title: t('Billing information'),
      markup: theme('addressfield', customer_profile.commerce_customer_address)
    };

    // Shipping Information
    if (drupalgap.commerce.commerce_shipping) {
      profile_id = order.commerce_customer_shipping;
      customer_profile = order.commerce_customer_shipping_entities[profile_id];
      form.elements['shipping_information'] = {
        title: t('Shipping information'),
        markup: theme('addressfield', customer_profile.commerce_customer_address)
      };
    }

    // Buttons
    form.elements['submit'] = {
      type: 'submit',
      value: t('Continue to next step')
    };
    form.buttons['cancel'] = drupalgap_form_cancel_button();
    form.buttons['cancel'].title = t('Go back');

    return form;

  }
  catch (error) { console.log('commerce_checkout_review_order_view - ' + error); }
}

/**
 *
 */
function commerce_checkout_review_order_view_submit(form, form_state) {
  try {
    drupalgap_goto('checkout/payment/' + form_state.values['order_id']);
  }
  catch (error) { console.log('commerce_checkout_review_order_view_submit - ' + error); }
}

/**
 *
 */
function commerce_checkout_element_names() {
    return [
      'name_line',
      'country',
      'thoroughfare',
      'premise',
      'locality',
      'administrative_area',
      'postal_code'
    ];
}

/**
 *
 */
function commerce_checkout_billing_element_names() {
  try {
    var names = commerce_checkout_element_names();
    var shipping_names = [];
    $.each(names, function(index, name) {
      shipping_names.push('billing_' + name)
    });
    return shipping_names;
  }
  catch (error) { console.log('commerce_checkout_billing_element_names - ' + error); }
}

/**
 *
 */
function commerce_checkout_shipping_element_names() {
  try {
    var names = commerce_checkout_element_names();
    var shipping_names = [];
    $.each(names, function(index, name) {
      shipping_names.push('shipping_' + name)
    });
    return shipping_names;
  }
  catch (error) { console.log('commerce_checkout_shipping_element_names - ' + error); }
}

/**
 *
 */
function _commerce_checkout_customer_profile_copy_onclick() {
  try {
    commerce_checkout_customer_profile_copy_toggle();
  }
  catch (error) { console.log('_commerce_checkout_customer_profile_copy_onclick - ' + error); }
}

/**
 * Completes the checkout process.
 * @param {Object} options
 */
function commerce_checkout_complete(options) {
  try {
    options.method = 'POST';
    options.contentType = 'application/x-www-form-urlencoded';
    options.path = 'checkout_complete.json';
    if (typeof options.flatten_fields !== 'undefined' && options.flatten_fields === false) {
      options.path += '&flatten_fields=false';
    }
    options.service = 'checkout_complete';
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
  catch (error) {
    console.log('commerce_checkout_complete - ' + error);
  }
}

function commerce_customer_profile_primary_key() {
  return 'profile_id';
}

/**
 * Saves a line item.
 * @param {Object} line_item
 * @param {Object} options
 */
function commerce_line_item_save(line_item, options) {
  try {
    commerce_line_item_update(line_item, options);
  }
  catch (error) { console.log('commerce_line_item_save - ' + error); }
}

/**
 * Loads a product display.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_display_load(ids, options) {
  try {
    commerce_product_display_retrieve(ids, options);
  }
  catch (error) { console.log('commerce_product_display_load - ' + error); }
}

/**
 * Loads a commerce order.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_order_load(ids, options) {
  try {
    commerce_order_retrieve(ids, options);
  }
  catch (error) { console.log('commerce_order_load - ' + error); }
}

/**
 * Saves a commerce order.
 * @param {Object} order
 * @param {Object} options
 */
function commerce_order_save(order, options) {
  try {
    commerce_order_update(order, options);
  }
  catch (error) { console.log('commerce_order_save - ' + error); }
}

/**
 * Loads a commerce product.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_load(ids, options) {
  try {
    commerce_product_retrieve(ids, options);
  }
  catch (error) { console.log('commerce_product_load - ' + error); }
}

/**
 *
 */
function commerce_cart_add_to_cart_form(form, form_state, product_display) {
  try {
    //console.log('commerce_cart_add_to_cart_form');
    //console.log(product_display);

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

    var product_entities_field_name = commerce_get_content_type_product_reference_entities_field_name(product_display.type);

    // If there are any product entities...
    if (product_display[product_entities_field_name]) {

      //console.log('commerce_product field_info_instances');
      //console.log(drupalgap.field_info_instances);

      // Locate the first product referenced product's type and use it for the field_info_instances.
      var product_type = null;
      $.each(product_display[product_entities_field_name], function(pid, product) {
        product_type = product.type;
        return false;
      });

      var field_info_instances = drupalgap_field_info_instances('commerce_product', product_type);
      if (!field_info_instances) {
        // Failed to load the instances, throw some informative warnings.
        console.log('WARNING: commerce_cart_add_to_cart_form() - no field instances were located for ' + product_type + '');
        return;
      }

      // For each field instance on this product, if it has cart
      // settings, and is an attributed field, iterate over each product
      // and extract the form element items required to build the
      // widget.
      $.each(field_info_instances, function(field_name, field) {

        // Skip fields that aren't part of the cart (e.g. price, images).
        // @TODO - These fields need be rendered as markup.
        if (
            typeof field.commerce_cart_settings === 'undefined' ||
            typeof field.commerce_cart_settings.attribute_field === 'undefined'
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
                // extracting the options for this field, skipping any that are
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
                  // Depending on the field type, the value can be bundled
                  // differently. For example, Commerce Kickstart uses
                  // taxonomy term reference fields, which have a tid as the
                  // value, whereas a List (text) field can have multiple
                  // types of values, string, number, etc. So if an int
                  // isn't extracted, just use the straight value.
                  var value = product[field_name];
                  var label = product[field_name];
                  if (typeof product[field_name + '_taxonomy_term_name'] !== 'undefined') {
                    value = parseInt(product[field_name])
                    label = product[field_name + '_taxonomy_term_name'];
                  }
                  if (typeof field_items[0].options[value] !== 'undefined') { return; }
                  field_items[0].options[value] = label;
                  console.log(JSON.stringify(field_items[0].options));
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
    // Get the user's current cart.
    commerce_cart_index(null, {
      success: function(result) {
        //dpm('commerce_cart_index');
        //dpm(result);
        if (result.length == 0) {
          // The cart doesn't exist yet, create it, then add the line item to it.
          commerce_cart_create({
            success: function(order) {
              _commerce_line_item_add_to_order({
                order: order,
                success: _commerce_cart_add_to_cart_form_submit_success
              });
            }
          });
        }
        else {
          // The cart already exists, add the line item to it.
          $.each(result, function(order_id, order) {
            _commerce_line_item_add_to_order({
              order: order,
              success: _commerce_cart_add_to_cart_form_submit_success
            });
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
function _commerce_cart_add_to_cart_form_submit_success(result) {
  try {
    drupalgap_goto('cart', { reloadPage: true });
  }
  catch (error) { console.log('_commerce_cart_add_to_cart_form_submit_success - ' + error); }
}

// Holds onto order objects, keyed by order_id.
var _commerce_order = {};

// Holds onto the current product display.
var _commerce_product_display = null;

// Holds onto the current product display's referenced product entity field names.
var _commerce_product_attribute_field_names = null;

// Holds onto the current product display's referenced product id.
var _commerce_product_display_product_id = null;

function commerce_get_content_type_product_reference_field_name(type) {
  return drupalgap.settings.commerce.bundles[type].product_reference_field_name;
}

function commerce_get_content_type_product_reference_entities_field_name(type) {
  return commerce_get_content_type_product_reference_field_name(type) + '_entities';
}

/**
 * The click handler for the "Remove" button on a line item on the cart page.
 */
function _commerce_cart_line_item_remove(order_id, line_item_id) {
  try {
    commerce_line_item_delete(line_item_id, {
      success: function(result) {
        // @TODO - once DG core supports reloading the same page, we can just
        // make a call to drupalgap_goto(). Just re-run the pageshow event
        // handler.
        //drupalgap_goto('cart', { reloadPage: true });
        commerce_cart_view_pageshow();
      }
    });
  }
  catch (error) { console.log('_commerce_cart_line_item_remove - ' + error); }
}

/**
 * Handle clicks on the "Update cart" button.
 */
function commerce_cart_button_update_click(order_id) {
  try {
    // @TODO - this is working, but since it appears we can't use the order
    // update resource to make one single call to update line item quantities,
    // we have manually update each line item, which results in multiple
    // server calls, and multiple cart rebuilds on success.
    var order = _commerce_order[order_id];
    $.each(order.commerce_line_items_entities, function(line_item_id, line_item) {
      var quantity = $('#commerce_cart_line_item_quantity_' + line_item_id).val() + '.00';
      var _quantity = order.commerce_line_items_entities[line_item_id].quantity;
      if (quantity != _quantity) {
        var line_item = {
          line_item_id: parseInt(line_item_id),
          quantity: quantity
        };
        commerce_line_item_save(line_item, {
          quantity: quantity,
          success: function(result) {
            commerce_cart_view_pageshow();
          }
        });
      }
    });
  }
  catch (error) { console.log('commerce_cart_button_update_click - ' + error); }
}

/**
 *
 */
function commerce_checkout_customer_profile_copy_toggle() {
  try {
    var checked = $('#edit-commerce-checkout-view-customer-profile-copy').is(':checked');
    // Hide the shipping input fields.
    var names = commerce_checkout_shipping_element_names();
    $.each(names, function(index, name) {
      var selector = '.' + drupalgap_form_get_element_container_class(name).replace('form-item ', '');
      if (!checked) { $(selector).show(); }
      else { $(selector).hide(); }
    });
  }
  catch (error) { console.log('commerce_checkout_customer_profile_copy_toggle - ' + error); }
}

/**
 * Implements hook_install().
 */
function commerce_install() {
  drupalgap_add_css(drupalgap_get_path('module', 'commerce') + '/commerce.css');

  // Init default settings if there aren't any.
  if (typeof drupalgap.settings.commerce === 'undefined') {
    console.log('WARNING - drupalgap.settings.commerce is undefined, view the README file for commerce.js');
  }
}

/**
 * Implements hook_menu().
 */
function commerce_menu() {
  try {
    var items = {};
    items['cart'] = {
      'title': 'Shopping cart',
      'page_callback': 'commerce_cart_view',
      'pageshow': 'commerce_cart_view_pageshow'
    };
    items['checkout/%'] = {
      'title': 'Checkout',
      'page_callback': 'drupalgap_get_form',
      'page_arguments': ['commerce_checkout_view', 1],
      'pageshow': 'commerce_checkout_view_pageshow'
    };
    items['checkout/shipping/%'] = {
      'title': 'Shipping',
      'page_callback': 'drupalgap_get_form',
      'page_arguments': ['commerce_checkout_shipping_view', 2]
    };
    items['checkout/review/%'] = {
      'title': 'Review order',
      'page_callback': 'commerce_checkout_review_order_page',
      'page_arguments': [2],
      'pageshow': 'commerce_checkout_review_order_pageshow'
    };
    items['checkout/complete/%'] = {
      'title': 'Checkout complete',
      'page_callback': 'commerce_checkout_complete_view',
      'pageshow': 'commerce_checkout_complete_view_pageshow',
      'page_arguments': [2]
    };
    return items;
  }
  catch (error) { console.log('commerce_menu - ' + error); }
}

/**
 * Implements hook_services_success().
 */
function commerce_services_postprocess(options, data) {
  try {
    //console.log(options.service, options.resource);
    // Extract the commerce object from the system connect result data.
    if (options.service == 'system' && options.resource == 'connect') {
      if (data.commerce) { drupalgap.commerce = data.commerce; }
      else {
        console.log('commerce_services_postprocess - failed to extract ' +
            ' commerce object from system connect. Is the commerce_drupalgap ' +
            ' module enabled on your Drupal site?');
      }
    }
    else if (options.service == 'commerce_order' && options.resource == 'retrieve') {
      // Set aside orders when they are loaded.
      _commerce_order[data.order_id] = data;
    }

    // When retrieving address information, inject it into the order's address fields if possible.
    else if (options.service == 'services_addressfield' &&
        options.resource == 'get_address_format_and_administrative_areas') {
      switch (drupalgap_router_path_get()) {
        case 'checkout/%':
          _commerce_addressfield_inject_onto_pane(_commerce_order[arg(1)]);
          break;
        case 'checkout/shipping/%':
          _commerce_addressfield_inject_onto_pane(_commerce_order[arg(2)]);
          break;
      }
    }
  }
  catch (error) { console.log('commerce_services_postprocess - ' + error); }
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
 *
 */
function commerce_line_item_primary_key() {
  return 'line_item_id';
}

/**
 *
 */
function _commerce_line_item_add_to_order(options) {
  try {
    var product_id = _commerce_product_display_get_current_product_id();
    if (!product_id) {
      console.log('WARNING: _commerce_line_item_add_to_order - no product_id');
      return;
    }
    commerce_line_item_create({
      data: {
        order_id: options.order.order_id,
        type: 'product',
        commerce_product: product_id
      },
      success: function(result) {
        //dpm('commerce_line_item_create');
        //dpm(result);
        if (options.success) { options.success(result); }
      }
    });
  }
  catch (error) { console.log('_commerce_line_item_add_to_order - ' + error); }
}

function commerce_order_primary_key() {
  return 'order_id';
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
      var field_name = $(object).attr('field_name');
      var value = $(object).val();
      if (value == 'null') { value =  null; } // Convert null string to null.
      attributes[field_name] = value;
    });
    // Now figure out which product id is currently selected by iterating over
    // the the referenced product entities on the current product display.
    var product_id = null;
    //console.log(_commerce_product_display);
    var product_entities_field_name = commerce_get_content_type_product_reference_entities_field_name(_commerce_product_display.type);
    $.each(_commerce_product_display[product_entities_field_name], function(pid, product) {
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
      case 'commerce_customer_profile':
        if (options.resource == 'retrieve' || options.resource == 'update') {
          options.path = options.path.replace(
              'commerce_customer_profile',
              'customer-profile'
          );
        }
        break;
    }
  }
  catch (error) { console.log('commerce_services_preprocess - ' + error); }
}

/**
 * CART
 */

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
 * LINE ITEM
 */

/**
 * Creates a a line item.
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
 * ORDER
 */

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
    var path = 'commerce_order/' + order.order_id + '.json';

    // Cleanse some properties before the call.
    order.order_id = parseInt(order.order_id);
    order.uid = parseInt(order.uid);
    order.created = parseInt(order.created);
    order.changed = parseInt(order.changed);

    // Make a copy of the order locally, and remove any protected properties.
    var data = $.extend({}, order);
    if (data.revision_id) { delete data.revision_id; }
    if (data.revision_uid) { delete data.revision_uid; }
    if (data.revision_timestamp) { delete data.revision_timestamp; }
    if (data.revision_hostname) { delete data.revision_hostname; }
    if (data.commerce_order_total_formatted) { delete data.commerce_order_total_formatted; }
    if (data.commerce_line_items_entities) { delete data.commerce_line_items_entities; }
    if (data.commerce_customer_billing_entities) { delete data.commerce_customer_billing_entities; }
    if (data.data) { delete data.data; }

    // Make the call.
    Drupal.services.call({
      method: 'PUT',
      path: path,
      service: 'commerce_order',
      resource: 'update',
      entity_type: 'commerce_order',
      entity_id: order.order_id,
      bundle: null,
      data: JSON.stringify(data),
      success: function(result) {
        if (options.success) { options.success(result); }
      },
      error: function(xhr, status, message) {
        if (options.error) { options.error(xhr, status, message); }
      }
    });
  }
  catch (error) { console.log('commerce_order_update - ' + error); }
}

/**
 * PRODUCT DISPLAY
 */

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
 * PRODUCT
 */

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

/**
 * CUSTOMER PROFILE
 */

/**
 * Creates a customer profile.
 * @param {Object} options
 */
function commerce_customer_profile_create(customer_profile, options) {
  try {
    options.method = 'POST';
    options.path = 'customer-profile.json';
    options.service = 'customer-profile';
    options.resource = 'create';
    options.data = JSON.stringify(customer_profile);
    Drupal.services.call(options);
  }
  catch (error) { console.log('commerce_customer_profile_create - ' + error); }
}

/**
 * Update a customer profile.
 * @param {Object} customer_profile
 * @param {Object} options
 */
function commerce_customer_profile_update(customer_profile, options) {
  try {
    // Cleanse some properties before the call.
    customer_profile.profile_id = parseInt(customer_profile.profile_id);
    customer_profile.uid = parseInt(customer_profile.uid);
    customer_profile.created = parseInt(customer_profile.created);
    customer_profile.changed = parseInt(customer_profile.changed);

    // Make a copy of the order locally, and remove any protected properties.
    var data = $.extend({}, customer_profile);
    if (data.revision_id) { delete data.revision_id; }
    if (data.revision_uid) { delete data.revision_uid; }
    if (data.revision_timestamp) { delete data.revision_timestamp; }
    if (data.rdf_mapping) { delete data.rdf_mapping; }
    if (typeof data.data !== 'undefined') { delete data.data; }

    // Set up defaults and make the call.
    services_resource_defaults(options, 'commerce_customer_profile', 'update');
    entity_update('commerce_customer_profile', null, data, options);
  }
  catch (error) { console.log('commerce_customer_profile_update - ' + error); }
}

/**
 * Deletes a customer profile.
 */
function commerce_customer_profile_delete(ids, options) {
  try {
    services_resource_defaults(options, 'commerce_customer_profile', 'delete');
    entity_delete('commerce_customer_profile', ids, options);
  }
  catch (error) { console.log('commerce_customer_profile_delete - ' + error); }
}

/**
 * The shipping page.
 */
function commerce_checkout_shipping_view(form, form_state, order_id) {
  try {
    // @NOTE - when testing, if you sent the app's front page to the shipping
    // page, the drupalgap.commerce object may not be available yet. It's better
    // to set the front page to the cart page instead.

    // Order ID
    form.elements['order_id'] = {
      type: 'hidden',
      default_value: order_id
    };

    //form.elements['customer_profile_copy'] = {
    //  title: 'Shipping info same as Billing info',
    //  type: 'checkbox',
    //  description: '',
    //  default_value: 1,
    //  options: {
    //    attributes: {
    //      onclick: '_commerce_shipping_customer_profile_copy_onclick()'
    //    }
    //  }
    //};

    form.elements['shipping_information'] = {
      type: 'addressfield_form_element',
      title: t('Shipping information'),
      default_country: 'US',
      required: true,
      value_callback: 'addressfield_field_value_callback',
      options: {
        attributes: {
          style: 'display: none;'
        }
      }
    };

    // Buttons
    form.elements['submit'] = {
      type: 'submit',
      value: 'Continue to next step'
    };
    form.buttons['cancel'] = drupalgap_form_cancel_button();

    return form;
  }
  catch (error) { console.log('commerce_shipping_view - ' + error); }
}

/**
 * The checkout page pageshow handler.
 */
function commerce_checkout_shipping_view_pageshow(form_id, order_id) {
  try {
    //commerce_shipping_customer_profile_copy_toggle();
  }
  catch (error) { console.log('commerce_checkout_shipping_view_pageshow - ' + error); }
}

/**
 *
 */
function commerce_checkout_shipping_view_validate(form, form_state) {
  try {
    // If the shipping info checkbox is checked, fill in the shipping fields
    // with the billing fields.
    if (form_state.values['customer_profile_copy']) {
      var names = commerce_shipping_shipping_element_names();
      $.each(names, function(index, name) {
        var _name = name.replace('shipping', 'billing');
        form_state.values[name] = form_state.values[_name];
      });
    }
  }
  catch (error) { console.log('commerce_checkout_shipping_view_validate - ' + error); }
}

/**
 *
 */
function commerce_checkout_shipping_view_submit(form, form_state) {
  try {
    variable_set('commerce_shipping_form_state', form_state);
    var order_id = form_state.values.order_id;

    // Load the order...
    commerce_order_load(order_id, {
      success: function(order) {
        //console.log(order);

        // When continuing, send them along to review their order unless shipping is enabled,
        // then send them off to shipping first.
        var done = function() {
          drupalgap_goto('checkout/review/' + form_state.values['order_id']);
        };

        // If there is no shipping customer profile on the order, create the customer
        // profile and attach it to the order,
        if (!order.commerce_customer_shipping) {
          commerce_customer_profile_create({
            type: 'shipping',
            commerce_customer_address: form_state.values.shipping_information
          }, {
            success: function(customer_profile) {
              order.commerce_customer_shipping = customer_profile.profile_id;
              commerce_order_update(order, { success: done });
            }
          });
        }
        else {
          // They already have a shipping customer profile on the order, update the customer profile
          // then continue.
          var profile_id = order.commerce_customer_shipping;
          var customer_profile = order.commerce_customer_shipping_entities[profile_id];
          customer_profile.commerce_customer_address = form_state.values.shipping_information;
          commerce_customer_profile_update(customer_profile, { success: done });
        }

      }
    });

  }
  catch (error) { console.log('commerce_checkout_shipping_view_submit - ' + error); }
}

/**
 * Theme a commerce cart.
 */
function theme_commerce_cart(variables) {
  try {

    var html = '';

    // Determine how many line items are in the cart.
    var item_count = 0;
    if (variables.order.commerce_line_items) {
      item_count = variables.order.commerce_line_items.length;
    }
    if (item_count == 0) { return 'Your shopping cart is empty.'; }

    // Render each line item.
    var items = [];
    $.each(variables.order.commerce_line_items_entities, function(line_item_id, line_item) {
      var item = theme('commerce_cart_line_item', {
        line_item: line_item,
        order: variables.order
      });
      items.push(item);
    });
    html += theme('jqm_item_list', { items: items });

    // Render the order total and the buttons.
    html += theme('commerce_cart_total', { order: variables.order }) +
        theme('commerce_cart_buttons', { order: variables.order });

    // Return the rendered cart.
    return html;
  }
  catch (error) { console.log('theme_commerce_cart - ' + error); }
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
      var link = l(link_text, 'cart', { reloadPage: true });
      html += theme('jqm_item_list', { items: [link] });
    }
    return html;
  }
  catch (error) { console.log('theme_commerce_cart_block - ' + error); }
}

/**
 * Theme the commerce cart buttons.
 */
function theme_commerce_cart_buttons(variables) {
  try {
    var html =
        theme('button_link', {
          text: 'Update cart',
          path: null,
          options: {
            attributes: {
              'data-icon': 'refresh',
              onclick: 'commerce_cart_button_update_click(' + variables.order.order_id + ')'
            }
          }
        }) +
        theme('button_link', {
          text: 'Checkout',
          path: 'checkout/' + variables.order.order_id,
          options: {
            attributes: {
              'data-icon': 'check',
              'data-theme': 'b'
            }
          }
        });
    return html;
  }
  catch (error) { console.log('theme_commerce_cart_buttons - ' + error); }
}

/**
 * Themes a commerce cart line item.
 */
function theme_commerce_cart_line_item(variables) {
  try {
    var html = '<h2>' + variables.line_item.line_item_label + '</h2>' +
        '<p><strong>Price</strong>: ' + variables.line_item.commerce_unit_price_formatted + '</p>';
    if (variables.line_item.type != 'shipping') {
      html += theme('commerce_cart_line_item_quantity', {
            line_item: variables.line_item,
            order: variables.order
          }) +
          theme('commerce_cart_line_item_remove', {
            line_item: variables.line_item,
            order: variables.order
          });
    }
    html += '<p class="ui-li-aside"><strong>Total</strong>: ' +
        variables.line_item.commerce_total_formatted +
        '</p>';
    return html;
  }
  catch (error) { console.log('theme_commerce_cart_line_item - ' + error); }
}

/**
 * Themes a commerce cart line item.
 */
function theme_commerce_cart_line_item_review(variables) {
  try {
    var quantity = Math.floor(variables.line_item.quantity);
    var label = variables.line_item.line_item_label;
    var html = '<h2>' + quantity + ' x ' + label  + '</h2>' +
        '<p><strong>Price</strong>: ' + variables.line_item.commerce_unit_price_formatted + '</p>';
    html += '<p class="ui-li-aside"><strong>Total</strong>: ' +
        variables.line_item.commerce_total_formatted +
        '</p>';
    return html;
  }
  catch (error) { console.log('theme_commerce_cart_line_item_review - ' + error); }
}

/**
 * Themes a commerce cart line item quantity widget.
 */
function theme_commerce_cart_line_item_quantity(variables) {
  try {
    var id = 'commerce_cart_line_item_quantity_' + variables.line_item.line_item_id;
    var attributes = {
      type: 'number',
      id: id,
      value: Math.floor(variables.line_item.quantity),
      line_item_id: variables.line_item.line_item_id,
      min: '1',
      step: '1'
    };
    var input = '<input ' +  drupalgap_attributes(attributes) + ' />';
    var html = '<label for="' + id + '">Quantity</label>' + input + '';
    return html;
  }
  catch (error) { console.log('theme_commerce_cart_line_item_quantity - ' + error); }
}

/**
 * Themes a commerce cart line item remove button.
 */
function theme_commerce_cart_line_item_remove(variables) {
  try {
    var html = '<p>' +
        l('Remove', null, {
          attributes: {
            onclick: '_commerce_cart_line_item_remove(' + variables.order.order_id + ', ' + variables.line_item.line_item_id + ')'
          }
        }) +
        '</p>';
    return html;
  }
  catch (error) { console.log('theme_commerce_cart_line_item - ' + error); }
}

/**
 * Theme a commerce cart total.
 */
function theme_commerce_cart_total(variables) {
  try {
    return '<h3 class="ui-bar ui-bar-a ui-corner-all">Order Total: ' +
        variables.order.commerce_order_total_formatted +
        '</h3>';
  }
  catch (error) { console.log('theme_commerce_cart_total - ' + error); }
}
