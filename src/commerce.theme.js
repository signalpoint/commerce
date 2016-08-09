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
