var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

/*---new db schema----*/
var config_admin_schema = require('../schema/administrators.schema.js');
var config_attributes_schema = require('../schema/attributes.schema.js');
var config_timeslots_schema = require('../schema/timeslots.schema.js');
var config_user_schema = require('../schema/user.schema.js');
var config_pages_schema = require('../schema/page.schema.js');
var config_slider_schema = require('../schema/sliders.schema.js');
var config_postheader_schema = require('../schema/postheaders.schema.js');
var config_experience_schema = require('../schema/experience.schema.js');
var config_question_schema = require('../schema/questions.schema.js');
var config_settings_schema = require('../schema/setting.schema.js');
var config_newsletter_schema = require('../schema/newsletter.schema.js');
var config_paymentGateway_schema = require('../schema/payment-gateway.js');
var config_images_schema = require('../schema/images.schema.js');
var config_contact_schema = require('../schema/contact.schema.js');
var config_ratings_schema = require('../schema/ratings.schema.js');
var return_reason_schema = require('../schema/return-reason.schema.js')
var config_faqs_schema = require('../schema/faqs.schema.js')
var config_notifications_schema = require('../schema/notifications.schema.js');
var config_notification_emailtemplate_schema = require('../schema/notificationemailtemplate.schema.js');
var wallet_reacharge_schema = require('../schema/wallet.schema.js');
var config_driver_schema = require('../schema/driver.schema.js');
var config_category_schema = require('../schema/category.schema');
var config_restaurant_schema = require('../schema/restaurant.schema');
var config_food_schema = require('../schema/food.schema');
var config_faq_schema = require('../schema/faq-management.schema.js');
var config_cancellation_schema = require('../schema/cancellation.schema');
var config_coupon_schema = require('../schema/coupon.schema');
var config_refer_coupon_schema = require('../schema/refer_coupon.schema');
var config_email_template_schema = require('../schema/emailtemplate.schema.js');
var config_city_schema = require('../schema/city.schema.js');
var orders_schema = require('../schema/orders.schema.js');
var temporders_schema = require('../schema/temporders.schema.js');
var documents_schema = require('../schema/documents.schema.js');
var vehicle_schema = require('../schema/vehicle.schema.js');
var offer_schema = require('../schema/offer.schema.js');
var cuisine_schema = require('../schema/cuisine.schema.js');
var config_categories_schema = require('../schema/categories.schema.js');
var config_cart_schema = require('../schema/cart.schema.js');
var config_temp_cart_schema = require('../schema/temp-cart.schema.js');
var config_temp_payment_schema = require('../schema/temp-payment.schema.js');
var config_transaction_schema = require('../schema/transaction.schema.js');
var config_order_address_schema = require('../schema/order-address.schema.js');
var config_billing_address_schema = require('../schema/Billing-address.schema.js');
var tax_schema = require('../schema/tax.schema.js');
var billing_cycle_schema = require('../schema/billing_cycle.schema.js')
var driver_earnings_schema = require('../schema/driver_earnings.schema.js');
var restaurant_earnings_schema = require('../schema/restaurant_earning.js');
var driver_landing_schema = require('../schema/driver_landing.schema.js');
var driver_wallet_schema = require('../schema/driver_wallet.schema.js');
var restaurant_earning_payout_schema = require('../schema/restaurant_earning_payout.schema.js');
var config_temp_users_schema = require('../schema/temp_user.schema.js');
var config_rcategory_schema = require('../schema/rcategory.schema.js');
var config_scategory_schema = require('../schema/scategory.schema.js');
var config_banner_stype_schema = require('../schema/Banner_type.schema.js');
var config_offer_schema = require('../schema/offer-management.schema.js');
var config_testimonial_schema = require('../schema/testimonial.schema.js');
var config_shipping_schema = require('../schema/shipping-management.schema.js');
var config_rewards_schema = require('../schema/rewards.schema.js');
var config_brands_schema = require('../schema/brands.schema.js');
var config_webbanners_schema = require('../schema/webbanners.schema.js');
var config_mobbanners_schema = require('../schema/mobbanners.schema.js');
var config_favourite_schema = require('../schema/favourite.schema.js');
var config_temp_favourite_schema = require('../schema/temp_favourites.schema.js');

