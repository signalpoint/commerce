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
