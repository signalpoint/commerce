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