var recently_visit_schema = require('../schema/recently_visit.schema.js');
var subscribe_schema = require('../schema/subscribe.schema.js');
var recent_temp_visit_schema = require('../schema/recently_temp_visit.schema.js');
const walkthrough_images = require('../schema/walkthrough_images.js')
// var checkin_schema = require('../schema/checkin.schema.js')
var tags_schema = require('../schema/tags_schema.js');
var deals_schema = require('../schema/deals_schema.js');
var combo_schema = require('../schema/combo_offer.schema.js');
//new schema for comapny portal
var fleet_schema = require('../schema/fleet.schema.js');
var vendor_schema = require('../schema/vendor.schema.js');
var maintenance_schema = require('../schema/maintenance.schema.js');
var fuel_schema = require('../schema/fuel.schema.js');
var contract_schema = require('../schema/contract.schema.js');
var employee_schema = require('../schema/employee.schema.js');
var invoice_schema = require('../schema/invoice.schema.js');
var attendance_schema = require('../schema/attendance.schema.js');
var sparepart_schema = require('../schema/spareParts.schema.js');
var payment_schema = require('../schema/coustomerVentorPayment.schema.js');
var fleetfleetassignment_schema = require('../schema/fleetassignment.schema.js');
var salary_schema = require('../schema/salary.schema.js');

// define the schema for our user model
var adminSchema = mongoose.Schema(config_admin_schema.ADMIN, { timestamps: true, versionKey: false });
var attributesSchema = mongoose.Schema(config_attributes_schema.ATTRIBUTES, { timestamps: true, versionKey: false });
var timeslotsSchema = mongoose.Schema(config_timeslots_schema.TIMESLOTS, { timestamps: true, versionKey: false });
var userSchema = mongoose.Schema(config_user_schema.USER, { timestamps: true, versionKey: false });
var pageschema = mongoose.Schema(config_pages_schema.PAGES, { timestamps: true, versionKey: false });
var sliderSchema = mongoose.Schema(config_slider_schema.SLIDERS, { timestamps: true, versionKey: false });
var postheaderSchema = mongoose.Schema(config_postheader_schema.POSTHEADER, { timestamps: true, versionKey: false });
var experienceSchema = mongoose.Schema(config_experience_schema.EXPERIENCES, { timestamps: true, versionKey: false });
var questionSchema = mongoose.Schema(config_question_schema.QUESTIONS, { timestamps: true, versionKey: false });
var settingsSchema = mongoose.Schema(config_settings_schema.settings, { timestamps: true, versionKey: false });
var currencySchema = mongoose.Schema(config_settings_schema.currency, { timestamps: true, versionKey: false });
var languagesSchema = mongoose.Schema(config_settings_schema.languages, { timestamps: true, versionKey: false });
var newsletterSchema = mongoose.Schema(config_newsletter_schema.SUBSCRIBER, { timestamps: true, versionKey: false });
var paymentGatewaySchema = mongoose.Schema(config_paymentGateway_schema.PAYMENTGATEWAY, { timestamps: true, versionKey: false });
var imagesSchema = mongoose.Schema(config_images_schema.IMAGES, { timestamps: true, versionKey: false });
var contactusSchema = mongoose.Schema(config_contact_schema.CONTACT, { timestamps: true, versionKey: false });
var ratingsSchema = mongoose.Schema(config_ratings_schema.RATINGS, { timestamps: true, versionKey: false });
var faqsschema = mongoose.Schema(config_faqs_schema.FAQS, { timestamps: true, versionKey: false });

