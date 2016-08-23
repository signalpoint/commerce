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
