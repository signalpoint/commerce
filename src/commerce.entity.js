/**
 * Saves a line item.
 * @param {Object} line_item
 * @param {Object} options
 */
function commerce_line_item_save(line_item, options) {
  try {
    commerce_line_item_update(line_item, options);
  }
  catch (error) { console.log('commerce_line_item_save - ' + error); }
}

/**
 * Loads a product display.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_display_load(ids, options) {
  try {
    commerce_product_display_retrieve(ids, options);
  }
  catch (error) { console.log('commerce_product_display_load - ' + error); }
}

/**
 * Loads a commerce order.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_order_load(ids, options) {
  try {
    commerce_order_retrieve(ids, options);
  }
  catch (error) { console.log('commerce_order_load - ' + error); }
}

/**
 * Saves a commerce order.
 * @param {Object} order
 * @param {Object} options
 */
function commerce_order_save(order, options) {
  try {
    commerce_order_update(order, options);
  }
  catch (error) { console.log('commerce_order_save - ' + error); }
}

/**
 * Loads a commerce product.
 * @param {Number} ids
 * @param {Object} options
 */
function commerce_product_load(ids, options) {
  try {
    commerce_product_retrieve(ids, options);
  }
  catch (error) { console.log('commerce_product_load - ' + error); }
}
