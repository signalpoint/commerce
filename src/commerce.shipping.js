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
    var path = 'checkout/review/' + form_state.values['order_id'];
    drupalgap_goto(path);
  }
  catch (error) { console.log('commerce_checkout_shipping_view_submit - ' + error); }
}
