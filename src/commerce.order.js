/**
 *
 */
function commerce_order_primary_key() {
  try {
    return 'order_id';
  }
  catch (error) { console.log('commerce_order_primary_key - ' + error); }
}
