
const { wait } = require('event-stream');
// const cashfree = require('../site/payment-gateways/cashfree.js');
const razorPay = require("../site/payment-gateways/razorpay.js");
const stripe = require('../site/payment-gateways/stripe.js');

//"use strict";
module.exports = function (app, io) {
    var db = require('../../controller/adaptor/mongodb.js');
    var bcrypt = require('bcrypt-nodejs');
    var attachment = require('../../model/attachments.js');
    var push = require('../../model/pushNotification.js')(io);
    var library = require('../../model/library.js');
    var Jimp = require("jimp");
    var pdf = require('html-pdf');
    var mongoose = require("mongoose");
    var CONFIG = require('../../config/config.js');
    var async = require("async");
    var syncEach = require('sync-each');
    var multer = require('multer');
    var htmlToText = require('html-to-text');
    var json2csv = require('json2csv');
    var fs = require('fs');
    var timezone = require('moment-timezone');
    var moment = require('moment');
    var mailcontent = require('../../model/mailcontent.js');
    var middlewares = require('../../model/middlewares.js');

    function isObjectId(n) {
        return mongoose.Types.ObjectId.isValid(n);
    }
    var router = {};
    router.ordersList = async function (req, res) {
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }
        console.log('list');
        console.log(req.body.From_Date, 'req.body.From_Date');
        console.log(req.body.To_Date, 'req.body.To_Date');
        console.log(req.body, 'this is the req');
        var query = {};
        if (req.body.status == 1) { //new orders
            query = { status: { $eq: 1 } };
        } else if (req.body.status == 15) { //scheduled
            query = { status: { $eq: 15 } };
        } else if (req.body.status == 3) { //processing
            query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 5 } }, { status: { $eq: 4 } }] };
        } else if (req.body.status == 6) { //order picked
            query = { status: { $eq: 6 } };
        } else if (req.body.status == 7) { // delivered
            query = { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] };
        } else if (req.body.status == 2) { // denied ny restaurant
            query = { status: { $eq: 2 } };
        } else if (req.body.status == 9) { // canceled by user
            query = { status: { $eq: 9 } };
        } else if (req.body.status == 16) { // canceled by user
            query = { status: { $eq: 16 } };
        }
        else if (req.body.status == 17) { // canceled by user
            query = { status: { $eq: 17 } };
        }
        else if (req.body.status == 18) { // canceled by user
            query = { status: { $eq: 18 } };
        }
        else { query = { status: { $ne: 0 } }; }

        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }

        var usersQuery = [{
            "$match": query

        }, 
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $lookup: {
                from: "transaction",
                localField: "transaction_id",
                foreignField: "_id",
                as: "transactions"
            }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "city",
                localField: "city_id",
                foreignField: "_id",
                as: "restaurants"
            }
        },
        { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "drivers",
                localField: "driver_id",
                foreignField: "_id",
                as: "driver"
            }
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                restaurants: 1,
                foods: 1,
                user: 1,
                driver: 1,
                order_id: 1,
                delivery_address: 1,
                billings: 1,
                billing_address: 1,
                status: 1,
                restaurant_time_out_alert: 1,
                cancellationreason: 1,
                refundStatus: 1,
                returnStatus: 1,
                transactions:1,
                schedule_date: 1,
                schedule_time_slot: 1,
                guestLogin:1,
                seen_status: 1,
                sample_email: 1,
                createdAt: 1
            }
        }, {
            $project: {
                question: 1,
                document: "$$ROOT"
            }
        },
        {
            $sort: {
                "document.createdAt": -1
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }
        ];


        var condition = { status: { $ne: 0 } };
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

        // console.log("req.body.status>>",req.body.status);
        //     var condition = { status: { $eq:req.body.status } };
        //     console.log("condition>>",condition);

        if (req.body.search) {
            //condition['foods.name'] = { $regex: new RegExp('^' + req.body.search, 'i') };
            var searchs = req.body.search;
            usersQuery.push({
                "$match": {
                    $or: [
                        { "documentData.foods.name": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.order_id": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.user.username": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.restaurants.phone.number": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.user.phone.number": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.driver.phone.number": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.restaurants.restaurantname": { $regex: searchs + '.*', $options: 'si' } }
                    ]
                }
            });

            //search limit
            usersQuery.push({ $group: { "_id": null, "countvalue": { "$sum": 1 }, "documentData": { $push: "$documentData" } } });
            usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
            if (req.body.limit && req.body.skip >= 0) {
                usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
            }
            usersQuery.push({ $group: { "_id": null, "count": { "$first": "$countvalue" }, "documentData": { $push: "$documentData" } } });
            //search limit
        }
        var sorting = {};
        if (req.body.sort) {
            var sorter = 'documentData.' + req.body.sort.field;
            sorting[sorter] = req.body.sort.order;
            usersQuery.push({ $sort: sorting });
        }

        if ((req.body.limit && req.body.skip >= 0) && !req.body.search) {
            usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        }

        if (!req.body.search) {
            usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
        }
        //console.log(JSON.stringify(usersQuery))
        const docdata = await db.GetAggregation('orders', usersQuery)
        if (!docdata) {
            res.send(err);
        } else {
            var count = {};
            const [allValue, onGoingValue, completedValue, cancelValue] = await Promise.all([
                db.GetCount('orders', { $and: [{ status: { $ne: 0 } }, { status: { $ne: 10 } }] }),
                db.GetCount('orders', { $or: [{ status: { $eq: 1 } }, { status: { $eq: 6 } }, { status: { $eq: 3 } }, { status: { $eq: 4 } }, { status: { $eq: 5 } }] }),
                db.GetCount('orders', { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] }),
                db.GetCount('orders', { status: { $eq: 2 } })
            ])
            count.allValue = allValue;
            count.onGoingValue = onGoingValue;
            count.completedValue = completedValue;
            count.cancelValue = cancelValue;
            var totalCount = count;
            if (docdata.length != 0) {
                res.send([docdata[0].documentData, docdata[0].count, totalCount]);
            } else {
                res.send([0, 0]);
            }
            // async.parallel([
            //     //All order
            //     function (callback) {
            //         db.GetCount('orders', { $and: [{ status: { $ne: 0 } }, { status: { $ne: 10 } }] }, function (err, allValue) {
            //             if (err) return callback(err);
            //             count.allValue = allValue;
            //             callback();
            //         });
            //     },
            //     //OnGoing order
            //     function (callback) {
            //         db.GetCount('orders', { $or: [{ status: { $eq: 1 } }, { status: { $eq: 6 } }, { status: { $eq: 3 } }, { status: { $eq: 4 } }, { status: { $eq: 5 } }] }, function (err, onGoingValue) {
            //             if (err) return callback(err);
            //             count.onGoingValue = onGoingValue;
            //             callback();
            //         });
            //     },
            //     //delivered order
            //     function (callback) {
            //         db.GetCount('orders', { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] }, function (err, completedValue) {
            //             if (err) return callback(err);
            //             count.completedValue = completedValue;
            //             callback();
            //         });
            //     },
            //     //cancel order
            //     function (callback) {
            //         db.GetCount('orders', { status: { $eq: 2 } }, function (err, cancelValue) {
            //             if (err) return callback(err);
            //             count.cancelValue = cancelValue;
            //             callback();
            //         });
            //     }
            // ], function (err) {

            //     if (err) return next(err);
            //     var totalCount = count;
            //     if (docdata.length != 0) {
            //         res.send([docdata[0].documentData, docdata[0].count, totalCount]);
            //     } else {
            //         res.send([0, 0]);
            //     }
            // });
        }
        // db.GetAggregation('orders', usersQuery, function (err, docdata) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         var count = {};
        //         async.parallel([
        //             //All order
        //             function (callback) {
        //                 db.GetCount('orders', { $and: [{ status: { $ne: 0 } }, { status: { $ne: 10 } }] }, function (err, allValue) {
        //                     if (err) return callback(err);
        //                     count.allValue = allValue;
        //                     callback();
        //                 });
        //             },
        //             //OnGoing order
        //             function (callback) {
        //                 db.GetCount('orders', { $or: [{ status: { $eq: 1 } }, { status: { $eq: 6 } }, { status: { $eq: 3 } }, { status: { $eq: 4 } }, { status: { $eq: 5 } }] }, function (err, onGoingValue) {
        //                     if (err) return callback(err);
        //                     count.onGoingValue = onGoingValue;
        //                     callback();
        //                 });
        //             },
        //             //delivered order
        //             function (callback) {
        //                 db.GetCount('orders', { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] }, function (err, completedValue) {
        //                     if (err) return callback(err);
        //                     count.completedValue = completedValue;
        //                     callback();
        //                 });
        //             },
        //             //cancel order
        //             function (callback) {
        //                 db.GetCount('orders', { status: { $eq: 2 } }, function (err, cancelValue) {
        //                     if (err) return callback(err);
        //                     count.cancelValue = cancelValue;
        //                     callback();
        //                 });
        //             }
        //         ], function (err) {

        //             if (err) return next(err);
        //             var totalCount = count;
        //             if (docdata.length != 0) {
        //                 res.send([docdata[0].documentData, docdata[0].count, totalCount]);
        //             } else {
        //                 res.send([0, 0]);
        //             }
        //         });
        //     }
        // });
    }

    router.returnOrdersList = async function (req, res) {
        try {
            console.log('list');
            console.log(req.body.From_Date, 'req.body.From_Date');
            console.log(req.body.To_Date, 'req.body.To_Date');
            console.log(req.body, 'this is the req');
            var query = {};
            if (req.body.status == 16) { //new orders
                query = { $match: { "foods.status": 16 } };
            }
            if (req.body.status == 17) {
                query = { $match: { "foods.status": 17 } };
            }
            if (req.body.status == 18) {
                query = { $match: { "foods.status": 18 } };
            }

            if (req.body.sort) {
                var sorted = req.body.sort.field;
            }

            var usersQuery = [
                {
                    $unwind: "$foods" // Unwind the foods array
                },
                query,

                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "city",
                        localField: "city_id",
                        foreignField: "_id",
                        as: "restaurants"
                    }
                },
                { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "drivers",
                        localField: "driver_id",
                        foreignField: "_id",
                        as: "driver"
                    }
                },
                { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        restaurants: 1,
                        foods: 1,
                        user: 1,
                        driver: 1,
                        order_id: 1,
                        delivery_address: 1,
                        billings: 1,
                        status: 1,
                        restaurant_time_out_alert: 1,
                        cancellationreason: 1,
                        refundStatus: 1,
                        returnStatus: 1,
                        schedule_date: 1,
                        schedule_time_slot: 1,
                        seen_status: 1,
                        sample_email: 1,
                        createdAt: 1
                    }
                }, {
                    $project: {
                        question: 1,
                        document: "$$ROOT"
                    }
                },
                {
                    $sort: {
                        "document.createdAt": -1
                    }
                }, {
                    $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
                }
            ];


            var condition = { status: { $ne: 0 } };
            usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

            console.log("req.body.status>>", req.body.status);
            var condition = { status: { $eq: req.body.status } };
            console.log("condition>>", condition);

            if (req.body.search) {
                //condition['foods.name'] = { $regex: new RegExp('^' + req.body.search, 'i') };
                var searchs = req.body.search;
                usersQuery.push({
                    "$match": {
                        $or: [
                            { "documentData.foods.name": { $regex: searchs + '.*', $options: 'si' } },
                            { "documentData.order_id": { $regex: searchs + '.*', $options: 'si' } },
                            { "documentData.user.username": { $regex: searchs + '.*', $options: 'si' } },
                            { "documentData.restaurants.phone.number": { $regex: searchs + '.*', $options: 'si' } },
                            { "documentData.user.phone.number": { $regex: searchs + '.*', $options: 'si' } },
                            { "documentData.driver.phone.number": { $regex: searchs + '.*', $options: 'si' } },
                            { "documentData.restaurants.restaurantname": { $regex: searchs + '.*', $options: 'si' } }
                        ]
                    }
                });

                //search limit
                usersQuery.push({ $group: { "_id": null, "countvalue": { "$sum": 1 }, "documentData": { $push: "$documentData" } } });
                usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
                if (req.body.limit && req.body.skip >= 0) {
                    usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
                }
                usersQuery.push({ $group: { "_id": null, "count": { "$first": "$countvalue" }, "documentData": { $push: "$documentData" } } });
                //search limit
            }
            var sorting = {};
            if (req.body.sort) {
                var sorter = 'documentData.' + req.body.sort.field;
                sorting[sorter] = req.body.sort.order;
                usersQuery.push({ $sort: sorting });
            }

            if ((req.body.limit && req.body.skip >= 0) && !req.body.search) {
                usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
            }

            if (!req.body.search) {
                usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
            }
            //console.log(JSON.stringify(usersQuery))
            const docdata = await db.GetAggregation('orders', usersQuery)
            console.log(JSON.stringify(docdata, null, 2), 'thisDaata');
            const datata = await db.GetDocument('orders', { 'foods.status': 16 }, {}, {})
            console.log(datata, 'datata datata');
            if (!docdata) {
                res.send('error');
            } else {
                var count = {};
                const [allValue, onGoingValue, completedValue, cancelValue] = await Promise.all([
                    db.GetCount('orders', { $and: [{ status: { $ne: 0 } }, { status: { $ne: 10 } }] }),
                    db.GetCount('orders', { $or: [{ status: { $eq: 1 } }, { status: { $eq: 6 } }, { status: { $eq: 3 } }, { status: { $eq: 4 } }, { status: { $eq: 5 } }] }),
                    db.GetCount('orders', { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] }),
                    db.GetCount('orders', { status: { $eq: 2 } })
                ])
                count.allValue = allValue;
                count.onGoingValue = onGoingValue;
                count.completedValue = completedValue;
                count.cancelValue = cancelValue;
                var totalCount = count;
                if (docdata.length != 0) {
                    res.send([docdata[0].documentData, docdata[0].count, totalCount]);
                } else {
                    res.send([0, 0]);
                }
            }

        } catch (error) {
            console.log(error);
            res.send({ status: false, message: 'There is something went wrong with the return orders list' })
        }
    }


    router.list1 = async (req, res) => {
        var query = {};
        console.log('list one');
        console.log(req.body.From_Date, 'req.body.From_Date');
        console.log(req.body.To_Date, 'req.body.To_Date');
        console.log(req.body, 'this is the req');
        if (req.body.status == 1) { //new orders
            query = { status: { $eq: 1 } };
        } else if (req.body.status == 15) { //new orders
            query = { status: { $eq: 15 } };
        } else if (req.body.status == 3) { //processing
            query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 5 } }, { status: { $eq: 4 } }] };
        } else if (req.body.status == 6) { //order picked
            query = { status: { $eq: 6 } };
        } else if (req.body.status == 7) { // delivered
            query = { status: { $eq: 7 } };
        } else if (req.body.status == 2) { // denied ny restaurant
            query = { status: { $eq: 2 } };
        } else if (req.body.status == 9) { // canceled by user
            query = { status: { $eq: 9 } };
        }
        else if (req.body.status == 16) { // canceled by user
            query = { status: { $eq: 16 } };
        }
        else if (req.body.status == 17) { // canceled by user
            query = { status: { $eq: 17 } };
        }
        else if (req.body.status == 18) { // canceled by user
            query = { status: { $eq: 18 } };
        }
        else { query = { status: { $ne: 0 } }; }
        if (req.body.city) {
            // usersQuery.push({
            //     "$match": { "documentData.city_id": mongoose.Types.ObjectId(req.body.city) },

            // })
            query['city_id'] = { $eq: mongoose.Types.ObjectId(req.body.city) };
            //usersQuery.push({ '$limit': parseInt(10) });
        }
        var usersQuery = [{ "$match": query },
        {
            $lookup: {
                from: "food",
                localField: "food_id",
                foreignField: "_id",
                as: "foods"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "city",
                localField: "city_id",
                foreignField: "_id",
                as: "restaurants"
            }
        },
        { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "drivers",
                localField: "driver_id",
                foreignField: "_id",
                as: "driver"
            }
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "transaction",
                localField: "transaction_id",
                foreignField: "_id",
                as: "transactions"
            }
        },
        {
            $project: {
                restaurants: 1,
                driver: 1,
                foods: 1,
                restaurant_time_out_alert: 1,
                cancellationreason: 1,
                user: 1,
                order_id: 1,
                delivery_address: 1,
                status: 1,
                seen_status: 1,
                createdAt: 1,
                guestLogin:1,
                sample_email: 1,
                refundStatus: 1,
                billings: 1,
                transactions: 1
            }
        }, {
            $project: {
                question: 1,
                documentData: "$$ROOT"
            }
        }
        ];

        var condition = { status: { $ne: 0 } };
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
        if (req.body.search && typeof req.body.search != 'undefined' && req.body.search != '') {
            usersQuery.push({
                "$match": {
                    $or: [{ "documentData.order_id": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.restaurants.restaurantname": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.restaurants.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.user.username": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.user.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.driver.username": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.driver.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }]
                }
            })
        }

        // if (req.body.city && req.body.area && req.body.rest) {
        //     usersQuery.push({
        //         "$match": {
        //             $and: [{ "documentData.restaurants.restaurantname": req.body.rest }, { "documentData.restaurants.main_city": req.body.city }, { "documentData.restaurants.sub_city": req.body.area }]
        //         }
        //     })
        //     //usersQuery.push({ '$limit': parseInt(10) });
        // }

        // if (req.body.city) {
        //     usersQuery.push({
        //         "$match": { "documentData.city_id": mongoose.Types.ObjectId(req.body.city) },

        //     })
        //     //usersQuery.push({ '$limit': parseInt(10) });
        // }
        // if (req.body.city && req.body.area && !req.body.rest) {
        //     usersQuery.push({
        //         "$match": {
        //             $and: [{ "documentData.restaurants._id": req.body.city }, { "documentData.restaurants.sub_city": req.body.area }]
        //         }
        //     })
        //     // usersQuery.push({ '$limit': parseInt(10) });
        // }

        // if (req.body.city && req.body.rest && !req.body.area) {
        //     usersQuery.push({
        //         "$match": {
        //             $and: [{ "documentData.restaurants.main_city": req.body.city }, { "documentData.restaurants.restaurantname": req.body.rest }]
        //         }
        //     })
        //     // usersQuery.push({ '$limit': parseInt(10) });
        // }

        var start, end;
        if (req.body.From_Date != undefined) {
            start = new Date((req.body.From_Date));
            start = new Date(start.setDate(start.getDate() + 0))
            start = moment(start).format('MM/DD/YYYY');
            start = start + ' 00:00:00';
        }
        if (req.body.To_Date != undefined) {
            end = new Date(req.body.To_Date);
            end = new Date(end.setDate(end.getDate() + 0))
            end = moment(end).format('MM/DD/YYYY');
            end = end + ' 23:59:59';
        } else {
            end = new Date();
        }
        if (req.body.From_Date == undefined) {
            usersQuery.push({
                "$match": { "documentData.createdAt": { '$lte': new Date(end) } }
            })
        }

        else if (req.body.From_Date != undefined && req.body.To_Date != undefined) {
            usersQuery.push({
                "$match": { "documentData.createdAt": { '$gte': new Date(start), '$lte': new Date(end) } }
            })
        }
        usersQuery.push({
            $sort: {
                "documentData.createdAt": -1
            }
        })

        usersQuery.push({ $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$documentData" } } });
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });


        if ((req.body.limit && req.body.skip >= 0)) {
            usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        }


        usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
        try {

            let ordersdata = await db.GetAggregation('orders', usersQuery)
            console.log("---------------------------------------------->", ordersdata);
            if (!ordersdata) {
                res.send([0, 0]);
            } else {
                if (ordersdata && ordersdata.length > 0 && ordersdata[0].documentData) {
                    res.send([ordersdata[0].documentData, ordersdata[0].count]);

                } else {
                    res.send([[], 0])
                }

            }
        } catch (e) {
            console.log("errro at orders", e)
        }
        // function (err, docdata) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         var count = {};
        //         if (docdata.length != 0) {
        //             res.send([docdata[0].documentData, docdata[0].count]);
        //         } else {
        //             res.send([0, 0]);
        //         }
        //     }
        // });
    }

    router.listAllOrder = async (req, res) => {
        var query = { status: { $ne: 0 } };
        console.log('list one');
        console.log(req.body.From_Date, 'req.body.From_Date');
        console.log(req.body.To_Date, 'req.body.To_Date');
        console.log(req.body, 'this is the req');
        // if (req.body.status == 1) { //new orders
        //     query = { status: { $eq: 1 } };
        // } else if (req.body.status == 15) { //new orders
        //     query = { status: { $eq: 15 } };
        // } else if (req.body.status == 3) { //processing
        //     query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 5 } }, { status: { $eq: 4 } }] };
        // } else if (req.body.status == 6) { //order picked
        //     query = { status: { $eq: 6 } };
        // } else if (req.body.status == 7) { // delivered
        //     query = { status: { $eq: 7 } };
        // } else if (req.body.status == 2) { // denied ny restaurant
        //     query = { status: { $eq: 2 } };
        // } else if (req.body.status == 9) { // canceled by user
        //     query = { status: { $eq: 9 } };
        // }
        // else if (req.body.status == 16) { // canceled by user
        //     query = { status: { $eq: 16 } };
        // }
        // else if (req.body.status == 17) { // canceled by user
        //     query = { status: { $eq: 17 } };
        // }
        // else if (req.body.status == 18) { // canceled by user
        //     query = { status: { $eq: 18 } };
        // }
        // else { query = { status: { $ne: 0 } }; }
        if (req.body.city) {
            // usersQuery.push({
            //     "$match": { "documentData.city_id": mongoose.Types.ObjectId(req.body.city) },

            // })
            query['city_id'] = { $eq: mongoose.Types.ObjectId(req.body.city) };
            //usersQuery.push({ '$limit': parseInt(10) });
        }
        var usersQuery = [
            { "$match": query },
                // {
                //     $lookup: {
                //         from: "food",
                //         localField: "food_id",
                //         foreignField: "_id",
                //         as: "foods"
                //     }
                // },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "city",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "restaurants"
                }
            },
            { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "drivers",
                    localField: "driver_id",
                    foreignField: "_id",
                    as: "driver"
                }
            },
            { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "transaction",
                    localField: "transaction_id",
                    foreignField: "_id",
                    as: "transactions"
                }
            },
            {
                $project: {
                    restaurants: 1,
                    driver: 1,
                    foods: 1,
                    restaurant_time_out_alert: 1,
                    cancellationreason: 1,
                    user: 1,
                    order_id: 1,
                    guestLogin:1,
                    delivery_address: 1,
                    billing_address : 1,
                    status: 1,
                    seen_status: 1,
                    createdAt: 1,
                    sample_email: 1,
                    refundStatus: 1,
                    billings: 1,
                    transactions: 1
                }
            }, {
                $project: {
                    question: 1,
                    documentData: "$$ROOT"
                }
            }
        ];

        var condition = { status: { $ne: 0 } };
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
        if (req.body.search && typeof req.body.search != 'undefined' && req.body.search != '') {
            usersQuery.push({
                "$match": {
                    $or: [{ "documentData.order_id": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.restaurants.restaurantname": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.restaurants.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.user.username": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.user.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.driver.username": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "documentData.driver.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }]
                }
            })
        }

        // if (req.body.city && req.body.area && req.body.rest) {
        //     usersQuery.push({
        //         "$match": {
        //             $and: [{ "documentData.restaurants.restaurantname": req.body.rest }, { "documentData.restaurants.main_city": req.body.city }, { "documentData.restaurants.sub_city": req.body.area }]
        //         }
        //     })
        //     //usersQuery.push({ '$limit': parseInt(10) });
        // }

        // if (req.body.city) {
        //     usersQuery.push({
        //         "$match": { "documentData.city_id": mongoose.Types.ObjectId(req.body.city) },

        //     })
        //     //usersQuery.push({ '$limit': parseInt(10) });
        // }
        // if (req.body.city && req.body.area && !req.body.rest) {
        //     usersQuery.push({
        //         "$match": {
        //             $and: [{ "documentData.restaurants._id": req.body.city }, { "documentData.restaurants.sub_city": req.body.area }]
        //         }
        //     })
        //     // usersQuery.push({ '$limit': parseInt(10) });
        // }

        // if (req.body.city && req.body.rest && !req.body.area) {
        //     usersQuery.push({
        //         "$match": {
        //             $and: [{ "documentData.restaurants.main_city": req.body.city }, { "documentData.restaurants.restaurantname": req.body.rest }]
        //         }
        //     })
        //     // usersQuery.push({ '$limit': parseInt(10) });
        // }

        var start, end;
        if (req.body.From_Date != undefined) {
            start = new Date((req.body.From_Date));
            start = new Date(start.setDate(start.getDate() + 0))
            start = moment(start).format('MM/DD/YYYY');
            start = start + ' 00:00:00';
        }
        if (req.body.To_Date != undefined) {
            end = new Date(req.body.To_Date);
            end = new Date(end.setDate(end.getDate() + 0))
            end = moment(end).format('MM/DD/YYYY');
            end = end + ' 23:59:59';
        } else {
            end = new Date();
        }
        if (req.body.From_Date == undefined) {
            usersQuery.push({
                "$match": { "documentData.createdAt": { '$lte': new Date(end) } }
            })
        }

        else if (req.body.From_Date != undefined && req.body.To_Date != undefined) {
            usersQuery.push({
                "$match": { "documentData.createdAt": { '$gte': new Date(start), '$lte': new Date(end) } }
            })
        }
        usersQuery.push({
            $sort: {
                "documentData.createdAt": -1
            }
        })

        usersQuery.push({ $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$documentData" } } });
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });


        if ((req.body.limit && req.body.skip >= 0)) {
            usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        }


        usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
        try {

            let ordersdata = await db.GetAggregation('orders', usersQuery)
            console.log("---------------------------------------------->", ordersdata);
            if (!ordersdata) {
                res.send([0, 0]);
            } else {
                if (ordersdata && ordersdata.length > 0 && ordersdata[0].documentData) {
                    res.send([ordersdata[0].documentData, ordersdata[0].count]);

                } else {
                    res.send([[], 0])
                }

            }
        } catch (e) {
            console.log("errro at orders", e)
        }
    }

