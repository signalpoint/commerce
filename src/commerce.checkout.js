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

    // Load the order...
    //commerce_order_load(form_state.values.order_id, {
    //  success: function(order) {
    //    console.log(order);
    //  }
    //});
    //
    //console.log(form, form_state);
    //return;

    // Update the cart's billing information.
    //commerce_order_update(order, options);


    variable_set('commerce_checkout_form_state', form_state);
    var path = 'checkout/review/' + form_state.values['order_id'];
    if (drupalgap.commerce.commerce_shipping) {
      path = 'checkout/shipping/' + form_state.values['order_id'];
    }
    drupalgap_goto(path);
  }
  catch (error) { console.log('commerce_checkout_view_submit - ' + error); }
}

/**
 *
 */
function commerce_checkout_review_order_view(form, form_state, order_id) {
  try {

    // Order ID
    form.elements['order_id'] = {
      type: 'hidden',
      default_value: order_id
    };

    // Grab the checkout form state.
    var checkout_info = JSON.parse(variable_get('commerce_checkout_form_state', {}));

    // Cart Review Placeholder
    form.elements['cart_placeholder'] = {
      title: 'Review Order',
      markup: '<div id="' + commerce_checkout_review_cart_container_id(order_id) + '"></div>'
    };

    // Account Information
    var markup = '<p><strong>Username</strong><br />' + Drupal.user.name + '</p>';
    markup += '<p><strong>E-mail address</strong><br />' + Drupal.user.mail + '</p>';
    form.elements['account_information'] = {
      title: 'Account Information',
      markup: markup
    };

    // Billing Information
    var variables = {};
    var names = commerce_checkout_billing_element_names();
    $.each(names, function(index, name) {
      if (typeof checkout_info.values[name] !== 'undefined') {
        variables[name.replace('billing_', '')] = checkout_info.values[name];
      }
    });
    form.elements['billing_information'] = {
      title: 'Billing Information',
      markup: theme('addressfield', variables)
    };

    // Shipping Information
    var variables = {};
    var names = commerce_checkout_shipping_element_names();
    $.each(names, function(index, name) {
      if (typeof checkout_info.values[name] !== 'undefined') {
        variables[name.replace('shipping_', '')] = checkout_info.values[name];
      }
    });
    form.elements['shipping_information'] = {
      title: 'Shipping Information',
      markup: theme('addressfield', variables)
    };

    // Buttons
    form.elements['submit'] = {
      type: 'submit',
      value: 'Continue to next step'
    };
    form.buttons['cancel'] = drupalgap_form_cancel_button();
    form.buttons['cancel'].title = 'Go back';

    return form;

  }
  catch (error) { console.log('commerce_checkout_review_order_view - ' + error); }
}

/**
 *
 */
function commerce_checkout_review_order_view_pageshow(form_id, order_id) {
  try {
    var container_id = commerce_checkout_review_cart_container_id(order_id);
    commerce_order_load(order_id, {
      success: function(order) {
        try {
          var html = '';
          // Render each line item.
          var items = [];
          $.each(order.commerce_line_items_entities, function(line_item_id, line_item) {
            var item = theme('commerce_cart_line_item_review', {
              line_item: line_item,
              order: order
            });
            items.push(item);
          });
          html += theme('jqm_item_list', { items: items });

          // Render the order total, then inject the html into the container.
          html += theme('commerce_cart_total', { order: order });
          $('#' + container_id).html(html).trigger('create');
        }
        catch (error) { console.log('commerce_checkout_review_order_view_pageshow - success - ' + error); }
      }
    });
  }
  catch (error) { console.log('commerce_checkout_review_order_view_pageshow - ' + error); }
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
function commerce_checkout_review_cart_container_id(order_id) {
  try {
    return 'commerce_checkout_review_cart_container_' + order_id;
  }
  catch (error) { console.log('commerce_checkout_review_cart_container_id - ' + error); }
}

/**
 *
 */
function commerce_checkout_element_names() {
  try {
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
  catch (error) { console.log('commerce_checkout_element_names - ' + error); }
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
