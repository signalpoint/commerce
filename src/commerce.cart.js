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