router.general = async function (req, res) {
    try {
        console.log('before mqry');

        const docdata = await db.GetDocument(
            'settings',
            { alias: "general" },
            {},
            {}
        );

        if (
            docdata &&
            Array.isArray(docdata.doc) &&
            docdata.doc.length > 0 &&
            docdata.doc[0].settings
        ) {
            return res.send(docdata.doc[0].settings);
        }

        // fallback response
        return res.send(docdata?.doc || null);

    } catch (err) {
        console.error('Error in general settings:', err);
        return res.status(500).send({ message: 'Internal server error' });
    }
};



    router.taskexport = function (req, res) {

        var query = {};
        if (req.query.id == 1) { //new orders
            query = { status: { $eq: 1 } };
        } else if (req.query.id == 3) { //processing
            query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 4 } }] };
        } else if (req.query.id == 6) { //order picked
            query = { status: { $eq: 6 } };
        } else if (req.query.id == 7) { // delivered
            query = { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] };
        } else if (req.query.id == 2) { // denied ny restaurant
            query = { status: { $eq: 2 } };
        } else if (req.query.id == 9) { // canceled by user
            query = { status: { $eq: 9 } };
        } else { query = { status: { $ne: 0 } }; }

        var bannerQuery = [{
            "$match": query
        }, {
            $lookup: {
                from: "food",
                localField: "food_id",
                foreignField: "_id",
                as: "foods"
            }
        }, {
            $lookup: {
                from: "restaurant",
                localField: "restaurant_id",
                foreignField: "_id",
                as: "restaurants"
            }
        }, {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $project: {
                restaurants: 1,
                foods: 1,
                user: 1,
                delivery_address: 1,
                status: 1,
                total: 1,
                order_date: 1
            }
        }, {
            $project: {
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }
        ];
        db.GetAggregation('orders', bannerQuery, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                if (docdata.length != 0) {
                    var fields = ['user[0].username', 'restaurants[0].restaurantname', 'foods[0].name', 'delivery_address', 'total', 'order_date'];
                    var fieldNames = ['User Name', 'Restaurant Name', 'Food', 'Address', 'Amount', 'Order Date'];
                    var mydata = docdata[0].documentData;
                    json2csv({ data: mydata, fields: fields, fieldNames: fieldNames }, function (err, csv) {
                        if (err);
                        var filename = 'uploads/csv/orders-' + new Date().getTime() + '.csv';
                        fs.writeFile(filename, csv, function (err) {
                            if (err) throw err;
                            res.download(filename);
                        });
                    });
                } else {
                    res.send([0, 0]);
                }
            }
        });
    }

    router.taskexportpost = function (req, res) {

        var query = {};
        if (req.body.id == 1) { //new orders
            query = { status: { $eq: 1 } };
        } else if (req.body.id == 3) { //processing
            query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 4 } }] };
        } else if (req.body.id == 6) { //order picked
            query = { status: { $eq: 6 } };
        } else if (req.body.id == 7) { // delivered
            query = { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] };
        } else if (req.body.id == 2) { // denied ny restaurant
            query = { status: { $eq: 2 } };
        } else if (req.body.id == 9) { // canceled by user
            query = { status: { $eq: 9 } };
        } else { query = { status: { $ne: 0 } }; }

        var bannerQuery = [{
            "$match": query
        }, {
            $lookup: {
                from: "food",
                localField: "food_id",
                foreignField: "_id",
                as: "foods"
            }
        }, {
            $lookup: {
                from: "restaurant",
                localField: "restaurant_id",
                foreignField: "_id",
                as: "restaurants"
            }
        }, {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $project: {
                restaurants: 1,
                foods: 1,
                user: 1,
                delivery_address: 1,
                status: 1,
                total: 1,
                order_date: 1
            }
        }, {
            $project: {
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }
        ];
        db.GetAggregation('orders', bannerQuery, function (err, docdata) {
            if (err || docdata.length == 0) {
                res.send({ error: 'No Data' });
            } else {
                res.send(docdata);
            }
        });
    }

    router.deleteOrders = function (req, res) {
        req.checkBody('delData', 'Invalid delData').notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            res.send(errors, 400);
            return;
        }
        db.UpdateDocument('orders', { _id: { $in: req.body.delData } }, { status: 0 }, { multi: true }, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };

    router.getdeleteOrders = function (req, res) {
        var errors = req.validationErrors();
        if (errors) {
            res.send(errors, 400);
            return;
        }

        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }

        var usersQuery = [{
            "$match": { status: { $eq: 0 } }
        }, {
            $lookup: {
                from: "food",
                localField: "food_id",
                foreignField: "_id",
                as: "foods"
            }
        }, {
            $lookup: {
                from: "restaurant",
                localField: "restaurant_id",
                foreignField: "_id",
                as: "restaurants"
            }
        }, {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $project: {
                restaurants: 1,
                foods: 1,
                order_id: 1,
                user: 1,
                delivery_address: 1,
                status: 1,
                total: 1,
                order_date: 1
            }
        }, {
            $project: {
                question: 1,
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }
        ];

        var condition = { status: { $eq: 0 } };
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

        if (req.body.search) {
            condition['foods.name'] = { $regex: new RegExp('^' + req.body.search, 'i') };
            var searchs = req.body.search;
            usersQuery.push({
                "$match": {
                    $or: [
                        { "documentData.foods.name": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.order_id": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.user.username": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.restaurants.restaurantname": { $regex: searchs + '.*', $options: 'si' } }
                    ]
                }
            });
        }

        var sorting = {};
        if (req.body.sort) {
            var sorter = 'documentData.' + req.body.sort.field;
            sorting[sorter] = req.body.sort.order;
            usersQuery.push({ $sort: sorting });
        } else {
            sorting["documentData.createdAt"] = -1;
            usersQuery.push({ $sort: sorting });
        }

        if ((req.body.limit && req.body.skip >= 0) && !req.body.search) {
            usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        }
        usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });

        db.GetAggregation('orders', usersQuery, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                var count = {};
                async.parallel([
                    function (callback) {
                        db.GetCount('orders', { status: { $eq: 0 } }, function (err, allValue) {
                            if (err) return callback(err);
                            count.allValue = allValue;
                            callback();
                        });
                    }
                ], function (err) {
                    if (err) return next(err);
                    var totalCount = count;
                    if (docdata.length != 0) {
                        res.send([docdata[0].documentData, docdata[0].count, totalCount]);
                    } else {
                        res.send([0, 0]);
                    }
                });
            }
        });
    };


    // router.getOrders = function (req, res) {
    //     var errors = req.validationErrors();
    //     if (errors) {
    //         res.send(errors, 400);
    //         return;
    //     }

    //     var editTasksQuery = [
    //         {
    //             $match: {
    //                 _id: new mongoose.Types.ObjectId(req.body.id)
    //             }
    //         },
    //         {
    //             $lookup:
    //             {
    //                 from: "food",
    //                 localField: "food_id",
    //                 foreignField: "_id",
    //                 as: "foods"
    //             }
    //         },
    //         {
    //             $lookup:
    //             {
    //                 from: "restaurant",
    //                 localField: "restaurant_id",
    //                 foreignField: "_id",
    //                 as: "restaurants"
    //             }
    //         },
    //         {
    //             $lookup:
    //             {
    //                 from: "users",
    //                 localField: "user_id",
    //                 foreignField: "_id",
    //                 as: "user"
    //             }
    //         },
    //         {
    //             $project: {
    //                 order_id: 1,
    //                 restaurants: 1,
    //                 foods: 1,
    //                 user: 1,
    //                 delivery_address: 1,
    //                 status: 1,
    //                 seen_status: 1
    //             }
    //         }, {
    //             $project: {
    //                 question: 1,
    //                 document: "$$ROOT"
    //             }
    //         }, {
    //             $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
    //         }];
    //     db.GetAggregation('orders', editTasksQuery, function (err, docdata) {
    //         if (err) {
    //             res.send(err);
    //         } else {

    //             if (docdata.length != 0) {
    //                 res.send(docdata[0].documentData);
    //             } else {
    //                 res.send([0, 0]);
    //             }
    //         }
    //     });
    // }


    router.getOrders = async function (req, res) {

        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }

        var editTasksQuery = [{
            $match: {
                _id: new mongoose.Types.ObjectId(req.body.id),
                status: { $ne: 0 }
            }
        },

        {
            $lookup: {
                from: "city",
                localField: "city_id",
                foreignField: "_id",
                as: "citys"
            }
        },
        {
            $lookup: {
                from: "transaction",
                localField: "transaction_id",
                foreignField: "_id",
                as: "transactions"
            }
        },
        {
            $lookup: {
                from: "drivers",
                localField: "driver_id",
                foreignField: "_id",
                as: "driver"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $project: {
                order_id: 1,
                citys: 1,
                foods: 1,
                billings: 1,
                transactions: 1,
                cancellationreason: 1,
                driver: 1,
                user: 1,
                createdAt: 1,
                stripechargeid: 1,
                razorpaypayment_id: 1,
                delivery_address: 1,
                refer_offer_price: 1,
                status: 1,
                seen_status: 1,
                show_schedule_time: 1,
                schedule_time_slot: 1,
                schedule_date: 1,
                order_history: 1,
                // sample_email: 1
                cancelReason: 1,
                cart_details: 1,
                billing_address: 1,
                shiprocket_data: 1,
                guestLogin:1,
                shiprocket_timeline: 1

            }
        }, {
            $project: {
                question: 1,
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }
        ];
        const docdata = await db.GetAggregation('orders', editTasksQuery)
        if (!docdata) {
            res.send(err);
        } else {
            if (docdata.length != 0) {
                const docdatas = await db.UpdateDocument('orders', { _id: req.body.id }, { seen_status: 1 })
                const settings = await db.GetOneDocument('settings', { 'alias': 'general' }, {}, {})
                console.log(docdata[0].documentData, 'this is doc data');
                res.send(docdata[0].documentData);
                // db.UpdateDocument('orders', { _id: req.body.id }, { seen_status: 1 }, function (err, docdatas) {
                //     db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
                //         /*var food_list = [];
                //         docdata[0].documentData[0].food_list = [];
                //         for(i in docdata[0].documentData[0].foods)
                //         {
                //             var temp = {};
                //             temp.name = docdata[0].documentData[0].foods[i].name;
                //             temp.price = parseFloat(docdata[0].documentData[0].foods[i].price) * parseInt(docdata[0].documentData[0].foods[i].quantity);
                //             temp.price = temp.price - docdata[0].documentData[0].foods[i].offer_price;
                //             temp.basepack = [];
                //             if(docdata[0].documentData[0].foods[i].base_pack.length > 0)
                //             {
                //             for(b in docdata[0].documentData[0].foods[i].base_pack)
                //                 {
                //                     console.log(docdata[0].documentData[0].foods[i].base_pack)
                //                     var str = '';
                //                     str = docdata[0].documentData[0].foods[i].base_pack[b].name  + ' - ';
                //                     if(docdata[0].documentData[0].foods[i].base_pack[b].sub_pack.length > 0)
                //                     {
                //                     for(sb in docdata[0].documentData[0].foods[i].base_pack[b].sub_pack)
                //                     {
                //                         if(sb == docdata[0].documentData[0].foods[i].base_pack[b].sub_pack-1)
                //                         {
                //                             str += docdata[0].documentData[0].foods[i].base_pack[b].sub_pack[sb].name;
                //                         }
                //                         else{
                //                             str += docdata[0].documentData[0].foods[i].base_pack[b].sub_pack[sb].name+','
                //                         }

                //                     }
                //                 }
                //                 temp.basepack.push(str);
                //             }
                //             }
                //             temp.addons = [];
                //             if(docdata[0].documentData[0].foods[i].addons.length > 0)
                //             {
                //             for(a in docdata[0].documentData[0].foods[i].addons)
                //             {
                //                 temp.addons.push({name:docdata[0].documentData[0].foods[i].addons[a].name,price:docdata[0].documentData[0].foods[i].addons[a].price});
                //             }
                //             }

                //         docdata[0].documentData[0].food_list.push(temp);
                //     }*/
                //         // docdata[0].documentData[0].base_pack = [];
                //         // docdata[0].documentData[0].addons = [];
                //         // for (i in docdata[0].documentData[0].foods) {
                //         //     if (typeof docdata[0].documentData[0].foods[i].base_pack != 'undefined') {
                //         //         if (docdata[0].documentData[0].foods[i].base_pack.length > 0) {
                //         //             for (b in docdata[0].documentData[0].foods[i].base_pack) {
                //         //                 docdata[0].documentData[0].base_pack.push(docdata[0].documentData[0].foods[i].base_pack[b]);
                //         //             }

                //         //         }
                //         //     }
                //         //     if (typeof docdata[0].documentData[0].foods[i].addons != 'undefined') {
                //         //         if (docdata[0].documentData[0].foods[i].addons.length > 0) {
                //         //             for (a in docdata[0].documentData[0].foods[i].addons) {
                //         //                 docdata[0].documentData[0].addons.push(docdata[0].documentData[0].foods[i].addons[a]);
                //         //             }
                //         //         }
                //         //     }
                //         // }
                //         res.send(docdata[0].documentData);
                //     });
                // });
            } else {
                res.send([0, 0]);
            }
        }
        // db.GetAggregation('orders', editTasksQuery, function (err, docdata) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         if (docdata.length != 0) {
        //             db.UpdateDocument('orders', { _id: req.body.id }, { seen_status: 1 }, function (err, docdatas) {
        //                 db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
        //                     /*var food_list = [];
        //                     docdata[0].documentData[0].food_list = [];
        //                     for(i in docdata[0].documentData[0].foods)
        //                     {
        //                         var temp = {};
        //                         temp.name = docdata[0].documentData[0].foods[i].name;
        //                         temp.price = parseFloat(docdata[0].documentData[0].foods[i].price) * parseInt(docdata[0].documentData[0].foods[i].quantity);
        //                         temp.price = temp.price - docdata[0].documentData[0].foods[i].offer_price;
        //                         temp.basepack = [];
        //                         if(docdata[0].documentData[0].foods[i].base_pack.length > 0)
        //                         {
        //                         for(b in docdata[0].documentData[0].foods[i].base_pack)
        //                             {
        //                                 console.log(docdata[0].documentData[0].foods[i].base_pack)
        //                                 var str = '';
        //                                 str = docdata[0].documentData[0].foods[i].base_pack[b].name  + ' - ';
        //                                 if(docdata[0].documentData[0].foods[i].base_pack[b].sub_pack.length > 0)
        //                                 {
        //                                 for(sb in docdata[0].documentData[0].foods[i].base_pack[b].sub_pack)
        //                                 {
        //                                     if(sb == docdata[0].documentData[0].foods[i].base_pack[b].sub_pack-1)
        //                                     {
        //                                         str += docdata[0].documentData[0].foods[i].base_pack[b].sub_pack[sb].name;
        //                                     }
        //                                     else{
        //                                         str += docdata[0].documentData[0].foods[i].base_pack[b].sub_pack[sb].name+','
        //                                     }

        //                                 }
        //                             }
        //                             temp.basepack.push(str);
        //                         }
        //                         }
        //                         temp.addons = [];
        //                         if(docdata[0].documentData[0].foods[i].addons.length > 0)
        //                         {
        //                         for(a in docdata[0].documentData[0].foods[i].addons)
        //                         {
        //                             temp.addons.push({name:docdata[0].documentData[0].foods[i].addons[a].name,price:docdata[0].documentData[0].foods[i].addons[a].price});
        //                         }
        //                         }

        //                     docdata[0].documentData[0].food_list.push(temp);
        //                 }*/
        //                     // docdata[0].documentData[0].base_pack = [];
        //                     // docdata[0].documentData[0].addons = [];
        //                     // for (i in docdata[0].documentData[0].foods) {
        //                     //     if (typeof docdata[0].documentData[0].foods[i].base_pack != 'undefined') {
        //                     //         if (docdata[0].documentData[0].foods[i].base_pack.length > 0) {
        //                     //             for (b in docdata[0].documentData[0].foods[i].base_pack) {
        //                     //                 docdata[0].documentData[0].base_pack.push(docdata[0].documentData[0].foods[i].base_pack[b]);
        //                     //             }

        //                     //         }
        //                     //     }
        //                     //     if (typeof docdata[0].documentData[0].foods[i].addons != 'undefined') {
        //                     //         if (docdata[0].documentData[0].foods[i].addons.length > 0) {
        //                     //             for (a in docdata[0].documentData[0].foods[i].addons) {
        //                     //                 docdata[0].documentData[0].addons.push(docdata[0].documentData[0].foods[i].addons[a]);
        //                     //             }
        //                     //         }
        //                     //     }
        //                     // }
        //                     res.send(docdata[0].documentData);
        //                 });
        //             });
        //         } else {
        //             res.send([0, 0]);
        //         }
        //     }
        // });
    }
    function timestampToISOString(timestampStr) {
        // Convert the timestamp string to a number
        const timestamp = Number(timestampStr);

        // Create a new Date object using the timestamp
        const date = new Date(timestamp);

        // Extract date components
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is zero-indexed
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

        // Construct the ISO 8601 formatted string with timezone offset
        const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+00:00`;

        return isoString;
    }






    router.getReturnOrder = async function (req, res) {
        console.log(req.body, 'BODY');
        try {
            // Create a new Date object using the timestamp
            const date = Number(req.body.time);
            let isoString = timestampToISOString(date);
            console.log(isoString);
            console.log(typeof isoString);

            isoString = new Date(isoString)
            console.log(isoString);
            console.log(typeof isoString);

            if (req.body.status == 16) {

                query = {
                    $match: {
                        _id: new mongoose.Types.ObjectId(req.body.order_id),
                        "foods.status": 16,
                        "foods.return_date": isoString
                    }
                };
            }
            if (req.body.status == 17) {
                query = { $match: { _id: new mongoose.Types.ObjectId(req.body.order_id), "foods.status": 17, "foods.collected_date": isoString } };
            }
            if (req.body.status == 18) {
                query = { $match: { _id: new mongoose.Types.ObjectId(req.body.order_id), "foods.status": 18, "foods.refund_date": isoString } };
            }

            if (req.body.sort) {
                var sorted = req.body.sort.field;
            }

            var usersQuery = [
                {
                    $unwind: "$foods" // Unwind the foods array
                },
                query,

                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "city",
                        localField: "city_id",
                        foreignField: "_id",
                        as: "restaurants"
                    }
                },
                { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "drivers",
                        localField: "driver_id",
                        foreignField: "_id",
                        as: "driver"
                    }
                },
                { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        restaurants: 1,
                        foods: 1,
                        user: 1,
                        driver: 1,
                        order_id: 1,
                        delivery_address: 1,
                        billings: 1,
                        status: 1,
                        restaurant_time_out_alert: 1,
                        cancellationreason: 1,
                        refundStatus: 1,
                        returnStatus: 1,
                        schedule_date: 1,
                        schedule_time_slot: 1,
                        seen_status: 1,
                        sample_email: 1,
                        createdAt: 1
                    }
                }
            ];
            const docdata = await db.GetAggregation('orders', usersQuery)
            console.log(JSON.stringify(docdata, null, 2), 'DocData');
            if (docdata.length > 0) {
                res.send(docdata[0]);
            }
            else {
                res.send([]);
            }
        } catch (error) {
            console.log(error);
            res.status(500).send({ error: true, message: 'There is something went wrong' })
        }
    }

    router.getOrderdata = async function (req, res) {
        var orderid = (req.body.id).toUpperCase();
        var editTasksQuery = [{
            $match: {
                order_id: orderid
            }
        },
        {
            $lookup: {
                from: "food",
                localField: "food_id",
                foreignField: "_id",
                as: "foods"
            }
        },
        {
            $lookup: {
                from: "restaurant",
                localField: "restaurant_id",
                foreignField: "_id",
                as: "restaurants"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $project: {
                order_id: 1,
                restaurants: 1,
                foods: 1,
                user: 1,
                delivery_address: 1,
                status: 1
            }
        }, {
            $project: {
                question: 1,
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }
        ];
        const docdata = await db.GetAggregation('orders', editTasksQuery)
        if (!docdata) {
            res.send(err);
        } else {
            if (docdata.length != 0) {
                res.send(docdata[0].documentData);
            } else {
                res.status(400).send({ message: "Order-ID is invalid" });
            }
        }
        // db.GetAggregation('orders', editTasksQuery, function (err, docdata) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         if (docdata.length != 0) {
        //             res.send(docdata[0].documentData);
        //         } else {
        //             res.status(400).send({ message: "Order-ID is invalid" });
        //         }
        //     }
        // });
    }


    router.cancel = async function (req, res) {
        if (req.body.id) {
            const settings = await db.GetOneDocument('settings', { 'alias': 'general' }, {}, {})
            if (settings.status === false || !settings) {
                res.send({ status: 0, message: 'Configure your website settings' });
            } else {
                const social_settings = await db.GetOneDocument('settings', { 'alias': 'social_networks' }, {}, {})
                if (social_settings.status === false) {
                    res.send({ status: 0, message: 'Configure your website settings' });
                } else {
                    const reresult = await db.GetOneDocument('orders', { order_id: req.body.id }, {}, {},)
                    const userresult = await db.GetOneDocument('users', { _id: reresult.user_id }, {}, {})
                    const result = await db.GetOneDocument('orders', { order_id: req.body.id }, {}, {})
                    if (!result || result.doc.length == 0) {
                        var data1 = "Invalid";
                        res.send(data1);
                    } else if (result.doc.status == 10 || result.doc.status == 9 || result.doc.status == 2) {
                        var data1 = "Assigned";
                        res.send(data1);
                    } else if (result.doc.status == 7) {
                        var data1 = "Delivered";
                        res.send(data1);
                    } else {
                        var role = 2;
                        if (req.body.val.role == 'admin') {
                            role = 1;
                        }
                        db.GetCount('orders', { driver_id: result.doc.driver_id, status: { $in: [5, 6] } }, (err, count) => {
                            let jobcount = count || 0;
                            db.UpdateDocument('drivers', { '_id': result.doc.driver_id }, { currentJob: jobcount }, {}, (err, driverUp) => {
                                db.UpdateDocument('orders', { order_id: req.body.id }, { status: 10, cancelled_role: role, cancelled_name: req.body.val.username, cancellationreason: 'Cancelled by admin' }, function (err, docdata) {
                                    if (err) {
                                        //console.log(err)
                                        res.send(err);
                                    } else {
                                        var newdata = {};
                                        newdata.logo = settings.doc.settings.site_url + settings.doc.settings.logo;
                                        newdata.site_url = settings.doc.settings.site_url;
                                        newdata.play_store = settings.doc.settings.site_url + social_settings.doc.settings.mobileapp[0].landingimg;
                                        newdata.android_link = social_settings.doc.settings.mobileapp[0].url[0].url;
                                        newdata.app_store = settings.doc.settings.site_url + social_settings.doc.settings.mobileapp[1].landingimg;
                                        newdata.ios_link = social_settings.doc.settings.mobileapp[1].url[0].url;
                                        newdata.facebook_url = social_settings.doc.settings.link[0].url;
                                        newdata.facebook_img = settings.doc.settings.site_url + social_settings.doc.settings.link[0].img;
                                        newdata.twitter_img = settings.doc.settings.site_url + social_settings.doc.settings.link[1].img;
                                        newdata.twitter_url = social_settings.doc.settings.link[1].url;
                                        newdata.linkedin_url = social_settings.doc.settings.link[2].url;
                                        newdata.linkedin_img = settings.doc.settings.site_url + social_settings.doc.settings.link[2].img;
                                        newdata.pinterest_url = social_settings.doc.settings.link[3].url;
                                        newdata.pinterest_img = settings.doc.settings.site_url + social_settings.doc.settings.link[3].img;
                                        mailData1 = {};
                                        mailData1.template = 'admincancel_order_touser';
                                        mailData1.to = userresult.email;
                                        mailData1.html = [];
                                        mailData1.html.push({ name: 'name', value: userresult.username || "" });
                                        mailData1.html.push({ name: 'order_id', value: req.body.id || "" });
                                        mailData1.html.push({ name: 'logo', value: newdata.logo || "" });
                                        mailData1.html.push({ name: 'site_url', value: newdata.site_url || "" });
                                        mailData1.html.push({ name: 'play_store', value: newdata.play_store || "" });
                                        mailData1.html.push({ name: 'android_link', value: newdata.android_link || "" });
                                        mailData1.html.push({ name: 'app_store', value: newdata.app_store || "" });
                                        mailData1.html.push({ name: 'ios_link', value: newdata.ios_link || "" });
                                        mailData1.html.push({ name: 'facebook_url', value: newdata.facebook_url || "" });
                                        mailData1.html.push({ name: 'facebook_img', value: newdata.facebook_img || "" });
                                        mailData1.html.push({ name: 'twitter_url', value: newdata.twitter_url || "" });
                                        mailData1.html.push({ name: 'twitter_img', value: newdata.twitter_img || "" });
                                        mailData1.html.push({ name: 'linkedin_url', value: newdata.linkedin_url || "" });
                                        mailData1.html.push({ name: 'linkedin_img', value: newdata.linkedin_img || "" });
                                        mailData1.html.push({ name: 'pinterest_url', value: newdata.pinterest_url || "" });
                                        mailData1.html.push({ name: 'pinterest_img', value: newdata.pinterest_img || "" });
                                        mailcontent.sendmail(mailData1, function (err, response) { });

                                        var android_driver = result.doc.driver_id;
                                        var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                                        var response_time = 250;
                                        var options = [req.body.id, android_driver];
                                        push.sendPushnotification(android_driver, message, 'admin_cancel', 'ANDROID', options, 'DRIVER', function (err, response, body) { });

                                        var android_driver2 = reresult.restaurant_id;
                                        var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                                        var response_time = 250;
                                        var options = [req.body.id, android_driver2];
                                        push.sendPushnotification(android_driver2, message, 'admin_cancel', 'ANDROID', options, 'RESTAURANT', function (err, response, body) { });

                                        var android_driver1 = reresult.user_id;
                                        var message1 = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                                        var response_time1 = 250;
                                        var options1 = [req.body.id, android_driver1];
                                        push.sendPushnotification(android_driver1, message1, 'admin_cancel', 'ANDROID', options1, 'USER', function (err, response, body) { });


                                        res.send(docdata);
                                    }
                                });
                            })
                        })
                    }
                    // db.GetOneDocument('orders', { order_id: req.body.id }, {}, {}, function (err, reresult) {
                    //     db.GetOneDocument('users', { _id: reresult.user_id }, {}, {}, function (err, userresult) {
                    //         db.GetOneDocument('orders', { order_id: req.body.id }, {}, {}, function (err, result) {
                    //             //db.GetOneDocument('orders', { order_id: req.body.id, status: 10}, {}, {}, function (err, result) {
                    //             if (!result || result.length == 0) {
                    //                 var data1 = "Invalid";
                    //                 res.send(data1);
                    //             } else if (result.status == 10 || result.status == 9 || result.status == 2) {
                    //                 var data1 = "Assigned";
                    //                 res.send(data1);
                    //             } else if (result.status == 7) {
                    //                 var data1 = "Delivered";
                    //                 res.send(data1);
                    //             } else {
                    //                 var role = 2;
                    //                 if (req.body.val.role == 'admin') {
                    //                     role = 1;
                    //                 }
                    //                 db.GetCount('orders', { driver_id: result.driver_id, status: { $in: [5, 6] } }, (err, count) => {
                    //                     let jobcount = count || 0;
                    //                     db.UpdateDocument('drivers', { '_id': result.driver_id }, { currentJob: jobcount }, {}, (err, driverUp) => {
                    //                         db.UpdateDocument('orders', { order_id: req.body.id }, { status: 10, cancelled_role: role, cancelled_name: req.body.val.username, cancellationreason: 'Cancelled by admin' }, function (err, docdata) {
                    //                             if (err) {
                    //                                 //console.log(err)
                    //                                 res.send(err);
                    //                             } else {
                    //                                 var newdata = {};
                    //                                 newdata.logo = settings.settings.site_url + settings.settings.logo;
                    //                                 newdata.site_url = settings.settings.site_url;
                    //                                 newdata.play_store = settings.settings.site_url + social_settings.settings.mobileapp[0].landingimg;
                    //                                 newdata.android_link = social_settings.settings.mobileapp[0].url[0].url;
                    //                                 newdata.app_store = settings.settings.site_url + social_settings.settings.mobileapp[1].landingimg;
                    //                                 newdata.ios_link = social_settings.settings.mobileapp[1].url[0].url;
                    //                                 newdata.facebook_url = social_settings.settings.link[0].url;
                    //                                 newdata.facebook_img = settings.settings.site_url + social_settings.settings.link[0].img;
                    //                                 newdata.twitter_img = settings.settings.site_url + social_settings.settings.link[1].img;
                    //                                 newdata.twitter_url = social_settings.settings.link[1].url;
                    //                                 newdata.linkedin_url = social_settings.settings.link[2].url;
                    //                                 newdata.linkedin_img = settings.settings.site_url + social_settings.settings.link[2].img;
                    //                                 newdata.pinterest_url = social_settings.settings.link[3].url;
                    //                                 newdata.pinterest_img = settings.settings.site_url + social_settings.settings.link[3].img;
                    //                                 mailData1 = {};
                    //                                 mailData1.template = 'admincancel_order_touser';
                    //                                 mailData1.to = userresult.email;
                    //                                 mailData1.html = [];
                    //                                 mailData1.html.push({ name: 'name', value: userresult.username || "" });
                    //                                 mailData1.html.push({ name: 'order_id', value: req.body.id || "" });
                    //                                 mailData1.html.push({ name: 'logo', value: newdata.logo || "" });
                    //                                 mailData1.html.push({ name: 'site_url', value: newdata.site_url || "" });
                    //                                 mailData1.html.push({ name: 'play_store', value: newdata.play_store || "" });
                    //                                 mailData1.html.push({ name: 'android_link', value: newdata.android_link || "" });
                    //                                 mailData1.html.push({ name: 'app_store', value: newdata.app_store || "" });
                    //                                 mailData1.html.push({ name: 'ios_link', value: newdata.ios_link || "" });
                    //                                 mailData1.html.push({ name: 'facebook_url', value: newdata.facebook_url || "" });
                    //                                 mailData1.html.push({ name: 'facebook_img', value: newdata.facebook_img || "" });
                    //                                 mailData1.html.push({ name: 'twitter_url', value: newdata.twitter_url || "" });
                    //                                 mailData1.html.push({ name: 'twitter_img', value: newdata.twitter_img || "" });
                    //                                 mailData1.html.push({ name: 'linkedin_url', value: newdata.linkedin_url || "" });
                    //                                 mailData1.html.push({ name: 'linkedin_img', value: newdata.linkedin_img || "" });
                    //                                 mailData1.html.push({ name: 'pinterest_url', value: newdata.pinterest_url || "" });
                    //                                 mailData1.html.push({ name: 'pinterest_img', value: newdata.pinterest_img || "" });
                    //                                 mailcontent.sendmail(mailData1, function (err, response) { });

                    //                                 var android_driver = result.driver_id;
                    //                                 var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                    //                                 var response_time = 250;
                    //                                 var options = [req.body.id, android_driver];
                    //                                 push.sendPushnotification(android_driver, message, 'admin_cancel', 'ANDROID', options, 'DRIVER', function (err, response, body) { });

                    //                                 var android_driver2 = reresult.restaurant_id;
                    //                                 var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                    //                                 var response_time = 250;
                    //                                 var options = [req.body.id, android_driver2];
                    //                                 push.sendPushnotification(android_driver2, message, 'admin_cancel', 'ANDROID', options, 'RESTAURANT', function (err, response, body) { });

                    //                                 var android_driver1 = reresult.user_id;
                    //                                 var message1 = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                    //                                 var response_time1 = 250;
                    //                                 var options1 = [req.body.id, android_driver1];
                    //                                 push.sendPushnotification(android_driver1, message1, 'admin_cancel', 'ANDROID', options1, 'USER', function (err, response, body) { });


                    //                                 res.send(docdata);
                    //                             }
                    //                         });
                    //                     })
                    //                 })
                    //             }
                    //         });
                    //     });
                    // });
                }
                // db.GetOneDocument('settings', { 'alias': 'social_networks' }, {}, {}, function (err, social_settings) {
                //     if (err || !social_settings) {
                //         res.send({ status: 0, message: 'Configure your website settings' });
                //     } else {
                //         db.GetOneDocument('orders', { order_id: req.body.id }, {}, {}, function (err, reresult) {
                //             db.GetOneDocument('users', { _id: reresult.user_id }, {}, {}, function (err, userresult) {
                //                 db.GetOneDocument('orders', { order_id: req.body.id }, {}, {}, function (err, result) {
                //                     //db.GetOneDocument('orders', { order_id: req.body.id, status: 10}, {}, {}, function (err, result) {
                //                     if (!result || result.length == 0) {
                //                         var data1 = "Invalid";
                //                         res.send(data1);
                //                     } else if (result.status == 10 || result.status == 9 || result.status == 2) {
                //                         var data1 = "Assigned";
                //                         res.send(data1);
                //                     } else if (result.status == 7) {
                //                         var data1 = "Delivered";
                //                         res.send(data1);
                //                     } else {
                //                         var role = 2;
                //                         if (req.body.val.role == 'admin') {
                //                             role = 1;
                //                         }
                //                         db.GetCount('orders', { driver_id: result.driver_id, status: { $in: [5, 6] } }, (err, count) => {
                //                             let jobcount = count || 0;
                //                             db.UpdateDocument('drivers', { '_id': result.driver_id }, { currentJob: jobcount }, {}, (err, driverUp) => {
                //                                 db.UpdateDocument('orders', { order_id: req.body.id }, { status: 10, cancelled_role: role, cancelled_name: req.body.val.username, cancellationreason: 'Cancelled by admin' }, function (err, docdata) {
                //                                     if (err) {
                //                                         //console.log(err)
                //                                         res.send(err);
                //                                     } else {
                //                                         var newdata = {};
                //                                         newdata.logo = settings.settings.site_url + settings.settings.logo;
                //                                         newdata.site_url = settings.settings.site_url;
                //                                         newdata.play_store = settings.settings.site_url + social_settings.settings.mobileapp[0].landingimg;
                //                                         newdata.android_link = social_settings.settings.mobileapp[0].url[0].url;
                //                                         newdata.app_store = settings.settings.site_url + social_settings.settings.mobileapp[1].landingimg;
                //                                         newdata.ios_link = social_settings.settings.mobileapp[1].url[0].url;
                //                                         newdata.facebook_url = social_settings.settings.link[0].url;
                //                                         newdata.facebook_img = settings.settings.site_url + social_settings.settings.link[0].img;
                //                                         newdata.twitter_img = settings.settings.site_url + social_settings.settings.link[1].img;
                //                                         newdata.twitter_url = social_settings.settings.link[1].url;
                //                                         newdata.linkedin_url = social_settings.settings.link[2].url;
                //                                         newdata.linkedin_img = settings.settings.site_url + social_settings.settings.link[2].img;
                //                                         newdata.pinterest_url = social_settings.settings.link[3].url;
                //                                         newdata.pinterest_img = settings.settings.site_url + social_settings.settings.link[3].img;
                //                                         mailData1 = {};
                //                                         mailData1.template = 'admincancel_order_touser';
                //                                         mailData1.to = userresult.email;
                //                                         mailData1.html = [];
                //                                         mailData1.html.push({ name: 'name', value: userresult.username || "" });
                //                                         mailData1.html.push({ name: 'order_id', value: req.body.id || "" });
                //                                         mailData1.html.push({ name: 'logo', value: newdata.logo || "" });
                //                                         mailData1.html.push({ name: 'site_url', value: newdata.site_url || "" });
                //                                         mailData1.html.push({ name: 'play_store', value: newdata.play_store || "" });
                //                                         mailData1.html.push({ name: 'android_link', value: newdata.android_link || "" });
                //                                         mailData1.html.push({ name: 'app_store', value: newdata.app_store || "" });
                //                                         mailData1.html.push({ name: 'ios_link', value: newdata.ios_link || "" });
                //                                         mailData1.html.push({ name: 'facebook_url', value: newdata.facebook_url || "" });
                //                                         mailData1.html.push({ name: 'facebook_img', value: newdata.facebook_img || "" });
                //                                         mailData1.html.push({ name: 'twitter_url', value: newdata.twitter_url || "" });
                //                                         mailData1.html.push({ name: 'twitter_img', value: newdata.twitter_img || "" });
                //                                         mailData1.html.push({ name: 'linkedin_url', value: newdata.linkedin_url || "" });
                //                                         mailData1.html.push({ name: 'linkedin_img', value: newdata.linkedin_img || "" });
                //                                         mailData1.html.push({ name: 'pinterest_url', value: newdata.pinterest_url || "" });
                //                                         mailData1.html.push({ name: 'pinterest_img', value: newdata.pinterest_img || "" });
                //                                         mailcontent.sendmail(mailData1, function (err, response) { });

                //                                         var android_driver = result.driver_id;
                //                                         var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                //                                         var response_time = 250;
                //                                         var options = [req.body.id, android_driver];
                //                                         push.sendPushnotification(android_driver, message, 'admin_cancel', 'ANDROID', options, 'DRIVER', function (err, response, body) { });

                //                                         var android_driver2 = reresult.restaurant_id;
                //                                         var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                //                                         var response_time = 250;
                //                                         var options = [req.body.id, android_driver2];
                //                                         push.sendPushnotification(android_driver2, message, 'admin_cancel', 'ANDROID', options, 'RESTAURANT', function (err, response, body) { });

                //                                         var android_driver1 = reresult.user_id;
                //                                         var message1 = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
                //                                         var response_time1 = 250;
                //                                         var options1 = [req.body.id, android_driver1];
                //                                         push.sendPushnotification(android_driver1, message1, 'admin_cancel', 'ANDROID', options1, 'USER', function (err, response, body) { });


                //                                         res.send(docdata);
                //                                     }
                //                                 });
                //                             })
                //                         })
                //                     }
                //                 });
                //             });
                //         });
                //     }
                // });
            }
            // db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            //     if (err || !settings) {
            //         res.send({ status: 0, message: 'Configure your website settings' });
            //     } else {
            //         db.GetOneDocument('settings', { 'alias': 'social_networks' }, {}, {}, function (err, social_settings) {
            //             if (err || !social_settings) {
            //                 res.send({ status: 0, message: 'Configure your website settings' });
            //             } else {
            //                 db.GetOneDocument('orders', { order_id: req.body.id }, {}, {}, function (err, reresult) {
            //                     db.GetOneDocument('users', { _id: reresult.user_id }, {}, {}, function (err, userresult) {
            //                         db.GetOneDocument('orders', { order_id: req.body.id }, {}, {}, function (err, result) {
            //                             //db.GetOneDocument('orders', { order_id: req.body.id, status: 10}, {}, {}, function (err, result) {
            //                             if (!result || result.length == 0) {
            //                                 var data1 = "Invalid";
            //                                 res.send(data1);
            //                             } else if (result.status == 10 || result.status == 9 || result.status == 2) {
            //                                 var data1 = "Assigned";
            //                                 res.send(data1);
            //                             } else if (result.status == 7) {
            //                                 var data1 = "Delivered";
            //                                 res.send(data1);
            //                             } else {
            //                                 var role = 2;
            //                                 if (req.body.val.role == 'admin') {
            //                                     role = 1;
            //                                 }
            //                                 db.GetCount('orders', { driver_id: result.driver_id, status: { $in: [5, 6] } }, (err, count) => {
            //                                     let jobcount = count || 0;
            //                                     db.UpdateDocument('drivers', { '_id': result.driver_id }, { currentJob: jobcount }, {}, (err, driverUp) => {
            //                                         db.UpdateDocument('orders', { order_id: req.body.id }, { status: 10, cancelled_role: role, cancelled_name: req.body.val.username, cancellationreason: 'Cancelled by admin' }, function (err, docdata) {
            //                                             if (err) {
            //                                                 //console.log(err)
            //                                                 res.send(err);
            //                                             } else {
            //                                                 var newdata = {};
            //                                                 newdata.logo = settings.settings.site_url + settings.settings.logo;
            //                                                 newdata.site_url = settings.settings.site_url;
            //                                                 newdata.play_store = settings.settings.site_url + social_settings.settings.mobileapp[0].landingimg;
            //                                                 newdata.android_link = social_settings.settings.mobileapp[0].url[0].url;
            //                                                 newdata.app_store = settings.settings.site_url + social_settings.settings.mobileapp[1].landingimg;
            //                                                 newdata.ios_link = social_settings.settings.mobileapp[1].url[0].url;
            //                                                 newdata.facebook_url = social_settings.settings.link[0].url;
            //                                                 newdata.facebook_img = settings.settings.site_url + social_settings.settings.link[0].img;
            //                                                 newdata.twitter_img = settings.settings.site_url + social_settings.settings.link[1].img;
            //                                                 newdata.twitter_url = social_settings.settings.link[1].url;
            //                                                 newdata.linkedin_url = social_settings.settings.link[2].url;
            //                                                 newdata.linkedin_img = settings.settings.site_url + social_settings.settings.link[2].img;
            //                                                 newdata.pinterest_url = social_settings.settings.link[3].url;
            //                                                 newdata.pinterest_img = settings.settings.site_url + social_settings.settings.link[3].img;
            //                                                 mailData1 = {};
            //                                                 mailData1.template = 'admincancel_order_touser';
            //                                                 mailData1.to = userresult.email;
            //                                                 mailData1.html = [];
            //                                                 mailData1.html.push({ name: 'name', value: userresult.username || "" });
            //                                                 mailData1.html.push({ name: 'order_id', value: req.body.id || "" });
            //                                                 mailData1.html.push({ name: 'logo', value: newdata.logo || "" });
            //                                                 mailData1.html.push({ name: 'site_url', value: newdata.site_url || "" });
            //                                                 mailData1.html.push({ name: 'play_store', value: newdata.play_store || "" });
            //                                                 mailData1.html.push({ name: 'android_link', value: newdata.android_link || "" });
            //                                                 mailData1.html.push({ name: 'app_store', value: newdata.app_store || "" });
            //                                                 mailData1.html.push({ name: 'ios_link', value: newdata.ios_link || "" });
            //                                                 mailData1.html.push({ name: 'facebook_url', value: newdata.facebook_url || "" });
            //                                                 mailData1.html.push({ name: 'facebook_img', value: newdata.facebook_img || "" });
            //                                                 mailData1.html.push({ name: 'twitter_url', value: newdata.twitter_url || "" });
            //                                                 mailData1.html.push({ name: 'twitter_img', value: newdata.twitter_img || "" });
            //                                                 mailData1.html.push({ name: 'linkedin_url', value: newdata.linkedin_url || "" });
            //                                                 mailData1.html.push({ name: 'linkedin_img', value: newdata.linkedin_img || "" });
            //                                                 mailData1.html.push({ name: 'pinterest_url', value: newdata.pinterest_url || "" });
            //                                                 mailData1.html.push({ name: 'pinterest_img', value: newdata.pinterest_img || "" });
            //                                                 mailcontent.sendmail(mailData1, function (err, response) { });

            //                                                 var android_driver = result.driver_id;
            //                                                 var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
            //                                                 var response_time = 250;
            //                                                 var options = [req.body.id, android_driver];
            //                                                 push.sendPushnotification(android_driver, message, 'admin_cancel', 'ANDROID', options, 'DRIVER', function (err, response, body) { });

            //                                                 var android_driver2 = reresult.restaurant_id;
            //                                                 var message = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
            //                                                 var response_time = 250;
            //                                                 var options = [req.body.id, android_driver2];
            //                                                 push.sendPushnotification(android_driver2, message, 'admin_cancel', 'ANDROID', options, 'RESTAURANT', function (err, response, body) { });

            //                                                 var android_driver1 = reresult.user_id;
            //                                                 var message1 = CONFIG.NOTIFICATION.ADMIN_CANCELLED_ORDER;
            //                                                 var response_time1 = 250;
            //                                                 var options1 = [req.body.id, android_driver1];
            //                                                 push.sendPushnotification(android_driver1, message1, 'admin_cancel', 'ANDROID', options1, 'USER', function (err, response, body) { });


            //                                                 res.send(docdata);
            //                                             }
            //                                         });
            //                                     })
            //                                 })
            //                             }
            //                         });
            //                     });
            //                 });
            //             }
            //         });
            //     }
            // });
        }
    }


    router.adminCancelOrders = async function (req, res) {
        //console.log("come to main part...");
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }

        var query = { status: { $in: [10, 19] } };

        // if (req.body.status == 1) { //new orders
        //     query = { status: { $eq: 1 } };
        // } else if (req.body.status == 3) { //processing
        //     query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 4 } }] };
        // } else if (req.body.status == 6) {//order picked
        //     query = { status: { $eq: 6 } };
        // } else if (req.body.status == 7) {  // delivered
        //     query = { $or: [{ status: { $eq: 7 } }, { status: { $eq: 8 } }] };
        // } else if (req.body.status == 2) {  // denied ny restaurant
        //     query = { status: { $eq: 2 } };
        // } else if (req.body.status == 9) {  // canceled by user
        //     query = { status: { $eq: 9 } };
        // } else if (req.body.status == 10) {  // canceled by admin
        //     query = { status: { $eq: 10 } };
        // }
        // else { query = { status: { $ne: 0 } }; }

        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }

        var usersQuery = [{
            "$match": query

        }, {
            $lookup: {
                from: "food",
                localField: "food_id",
                foreignField: "_id",
                as: "foods"
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        }, {
            $lookup: {
                from: "restaurant",
                localField: "restaurant_id",
                foreignField: "_id",
                as: "restaurants"
            }
        },
        {
            $project: {
                restaurants: 1,
                foods: 1,
                user: 1,
                cancelled_name: 1,
                cancelled_role: 1,
                order_id: 1,
                delivery_address: 1,
                status: 1
            }
        }, {
            $project: {
                question: 1,
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }
        ];


        var condition = { status: { $ne: 0 } };
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

        if (req.body.search) {
            condition['foods.name'] = { $regex: new RegExp('^' + req.body.search, 'i') };
            var searchs = req.body.search;
            usersQuery.push({
                "$match": {
                    $or: [
                        { "documentData.foods.name": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.order_id": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.user.username": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.restaurants.restaurantname": { $regex: searchs + '.*', $options: 'si' } }
                    ]
                }
            });

            //search limit
            usersQuery.push({ $group: { "_id": null, "countvalue": { "$sum": 1 }, "documentData": { $push: "$documentData" } } });
            usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
            if (req.body.limit && req.body.skip >= 0) {
                usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
            }
            usersQuery.push({ $group: { "_id": null, "count": { "$first": "$countvalue" }, "documentData": { $push: "$documentData" } } });
            //search limit
        }

        var sorting = {};
        if (req.body.sort) {
            var sorter = 'documentData.' + req.body.sort.field;
            sorting[sorter] = req.body.sort.order;
            usersQuery.push({ $sort: sorting });
        } else {
            sorting["documentData.createdAt"] = -1;
            usersQuery.push({ $sort: sorting });
        }

        if ((req.body.limit && req.body.skip >= 0) && !req.body.search) {
            usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        }

        if (!req.body.search) {
            usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
        }

        const docdata = await db.GetAggregation('orders', usersQuery)
        if (!docdata) {
            res.send(err);
        } else {
            var count = {};
            const cancelValue = await db.GetCount('orders', { status: { $eq: 10 } })
            count.cancelValue = cancelValue;
            var totalCount = count;
            if (docdata.length != 0) {
                res.send([docdata[0].documentData, docdata[0].count, totalCount]);
            } else {
                res.send([0, 0]);
            }
        }

    }


    router.getorderlist = async function (req, res) {
        const orders = await db.GetDocument('orders', { seen_status: { $eq: 0 }, status: { $eq: 1 } }, {}, {})
        if (orders.status === false) {
            res.send(err);
        } else {
            res.send(orders);
        }
        // db.GetDocument('orders', { seen_status: { $eq: 0 }, status: { $eq: 1 } }, {}, {}, function (err, orders) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         res.send(orders);
        //     }
        // });
    }

    router.ordersDashboard = async (req, res) => {
        var data = {};
        data.total = 0;
        data.neworder = 0;
        data.ongoing = 0;
        data.completed = 0;
        data.cancelled = 0;
        data.packed = 0;
        let dat = {};
        try {
            data.total = await db.GetCount('orders', { status: { $in: [1, 2, 3, 4, 5, 6, 7, 9, 10, 15] } });
            data.neworder = await db.GetCount('orders', { status: { $eq: 1 } })
            data.ongoing = await db.GetCount('orders', { $or: [{ status: { $eq: 4 } }, { status: { $eq: 5 } }, { status: { $eq: 6 } }] })
            data.completed = await db.GetCount('orders', { status: { $eq: 7 } })
            data.cancelled = await db.GetCount('orders', { $or: [{ status: { $eq: 2 } }, { status: { $eq: 9 } }, { status: { $eq: 10 } }] })
            data.packed = await db.GetCount('orders', { status: { $eq: 3 } })
            res.send(data)
        } catch (error) {
            console.log(error);
        }
        // async.series([(cb) => {
        //     db.GetCount('orders', { status: { $in: [1, 2, 3, 4, 5, 6, 7, 9, 10, 15] } }, (err, count) => {
        //         // console.log('=============', count)
        //         if (err) {
        //             cb(null);
        //         } else {
        //             data.total = count;
        //             // console.log('data.total', data.total)
        //             cb(null);
        //         }
        //     });
        // }, (cb) => {
        //     db.GetCount('orders', { status: { $eq: 1 } }, (err, count) => {
        //         if (err) {
        //             cb(null);
        //         } else {
        //             // console.log('neworder', count)
        //             data.neworder = count;
        //             cb(null);
        //         }
        //     })
        // }, (cb) => {
        //     db.GetCount('orders', { $or: [{ status: { $eq: 4 } }, { status: { $eq: 5 } }, { status: { $eq: 6 } }] }, (err, count) => {
        //         if (err) {
        //             cb(null);
        //         } else {
        //             // console.log('ongoing', count)
        //             data.ongoing = count;
        //             cb(null);
        //         }

        //     })
        // }, (cb) => {
        //     db.GetCount('orders', { status: { $eq: 7 } }, (err, count) => {
        //         if (err) {
        //             cb(null);
        //         } else {
        //             // console.log('completed', count)
        //             data.completed = count;
        //             cb(null);
        //         }
        //     })
        // }, (cb) => {
        //     db.GetCount('orders', { $or: [{ status: { $eq: 2 } }, { status: { $eq: 9 } }, { status: { $eq: 10 } }] }, (err, count) => {
        //         if (err) {
        //             cb(null);
        //         } else {
        //             // console.log('cancelled', count)
        //             data.cancelled = count;
        //             cb(null);
        //         }
        //     })
        // },
        // (cb) => {
        //     db.GetCount('orders', { status: { $eq: 3 } }, (err, count) => {
        //         // console.log("-=-=-=-==", count)
        //         if (err) {
        //             cb(null);
        //         } else {
        //             // console.log('completed', count)
        //             data.packed = count;
        //             cb(null);
        //         }
        //     })
        // }
        // ], (err, ress) => {
        //     res.send(data);
        // })
    }

    router.orderAccept = async (req, res) => {
        const orders = await db.GetOneDocument('orders', { order_id: req.body.id, status: 1 }, {}, {})
        if (orders.status === false) {
            return res.send({ status: 0, message: error.message });
        } else {
            if (orders) {
                const transactionDetails = await db.GetOneDocument('transaction', { "_id": orders.transaction_id }, {}, {})
                if (!transactionDetails) {
                    res.send({ "status": 0, "message": 'Invalid Error, Please check your data' });
                } else {
                    const result = await db.UpdateDocument('orders', { order_id: req.body.id }, { $set: { "status": 3 } }, {})
                    if (result.status === false) {
                        return res.send({ status: 0, message: error.message });
                    } else {
                        return res.send({ status: 1, message: "Order Accepted Successfully" })
                    }
                    // db.UpdateDocument('orders', { order_id: req.body.id }, { $set: { "status": 3 } }, {}, (error, result) => {
                    //     if (error) {
                    //         return res.send({ status: 0, message: error.message });
                    //     } else {
                    //         return res.send({ status: 1, message: "Order Accepted Successfully" })
                    //     }
                    // })
                }
                // db.GetOneDocument('transaction', { "_id": orders.transaction_id }, {}, {}, function (err, transactionDetails) {
                //     if (err || !transactionDetails) {
                //         res.send({ "status": 0, "message": 'Invalid Error, Please check your data' });
                //     } else {
                //         db.UpdateDocument('orders', { order_id: req.body.id }, { $set: { "status": 3 } }, {}, (error, result) => {
                //             if (error) {
                //                 return res.send({ status: 0, message: error.message });
                //             } else {
                //                 return res.send({ status: 1, message: "Order Accepted Successfully" })
                //             }
                //         })
                //     }
                // })
            } else {
                return res.send({ status: 0, message: "Order not found" });
            }
        }
        // db.GetOneDocument('orders', { order_id: req.body.id, status: 1 }, {}, {}, (error, orders) => {
        //     if (error) {
        //         return res.send({ status: 0, message: error.message });
        //     } else {
        //         if (orders) {
        //             db.GetOneDocument('transaction', { "_id": orders.transaction_id }, {}, {}, function (err, transactionDetails) {
        //                 if (err || !transactionDetails) {
        //                     res.send({ "status": 0, "message": 'Invalid Error, Please check your data' });
        //                 } else {
        //                     db.UpdateDocument('orders', { order_id: req.body.id }, { $set: { "status": 3 } }, {}, (error, result) => {
        //                         if (error) {
        //                             return res.send({ status: 0, message: error.message });
        //                         } else {
        //                             return res.send({ status: 1, message: "Order Accepted Successfully" })
        //                         }
        //                     })
        //                 }
        //             })
        //         } else {
        //             return res.send({ status: 0, message: "Order not found" });
        //         }
        //     }

        // })
    }

    router.AcceptOrder = function (req, res) {
        var data = {};
        var request = {};
        request.order_id = req.body.id;
        db.GetOneDocument('orders', { 'order_id': request.order_id }, {}, {}, function (err, orders) {
            if (err || !orders) {
                res.status(400).send({ message: 'Invalid orders, Please check your data' });
            } else {
                if (orders.status == 9) { res.status(400).send({ message: 'Order is already canceled by user' }); } else if (orders.status == 10) { res.status(400).send({ message: 'Order is already canceled by admin' }); } else if (orders.status == 0) { res.status(400).send({ message: 'Your time is exceeded to accept this order' }); } else if (orders.status == 1 || orders.status == 15) {
                    // db.GetOneDocument('city', { _id: orders.city_id }, {}, {}, function (err, restaurant) {
                    //     if (err || !restaurant) {
                    //         res.status(400).send({ message: 'Invalid city, Please check your data' });
                    //     } else {
                    if (restaurant.status == 1) {
                        db.GetOneDocument('users', { _id: orders.user_id, status: 1 }, {}, {}, function (userErr, userRespo) {
                            if (userErr || !userRespo) {
                                res.status(400).send({ message: 'Invalid User, Please check your data' });
                            } else {
                                db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
                                    if (err) {
                                        res.status(400).send({ message: 'Error in settings' });
                                    } else {
                                        var lon = restaurant.location.lng;
                                        var lat = restaurant.location.lat;
                                        db.GetOneDocument('transaction', { "_id": orders.transaction_id }, {}, {}, function (err, transactionDetails) {
                                            if (err || !transactionDetails) {
                                                res.send({ "status": 0, "message": 'Invalid Error, Please check your data' });
                                            } else {
                                                var temp_radius = settings.settings.radius || 20;
                                                var radius = parseInt(temp_radius);
                                                var current_time = Date.now();
                                                var thirty_sec_section = 45 * 1000;
                                                var before_thirty_sec = current_time - thirty_sec_section;
                                                var filter_query = { "status": 1, "currentStatus": 1, "currentJob": 0, "logout": 0, "last_update_time": { $gte: before_thirty_sec } };
                                                // var citycondition = [
                                                //     {
                                                //         "$geoNear": {
                                                //             near: {
                                                //                 type: "Point",
                                                //                 coordinates: [parseFloat(lon), parseFloat(lat)]
                                                //             },
                                                //             distanceField: "distance",
                                                //             includeLocs: "location",
                                                //             query: filter_query,
                                                //             distanceMultiplier: 0.001,
                                                //             spherical: true
                                                //         }
                                                //     },
                                                //     {
                                                //         "$redact": {
                                                //             "$cond": {
                                                //                 "if": { "$lte": ["$distance", radius] },
                                                //                 "then": "$$KEEP",
                                                //                 "else": "$$PRUNE"
                                                //             }
                                                //         }
                                                //     },
                                                //     {
                                                //         $project: {
                                                //             username: 1,
                                                //             email: 1,
                                                //             device_info: 1,
                                                //             document: "$$ROOT"
                                                //         }
                                                //     },
                                                //     {
                                                //         $group: { "_id": null, "documentData": { $push: "$document" } }
                                                //     }
                                                // ];
                                                // db.GetAggregation('drivers', citycondition, function (err, docdata) {
                                                //     console.log('fd', err, docdata);

                                                //     if (err || docdata.length == 0 || !docdata || !docdata[0].documentData || docdata[0].documentData.length < 0 || typeof docdata[0].documentData == 'undefined') {
                                                //         filter_query['currentJob'] = 1;
                                                // db.GetAggregation('drivers', citycondition, function (err, docdata1) {
                                                // console.log('fd111', err, docdata1);
                                                // if (err || docdata1.length == 0 || !docdata1 || !docdata1[0].documentData || docdata1[0].documentData.length < 0 || typeof docdata1[0].documentData == 'undefined') {
                                                //     res.status(400).send({ message: 'sorry no drivers available in your location' });
                                                // } else {
                                                db.UpdateDocument('orders', { 'order_id': request.order_id }, { 'status': 3, 'order_history.restaurant_accepted': new Date() }, {}, function (err, updateData) {
                                                    if (err || updateData.nModified == 0) {
                                                        res.status(400).send({ message: "Error in accept order" });
                                                    } else {

                                                        if (updateData) {
                                                            var android_user = userRespo._id;
                                                            var user_loc = orders.location;
                                                            var message = CONFIG.NOTIFICATION.RESTAURANT_ACCEPTED;
                                                            var response_time = 250;
                                                            var rest_name = restaurant.cityname;
                                                            var rest_loc = restaurant.location;
                                                            var amount = orders.billings.amount.grand_total;
                                                            var food_count = orders.foods.length || 1;
                                                            var options = [request.order_id, android_user, rest_name, amount, user_loc, rest_loc, food_count];
                                                            for (var i = 1; i == 1; i++) {
                                                                push.sendPushnotification(android_user, message, 'order_accepted', 'ANDROID', options, 'USER', function (err, response, body) { });
                                                            }
                                                            io.of('/chat').in(orders._id).emit('OrderUpdated', { orderId: orders._id });
                                                            var noti_data = {};
                                                            noti_data.rest_id = orders.restaurant_id;
                                                            noti_data.order_id = orders.order_id;
                                                            noti_data.user_id = orders.user_id;
                                                            noti_data._id = orders._id;
                                                            noti_data.user_name = userRespo.username;
                                                            noti_data.order_type = 'restaurant_accept_order';
                                                            //io.of('/chat').in(orders.restaurant_id).emit('restnotify', { restauranId: noti_data });
                                                            io.of('/chat').in(orders.user_id).emit('usernotify', noti_data);
                                                            io.of('/chat').emit('adminnotify', noti_data);
                                                            res.status(200).send({ message: 'Sucessfully Accepted' });
                                                            // var mail_data = {};
                                                            // mail_data.user_id = userRespo._id;
                                                            // mail_data.order_id = orders._id;
                                                            // events.emit('restaurant_accept_order', mail_data, function (err, result) { });
                                                            // var mail_data = {};
                                                            // mail_data.user_id = userRespo._id;
                                                            // mail_data.order_id = orders._id;
                                                            // events.emit('restaurant_accepts_toadmin', mail_data, function (err, result) { });
                                                            mailDatas = {};
                                                            mailDatas.template = 'user_accept_order';
                                                            mailDatas.to = userRespo.email;
                                                            mailDatas.html = [];
                                                            mailDatas.html.push({ name: 'name', value: userRespo.username || "" });
                                                            mailcontent.sendmail(mailDatas, function (err, response) { });
                                                        } else {
                                                            res.status(400).send({ message: 'sorry no drivers available in your location' });
                                                        }
                                                    }
                                                });
                                                //     }
                                                // })
                                                //                             } else {
                                                //                                 db.UpdateDocument('orders', { 'order_id': request.order_id }, { 'status': 3, 'order_history.restaurant_accepted': new Date() }, {}, function (err, updateData) {
                                                //                                     if (err || updateData.nModified == 0) {
                                                //                                         res.status(400).send({ message: "Error in accept order" });
                                                //                                     } else {
                                                //                                         if (typeof docdata[0].documentData != 'undefined') {
                                                //                                             var android_user = userRespo._id;
                                                //                                             var user_loc = orders.location;
                                                //                                             var message = CONFIG.NOTIFICATION.RESTAURANT_ACCEPTED;
                                                //                                             var response_time = 250;
                                                //                                             var rest_name = restaurant.restaurantname;
                                                //                                             var rest_loc = restaurant.location;
                                                //                                             var amount = orders.billings.amount.grand_total;
                                                //                                             var food_count = orders.foods.length || 1;
                                                //                                             var options = [request.order_id, android_user, rest_name, amount, user_loc, rest_loc, food_count];
                                                //                                             for (var i = 1; i == 1; i++) {
                                                //                                                 push.sendPushnotification(android_user, message, 'order_accepted', 'ANDROID', options, 'USER', function (err, response, body) { });
                                                //                                             }
                                                //                                             for (var i = 0; i < docdata[0].documentData.length; i++) {
                                                //                                                 var android_driver = docdata[0].documentData[i]._id;
                                                //                                                 var gcm = '';
                                                //                                                 if (docdata[0].documentData[i].device_info) {
                                                //                                                     if (docdata[0].documentData[i].device_info.gcm) {
                                                //                                                         if (docdata[0].documentData[i].device_info.gcm.length > 0) {
                                                //                                                             gcm = docdata[0].documentData[i].device_info.gcm;
                                                //                                                         }
                                                //                                                     }
                                                //                                                 }
                                                //                                                 var device_token = '';
                                                //                                                 if (docdata[0].documentData[i].device_info) {
                                                //                                                     if (docdata[0].documentData[i].device_info.device_token) {
                                                //                                                         if (docdata[0].documentData[i].device_info.device_token.length > 0) {
                                                //                                                             device_token = docdata[0].documentData[i].device_info.device_token;
                                                //                                                         }
                                                //                                                     }
                                                //                                                 }
                                                //                                                 var message = CONFIG.NOTIFICATION.REQUEST_FOR_DRIVER;
                                                //                                                 var response_time = 250;
                                                //                                                 var options = [request.order_id, android_driver, gcm, device_token];
                                                //                                                 push.sendPushnotification(android_driver, message, 'order_request', 'ANDROID', options, 'DRIVER', function (err, response, body) { });
                                                //                                             }
                                                //                                             io.of('/chat').in(orders._id).emit('OrderUpdated', { orderId: orders._id });
                                                //                                             var noti_data = {};
                                                //                                             noti_data.rest_id = orders.restaurant_id;
                                                //                                             noti_data.order_id = orders.order_id;
                                                //                                             noti_data.user_id = orders.user_id;
                                                //                                             noti_data._id = orders._id;
                                                //                                             noti_data.user_name = userRespo.username;
                                                //                                             noti_data.order_type = 'restaurant_accept_order';
                                                //                                             io.of('/chat').in(orders.restaurant_id).emit('restnotify', { restauranId: noti_data });
                                                //                                             io.of('/chat').in(orders.user_id).emit('usernotify', noti_data);
                                                //                                             io.of('/chat').emit('adminnotify', noti_data);
                                                //                                             res.status(200).send({ message: 'Sucessfully Accepted and send request for ' + docdata[0].documentData.length + ' drivers' });
                                                //                                             var mail_data = {};
                                                //                                             mail_data.user_id = userRespo._id;
                                                //                                             mail_data.order_id = orders._id;
                                                //                                             events.emit('restaurant_accept_order', mail_data, function (err, result) { });
                                                //                                             var mail_data = {};
                                                //                                             mail_data.user_id = userRespo._id;
                                                //                                             mail_data.order_id = orders._id;
                                                //                                             events.emit('restaurant_accepts_toadmin', mail_data, function (err, result) { });
                                                //                                             mailDatas = {};
                                                //                                             mailDatas.template = 'user_accept_order';
                                                //                                             mailDatas.to = userRespo.email;
                                                //                                             mailDatas.html = [];
                                                //                                             mailDatas.html.push({ name: 'name', value: userRespo.username || "" });
                                                //                                             mailcontent.sendmail(mailDatas, function (err, response) { });
                                                //                                         } else {
                                                //                                             res.status(400).send({ message: 'sorry no drivers available in your location' });
                                                //                                         }
                                                //                                     }
                                                //                                 });
                                                //                             }
                                                //                         });
                                            }
                                        })
                                    }
                                });
                            }
                        });
                    } else if (restaurant.status == 2) {
                        res.status(400).send({ message: 'Your Account has been Deactivated' });

                    } else {
                        res.status(400).send({ message: 'Invalid restaurant, Please check your data' });

                    }
                    //     }
                    // });
                }
            }
        });
    }
    /*  router.ordersDashboard1 = (req, res) => {
          var data = {};
          data.total = 0;
          data.neworder = 0;
          data.ongoing = 0;
          data.completed = 0;
          data.cancelled = 0;
 
          var query = { status: { $in: [1, 2, 3, 4, 5, 6, 7, 9, 10] } };
          var usersQuery = [{
              "$match": query
          },
          {
              $lookup:
                  {
                      from: "restaurant",
                      localField: "restaurant_id",
                      foreignField: "_id",
                      as: "restaurants"
                  }
          },
          { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
          {
              $project: {
                  restaurants: 1,
                  order_id: 1,
                  delivery_address: 1,
                  status: 1,
                  seen_status: 1,
                  createdAt:1
              }
          }, {
              $project: {
                  question: 1,
                  document: "$$ROOT"
              }
          }];
 
          if (req.body.city && req.body.area && req.body.rest) {
              usersQuery.push({
                  "$match": {
                      $and: [{ "document.restaurants.restaurantname": req.body.rest }, { "document.restaurants.main_city": req.body.city }, { "document.restaurants.sub_city": req.body.area }]
                  }
              })
          }
          if (req.body.city && !req.body.area && !req.body.rest) {
              usersQuery.push({
                  "$match": { "document.restaurants.main_city": req.body.city }
              })
          }
          if (req.body.city && req.body.area && !req.body.rest) {
              usersQuery.push({
 
                  "$match": {
                      $and: [{ "document.restaurants.main_city": req.body.city }, { "document.restaurants.sub_city": req.body.area }]
                  }
              })
          }
          if (req.body.city && req.body.rest && !req.body.area) {
              usersQuery.push({
                  "$match": {
                      $and: [{ "document.restaurants.main_city": req.body.city }, { "document.restaurants.restaurantname": req.body.rest }]
                  }
              })
          }
 
          usersQuery.push({
              $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
          })
          async.series([(cb) => {
              db.GetAggregation('orders', usersQuery, (err, count) => {
                  if (err) {
                      cb(null);
                  }
                  else {
                      if (count.length > 0) {
                          data.total = count[0].documentData.length;
                      } else {
                          data.total = 0;
                      }
                      cb(null);
                  }
              });
          }, (cb) => {
              var query = { status: { $eq: 1 } };
              usersQuery[0] = { "$match": query };
              db.GetAggregation('orders', usersQuery, (err, count) => {
                  if (err) {
                      cb(null);
                  } else {
                      if (count.length > 0) {
                          data.neworder = count[0].documentData.length;
                      } else {
                          data.neworder = 0;
                      }
                      cb(null);
                  }
              })
          }, (cb) => {
              var query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 4 } }, { status: { $eq: 5 } }, { status: { $eq: 6 } }] };
              usersQuery[0] = { "$match": query };
              db.GetAggregation('orders', usersQuery, (err, count) => {
                  if (err) {
                      cb(null);
                  } else {
                      if (count.length > 0) {
                          data.ongoing = count[0].documentData.length;
                      } else {
                          data.ongoing = 0;
                      }
                      cb(null);
                  }
              })
          }, (cb) => {
              var query = { status: { $eq: 7 } };
              usersQuery[0] = { "$match": query };
              db.GetAggregation('orders', usersQuery, (err, count) => {
                  if (err) {
                      cb(null);
                  } else {
                      if (count.length > 0) {
                          data.completed = count[0].documentData.length;
                      } else {
                          data.completed = 0;
                      }
                      cb(null);
                  }
              })
          }, (cb) => {
              var query = { $or: [{ status: { $eq: 9 } }, { status: { $eq: 2 } }, { status: { $eq: 10 } }] };
              usersQuery[0] = { "$match": query };
              db.GetAggregation('orders', usersQuery, (err, count) => {
                  if (err) {
                      cb(null);
                  } else {
                      if (count.length > 0) {
                          data.cancelled = count[0].documentData.length;
                      } else {
                          data.cancelled = 0;
                      }
                      cb(null);
                  }
              })
          }], (err, ress) => {
              data.total = parseInt(data.neworder) + parseInt(data.ongoing) + parseInt(data.completed) + parseInt(data.cancelled)
              res.send(data);
          })
      }*/

    router.ordersDashboard1 = (req, res) => {
        var data = {};
        data.total = 0;
        data.neworder = 0;
        data.ongoing = 0;
        data.completed = 0;
        data.cancelled = 0;
        data.packed = 0;

        var query = { status: { $in: [1, 2, 3, 4, 5, 6, 7, 9, 10] } };
        var usersQuery = [{
            "$match": query
        },
        {
            $lookup: {
                from: "restaurant",
                localField: "restaurant_id",
                foreignField: "_id",
                as: "restaurants"
            }
        },
        { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                restaurants: 1,
                order_id: 1,
                delivery_address: 1,
                status: 1,
                seen_status: 1,
                createdAt: 1
            }
        }, {
            $project: {
                question: 1,
                document: "$$ROOT"
            }
        }
        ];
        if (req.body.city && req.body.area && req.body.rest) {
            usersQuery.push({
                "$match": {
                    $and: [{ "document.restaurants.restaurantname": req.body.rest }, { "document.restaurants.main_city": req.body.city }, { "document.restaurants.sub_city": req.body.area }]
                }
            })
        }
        if (req.body.city && !req.body.area && !req.body.rest) {
            usersQuery.push({
                "$match": { "document.restaurants.main_city": req.body.city }
            })
        }
        if (req.body.city && req.body.area && !req.body.rest) {
            usersQuery.push({

                "$match": {
                    $and: [{ "document.restaurants.main_city": req.body.city }, { "document.restaurants.sub_city": req.body.area }]
                }
            })
        }
        if (req.body.city && req.body.rest && !req.body.area) {
            usersQuery.push({
                "$match": {
                    $and: [{ "document.restaurants.main_city": req.body.city }, { "document.restaurants.restaurantname": req.body.rest }]
                }
            })
        }
        var start, end;
        if (req.body.start_date != undefined) {
            start = new Date((req.body.start_date));
            start = new Date(start.setDate(start.getDate() + 0))
            start = moment(start).format('MM/DD/YYYY');
            start = start + ' 00:00:00';
        }
        if (req.body.end_date != undefined) {
            end = new Date(req.body.end_date);
            end = new Date(end.setDate(end.getDate() + 0))
            end = moment(end).format('MM/DD/YYYY');
            end = end + ' 23:59:59';
        } else {
            end = new Date();
        }
        if (req.body.start_date == undefined) {
            usersQuery.push({
                "$match": { "document.createdAt": { '$lte': new Date(end) } }
            })
        } else if (req.body.start_date != undefined && req.body.start_date != undefined) {
            usersQuery.push({
                "$match": { "document.createdAt": { '$gte': new Date(start), '$lte': new Date(end) } }
            })
        }

        usersQuery.push({
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        })

        // console.log(req.body.start_date);
        /*db.GetAggregation('orders', usersQuery, (err, count) => {
            data.total = count;
            res.send(data);
          });*/

        async.series([(cb) => {
            db.GetAggregation('orders', usersQuery, (err, count) => {
                if (err) {
                    cb(null);
                } else {
                    if (count.length > 0) {
                        data.total = count[0].documentData.length;
                    } else {
                        data.total = 0;
                    }
                    cb(null);
                }
            });
        }, (cb) => {
            var query = { status: { $eq: 1 } };
            usersQuery[0] = { "$match": query };
            // usersQuery.unshift({"$match":query})
            db.GetAggregation('orders', usersQuery, (err, count) => {
                if (err) {
                    cb(null);
                } else {
                    if (count.length > 0) {
                        data.neworder = count[0].documentData.length;
                    } else {
                        data.neworder = 0;
                    }
                    cb(null);
                }
            })
        }, (cb) => {
            var query = { $or: [{ status: { $eq: 4 } }, { status: { $eq: 5 } }, { status: { $eq: 6 } }] };
            usersQuery[0] = { "$match": query };
            db.GetAggregation('orders', usersQuery, (err, count) => {
                if (err) {
                    cb(null);
                } else {
                    if (count.length > 0) {
                        data.ongoing = count[0].documentData.length;
                    } else {
                        data.ongoing = 0;
                    }
                    cb(null);
                }
            })
        }, (cb) => {
            var query = { status: { $eq: 7 } };
            usersQuery[0] = { "$match": query };
            db.GetAggregation('orders', usersQuery, (err, count) => {
                if (err) {
                    cb(null);
                } else {
                    if (count.length > 0) {
                        data.completed = count[0].documentData.length;
                    } else {
                        data.completed = 0;
                    }
                    cb(null);
                }
            })
        }, (cb) => {
            var query = { $or: [{ status: { $eq: 9 } }, { status: { $eq: 2 } }, { status: { $eq: 10 } }] };
            usersQuery[0] = { "$match": query };
            db.GetAggregation('orders', usersQuery, (err, count) => {
                if (err) {
                    cb(null);
                } else {
                    if (count.length > 0) {
                        data.cancelled = count[0].documentData.length;
                    } else {
                        data.cancelled = 0;
                    }
                    cb(null);
                }
            })
        }, (cb) => {
            var query = { status: { $eq: 3 } };
            usersQuery[0] = { "$match": query };
            db.GetAggregation('orders', usersQuery, (err, count) => {
                if (err) {
                    cb(null);
                } else {
                    if (count.length > 0) {
                        data.packed = count[0].documentData.length;
                    } else {
                        data.packed = 0;
                    }
                    cb(null);
                }
            })
        }], (err, ress) => {
            data.total = parseInt(data.neworder) + parseInt(data.ongoing) + parseInt(data.completed) + parseInt(data.cancelled) + parseInt(data.packed);
            res.send(data);
        })
    }

    router.getAssignJobOrder = function (req, res) {
        var orderId;
        if (typeof req.body.orderId != 'undefined' && req.body.orderId != '') {
            if (isObjectId(req.body.orderId)) {
                orderId = new mongoose.Types.ObjectId(req.body.orderId);
            } else {
                res.send({ err: 1, message: 'Invalid orderId' });
                return;
            }
        } else {
            res.send({ err: 1, message: 'Invalid orderId' });
            return;
        }
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            if (err || !settings) {
                res.send({ err: 1, message: 'Configure your app settings' });
            } else {
                var filter_query = { "_id": orderId, status: { $eq: 3 } };
                var condition = [
                    { $match: filter_query },
                    { '$lookup': { from: 'transaction', localField: 'transaction_id', foreignField: '_id', as: 'transactionDetails' } },
                    { "$unwind": { path: "$transactionDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'city', localField: 'city_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                createdAt: "$createdAt",
                                status: "$status",
                                order_status: { "$cond": [{ $and: [{ $eq: ["$status", 1] }] }, "Booked", { "$cond": [{ $and: [{ $eq: ["$status", 2] }] }, "Restaurant Rejected", { "$cond": [{ $and: [{ $eq: ["$status", 3] }] }, "Restaurant Acepted", { "$cond": [{ $and: [{ $eq: ["$status", 4] }] }, "Driver Rejected", { "$cond": [{ $and: [{ $eq: ["$status", 5] }] }, "Driver Acepted", { "$cond": [{ $and: [{ $eq: ["$status", 6] }] }, "Driver Pickedup", { "$cond": [{ $and: [{ $eq: ["$status", 7] }] }, "Deliverd", { "$cond": [{ $and: [{ $eq: ["$status", 8] }] }, "Payment Completed", { "$cond": [{ $and: [{ $eq: ["$status", 9] }] }, "Cancelled By You", { "$cond": [{ $and: [{ $eq: ["$status", 10] }] }, "Admin Cancelled Order", ""] }] }] }] }] }] }] }] }] }] },
                                mode: "$transactionDetails.type",
                                order_history: "$order_history",
                                restaurantDetails: {
                                    cityname: "$restaurantDetails.cityname",
                                    username: "$restaurantDetails.username",
                                    location: "$restaurantDetails.location",
                                    address: "$restaurantDetails.address",
                                    _id: "$restaurantDetails._id",
                                },
                                _id: "$_id",
                                transaction_id: "$transaction_id",
                                user_id: "$user_id",
                                city_id: "$city_id",
                                coupon_code: "$coupon_code",
                                delivery_address: "$delivery_address",
                                order_id: "$order_id",
                                location: "$location",
                                seen_status: "$seen_status",
                                billings: "$billings",
                            }
                        }
                    }
                ];
                db.GetAggregation('orders', condition, function (err, docdata) {
                    if (err || !docdata) {
                        res.send({ err: 0, message: '', orderDetails: {} });
                    } else {
                        if (docdata.length > 0) {
                            var orderDetails = [];
                            if (typeof docdata[0].orderDetails != 'undefined') {
                                orderDetails = docdata[0].orderDetails;
                            }
                            res.send({ err: 0, message: '', orderDetails: orderDetails });
                        } else {
                            res.send({ err: 0, message: '', orderDetails: {} });
                        }
                    }
                })
            }
        })
    }

    router.printDocument = function (req, res) {
        console.log(req.body);
        var printData = req.body;
        var user_lang = 'en';
        var data = {};

        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, generalSettings) {
            var settings = generalSettings.settings;

            if (err || !generalSettings) {
                data.status = 0;
                data.message = 'Configure your website settings';
                res.send(data);
            } else {

                db.GetOneDocument('orders', { 'order_id': req.body.order_id }, {}, {}, function (err, orders) {
                    if (err || !orders) {
                        data.status = 0;
                        data.message = 'error in orders';
                        res.send(data);
                    } else {
                        db.GetOneDocument('users', { '_id': orders.user_id }, {}, {}, function (err, user) {

                            if (err || !user) {
                                data.status = 0;
                                data.message = 'error in user';
                                res.send(data);
                            } else {
                                db.GetOneDocument('transaction', { '_id': orders.transaction_id }, {}, {}, function (err, transaction) {

                                    if (err || !transaction) {
                                        data.status = 0;
                                        data.message = 'error in transaction';
                                        res.send(data);

                                    } else {
                                        // db.GetOneDocument('city', { '_id': orders.city_id }, {}, {}, function (err, restaurant) {
                                        //     if (err || !restaurant) {
                                        //         data.status = 0;
                                        //         data.message = 'error in city';
                                        //         res.send(data);
                                        //     } else {
                                        db.GetDocument('emailtemplate', { name: 'print_invoice_order', 'status': { $ne: 0 } }, {}, {}, function (err, template) {
                                            if (err) {
                                                console.log("unable to get emailtemplate.....")
                                            } else {
                                                var deliv_date = orders.order_history.delivered || orders.createdAt;
                                                var order_date = deliv_date

                                                // var order_date = timezone.tz(deliv_date, settings.time_zone).format(settings.date_format);
                                                // var order_time = timezone.tz(deliv_date, settings.time_zone).format(settings.time_format);
                                                // var mydate = moment(order_date, 'DD/MM/YYYY');

                                                // var order_delivery_Date = moment(mydate).format(settings.date_format);
                                                //console.log(order_delivery_Date)
                                                //var order_delivery_Date =  Date(orders.schedule_date).format(settings.date_format);

                                                var order_time = moment(deliv_date, 'h:mm:ss')

                                                var mydate = moment(order_date, 'DD/MM/YYYY');
                                                var order_delivery_Date = moment(mydate)
                                                var order_delivery_Time = order_time;
                                                var totalQty = 0;
                                                var totalMrp = 0;
                                                var totalAmt = 0;
                                                var mrpText = '';
                                                var amtText = '';
                                                // var foodDetails = '<table style="border:1px solid #000000;" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#fff"><tbody><tr style="border-bottom: 1px solid #545454;" bgcolor="#e8e8e8"><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">S:No</p></th><th style="width: 45%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px; text-align: left;">Item</p></th><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Units</p></th><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Qty</p></th><th style="width: 20%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">MRP</p></th><th style="width: 20%; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Total AMT</p></th></tr>';
                                                var foodDetails = '<table style="border:1px solid #000000;" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#fff"><tbody><tr style="border-bottom: 1px solid #545454;" bgcolor="#e8e8e8"><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">S:No</p></th><th style="width: 45%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px; text-align: left;">Item</p></th><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Qty</p></th><th style="width: 20%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">MRP</p></th><th colspan="2" style="width: 25%; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Total AMT</p></th></tr>';
                                                for (var i = 0; i < orders.foods.length; i++) {
                                                    var PriceText = '';
                                                    var cost = 0.0;
                                                    var costText = '';
                                                    if (orders.foods[i].offer_price > 0) {
                                                        var remaing_price = (parseFloat(orders.foods[i].mprice)).toFixed(2)
                                                        PriceText = '₹ ' + ' ' + parseFloat(orders.foods[i].mprice).toFixed(2);
                                                        cost = (parseFloat(orders.foods[i].quantity * parseFloat(orders.foods[i].mprice))).toFixed(2)
                                                        costText = '₹ ' + ' ' + cost;
                                                        totalMrp = (parseFloat(totalMrp) + parseFloat(orders.foods[i].mprice)).toFixed(2)
                                                        totalAmt = (parseFloat(totalAmt) + parseFloat(cost)).toFixed(2)
                                                    } else {
                                                        PriceText = '₹ ' + ' ' + orders.foods[i].mprice;
                                                        cost = (parseFloat(orders.foods[i].quantity * orders.foods[i].mprice)).toFixed(2)
                                                        costText = '₹ ' + ' ' + cost;
                                                        totalMrp = (parseFloat(totalMrp) + parseFloat(orders.foods[i].mprice)).toFixed(2)
                                                        totalAmt = (parseFloat(totalAmt) + parseFloat(cost)).toFixed(2)
                                                    }
                                                    totalQty = parseInt(totalQty + orders.foods[i].quantity)
                                                    // foodDetails += '<tr bgcolor="#fff"><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + (i + 1) + '</p></td><td style="width: 45%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: left;">' + orders.foods[i].name + '</p></td><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + orders.foods[i].net_quantity + ' ' + orders.foods[i].units + '</p></td><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + orders.foods[i].quantity + '</p></td><td style="width: 20%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + PriceText + '</p></td><td style="width: 10%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + costText + '</p></td></tr>';
                                                    foodDetails += '<tr bgcolor="#fff"><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + (i + 1) + '</p></td><td style="width: 45%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: left;">' + orders.foods[i].name + '</p></td><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + orders.foods[i].quantity + '</p></td><td style="width: 20%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + PriceText + '</p></td><td colspan="2" style="width: 10%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + costText + '</p></td></tr>';
                                                }
                                                grand_total = parseFloat(orders.billings.amount.grand_total).toFixed(2);
                                                mrpText = '₹ ' + ' ' + totalMrp;
                                                amtText = '₹ ' + ' ' + totalAmt;
                                                netamtText = '₹ ' + ' ' + grand_total;
                                                foodDetails += '<tr style="border-bottom: 1px solid #545454;" bgcolor="#e8e8e8"><th style="width: 5%; border-right: 1px solid #545454; border-top: 1px solid #545454; border-bottom: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">&nbsp;</p></th><th style="width: 5%; border-right: 1px solid #545454; border-top: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">' + totalQty + '</p></th><th style="width: 20%; border-right: 1px solid #545454; border-top: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">' + mrpText + '</p></th><th  colspan="2" style="width: 20%; border-top: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">' + amtText + '</p></th></tr>';
                                                var total = '';
                                                if (orders.billings.amount.total > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Total Amount</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.total).toFixed(2)) + '</p></td></tr>';
                                                }
                                                var service_tax = '';
                                                if (orders.billings.amount.service_tax > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Service Tax</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.service_tax).toFixed(2)) + '</p></td></tr>';
                                                }
                                                var delivery_amount = '';
                                                if (orders.billings.amount.food_offer_price > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Offer Discount</p></td><td  colspan="2"style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.food_offer_price).toFixed(2)) + '</p></td></tr>';
                                                }
                                                var package_charge = '';
                                                foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Delivery Charge</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Free</p></td></tr>';
                                                // if (orders.billings.amount.package_charge > 0) {
                                                // }

                                                if (orders.billings.amount.coupon_discount > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Coupon Discount</p></td><td  colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.coupon_discount).toFixed(2)) + '</p></td></tr>';
                                                }

                                                if (orders.billings.amount.grand_total > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" ><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Grand Total</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.grand_total).toFixed(2)) + '</p></td></tr>';
                                                }
                                                // var food_offer_price = '';
                                                // if (orders.billings.amount.food_offer_price > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Food Offer Price</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((orders.billings.amount.food_offer_price).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                // var offer_discount = '';
                                                // if (orders.billings.amount.offer_discount > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Offer Discount</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((orders.billings.amount.offer_discount).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                // var site_commission = '';
                                                // if (printData.site_commission > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Site Commission</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((printData.site_commission).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                // var restaurant_commission = '';
                                                // if (printData.restaurant_commission > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Grand Total</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((printData.restaurant_commission).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                /* foodDetails += '<tr bgcolor="#fff"><td style="border-bottom: 1px solid #545454;" colspan="5"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 20px; margin: 0px; color: #404040; padding: 7px 10px; text-align: left;"><span style="font-weight: bold;">Return Policy:</span> Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries</p></td></tr>'; */
                                                foodDetails += '</tbody></table>';

                                                var html1 = template[0].email_content;
                                                html1 = html1.replace(/{{foodDetails}}/g, foodDetails);
                                                html1 = html1.replace(/{{site_url}}/g, settings.site_url);
                                                html1 = html1.replace(/{{site_title}}/g, settings.site_title);
                                                html1 = html1.replace(/{{logo}}/g, settings.site_url + settings.logo);
                                                html1 = html1.replace(/{{order_id}}/g, orders.order_id);
                                                html1 = html1.replace(/{{order_date}}/g, order_date);
                                                html1 = html1.replace(/{{order_delivery_Date}}/g, order_delivery_Date);
                                                html1 = html1.replace(/{{order_delivery_Time}}/g, order_delivery_Time);
                                                html1 = html1.replace(/{{username}}/g, user.username);
                                                html1 = html1.replace(/{{drop_address}}/g, orders.delivery_address.fulladres || ' ');
                                                html1 = html1.replace(/{{drop_address_state}}/g, orders.delivery_address.state || ' ');
                                                //html1 = html1.replace(/{{restaurantname}}/g, restaurant.cityname);
                                                // html1 = html1.replace(/{{pickup_address}}/g, restaurant.address.fulladres || ' ');
                                                html1 = html1.replace(/{{useremail}}/g, user.email);
                                                html1 = html1.replace(/{{user_phone}}/g, user.phone.code + ' ' + user.phone.number);
                                                html1 = html1.replace(/{{symbol}}/g, '₹ ');
                                                html1 = html1.replace(/{{totalQty}}/g, totalQty);
                                                html1 = html1.replace(/{{amtText}}/g, amtText);
                                                html1 = html1.replace(/{{netamtText}}/g, netamtText);
                                                // var paymenttype = "Pay By Cards, UPI, Wallets, Net Banking";
                                                var paymenttype = "Pay By " + transaction.doc.type;
                                                html1 = html1.replace(/{{paymenttype}}/g, paymenttype);
                                                // if (transaction.type == 'mips') {
                                                // } else {
                                                //     var paymenttype = "COD";
                                                //     html1 = html1.replace(/{{paymenttype}}/g, paymenttype);
                                                // }

                                                var options = {
                                                    format: 'A4',
                                                    // phantomPath: "./node_modules/phantomjs-prebuilt/bin/phantomjs"
                                                };
                                                var filename = new Date().getTime();
                                                pdf.create(html1, options).toFile('./uploads/invoice/' + filename + '.pdf', function (err, document) {
                                                    if (err) {
                                                        console.log("unable to create pdf.....");
                                                    } else {
                                                        var result = { "status": 1, message: '', "filepath": settings.site_url + 'uploads/invoice/' + filename + '.pdf', filename: filename }
                                                        res.send(result);
                                                    }
                                                });
                                            }
                                        });
                                        //     }
                                        // });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };

    router.downloadFile = function (req, res) {
        var error = false;
        var filename = req.params.file;
        var fileType = req.params.type;
        var filePath = 'uploads/csv/orders/' + filename + '.' + fileType;
        if (fs.existsSync(filePath)) {
            var stream = fs.createReadStream(filePath, { bufferSize: 64 * 1024 });
            res.set('Content-Disposition', 'attachment; filename="' + filename + '.' + fileType + '"');
            stream.pipe(res);
            stream.on('error', function (err) {
                error = true;
            });
            stream.on('end', function () {
                if (!error) {
                    fs.unlinkSync(filePath); // Delete the File
                }
                res.end();
            });
        } else {
            res.redirect('/404');
        }
    }

    router.exportdashboardorder = function (req, res) {
        // console.log('exportdashboardorder',req.body)
        var query = {};
        var string_status = '';
        if (req.body.status == 1) { //new orders
            string_status = 'New Order'
            query = { status: { $eq: 1 } };
        } else if (req.body.status == 15) { //new orders
            query = { status: { $eq: 15 } };
        } else if (req.body.status == 3) { //processing
            string_status = 'Processing'
            query = { $or: [{ status: { $eq: 3 } }, { status: { $eq: 5 } }, { status: { $eq: 4 } }] };
        } else if (req.body.status == 6) { //order picked
            string_status = 'On Going'
            query = { status: { $eq: 6 } };
        } else if (req.body.status == 7) { // delivered
            query = { status: { $eq: 7 } };
            string_status = 'Delivered'
        } else if (req.body.status == 2) { // denied ny restaurant
            query = { status: { $eq: 2 } };
        } else if (req.body.status == 9) { // canceled by user
            query = { status: { $eq: 9 } };
        } else {
            query = { status: { $ne: 0 } };
            string_status = 'Delete'
        }

        if (req.body.city) {
            query['city_id'] = { $eq: mongoose.Types.ObjectId(req.body.city) };
        }
        var response = {};
        response.status = 0;
        var data = {};
        data.collection = 'orders';

        data.query = [{ "$match": query },
        {
            $lookup: {
                from: "food",
                localField: "food_id",
                foreignField: "_id",
                as: "foods"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "city",
                localField: "city_id",
                foreignField: "_id",
                as: "restaurants"
            }
        },
        {
            $lookup: {
                from: "transaction",
                localField: "transaction_id",
                foreignField: "_id",
                as: "transactions"
            }
        },
        { $unwind: { path: "$transactions", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$restaurants", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "drivers",
                localField: "driver_id",
                foreignField: "_id",
                as: "driver"
            }
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                restaurants: 1,
                driver: 1,
                foods: 1,
                cancellationreason: 1,
                user: 1,
                order_id: 1,
                transactions:1,
                email: { $ifNull: ["$email", "$user.email"] },
                delivery_address: 1,
                status: 1,
                seen_status: 1,
                createdAt: 1,
                billings: 1,
                order_history: 1
            }
        },
        {
            $project: {
                restaurants: 1,
                driver: 1,
                foods: 1,
                cancellationreason: 1,
                user: 1,
                order_id: 1,
                email: { $ifNull: ["$email", "$user.email"] },
                delivery_address: {
                    $concat: [
                        { $ifNull: ["$delivery_address.first_name", ""] },
                        " ",
                        { $ifNull: ["$delivery_address.last_name", ""] },
                        ", ",
                        { $ifNull: ["$delivery_address.line1", ""] },
                        ", ",
                        { $ifNull: ["$delivery_address.city", ""] },
                        ", ",
                        { $ifNull: ["$delivery_address.state", ""] },
                        " - ",
                        { $ifNull: ["$delivery_address.zipcode", ""] },
                        " | Phone: ",
                        { $ifNull: ["$delivery_address.phone.number", ""] },
                        " | Email: ",
                        { $ifNull: ["$delivery_address.email", ""] }
                    ]
                },
                status: 1,
                seen_status: 1,
                createdAt: 1,
                billings: 1,
                payment_method:"$transactions.type",
                order_history: 1
            }
        }
        
        ];
        if (req.body.search && typeof req.body.search != 'undefined' && req.body.search != '') {
            data.query.push({

                "$match": {
                    $or: [{ "order_id": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "restaurants.restaurantname": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "restaurants.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "user.username": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "user.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "driver.username": { $regex: new RegExp('^' + req.body.search, 'i') } }, { "driver.phone.number": { $regex: new RegExp('^' + req.body.search, 'i') } }]
                }
            })
        }
        // if (req.body.city && req.body.area && req.body.rest) {
        //     data.query.push({
        //         "$match": {
        //             $and: [{ "restaurants.restaurantname": req.body.rest }, { "restaurants.main_city": req.body.city }, { "restaurants.sub_city": req.body.area }]
        //         }
        //     })
        // }
        // if (req.body.city && !req.body.area && !req.body.rest) {
        //     data.query.push({
        //         "$match": { "restaurants.main_city": req.body.city },

        //     })
        // }
        // if (req.body.city && req.body.area && !req.body.rest) {
        //     data.query.push({
        //         "$match": {
        //             $and: [{ "restaurants.main_city": req.body.city }, { "restaurants.sub_city": req.body.area }]
        //         }
        //     })
        // }

        // if (req.body.city && req.body.rest && !req.body.area) {
        //     data.query.push({
        //         "$match": {
        //             $and: [{ "restaurants.main_city": req.body.city }, { "restaurants.restaurantname": req.body.rest }]
        //         }
        //     })
        // }
        var start, end;
        if (req.body.start_date != undefined) {
            start = new Date((req.body.start_date));
            start = new Date(start.setDate(start.getDate() + 0))
            start = moment(start).format('MM/DD/YYYY');
            start = start + ' 00:00:00';
        }
        if (req.body.end_date != undefined) {
            end = new Date(req.body.end_date);
            end = new Date(end.setDate(end.getDate() + 0))
            end = moment(end).format('MM/DD/YYYY');
            end = end + ' 23:59:59';
        } else {
            end = new Date();
        }
        if (req.body.start_date == undefined) {
            data.query.push({
                "$match": { "createdAt": { '$lte': new Date(end) } }
            })
        } else if (req.body.start_date != undefined && req.body.start_date != undefined) {
            data.query.push({
                "$match": { "createdAt": { '$gte': new Date(start), '$lte': new Date(end) } }
            })
        }
        if ((req.body.limit && req.body.skip >= 0)) {
            //usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        }

        data.csv = [
            { label: 'Date', value: 'createdAt' },
            { label: 'Order ID', value: 'order_id' },
            { label: 'User', value: 'user.username' },
            { label: 'User phone', value: 'user.phone.number' },
            // { label: 'City', value: 'restaurants.cityname' },
            // { label: 'Driver', value: 'driver.username' },
            { label: 'Email', value: 'email' },
            { label: 'Status', value: 'string_status' },
            { label: 'Delivery Adress', value: 'delivery_address' },
            { label: 'Payment Method', value: 'payment_method' },


            //{ label: 'Restaurant phone', value: 'restaurants.phone.number' },
            // { label: 'Driver phone', value: 'driver.phone.number' },
            // { label: 'Order Packed', value: 'order_history.packed' },
            // { label: 'Order Shipped', value: 'order_history.shipped' },
            // { label: 'Order Delivered', value: 'order_history.delivered' },
            { label: 'Bill Total', value: 'billings.amount.total' },
            { label: 'Offer Amount', value: 'billings.amount.food_offer_price' },
            { label: 'Bill Amount', value: 'billings.amount.grand_total' },
        ];
        data.file_name=req.body.file_name

        middlewares.jsontocsvnew(data, function (err, data) {
            if (!err || data) {
                if (data.status == 1) {
                    response.status = 1;
                    response.message = data.message;
                    res.send(response);
                } else {
                    response.message = "No Data Found";
                    res.send(response);
                }
            } else {
                response.message = "No Data Found";
                res.send(response);
            }
        });
    }

    router.todayOrderDetails = async (req, res) => {
        var filters = '';
        var searchs = '';
        var offer = false;
        var limit = 10;
        var today_order_data = {}
        console.log(req.query, "req.query")
        if (req.query.limit) {
            var tmp = parseInt(req.query.limit);
            if (tmp != NaN && tmp > 0) {
                limit = tmp;
            }
        }
        var skip = 0;
        if (typeof req.query.pageId != 'undefined') {
            if (req.query.pageId) {
                var tmp = parseInt(req.query.pageId);
                if (tmp != NaN && tmp > 0) {
                    skip = (tmp * limit) - limit;
                }
            }
        }
        var main_city = [];
        var sub_city = [];
        var start_time;
        var end_time;
        var from_date;
        var to_date;
        if (req.query.from_date) {
            from_date = req.query.from_date;
        }
        if (req.query.to_date) {
            to_date = req.query.to_date;
        }
        var sort = { 'orderDetails.createdAt': -1 };
        if (typeof req.query.filters != 'undefined' && req.query.filters != '') {
            filters = req.query.filters;
            //console.log('filters',filters)
            if (filters != '') {
                filters = decodeURIComponent(filters);
                filters = decodeURIComponent(filters);
                var filterArray = filters.split('|');
                console.log('filterArray filterArray', filterArray)
                for (var i = 0; i < filterArray.length; i++) {
                    if (filterArray[i] != '') {
                        var option = filterArray[i].split(':');
                        if (option.length > 1) {
                            var values = [];
                            if (option[1] != '') {
                                values = option[1].split(',');
                            }
                            if (values.length > 0) {
                                if (option[0] == 'c') {
                                    main_city = values;
                                }
                                if (option[0] == 'l') {
                                    sub_city = values;
                                }
                                if (option[0] == 's') {
                                    if (values.length > 0) {
                                        start_time = values[0];
                                    }
                                }
                                if (option[0] == 'e') {
                                    if (values.length > 0) {
                                        end_time = values[0];
                                    }
                                }
                                if (option[0] == 'q') {
                                    if (values.length > 0) {
                                        searchs = values[0];
                                    }
                                }
                                if (option[0] == 'o') {
                                    if (values.length > 0) {
                                        sort = {};
                                        sort[values[0]] = parseInt(values[1]);
                                    }
                                }

                            }
                        }
                    }

                }
            }
        }
        var result = {};
        result.newOrderDetails = {};
        result.newOrderDetails.count = 0;
        result.newOrderDetails.orderDetails = [];
        result.restaurantRejectedOrderDetails = {};
        result.restaurantRejectedOrderDetails.count = 0;
        result.restaurantRejectedOrderDetails.orderDetails = [];
        result.restaurantAcceptOrderDetails = {};
        result.restaurantAcceptOrderDetails.count = 0;
        result.restaurantAcceptOrderDetails.orderDetails = [];
        result.driverRejectedOrderDetails = {};
        result.driverRejectedOrderDetails.count = 0;
        result.driverRejectedOrderDetails.orderDetails = [];
        result.driverAcceptedOrderDetails = {};
        result.driverAcceptedOrderDetails.count = 0;
        result.driverAcceptedOrderDetails.orderDetails = [];
        result.driverPickedUpOrderDetails = {};
        result.driverPickedUpOrderDetails.count = 0;
        result.driverPickedUpOrderDetails.orderDetails = [];
        result.completedOrderDetails = {};
        result.completedOrderDetails.count = 0;
        result.completedOrderDetails.orderDetails = [];
        result.admin_total = 0;
        result.total_orders = 0;
        result.driver_total = 0;
        result.restaurant_total = 0;
        result.userRejectedOrderDetails = {};
        result.userRejectedOrderDetails.count = 0;
        result.userRejectedOrderDetails.orderDetails = [];
        result.adminRejectedOrderDetails = {};
        result.adminRejectedOrderDetails.count = 0;
        result.adminRejectedOrderDetails.orderDetails = [];



        let settings = await db.GetDocument('settings', { 'alias': 'general' }, {}, {})


        if (!settings) {
            today_order_data.message = "Configure Your Settings"
            today_order_data.status = 0;
            res.send(today_order_data)
        } else {

            try {
                var filter_query = {};

                var filter_query_new = {}
                if (searchs != '') {
                    filter_query['$or'] = [];
                    filter_query['$or'] = [];
                    var data = { "order_id": { $regex: searchs + '.*', $options: 'si' } };
                    var data_new = { "order_id": { $regex: searchs + '.*', $options: 'si' } };
                    filter_query['$or'].push(data);
                    filter_query_new['$or'].push(data_new);
                }
                if (main_city.length > 0) {
                    filter_query.main_city = { $in: main_city };
                    filter_query_new.main_city = { $in: main_city };
                }
                if (sub_city.length > 0) {
                    filter_query.sub_city = { $in: sub_city };
                    filter_query_new.sub_city = { $in: sub_city };
                }
                if (typeof start_time != 'undefined' || typeof end_time != 'undefined') {
                    filter_query['$and'] = [];
                    filter_query_new['$and'] = [];
                    if (typeof start_time != 'undefined') {
                        var data = { "created_time": { $gte: parseInt(start_time) } };
                        var data_new = { "created_time": { $gte: parseInt(start_time) } };
                        filter_query['$and'].push(data)
                        filter_query_new['$and'].push(data_new)
                    }
                    if (typeof end_time != 'undefined') {
                        var data = { "created_time": { $lte: parseInt(end_time) } };
                        var data_new = { "created_time": { $lte: parseInt(end_time) } };
                        filter_query['$and'].push(data)
                        filter_query_new['$and'].push(data_new)
                    }
                }
                if (typeof from_date != 'undefined' && typeof to_date != 'undefined') {
                    filter_query['$and'] = [];
                    filter_query_new['$and'] = [];
                    if (typeof from_date != 'undefined') {
                        // var data = { "createdAt": { $gte: parseInt(from_date) } };
                        var data = { "updated_time": { $gte: parseInt(from_date) } };
                        filter_query['$and'].push(data)

                        var data_new = { "created_time": { $gte: parseInt(from_date) } };
                        filter_query_new['$and'].push(data_new)
                    }
                    if (typeof to_date != 'undefined') {
                        // var data = { "createdAt": { $lte: parseInt(to_date) } };




                        var data = { "updated_time": { $lte: parseInt(to_date) } };
                        filter_query['$and'].push(data)

                        var data_new = { "created_time": { $lte: parseInt(to_date) } };
                        filter_query_new['$and'].push(data_new)
                    }
                }
                var condition = [
                    { "$match": filter_query_new },
                    { '$lookup': { from: 'restaurant', localField: 'restaurant_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                restaurantDetails: {
                                    "name": "$restaurantDetails.restaurantname",
                                    "status": "$restaurantDetails.status",
                                    "avail": "$restaurantDetails.avail",
                                    "phone": "$restaurantDetails.phone",
                                    "address": "$restaurantDetails.address",
                                    "availability": "$restaurantDetails.availability",
                                    "location": "$restaurantDetails.location",
                                    "email": "$restaurantDetails.email",
                                    "unique_code": "$restaurantDetails.unique_code",
                                    "time_setting": "$restaurantDetails.time_setting",
                                    "offer": "$restaurantDetails.offer",
                                    "avatar": "$restaurantDetails.avatar",
                                    "_id": "$restaurantDetails._id"
                                },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                var condition1 = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'restaurant', localField: 'restaurant_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'drivers', localField: 'driver_id', foreignField: '_id', as: 'driverDetails' } },
                    { "$unwind": { path: "$driverDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                restaurantDetails: {
                                    "name": "$restaurantDetails.restaurantname",
                                    "status": "$restaurantDetails.status",
                                    "avail": "$restaurantDetails.avail",
                                    "phone": "$restaurantDetails.phone",
                                    "address": "$restaurantDetails.address",
                                    "availability": "$restaurantDetails.availability",
                                    "location": "$restaurantDetails.location",
                                    "email": "$restaurantDetails.email",
                                    "unique_code": "$restaurantDetails.unique_code",
                                    "time_setting": "$restaurantDetails.time_setting",
                                    "offer": "$restaurantDetails.offer",
                                    "avatar": "$restaurantDetails.avatar",
                                    "_id": "$restaurantDetails._id"
                                },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                                driverDetails: {
                                    "name": "$driverDetails.username",
                                    "status": "$driverDetails.status",
                                    "phone": "$driverDetails.phone",
                                    "address": "$driverDetails.address",
                                    "location": "$driverDetails.location",
                                    "email": "$driverDetails.email",
                                    "avatar": "$driverDetails.avatar",
                                    "_id": "$driverDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                var condition2 = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'city', localField: 'city_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'drivers', localField: 'driver_id', foreignField: '_id', as: 'driverDetails' } },
                    { "$unwind": { path: "$driverDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                coupon_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.coupon_discount", ''] }, ''] }, { $gte: ["$billings.amount.coupon_discount", 0] }] }, "$billings.amount.coupon_discount", 0] },
                                delivery_amount: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.delivery_amount", ''] }, ''] }, { $gte: ["$billings.amount.delivery_amount", 0] }] }, "$billings.amount.delivery_amount", 0] },
                                tax_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] },
                                driver_amount: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.driver_commission", ''] }, ''] }, { $gte: ["$billings.amount.driver_commission", 0] }] }, "$billings.amount.driver_commission", 0] },
                                //restaurant_commission: { $subtract: [{ $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.package_charge", ''] }, ''] }, { $gte: ["$billings.amount.package_charge", 0] }] }, "$billings.amount.package_charge", 0] }] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }, { "$cond": [{ $and: [{ $gte: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, 0] }] }, { $multiply: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, { $divide: ["$billings.amount.applied_admin_com", 100] }] }, 0] }] }] },
                                restaurant_commission: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] },
                                'final_earnings': { $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] }, { $sum: [{ $subtract: [{ $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.package_charge", ''] }, ''] }, { $gte: ["$billings.amount.package_charge", 0] }] }, "$billings.amount.package_charge", 0] }] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }, { "$cond": [{ $and: [{ $gte: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, 0] }] }, { $multiply: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, { $divide: ["$billings.amount.applied_admin_com", 100] }] }, 0] }] }] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.driver_commission", ''] }, ''] }, { $gte: ["$billings.amount.driver_commission", 0] }] }, "$billings.amount.driver_commission", 0] }] }] },
                                // restaurantDetails: {
                                //     "name": "$restaurantDetails.restaurantname",
                                //     "status": "$restaurantDetails.status",
                                //     "avail": "$restaurantDetails.avail",
                                //     "phone": "$restaurantDetails.phone",
                                //     "address": "$restaurantDetails.address",
                                //     "availability": "$restaurantDetails.availability",
                                //     "location": "$restaurantDetails.location",
                                //     "email": "$restaurantDetails.email",
                                //     "unique_code": "$restaurantDetails.unique_code",
                                //     "time_setting": "$restaurantDetails.time_setting",
                                //     "offer": "$restaurantDetails.offer",
                                //     "avatar": "$restaurantDetails.avatar",
                                //     "_id": "$restaurantDetails._id"
                                // },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                                driverDetails: {
                                    "name": "$driverDetails.username",
                                    "status": "$driverDetails.status",
                                    "phone": "$driverDetails.phone",
                                    "address": "$driverDetails.address",
                                    "location": "$driverDetails.location",
                                    "email": "$driverDetails.email",
                                    "avatar": "$driverDetails.avatar",
                                    "_id": "$driverDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            "grand_total": { $sum: '$orderDetails.grand_total' },
                            "coupon_total": { $sum: '$orderDetails.coupon_total' },
                            "tax_total": { $sum: '$orderDetails.tax_total' },
                            "delivery_amount": { $sum: '$orderDetails.delivery_amount' },
                            "admin_total": { $sum: '$orderDetails.final_earnings' },
                            "driver_total": { $sum: '$orderDetails.driver_amount' },
                            "restaurant_total": { $sum: '$orderDetails.restaurant_commission' },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                //console.log('filter_query',filter_query)
                var async = require('async');
                async.parallel({
                    newOrderDetails: function (callback) {
                        filter_query_new['status'] = { $eq: 1 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query_new)) };

                        console.log("condition[0]condition[0]condition[0]condition[0]condition[0]condition[0]condition[0]condition[0]")

                        console.log(condition[0])


                        console.log("condition[0]condition[0]condition[0]condition[0]condition[0]condition[0]condition[0]condition[0]")





                        db.GetAggregation('orders', condition).then((docdata) => {


                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }

                        }).catch(e => {
                            console.log("error at newOrderDetails  async parallel ", e)
                        })



                        // function (err, docdata) {
                        //     //console.log('newOrderDetails',err, docdata)
                        //     if (err || !docdata) {
                        //         callback(null, { err, err, count: 0, orderDetails: [] });
                        //     } else {
                        //         var count = 0;
                        //         var orderDetails = [];
                        //         if (docdata.length > 0) {
                        //             if (typeof docdata[0].count != 'undefined') {
                        //                 count = docdata[0].count;
                        //             }
                        //             if (typeof docdata[0].orderDetails != 'undefined') {
                        //                 orderDetails = docdata[0].orderDetails;
                        //             }
                        //             callback(null, { count: count, orderDetails: orderDetails });
                        //         } else {
                        //             callback(null, { count: 0, orderDetails: [] });
                        //         }
                        //     }
                        // })

                    },

                    restaurantRejectedOrderDetails: function (callback) {


                        filter_query['status'] = { $eq: 2 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition).then((docdata) => {





                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        }).catch(e => {
                            console.log("error at restaurantRejectedOrderDetails async parrallel ", e)
                        })


                        // function (err, docdata) {


                        // })
                    },
                    restaurantAcceptOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 3 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition).then((docdata) => {
                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        }).catch(e => {
                            console.log("error at restaurantAcceptOrderDetails  ", e)
                        })


                        // function (err, docdata) {
                        //     //console.log('err, docdata')

                        // })
                    },
                    driverRejectedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 4 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1).then((docdata) => {
                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        }).catch(e => {
                            console.log("error at driverRejectedOrderDetails ", e)
                        })
                        // function (err, docdata) {
                        //console.log('docdata',err, docdata)

                        // })
                    },
                    driverAcceptedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 5 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1).then((docdata) => {
                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        }).catch(e => {
                            console.log("error at  driverAcceptedOrderDetails", e)
                        })
                        // function (err, docdata) {
                        //     //console.log('driverAcceptedOrderDetails',err, docdata)

                        // })
                    },
                    driverPickedUpOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 6 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1).then((docdata) => {
                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        }).catch(e => {
                            console.log("error at driverPickedUpOrderDetails", e)
                        })
                        // function (err, docdata) {
                        //     //console.log('driverPickedUpOrderDetails',err, docdata)

                        // })
                    },
                    completedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 7 };
                        condition2[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        console.log(condition2[0].$match.$and, 'condition2');

                        db.GetAggregation('orders', condition2).then((docdata) => {
                            console.log(docdata, 'docdata');


                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [], admin_total: 0, driver_total: 0, restaurant_total: 0 });
                            } else {
                                //console.log('docdata',docdata)
                                var count = 0;
                                var restaurant_total = 0;
                                var driver_total = 0;
                                var admin_total = 0;
                                var grand_total = 0;
                                var tax_total = 0;
                                var coupon_total = 0;
                                var delivery_amount = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].coupon_total != 'undefined') {
                                        coupon_total = docdata[0].coupon_total;
                                    }

                                    if (typeof docdata[0].grand_total != 'undefined') {
                                        grand_total = docdata[0].grand_total;
                                    }

                                    if (typeof docdata[0].delivery_amount != 'undefined') {
                                        delivery_amount = docdata[0].delivery_amount;
                                    }

                                    if (typeof docdata[0].tax_total != 'undefined') {
                                        tax_total = docdata[0].tax_total;
                                    }

                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    if (typeof docdata[0].restaurant_total != 'undefined') {
                                        restaurant_total = docdata[0].restaurant_total;
                                    }
                                    if (typeof docdata[0].driver_total != 'undefined') {
                                        driver_total = docdata[0].driver_total;
                                    }
                                    if (typeof docdata[0].admin_total != 'undefined') {
                                        admin_total = docdata[0].admin_total;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails, admin_total: admin_total, driver_total: driver_total, restaurant_total: restaurant_total, tax_total: tax_total, grand_total: grand_total, coupon_total: coupon_total, delivery_amount: delivery_amount });
                                } else {
                                    callback(null, { count: 0, orderDetails: [], admin_total: 0, driver_total: 0, restaurant_total: 0, tax_total: 0, grand_total: 0, coupon_total: 0, delivery_amount: 0 });
                                }
                            }
                        })
                        // function (err, docdata) {

                        // })
                    },
                    userRejectedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 9 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition).then((docdata) => {
                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        }).catch(e => {
                            console.log(e)
                        })
                        // function (err, docdata) {
                        //console.log('userRejectedOrderDetails',err, docdata)

                        // })
                    },
                    adminRejectedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 10 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1).then((docdata) => {
                            if (!docdata) {
                                callback(null, { count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                        // function (err, docdata) {

                        // })
                    }
                },
                    function (err, response) {
                        if (response && typeof response.newOrderDetails != 'undefined') {
                            if (typeof response.newOrderDetails.count != 'undefined' && response.newOrderDetails.count > 0) {
                                result.newOrderDetails.count = response.newOrderDetails.count;
                            }
                            if (typeof response.newOrderDetails.orderDetails != 'undefined' && response.newOrderDetails.orderDetails.length > 0) {
                                result.newOrderDetails.orderDetails = response.newOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.restaurantRejectedOrderDetails != 'undefined') {
                            if (typeof response.restaurantRejectedOrderDetails.count != 'undefined' && response.restaurantRejectedOrderDetails.count > 0) {
                                result.restaurantRejectedOrderDetails.count = response.restaurantRejectedOrderDetails.count;
                            }
                            if (typeof response.restaurantRejectedOrderDetails.orderDetails != 'undefined' && response.restaurantRejectedOrderDetails.orderDetails.length > 0) {
                                result.restaurantRejectedOrderDetails.orderDetails = response.restaurantRejectedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.restaurantAcceptOrderDetails != 'undefined') {
                            if (typeof response.restaurantAcceptOrderDetails.count != 'undefined' && response.restaurantAcceptOrderDetails.count > 0) {
                                result.restaurantAcceptOrderDetails.count = response.restaurantAcceptOrderDetails.count;
                            }
                            if (typeof response.restaurantAcceptOrderDetails.orderDetails != 'undefined' && response.restaurantAcceptOrderDetails.orderDetails.length > 0) {
                                result.restaurantAcceptOrderDetails.orderDetails = response.restaurantAcceptOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.driverRejectedOrderDetails != 'undefined') {
                            if (typeof response.driverRejectedOrderDetails.count != 'undefined' && response.driverRejectedOrderDetails.count > 0) {
                                result.driverRejectedOrderDetails.count = response.driverRejectedOrderDetails.count;
                            }
                            if (typeof response.driverRejectedOrderDetails.orderDetails != 'undefined' && response.driverRejectedOrderDetails.orderDetails.length > 0) {
                                result.driverRejectedOrderDetails.orderDetails = response.driverRejectedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.driverAcceptedOrderDetails != 'undefined') {
                            if (typeof response.driverAcceptedOrderDetails.count != 'undefined' && response.driverAcceptedOrderDetails.count > 0) {
                                result.driverAcceptedOrderDetails.count = response.driverAcceptedOrderDetails.count;
                            }
                            if (typeof response.driverAcceptedOrderDetails.orderDetails != 'undefined' && response.driverAcceptedOrderDetails.orderDetails.length > 0) {
                                result.driverAcceptedOrderDetails.orderDetails = response.driverAcceptedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.driverPickedUpOrderDetails != 'undefined') {
                            if (typeof response.driverPickedUpOrderDetails.count != 'undefined' && response.driverPickedUpOrderDetails.count > 0) {
                                result.driverPickedUpOrderDetails.count = response.driverPickedUpOrderDetails.count;
                            }
                            if (typeof response.driverPickedUpOrderDetails.orderDetails != 'undefined' && response.driverPickedUpOrderDetails.orderDetails.length > 0) {
                                result.driverPickedUpOrderDetails.orderDetails = response.driverPickedUpOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.completedOrderDetails != 'undefined') {
                            if (typeof response.completedOrderDetails.count != 'undefined' && response.completedOrderDetails.count > 0) {
                                result.completedOrderDetails.count = response.completedOrderDetails.count;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && response.completedOrderDetails.orderDetails.length > 0) {
                                result.completedOrderDetails.orderDetails = response.completedOrderDetails.orderDetails;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.admin_total != 'undefined' && response.completedOrderDetails.admin_total != null) {
                                result.admin_total = response.completedOrderDetails.admin_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.grand_total != 'undefined' && response.completedOrderDetails.grand_total != null) {
                                result.grand_total = response.completedOrderDetails.grand_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.tax_total != 'undefined' && response.completedOrderDetails.tax_total != null) {
                                result.tax_total = response.completedOrderDetails.tax_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.coupon_total != 'undefined' && response.completedOrderDetails.coupon_total != null) {
                                result.coupon_total = response.completedOrderDetails.coupon_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.delivery_amount != 'undefined' && response.completedOrderDetails.delivery_amount != null) {
                                result.delivery_amount = response.completedOrderDetails.delivery_amount;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.driver_total != 'undefined' && response.completedOrderDetails.driver_total != null) {
                                result.driver_total = response.completedOrderDetails.driver_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.restaurant_total != 'undefined' && response.completedOrderDetails.restaurant_total != null) {
                                result.restaurant_total = response.completedOrderDetails.restaurant_total;
                            }
                        }
                        if (response && typeof response.userRejectedOrderDetails != 'undefined') {
                            if (typeof response.userRejectedOrderDetails.count != 'undefined' && response.userRejectedOrderDetails.count > 0) {
                                result.userRejectedOrderDetails.count = response.userRejectedOrderDetails.count;
                            }
                            if (typeof response.userRejectedOrderDetails.orderDetails != 'undefined' && response.userRejectedOrderDetails.orderDetails.length > 0) {
                                result.userRejectedOrderDetails.orderDetails = response.userRejectedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.adminRejectedOrderDetails != 'undefined') {
                            if (typeof response.adminRejectedOrderDetails.count != 'undefined' && response.adminRejectedOrderDetails.count > 0) {
                                result.adminRejectedOrderDetails.count = response.adminRejectedOrderDetails.count;
                            }
                            if (typeof response.adminRejectedOrderDetails.orderDetails != 'undefined' && response.adminRejectedOrderDetails.orderDetails.length > 0) {
                                result.adminRejectedOrderDetails.orderDetails = response.adminRejectedOrderDetails.orderDetails;
                            }
                        }
                        result.total_orders = result.newOrderDetails.count + result.restaurantRejectedOrderDetails.count +
                            result.restaurantAcceptOrderDetails.count + result.driverRejectedOrderDetails.count +
                            result.driverAcceptedOrderDetails.count + result.driverPickedUpOrderDetails.count +
                            result.completedOrderDetails.count + result.userRejectedOrderDetails.count + result.adminRejectedOrderDetails.count;





                        res.send(result);
                    })
            } catch (e) {
                console.log(e, "error at today order details api")
            }

        }


        // return;
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            if (err || !settings) {
                result.status = '0';
                result.message = 'Configure your app settings';
                res.send(result);
            } else {
                var filter_query = {};
                if (searchs != '') {
                    filter_query['$or'] = [];
                    var data = { "order_id": { $regex: searchs + '.*', $options: 'si' } };
                    filter_query['$or'].push(data);
                }
                if (main_city.length > 0) {
                    filter_query.main_city = { $in: main_city };
                }
                if (sub_city.length > 0) {
                    filter_query.sub_city = { $in: sub_city };
                }
                if (typeof start_time != 'undefined' || typeof end_time != 'undefined') {
                    filter_query['$and'] = [];
                    if (typeof start_time != 'undefined') {
                        var data = { "created_time": { $gte: parseInt(start_time) } };
                        filter_query['$and'].push(data)
                    }
                    if (typeof end_time != 'undefined') {
                        var data = { "created_time": { $lte: parseInt(end_time) } };
                        filter_query['$and'].push(data)
                    }
                }
                if (typeof from_date != 'undefined' && typeof to_date != 'undefined') {
                    filter_query['$and'] = [];
                    if (typeof from_date != 'undefined') {
                        // var data = { "createdAt": { $gte: parseInt(from_date) } };
                        var data = { "created_time": { $gte: parseInt(from_date) } };
                        filter_query['$and'].push(data)
                    }
                    if (typeof to_date != 'undefined') {
                        // var data = { "createdAt": { $lte: parseInt(to_date) } };
                        var data = { "created_time": { $lte: parseInt(to_date) } };
                        filter_query['$and'].push(data)
                    }
                }
                var condition = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'restaurant', localField: 'restaurant_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                restaurantDetails: {
                                    "name": "$restaurantDetails.restaurantname",
                                    "status": "$restaurantDetails.status",
                                    "avail": "$restaurantDetails.avail",
                                    "phone": "$restaurantDetails.phone",
                                    "address": "$restaurantDetails.address",
                                    "availability": "$restaurantDetails.availability",
                                    "location": "$restaurantDetails.location",
                                    "email": "$restaurantDetails.email",
                                    "unique_code": "$restaurantDetails.unique_code",
                                    "time_setting": "$restaurantDetails.time_setting",
                                    "offer": "$restaurantDetails.offer",
                                    "avatar": "$restaurantDetails.avatar",
                                    "_id": "$restaurantDetails._id"
                                },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                var condition1 = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'restaurant', localField: 'restaurant_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'drivers', localField: 'driver_id', foreignField: '_id', as: 'driverDetails' } },
                    { "$unwind": { path: "$driverDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                restaurantDetails: {
                                    "name": "$restaurantDetails.restaurantname",
                                    "status": "$restaurantDetails.status",
                                    "avail": "$restaurantDetails.avail",
                                    "phone": "$restaurantDetails.phone",
                                    "address": "$restaurantDetails.address",
                                    "availability": "$restaurantDetails.availability",
                                    "location": "$restaurantDetails.location",
                                    "email": "$restaurantDetails.email",
                                    "unique_code": "$restaurantDetails.unique_code",
                                    "time_setting": "$restaurantDetails.time_setting",
                                    "offer": "$restaurantDetails.offer",
                                    "avatar": "$restaurantDetails.avatar",
                                    "_id": "$restaurantDetails._id"
                                },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                                driverDetails: {
                                    "name": "$driverDetails.username",
                                    "status": "$driverDetails.status",
                                    "phone": "$driverDetails.phone",
                                    "address": "$driverDetails.address",
                                    "location": "$driverDetails.location",
                                    "email": "$driverDetails.email",
                                    "avatar": "$driverDetails.avatar",
                                    "_id": "$driverDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                var condition2 = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'city', localField: 'city_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'drivers', localField: 'driver_id', foreignField: '_id', as: 'driverDetails' } },
                    { "$unwind": { path: "$driverDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                coupon_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.coupon_discount", ''] }, ''] }, { $gte: ["$billings.amount.coupon_discount", 0] }] }, "$billings.amount.coupon_discount", 0] },
                                delivery_amount: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.delivery_amount", ''] }, ''] }, { $gte: ["$billings.amount.delivery_amount", 0] }] }, "$billings.amount.delivery_amount", 0] },
                                tax_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] },
                                driver_amount: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.driver_commission", ''] }, ''] }, { $gte: ["$billings.amount.driver_commission", 0] }] }, "$billings.amount.driver_commission", 0] },
                                //restaurant_commission: { $subtract: [{ $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.package_charge", ''] }, ''] }, { $gte: ["$billings.amount.package_charge", 0] }] }, "$billings.amount.package_charge", 0] }] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }, { "$cond": [{ $and: [{ $gte: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, 0] }] }, { $multiply: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, { $divide: ["$billings.amount.applied_admin_com", 100] }] }, 0] }] }] },
                                restaurant_commission: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] },
                                'final_earnings': { $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] }, { $sum: [{ $subtract: [{ $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.package_charge", ''] }, ''] }, { $gte: ["$billings.amount.package_charge", 0] }] }, "$billings.amount.package_charge", 0] }] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }, { "$cond": [{ $and: [{ $gte: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, 0] }] }, { $multiply: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, { $divide: ["$billings.amount.applied_admin_com", 100] }] }, 0] }] }] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.driver_commission", ''] }, ''] }, { $gte: ["$billings.amount.driver_commission", 0] }] }, "$billings.amount.driver_commission", 0] }] }] },
                                // restaurantDetails: {
                                //     "name": "$restaurantDetails.restaurantname",
                                //     "status": "$restaurantDetails.status",
                                //     "avail": "$restaurantDetails.avail",
                                //     "phone": "$restaurantDetails.phone",
                                //     "address": "$restaurantDetails.address",
                                //     "availability": "$restaurantDetails.availability",
                                //     "location": "$restaurantDetails.location",
                                //     "email": "$restaurantDetails.email",
                                //     "unique_code": "$restaurantDetails.unique_code",
                                //     "time_setting": "$restaurantDetails.time_setting",
                                //     "offer": "$restaurantDetails.offer",
                                //     "avatar": "$restaurantDetails.avatar",
                                //     "_id": "$restaurantDetails._id"
                                // },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                                driverDetails: {
                                    "name": "$driverDetails.username",
                                    "status": "$driverDetails.status",
                                    "phone": "$driverDetails.phone",
                                    "address": "$driverDetails.address",
                                    "location": "$driverDetails.location",
                                    "email": "$driverDetails.email",
                                    "avatar": "$driverDetails.avatar",
                                    "_id": "$driverDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            "grand_total": { $sum: '$orderDetails.grand_total' },
                            "coupon_total": { $sum: '$orderDetails.coupon_total' },
                            "tax_total": { $sum: '$orderDetails.tax_total' },
                            "delivery_amount": { $sum: '$orderDetails.delivery_amount' },
                            "admin_total": { $sum: '$orderDetails.final_earnings' },
                            "driver_total": { $sum: '$orderDetails.driver_amount' },
                            "restaurant_total": { $sum: '$orderDetails.restaurant_commission' },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                //console.log('filter_query',filter_query)
                var async = require('async');
                async.parallel({
                    newOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 1 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition, function (err, docdata) {
                            //console.log('newOrderDetails',err, docdata)
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    },
                    restaurantRejectedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 2 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition, function (err, docdata) {
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    },
                    restaurantAcceptOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 3 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition, function (err, docdata) {
                            //console.log('err, docdata')
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    },
                    driverRejectedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 4 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1, function (err, docdata) {
                            //console.log('docdata',err, docdata)
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    },
                    driverAcceptedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 5 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1, function (err, docdata) {
                            //console.log('driverAcceptedOrderDetails',err, docdata)
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    },
                    driverPickedUpOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 6 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1, function (err, docdata) {
                            //console.log('driverPickedUpOrderDetails',err, docdata)
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    },
                    completedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 7 };
                        condition2[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition2, function (err, docdata) {
                            if (err || !docdata) {
                                callback(null, { err: err, count: 0, orderDetails: [], admin_total: 0, driver_total: 0, restaurant_total: 0 });
                            } else {
                                //console.log('docdata',docdata)
                                var count = 0;
                                var restaurant_total = 0;
                                var driver_total = 0;
                                var admin_total = 0;
                                var grand_total = 0;
                                var tax_total = 0;
                                var coupon_total = 0;
                                var delivery_amount = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].coupon_total != 'undefined') {
                                        coupon_total = docdata[0].coupon_total;
                                    }

                                    if (typeof docdata[0].grand_total != 'undefined') {
                                        grand_total = docdata[0].grand_total;
                                    }

                                    if (typeof docdata[0].delivery_amount != 'undefined') {
                                        delivery_amount = docdata[0].delivery_amount;
                                    }

                                    if (typeof docdata[0].tax_total != 'undefined') {
                                        tax_total = docdata[0].tax_total;
                                    }

                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    if (typeof docdata[0].restaurant_total != 'undefined') {
                                        restaurant_total = docdata[0].restaurant_total;
                                    }
                                    if (typeof docdata[0].driver_total != 'undefined') {
                                        driver_total = docdata[0].driver_total;
                                    }
                                    if (typeof docdata[0].admin_total != 'undefined') {
                                        admin_total = docdata[0].admin_total;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails, admin_total: admin_total, driver_total: driver_total, restaurant_total: restaurant_total, tax_total: tax_total, grand_total: grand_total, coupon_total: coupon_total, delivery_amount: delivery_amount });
                                } else {
                                    callback(null, { count: 0, orderDetails: [], admin_total: 0, driver_total: 0, restaurant_total: 0, tax_total: 0, grand_total: 0, coupon_total: 0, delivery_amount: 0 });
                                }
                            }
                        })
                    },
                    userRejectedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 9 };
                        condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition, function (err, docdata) {
                            //console.log('userRejectedOrderDetails',err, docdata)
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    },
                    adminRejectedOrderDetails: function (callback) {
                        filter_query['status'] = { $eq: 10 };
                        condition1[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                        db.GetAggregation('orders', condition1, function (err, docdata) {
                            if (err || !docdata) {
                                callback(null, { err, err, count: 0, orderDetails: [] });
                            } else {
                                var count = 0;
                                var orderDetails = [];
                                if (docdata.length > 0) {
                                    if (typeof docdata[0].count != 'undefined') {
                                        count = docdata[0].count;
                                    }
                                    if (typeof docdata[0].orderDetails != 'undefined') {
                                        orderDetails = docdata[0].orderDetails;
                                    }
                                    callback(null, { count: count, orderDetails: orderDetails });
                                } else {
                                    callback(null, { count: 0, orderDetails: [] });
                                }
                            }
                        })
                    }
                },
                    function (err, response) {
                        if (response && typeof response.newOrderDetails != 'undefined') {
                            if (typeof response.newOrderDetails.count != 'undefined' && response.newOrderDetails.count > 0) {
                                result.newOrderDetails.count = response.newOrderDetails.count;
                            }
                            if (typeof response.newOrderDetails.orderDetails != 'undefined' && response.newOrderDetails.orderDetails.length > 0) {
                                result.newOrderDetails.orderDetails = response.newOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.restaurantRejectedOrderDetails != 'undefined') {
                            if (typeof response.restaurantRejectedOrderDetails.count != 'undefined' && response.restaurantRejectedOrderDetails.count > 0) {
                                result.restaurantRejectedOrderDetails.count = response.restaurantRejectedOrderDetails.count;
                            }
                            if (typeof response.restaurantRejectedOrderDetails.orderDetails != 'undefined' && response.restaurantRejectedOrderDetails.orderDetails.length > 0) {
                                result.restaurantRejectedOrderDetails.orderDetails = response.restaurantRejectedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.restaurantAcceptOrderDetails != 'undefined') {
                            if (typeof response.restaurantAcceptOrderDetails.count != 'undefined' && response.restaurantAcceptOrderDetails.count > 0) {
                                result.restaurantAcceptOrderDetails.count = response.restaurantAcceptOrderDetails.count;
                            }
                            if (typeof response.restaurantAcceptOrderDetails.orderDetails != 'undefined' && response.restaurantAcceptOrderDetails.orderDetails.length > 0) {
                                result.restaurantAcceptOrderDetails.orderDetails = response.restaurantAcceptOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.driverRejectedOrderDetails != 'undefined') {
                            if (typeof response.driverRejectedOrderDetails.count != 'undefined' && response.driverRejectedOrderDetails.count > 0) {
                                result.driverRejectedOrderDetails.count = response.driverRejectedOrderDetails.count;
                            }
                            if (typeof response.driverRejectedOrderDetails.orderDetails != 'undefined' && response.driverRejectedOrderDetails.orderDetails.length > 0) {
                                result.driverRejectedOrderDetails.orderDetails = response.driverRejectedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.driverAcceptedOrderDetails != 'undefined') {
                            if (typeof response.driverAcceptedOrderDetails.count != 'undefined' && response.driverAcceptedOrderDetails.count > 0) {
                                result.driverAcceptedOrderDetails.count = response.driverAcceptedOrderDetails.count;
                            }
                            if (typeof response.driverAcceptedOrderDetails.orderDetails != 'undefined' && response.driverAcceptedOrderDetails.orderDetails.length > 0) {
                                result.driverAcceptedOrderDetails.orderDetails = response.driverAcceptedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.driverPickedUpOrderDetails != 'undefined') {
                            if (typeof response.driverPickedUpOrderDetails.count != 'undefined' && response.driverPickedUpOrderDetails.count > 0) {
                                result.driverPickedUpOrderDetails.count = response.driverPickedUpOrderDetails.count;
                            }
                            if (typeof response.driverPickedUpOrderDetails.orderDetails != 'undefined' && response.driverPickedUpOrderDetails.orderDetails.length > 0) {
                                result.driverPickedUpOrderDetails.orderDetails = response.driverPickedUpOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.completedOrderDetails != 'undefined') {
                            if (typeof response.completedOrderDetails.count != 'undefined' && response.completedOrderDetails.count > 0) {
                                result.completedOrderDetails.count = response.completedOrderDetails.count;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && response.completedOrderDetails.orderDetails.length > 0) {
                                result.completedOrderDetails.orderDetails = response.completedOrderDetails.orderDetails;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.admin_total != 'undefined' && response.completedOrderDetails.admin_total != null) {
                                result.admin_total = response.completedOrderDetails.admin_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.grand_total != 'undefined' && response.completedOrderDetails.grand_total != null) {
                                result.grand_total = response.completedOrderDetails.grand_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.tax_total != 'undefined' && response.completedOrderDetails.tax_total != null) {
                                result.tax_total = response.completedOrderDetails.tax_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.coupon_total != 'undefined' && response.completedOrderDetails.coupon_total != null) {
                                result.coupon_total = response.completedOrderDetails.coupon_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.delivery_amount != 'undefined' && response.completedOrderDetails.delivery_amount != null) {
                                result.delivery_amount = response.completedOrderDetails.delivery_amount;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.driver_total != 'undefined' && response.completedOrderDetails.driver_total != null) {
                                result.driver_total = response.completedOrderDetails.driver_total;
                            }
                            if (typeof response.completedOrderDetails.orderDetails != 'undefined' && typeof response.completedOrderDetails.restaurant_total != 'undefined' && response.completedOrderDetails.restaurant_total != null) {
                                result.restaurant_total = response.completedOrderDetails.restaurant_total;
                            }
                        }
                        if (response && typeof response.userRejectedOrderDetails != 'undefined') {
                            if (typeof response.userRejectedOrderDetails.count != 'undefined' && response.userRejectedOrderDetails.count > 0) {
                                result.userRejectedOrderDetails.count = response.userRejectedOrderDetails.count;
                            }
                            if (typeof response.userRejectedOrderDetails.orderDetails != 'undefined' && response.userRejectedOrderDetails.orderDetails.length > 0) {
                                result.userRejectedOrderDetails.orderDetails = response.userRejectedOrderDetails.orderDetails;
                            }
                        }
                        if (response && typeof response.adminRejectedOrderDetails != 'undefined') {
                            if (typeof response.adminRejectedOrderDetails.count != 'undefined' && response.adminRejectedOrderDetails.count > 0) {
                                result.adminRejectedOrderDetails.count = response.adminRejectedOrderDetails.count;
                            }
                            if (typeof response.adminRejectedOrderDetails.orderDetails != 'undefined' && response.adminRejectedOrderDetails.orderDetails.length > 0) {
                                result.adminRejectedOrderDetails.orderDetails = response.adminRejectedOrderDetails.orderDetails;
                            }
                        }
                        result.total_orders = result.newOrderDetails.count + result.restaurantRejectedOrderDetails.count + result.restaurantAcceptOrderDetails.count + result.driverRejectedOrderDetails.count + result.driverAcceptedOrderDetails.count + result.driverPickedUpOrderDetails.count + result.completedOrderDetails.count + result.userRejectedOrderDetails.count + result.adminRejectedOrderDetails.count;
                        res.send(result);
                    })
            }
        })
    }

    router.todayFilterOrderDetails = function (req, res) {
        var filters = '';
        var searchs = '';
        var offer = false;
        var limit = 10;
        var status;
        if (req.query.limit) {
            var tmp = parseInt(req.query.limit);
            if (tmp != NaN && tmp > 0) {
                limit = tmp;
            }
        }
        var skip = 0;
        if (typeof req.query.pageId != 'undefined') {
            if (req.query.pageId) {
                var tmp = parseInt(req.query.pageId);
                if (tmp != NaN && tmp > 0) {
                    skip = (tmp * limit) - limit;
                }
            }
        }
        var main_city = [];
        var sub_city = [];
        var start_time;
        var end_time;
        var sort = { 'orderDetails.createdAt': -1 };
        if (typeof req.query.filters != 'undefined' && req.query.filters != '') {
            filters = req.query.filters;
            if (filters != '') {
                filters = decodeURIComponent(filters);
                filters = decodeURIComponent(filters);
                var filterArray = filters.split('|');
                for (var i = 0; i < filterArray.length; i++) {
                    if (filterArray[i] != '') {
                        var option = filterArray[i].split(':');
                        if (option.length > 1) {
                            var values = [];
                            if (option[1] != '') {
                                values = option[1].split(',');
                            }
                            if (values.length > 0) {
                                if (option[0] == 'c') {
                                    main_city = values;
                                }
                                if (option[0] == 'l') {
                                    sub_city = values;
                                }
                                if (option[0] == 's') {
                                    if (values.length > 0) {
                                        start_time = values[0];
                                    }
                                }
                                if (option[0] == 'e') {
                                    if (values.length > 0) {
                                        end_time = values[0];
                                    }
                                }
                                if (option[0] == 'q') {
                                    if (values.length > 0) {
                                        searchs = values[0];
                                    }
                                }
                                if (option[0] == 'os') {
                                    if (values.length > 0) {
                                        status = values[0];
                                    }
                                }
                                if (option[0] == 'o') {
                                    if (values.length > 0) {
                                        sort = {};
                                        sort[values[0]] = parseInt(values[1]);
                                    }
                                }

                            }
                        }
                    }

                }
            }
        }
        var result = {};
        result.count = 0;
        result.orderDetails = [];
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            if (err || !settings) {
                result.status = '0';
                result.message = 'Configure your app settings';
                res.send(result);
            } else {
                var filter_query = { status: 1 };
                if (searchs != '') {
                    filter_query['$or'] = [];
                    var data = { "order_id": { $regex: searchs + '.*', $options: 'si' } };
                    filter_query['$or'].push(data);
                }
                if (main_city.length > 0) {
                    filter_query.main_city = { $in: main_city };
                }
                if (sub_city.length > 0) {
                    filter_query.sub_city = { $in: sub_city };
                }
                if (typeof start_time != 'undefined' || typeof end_time != 'undefined') {
                    filter_query['$and'] = [];
                    if (typeof start_time != 'undefined') {
                        var data = { "created_time": { $gte: parseInt(start_time) } };
                        filter_query['$and'].push(data)
                    }
                    if (typeof end_time != 'undefined') {
                        var data = { "created_time": { $lte: parseInt(end_time) } };
                        filter_query['$and'].push(data)
                    }
                }
                var condition = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'restaurant', localField: 'restaurant_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                restaurantDetails: {
                                    "name": "$restaurantDetails.restaurantname",
                                    "status": "$restaurantDetails.status",
                                    "avail": "$restaurantDetails.avail",
                                    "phone": "$restaurantDetails.phone",
                                    "address": "$restaurantDetails.address",
                                    "availability": "$restaurantDetails.availability",
                                    "location": "$restaurantDetails.location",
                                    "email": "$restaurantDetails.email",
                                    "unique_code": "$restaurantDetails.unique_code",
                                    "time_setting": "$restaurantDetails.time_setting",
                                    "offer": "$restaurantDetails.offer",
                                    "avatar": "$restaurantDetails.avatar",
                                    "_id": "$restaurantDetails._id"
                                },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                if (typeof status != 'undefined' && status != '') {
                    try {
                        status = parseInt(status);
                    } catch (e) {

                    }
                }
                filter_query['status'] = { $eq: status };
                condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                db.GetAggregation('orders', condition, function (err, docdata) {
                    result.status = '1';
                    result.message = '';
                    if (err || !docdata) {
                        res.send(result)
                    } else {
                        if (docdata.length > 0) {
                            if (typeof docdata[0].count != 'undefined') {
                                result.count = docdata[0].count;
                            }
                            if (typeof docdata[0].orderDetails != 'undefined') {
                                result.orderDetails = docdata[0].orderDetails;
                            }
                            res.send(result)
                        } else {
                            res.send(result)
                        }
                    }
                })
            }
        })
    }

    router.todayFilterOrderDetailsWithDriver = function (req, res) {
        var filters = '';
        var searchs = '';
        var offer = false;
        var limit = 10;
        var status;
        if (req.query.limit) {
            var tmp = parseInt(req.query.limit);
            if (tmp != NaN && tmp > 0) {
                limit = tmp;
            }
        }
        var skip = 0;
        if (typeof req.query.pageId != 'undefined') {
            if (req.query.pageId) {
                var tmp = parseInt(req.query.pageId);
                if (tmp != NaN && tmp > 0) {
                    skip = (tmp * limit) - limit;
                }
            }
        }
        var main_city = [];
        var sub_city = [];
        var start_time;
        var end_time;
        var sort = { 'orderDetails.createdAt': -1 };
        if (typeof req.query.filters != 'undefined' && req.query.filters != '') {
            filters = req.query.filters;
            if (filters != '') {
                filters = decodeURIComponent(filters);
                filters = decodeURIComponent(filters);
                var filterArray = filters.split('|');
                for (var i = 0; i < filterArray.length; i++) {
                    if (filterArray[i] != '') {
                        var option = filterArray[i].split(':');
                        if (option.length > 1) {
                            var values = [];
                            if (option[1] != '') {
                                values = option[1].split(',');
                            }
                            if (values.length > 0) {
                                if (option[0] == 'c') {
                                    main_city = values;
                                }
                                if (option[0] == 'l') {
                                    sub_city = values;
                                }
                                if (option[0] == 's') {
                                    if (values.length > 0) {
                                        start_time = values[0];
                                    }
                                }
                                if (option[0] == 'e') {
                                    if (values.length > 0) {
                                        end_time = values[0];
                                    }
                                }
                                if (option[0] == 'q') {
                                    if (values.length > 0) {
                                        searchs = values[0];
                                    }
                                }
                                if (option[0] == 'os') {
                                    if (values.length > 0) {
                                        status = values[0];
                                    }
                                }
                                if (option[0] == 'o') {
                                    if (values.length > 0) {
                                        sort = {};
                                        sort[values[0]] = parseInt(values[1]);
                                    }
                                }

                            }
                        }
                    }

                }
            }
        }
        var result = {};
        result.count = 0;
        result.orderDetails = [];
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            if (err || !settings) {
                result.status = '0';
                result.message = 'Configure your app settings';
                res.send(result);
            } else {
                var filter_query = { status: 1 };
                if (searchs != '') {
                    filter_query['$or'] = [];
                    var data = { "order_id": { $regex: searchs + '.*', $options: 'si' } };
                    filter_query['$or'].push(data);
                }
                if (main_city.length > 0) {
                    filter_query.main_city = { $in: main_city };
                }
                if (sub_city.length > 0) {
                    filter_query.sub_city = { $in: sub_city };
                }
                if (typeof start_time != 'undefined' || typeof end_time != 'undefined') {
                    filter_query['$and'] = [];
                    if (typeof start_time != 'undefined') {
                        var data = { "created_time": { $gte: parseInt(start_time) } };
                        filter_query['$and'].push(data)
                    }
                    if (typeof end_time != 'undefined') {
                        var data = { "created_time": { $lte: parseInt(end_time) } };
                        filter_query['$and'].push(data)
                    }
                }
                var condition = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'restaurant', localField: 'restaurant_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'drivers', localField: 'driver_id', foreignField: '_id', as: 'driverDetails' } },
                    { "$unwind": { path: "$driverDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                restaurantDetails: {
                                    "name": "$restaurantDetails.restaurantname",
                                    "status": "$restaurantDetails.status",
                                    "avail": "$restaurantDetails.avail",
                                    "phone": "$restaurantDetails.phone",
                                    "address": "$restaurantDetails.address",
                                    "availability": "$restaurantDetails.availability",
                                    "location": "$restaurantDetails.location",
                                    "email": "$restaurantDetails.email",
                                    "unique_code": "$restaurantDetails.unique_code",
                                    "time_setting": "$restaurantDetails.time_setting",
                                    "offer": "$restaurantDetails.offer",
                                    "avatar": "$restaurantDetails.avatar",
                                    "_id": "$restaurantDetails._id"
                                },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                                driverDetails: {
                                    "name": "$driverDetails.username",
                                    "status": "$driverDetails.status",
                                    "phone": "$driverDetails.phone",
                                    "address": "$driverDetails.address",
                                    "location": "$driverDetails.location",
                                    "email": "$driverDetails.email",
                                    "avatar": "$driverDetails.avatar",
                                    "_id": "$driverDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                if (typeof status != 'undefined' && status != '') {
                    try {
                        status = parseInt(status);
                    } catch (e) {

                    }
                }
                filter_query['status'] = { $eq: status };
                condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                db.GetAggregation('orders', condition, function (err, docdata) {
                    result.status = '1';
                    result.message = '';
                    if (err || !docdata) {
                        res.send(result)
                    } else {
                        if (docdata.length > 0) {
                            if (typeof docdata[0].count != 'undefined') {
                                result.count = docdata[0].count;
                            }
                            if (typeof docdata[0].orderDetails != 'undefined') {
                                result.orderDetails = docdata[0].orderDetails;
                            }
                            res.send(result)
                        } else {
                            res.send(result)
                        }
                    }
                })
            }
        })
    }

    router.todayFilterCompletedOrderDetails = function (req, res) {
        var filters = '';
        var searchs = '';
        var offer = false;
        var limit = 10;
        var status;
        if (req.query.limit) {
            var tmp = parseInt(req.query.limit);
            if (tmp != NaN && tmp > 0) {
                limit = tmp;
            }
        }
        var skip = 0;
        if (typeof req.query.pageId != 'undefined') {
            if (req.query.pageId) {
                var tmp = parseInt(req.query.pageId);
                if (tmp != NaN && tmp > 0) {
                    skip = (tmp * limit) - limit;
                }
            }
        }
        var main_city = [];
        var sub_city = [];
        var start_time;
        var end_time;
        var sort = { 'orderDetails.createdAt': -1 };
        if (typeof req.query.filters != 'undefined' && req.query.filters != '') {
            filters = req.query.filters;
            if (filters != '') {
                filters = decodeURIComponent(filters);
                filters = decodeURIComponent(filters);
                var filterArray = filters.split('|');
                for (var i = 0; i < filterArray.length; i++) {
                    if (filterArray[i] != '') {
                        var option = filterArray[i].split(':');
                        if (option.length > 1) {
                            var values = [];
                            if (option[1] != '') {
                                values = option[1].split(',');
                            }
                            if (values.length > 0) {
                                if (option[0] == 'c') {
                                    main_city = values;
                                }
                                if (option[0] == 'l') {
                                    sub_city = values;
                                }
                                if (option[0] == 's') {
                                    if (values.length > 0) {
                                        start_time = values[0];
                                    }
                                }
                                if (option[0] == 'e') {
                                    if (values.length > 0) {
                                        end_time = values[0];
                                    }
                                }
                                if (option[0] == 'q') {
                                    if (values.length > 0) {
                                        searchs = values[0];
                                    }
                                }
                                if (option[0] == 'os') {
                                    if (values.length > 0) {
                                        status = values[0];
                                    }
                                }
                                if (option[0] == 'o') {
                                    if (values.length > 0) {
                                        sort = {};
                                        sort[values[0]] = parseInt(values[1]);
                                    }
                                }

                            }
                        }
                    }

                }
            }
        }
        var result = {};
        result.count = 0;
        result.orderDetails = [];
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            if (err || !settings) {
                result.status = '0';
                result.message = 'Configure your app settings';
                res.send(result);
            } else {
                var filter_query = { status: 1 };
                if (searchs != '') {
                    filter_query['$or'] = [];
                    var data = { "order_id": { $regex: searchs + '.*', $options: 'si' } };
                    filter_query['$or'].push(data);
                }
                if (main_city.length > 0) {
                    filter_query.main_city = { $in: main_city };
                }
                if (sub_city.length > 0) {
                    filter_query.sub_city = { $in: sub_city };
                }
                if (typeof start_time != 'undefined' || typeof end_time != 'undefined') {
                    filter_query['$and'] = [];
                    if (typeof start_time != 'undefined') {
                        var data = { "created_time": { $gte: parseInt(start_time) } };
                        filter_query['$and'].push(data)
                    }
                    if (typeof end_time != 'undefined') {
                        var data = { "created_time": { $lte: parseInt(end_time) } };
                        filter_query['$and'].push(data)
                    }
                }
                var condition = [
                    { "$match": filter_query },
                    { '$lookup': { from: 'restaurant', localField: 'restaurant_id', foreignField: '_id', as: 'restaurantDetails' } },
                    { "$unwind": { path: "$restaurantDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'users', localField: 'user_id', foreignField: '_id', as: 'userDetails' } },
                    { "$unwind": { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    { '$lookup': { from: 'drivers', localField: 'driver_id', foreignField: '_id', as: 'driverDetails' } },
                    { "$unwind": { path: "$driverDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderDetails: {
                                order_id: "$order_id",
                                _id: "$_id",
                                grand_total: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] },
                                driver_amount: { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.driver_commission", ''] }, ''] }, { $gte: ["$billings.amount.driver_commission", 0] }] }, "$billings.amount.driver_commission", 0] },
                                restaurant_commission: { $subtract: [{ $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.package_charge", ''] }, ''] }, { $gte: ["$billings.amount.package_charge", 0] }] }, "$billings.amount.package_charge", 0] }] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }, { "$cond": [{ $and: [{ $gte: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, 0] }] }, { $multiply: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, { $divide: ["$billings.amount.applied_admin_com", 100] }] }, 0] }] }] },
                                'final_earnings': { $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.grand_total", ''] }, ''] }, { $gte: ["$billings.amount.grand_total", 0] }] }, "$billings.amount.grand_total", 0] }, { $sum: [{ $subtract: [{ $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.service_tax", ''] }, ''] }, { $gte: ["$billings.amount.service_tax", 0] }] }, "$billings.amount.service_tax", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.package_charge", ''] }, ''] }, { $gte: ["$billings.amount.package_charge", 0] }] }, "$billings.amount.package_charge", 0] }] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }, { "$cond": [{ $and: [{ $gte: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, 0] }] }, { $multiply: [{ $subtract: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.total", ''] }, ''] }, { $gte: ["$billings.amount.total", 0] }] }, "$billings.amount.total", 0] }, { $sum: [{ "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.offer_discount", ''] }, ''] }, { $gte: ["$billings.amount.offer_discount", 0] }] }, "$billings.amount.offer_discount", 0] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.food_offer_price", ''] }, ''] }, { $gte: ["$billings.amount.food_offer_price", 0] }] }, "$billings.amount.food_offer_price", 0] }] }] }, { $divide: ["$billings.amount.applied_admin_com", 100] }] }, 0] }] }] }, { "$cond": [{ $and: [{ $ne: [{ "$ifNull": ["$billings.amount.driver_commission", ''] }, ''] }, { $gte: ["$billings.amount.driver_commission", 0] }] }, "$billings.amount.driver_commission", 0] }] }] },
                                restaurantDetails: {
                                    "name": "$restaurantDetails.restaurantname",
                                    "status": "$restaurantDetails.status",
                                    "avail": "$restaurantDetails.avail",
                                    "phone": "$restaurantDetails.phone",
                                    "address": "$restaurantDetails.address",
                                    "availability": "$restaurantDetails.availability",
                                    "location": "$restaurantDetails.location",
                                    "email": "$restaurantDetails.email",
                                    "unique_code": "$restaurantDetails.unique_code",
                                    "time_setting": "$restaurantDetails.time_setting",
                                    "offer": "$restaurantDetails.offer",
                                    "avatar": "$restaurantDetails.avatar",
                                    "_id": "$restaurantDetails._id"
                                },
                                userDetails: {
                                    "name": "$userDetails.username",
                                    "status": "$userDetails.status",
                                    "phone": "$userDetails.phone",
                                    "address": "$userDetails.address",
                                    "location": "$userDetails.location",
                                    "email": "$userDetails.email",
                                    "avatar": "$userDetails.avatar",
                                    "_id": "$userDetails._id",
                                },
                                driverDetails: {
                                    "name": "$driverDetails.username",
                                    "status": "$driverDetails.status",
                                    "phone": "$driverDetails.phone",
                                    "address": "$driverDetails.address",
                                    "location": "$driverDetails.location",
                                    "email": "$driverDetails.email",
                                    "avatar": "$driverDetails.avatar",
                                    "_id": "$driverDetails._id",
                                },
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "null",
                            "count": { $sum: 1 },
                            "admin_total": { $sum: '$orderDetails.final_earnings' },
                            "driver_total": { $sum: '$orderDetails.driver_amount' },
                            "restaurant_total": { $sum: '$orderDetails.restaurant_commission' },
                            'orderDetails': { $push: "$orderDetails" }
                        }
                    }
                ];
                if (typeof status != 'undefined' && status != '') {
                    try {
                        status = parseInt(status);
                    } catch (e) {

                    }
                }
                filter_query['status'] = { $eq: status };
                condition[0] = { "$match": JSON.parse(JSON.stringify(filter_query)) };
                db.GetAggregation('orders', condition, function (err, docdata) {
                    result.status = '1';
                    result.message = '';
                    if (err || !docdata) {
                        res.send(result)
                    } else {
                        if (docdata.length > 0) {
                            if (typeof docdata[0].count != 'undefined') {
                                result.count = docdata[0].count;
                            }
                            if (typeof docdata[0].orderDetails != 'undefined') {
                                result.orderDetails = docdata[0].orderDetails;
                            }
                            res.send(result)
                        } else {
                            res.send(result)
                        }
                    }
                })
            }
        })
    }
    router.adminCancelOrder = async (req, res) => {
        let { order_id, status } = req.body
        console.log(req.body);
        try {
            if (status == 19) {
                let refundOrder = await db.GetOneDocument('orders', { _id: new mongoose.Types.ObjectId(order_id) }, {}, {})
                if (refundOrder) {
                    console.log("transaction data is shown here");
                    let transaction = await db.GetOneDocument('transaction', { _id: new mongoose.Types.ObjectId(refundOrder.doc.transaction_id) }, {}, {})
                    if (transaction.doc.type === "razorpay") {
                        let paymentgatewaydata = await db.GetOneDocument("paymentgateway", { alias: "Razorpay" }, {}, {})
                        let refundmode = paymentgatewaydata.doc.settings.refundMode
                        let amount = transaction.doc.amount
                        let razorpaypaymentId = refundOrder.doc.razorpaypayment_id
                        console.log("this are the data we want to pass to the refunc data")
                        console.log(refundmode, amount, razorpaypaymentId)
                        let data = await razorPay.refundPayment(razorpaypaymentId, amount, refundmode)
                        if (data.status === "processed") {
                            await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: data.status } })
                        } else if (data.status == 'pending') {
                            await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: data.status } })
                        } else {
                            await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: data.status } })
                        }
                    } else if (transaction.doc.type === "stripe") {
                        console.log("entered into the refund of stripe payment")
                        let stripechargeid = refundOrder.doc.stripechargeid
                        let amount = transaction.doc.amount
                        console.log(amount, stripechargeid)
                        let result = await stripe.stripeRefund(stripechargeid, amount)
                        if (result.status === 'succeeded') {
                            await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: result.status } })
                        }

                    }
                    let result = await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(order_id) }, { $set: { status: status } }, {})
                    console.log("here we show the status");
                    console.log(result);
                    res.send({ status: true, message: "Updated Successfully" })
                }

            } else {
                res.status(500).send({ message: "somthing went wrong" })
            }
        } catch (error) {
            res.status(500).send({ message: "somthing went wrong !please try again" })
        }
    }
    router.updateOrderStatus = async (req, res) => {
        var errors = [];
        // req.checkBody('order_id', 'order_id is required').notEmpty();
        // req.checkBody('status', 'status is required').notEmpty();
        // errors = req.validationErrors();
        // if (errors) {
        //     res.send({
        //         status: 0,
        //         message: errors[0].msg
        //     });
        //     return;
        // }



        const result = await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "status": req.body.status } }, {})
        if (result.status == false) {
            return res.send({ status: 0, message: error.message || 'Something went wrong' })
        } else {
            if (req.body.status == 3) {
                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.packed": new Date(), "updated_time": new Date() } }, {})
                // db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.packed": new Date() } }, {}, (error, result) => { })
            }
            if (req.body.status == 6) {
                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.shipped": new Date(), "updated_time": new Date() } }, {})
                // db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.shipped": new Date() } }, {}, (error, result) => { })
            }
            if (req.body.status == 7) {
                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.delivered": new Date(), returnStatus: true, "updated_time": new Date() } }, {})
                setTimeout(async () => {
                    await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { returnStatus: false } }, {});
                }, 60000);
                // db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.delivered": new Date() } }, {}, (error, result) => { })
            }
            if (req.body.status == 17) {
                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.order_collected": new Date(), "updated_time": new Date() } }, {})
                // db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.delivered": new Date() } }, {}, (error, result) => { })
            }
            if (req.body.status == 18) {
                console.log("Delivered+++++++++++++++++++++++++++++++++))))))))))))))))))++++++++++++++)))))))))))))))++++++++++++))))))))))))++++++++++)))))))))))+++++++++)+)+)+)+)+)+)+)+)+)+)+)+");
                const refundOrder = await db.GetOneDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, {}, {})
                console.log(refundOrder.doc, 'this is the order=================================================');

                if (refundOrder.status == false) {
                } else {
                    const transaction = await db.GetOneDocument('transaction', { _id: new mongoose.Types.ObjectId(refundOrder.doc.transaction_id) }, {}, {})
                    console.log(transaction.doc, 'this is the transaction===========================================');

                    if (transaction.status == false) {
                        console.log(transaction.doc, 'this is the transaction');
                    } else {
                        // if (transaction.doc.type == 'online') {
                        //     console.log('thi is online order++++++++++++++++++++++++');
                        //     const res = await cashfree.createRefund(refundOrder.doc.order_id, transaction.doc.amount)
                        //     console.log(res, 'this is the res of the res');
                        //     if (res.refund_status == 'PENDING') {
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_pending": new Date() } }, {});
                        //         console.log("PENDING PENDING PENDING ");
                        //     } else if (res.refund_status == 'SUCCESS') {
                        //         console.log("SUCCESS SUCCESS SUCCESS  ");
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_success": new Date() } }, {});
                        //     } else if (res.refund_status == 'CANCELLED') {
                        //         console.log("CANCELLED CANCELLED CANCELLED  ");
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_canceled": new Date() } }, {});

                        //     } else if (res.refund_status == 'ONHOLD') {
                        //         console.log("ONHOLD ONHOLD ONHOLD");
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_onhold": new Date() } }, {});

                        //     } else if (res.refund_status == 'FAILED') {
                        //         console.log("FAILED FAILED FAILED");
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_failed": new Date() } }, {});
                        //     } else {
                        //         return res.send({ error: false, status: 0, message: "This refund has problem the amount you is not greater than that of the ordered amount" })
                        //     }
                        // }
                        // else if (transaction.doc.type === "razorpay") {
                        //     console.log("enterd into the razropay refund conditon operator")
                        //     let paymentgatewaydata = await db.GetOneDocument("paymentgateway", { alias: "Razorpay" }, {}, {})
                        //     let refundmode = paymentgatewaydata.doc.settings.refundMode
                        //     let amount = transaction.doc.amount
                        //     let razorpaypaymentId = refundOrder.doc.razorpaypayment_id
                        //     console.log("this are the data we want to pass to the refunc data")
                        //     console.log(refundmode, amount, razorpaypaymentId)
                        //     let data = await razorPay.refundPayment(razorpaypaymentId, amount, refundmode)
                        //     if (data.status === "processed") {
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: data.status } })
                        //     } else if (data.status == 'pending') {
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: data.status } })
                        //     } else {
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: data.status } })
                        //     }
                        // } else if (transaction.doc.type === "stripe") {
                        //     console.log("entered into the refund of stripe payment")
                        //     // console.log(refundOrder)
                        //     let stripechargeid = refundOrder.doc.stripechargeid
                        //     let amount = transaction.doc.amount
                        //     console.log(amount, stripechargeid)
                        //     let result = await stripe.stripeRefund(stripechargeid, amount)
                        //     if (result.status === 'succeeded') {
                        //         await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: result.status } })
                        //     }

                        // }
                        // else {


                        //     // await db.UpdateDocument('orders', { order_id: data.data.refund.order_id }, { $set: { refundStatus: data.data.refund.refund_status,"order_history.refund_success": new Date() } }, {});
                        //     await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.order_refunded": new Date() } }, {})
                        //     await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: "SUCCESS", "order_history.refund_success": new Date() } }, {});
                        // }
                    }
                }
                // db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.delivered": new Date() } }, {}, (error, result) => { })
            }

            const doc = await db.GetOneDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, {}, {})
            if (doc.status) {
                sendMailUser(doc, req.body.status);
            }
            // db.GetOneDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, {}, {}, (err, doc) => {
            //     if (doc) {
            //         sendMailUser(doc, req.body.status);
            //     }
            // })
            return res.send({ status: 1, message: "Updated Successfully" })
        }
        // db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "status": req.body.status } }, {}, (error, result) => {
        //     // console.log("error, res", error, res)
        //     if (error) {
        //         return res.send({ status: 0, message: error.message || 'Something went wrong' })
        //     } else {
        //         if (req.body.status == 3) {
        //             db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.packed": new Date() } }, {}, (error, result) => { })
        //         }
        //         if (req.body.status == 6) {
        //             db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.shipped": new Date() } }, {}, (error, result) => { })
        //         }
        //         if (req.body.status == 7) {
        //             db.UpdateDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, { $set: { "order_history.delivered": new Date() } }, {}, (error, result) => { })
        //         }
        //         db.GetOneDocument('orders', { _id: mongoose.Types.ObjectId(req.body.order_id) }, {}, {}, (err, doc) => {
        //             if (doc) {
        //                 sendMailUser(doc, req.body.status);
        //             }
        //         })
        //         return res.send({ status: 1, message: "Updated Successfully" })
        //     }
        // })
    }

    router.updateReturnOrderStatus = async (req, res) => {
        try {
            const date = new Date();
            if (req.body.status === 17) {
                const docdata = await db.UpdateDocument('orders', { _id: { $in: req.body.id }, "foods.id": req.body.product_id }, { $set: { "foods.$.status": 17, "foods.$.collected_date": date } }, { multi: true });
                if (docdata.status === false) {
                    return res.status(404).send({ status: false, message: 'Something went wrong in the user' });
                } else {
                    return res.status(200).send({ status: true, message: 'Order collected successfully' });
                }
            }
            if (req.body.status === 18) {
                console.log("Delivered+++++++++++++++++++++++++++++++++))))))))))))))))))++++++++++++++)))))))))))))))++++++++++++))))))))))))++++++++++)))))))))))+++++++++)+)+)+)+)+)+)+)+)+)+)+)+");
                const refundOrder = await db.GetOneDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, {}, {});
                console.log(refundOrder.doc, 'this is the order=================================================');

                if (refundOrder.status == false) {
                    // Handle the case where refundOrder status is false
                } else {
                    const transaction = await db.GetOneDocument('transaction', { _id: new mongoose.Types.ObjectId(refundOrder.doc.transaction_id) }, {}, {});
                    console.log(transaction.doc, 'this is the transaction===========================================');

                    if (transaction.status == false) {
                        console.log(transaction.doc, 'this is the transaction');
                    } else {
                        if (transaction.doc.type == 'online') {
                            console.log('thi is online order++++++++++++++++++++++++');
                            const res = await cashfree.createRefund(refundOrder.doc.order_id, transaction.doc.amount);
                            console.log(res, 'this is the res of the res');
                            if (res.refund_status == 'PENDING') {
                                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_pending": new Date() } }, {});
                                console.log("PENDING PENDING PENDING ");
                            } else if (res.refund_status == 'SUCCESS') {
                                console.log("SUCCESS SUCCESS SUCCESS  ");
                                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_success": new Date() } }, {});
                            } else if (res.refund_status == 'CANCELLED') {
                                console.log("CANCELLED CANCELLED CANCELLED  ");
                                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_canceled": new Date() } }, {});

                            } else if (res.refund_status == 'ONHOLD') {
                                console.log("ONHOLD ONHOLD ONHOLD");
                                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_onhold": new Date() } }, {});

                            } else if (res.refund_status == 'FAILED') {
                                console.log("FAILED FAILED FAILED");
                                await db.UpdateDocument('orders', { _id: new mongoose.Types.ObjectId(req.body.order_id) }, { $set: { refundStatus: res.refund_status, "order_history.refund_failed": new Date() } }, {});
                            } else {
                                return res.status(400).send({ error: false, status: 0, message: "This refund has problem the amount you is not greater than that of the ordered amount" });
                            }
                        }
                        else if (transaction.doc.type === "razorpay") {
                            console.log("enterd into the razropay refund conditon operator");
                            let paymentgatewaydata = await db.GetOneDocument("paymentgateway", { alias: "Razorpay" }, {}, {});
                            let refundmode = paymentgatewaydata.doc.settings.refundMode;
                            let amount = req.body.row.foods.quantity * req.body.row.foods.price;
                            let razorpaypaymentId = refundOrder.doc.razorpaypayment_id;
                            console.log("this are the data we want to pass to the refunc data");
                            console.log(refundmode, amount, razorpaypaymentId);
                            let data = await razorPay.refundPayment(razorpaypaymentId, amount, refundmode);
                            if (data.status === "processed") {
                                await db.UpdateDocument('orders', { _id: { $in: req.body.order_id }, "foods.id": req.body.row.foods.id }, { $set: { "foods.$.status": 18, "foods.$.refundStatus": data.status, "foods.$.refund_date": date } }, { multi: true });
                            } else if (data.status == 'pending') {
                                await db.UpdateDocument('orders', { _id: { $in: req.body.order_id }, "foods.id": req.body.row.foods.id }, { $set: { "foods.$.status": 18, "foods.$.refundStatus": data.status } }, { multi: true });
                            } else {
                                await db.UpdateDocument('orders', { _id: { $in: req.body.order_id }, "foods.id": req.body.row.foods.id }, { $set: { "foods.$.status": 18, "foods.$.refundStatus": data.status } }, { multi: true });
                            }
                            return res.status(200).send({ status: 1 });
                        } else if (transaction.doc.type === "stripe") {
                            console.log("entered into the refund of stripe payment");
                            let stripechargeid = refundOrder.doc.stripechargeid;
                            let amount = req.body.row.foods.quantity * req.body.row.foods.price;
                            console.log(amount, stripechargeid);
                            let result = await stripe.stripeRefund(stripechargeid, amount);
                            if (result.status === 'succeeded') {
                                await db.UpdateDocument('orders', { _id: { $in: req.body.order_id }, "foods.id": req.body.row.foods.id }, { $set: { "foods.$.status": 18, "foods.$.refundStatus": result.status, "foods.$.refund_date": date } }, { multi: true });
                            }
                            return res.status(200).send({ status: 1 });
                        } else {
                            await db.UpdateDocument('orders', { _id: { $in: req.body.order_id }, "foods.id": req.body.row.foods.id }, { $set: { "foods.$.status": 18, "foods.$.refundStatus": result.status, "foods.$.refund_date": date } }, { multi: true });
                            return res.status(200).send({ status: 1 });
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send({ status: false, message: 'There is something went wrong with the API' });
        }
    }


    function sendMailUser(resdata, status) {
        const value = resdata;
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            if (err) {
                console.log("**sendMailUser settings** admin/order.js", err.message)
            } else {
                db.GetOneDocument('users', { _id: new mongoose.Types.ObjectId(value.user_id) }, {}, {}, (error, userDoc) => {
                    if (error) {
                        console.log("**sendMailUser users** admin/order.js", error.message)
                    } else {
                        if (userDoc) {
                            var emailTemplate;
                            var date;
                            if (status == 3) {
                                emailTemplate = 'accept_order';
                                var formatDate = value && value.order_history ? value.order_history.order_time : new Date();
                                date = moment(new Date(formatDate)).format('MMM Do YYYY')
                                var packed = moment(new Date(formatDate)).format('MMM Do YY');
                                var data = {
                                    order_id: value.order_id,
                                    user_id: userDoc._id
                                }
                                admin_send(data);
                            }
                            if (status == 6) {
                                emailTemplate = 'on_going_order';
                                var formatDate1 = value && value.order_history ? value.order_history.shipped : new Date();
                                var formatDat = value && value.order_history ? value.order_history.packed : new Date();
                                date = moment(new Date(formatDate1)).format('MMMM Do YYYY');
                                var shipped = moment(new Date(formatDate1)).format('MMM Do YY');
                                var packed = moment(new Date(formatDat)).format('MMM Do YY');
                            }
                            if (status == 7) {
                                updateQuantity(value._id);
                                return;
                            }
                            if (status != 7) {
                                var orderid = value.order_id

                                var mailData = {};
                                mailData.template = emailTemplate;
                                mailData.to = value.email || userDoc.email;
                                mailData.html = [];
                                mailData.html.push({ name: 'name', value: userDoc.username || "" });
                                mailData.html.push({ name: 'order_id', value: orderid || "" });
                                mailData.html.push({ name: 'date', value: date || "" });
                                mailData.html.push({ name: 'packed_date', value: packed || "" });
                                mailData.html.push({ name: 'start_date', value: shipped || "" });
                                mailData.html.push({ name: 'delivered_date', value: delivered || "" });
                                mailData.html.push({ name: 'link', value: settings.settings.site_url || "" });
                                mailcontent.sendmail(mailData, function (err, response) { });
                            }
                        }
                    }
                })
            }
        })
    }

    function updateQuantity(id) {
        db.GetOneDocument('orders', { _id: mongoose.Types.ObjectId(id), status: 7 }, { foods: 1 }, {}, (err, doc) => {
            if (err) {
                console.log('Error exception Update Quantity:', err.message);
                return
            } else {
                if (doc && doc.foods && doc.foods.length > 0) {
                    syncEach(doc.foods, (valu, next) => {
                        db.GetOneDocument('food', { _id: mongoose.Types.ObjectId(valu.id) }, { quantity: 1 }, {}, (err, docD) => {
                            if (err) {
                                console.log('Error exception update quantity ++', err.message);
                                next();
                            } else {
                                if (docD && docD.quantity > 0) {
                                    if (valu.size_status == 1) {
                                        var data = docD.quantity_size.filter(e => { e.size == valu.size });
                                        var updatequnty;
                                        if (data && data.length > 0) {
                                            var qunty = data[0].quantity;
                                            var subq = qunty - valu.quantity;
                                            updatequnty = subq > 0 ? subq : 0;
                                        } else {
                                            updatequnty;
                                        }
                                        // 'array1': {'$elemMatch': { 'user':  'testUser1' }}
                                        db.UpdateDocument('food', { _id: mongoose.Types.ObjectId(valu.id), 'quantity_size': { '$elemMatch': { 'size': valu.size } } }, { $set: { "quantity_size.$.quantity": updatequnty } }, {}, (error, resp) => {
                                            console.log("error, resp", error, resp)
                                            if (error) {
                                                console.log("Error exception update quantity --", error.message);
                                                next();
                                            } else {
                                                next();
                                            }
                                        })
                                    } else {
                                        var subq = docD.quantity - valu.quantity;
                                        var quantity = subq > 0 ? subq : 0;
                                        db.UpdateDocument('food', { _id: mongoose.Types.ObjectId(valu.id) }, { $set: { "quantity": quantity } }, {}, (error, resp) => {
                                            console.log("error, resp", error, resp)
                                            if (error) {
                                                console.log("Error exception update quantity --", error.message);
                                                next();
                                            } else {
                                                next();
                                            }
                                        })
                                    }
                                } else {
                                    next();
                                }
                            }
                        })
                    }, (error, response) => {
                        return;
                    })
                }
            }
        })
    }

    function admin_send(value) {
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, generalSettings) {
            var settings = generalSettings.settings;
            if (err || !generalSettings) {
                data.status = 0;
                data.message = 'Configure your website settings';
                res.send(data);
            } else {
                db.GetOneDocument('orders', { 'order_id': value.order_id }, {}, {}, function (err, orders) {

                    if (err || !orders) {
                        data.status = 0;
                        data.message = 'error in orders';
                        res.send(data);
                    } else {
                        db.GetOneDocument('users', { '_id': orders.user_id }, {}, {}, function (err, user) {
                            if (err || !user) {
                                data.status = 0;
                                data.message = 'error in user';
                                res.send(data);
                            } else {
                                db.GetOneDocument('transaction', { '_id': orders.transaction_id }, {}, {}, function (err, transaction) {
                                    if (err || !transaction) {
                                        data.status = 0;
                                        data.message = 'error in transaction';
                                        res.send(data);

                                    } else {
                                        db.GetDocument('emailtemplate', { name: 'print_invoice_order', 'status': { $ne: 0 } }, {}, {}, function (err, template) {
                                            if (err) {
                                                console.log("unable to get emailtemplate.....")
                                            } else {
                                                var deliv_date = orders.order_history.delivered || orders.createdAt;
                                                var order_date = timezone.tz(deliv_date, settings.time_zone).format(settings.date_format);
                                                var order_time = timezone.tz(deliv_date, settings.time_zone).format(settings.time_format);
                                                var mydate = moment(order_date, 'DD/MM/YYYY');

                                                var order_delivery_Date = moment(mydate).format(settings.date_format);
                                                //console.log(order_delivery_Date)
                                                //var order_delivery_Date =  Date(orders.schedule_date).format(settings.date_format);
                                                var order_delivery_Time = order_time;
                                                var totalQty = 0;
                                                var totalMrp = 0;
                                                var totalAmt = 0;
                                                var mrpText = '';
                                                var amtText = '';
                                                // var foodDetails = '<table style="border:1px solid #000000;" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#fff"><tbody><tr style="border-bottom: 1px solid #545454;" bgcolor="#e8e8e8"><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">S:No</p></th><th style="width: 45%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px; text-align: left;">Item</p></th><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Units</p></th><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Qty</p></th><th style="width: 20%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">MRP</p></th><th style="width: 20%; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Total AMT</p></th></tr>';
                                                var foodDetails = '<table style="border:1px solid #000000;" border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#fff"><tbody><tr style="border-bottom: 1px solid #545454;" bgcolor="#e8e8e8"><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">S:No</p></th><th style="width: 45%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px; text-align: left;">Item</p></th><th style="width: 5%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Qty</p></th><th style="width: 20%; border-right: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">MRP</p></th><th colspan="2" style="width: 25%; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 5px 10px;">Total AMT</p></th></tr>';
                                                for (var i = 0; i < orders.foods.length; i++) {
                                                    var PriceText = '';
                                                    var cost = 0.0;
                                                    var costText = '';
                                                    if (orders.foods[i].offer_price > 0) {
                                                        var remaing_price = (parseFloat(orders.foods[i].mprice)).toFixed(2)
                                                        PriceText = '₹ ' + ' ' + parseFloat(orders.foods[i].mprice).toFixed(2);
                                                        cost = (parseFloat(orders.foods[i].quantity * parseFloat(orders.foods[i].mprice))).toFixed(2)
                                                        costText = '₹ ' + ' ' + cost;
                                                        totalMrp = (parseFloat(totalMrp) + parseFloat(orders.foods[i].mprice)).toFixed(2)
                                                        totalAmt = (parseFloat(totalAmt) + parseFloat(cost)).toFixed(2)
                                                    } else {
                                                        PriceText = '₹ ' + ' ' + orders.foods[i].mprice;
                                                        cost = (parseFloat(orders.foods[i].quantity * orders.foods[i].mprice)).toFixed(2)
                                                        costText = '₹ ' + ' ' + cost;
                                                        totalMrp = (parseFloat(totalMrp) + parseFloat(orders.foods[i].mprice)).toFixed(2)
                                                        totalAmt = (parseFloat(totalAmt) + parseFloat(cost)).toFixed(2)
                                                    }
                                                    totalQty = parseInt(totalQty + orders.foods[i].quantity)
                                                    // foodDetails += '<tr bgcolor="#fff"><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + (i + 1) + '</p></td><td style="width: 45%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: left;">' + orders.foods[i].name + '</p></td><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + orders.foods[i].net_quantity + ' ' + orders.foods[i].units + '</p></td><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + orders.foods[i].quantity + '</p></td><td style="width: 20%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + PriceText + '</p></td><td style="width: 10%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + costText + '</p></td></tr>';
                                                    foodDetails += '<tr bgcolor="#fff"><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + (i + 1) + '</p></td><td style="width: 45%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: left;">' + orders.foods[i].name + '</p></td><td style="width: 5%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + orders.foods[i].quantity + '</p></td><td style="width: 20%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + PriceText + '</p></td><td colspan="2" style="width: 10%;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 10px 10px; text-align: center;">' + costText + '</p></td></tr>';
                                                }
                                                grand_total = parseFloat(orders.billings.amount.grand_total).toFixed(2);
                                                mrpText = '₹ ' + ' ' + totalMrp;
                                                amtText = '₹ ' + ' ' + totalAmt;
                                                netamtText = '₹ ' + ' ' + grand_total;
                                                foodDetails += '<tr style="border-bottom: 1px solid #545454;" bgcolor="#e8e8e8"><th style="width: 5%; border-right: 1px solid #545454; border-top: 1px solid #545454; border-bottom: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">&nbsp;</p></th><th style="width: 5%; border-right: 1px solid #545454; border-top: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">' + totalQty + '</p></th><th style="width: 20%; border-right: 1px solid #545454; border-top: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">' + mrpText + '</p></th><th  colspan="2" style="width: 20%; border-top: 1px solid #545454; border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; line-height: 15px; margin: 0px; font-size: 9px; color: #000; font-weight: bold; padding: 10px 0px;">' + amtText + '</p></th></tr>';
                                                var total = '';
                                                if (orders.billings.amount.total > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Total Amount</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.total).toFixed(2)) + '</p></td></tr>';
                                                }
                                                var service_tax = '';
                                                if (orders.billings.amount.service_tax > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Service Tax</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.service_tax).toFixed(2)) + '</p></td></tr>';
                                                }
                                                var delivery_amount = '';
                                                if (orders.billings.amount.food_offer_price > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Offer Discount</p></td><td  colspan="2"style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.food_offer_price).toFixed(2)) + '</p></td></tr>';
                                                }
                                                var package_charge = '';
                                                foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Delivery Charge</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Free</p></td></tr>';
                                                // if (orders.billings.amount.package_charge > 0) {
                                                // }

                                                if (orders.billings.amount.coupon_discount > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Coupon Discount</p></td><td  colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.coupon_discount).toFixed(2)) + '</p></td></tr>';
                                                }

                                                if (orders.billings.amount.grand_total > 0) {
                                                    foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="3"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" ><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Grand Total</p></td><td colspan="2" style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">' + '₹ ' + ' ' + ((orders.billings.amount.grand_total).toFixed(2)) + '</p></td></tr>';
                                                }
                                                // var food_offer_price = '';
                                                // if (orders.billings.amount.food_offer_price > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Food Offer Price</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((orders.billings.amount.food_offer_price).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                // var offer_discount = '';
                                                // if (orders.billings.amount.offer_discount > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Offer Discount</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((orders.billings.amount.offer_discount).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                // var site_commission = '';
                                                // if (printData.site_commission > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Site Commission</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((printData.site_commission).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                // var restaurant_commission = '';
                                                // if (printData.restaurant_commission > 0) {
                                                //     foodDetails += '<tr bgcolor="#fff"><td style="border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">&nbsp;</p></td><td style="border-bottom: 1px solid #545454; border-right: 1px solid #545454;" colspan="2"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">Grand Total</p></td><td style="border-bottom: 1px solid #545454;"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 15px; margin: 0px; color: #404040; padding: 5px 10px; text-align: center;">'+ settings.currency_symbol + ' ' +((printData.restaurant_commission).toFixed(2)) +'</p></td></tr>';
                                                // }
                                                /* foodDetails += '<tr bgcolor="#fff"><td style="border-bottom: 1px solid #545454;" colspan="5"><p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 20px; margin: 0px; color: #404040; padding: 7px 10px; text-align: left;"><span style="font-weight: bold;">Return Policy:</span> Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries</p></td></tr>'; */
                                                foodDetails += '</tbody></table>';

                                                var mailData = {};
                                                mailData.template = template[0].email_content;
                                                mailData.to = orders.email || user.email;
                                                mailData.html = [];
                                                mailData.html.push({ name: 'foodDetails', value: foodDetails || "" });
                                                mailData.html.push({ name: 'site_url', value: settings.site_url || "" });
                                                mailData.html.push({ name: 'site_title', value: settings.site_title || "" });
                                                mailData.html.push({ name: 'symbol', value: settings.currency_symbol || "" });
                                                mailData.html.push({ name: 'logo', value: settings.logo || "" });
                                                mailData.html.push({ name: 'order_id', value: orders.order_id || "" });
                                                mailData.html.push({ name: 'order_date', value: order_date || "" });
                                                mailData.html.push({ name: 'order_delivery_Date', value: order_delivery_Date || "" });
                                                mailData.html.push({ name: 'order_delivery_Time', value: order_delivery_Time || "" });
                                                mailData.html.push({ name: 'username', value: user.username || "" });
                                                mailData.html.push({ name: 'useremail', value: user.email || "" });
                                                mailData.html.push({ name: 'user_phone', value: user.phone.code + ' ' + user.phone.number || "" });
                                                mailData.html.push({ name: 'drop_address', value: orders.delivery_address.fulladres || "" });
                                                mailData.html.push({ name: 'drop_address_state', value: orders.delivery_address.state || "" });
                                                mailData.html.push({ name: 'totalQty', value: totalQty || "" });
                                                mailData.html.push({ name: 'amtText', value: amtText || "" });
                                                mailData.html.push({ name: 'netamtText', value: netamtText || "" });

                                                mailcontent.sendmail(mailData, function (err, response) { });

                                                // var html1 = template[0].email_content;
                                                // html1 = html1.replace(/{{foodDetails}}/g, foodDetails);
                                                // html1 = html1.replace(/{{site_url}}/g, settings.site_url);
                                                // html1 = html1.replace(/{{site_title}}/g, settings.site_title);
                                                // html1 = html1.replace(/{{logo}}/g, settings.site_url + settings.logo);
                                                // html1 = html1.replace(/{{order_id}}/g, orders.order_id);
                                                // html1 = html1.replace(/{{order_date}}/g, order_date);
                                                // html1 = html1.replace(/{{order_delivery_Date}}/g, order_delivery_Date);
                                                // html1 = html1.replace(/{{order_delivery_Time}}/g, order_delivery_Time);
                                                // html1 = html1.replace(/{{username}}/g, user.username);
                                                // html1 = html1.replace(/{{drop_address}}/g, orders.delivery_address.fulladres || ' ');
                                                // html1 = html1.replace(/{{drop_address_state}}/g, orders.delivery_address.state || ' ');
                                                // //html1 = html1.replace(/{{restaurantname}}/g, restaurant.cityname);
                                                // // html1 = html1.replace(/{{pickup_address}}/g, restaurant.address.fulladres || ' ');
                                                // html1 = html1.replace(/{{useremail}}/g, user.email);
                                                // html1 = html1.replace(/{{user_phone}}/g, user.phone.code + ' ' + user.phone.number);
                                                // html1 = html1.replace(/{{symbol}}/g, settings.currency_symbol);
                                                // html1 = html1.replace(/{{totalQty}}/g, totalQty);
                                                // html1 = html1.replace(/{{amtText}}/g, amtText);
                                                // html1 = html1.replace(/{{netamtText}}/g, netamtText);
                                                // var paymenttype = "Pay By Cards, UPI, Wallets, Net Banking";
                                                // html1 = html1.replace(/{{paymenttype}}/g, paymenttype);


                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    router.orderCancel = async (req, res) => {

        try {

            const adminDetails = await db.GetOneDocument('admins', { username: req.body.username }, {}, {});

            if (!adminDetails || !adminDetails.doc) {
                // return res.status(404).json({ error: 'Admin not found' });
                res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
            }


            const storedHash = adminDetails.doc.password;


            const isPasswordValid = bcrypt.compareSync(req.body.password, storedHash);

            if (!isPasswordValid) {
                res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
            }

            else {

                const docdata = await db.UpdateAllDocument('orders', { _id: { $in: req.body.ids } }, { status: 10 }, { multi: true })


                if (docdata.status == false) {
                    res.send({ status: 0, message: err.message });
                } else {
                    res.send({ status: 1, message: 'Cancel Order Successfully' });
                }
            }


        }
        catch (error) {
            res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
        }
    }
    router.orderDelete = async (req, res) => {
        // req.checkBody('ids', 'Invalid ids').notEmpty();
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }


        try {

            const adminDetails = await db.GetOneDocument('admins', { username: req.body.username }, {}, {});

            if (!adminDetails || !adminDetails.doc) {
                // return res.status(404).json({ error: 'Admin not found' });
                res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
            }


            const storedHash = adminDetails.doc.password;


            const isPasswordValid = bcrypt.compareSync(req.body.password, storedHash);

            if (!isPasswordValid) {
                res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
            }

            else {

                const docdata = db.UpdateAllDocument('orders', { _id: { $in: req.body.ids } }, { status: 0 }, { multi: true })

                if (docdata.status == false) {
                    res.send({ status: 0, message: err.message });
                } else {
                    res.send({ status: 1, message: 'Order Deleted Successfully' });
                }
            }


        }
        catch (error) {
            res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
        }



        //     if (err) {
        //         res.send({ status: 0, message: err.message });
        //     } else {
        //         db.DeleteDocument('orders', { _id: { $in: req.body.ids } }, (err, docdata) => { console.log("err, docdata", err, docdata) });
        //         db.DeleteDocument('transaction', { _id: catdata.transaction_id }, (err, docdata) => { console.log("err, docdata", err, docdata) });
        //         res.send({ status: 1, message: 'Deleted Successfully' });
        //     }
        // })
    };



//     router.invoice_number = async (req, res) => {
//         try {
//             const adminDetails = await db.GetOneDocument('orders', { _id: req.body._id }, {}, {});
// console.log(adminDetails, "adminDetailsadminDetailsadminDetails");
// let invoiceNumber;
// if (adminDetails && adminDetails.doc && adminDetails.doc.invoice_number) {
//     invoiceNumber = adminDetails.doc.invoice_number;
//     res.send({ status: 1, data: invoiceNumber });
// } else {
//     let isUnique = false;
//     while (!isUnique) {
//         const newInvoiceNumber = Math.floor(1000 + Math.random() * 9000).toString();
//         const existingInvoice = await db.GetOneDocument('orders', { invoice_number: newInvoiceNumber }, {}, {});
//         if (!existingInvoice) {
//             invoiceNumber = newInvoiceNumber;
//             isUnique = true;
//             await db.UpdateDocument('orders', { _id: req.body._id }, { $set: { invoice_number: invoiceNumber } });
//             res.send({ status: 1, data: invoiceNumber });
//         }
//     }
// }
//         }
//         catch (error) {
//             // res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
//             console.error(error,"Invoice number error")
//         }
//     };

//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&//
router.invoice_number = async (req, res) => {
    try {
        const adminDetails = await db.GetOneDocument('orders', { _id: req.body._id }, {}, {});
console.log(adminDetails, "adminDetailsadminDetailsadminDetails");
let invoiceNumber;
// Check if invoice_number exists and is valid
if (adminDetails && adminDetails.doc && adminDetails.doc.invoice_number) {
invoiceNumber = adminDetails.doc.invoice_number;
res.send({ status: 1, data: invoiceNumber });
} else {
// let isUnique = false;
// while (!isUnique) {
    const newInvoiceNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const existingInvoice = await db.GetOneDocument('orders', { invoice_number: newInvoiceNumber }, {}, {});
    if ((existingInvoice && existingInvoice.doc  == 'Data Not found') || !existingInvoice) {
        invoiceNumber = newInvoiceNumber;
        // isUnique = true;
        await db.UpdateDocument('orders', { _id: req.body._id }, { $set: { invoice_number: invoiceNumber } });
        res.send({ status: 1, data: invoiceNumber });
    }
// }
}
    }
    catch (error) {
        // res.status(404).send({ status: 0, msg: 'Enter valid credentials' });
        console.error(error,"Invoice number error")
    }
};



// router.invoice_number = async (req, res) => {
//     try {
//         const adminDetails = await db.GetOneDocument('orders', { _id: req.body._id }, {}, {});
//         console.log(adminDetails, "adminDetailsadminDetailsadminDetails");

//         let invoiceNumber;

//         // Check if `invoice_number` exists and is valid
//         if (adminDetails && adminDetails.doc && adminDetails.doc.invoice_number) {
//             invoiceNumber = adminDetails.doc.invoice_number;
//         } else {
//             // Get the next invoice number with rollover
//             const counter = await db.FindOneAndUpdate(
//                 'counters',
//                 { _id: 'invoiceNumber' },
//                 {
//                     $inc: { seq: 1 },
//                     $setOnInsert: { seq: 1000 }, // Initialize to 1000 if not exists
//                 },
//                 {
//                     returnDocument: 'after',
//                     upsert: true,
//                 }
//             );

//             // Handle rollover if the sequence exceeds 9999
//             if (counter.value.seq > 9999) {
//                 const resetCounter = await db.FindOneAndUpdate(
//                     'counters',
//                     { _id: 'invoiceNumber' },
//                     { $set: { seq: 1000 } },
//                     { returnDocument: 'after' }
//                 );
//                 invoiceNumber = resetCounter.value.seq;
//             } else {
//                 invoiceNumber = counter.value.seq;
//             }

//             // Save the generated unique invoice number to the database
//             await db.UpdateDocument('orders', { _id: req.body._id }, { $set: { invoice_number: invoiceNumber } });
//         }

//         res.send({ status: 1, data: invoiceNumber });
//     } catch (error) {
//         console.error(error, "Invoice number error");
//         res.status(500).send({ status: 0, msg: 'Error generating invoice number' });
//     }
// };

    
    return router;
}