var notificationsSchema = mongoose.Schema(config_notifications_schema.NOTIFICATIONS, { timestamps: true, versionKey: false });
var emailnotificationsSchema = mongoose.Schema(config_notification_emailtemplate_schema.template, { timestamps: true, versionKey: false });
var walletReachargeSchema = mongoose.Schema(wallet_reacharge_schema.WALLET, { timestamps: true, versionKey: false });
var driverSchema = mongoose.Schema(config_driver_schema.DRIVER, { timestamps: true, versionKey: false });
var categorySchema = mongoose.Schema(config_category_schema.CATEGORY, { timestamps: true, versionKey: false });
var restaurantSchema = mongoose.Schema(config_restaurant_schema.RESTAURANT, { timestamps: true, versionKey: false });
var foodSchema = mongoose.Schema(config_food_schema.FOOD, { timestamps: true, versionKey: false });
var faqSchema = mongoose.Schema(config_faq_schema.FAQ, { timestamps: true, versionKey: false });
var returnreasonSchema = mongoose.Schema(return_reason_schema.RETURNREASON, { timestamps: true, versionKey: false })
var cancelationSchema = mongoose.Schema(config_cancellation_schema.CANCELLATION, { timestamps: true, versionKey: false });
var couponSchema = mongoose.Schema(config_coupon_schema.COUPON, { timestamps: true, versionKey: false });
var refercouponSchema = mongoose.Schema(config_refer_coupon_schema.REFER_COUPON, { timestamps: true, versionKey: false });
var emailtemplateSchema = mongoose.Schema(config_email_template_schema.template, { timestamps: true, versionKey: false });
var citySchema = mongoose.Schema(config_city_schema.CITY, { timestamps: true, versionKey: false });
var ordersSchema = mongoose.Schema(orders_schema.ORDERS, { timestamps: true, versionKey: false });
var tempordersSchema = mongoose.Schema(temporders_schema.TEMPORDERS, { timestamps: true, versionKey: false });
var documents_schema = mongoose.Schema(documents_schema.DOCUMENTS, { timestamps: true, versionKey: false });
var vehicle_schema = mongoose.Schema(vehicle_schema.VEHICLE, { timestamps: true, versionKey: false });
var offer_schema = mongoose.Schema(offer_schema.OFFER, { timestamps: true, versionKey: false });
var cuisine_schema = mongoose.Schema(cuisine_schema.CUISINE, { timestamps: true, versionKey: false });
var categoriesSchema = mongoose.Schema(config_categories_schema.CATEGORIES, { timestamps: true, versionKey: false });
var cartSchema = mongoose.Schema(config_cart_schema.CART, { timestamps: true, versionKey: false });
var tempCartSchema = mongoose.Schema(config_temp_cart_schema.CART, { timestamps: true, versionKey: false });
var tempPaymentSchema = mongoose.Schema(config_temp_payment_schema.CART, { timestamps: true, versionKey: false });
var transactionSchema = mongoose.Schema(config_transaction_schema.TRANSACTION, { timestamps: true, versionKey: false });
var OrderAddressSchema = mongoose.Schema(config_order_address_schema.ORDER, { timestamps: true, versionKey: false });
var BillingAddressSchema = mongoose.Schema(config_billing_address_schema.BILLING, { timestamps: true, versionKey: false });
var TaxSchema = mongoose.Schema(tax_schema.TAX, { timestamps: true, versionKey: false });
var billingSchema = mongoose.Schema(billing_cycle_schema.BILLING_CYCLE, { timestamps: true, versionkey: false });
var driverEarningsSchema = mongoose.Schema(driver_earnings_schema.DRIVER_EARNINGS, { timestamps: true, versionkey: false });
var restaurantEarningsSchema = mongoose.Schema(restaurant_earnings_schema.RESTAURANT_EARNINGS, { timestamps: true, versionkey: false });
var driverlandingSchema = mongoose.Schema(driver_landing_schema.LANDING, { timestamps: true, versionkey: false })
var driverWalletSchema = mongoose.Schema(driver_wallet_schema.driver_wallet, { timestamps: true, versionkey: false })
var restaurantEarningPayoutSchema = mongoose.Schema(restaurant_earning_payout_schema.RESTAURANT_EARNING_PAYOUT, { timestamps: true, versionkey: false })
var tempusersSchema = mongoose.Schema(config_temp_users_schema.USER, { timestamps: true, versionKey: false });
var rcategorySchema = mongoose.Schema(config_rcategory_schema.RCAT, { timestamps: true, versionKey: false });
var scategorySchema = mongoose.Schema(config_scategory_schema.SCAT, { timestamps: true, versionKey: false });
var bannerTypeSchema = mongoose.Schema(config_banner_stype_schema.BANNER_TYPE, { timestamps: true, versionKey: false });
var offerSchema = mongoose.Schema(config_offer_schema.OFFER_MANAGEMENT, { timestamps: true, versionKey: false });
var testimonialSchema = mongoose.Schema(config_testimonial_schema.TESTIMONIAL_MANAGEMENT, { timestamps: true, versionKey: false });
var shippingSchema = mongoose.Schema(config_shipping_schema.SHIPPING, { timestamps: true, versionKey: false });
var rewardsSchema = mongoose.Schema(config_rewards_schema.REWARDS, { timestamps: true, versionKey: false });
var brandsSchema = mongoose.Schema(config_brands_schema.BRAND, { timestamps: true, versionKey: false });
var webbannersSchema = mongoose.Schema(config_webbanners_schema.WEBBANNER, { timestamps: true, versionKey: false });
var mobbannersSchema = mongoose.Schema(config_mobbanners_schema.MOBBANNER, { timestamps: true, versionKey: false });
var favouriteschema = mongoose.Schema(config_favourite_schema.FAVOURITE, { timestamps: true, versionKey: false });
var favouritetempschema = mongoose.Schema(config_temp_favourite_schema.TEMP_FAVOURITE, { timestamps: true, versionKey: false });

