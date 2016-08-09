commerce
========

The Drupal Commerce module for DrupalGap.

# Disclaimer

I understand this module is quite popular, and is no longer working very well. I wrote it in 2014 as a demonstration for DrupalCon Austin, and hoped a client of mine would actually need it so development could continue. To this day, no client of mine has needed it, nor do I need it on any personal projects, so this project is no longer maintained. If someone wants to become a co-maintainer of this, please contact me, otherwise for any improvements to happen on this project people will need to [purchase some development time from me](https://easystreet3.com/purchase-time). Note, I will not provide any free estimates on how long it will take. Good luck, and happy coding! - Tyler Frankenstein

## Drupal Setup

Step 1. Download and enable the Commerce Services and the Commerce DrupalGap modules on your
Drupal site:

* https://drupal.org/project/commerce_services
* https://drupal.org/project/commerce_drupalgap

Step 1a. Patch the commerce_services module in Drupal with these patches:

- https://www.drupal.org/node/1979246
- https://www.drupal.org/node/2024813
- https://www.drupal.org/node/2402977
- https://www.drupal.org/node/2475219

Step 2. After enabling the Commerce DrupalGap module on your site, open up your Drupal
Database (e.g. MySQL PHPMyAdmin) and verify the module weight for
`commerce_drupalgap` is `1001`. Do this by executing the following query, and
looking at the weight value:

```
SELECT name, weight FROM system WHERE name = 'commerce_drupalgap';
```
  
If it isn't set to 1001, execute this query:

```  
UPDATE system SET weight = 1001 WHERE name = 'commerce_drupalgap';
```

Then flush all of Drupal's caches.

Step 3. Go to `admin/structure/services/list/drupalgap/resources` and enable the
following resources:

- product-display
 - index
 - retrieve
- product
 - index
 - retrieve
- cart
 - index
 - create
- order
 - index
 - retrieve
 - update
- line-item
 - index
 - retrieve
 - udpate
 - delete
- checkout_complete
 - create

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

Step 1: Download the DrupalGap Commerce module:

* https://github.com/signalpoint/commerce

Step 2: Extract the module into the `www/app/modules` folder, so it lives here:

* www/app/modules/commerce

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
