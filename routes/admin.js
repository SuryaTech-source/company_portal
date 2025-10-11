//"use strict";

var jwt = require('jsonwebtoken');
var middlewares = require('../model/middlewares.js');
var CONFIG = require('../config/config');
const walkthroughImages = require('../controller/admin/walkthrough-images.js');
const { uploadExcelAndProcess } = require('../model/excelMulter.js');

function ensureAuthorized(req, res, next) {
    /* var token = req.headers.authorization;
     if (token) {
         jwt.verify(token, CONFIG.SECRET_KEY, function (err, decoded) {
             if (err) {
                 res.send('Unauthorized Access');
             } else {
                 next();
             }
         });
     } else {
         res.send('Unauthorized Access');
     }*/
    next();
}

module.exports = function (app, io) {
    try {
        var dashboard = require('../controller/admin/dashboard.js')(io);
        var admins = require('../controller/admin/admins.js')(io);
        var billing_cycle = require('../controller/admin/billing_cycle.js')(io);
        var users = require('../controller/admin/users.js')(io);
        var slider = require('../controller/admin/sliders.controller.js')(app);
        var pages = require('../controller/admin/pages.js')(app);
        var postheader = require('../controller/admin/postheader.js')(app);
        var experience = require('../controller/admin/experience.js')(app);
        var question = require('../controller/admin/question.controller.js')(app);
        var settings = require('../controller/admin/settings.js')(io);
        var newsletter = require('../controller/admin/newsletter.js')(app, io);
        var payment = require('../controller/admin/payment-gateway.js')(app, io);
        var images = require('../controller/admin/images.js')(app);
        var contact = require('../controller/admin/contact.js')(app);
        var reviews = require('../controller/admin/reviews.js')(app);
        var tools = require('../controller/admin/tools.js')(app);
        var drivers = require('../controller/admin/drivers')(app, io);
        var category = require('../controller/admin/category')(app);
        const walkthroughImage = require('../controller/admin/walkthrough-images.js')(app);
        var attributes = require('../controller/admin/attributes')(app);
        var timeslots = require('../controller/admin/timeslots')(app);
        var restaurant = require('../controller/admin/restaurant')(app, io);
        var food = require('../controller/admin/food')(app);
        var orders = require('../controller/admin/orders')(app, io);
        var cancellation = require('../controller/admin/cancellation')(app);
        var coupon = require('../controller/admin/coupon')(app);
        var refer_coupon = require('../controller/admin/refer_coupon')(app);
        var emailTemplate = require('../controller/admin/email-template.js')(app);
        var ratings = require('../controller/admin/ratings.js')(app);
        var rcategory = require('../controller/admin/rcategory.js')(app);
        var scategory = require('../controller/admin/scategory.js')(app);
        var brands = require('../controller/admin/brands.js')(app);
        var rewards = require('../controller/admin/rewards.js')(app);
        var banners = require('../controller/admin/banners.js')(app);
        var tags = require('../controller/admin/tags.js')(app);
        var deals = require('../controller/admin/deals.js')(app);
        var report = require('../controller/admin/report.js')(app);
       var fleet = require('../controller/admin/fleet.js')(app);
         var contract = require('../controller/admin/contract.js')(app);
         var employee = require('../controller/admin/employee.js')(app);
        var vendor = require('../controller/admin/vendor.js')(app);
         var fuel = require('../controller/admin/fuel.js')(app);
        var maintance = require('../controller/admin/maintance.js')(app);
        var sparepart = require('../controller/admin/sapreParts.js')(app);
        var attendence = require('../controller/admin/attendence.js')(app);
        var invoice = require('../controller/admin/invoice.js')(app);
        var performance = require('../controller/admin/performance.js')(app);
        var fleetAssignment = require('../controller/admin/fleetassignment.js')(app);





        app.get('/dashboard/allStats', ensureAuthorized, dashboard.allStats);
        app.get('/dashboard/userstats', ensureAuthorized, dashboard.userStats);
        app.get('/dashboard/driverstats', ensureAuthorized, dashboard.driverStats);
        app.get('/dashboard/restaurantstats', ensureAuthorized, dashboard.restaurantStats);
        app.get('/dashboard/orderstats', ensureAuthorized, dashboard.orderStats);

        app.post('/paymentGateway/list', ensureAuthorized, payment.list);
        app.post('/paymentGateway/edit', ensureAuthorized, payment.edit);
        app.post('/paymentGateway/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), payment.save);

        /** ROUTERS for Admin **/
        app.post('/admins/getadmins', ensureAuthorized, admins.allAdmins);
        app.post('/admins/save', ensureAuthorized, admins.save);
        app.post('/admins/edit', ensureAuthorized, admins.edit);
        app.post('/admins/delete', ensureAuthorized, admins.delete);
        app.post('/admins/getusersrole', ensureAuthorized, admins.getusersrole);
        app.post('/admins/rolemanager', ensureAuthorized, admins.rolemanager);
        app.post('/admins/getsubadmins', ensureAuthorized, admins.allSubAdmins);
        app.post('/admins/getdeleted/subadmins', ensureAuthorized, admins.deletedSubAdmins);
        app.post('/admins/currentuser', ensureAuthorized, admins.currentUser);
        app.post('/admins/changeStatus', ensureAuthorized, admins.changeStatus);
        app.post('/admins/changeFlag', ensureAuthorized, admins.changeFlag);
        app.post('/admins/multichangeStatus', ensureAuthorized, admins.multichangeStatus);
        app.post('/admins/changeAvailbility', ensureAuthorized, admins.changeAvailbility)
        app.post('/admins/changeFeatured', ensureAuthorized, admins.changeFeatured);
        app.post('/admins/Restore', ensureAuthorized, admins.Restore);
        app.post('/dashboard/all/filter/data', admins.AfterFilter);


        /** ROUTERS for User **/
        app.post('/users/UserAddress', ensureAuthorized, users.UserAddress);
        app.post('/users/newsletter', ensureAuthorized, users.newsLetterList);
        app.post('/users/save', ensureAuthorized, users.save);
        app.post('/users/edit', ensureAuthorized, users.edit);
        app.post('/users/transactionsList', ensureAuthorized, users.transactionsList);
        app.post('/users/getusers', ensureAuthorized, users.allUsers);
        app.post('/users/exportdata', ensureAuthorized, users.userExport, middlewares.exportToCSVuser);
        app.post('/users/faq_management', ensureAuthorized, users.faqAdd);
        app.post('/users/get-faq', ensureAuthorized, users.faqData);
        app.post('/users/subscribe', ensureAuthorized, users.subscribeUsers);
        app.post('/users/add-subscriber', ensureAuthorized, users.subscribe_Data);
        app.post('/users/delete-subscriber', ensureAuthorized, users.deleteSubscribe);
        app.post('/users/un-subscriber', ensureAuthorized, users.unsubscribe);
        app.post('/users/newsletter', ensureAuthorized, users.subscribeUsers);
        app.post('/users/getdeletedusers', ensureAuthorized, users.getdeletedusers);
        app.get('/users/recentuser', ensureAuthorized, users.recentUser);
        app.post('/users/delete', ensureAuthorized, users.delete);
        app.post('/user/permanent-delete', ensureAuthorized, users.permanentdelete)
        app.post('/users/walletAmount', ensureAuthorized, users.walletAmount);
        app.post('/user/addaddress', ensureAuthorized, users.addaddress);
        app.post('/user/addressStatus', ensureAuthorized, users.addressStatus);
        app.post('/user/deleteUserAddress', ensureAuthorized, users.deleteUserAddress);
        app.get('/dashboard/userlist', ensureAuthorized, users.getuserdetails);
        app.get('/user/plist', ensureAuthorized, users.getpendinglist);
        app.get('/orders/orderlist', ensureAuthorized, orders.getorderlist);
        app.post('/dashboard/deleteUser', ensureAuthorized, users.deletuserdata);
        app.post('/dashboard/orderAddress', ensureAuthorized, users.orderAddress);
        app.post('/map/all/beforefilter', users.beforeFilter);
        app.post('/get/all_statistics/data', users.getStatisticsData);
        app.post('/get/driver_statistics/data', users.getdriverStatisticsData);
        app.get('/trending/product', users.getTrendingProduct);
        app.post('/sendmail/subscribe/user', users.sendMailSubscribe);

        //SHIPROCKET
        app.post('/shiprocket', users.shiprocket_create_order);
        app.post('/shiprocket_getorderstatus', users.shiprocket_getorder_details);
        app.post('/orderdetails_hook', users.shiprocket_webhook);




        /** ROUTERS for Drivers **/
        app.post('/drivers/UserAddress', ensureAuthorized, drivers.UserAddress);
        app.post('/drivers/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), drivers.save);
        app.post('/drivers/edit', ensureAuthorized, drivers.edit);
        app.post('/drivers/transactionsList', ensureAuthorized, drivers.transactionsList);
        app.post('/drivers/getusers', ensureAuthorized, drivers.allUsers);
        app.post('/drivers/getNewDrivers', ensureAuthorized, drivers.newDrivers);
        app.post('/drivers/getidusers', ensureAuthorized, drivers.idUsers);
        app.post('/drivers/getdeletedusers', ensureAuthorized, drivers.getdeletedusers);
        app.get('/users/recentuser', ensureAuthorized, drivers.recentUser);
        app.post('/drivers/delete', ensureAuthorized, drivers.delete);
        app.post('/drivers/iddelete', ensureAuthorized, drivers.iddelete);
        app.post('/drivers/walletAmount', ensureAuthorized, drivers.walletAmount);
        app.post('/drivers/addaddress', ensureAuthorized, drivers.addaddress);
        app.post('/drivers/addressStatus', ensureAuthorized, drivers.addressStatus);
        app.post('/drivers/deleteUserAddress', ensureAuthorized, drivers.deleteUserAddress);
        app.get('/dashboard/driverlist', ensureAuthorized, drivers.getuserdetails);
        app.get('/taskers/plist', ensureAuthorized, drivers.getpendinglist);
        app.post('/dashboard/deleteDriver', ensureAuthorized, drivers.deletdriverdata);
        app.post('/driver/dashboard', ensureAuthorized, drivers.driversDashboard);
        app.post('/driver/getDriverRestStatics', ensureAuthorized, drivers.getDriverRestStatics);
        app.post('/driver/available/default', drivers.driverAvailable);

        /** ROUTERS for Web&Mobile Banners **/
        app.post('/banners/websave', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), banners.websave);
        app.post('/banners/webedit', ensureAuthorized, banners.webedit);
        app.post('/banners/weblist', ensureAuthorized, banners.weblist);
        app.post('/banners/type', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).single('image'),middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).convertToWebP, banners.bannerType);
        app.post('/offer/addedit', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).single('image'), banners.offer_management);
        app.post('/testimonial/addedit', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).single('image'), banners.testimonial);
        app.post('/banners/batchs', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).fields([{ name: 'image_1', maxCount: 1 }, { name: 'image_2', maxCount: 1 }, { name: 'image_3', maxCount: 1 }, { name: 'image_4', maxCount: 1 }]), banners.bannerBatchType);
        app.post('/banners/bannertypelist', ensureAuthorized, banners.bannerTypeList);
        app.post('/offer/list', ensureAuthorized, banners.offerManagementList);
        app.post('/offer/lists', ensureAuthorized, banners.offerManagementList);
        app.post('/testimonials/list', ensureAuthorized, banners.testimonialList);

        app.post('/banners/getbanners', ensureAuthorized, banners.getbannerType);
        app.post('/get/offermanagement', ensureAuthorized, banners.getoffermanagement);
        app.post('/get/testimonialmanagement', ensureAuthorized, banners.getTestimonialmanagement);
        app.post('/banners/bannerdelete', ensureAuthorized, banners.bannerDelete);
        app.post('/banners/webdelete', ensureAuthorized, banners.webdelete);
        app.post('/banners/dweblist', ensureAuthorized, banners.dweblist);
        app.post('/banners/mobsave', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), banners.mobsave);
        app.post('/banners/mobedit', ensureAuthorized, banners.mobedit);
        app.post('/banners/moblist', ensureAuthorized, banners.moblist);
        app.post('/banners/mobdelete', ensureAuthorized, banners.mobdelete);
        app.post('/banners/dmoblist', ensureAuthorized, banners.dmoblist);
        app.post('/banners/permanent/delete', ensureAuthorized, banners.webPermanentdelete);


        /** ROUTERS for Products Category **/
        app.post('/rcategory/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), rcategory.save);
        app.post('/rcategory/edit', ensureAuthorized, rcategory.edit);
        app.post('/rcategory/list', ensureAuthorized, rcategory.list);
        app.post('/rcategory/export_category', ensureAuthorized, rcategory.exportCategoryList, middlewares.exportToCSVCategory);
        app.post('/rcategory/delete', ensureAuthorized, rcategory.delete);
        app.post('/rcategory/dlist', ensureAuthorized, rcategory.dlist);
        app.post('/category/delete', ensureAuthorized, rcategory.deletecat);

        /** ROUTERS for walkthrough images **/
        app.post('/walkthrough_image/list', ensureAuthorized, walkthroughImage.walkthroughImagesList);
        app.post('/walkthrough_image/delete', ensureAuthorized, walkthroughImage.walkthroughImagesDelete);
        app.post('/walkthrough_image/add', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), walkthroughImage.walkthroughImagesAdd);
        app.post('/walkthrough_image/edit', ensureAuthorized, walkthroughImage.walkthroughImagesEdit);
        app.post('/walkthrough_image/dlist', ensureAuthorized, walkthroughImage.dwalthroughList)
        app.post('/walkthrough_image/permenent_delete', ensureAuthorized, walkthroughImage.permanentDeleteWalkthrough)
        /** ROUTERS for Products Sub Category **/
        app.post('/scategory/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), scategory.sub_save);
        app.post('/scategory/edit', ensureAuthorized, scategory.sub_edit);
        app.post('/scategory/list', ensureAuthorized, scategory.list);
        app.post('/scategory/delete', ensureAuthorized, scategory.delete);
        app.post('/scategory/get_all_sub', ensureAuthorized, scategory.get_all_sub);
        app.post('/scategory/dlist', ensureAuthorized, scategory.dlist);

        /** ROUTERS for Brands **/
        app.post('/brands/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), brands.brand_save);
        app.post('/brands/edit', ensureAuthorized, brands.brand_edit);
        app.post('/brands/list', ensureAuthorized, brands.list);
        app.post('/brands/delete', ensureAuthorized, brands.delete);
        app.post('/deletedbrands/list', ensureAuthorized, brands.dlist);

        /** ROUTERS for Restaurant **/
        app.post('/restaurant/UserAddress', ensureAuthorized, restaurant.UserAddress);
        app.post('/restaurant/datasave', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), restaurant.save);
        app.post('/restaurant/edit', ensureAuthorized, restaurant.edit);
        app.post('/restaurant/transactionsList', ensureAuthorized, restaurant.transactionsList);
        app.post('/restaurant/getusers', ensureAuthorized, restaurant.allUsers);
        app.post('/get/new/restaurant', ensureAuthorized, restaurant.newRestaurants);
        app.post('/restaurant/getidusers', ensureAuthorized, restaurant.idUsers);
        app.post('/restaurant/deactiveUsers', ensureAuthorized, restaurant.deactiveUsers);
        app.post('/restaurant/getdeletedusers', ensureAuthorized, restaurant.getdeletedusers);
        app.get('/restarant/get/rcategory', ensureAuthorized, restaurant.getrcategory);
        // app.post('/restaurant/availability', ensureAuthorized, restaurant.availability);
        app.get('/restaurant/recentuser', ensureAuthorized, restaurant.recentUser);
        app.post('/restaurant/delete', ensureAuthorized, restaurant.delete);
        app.post('/restaurant/walletAmount', ensureAuthorized, restaurant.walletAmount);
        app.post('/restaurant/addaddress', ensureAuthorized, restaurant.addaddress);
        app.post('/restaurant/addressStatus', ensureAuthorized, restaurant.addressStatus);
        app.post('/restaurant/deleteUserAddress', ensureAuthorized, restaurant.deleteUserAddress);
        app.get('/dashboard/restaurantlist', ensureAuthorized, restaurant.getuserdetails);
        app.get('/taskers/plist', ensureAuthorized, restaurant.getpendinglist);
        app.post('/dashboard/deleteRestaurant', ensureAuthorized, restaurant.deletdriverdata);
        app.get('/restarant/getcity', ensureAuthorized, restaurant.getCity);
        app.post('/restaurant/document/dynamic', ensureAuthorized, restaurant.getDocField);
        app.post('/restarant/get/subcity', ensureAuthorized, restaurant.getsubCity);
        app.get('/restaurant/timezones', ensureAuthorized, restaurant.restaurantTimezones);
        app.get('/restaurant/getTax', ensureAuthorized, restaurant.getTax);
        app.post('/restaurant/getstatetax', ensureAuthorized, restaurant.getstatetax);
        app.post('/restaurant/dashboard', ensureAuthorized, restaurant.restaurantDashboard);
        app.post('/restaurant/list/citybased', ensureAuthorized, restaurant.restaurantsList);
        app.post('/restaurant/getFeaturedRestaurantList', ensureAuthorized, restaurant.getFeaturedRestaurantList);
        app.post('/restaurant/changeRestaurantFeature', ensureAuthorized, restaurant.changeRestaurantFeature);
        app.post('/restaurant/uploadRestaurantFeature', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).single('image'), restaurant.uploadRestaurantFeature);
        app.post('/submit/offer', ensureAuthorized, restaurant.submitOffer);
        app.post('/offer/getlist', ensureAuthorized, restaurant.Listoffer);
        app.post('/get/offer/editdoc', ensureAuthorized, restaurant.getOfferEditdoc);
        app.post('/offer/delete', ensureAuthorized, restaurant.deleteOffer);
        app.post('/restarant/get/subcuisine', ensureAuthorized, restaurant.getsubCuisine);
        app.post('/rest/category/save', ensureAuthorized, restaurant.resCatSave);
        app.post('/get_rest/category/list', ensureAuthorized, restaurant.resMaincatList);
        app.post('/get_rest/category/catlist', ensureAuthorized, restaurant.resMaincataList);
        app.post('/get_rest/subcategory/list', ensureAuthorized, restaurant.resSubcatList);
        app.post('/get_rest/menu/list', ensureAuthorized, restaurant.resMenuList);
        app.post('/get_rest/recomended/list', ensureAuthorized, restaurant.resRecomendedList);
        app.post('/rest/rec_food/data', ensureAuthorized, restaurant.getRecomendedFoodList);
        app.post('/rest/save/rec_food/data', ensureAuthorized, restaurant.saveRecommended);
        app.post('/rest/save/bank/data', ensureAuthorized, restaurant.saveBankDetails);



        app.post('/rest/category/edit', ensureAuthorized, restaurant.resMaincatEdit);
        app.post('/restaurant/available/default', restaurant.restaurantDefault);

        app.get('/rest/category/catList', ensureAuthorized, restaurant.restcatList);
        app.post('/res/sub_cat/save', ensureAuthorized, restaurant.resSubCatSave);
        app.post('/rest/sub_category/data', ensureAuthorized, restaurant.resSubCatdata);
        app.post('/rest/category/delete', ensureAuthorized, restaurant.MainCatDelete);
        app.post('/sub_cat/category/delete', ensureAuthorized, restaurant.subCatDelete);

        /** ROUTERS for City **/
        app.post('/city/add', ensureAuthorized, drivers.addCity)
        app.post('/city/list', ensureAuthorized, drivers.cityList);
        app.post('/city/editdoc', ensureAuthorized, drivers.cityEditdoc);
        app.post('/city/cityDetails', ensureAuthorized, drivers.cityDetails);
        app.post('/city/Restaurantdetails', ensureAuthorized, drivers.Restaurantdetails);
        app.post('/city/getDrivers', ensureAuthorized, drivers.getDrivers);
        app.post('/city/getRestaurant', ensureAuthorized, drivers.getRestaurant);
        app.post('/city/add/fare', ensureAuthorized, drivers.cityAddfare);
        app.post('/city/edit/faredoc', ensureAuthorized, drivers.cityEditfaredoc);
        app.post('/add/city/area', ensureAuthorized, drivers.Addcityarea);
        app.post('/add/city/warehouse', ensureAuthorized, drivers.Warehouse);
        app.post('/city/area/list', ensureAuthorized, drivers.cityAreaList);
        app.post('/city/area/editdoc', ensureAuthorized, drivers.getCityAreaEditdoc);
        app.post('/edit/city/area', ensureAuthorized, drivers.EditCityArea);
        app.post('/main/city/delete', ensureAuthorized, drivers.DeleteCity);
        app.post('/city/area/delete', ensureAuthorized, drivers.DeleteArea);


        /** ROUTERS for Document **/
        app.post('/admin/doc/add', ensureAuthorized, drivers.docAddoc);
        app.post('/document/list', ensureAuthorized, drivers.getDocList);
        app.post('/document/editdoc', ensureAuthorized, drivers.getEditDocList);
        app.post('/document/delete', ensureAuthorized, drivers.docDelete);
        app.post('/document/dynamic', ensureAuthorized, drivers.dynamic);
        app.post('/driver/citylist', ensureAuthorized, drivers.drivercityList);

        /** ROUTERS for Vehicle **/
        app.post('/admin/vehicle/add', ensureAuthorized, drivers.vehicleAdd);
        app.post('/admin/vehicle/get', ensureAuthorized, drivers.vehicleGet);
        app.post('/vehicle/editdoc', ensureAuthorized, drivers.vehicleEdit);
        app.post('/vehicle/delete', ensureAuthorized, drivers.vehicleDelete);

        /** ROUTERS for Attributes **/
        app.get('/admin/attributes/attributesList', ensureAuthorized, attributes.getallatt);
        // app.post('/admin/attributes/list', ensureAuthorized, attributes.attributesList); 
        app.post('/admin/attributes/edit', ensureAuthorized, attributes.attEdit);
        app.post('/admin/attributes/save', ensureAuthorized, attributes.attSave);
        app.post('/admin/attributes/list', ensureAuthorized, attributes.list);
        app.post('/admin/attributes/delete', ensureAuthorized, attributes.attDelete);

        /** ROUTERS for Time Slots **/
        app.get('/admin/timeslots/timeslotsList', ensureAuthorized, timeslots.getalltimeslots);
        app.post('/admin/timeslots/edit', ensureAuthorized, timeslots.slotEdit);
        app.post('/admin/timeslots/save', ensureAuthorized, timeslots.attSave);
        app.post('/admin/timeslots/list', ensureAuthorized, timeslots.list);
        app.post('/admin/timeslots/delete', ensureAuthorized, timeslots.slotDelete);

        /** ROUTERS for Category **/
        app.get('/products/category/catList', ensureAuthorized, category.catList);
        app.post('/products/category/list', ensureAuthorized, category.categoryList);
        app.post('/products/category/edit', ensureAuthorized, category.catEdit)
        app.get('/settings/getSetting', ensureAuthorized, category.getSetting);
        app.get('/settings/getcurencies', ensureAuthorized, category.getCurrencies);
        app.post('/products/category/delete', ensureAuthorized, category.catDelete);
        app.post('/cuisine/list', ensureAuthorized, category.getMaincuisineList);
        app.post('/save/cuisine', ensureAuthorized, category.saveCuisine);
        app.post('/get/cuisine', ensureAuthorized, category.getCuision);
        app.post('/main/cusine/delete', ensureAuthorized, category.deleteMaincuisine);
        app.post('/get/sub/cuisine', ensureAuthorized, category.getSubCuisine);
        app.post('/save/sub/cuisine', ensureAuthorized, category.saveSubCuisine);
        app.post('/getsub/cuisine/list', ensureAuthorized, category.getSubcuisineList);
        app.post('/subcuisine/delete', ensureAuthorized, category.deleteSubcuisine);


        /** ROUTERS for Food **/
        app.get('/food/category', ensureAuthorized, food.Category);
        app.post('/food/getFoodDetails', ensureAuthorized, food.getFoodDetails);
        app.post('/food/getRestaurantCategory', ensureAuthorized, food.getRestaurantCategory);
        app.post('/food/getSubCategoryDetails', ensureAuthorized, food.getSubCategoryDetails);
        app.post('/food/getproductlist', ensureAuthorized, food.getProductlist);
        app.post('/food/exportproductlist', ensureAuthorized, food.exportProductlist, middlewares.exportToCSV);
        app.post('/food/getproductlist_deals', ensureAuthorized, food.getProductlist_deals);
        app.post('/food/edit', ensureAuthorized, food.edit);
        app.get('/food/category/list', ensureAuthorized, food.categoryList);
        app.get('/food/editcategory/list', ensureAuthorized, food.exditcategoryList);
        app.post('/food/get/restDeatails', ensureAuthorized, food.restDetails);
        app.get('/food/list', ensureAuthorized, food.foodList);
        app.post('/food/delete', ensureAuthorized, food.foodDelete);
        app.post('/food/add', ensureAuthorized, food.foodAdd);
        app.post('/food/bulkupload', ensureAuthorized, uploadExcelAndProcess, food.uploadBulkInventory);
        app.post('/food/clone/save', ensureAuthorized, food.foodClone);
        app.post('/food/get/parent', ensureAuthorized, food.getParent);
        app.get('/food/get/rcategory', ensureAuthorized, food.getrcategory);
        app.get('/food/getcity', ensureAuthorized, food.getCity);
        app.get('/food/getbrandns', ensureAuthorized, food.getbrandns);
        app.post('/food/catbrandns', ensureAuthorized, food.catbrandns);
        app.post('/food/getattributes', ensureAuthorized, food.getattributes);
        app.post('/food/get/subcity', ensureAuthorized, food.getsubCity);

        /** ROUTERS for orders **/
        app.post('/orders/list', ensureAuthorized, orders.ordersList);
        app.post('/orders/retur_list', ensureAuthorized, orders.returnOrdersList)
        // app.post('/order/accept', ensureAuthorized, orders.AcceptOrder);
        app.post('/order/accept', ensureAuthorized, orders.orderAccept);
        app.post('/order/printDocument', ensureAuthorized, orders.printDocument);
        app.post('/orders/list1', ensureAuthorized, orders.list1);
        app.post('/orders/list-all-order', ensureAuthorized, orders.listAllOrder);
        app.post('/orders/adminCancelOrders', ensureAuthorized, orders.adminCancelOrders);
        app.get('/settings/general', ensureAuthorized, orders.general);
        app.get('/tools/taskexport', orders.taskexport);
        app.post('/tools/taskexport', ensureAuthorized, orders.taskexportpost);

        app.post('/orders/delete', ensureAuthorized, orders.deleteOrders);
        app.post('/get/deletedorder', ensureAuthorized, orders.getdeleteOrders);
        app.post('/get/orders', ensureAuthorized, orders.getOrders);
        app.post('/get/return-order', ensureAuthorized, orders.getReturnOrder);
        app.post('/get/getOrderdata', ensureAuthorized, orders.getOrderdata);
        app.post('/get/cancel', ensureAuthorized, orders.cancel);
        app.post('/orders/ordersDashboard', ensureAuthorized, orders.ordersDashboard);
        app.post('/orders/getAssignJobOrder', ensureAuthorized, orders.getAssignJobOrder);
        app.post('/orders/ordersDashboard1', ensureAuthorized, orders.ordersDashboard1);
        app.get('/orders/todayOrderDetails', ensureAuthorized, orders.todayOrderDetails);
        app.get('/orders/todayFilterOrderDetails', ensureAuthorized, orders.todayFilterOrderDetails);
        app.get('/orders/todayFilterOrderDetailsWithDriver', ensureAuthorized, orders.todayFilterOrderDetailsWithDriver);
        app.get('/orders/todayFilterCompletedOrderDetails', ensureAuthorized, orders.todayFilterCompletedOrderDetails);
        app.post('/order/update-status', ensureAuthorized, orders.updateOrderStatus);
        app.post('/order/update_return_status', ensureAuthorized, orders.updateReturnOrderStatus)
        app.post('/order/cancel-order', ensureAuthorized, orders.adminCancelOrder)
        app.post('/order/cancel-admin', ensureAuthorized, orders.orderCancel);
        app.post('/order/delete-admin', ensureAuthorized, orders.orderDelete);
        app.post('/order/invoice-number', ensureAuthorized, orders.invoice_number);
        /** ROUTERS for ReferralCoupon Management **/
        app.post('/refer_coupons/save', ensureAuthorized, refer_coupon.save);
        app.post('/refer_coupons/list', ensureAuthorized, refer_coupon.list);
        app.post('/refer_coupons/edit', ensureAuthorized, refer_coupon.editcoupon);
        app.post('/refer_coupons/deletecoupon', ensureAuthorized, refer_coupon.deletecoupon);

        /** ROUTERS for Coupon Management **/
        app.post('/coupons/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).any(), coupon.save);

        app.post('/coupons/edit', ensureAuthorized, coupon.editcoupon);
        app.get('/coupons/userGet', ensureAuthorized, coupon.userGet);
        app.post('/coupons/list', ensureAuthorized, coupon.list);
        app.post('/coupons/deletecoupon', ensureAuthorized, coupon.deletecoupon);
        app.post('/coupons/restaurant', ensureAuthorized, coupon.couponRestaurant);

        /** ROUTERS for Settings **/
        app.post('/products/category/save', ensureAuthorized, category.catSave);
        app.post('/products/category/getCatrestid', ensureAuthorized, category.getCatrestid);
        app.post('/admin/slider/list', ensureAuthorized, slider.list);
        app.post('/slider/edit', ensureAuthorized, slider.edit);
        app.post('/slider/save', ensureAuthorized, slider.save);
        app.post('/slider/deletebanner', ensureAuthorized, slider.deletebanner);
        app.post('/contact/list', ensureAuthorized, contact.list);
        app.post('/contact/edit', ensureAuthorized, contact.edit);
        app.post('/contact/save', ensureAuthorized, contact.save);
        app.post('/contact/sendMail', ensureAuthorized, contact.sendMail);
        app.post('/contact/deletecontact', ensureAuthorized, contact.deletecontact);
        app.get('/images/list', ensureAuthorized, images.list);
        app.post('/images/edit', ensureAuthorized, images.edit);
        app.post('/images/admin-Image', images.getImage);
        app.post('/images/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).fields([{ name: 'backgroundimage', maxCount: 1 }, { name: 'taskersignup', maxCount: 1 }, { name: 'adminlogin', maxCount: 1 }, { name: 'loginpage', maxCount: 1 }, { name: 'taskerprofile', maxCount: 1 }, { name: 'sitelanding', maxCount: 1 }]), images.save);
        app.post('/images/getappearance', images.getappearance);
        app.post('/images/fixedHeaderSave', ensureAuthorized, images.fixedHeaderSave);
        app.post('/images/fixedAsideSave', ensureAuthorized, images.fixedAsideSave);
        app.post('/images/deleteimages', ensureAuthorized, images.deleteimages);


        app.post('/pages/submitmainpage', ensureAuthorized, pages.submitmainpage);
        app.post('/pages/getlist', ensureAuthorized, pages.getlist);
        app.post('/pages/editpage', ensureAuthorized, pages.editpage);
        app.get('/pages/translatelanguage', ensureAuthorized, pages.translatelanguage);
        app.post('/pages/deletepage', ensureAuthorized, pages.deletepage);
        app.get('/pages/getlistdropdown', ensureAuthorized, pages.getlistdropdown);
        app.post('/pages/getsublist', ensureAuthorized, pages.getsublist);
        app.get('/pages/getPageSetting', ensureAuthorized, pages.getPageSetting);
        app.post('/pages/geteditpagedata', ensureAuthorized, pages.geteditpagedata);
        app.post('/pages/deletecategorypage', ensureAuthorized, pages.deletecategorypage);
        app.post('/pages/submitcategoryPage', ensureAuthorized, pages.submitcategoryPage);
        app.post('/pages/submi/footerdata', ensureAuthorized, pages.submitFooterData);
        app.post('/get/footerdata', ensureAuthorized, pages.getFooterData);
        app.get('/api/admin/get-page/:slug', pages.getPage);

        app.post('/postheader/save', ensureAuthorized, middlewares.commonUpload('./uploads/images/postheader/').single('image'), postheader.save);
        app.post('/postheader/edit', ensureAuthorized, postheader.edit);
        app.post('/postheader/list', ensureAuthorized, postheader.list);
        app.post('/postheader/deletepostheader', ensureAuthorized, postheader.deletepostheader);

        app.post('/experience/list', ensureAuthorized, experience.list);
        app.post('/experience/edit', ensureAuthorized, experience.edit);
        app.post('/experience/save', ensureAuthorized, experience.save);
        app.post('/experience/delete', ensureAuthorized, experience.delete);

        app.post('/question/list', ensureAuthorized, question.list);
        app.post('/question/edit', ensureAuthorized, question.edit);
        app.post('/question/save', ensureAuthorized, question.save);
        app.post('/question/deletequestion', ensureAuthorized, question.deletequestion);

        app.get('/settings/general', settings.general);
        app.post('/settings/general/delete_splash_screen', settings.deleteSplashScreen)
        app.get('/settings/themecolor', settings.themecolor);
        app.get('/settings/mobile/content', ensureAuthorized, settings.getmobile);
        app.get('/settings/general/timezones', ensureAuthorized, settings.timezones);
        app.post('/settings/walletSetting', ensureAuthorized, settings.walletSetting);
        app.post('/settings/categorySetting', ensureAuthorized, settings.categorySetting);
        app.post('/settings/cashSetting', ensureAuthorized, settings.cashSetting);
        app.post('/settings/referralStatus', ensureAuthorized, settings.referralStatus);
        app.post('/settings/general/currency/save', ensureAuthorized, settings.currency);
        app.get('/settings/currency', ensureAuthorized, settings.get_currency);
        app.post('/settings/general/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).fields([{ name: 'logo', maxCount: 1 }, { name: 'login_image', maxCount: 1 }, { name: 'site_logo', maxCount: 1 }, { name: 'register_image', maxCount: 1 }, { name: 'footer_logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }, { name: 'appicon', maxCount: 1 }, { name: "multiBase64", maxCount: 5 }, { name: 'footer_icon', maxCount: 1 }, { name: 'shipping_banner', maxCount: 1 }, { name: 'allcat_banner', maxCount: 1 }]), settings.save);
        app.post('/settings/currency/list', ensureAuthorized, settings.currencyList);
        app.post('/settings/currency/edit', ensureAuthorized, settings.currencyEdit);
        app.post('/settings/currency/save', ensureAuthorized, settings.currencySave);
        app.post('/settings/currency/delete', ensureAuthorized, settings.currencyDelete);
        app.post('/settings/mobilecontent/save', ensureAuthorized, settings.mobilesave);
        app.post('/settings/currency/default/save', ensureAuthorized, settings.currencyDefaultSave);
        app.post('/settings/restarant/default/save', ensureAuthorized, settings.restaurantDefaultSave);
        app.post('/settings/currency/default', settings.currencyDefault);

        app.post('/settings/social-networks/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).fields([{ name: 'facebookimage', maxCount: 1 }, { name: 'twitterimage', maxCount: 1 }, { name: 'linkedinimage', maxCount: 1 }, { name: 'pinterestimage', maxCount: 1 }, { name: 'youtubeimage', maxCount: 1 }, { name: 'instagramimage', maxCount: 1 }, { name: 'googleimage', maxCount: 1 }, { name: 'googleplayimage', maxCount: 1 }, { name: 'googleplaylandingimage', maxCount: 1 }, { name: 'googplycommingsoonimage', maxCount: 1 }, { name: 'appstoreimage', maxCount: 1 }, { name: 'appstorelandingimage', maxCount: 1 }, { name: 'appstorecommingsoonimage', maxCount: 1 }]), settings.socialnetworkssave);
        //app.post('/settings/restaurant/default', settings.restaurantDefault);


        app.post('/settings/language/edit', ensureAuthorized, settings.languageedit);
        app.get('/settings/language/getlanguage/:id', ensureAuthorized, settings.languagegetlanguage);
        app.post('/settings/language/list', ensureAuthorized, settings.languagelist);
        app.post('/settings/language/delete', ensureAuthorized, settings.languagedelete);
        app.post('/settings/language/default', settings.languagedefault);
        app.post('/settings/language/default/save', ensureAuthorized, settings.languagedefaultsave);
        app.post('/settings/language/translation', ensureAuthorized, settings.languageTranslation);
        app.post('/settings/language/translation/save', ensureAuthorized, settings.languageSaveTranslation);
        app.get('/settings/language/translation/get', ensureAuthorized, settings.languageGetTranslation);
        app.post('/settings/language/manage', ensureAuthorized, settings.getlanguageDetails);
        app.get('/get/settings/details', settings.settingsDetails);
        app.post('/settings/shipping', settings.shippingManagement);
        app.get('/settings/getshipping', settings.getshippingManagement);
        app.post('/newsletter/subscriber/list', ensureAuthorized, newsletter.subscriberList);
        app.post('/newsletter/subscriber/delete', ensureAuthorized, newsletter.subscriberDelete);
        app.post('/newsletter/sendbulkmail', ensureAuthorized, newsletter.sendbulkmail);
        app.post('/newsletter/sendmessage', ensureAuthorized, newsletter.sendmessage);
        app.post('/newsletter/sendmessagemail', ensureAuthorized, newsletter.sendmessagemail);

        app.post('/notification/user/list', ensureAuthorized, newsletter.userList);
        app.post('/notification/rest/list', ensureAuthorized, newsletter.restList);
        app.post('/notification/driver/list', ensureAuthorized, newsletter.driverList);


        app.post('/notification/email-template/list', ensureAuthorized, newsletter.emailtemplatelist);
        app.post('/notification/email-template/edit', ensureAuthorized, newsletter.edittemplate);
        app.post('/notification/email-template/save', ensureAuthorized, newsletter.savemailnotification);
        app.post('/notification/message-template/save', ensureAuthorized, newsletter.savemessagenotification);
        app.post('/notification/deletenotification', ensureAuthorized, newsletter.deletenotification);
        app.get('/notification/email-template/getmailtemplate', ensureAuthorized, newsletter.getmailtemplate);
        app.get('/notification/email-template/getmessagetemplate', ensureAuthorized, newsletter.getmessagetemplate);

        app.get('/settings/seo', ensureAuthorized, settings.seo);
        app.post('/settings/seo/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).fields([{ name: 'og_image', maxCount: 1 }]), settings.seosave);
        app.get('/settings/widgets', ensureAuthorized, settings.widgets);
        app.post('/settings/widgets/save', ensureAuthorized, settings.widgetssave);
        app.get('/settings/smtp', ensureAuthorized, settings.smtp);
        app.post('/settings/sms/save', ensureAuthorized, settings.smssave);
        app.get('/settings/sms', ensureAuthorized, settings.sms);
        app.post('/settings/smtp/save', ensureAuthorized, settings.smtpsave);
        app.get('/settings/social-networks', ensureAuthorized, settings.socialnetworks);
        // app.post('/settings/social-networks/save', ensureAuthorized, settings.socialnetworkssave);
        app.get('/subcategories/getSetting', ensureAuthorized, settings.getSetting);
        app.post('/reviews/list', ensureAuthorized, reviews.list);
        // app.post('/review/list', ensureAuthorized, reviews.newlist);
        app.post('/reviews/edit', ensureAuthorized, reviews.edit);
        app.post('/reviews/save', ensureAuthorized, reviews.save);
        app.post('/reviews/deletereviews', ensureAuthorized, reviews.deletereviews);
        app.post('/dashboard/forgotpass', ensureAuthorized, admins.forgotpass);
        app.post('/dashboard/forgotsave', ensureAuthorized, admins.forgotpassave);
        app.post('/dashboard/earningsDetails', ensureAuthorized, admins.earningsDetails);
        app.post('/get/all/data', ensureAuthorized, admins.getAllDetails);
        app.post('/ratings/resturantlist', ensureAuthorized, ratings.RestaurantList);
        app.post('/ratings/ResturantRatingList', ensureAuthorized, ratings.ResturantRatingList);
        app.post('/ratings/driverlist', ensureAuthorized, ratings.DriverList);
        app.post('/ratings/DriverviewRating', ensureAuthorized, ratings.DriverviewRating);




        /** ROUTERS for  Cancellation Settings **/
        app.post('/cancellation/list', ensureAuthorized, cancellation.list);
        app.post('/cancellation/edit', ensureAuthorized, cancellation.edit);
        app.post('/cancellation/save', ensureAuthorized, cancellation.save);
        app.post('/cancellation/deletecancellation', ensureAuthorized, cancellation.deletecancellation);


        /** ROUTERS for  EmailTemplate Settings **/
        app.post('/email-template/list', ensureAuthorized, emailTemplate.list);
        app.get('/email-template/list-active', ensureAuthorized, emailTemplate.list_active);
        app.post('/email-template/edit', ensureAuthorized, emailTemplate.edit);
        app.post('/email-template/save', ensureAuthorized, emailTemplate.save);
        app.post('/email-template/delete', ensureAuthorized, emailTemplate.delete);
        app.get('/emailtemplate/getsubscripermail', ensureAuthorized, emailTemplate.getsubscripermail);


        app.get('/tools/exportuser', tools.userexport);
        app.post('/tools/exportuser', ensureAuthorized, tools.userexportpost);
        app.get('/tools/exportdriver', tools.driverexport);
        app.post('/tools/exportdriver', ensureAuthorized, tools.driverexportpost);
        app.get('/tools/exportrestaurant', tools.restaurantexport);
        app.post('/tools/exportrestaurant', ensureAuthorized, tools.restaurantexportpost);
        app.get('/restarant/treecategories', users.treeCategories);

        app.post('/get/state', ensureAuthorized, drivers.getState);
        app.post('/admin/tax/save', ensureAuthorized, drivers.taxSave);
        app.post('/admin/tax/list', ensureAuthorized, drivers.taxList);
        app.post('/get/edit/tax', ensureAuthorized, drivers.editTax);
        app.post('/restarant/get/getRestaurants', ensureAuthorized, restaurant.getRestaurants);
        app.post('/billing/adminEarnings', ensureAuthorized, billing_cycle.adminEarnings);
        app.post('/billing/fetchCycles', ensureAuthorized, billing_cycle.fetchCycle);
        app.get('/billing/driverEarnings', ensureAuthorized, billing_cycle.driverEarnings);
        app.get('/billing/getDriverOrderEarnings', ensureAuthorized, billing_cycle.getDriverOrderEarnings);
        // app.get('/billing/getDriverTranscations', ensureAuthorized, billing_cycle.getDriverTranscations);
        // app.get('/billing/exportDriverTranscations', ensureAuthorized, billing_cycle.exportDriverTranscations);
        app.post('/billing/updateRestaurantPayoutDetails', ensureAuthorized, billing_cycle.updateRestaurantPayoutDetails);
        // app.post('/billing/updateRestaurantPayoutAmount', ensureAuthorized, billing_cycle.updateRestaurantPayoutAmount);
        app.post('/billing/updateDriverPayoutDetails', ensureAuthorized, billing_cycle.updateDriverPayoutDetails);
        app.get('/billing/restaurantEarnings', ensureAuthorized, billing_cycle.restaurantEarnings);
        app.get('/billing/getRestaurantOrderEarnings', ensureAuthorized, billing_cycle.getRestaurantOrderEarnings);
        // app.post('/billing/getRestaurantOrderEarningsAmount', ensureAuthorized, billing_cycle.getRestaurantOrderEarningsAmount);
        app.post('/billing/getOrderDetails', ensureAuthorized, billing_cycle.getOrderDetails);
        app.post('/pages/addLanding', ensureAuthorized, pages.addLanding)
        app.post('/pages/addBanner', ensureAuthorized, pages.addDriverBanner);
        app.post('/pages/getLandingContent', ensureAuthorized, pages.getLandingContent);
        // app.post('/billing/exportadminearning', ensureAuthorized, billing_cycle.exportadminearning);
        // app.post('/billing/exportdriverpayout', ensureAuthorized, billing_cycle.exportdriverpayout);
        // app.post('/billing/exportdriverdetail', ensureAuthorized, billing_cycle.exportdriverdetail);
        // app.post('/billing/exportrespayout', ensureAuthorized, billing_cycle.exportrespayout);
        // app.post('/billing/exportrestpaydetail', ensureAuthorized, billing_cycle.exportrestpaydetail);

        app.post('/orders/exportdashboardorder', ensureAuthorized, orders.exportdashboardorder);
        app.get('/admin/download-file/:type/:file', orders.downloadFile);

        /** ROUTERS for rewards Management **/
        app.get('/get/rewards/range', ensureAuthorized, rewards.getrange);
        app.post('/rewards/save', ensureAuthorized, rewards.save);
        app.post('/get/rewardsList', ensureAuthorized, rewards.list);

        app.post("/reviews/rating/list", ensureAuthorized, ratings.RatingReviewList)
        app.post("/reviews/rating/delete", ensureAuthorized, ratings.RatingReviewsDelete)
        app.post("/reviews/rating/details", ensureAuthorized, ratings.RatingReviewDetails)

        /** ROUTERS for Tag Management **/
        app.post('/tags/list', ensureAuthorized, tags.getTagList);
        app.post('/tags/getTag', ensureAuthorized, tags.getSingleTag)
        app.post('/tags/delete', ensureAuthorized, tags.deleteTag);
        app.post('/offer-management/delete', ensureAuthorized, banners.deleteOffer);
        app.post('/testimonial-management/delete', ensureAuthorized, banners.deleteTestimonial);
        app.post('/tags/save', ensureAuthorized, tags.save);
        // app.post('/tags/edit',ensureAuthorized,middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).fields([{ name: 'og_image', maxCount: 1 }]),tags.editTag)
        // app.post('/tags/save',ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).fields([{ name: 'og_image', maxCount: 1 }]),tags.save);
        app.post('/tags/edit', ensureAuthorized, tags.editTag);
        app.post('/tags/getAll', ensureAuthorized, tags.getAllTags)

        /** ROUTERS for Deals Management **/
        app.post('/deals/save', ensureAuthorized, deals.save);
        app.post('/deals/list', ensureAuthorized, deals.getDealList);
        app.post('/deals/edit', ensureAuthorized, deals.editDeal);
        app.post('/deals/getAll', ensureAuthorized, deals.getAllDeals)
        app.post('/deals/getDeal', ensureAuthorized, deals.getSingleDeal)

        /** ROUTERS for coupon Management **/
        app.post('/combo/save', ensureAuthorized, deals.save);
        app.post('/combo/list', ensureAuthorized, deals.getDealList);
        app.post('/combo/edit', ensureAuthorized, deals.editDeal);
        //  app.post('/combo/getAll',ensureAuthorized,deals.getAllDeals)
        //  app.post('/combo/getDeal',ensureAuthorized,deals.getSingleDeal)


        /** ROUTERS for Report Management **/
        app.post('/admin/payment/report', ensureAuthorized, report.getReportPayment);
        app.post('/admin/sales/report', ensureAuthorized, report.getReportSales);
      
// FLEET MANAGEMENT
  app.post('/admin/fleet/save', ensureAuthorized, middlewares.commonUpload(CONFIG.DIRECTORY_OTHERS).single('document'), fleet.saveFleet);
  app.post('/admin/fleet/list', ensureAuthorized, fleet.listFleets);
  app.post('/admin/fleet/view', ensureAuthorized, fleet.viewFleet);
  app.post('/admin/fleet/delete', ensureAuthorized, fleet.deleteFleet);
  app.post('/admin/fleet/maintenance-due', ensureAuthorized, fleet.maintenanceDue);

  //contract management

  app.post('/admin/contract/save', ensureAuthorized, contract.saveContract);
  app.post('/admin/contract/list', ensureAuthorized, contract.listContracts);
  app.post('/admin/contract/view', ensureAuthorized, contract.viewContract);
  app.post('/admin/contract/delete', ensureAuthorized, contract.deleteContract);

  //employee management
    app.post('/admin/employee/save', ensureAuthorized, middlewares.commonUploadPDF(CONFIG.DIRECTORY_OTHERS).any(),middlewares.processDocuments, employee.saveEmployee);
    app.post('/admin/employee/view', ensureAuthorized, employee.viewemployee);
    app.post('/admin/employee/list', ensureAuthorized, employee.listEmployees);

    //vendor management
    app.post('/admin/vendor/save', ensureAuthorized, middlewares.commonUploadPDF(CONFIG.DIRECTORY_OTHERS).any(),middlewares.processDocuments, vendor.saveVendor);
    app.post('/admin/vendor/view', ensureAuthorized,middlewares.processDocuments, vendor.viewVendor);
    app.post('/admin/vendor/list', ensureAuthorized, vendor.listVendors);


    //fuel management
    app.post('/admin/fuel/save', ensureAuthorized, fuel.saveFuel);
    app.post('/admin/fuel/view', ensureAuthorized, fuel.viewFuel);
    app.post('/admin/fuel/list', ensureAuthorized, fuel.listFuels);

    //maintenance management
    app.post('/admin/maintenance/save', ensureAuthorized, maintance.saveMaintenance);
    app.post('/admin/maintenance/list', ensureAuthorized, maintance.listMaintenance);

    //sapre parts management
    app.post('/admin/sparepart/save', ensureAuthorized, sparepart.saveSparePart);
    app.post('/admin/sparepart/list', ensureAuthorized, sparepart.listSpareParts);
    app.post('/admin/sparepart/view', ensureAuthorized, sparepart.viewSparePart);

    //attenance management
    app.post('/admin/attendance/save', ensureAuthorized, attendence.saveAttendance);
    app.post('/admin/attendance/list',ensureAuthorized , attendence.listAttendance)
    app.post('admin/vendor/payment/save', ensureAuthorized, attendence.saveVendorPayment);
    app.post ('/admin/customer/payment/save', ensureAuthorized, attendence.saveCustomerPayment);
    app.post('/admin/vendor/payment/list', ensureAuthorized, attendence.listVendorPayment);
    app.post('/admin/customer/payment/list', ensureAuthorized, attendence.listCustomerPayment);
    app.post('/admin/attendance/bulk-mark', ensureAuthorized, attendence.bulkMarkAttendance);
    app.post('/admin/attendance/mark-all', ensureAuthorized, attendence.markAllPresentToday);


    //invoice management
    app.post('/admin/invoice/add', ensureAuthorized, invoice.saveInvoice);
    app.post('/admin/invoice/list', ensureAuthorized, invoice.listInvoices);
    app.post('/admin/invoice/view', ensureAuthorized, invoice.viewInvoice);
    app.post('/admin/invoice/delete', ensureAuthorized, invoice.deleteInvoice);
    app.post('/admin/invoice/update-status', ensureAuthorized, invoice.updateInvoiceStatus);

    //performance management
    app.post('/admin/performance/report', ensureAuthorized, performance.performanceReport);
    app.post('/admin/performance/update-driver-behaviour',performance.updateDrivingBehaviour)

    //fleet assignments
    app.post('/admin/fleet/assignment/assign', ensureAuthorized, fleetAssignment.assignFleet);
    app.post('/admin/fleet/assignment/list', ensureAuthorized, fleetAssignment.listFleetAssignments);
    app.post('/admin/fleet/assignment/unassign', ensureAuthorized, fleetAssignment.unassignFleet);
    app.post('/admin/fleet/assignment/assignment-stats', ensureAuthorized, fleetAssignment.fleetAssignmentCounts);
    } catch (e) {
        console.log('erroe in index.js---------->>>>', e);
    }
};