var recentlyvisitschema = mongoose.Schema(recently_visit_schema.RECENTL_VIST, { timestamps: true, versionKey: false });
const walkthroughimageSchema = mongoose.Schema(walkthrough_images.WALKTHROUGHIMAGE, { timestamps: true, versionKey: false });
var subscribeschema = mongoose.Schema(subscribe_schema.SUBSCRIBE, { timestamps: true, versionkey: false });
var recenttempvisit = mongoose.Schema(recent_temp_visit_schema.RECENT_TEMP_VIST, { timestamps: true, versionkey: false });
var tagsSchema = mongoose.Schema(tags_schema.TAGS, { timestamps: true, versionkey: false });
var dealsSchema = mongoose.Schema(deals_schema.DEALS, { timestamps: true, versionkey: false });
var comboSchema = mongoose.Schema(combo_schema.COMBO, { timestamps: true, versionkey: false });

var fleetSchema = mongoose.Schema(fleet_schema.FLEET, { timestamps: true, versionKey: false });
var vendorSchema = mongoose.Schema(vendor_schema.VENDOR, { timestamps: true, versionKey: false });
var maintenanceSchema = mongoose.Schema(maintenance_schema.MAINTENANCE, { timestamps: true, versionKey: false });
var fuelSchema = mongoose.Schema(fuel_schema.FUEL, { timestamps: true, versionKey: false });
var contractSchema = mongoose.Schema(contract_schema.CONTRACT, { timestamps: true, versionKey: false });
var employeeSchema = mongoose.Schema(employee_schema.EMPLOYEE, { timestamps: true, versionKey: false });
var invoiceSchema = mongoose.Schema(invoice_schema.INVOICE, { timestamps: true, versionKey: false });
var attendanceSchema = mongoose.Schema(attendance_schema.ATTENDANCE, { timestamps: true, versionKey: false });
var sparepartSchema = mongoose.Schema(sparepart_schema.SPAREPART, { timestamps: true, versionKey: false });
var vendorPaymentSchema = mongoose.Schema(payment_schema.VENDOR_PAYMENT, { timestamps: true, versionKey: false });
var customerPaymentSchema = mongoose.Schema(payment_schema.CUSTOMER_PAYMENT, { timestamps: true, versionKey: false });
var fleetAssignmentSchema = mongoose.Schema(fleetfleetassignment_schema.FLEET_ASSIGNMENT, { timestamps: true, versionKey: false });
var salarySchema = mongoose.Schema(salary_schema.SALARY, { timestamps: true, versionKey: false });

