commerce
========

The Drupal Commerce module for DrupalGap.

## Drupal Setup

Step 1. Download and enable the Commerce Services and the Commerce DrupalGap modules on your Drupal site:

- https://drupal.org/project/commerce_services
- https://drupal.org/project/commerce_drupalgap

Step 1a. Patch the `commerce_services` module in Drupal with these patches:

- https://www.drupal.org/node/1979246
- https://www.drupal.org/node/2024813
- https://www.drupal.org/node/2402977
- https://www.drupal.org/node/2475219
- https://www.drupal.org/node/2643530

Here are some terminal commands to quickly accomplish this:

```
cd sites/all/modules/commerce_services
wget https://www.drupal.org/files/issues/customer_profile_crud-2643530-1.patch
git apply -v customer_profile_crud-2643530-1.patch
```

Step 2. After enabling the Commerce DrupalGap module on your site, then flush all of Drupal's caches for good luck.

Step 3. Go to `admin/structure/services/list/drupalgap/resources` and enable the
following resources:

- cart
 - index
 - create
- checkout_complete
 - create
- customer-profile
 - index
 - retrieve
 - udpate
 - delete
- line-item
 - index
 - retrieve
 - udpate
 - delete
- product
 - index
 - retrieve
- product-display
 - index
 - retrieve
- order
 - index
 - retrieve
 - update

Step 4. Go to `admin/people/permissions` and consider enabling these permissions for
the roles mentioned:

- Anonymous User
 - View any product of any type
 - Create orders of any type
 - Edit own orders of any type
- Authenticated User
 - View own orders of any type
 - View own Order orders
 - View any product of any type
 - Create orders of any type
 - Edit own orders of any type

Step 5. Go to e.g. `admin/structure/types/manage/tops/display/drupalgap` and set your
desired fields to be visible when viewing a product in DrupalGap. At minimum,
you'll need to add the `Product variations` field to the display, to allow
the `Add to cart` form to be shown to users. Do this for each type of product
available:

```
admin/structure/types
```

## DrupalGap Setup

Step 0: Enable the Address Field module for DrupalGap:

- https://github.com/signalpoint/addressfield

Step 1: Download the DrupalGap Commerce module:

- https://github.com/signalpoint/commerce

Step 2: Extract the module into the `www/app/modules` folder, so it lives here:

- www/app/modules/commerce

Step 3: Modify `settings.js` to include the commerce module and settings, for example:

```
/* Contrib Modules */
Drupal.modules.contrib['commerce'] = {
  minified: true
};
drupalgap.settings.commerce = {
  bundles: {
    bags_cases: {
      product_reference_field_name: 'field_product'
    },
    drinks: {
      product_reference_field_name: 'field_product'
    },
    hats: {
      product_reference_field_name: 'field_product'
    },
    shoes: {
      product_reference_field_name: 'field_product'
    },
    storage_devices: {
      product_reference_field_name: 'field_product'
    },
    tops: {
      product_reference_field_name: 'field_product'
    }
  }
};
```

Replace the *bundles* property name(s) with the machine name(s) of your product display content type(s).

Replace `field_product` with the machine name of the Product reference field for your product display's content type.

Step 4: Install the Address Field module for DrupalGap:

* https://github.com/signalpoint/addressfield

## Commerce Cart Block

(Optional) - Place the `commerce_cart` block in a region on your theme in the
settings.js file. Here are some recommended default values:

```
commerce_cart: {
  pages: {
    mode: 'exclude',
    value: ['cart', 'checkout/*', 'checkout/shipping/*', 'checkout/review/*', 'checkout/payment/*']
  }
}
```

## Handling Checkout

Right now there is only one payment gateway supported in DrupalGap Commerce, and that is [Stripe](https://stripe.com):

- http://drupalgap.org/project/commerce_drupalgap_stripe

## Order Completion

This module leaves it up to you to theme the order completion screen the way you'd like it. Here's how to do it with a custom DrupalGap module:

```
/**
 * Implements hook_deviceready().
 */
function my_module_deviceready() {

  // Take over the rendering of the checkout complete page.
  drupalgap.menu_links['checkout/complete/%'].pageshow = 'my_module_checkout_complete_pageshow';

}

function my_module_checkout_complete_pageshow(order_id) {
  // Load the order, build our thank you message, then inject it into the page.
  commerce_order_load(order_id, {
    success: function(order) {
      var content = {};
      content['thanks'] = {
        markup: '<div class="messages status">' +
            t('Thank you for your order!') + ' (#' + order_id + ')' +
          '</div>'
      };
      $('#' + commerce_checkout_complete_container_id(order_id)).html(
        drupalgap_render(content)
      ).trigger('create');
    }
  });
}
```

## Troubleshoot

```
POST ?q=drupalgap/cart.json 401 (Unauthorized : Access to this operation not granted)
```
In Drupal, go to `admin/people/permissions` and grant permissions for `Create orders of any type`

```
POST ?q=drupalgap/line-item.json 401 (Unauthorized : Access to this operation not granted)
```
Drupal commerce does not allow anonymous user's to edit their own orders, AFAIK.

The `commerce_entity_access()` function and the boolean that checks for `$account->uid` won't allow anonymous users to edit their own orders even if you grant permission.

Until this "bug" is addressed, all users of your app must be authenticated to be able to add an item to the cart.

```
drupalgap_get_form - failed to get form (commerce_cart_add_to_cart_form)
```
Have you added the `drupalgap.settings.commerce` config to your `settings.js` file for each content type and product reference field? See step 3 above.
