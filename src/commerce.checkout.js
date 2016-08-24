function commerce_checkout_complete_container_id(order_id) {
  return 'commerce_checkout_complete_' + order_id;
}

/**
 *
 */
function commerce_checkout_complete_view(order_id) {
  return '<div id="' + commerce_checkout_complete_container_id(order_id) + '"></div>';
}

/**
 * The billing page.
 */
function commerce_checkout_view(form, form_state, order_id) {
  try {
    // @NOTE - when testing, if you sent the app's front page to the checkout
    // page, the drupalgap.commerce object may not be available yet. It's better
    // to set the front page to the cart page instead.

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
      value_callback: 'addressfield_field_value_callback',
      components: {
        name_line: true,
        thoroughfare: true,
        premise: true
      }
    };

    // Buttons
    form.elements['submit'] = {
      type: 'submit',
      value: 'Continue to next step'
    };
    form.buttons['cancel'] = drupalgap_form_cancel_button();
    form.buttons['cancel'].title = t('Go back');

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