// var checkin_schema = mongoose.Schema(checkin_schema.CHECKIN,{timestamps:true,versionkey:false})
/* 


restaurantSchema.post('update', function (doc, next) {
	var editJsonFile = require("edit-json-file");
	this.findOne({}, {}, {readPreference: 'primary'}, function (err, doc) {
		if (err || !doc) {
			next();
		} else {
			if(doc && typeof doc._id != 'undefined'){
				var recordId = doc._id.toString();
				var jsonfile = editJsonFile('./restaurantJson/'+ recordId + '.json', {stringify_width :0.1});
				jsonfile.set("restaurantList",doc);
				jsonfile.set("last_update_timestamp",Date.now());
				jsonfile.save();	
				var jsonfile1 = editJsonFile('restaurantList.json', {stringify_width :0.1});
				var restaurantList = jsonfile1.get('restaurantList');
				if(typeof restaurantList == 'undefined'){
					restaurantList = [];
				}
				var index_posi = restaurantList.map(function (e) {
					return e._id.toString()}).indexOf(recordId);
				if(index_posi != -1){
					restaurantList[index_posi] = doc;
				}else{
					restaurantList.push(doc);
				}
				jsonfile1.set("restaurantList",restaurantList);
				jsonfile1.set("last_update_timestamp",Date.now());
				jsonfile1.save();	
			}
			next();
		}
	});
});
restaurantSchema.post('remove', function (doc, next) {
	var editJsonFile = require("edit-json-file");
	var recordId = doc._id.toString();
	var fs = require('fs');
	var filePath = './restaurantJson/'+ recordId + '.json'; 
	fs.unlinkSync(filePath);
	var jsonfile1 = editJsonFile('restaurantList.json', {stringify_width :0.1});
	var restaurantList = jsonfile1.get('restaurantList');
	if(typeof restaurantList == 'undefined'){
		restaurantList = [];
	}
	var index_posi = restaurantList.map(function (e) {
		return e._id.toString()}).indexOf(recordId);
	if(index_posi != -1){
		restaurantList.splice(index_pos, 1);
	}
	jsonfile1.set("restaurantList",restaurantList);
	jsonfile1.set("last_update_timestamp",Date.now());
	jsonfile1.save();
	next();
});
restaurantSchema.post('save', function (doc, next) {
	var editJsonFile = require("edit-json-file");
	this.constructor.find({_id:doc._id}, {}, {readPreference: 'primary'}, function (err, docments) {
		if (err || !docments) {
			next();
		} else {
			if(docments && docments.length > 0){
				var doc = docments[0];
				var recordId = doc._id.toString();
				var jsonfile = editJsonFile('./restaurantJson/'+ recordId + '.json', {stringify_width :0.1});
				jsonfile.set("restaurantList",doc);
				jsonfile.set("last_update_timestamp",Date.now());
				jsonfile.save();	
				var jsonfile1 = editJsonFile('restaurantList.json', {stringify_width :0.1});
				var restaurantList = jsonfile1.get('restaurantList');
				if(typeof restaurantList == 'undefined'){
					restaurantList = [];
				}
				var index_posi = restaurantList.map(function (e) {
					return e._id.toString()}).indexOf(recordId);
				if(index_posi != -1){
					restaurantList[index_posi] = doc;
				}else{
					restaurantList.push(doc);
				}
				jsonfile1.set("restaurantList",restaurantList);
				jsonfile1.set("last_update_timestamp",Date.now());
				jsonfile1.save();
				next();
			}
		}
	});
});
foodSchema.post('update', function (doc, next) {
	var editJsonFile = require("edit-json-file");
	this.findOne({}, {}, {readPreference: 'primary'}, function (err, doc) {
		if (err || !doc) {
			next();
		} else {
			if(doc && typeof doc._id != 'undefined' && typeof doc.shop != 'undefined' && doc.shop != ''){
				var recordId = doc._id.toString();
				var restaurantId = doc.shop.toString();
				var fs = require('fs');
				if (fs.existsSync('./restaurantJson/'+ restaurantId + '.json')) {
					var jsonfile1 = editJsonFile('./restaurantJson/'+ restaurantId + '.json', {stringify_width :0.1});
					var foodList = jsonfile1.get('foodList');
					if(typeof foodList == 'undefined'){
						foodList = [];
					}
					var index_posi = foodList.map(function (e) {
						return e._id.toString()}).indexOf(recordId);
					if(index_posi != -1){
						foodList[index_posi] = doc;
					}else{
						foodList.push(doc);
					}
					jsonfile1.set("foodList",foodList);
					jsonfile1.set("last_update_timestamp",Date.now());
					jsonfile1.save();
				}
			}
			next();
		}
	});
});
foodSchema.post('remove', function (doc, next) {
	var editJsonFile = require("edit-json-file");
	var recordId = doc._id.toString();
	var restaurantId = doc.shop.toString();
	var fs = require('fs');
	if (fs.existsSync('./restaurantJson/'+ restaurantId + '.json')) {
		var jsonfile1 = editJsonFile('./restaurantJson/'+ restaurantId + '.json', {stringify_width :0.1});
		var foodList = jsonfile1.get('foodList');
		if(typeof foodList == 'undefined'){
			foodList = [];
		}
		var index_posi = foodList.map(function (e) {
			return e._id.toString()}).indexOf(recordId);
		if(index_posi != -1){
			foodList.splice(index_pos, 1);
		}
		jsonfile1.set("foodList",foodList);
		jsonfile1.set("last_update_timestamp",Date.now());
		jsonfile1.save();
	}
	next();
});
foodSchema.post('save', function (doc, next) {
	var editJsonFile = require("edit-json-file");
	this.constructor.find({_id:doc._id}, {}, {readPreference: 'primary'}, function (err, docments) {
		if (err || !docments) {
			next();
		} else {
			if(docments && docments.length > 0){
				var doc = docments[0];
				if(doc && typeof doc._id != 'undefined' && typeof doc.shop != 'undefined' && doc.shop != ''){
					var recordId = doc._id.toString();
					var restaurantId = doc.shop.toString();
					var fs = require('fs');
					if (fs.existsSync('./restaurantJson/'+ restaurantId + '.json')) {
						var jsonfile1 = editJsonFile('./restaurantJson/'+ restaurantId + '.json', {stringify_width :0.1});
						var foodList = jsonfile1.get('foodList');
						if(typeof foodList == 'undefined'){
							foodList = [];
						}
						var index_posi = foodList.map(function (e) {
							return e._id.toString()}).indexOf(recordId);
						if(index_posi != -1){
							foodList[index_posi] = doc;
						}else{
							foodList.push(doc);
						}
						jsonfile1.set("foodList",foodList);
						jsonfile1.set("last_update_timestamp",Date.now());
						jsonfile1.save();
					}
				}
			}
			next();
		}
	});
});
categoriesSchema.post('update', function (doc, next) {
console.log('categoriesSchemas update')
	var editJsonFile = require("edit-json-file");
	this.findOne({}, {}, {readPreference: 'primary'}, function (err, doc) {
		if (err || !doc) {
			next();
		} else {
			if(doc && typeof doc._id != 'undefined'){
				var recordId = doc._id.toString();
				var restaurantId = doc.restaurant.toString();
				var fs = require('fs');
				if (fs.existsSync('./restaurantJson/'+ restaurantId + '.json')) {
					var jsonfile1 = editJsonFile('./restaurantJson/'+ restaurantId + '.json', {stringify_width :0.1});
					jsonfile1.set("last_update_timestamp",Date.now());
					jsonfile1.save();
				}
				var jsonfile = editJsonFile('siteManagement.json', {stringify_width :0.1});
				var categoryList = jsonfile.get('categoryList');
				if(typeof categoryList == 'undefined'){
					categoryList = [];
				}
				var index_posi = categoryList.map(function (e) {
					return e._id.toString()}).indexOf(recordId);
				if(index_posi != -1){
					categoryList[index_posi] = doc;
				}else{
					categoryList.push(doc);
				}
				jsonfile.set("categoryList",categoryList);
				jsonfile.set("last_update_timestamp",Date.now());
				jsonfile.save();
			}
			next();
		}
	});
});
categoriesSchema.post('remove', function (doc, next) {
	console.log('categoriesSchemas remove')
	var editJsonFile = require("edit-json-file");
	var recordId = doc._id.toString();
	var restaurantId = doc.restaurant.toString();
	var fs = require('fs');
	if (fs.existsSync('./restaurantJson/'+ restaurantId + '.json')) {
		var jsonfile1 = editJsonFile('./restaurantJson/'+ restaurantId + '.json', {stringify_width :0.1});
		jsonfile1.set("last_update_timestamp",Date.now());
		jsonfile1.save();
	}
	var jsonfile = editJsonFile('siteManagement.json', {stringify_width :0.1});
	var categoryList = jsonfile.get('categoryList');
	if(typeof categoryList == 'undefined'){
		categoryList = [];
	}
	var index_posi = categoryList.map(function (e) {
		return e._id.toString()}).indexOf(recordId);
	if(index_posi != -1){
		categoryList.splice(index_pos, 1);
	}
	jsonfile.set("categoryList",categoryList);
	jsonfile.set("last_update_timestamp",Date.now());
	jsonfile.save();
	next();
});
categoriesSchema.post('save', function (doc, next) {
	console.log('categoriesSchemas save',doc._id)
	var editJsonFile = require("edit-json-file");
	this.constructor.find({_id:doc._id}, {}, {readPreference: 'primary'}, function (err, docments) {
		if (err || !docments) {
			next();
		} else {
			console.log('docments.length',docments.length)
			if(docments && docments.length > 0){
				var doc = docments[0];
				if(doc && typeof doc._id != 'undefined'){
					var recordId = doc._id.toString();
					var restaurantId = doc.restaurant.toString();
					var fs = require('fs');
					if (fs.existsSync('./restaurantJson/'+ restaurantId + '.json')) {
						var jsonfile1 = editJsonFile('./restaurantJson/'+ restaurantId + '.json', {stringify_width :0.1});
						jsonfile1.set("last_update_timestamp",Date.now());
						jsonfile1.save();
					}
					var jsonfile = editJsonFile('siteManagement.json', {stringify_width :0.1});
					var categoryList = jsonfile.get('categoryList');
					if(typeof categoryList == 'undefined'){
						categoryList = [];
					}
					var index_posi = categoryList.map(function (e) {
						return e._id.toString()}).indexOf(recordId);
					if(index_posi != -1){
						categoryList[index_posi] = doc;
					}else{
						categoryList.push(doc);
					}
					console.log('categoryList',categoryList.length)
					jsonfile.set("categoryList",categoryList);
					jsonfile.set("last_update_timestamp",Date.now());
					jsonfile.save();
				}
			}
			next();
		}
	});
}); */
// generating a hash
userSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

adminSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
adminSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

/* attributesSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
attributesSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

timeslotsSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
timeslotsSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};
 */

// create the model for users and expose it to our app
var admins = mongoose.model('administrators', adminSchema, 'administrators');
var attributes = mongoose.model('attributes', attributesSchema, 'attributes');
var timeslots = mongoose.model('timeslots', timeslotsSchema, 'timeslots');
var users = mongoose.model('users', userSchema, 'users');
var pages = mongoose.model('pages', pageschema, 'pages');
var slider = mongoose.model('sliders', sliderSchema, 'sliders');
var postheader = mongoose.model('postheader', postheaderSchema, 'postheader');
var experience = mongoose.model('experience', experienceSchema, 'experience');
var question = mongoose.model('question', questionSchema, 'question');
var settings = mongoose.model('settings', settingsSchema, 'settings');
var languages = mongoose.model('languages', languagesSchema, 'languages');
var currencies = mongoose.model('currencies', currencySchema, 'currencies');
var newsletter = mongoose.model('newsletter_subscriber', newsletterSchema, 'newsletter_subscriber');
var paymentgateway = mongoose.model('payment_gateway', paymentGatewaySchema, 'payment_gateway');
var images = mongoose.model('images', imagesSchema, 'images');
var contact = mongoose.model('contact', contactusSchema, 'contact');
var ratings = mongoose.model('ratings', ratingsSchema, 'ratings');
var faqs = mongoose.model('faqs', faqsschema, 'faqs')
var notifications = mongoose.model('notifications', notificationsSchema, 'notifications');
var emailnotifications = mongoose.model('email_notifications', emailnotificationsSchema, 'email_notifications');
var walletReacharge = mongoose.model('wallet', walletReachargeSchema, 'wallet');
var drivers = mongoose.model('drivers', driverSchema, 'drivers');
var category = mongoose.model('category', categorySchema, 'category');
var restaurant = mongoose.model('restaurant', restaurantSchema, 'restaurant');
var food = mongoose.model('food', foodSchema, 'food');
var faq = mongoose.model('faq_management', faqSchema, 'faq_management');
var cancellation = mongoose.model('cancellation', cancelationSchema, 'cancellation');
var coupon = mongoose.model('coupon', couponSchema, 'coupon');
var refer_coupon = mongoose.model('refer_coupon', refercouponSchema, 'refer_coupon');
var emailtemplate = mongoose.model('email_template', emailtemplateSchema, 'email_template');
var city = mongoose.model('city', citySchema, 'city');
var orders = mongoose.model('orders', ordersSchema, 'orders');
var returnreason = mongoose.model('returnreason', returnreasonSchema, 'returnreason')
var temporders = mongoose.model('temporders', tempordersSchema, 'temporders');
var documents = mongoose.model('documents', documents_schema, 'documents');
var vehicles = mongoose.model('vehicles', vehicle_schema, 'vehicles');
var offer = mongoose.model('offer', offer_schema, 'offer');
var cuisine = mongoose.model('cuisine', cuisine_schema, 'cuisine');
var categories = mongoose.model('categories', categoriesSchema, 'categories');
var cart = mongoose.model('cart', cartSchema, 'cart');
var temp_cart = mongoose.model('temp_cart', tempCartSchema, 'temp_cart');
var temp_payment = mongoose.model('temp_payment', tempPaymentSchema, 'temp_payment');
var transaction = mongoose.model('transaction', transactionSchema, 'transaction');
var order_address = mongoose.model('order_address', OrderAddressSchema, 'order_address');
var billing_address = mongoose.model('billing_address', BillingAddressSchema, 'billing_address');
var tax = mongoose.model('tax', TaxSchema, 'tax');
var billing = mongoose.model('billing', billingSchema, 'billing');
var driver_earnings = mongoose.model('driver_earnings', driverEarningsSchema, 'driver_earnings');
var restaurant_earnings = mongoose.model('restaurant_earnings', restaurantEarningsSchema, 'restaurant_earnings');
var driver_landing = mongoose.model('driver_landing', driverlandingSchema, 'driver_landing');
var driver_wallet = mongoose.model('driver_wallet', driverWalletSchema, 'driver_wallet');
var restaurant_payout = mongoose.model('restaurant_payout', restaurantEarningPayoutSchema, 'restaurant_payout');
var temp_users = mongoose.model('temp_users', tempusersSchema, 'temp_users');
var rcategory = mongoose.model('rcategory', rcategorySchema, 'rcategory');
var scategory = mongoose.model('scategory', scategorySchema, 'scategory');
var bannertype = mongoose.model('bannertype', bannerTypeSchema, 'bannertype');
var offer = mongoose.model('offermanagement', offerSchema, 'offermanagement');
var testimonial = mongoose.model('testimonial', testimonialSchema, 'testimonial');
var shipping = mongoose.model('shipping', shippingSchema, 'shipping');
var rewards = mongoose.model('rewards', rewardsSchema, 'rewards');
var brands = mongoose.model('brands', brandsSchema, 'brands');
var webbanners = mongoose.model('webbanners', webbannersSchema, 'webbanners');
var mobbanners = mongoose.model('mobbanners', mobbannersSchema, 'mobbanners');
var favourite = mongoose.model('favourite', favouriteschema, 'favourite');
var temp_favourite = mongoose.model('temp_favourite', favouritetempschema, 'temp_favourite');

