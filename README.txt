commerce
========

The Drupal Commerce module for DrupalGap. At this point the module is in a
sandbox, so play at your own risk. ;)

|==============|
| Drupal Setup |
|==============|

1. Download and enable the Commerce Services and the Commerce DrupalGap modules
   on your Drupal site:

     https://drupal.org/project/commerce_services
     https://drupal.org/sandbox/signalpoint/2031039

2. Go to admin/structure/services/list/drupalgap/resources and enable the
   following resources:
    
    product-display
       index
       retrieve
     product
       index
       retrieve
     cart
       index
       create
     order
       index
       retrieve
       update
     line-item
       index
       retrieve
       udpate
       delete

3. Go to admin/people/permissions and consider enabling these permissions for
   the roles mentioned:
   
     Anonymous User
       View any product of any type
     
     Authenticated User
      View own orders of any type
      View own Order orders
      View any product of any type

|=================|
| DrupalGap Setup |
|=================|

1. Download the DrupalGap Commerce module:

https://github.com/signalpoint/commerce

2. Extract the module into the www/app/modules folder, so it lives here:

www/app/modules/commerce

3. Modify settings.js to include the commerce module:

/* Contrib Modules */
Drupal.modules.contrib['commerce'] = {};

