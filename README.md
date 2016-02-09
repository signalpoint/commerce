commerce
========

The Drupal Commerce module for DrupalGap.

# Disclaimer

I understand this module is quite popular, and is no longer working very well. I wrote it in 2014 as a demonstration for DrupalCon Austin, and hoped a client of mine would actually need it so development could continue. To this day, no client of mine has needed it, nor do I need it on any personal projects, so this project is no longer maintained. If someone wants to become a co-maintainer of this, please contact me, otherwise for any improvements to happen on this project people will need to [purchase some development time from me](https://easystreet3.com/purchase-time). Note, I will not provide any free estimates on how long it will take. Good luck, and happy coding! - Tyler Frankenstein

## Known Issue

**IMPORTANT**: To resolve it, you need to *replace* all (2) occurrences of `field_product_entities`
in commerce.js with the machine name of your product reference field. Your
machine name is available in Drupal under `Manage Fields` on your product
content type(s). For example:

```
admin/structure/types/manage/product/fields
```

## Drupal Setup

Step 1. Download and enable the Commerce Services and the Commerce DrupalGap modules on your
Drupal site:

* https://drupal.org/project/commerce_services
* https://drupal.org/project/commerce_drupalgap

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
- Authenticated User
 - View own orders of any type
 - View own Order orders
 - View any product of any type

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

Step 3: Modify `settings.js` to include the commerce module:

```
/* Contrib Modules */
Drupal.modules.contrib['commerce'] = {};
```

Repeat steps #2-3, but for the addressfield module:

* https://github.com/signalpoint/addressfield

## Commerce Cart Block

(Optional) - Place the `commerce_cart` block in a region on your theme in the
settings.js file. Here are some recommended default values:

```
commerce_cart: {
  pages: {
    mode: 'exclude',
    value: ['cart', 'checkout/*', 'checkout/shipping/*']
  }
}
```