var recently_visit = mongoose.model('recently_visit', recentlyvisitschema, 'recently_visit');
var subscribe = mongoose.model('subscribe', subscribeschema, 'subscribe');
var recent_temp_visit = mongoose.model('recent_temp_visit', recenttempvisit, 'recent_temp_visit');
const walkthroughimages = mongoose.model('walkthroughimages', walkthroughimageSchema, 'walkthroughimages')
var fleet = mongoose.model('fleet', fleetSchema, 'fleet');
var vendor = mongoose.model('vendor', vendorSchema, 'vendor');
var maintenance = mongoose.model('maintenance', maintenanceSchema, 'maintenance');
var fuel = mongoose.model('fuel', fuelSchema, 'fuel');
var contract = mongoose.model('contract', contractSchema, 'contract');
var employee = mongoose.model('employee', employeeSchema, 'employee');
var invoice = mongoose.model('invoice', invoiceSchema, 'invoice');
var attendance = mongoose.model('attendance', attendanceSchema, 'attendance');
var sparepart = mongoose.model('sparepart', sparepartSchema, 'sparepart');
var vendorPayment = mongoose.model('vendorPayment', vendorPaymentSchema, 'vendorPayment');
var customerPayment = mongoose.model('customerPayment', customerPaymentSchema, 'customerPayment');
var fleetAssignment = mongoose.model('fleetAssignment', fleetAssignmentSchema, 'fleetAssignment');
var salary = mongoose.model('salary', salarySchema, 'salary');
// var checkin = mongoose.model('checkin',checkin_schema,'checkin');
const tags = mongoose.model('tags', tagsSchema, 'tags');
const deals = mongoose.model('deals', dealsSchema, 'deals');
const combo = mongoose.model('combo', comboSchema, 'combo');


