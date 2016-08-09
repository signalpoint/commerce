/**
 *
 */
function commerce_cart_add_to_cart_form(form, form_state, product_display) {
  try {
    //console.log('commerce_cart_add_to_cart_form');
    //console.log(product_display);

    // Set the global product display variable so we have access to it later.
    _commerce_product_display = product_display;

    // Prep array to hold attribute field names.
    _commerce_product_attribute_field_names = [];

    // Clear the referenced product id.
    _commerce_product_display_product_id = null;

    // Set the form entity type and bundle.
    form.entity_type = 'commerce_product';
    form.bundle = product_display.type;

    // Determine the internal commerce field name for the product
    // display's entity reference(s). Note, this is not the same field
    // name used by the Product reference field on the node content
    // type.

    var product_entities_field_name = commerce_get_content_type_product_reference_entities_field_name(product_display.type);

    // If there are any product entities...
    if (product_display[product_entities_field_name]) {

      //console.log('commerce_product field_info_instances');
      //console.log(drupalgap.field_info_instances);

      // Locate the first product referenced product's type and use it for the field_info_instances.
      var product_type = null;
      $.each(product_display[product_entities_field_name], function(pid, product) {
        product_type = product.type;
        return false;
      });

      var field_info_instances = drupalgap_field_info_instances('commerce_product', product_type);
      if (!field_info_instances) {
        // Failed to load the instances, throw some informative warnings.
        console.log('WARNING: commerce_cart_add_to_cart_form() - no field instances were located for ' + product_type + '');
        return;
      }

      // For each field instance on this product, if it has cart
      // settings, and is an attributed field, iterate over each product
      // and extract the form element items required to build the
      // widget.
      $.each(field_info_instances, function(field_name, field) {

        // Skip fields that aren't part of the cart (e.g. price, images).
        // @TODO - These fields need be rendered as markup.
        if (
            typeof field.commerce_cart_settings === 'undefined' ||
            typeof field.commerce_cart_settings.attribute_field === 'undefined'
        ) { return; }

        // Save this field name for later.
        _commerce_product_attribute_field_names.push(field_name);

        // What widget module and widget type are being used on this
        // field?
        var module = field.widget.module;
        var type = field.widget.type;

        // Depending on the module, let's handle the widget type.
        //dpm(field_name);
        //dpm(field);
        switch (module) {

          // Handle options.
          case 'options':
            switch (type) {

              // Handle select options.
              case 'options_select':

                // Since this is a field, we need to bundle it into the
                // the language code as an item.
                form.elements[field_name] = {
                  title: field.label,
                  type: 'select',
                  required: field.required,
                  default_value: 1
                };

                // Build the field items (only one), then go over each product,
                // extracting the options for this field, skipping any that are
                // already set. Then attach an onchange handler and attach the
                // field items to the element. Save a reference to the first
                // product id, in case the user adds the default product to
                // the cart.
                var field_items = { 0: { options: { attributes: {
                  onchange: '_commerce_cart_attribute_change()',
                  'class': '_commerce_cart_attribute',
                  field_name: field_name
                } } } };
                $.each(product_display[product_entities_field_name], function(product_id, product) {
                  if (!_commerce_product_display_product_id) { _commerce_product_display_product_id = product_id; }
                  // Depending on the field type, the value can be bundled
                  // differently. For example, Commerce Kickstart uses
                  // taxonomy term reference fields, which have a tid as the
                  // value, whereas a List (text) field can have multiple
                  // types of values, string, number, etc. So if an int
                  // isn't extracted, just use the straight value.
                  var value = product[field_name];
                  var label = product[field_name];
                  if (typeof product[field_name + '_taxonomy_term_name'] !== 'undefined') {
                    value = parseInt(product[field_name])
                    label = product[field_name + '_taxonomy_term_name'];
                  }
                  if (typeof field_items[0].options[value] !== 'undefined') { return; }
                  field_items[0].options[value] = label;
                  console.log(JSON.stringify(field_items[0].options));
                });
                form.elements[field_name][product_display.language] = field_items;

                break;

              default:
                console.log('WARNING: commerce_cart_add_to_cart_form - unsupported type (' + type + ')');
                break;

            }
            break;

          default:
            console.log('WARNING: commerce_cart_add_to_cart_form - unsupported module (' + module + ')');
            break;
        }

      });

    }

    // Add to cart submit button.
    form.elements.submit = {
      type: 'submit',
      value: 'Add to cart'
    };
    return form;
  }
  catch (error) { console.log('commerce_cart_add_to_cart_form - ' + error); }
}

/**
 * Define the form's submit function.
 */
function commerce_cart_add_to_cart_form_submit(form, form_state) {
  try {
    // Get the user's current cart.
    commerce_cart_index(null, {
      success: function(result) {
        //dpm('commerce_cart_index');
        //dpm(result);
        if (result.length == 0) {
          // The cart doesn't exist yet, create it, then add the line item to it.
          commerce_cart_create({
            success: function(order) {
              _commerce_line_item_add_to_order({
                order: order,
                success: _commerce_cart_add_to_cart_form_submit_success
              });
            }
          });
        }
        else {
          // The cart already exists, add the line item to it.
          $.each(result, function(order_id, order) {
            _commerce_line_item_add_to_order({
              order: order,
              success: _commerce_cart_add_to_cart_form_submit_success
            });
            return false; // Process only one cart.
          });
        }
      }
    });
  }
  catch (error) { console.log('commerce_cart_add_to_cart_form_submit - ' + error); }
}

/**
 *
 */
function _commerce_cart_add_to_cart_form_submit_success(result) {
  try {
    drupalgap_goto('cart', { reloadPage: true });
  }
  catch (error) { console.log('_commerce_cart_add_to_cart_form_submit_success - ' + error); }
}
