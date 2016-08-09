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
