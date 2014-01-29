commerce
========

The Drupal Commerce module for DrupalGap. At this point the module is in a
sandbox, so play at your own risk. ;)

|==============|
| Drupal Setup |
|==============|

1. Download and enable the Commerce Services module on your Drupal site:

     https://drupal.org/project/commerce_services
     https://drupal.org/sandbox/signalpoint/2031039

2. Go to 'admin/structure/services/list/drupalgap/resources' and enable the
   following resources:
   
    commerce_drupalgap
      *enable all resources for commerce_drupalgap*
    
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
