/**
 * Implements hook_install().
 */
function commerce_install() {
  drupalgap_add_css(drupalgap_get_path('module', 'commerce') + '/commerce.css');

  // Init default settings if there aren't any.
  if (typeof drupalgap.settings.commerce === 'undefined') {
    console.log('WARNING - drupalgap.settings.commerce is undefined, view the README file for commerce.js');
  }
}

/**
 * Implements hook_menu().
 */
function commerce_menu() {
  try {
    var items = {};
    items['cart'] = {
      'title': 'Shopping cart',
      'page_callback': 'commerce_cart_view',
      'pageshow': 'commerce_cart_view_pageshow'
    };
    items['checkout/%'] = {
      'title': 'Checkout',
      'page_callback': 'drupalgap_get_form',
      'page_arguments': ['commerce_checkout_view', 1],
      'pageshow': 'commerce_checkout_view_pageshow'
    };
    items['checkout/shipping/%'] = {
      'title': 'Shipping',
      'page_callback': 'drupalgap_get_form',
      'page_arguments': ['commerce_checkout_shipping_view', 2]
    };
    items['checkout/review/%'] = {
      'title': 'Review order',
      'page_callback': 'commerce_checkout_review_order_page',
      'page_arguments': [2],
      'pageshow': 'commerce_checkout_review_order_pageshow'
    };
    items['checkout/complete/%'] = {
      'title': 'Checkout complete',
      'page_callback': 'commerce_checkout_complete_view',
      'page_arguments': [2]
    };
    return items;
  }
  catch (error) { console.log('commerce_menu - ' + error); }
}



/**
 * Implements hook_services_success().
 */
function commerce_services_postprocess(options, data) {
  try {
    //console.log(options.service, options.resource);
    // Extract the commerce object from the system connect result data.
    if (options.service == 'system' && options.resource == 'connect') {
      if (data.commerce) { drupalgap.commerce = data.commerce; }
      else {
        console.log('commerce_services_postprocess - failed to extract ' +
            ' commerce object from system connect. Is the commerce_drupalgap ' +
            ' module enabled on your Drupal site?');
      }
    }
    else if (options.service == 'commerce_order' && options.resource == 'retrieve') {
      // Set aside orders when they are loaded.
      _commerce_order[data.order_id] = data;
    }

    // When retrieving address information, inject it into the order's address fields if possible.
    else if (options.service == 'services_addressfield' &&
        options.resource == 'get_address_format_and_administrative_areas') {
      switch (drupalgap_router_path_get()) {
        case 'checkout/%':
          _commerce_addressfield_inject_onto_pane(_commerce_order[arg(1)]);
          break;
        case 'checkout/shipping/%':
          _commerce_addressfield_inject_onto_pane(_commerce_order[arg(2)]);
          break;
      }
    }
  }
  catch (error) { console.log('commerce_services_postprocess - ' + error); }
}

/**
 * Implements hook_field_formatter_view().
 */
function commerce_price_field_formatter_view(entity_type, entity, field,
                                             instance, langcode, items, display
) {
  try {
    var element = {};
    if (!empty(items)) {
      // The items sent in are not like typical a typical item/delta collection.
      // It just contains the amount and currency code, so we'll just use a
      // delta of zero.
      var markup = '';
      switch (items.currency_code) {
        case 'USD':
          markup += '$';
          break;
        default:
          markup += items.currency_code + ' ';
          break;
      }
      markup += (items.amount/100).toFixed(2);
      element[0] = {
        markup: markup
      };
    }
    return element;
  }
  catch (error) {
    console.log('commerce_price_field_formatter_view - ' + error);
  }
}
