var express = require('express');
var moment = require('moment');
var mongoose = require('mongoose');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
var CronJob = require('node-cron');
var db = require('../controller/adaptor/mongodb.js');
var async = require("async");
var each = require('sync-each');
var mail = require('../model/mail.js');
var email = require('../controller/site/payment.js');
var mailcontent = require('../model/mailcontent.js');
var timezone = require('moment-timezone');
var CONFIG = require('../config/config');
var stripe = require('stripe')('');
var urlrequest = require('request');
var shiprocket = require('../controller/admin/users.js')
module.exports = function (io, app) {
	var push = require('../model/pushNotification.js')(io);
	var shiprocket = require('../controller/admin/users.js')(io)

	var job = CronJob.schedule('*/1 * * * *', async () => {
		orderTimeout();
		userRefer();
	})

	CronJob.schedule('0 0 * * *', async () => {
		console.log('--- Running Daily Attendance Marking Cron Job ---');
		try {
			const today = new Date();
			const todayDate = new Date(today.toISOString().split("T")[0]); // normalize date

			// Fetch all active employees
			const employees = await db.GetDocument("employee", { status: 1 }, {}, {});
			if (!employees.doc || !employees.doc.length) {
				console.log("No active employees found for attendance.");
				return;
			}

			// Loop and insert/update attendance
			// 1. Remove existing record for today (if any) to avoid duplicates
			const operations = employees.doc.map((emp) => ({
				updateOne: {
					filter: { employee: emp._id },
					update: {
						$setOnInsert: { employee: emp._id },
						$pull: { records: { date: todayDate } },
					},
					upsert: true,
				},
			}));
			await db.BulkWrite("attendance", operations);

			// 2. Loop and push new record
			const pushOps = employees.doc.map((emp) => {
				let status = "P";
				let remarks = "Auto-marked by System";

				// Check if employee is on vacation today
				if (emp.vacations && emp.vacations.length > 0) {
					for (const vacation of emp.vacations) {
						const startDate = new Date(vacation.startDate);
						const endDate = new Date(vacation.endDate);
						const checkDate = new Date(todayDate);

						// Reset time parts to ensure accurate date comparison
						startDate.setHours(0, 0, 0, 0);
						endDate.setHours(0, 0, 0, 0);
						checkDate.setHours(0, 0, 0, 0);

						if (checkDate >= startDate && checkDate <= endDate) {
							status = vacation.type === "Sick Leave" ? "SL" : "V";
							remarks = vacation.remarks || (status === "SL" ? "Sick Leave" : "Vacation");
							break; // Found a matching vacation, stop checking
						}
					}
				}

				return {
					updateOne: {
						filter: { employee: emp._id },
						update: {
							$push: {
								records: {
									date: todayDate,
									status: status,
									remarks: remarks
								}
							},
						},
					},
				};
			});
			await db.BulkWrite("attendance", pushOps);

			console.log(`✅ Automatically marked ${employees.doc.length} employees with Present/Vacation/Sick Leave.`);

		} catch (error) {
			console.error('--- CRON JOB FAILED: Daily Attendance Marking ---', error);
		}
	}, {
		scheduled: true,
		timezone: "Asia/Kolkata"
	});

	CronJob.schedule('0 1 1 * *', async () => {
		console.log('--- Running Monthly Salary Generation Cron Job ---');
		try {
			const today = new Date();
			// Calculate the previous month
			const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			const year = prevMonthDate.getFullYear();
			const month = prevMonthDate.getMonth() + 1; // 1-12

			// Fetch active employees
			const activeEmployeesResult = await db.GetDocument("employee", { status: 1 }, {}, {});
			const activeEmployees = activeEmployeesResult.doc || []; // Ensure it's an array

			if (activeEmployees.length === 0) {
				console.log('No active employees found. Exiting job.');
				return;
			}

			for (const employee of activeEmployees) {
				// 1. Check if salary for this period already exists
				const existingSalary = await db.GetOneDocument("salary", { employee: employee._id, month, year }, {}, {});
				if (existingSalary.doc && existingSalary.status) {
					console.log(`Salary for ${employee.fullName} for ${month}/${year} already exists. Skipping.`);
					continue;
				}

				// 2. Get attendance for the previous month
				const attendanceResult = await db.GetOneDocument("attendance", { employee: employee._id }, {}, {});
				const attendanceData = attendanceResult.doc;

				let daysPresent = 0;
				// Total days in the previous month
				const totalWorkingDays = new Date(year, month, 0).getDate();

				// 3. Robustly check for the attendance records array
				if (attendanceData && Array.isArray(attendanceData.records)) {
					const monthRecords = attendanceData.records.filter(r => {
						// Safety check for date property existence
						if (!r.date) return false;

						const recordDate = new Date(r.date);
						return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
					});
					daysPresent = monthRecords.filter(r => r.status === 'P').length;
				} else {
					// This handles new employees or employees with empty/missing attendance documents gracefully
					console.log(`No attendance records or invalid records array found for ${employee.fullName}. Days present defaults to 0.`);
				}

				// 4. Calculate final salary
				const baseSalary = employee.salary || 0;
				const finalSalary = (baseSalary / totalWorkingDays) * daysPresent;

				const newSalary = {
					employee: employee._id,
					month,
					year,
					baseSalary,
					daysPresent,
					totalWorkingDays,
					finalSalary: parseFloat(finalSalary.toFixed(2)),
					totalEarnings: parseFloat(finalSalary.toFixed(2)),
				};

				await db.InsertDocument("salary", newSalary);
				console.log(`Created salary record for ${employee.fullName} for ${month}/${year}. Salary: ${newSalary.finalSalary}.`);
			}
		} catch (error) {
			console.error('--- CRON JOB FAILED: Monthly Salary Generation ---', error);
		}
	}, {
		scheduled: true,
		timezone: "Asia/Kolkata" // Set your timezone
	});
	//'0 0 * * *'      "*/20 * * * * *"

	const jobalert = CronJob.schedule('0 0 * * *', async () => {
		generateFleetAlerts();
		generateEmployeeAlerts();
		generatePaymentAlerts();

	}, {
		scheduled: true,
		timezone: "Asia/Kolkata" // or your specific timezone
	});

	// var orderStatus = CronJob.schedule('0 * * * *', async () => {
	// 	console.log('Running scheduled task to update Shiprocket status for orders...');
	// 	try {
	// 		// Ensure the router function is invoked correctly
	// 		// await shiprocket.shiprocket_check_multiple_orders_status();
	// 	} catch (error) {
	// 		console.error('Error during cron job execution:', error);
	// 	}
	// });


	// orderStatus.start()

	// var job = new CronJob({
	// 	cronTime: '*/1 * * * *', //Daily Cron Check @ 00:00
	// 	onTick: function () {
	// 		orderTimeout();
	// 		userRefer();
	// 	},
	// 	start: false,
	// 	//timeZone: 'America/Los_Angeles'
	// });
	var job1 = CronJob.schedule('*/15 * * * * *', async () => {
		orderTimeoutAlert();
		//timeZone: 'America/Los_Angeles'
	});
	var job2 = CronJob.schedule('* 10 */2 * * ', async () => {
		subscribeUserSendMail()
		//timeZone: 'America/Los_Angeles'
	});
	function orderTimeoutAlert() {
		db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
			if (err || !settings) {
			} else {
				var reminder = parseInt(settings.settings.time_out);
				var restaurant_alert_time = 0;
				if (typeof settings.settings.restaurant_alert_time != 'undefined') {
					restaurant_alert_time = parseInt(settings.settings.restaurant_alert_time);
				}
				if (restaurant_alert_time > 0) {
					db.GetDocument('orders', { restaurant_time_out_alert: 0, $or: [{ "status": 1 }, { "status": 15 }] }, {}, {}, function (err, orders) {
						if (err || !orders) {
						} else {
							if (orders.length > 0) {
								each(orders, function (ordersDetails, next) {
									var currentTime = Date.now();
									if (typeof ordersDetails.created_time != 'undefined') {
										var order_ids = ordersDetails.order_id;
										var different = currentTime - ordersDetails.schedule_time;
										if (!ordersDetails.schedule_type || ordersDetails.schedule_type == 0) {
											different = currentTime - ordersDetails.created_time;
										}
										var currentTime = Date.now();
										var option_time = (reminder * 60 * 1000 - restaurant_alert_time * 60 * 1000);
										var option_time1 = reminder * 60 * 1000;
										if ((different > option_time) && (different < option_time1)) {
											db.UpdateDocument('orders', { 'order_id': order_ids }, { restaurant_time_out_alert: 1 }, {}, function (err, response) {
												var noti_data = {};
												noti_data.rest_id = ordersDetails.restaurant_id;
												noti_data.order_id = ordersDetails.order_id;
												noti_data.user_id = ordersDetails.user_id;
												noti_data._id = ordersDetails._id;
												noti_data.order_type = ordersDetails.order_type;
												io.of('/chat').in(ordersDetails.restaurant_id).emit('restordertimeoutnotify', { restauranId: noti_data });
												io.of('/chat').in(ordersDetails.user_id).emit('userordertimeoutnotify', noti_data);
												io.of('/chat').emit('adminordertimeoutnotify', noti_data);
												next();
											})
										}
									} else {
										next();
									}
								}, function (err, transformedItems) {

								});
							}
						}
					})
				}
			}
		});
	}

	job1.start();
	function orderTimeout() {
		db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
			if (err || !settings) {
			} else {
				var reminder = parseInt(settings.settings.time_out);
				var restaurant_alert_time = 0;
				if (typeof settings.settings.restaurant_alert_time != 'undefined') {
					restaurant_alert_time = parseInt(settings.settings.restaurant_alert_time);
				}
				db.GetDocument('orders', { $or: [{ "status": 1 }, { "status": 15 }] }, {}, {}, function (err, orders) {
					if (err || !orders) {
					} else {
						if (orders.length > 0) {
							each(orders, function (ordersDetails, next) {
								console.log("ordersDetails.notify", ordersDetails.notify)
								if (typeof ordersDetails != 'undefined' && typeof ordersDetails.created_time != 'undefined') {
									var order_ids = ordersDetails.order_id;
									var currentTime = Date.now();
									var different = currentTime - ordersDetails.created_time;
									var option_time = reminder * 60 * 1000;
									if (!ordersDetails.schedule_type || ordersDetails.schedule_type == 0) {
										if (different > option_time) {
											db.GetOneDocument('transaction', { "_id": ordersDetails.transaction_id, mode: 'charge' }, {}, {}, function (err, transactionDetails) {
												if (err || !transactionDetails) {
													next();
												} else {
													db.GetOneDocument('city', { _id: ordersDetails.city_id }, {}, {}, function (err, rest) {
														if (err || !rest) {
															next();
														} else {
															db.GetOneDocument('users', { _id: ordersDetails.user_id }, {}, {}, function (err, user) {
																if (err || !user) {
																	next();
																} else {
																	if (transactionDetails.type == 'stripe') {
																		db.GetOneDocument('paymentgateway', { status: { $eq: 1 }, alias: 'stripe' }, {}, {}, function (err, paymentgateway) {
																			if (err || !paymentgateway || !paymentgateway.settings || !paymentgateway.settings.secret_key) {
																				next();
																			} else {
																				stripe.setApiKey(paymentgateway.settings.secret_key);
																				var charge_index = transactionDetails.transactions.map(function (e) { return e.gateway_response.object }).indexOf('charge');
																				if (charge_index != -1) {
																					var charge_id = transactionDetails.transactions[charge_index].gateway_response.id;
																					stripe.refunds.create({
																						charge: charge_id,
																					}, function (err, refund) {
																						if (err) {
																							if (typeof err.raw != 'undefined' && typeof err.raw.type != 'undefined') {
																								if (err.raw.type == 'invalid_request_error') {
																									db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', repay: 1 }, {}, function (err, response) {
																									});
																								}
																							}
																							next();
																						} else {
																							db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																								if (err || response.nModified == 0) {
																									next();
																								} else {
																									var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: refund } } };
																									db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																										if (err || responses.nModified == 0) {
																											next();
																										} else {
																											var android_user = user._id;
																											var rest_name = rest.restaurantname;
																											var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																											var response_time = 250;
																											var options = [order_ids, android_user];
																											for (var i = 1; i == 1; i++) {
																												push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																												});
																											}
																											var noti_data = {};
																											noti_data.rest_id = ordersDetails.restaurant_id;
																											noti_data.order_id = ordersDetails.order_id;
																											noti_data.user_id = ordersDetails.user_id;
																											noti_data._id = ordersDetails._id;
																											noti_data.user_name = user.username;
																											noti_data.order_type = 'order_rejected';
																											io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																											io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																											io.of('/chat').emit('adminnotify', noti_data);
																											io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																											next();
																										}
																									})
																								}
																							})
																						}
																					})
																				} else {
																					next();
																				}
																			}
																		})
																	} else if (transactionDetails.type == 'paypal') {
																		var charge_index = transactionDetails.transactions.map(function (e) { return e.gateway_response.intent }).indexOf('authorize');
																		if (charge_index != -1) {
																			if (typeof transactionDetails.transactions[charge_index].gateway_response.transactions != 'undefined' && transactionDetails.transactions[charge_index].gateway_response.transactions.length > 0 && typeof transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources != 'undefined' && transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources.length > 0 && typeof transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources[0].authorization != 'undefined') {
																				var authorization_id = transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources[0].authorization.id;
																				var api = require('paypal-rest-sdk');
																				api.authorization.void(authorization_id, function (error, refund) {
																					if (error) {
																						next();
																					} else {
																						db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																							if (err || response.nModified == 0) {
																								next();
																							} else {
																								var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: refund } } };
																								db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																									if (err || responses.nModified == 0) {
																										next();
																									} else {
																										var android_user = user._id;
																										var rest_name = rest.restaurantname;
																										var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																										var response_time = 250;
																										var options = [order_ids, android_user];
																										for (var i = 1; i == 1; i++) {
																											push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																											});
																										}
																										var noti_data = {};
																										noti_data.rest_id = ordersDetails.restaurant_id;
																										noti_data.order_id = ordersDetails.order_id;
																										noti_data.user_id = ordersDetails.user_id;
																										noti_data._id = ordersDetails._id;
																										noti_data.user_name = user.username;
																										noti_data.order_type = 'order_rejected';
																										io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																										io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																										io.of('/chat').emit('adminnotify', noti_data);
																										io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																										next();
																									}
																								})
																							}
																						})
																					}
																				})
																			} else {
																				next();
																			}
																		} else {
																			next();
																		}
																	} else if (transactionDetails.type == 'nopayment') {
																		db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																			if (err || response.nModified == 0) {
																				next();
																			} else {
																				var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: refund } } };
																				db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																					if (err || responses.nModified == 0) {
																						next();
																					} else {
																						var android_user = user._id;
																						var rest_name = rest.restaurantname;
																						var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																						var response_time = 250;
																						var options = [order_ids, android_user];
																						for (var i = 1; i == 1; i++) {
																							push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																							});
																						}
																						var noti_data = {};
																						noti_data.rest_id = ordersDetails.restaurant_id;
																						noti_data.order_id = ordersDetails.order_id;
																						noti_data.user_id = ordersDetails.user_id;
																						noti_data._id = ordersDetails._id;
																						noti_data.user_name = user.username;
																						noti_data.order_type = 'order_rejected';
																						io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																						io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																						io.of('/chat').emit('adminnotify', noti_data);
																						io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																						next();
																					}
																				})
																			}
																		})
																	} else if (transactionDetails.type == 'COD') {
																		db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																			if (err || response.nModified == 0) {
																				next();
																			} else {
																				var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: 'refund' } } };
																				db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																					if (err || responses.nModified == 0) {
																						next();
																					} else {
																						var android_user = user._id;
																						var rest_name = rest.restaurantname;
																						var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																						var response_time = 250;
																						var options = [order_ids, android_user];
																						// for (var i = 1; i == 1; i++) {
																						// 	push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																						// 	});
																						// }
																						var noti_data = {};
																						noti_data.rest_id = ordersDetails.city_id;
																						noti_data.order_id = ordersDetails.order_id;
																						noti_data.user_id = ordersDetails.user_id;
																						noti_data._id = ordersDetails._id;
																						noti_data.user_name = user.username;
																						noti_data.order_type = 'order_rejected';
																						//io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																						io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																						io.of('/chat').emit('adminnotify', noti_data);
																						io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																						if (typeof ordersDetails.refer_offer != "undefined" && typeof ordersDetails.refer_offer.expire_date != "undefined") {
																							var refer_offer = ordersDetails.refer_offer;
																							db.UpdateDocument('users', { '_id': ordersDetails.user_id }, { $push: { refer_activity: refer_offer } }, {}, function (err, referrer) { });
																						}


																						next();
																					}
																				})
																			}
																		})
																	} else if (transactionDetails.type == 'cashfree') {
																		db.GetOneDocument('paymentgateway', { status: { $eq: 1 }, alias: 'cashfree' }, {}, {}, function (err, paymentgateway) {
																			if (err || !paymentgateway) {
																				next();
																			} else {
																				let url = '';
																				if (paymentgateway.settings.mode == "live") {
																					url = "https://api.cashfree.com/api/v1/order/refund";
																				} else {
																					url = "https://test.cashfree.com/api/v1/order/refund";
																				}
																				var options = {
																					'method': 'POST',
																					'url': url,
																					'headers': {
																						'Content-Type': 'application/x-www-form-urlencoded'
																					},
																					form: {
																						'appId': paymentgateway.settings.app_key,
																						'secretKey': paymentgateway.settings.secret_key,
																						'referenceId': transactionDetails.transactions[0].gateway_response.referenceId,
																						'refundAmount': transactionDetails.amount,
																						'refundNote': 'Cancelled due to timeout.'
																					}
																				};
																				urlrequest(options, async (error, response) => {
																					let respo = JSON.parse(response.body) // { message: 'Refund has been initiated.', refundId: 5659, status: 'OK' }
																					if (error || !response || !respo || !respo.status || respo.status != "OK" || respo.status == "ERROR") {
																						next();
																					} else {
																						db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																							if (err || response.nModified == 0) {
																								next();
																							} else {
																								var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response_refund: respo } } };
																								db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																									if (err || responses.nModified == 0) {
																										next();
																									} else {
																										var android_user = user._id;
																										var rest_name = rest.restaurantname;
																										var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																										var response_time = 250;
																										var options = [order_ids, android_user];
																										// for (var i = 1; i == 1; i++) {
																										// 	push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																										// 	});
																										// }
																										var noti_data = {};
																										noti_data.rest_id = ordersDetails.city_id;
																										noti_data.order_id = ordersDetails.order_id;
																										noti_data.user_id = ordersDetails.user_id;
																										noti_data._id = ordersDetails._id;
																										noti_data.user_name = user.username;
																										noti_data.order_type = 'order_rejected';
																										//io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																										io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																										io.of('/chat').emit('adminnotify', noti_data);
																										io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																										next();
																									}
																								})
																							}
																						})
																					}
																				})
																			}
																		})
																	} else {
																		next();
																	}
																}
															})
														}
													})
												}
											})
										} else {
											next();
										}
									} else {
										var different = currentTime - ordersDetails.schedule_time;
										if (different > option_time) {
											db.GetOneDocument('transaction', { "_id": ordersDetails.transaction_id, mode: 'charge' }, {}, {}, function (err, transactionDetails) {
												if (err || !transactionDetails) {
													next();
												} else {
													db.GetOneDocument('city', { _id: ordersDetails.city_id }, {}, {}, function (err, rest) {
														if (err || !rest) {
															next();
														} else {
															db.GetOneDocument('users', { _id: ordersDetails.user_id }, {}, {}, function (err, user) {
																if (err || !user) {
																	next();
																} else {
																	if (transactionDetails.type == 'stripe') {
																		db.GetOneDocument('paymentgateway', { status: { $eq: 1 }, alias: 'stripe' }, {}, {}, function (err, paymentgateway) {
																			if (err || !paymentgateway || !paymentgateway.settings || !paymentgateway.settings.secret_key) {
																				next();
																			} else {
																				stripe.setApiKey(paymentgateway.settings.secret_key);
																				var charge_index = transactionDetails.transactions.map(function (e) { return e.gateway_response.object }).indexOf('charge');
																				if (charge_index != -1) {
																					var charge_id = transactionDetails.transactions[charge_index].gateway_response.id;
																					stripe.refunds.create({
																						charge: charge_id,
																					}, function (err, refund) {
																						if (err) {
																							if (typeof err.raw != 'undefined' && typeof err.raw.type != 'undefined') {
																								if (err.raw.type == 'invalid_request_error') {
																									db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', repay: 1, cancel_due_to: '0' }, {}, function (err, response) {
																									});
																								}
																							}
																							next();
																						} else {
																							db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																								if (err || response.nModified == 0) {
																									next();
																								} else {
																									var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: refund } } };
																									db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																										if (err || responses.nModified == 0) {
																											next();
																										} else {
																											var android_user = user._id;
																											var rest_name = rest.restaurantname;
																											var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																											var response_time = 250;
																											var options = [order_ids, android_user];
																											for (var i = 1; i == 1; i++) {
																												push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																												});
																											}
																											var noti_data = {};
																											noti_data.rest_id = ordersDetails.restaurant_id;
																											noti_data.order_id = ordersDetails.order_id;
																											noti_data.user_id = ordersDetails.user_id;
																											noti_data._id = ordersDetails._id;
																											noti_data.user_name = user.username;
																											noti_data.order_type = 'order_rejected';
																											io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																											io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																											io.of('/chat').emit('adminnotify', noti_data);
																											io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																											next();
																										}
																									})
																								}
																							})
																						}
																					})
																				} else {
																					next();
																				}
																			}
																		})
																	} else if (transactionDetails.type == 'paypal') {
																		var charge_index = transactionDetails.transactions.map(function (e) { return e.gateway_response.intent }).indexOf('authorize');
																		if (charge_index != -1) {
																			if (typeof transactionDetails.transactions[charge_index].gateway_response.transactions != 'undefined' && transactionDetails.transactions[charge_index].gateway_response.transactions.length > 0 && typeof transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources != 'undefined' && transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources.length > 0 && typeof transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources[0].authorization != 'undefined') {
																				var authorization_id = transactionDetails.transactions[charge_index].gateway_response.transactions[0].related_resources[0].authorization.id;
																				var api = require('paypal-rest-sdk');
																				api.authorization.void(authorization_id, function (error, refund) {
																					if (error) {
																						next();
																					} else {
																						db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																							if (err || response.nModified == 0) {
																								next();
																							} else {
																								var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: refund } } };
																								db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																									if (err || responses.nModified == 0) {
																										next();
																									} else {
																										var android_user = user._id;
																										var rest_name = rest.restaurantname;
																										var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																										var response_time = 250;
																										var options = [order_ids, android_user];
																										for (var i = 1; i == 1; i++) {
																											push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																											});
																										}
																										var noti_data = {};
																										noti_data.rest_id = ordersDetails.restaurant_id;
																										noti_data.order_id = ordersDetails.order_id;
																										noti_data.user_id = ordersDetails.user_id;
																										noti_data._id = ordersDetails._id;
																										noti_data.user_name = user.username;
																										noti_data.order_type = 'order_rejected';
																										io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																										io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																										io.of('/chat').emit('adminnotify', noti_data);
																										io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																										next();
																									}
																								})
																							}
																						})
																					}
																				})
																			} else {
																				next();
																			}
																		} else {
																			next();
																		}
																	} else if (transactionDetails.type == 'nopayment') {
																		db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																			if (err || response.nModified == 0) {
																				next();
																			} else {
																				var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: refund } } };
																				db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																					if (err || responses.nModified == 0) {
																						next();
																					} else {
																						var android_user = user._id;
																						var rest_name = rest.restaurantname;
																						var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																						var response_time = 250;
																						var options = [order_ids, android_user];
																						for (var i = 1; i == 1; i++) {
																							push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																							});
																						}
																						var noti_data = {};
																						noti_data.rest_id = ordersDetails.restaurant_id;
																						noti_data.order_id = ordersDetails.order_id;
																						noti_data.user_id = ordersDetails.user_id;
																						noti_data._id = ordersDetails._id;
																						noti_data.user_name = user.username;
																						noti_data.order_type = 'order_rejected';
																						io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																						io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																						io.of('/chat').emit('adminnotify', noti_data);
																						io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																						next();
																					}
																				})
																			}
																		})
																	} else if (transactionDetails.type == 'COD') {
																		db.UpdateDocument('orders', { 'order_id': order_ids }, { status: 2, cancellationreason: 'Cancelled due to timeout.', cancel_due_to: '0' }, {}, function (err, response) {
																			if (err || response.nModified == 0) {
																				next();
																			} else {
																				var updatedoc = { 'mode': 'refund', $push: { 'transactions': { gateway_response: 'refund' } } };
																				db.UpdateDocument('transaction', { '_id': ordersDetails.transaction_id }, updatedoc, {}, function (err, responses) {
																					if (err || responses.nModified == 0) {
																						next();
																					} else {
																						var android_user = user._id;
																						var rest_name = rest.cityname;
																						var message = rest_name + ' ' + CONFIG.NOTIFICATION.RESTAURANT_FAILED;
																						var response_time = 250;
																						var options = [order_ids, android_user];
																						// for (var i = 1; i == 1; i++) {
																						// 	push.sendPushnotification(android_user, message, 'order_failed', 'ANDROID', options, 'USER', function (err, response, body) {
																						// 	});
																						// }
																						var noti_data = {};
																						noti_data.rest_id = ordersDetails.city_id;
																						noti_data.order_id = ordersDetails.order_id;
																						noti_data.user_id = ordersDetails.user_id;
																						noti_data._id = ordersDetails._id;
																						noti_data.user_name = user.username;
																						noti_data.order_type = 'order_rejected';
																						//io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
																						io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
																						io.of('/chat').emit('adminnotify', noti_data);
																						io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
																						if (typeof ordersDetails.refer_offer != "undefined" && typeof ordersDetails.refer_offer.expire_date != "undefined") {
																							var refer_offer = ordersDetails.refer_offer;
																							db.UpdateDocument('users', { '_id': ordersDetails.user_id }, { $push: { refer_activity: refer_offer } }, {}, function (err, referrer) { });
																						}

																						next();
																					}
																				})
																			}
																		})
																	} else {
																		next();
																	}
																}
															})
														}
													})
												}
											})
										} else if (different > 0 && (!ordersDetails.notify || ordersDetails.notify == 0)) {
											console.log('inside notify')
											db.UpdateDocument('orders', { 'order_id': order_ids }, { notify: 1 }, {}, function (err, response) {
												if (err || response.nModified == 0) {
													next();
												} else {
													db.GetOneDocument('users', { _id: ordersDetails.user_id, status: { $eq: 1 } }, {}, {}, function (err, user) {
														if (err || !user) {
															next();
														} else {
															var android_restaurant = ordersDetails.restaurant_id;
															var message = CONFIG.NOTIFICATION.ORDER_RECEIVED;
															var response_time = CONFIG.respond_timeout;
															var action = 'order_request';
															var options = [ordersDetails.order_id, android_restaurant, response_time, action];
															// for (var i = 1; i == 1; i++) {
															// 	push.sendPushnotification(android_restaurant, message, 'order_request', 'ANDROID', options, 'RESTAURANT', function (err, response, body) { });
															// }
															var mail_data = {};
															mail_data.user_id = ordersDetails.user_id;
															mail_data.order_id = ordersDetails._id;
															email.res_send(mail_data, function (result) { });
															var mail_data = {};
															mail_data.user_id = ordersDetails.user_id;
															mail_data.order_id = ordersDetails._id;
															email.admin_send(mail_data, function (result) { });
															var noti_data = {};
															noti_data.rest_id = ordersDetails.restaurant_id;
															noti_data.order_id = ordersDetails.order_id;
															noti_data.user_id = ordersDetails.user_id;
															noti_data._id = ordersDetails._id;
															noti_data.user_name = user.username;
															noti_data.order_type = 'user';
															//io.of('/chat').in(ordersDetails.restaurant_id).emit('restnotify', { restauranId: noti_data });
															io.of('/chat').in(ordersDetails.user_id).emit('usernotify', noti_data);
															io.of('/chat').emit('adminnotify', noti_data);
															io.of('/chat').in(ordersDetails._id).emit('OrderUpdated', { orderId: ordersDetails._id });
															next();
														}
													});
												}
											});
										} else {
											next();
										}
									}
								} else {
									next();
								}
							}, function (err, transformedItems) {

							});
						}
					}
				})
			}
		});
	}

	function userRefer() {
		db.GetDocument('users', { $or: [{ "status": 1 }, { "status": 15 }] }, {}, {}, function (err, users) {
			if (err || !users) {
			} else {
				if (users.length > 0) {
					each(users, function (userdata, next) {
						if (userdata.initoffer != undefined || (typeof userdata.refer_activity != undefined && userdata.refer_activity.length > 0)) {
							var currentTime = Date.now();
							if (userdata.initoffer && userdata.initoffer.expire_date < currentTime) {
								db.UpdateDocument('users', { '_id': userdata._id }, { $unset: { initoffer: "" } }, {}, function (err, referrer) { });
							}
							if (userdata.refer_activity != undefined && userdata.refer_activity.length > 0) {
								db.UpdateDocument('users', { '_id': userdata._id }, { $pull: { refer_activity: { expire_date: { $lte: currentTime } } } }, {}, function (err, referrer) { });
							}
							next();
						} else {
							next();
						}
					});
				}
			}
		});
	}
	job.start();
	job2.start();

	function subscribeUserSendMail() {
		db.GetDocument('subscribe', { status: 1 }, {}, {}, (error, docData) => {
			if (error) {
				console.log("Error exception **cron** subscribeUserSendMail", error.message)
			} else {
				if (docData && docData.length > 0) {
					var query = [
						{ $match: { status: 1, offer_status: 1, offer_amount: { $gt: 0 } } },
						{
							$group: {
								"_id": null,
								"max_offer": { $max: "$offer_amount" },
								"base_price": { "$first": "$base_price" },
								"sale_price": { "$first": "$sale_price" },
								"avatar": { "$first": "$avatar" },
								"name": { "$first": "$name" },
							}
						},
						{
							$project: {
								offer_amount: "$max_offer",
								base_price: 1,
								sale_price: 1,
								avatar: 1,
								name: 1
							}
						},
						{ $sort: { createdAt: -1 } },
						{
							$sample: { size: 1 }
						}
					]
					db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
						if (err) {
							console.log("Error exception **Cron** subscribeUserSendMail", err.message)
						} else {
							db.GetAggregation('food', query, (err, doc) => {
								if (err) {
									console.log('Error exception **CRON** subscribeUserSendMail', err.message)
								} else {
									if (doc && doc.length > 0) {
										var data = doc[0];
										var mrb_price = data.sale_price;
										var s_price = parseInt(data.sale_price - ((data.sale_price * data.offer_amount) / 100));
										var image = settings.settings.site_url + data.avatar.slice(2);
										var p_name = data.name;
										var url = settings.settings.site_url;
										var currency_symbol = settings.settings.currency_symbol
										each(docData, function (subscrb, next) {
											var split = subscrb.email.split('@');
											var name = split[0]
											var mailData = {};
											mailData.template = 'best_offer_to_user';
											mailData.to = subscrb.email;
											mailData.html = [];
											mailData.html.push({ name: 'name', value: name || "" });
											mailData.html.push({ name: 'product_name', value: p_name || "" });
											mailData.html.push({ name: 'sale_price', value: s_price || "" });
											mailData.html.push({ name: 'mrb_price', value: mrb_price || "" });
											mailData.html.push({ name: 'offer_amount', value: data.offer_amount || "" });
											mailData.html.push({ name: 'image', value: image || "" });
											mailData.html.push({ name: 'link', value: url || "" });
											mailData.html.push({ name: 'currency', value: currency_symbol || "" });
											mailcontent.sendmail(mailData, function (err, response) { });
											next()

										})
									} else {
										var query = [
											// {$match: {status: 1, $or:[{expensive: {$eq : 1}},{offer_amount: {$gt: 0}}]}},
											{ $match: { status: 1, $or: [{ expensive: { $eq: 1 } }, { expensive: { $eq: 0 } }] } },
											{
												$project: {
													offer_status: 1,
													offer_amount: 1,
													base_price: 1,
													sale_price: 1,
													avatar: 1,
													name: 1
												}
											},
											{ $sort: { createdAt: -1 } },
											{
												$sample: { size: 1 }
											}
										]
										db.GetAggregation('food', query, (err, doc1) => {
											if (err) {
												console.log("Error exception **Cron** subscribeUserSendMail", err.message)
											} else {
												if (doc1 && doc1.length > 0) {
													var data = doc1[0];
													var mrb_price = data.sale_price;
													var s_price = parseInt(data.sale_price - ((data.sale_price * data.offer_amount) / 100));
													var image = settings.settings.site_url + data.avatar.slice(2);
													var p_name = data.name;
													var url = settings.settings.site_url;
													var currency_symbol = settings.settings.currency_symbol
													each(docData, function (subscrb, next) {
														var split = subscrb.email.split('@');
														var name = split[0]
														var mailData = {};
														mailData.template = 'best_offer_to_user';
														mailData.to = subscrb.email;
														mailData.html = [];
														mailData.html.push({ name: 'name', value: name || "" });
														mailData.html.push({ name: 'product_name', value: p_name || "" });
														mailData.html.push({ name: 'sale_price', value: s_price || "" });
														mailData.html.push({ name: 'mrb_price', value: mrb_price || "" });
														mailData.html.push({ name: 'offer_amount', value: data.offer_amount || "" });
														mailData.html.push({ name: 'image', value: image || "" });
														mailData.html.push({ name: 'link', value: url || "" });
														mailData.html.push({ name: 'currency', value: currency_symbol || "" });
														mailcontent.sendmail(mailData, function (err, response) { });
														next()

													})
												}
											}
										})
									}
								}
							})
						}
					})

				}
			}
		})
	}


	function formatDate(d) {
		if (!d) return '';
		const date = new Date(d);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	}


	async function generateEmployeeAlerts() {
		let employees = await db.GetDocument("employee", {}, {}, {});
		let today = new Date();

		for (let emp of employees.doc) {

			// CIVIL ID
			if (emp.civilIdExpiry) {
				let alertDate = new Date(emp.civilIdExpiry);
				alertDate.setDate(alertDate.getDate() - 30);

				if (alertDate <= today) {

					// ⛔ Avoid duplicates
					const exists = await db.GetOneDocument("alert", {
						type: "employee_civilid_expiry",
						employeeId: emp._id,
						resolved: { $ne: true }
					});
					if (!exists.doc && exists.status) {
						await db.InsertDocument("alert", {
							type: "employee_civilid_expiry",
							message: `${emp.fullName}'s Civil ID expires on ${formatDate(emp.civilIdExpiry)}`,
							employeeId: emp._id,
							alertDate,
							expireAt: new Date(today.getTime() + 5 * 86400000) // ⏳ expires after 5 days
						});
					}
				}
			}

			// VISA
			if (emp.visaExpiry) {
				let alertDate = new Date(emp.visaExpiry);
				alertDate.setDate(alertDate.getDate() - 30);

				if (alertDate <= today) {

					const exists = await db.GetOneDocument("alert", {
						type: "employee_visa_expiry",
						employeeId: emp._id,
						resolved: { $ne: true }
					});
					if (!exists.doc && exists.status) {
						await db.InsertDocument("alert", {
							type: "employee_visa_expiry",
							message: `${emp.fullName}'s Visa expires on ${formatDate(emp.visaExpiry)}`,
							employeeId: emp._id,
							alertDate,
							expireAt: new Date(today.getTime() + 5 * 86400000)
						});
					}
				}
			}

			// LICENSE
			if (emp.licenseExpiry) {
				let alertDate = new Date(emp.licenseExpiry);
				alertDate.setDate(alertDate.getDate() - 30);

				if (alertDate <= today) {

					const exists = await db.GetOneDocument("alert", {
						type: "employee_license_expiry",
						employeeId: emp._id,
						resolved: { $ne: true }
					});

					if (!exists.doc && exists.status) {
						await db.InsertDocument("alert", {
							type: "employee_license_expiry",
							message: `${emp.fullName}'s License expires on ${formatDate(emp.licenseExpiry)}`,
							employeeId: emp._id,
							alertDate,
							expireAt: new Date(today.getTime() + 5 * 86400000)
						});
					}
				}
			}
		}
	}




	async function generateFleetAlerts() {
		let fleets = await db.GetDocument("fleet", {}, {}, {});
		let today = new Date();

		for (let fleet of fleets.doc) {

			// INSURANCE
			if (fleet.passingExpiry) {
				let alertDate = new Date(fleet.passingExpiry);
				alertDate.setDate(alertDate.getDate() - 30);

				if (alertDate <= today) {

					const exists = await db.GetOneDocument("alert", {
						type: "fleet_insurance_expiry",
						fleetId: fleet._id,
						resolved: { $ne: true }
					});
					if (!exists.doc && exists.status) {
						await db.InsertDocument("alert", {
							type: "fleet_insurance_expiry",
							message: `${fleet.vehicleName}'s insurance expires on ${formatDate(fleet.passingExpiry)}`,
							fleetId: fleet._id,
							alertDate,
							expireAt: new Date(today.getTime() + 5 * 86400000)
						});
					}
				}
			}

			// MAINTENANCE
			if (fleet.maintenance?.nextMaintenanceDue) {
				let due = new Date(fleet.maintenance.nextMaintenanceDue);
				let alertDate = new Date(due);
				alertDate.setDate(alertDate.getDate() - 30);

				if (alertDate <= today) {

					const exists = await db.GetOneDocument("alert", {
						type: "fleet_maintenance_due",
						fleetId: fleet._id,
						resolved: { $ne: true }
					});

					if (!exists.doc && exists.status) {
						await db.InsertDocument("alert", {
							type: "fleet_maintenance_due",
							message: `${fleet.vehicleName}'s maintenance is due on ${formatDate(due)}`,
							fleetId: fleet._id,
							alertDate,
							expireAt: new Date(today.getTime() + 5 * 86400000)
						});
					}
				}
			}
		}
	}


	async function generatePaymentAlerts() {
		let today = new Date();

		// --- CUSTOMER PAYMENTS ---
		let customerPayments = await db.GetDocument("customerPayment", {}, {}, {});
		for (let pay of customerPayments.doc) {

			let due = pay.nextDueDate || pay.dueDate;
			if (!due) continue;

			let alertDate = new Date(due);
			alertDate.setDate(alertDate.getDate() - 5); // alert 5 days before due date

			if (alertDate <= today && pay.balance > 0) {

				const exists = await db.GetOneDocument("alert", {
					type: "customer_payment_due",
					paymentId: pay._id,
					resolved: { $ne: true }
				});

				if (!exists.doc && exists.status) {
					await db.InsertDocument("alert", {
						type: "customer_payment_due",
						message: `Payment due for customer ${pay.clientName}. Due on ${formatDate(due)} - Balance: ${pay.balance}`,
						customerId: pay._id,
						paymentId: pay._id,
						alertDate,
						expireAt: new Date(today.getTime() + 5 * 86400000),
					});
				}
			}
		}

		// --- VENDOR PAYMENTS ---
		let vendorPayments = await db.GetDocument("vendorPayment", {}, {}, {});
		for (let pay of vendorPayments.doc) {

			let due = pay.nextDueDate || pay.dueDate;
			if (!due) continue;

			let alertDate = new Date(due);
			alertDate.setDate(alertDate.getDate() - 5);

			if (alertDate <= today && pay.balance > 0) {

				const exists = await db.GetOneDocument("alert", {
					type: "vendor_payment_due",
					paymentId: pay._id,
					resolved: { $ne: true }
				});

				if (!exists.doc && exists.status) {
					await db.InsertDocument("alert", {
						type: "vendor_payment_due",
						message: `Payment due for Vendor invoice ${pay.invoiceNo}. Due on ${formatDate(due)} - Balance: ${pay.balance}`,
						vendorId: pay._id,
						paymentId: pay._id,
						alertDate,
						expireAt: new Date(today.getTime() + 5 * 86400000),
					});
				}
			}
		}
	}






}