module.exports = {
	'admins': admins,
	'attributes': attributes,
	'timeslots': timeslots,
	'users': users,
	'pages': pages,
	'slider': slider,
	'postheader': postheader,
	'experience': experience,
	'question': question,
	'settings': settings,
	'languages': languages,
	'currencies': currencies,
	'newsletter': newsletter,
	'paymentgateway': paymentgateway,
	'images': images,
	'contact': contact,
	'ratings': ratings,
	'faqs': faqs,
	'walletReacharge': walletReacharge,
	'notifications': notifications,
	'emailnotifications': emailnotifications,
	'drivers': drivers,
	'category': category,
	'restaurant': restaurant,
	'food': food,
	'faq': faq,
	'cancellation': cancellation,
	'coupon': coupon,
	'refer_coupon': refer_coupon,
	'emailtemplate': emailtemplate,
	'city': city,
	'orders': orders,
	'returnreason': returnreason,
	'temporders': temporders,
	'documents': documents,
	'vehicles': vehicles,
	'offer': offer,
	'testimonial': testimonial,
	'cuisine': cuisine,
	'categories': categories,
	'cart': cart,
	'temp_cart': temp_cart,
	'transaction': transaction,
	'order_address': order_address,
	'billing_address': billing_address,
	'tax': tax,
	'billing': billing,
	'driver_earnings': driver_earnings,
	'restaurant_earnings': restaurant_earnings,
	'temp_payment': temp_payment,
	'driver_landing': driver_landing,
	'driver_wallet': driver_wallet,
	'restaurant_payout': restaurant_payout,
	'temp_users': temp_users,
	'rcategory': rcategory,
	'scategory': scategory,
	'shipping': shipping,
	'brands': brands,
	'rewards': rewards,
	'webbanners': webbanners,
	'mobbanners': mobbanners,
	'favourite': favourite,
	'temp_favourite':temp_favourite,
	'recently_visit': recently_visit,
	'subscribe': subscribe,
	'recent_temp_visit': recent_temp_visit,
	'walkthroughimages': walkthroughimages,
	"bannertype": bannertype,
	'tags': tags,
	'deals': deals,
	'combo': combo,
	'offermanagement': offer,


	//new schema for company portal
	'fleet': fleet,
	'vendor': vendor,
	'maintenance': maintenance,
	'fuel': fuel,
	'contract': contract,
	'employee': employee,
	'invoice': invoice,
	'attendance': attendance,
	'sparepart': sparepart,
	'vendorPayment': vendorPayment,
	'customerPayment': customerPayment,
	'fleetAssignment': fleetAssignment,
	'salary': salary
	// 'checkin':checkin
};
