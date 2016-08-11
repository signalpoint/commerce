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
