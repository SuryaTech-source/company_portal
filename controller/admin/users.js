//"use strict";
var db = require('../../controller/adaptor/mongodb.js');
var bcrypt = require('bcrypt-nodejs');
var attachment = require('../../model/attachments.js');
var library = require('../../model/library.js');
var Jimp = require("jimp");
var mongoose = require("mongoose");
var CONFIG = require('../../config/config.js');
var async = require("async");
var moment = require("moment");
var timezone = require('moment-timezone');
var mailcontent = require('../../model/mailcontent.js');
const axios = require('axios');
const cron = require('node-cron');

module.exports = function (io) {

    var router = {};

    router.getusers = function (req, res) {
        db.GetDocument('users', {}, {}, {}, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };
    router.currentUser = function (req, res) {

        db.GetDocument('users', {
            username: req.body.currentUserData
        }, { username: 1, privileges: 1 }, {}, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };
    router.save = async function (req, res) {
        console.log(req.body, 'BODY');
        var data = {
            activity: {}
        };
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }
        var token = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
        var len = 6;

        data.username = (req.body.first_name + req.body.last_name).toLowerCase();
        data.first_name = req.body.first_name;
        data.last_name = req.body.last_name;
        data.name = req.body.name;
        data.gender = req.body.gender;
        data.about = req.body.about;
        data.phone = req.body.phone;
        data.role = req.body.role;
        data.email = req.body.email;
        data.address = req.body.address;
        data.gender = req.body.gender;
        data.status = req.body.status || 1;
        data.role = 'user';
        data.user_type = 'normal';
        data.avatar = req.body.avatar;
        data.emergency_contact = req.body.emergency_contact;
        data.avatarBase64 = req.body.avatarBase64;
        if (data.avatarBase64) {
            var base64 = data.avatarBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            var fileName = Date.now().toString() + '.png';
            var file = CONFIG.DIRECTORY_USERS + fileName;
            library.base64Upload({ file: file, base64: base64[2] }, function (err, response) { });
            data.avatar = attachment.get_attachment(CONFIG.DIRECTORY_USERS, fileName);
            data.img_name = encodeURI(fileName);
            data.img_path = CONFIG.DIRECTORY_USERS.substring(2);
        }
        if (req.body.password_confirm) {
            data.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
        }
        if (req.body._id) {
            const phonedocs = await db.GetDocument('users', { _id: { $ne: req.body._id }, "phone.number": data.phone.number, "phone.code": data.phone.code }, {}, {})
            if (phonedocs.doc.length != 0) {
                res.send({ "status": 0, "message": 'Phone number already exist' });
            } else {
                const emaildocs = await db.GetDocument('users', { _id: { $ne: req.body._id }, "email": data.email }, {}, {})
                console.log(emaildocs, 'emaildocs');
                if (emaildocs.doc.length != 0) {
                    res.send({ "status": 0, "message": 'Email already exist' });
                } else {
                    try {
                        console.log(data, 'data');
                        const userDocdata = await db.UpdateDocument('users', { _id: req.body._id }, { $set: data }, {})
                        console.log(userDocdata, 'userDocdata');
                        if (!userDocdata) {
                            console.log("errdd", err)
                            res.send({ "status": "0", "message": "Something went wrong" });
                        } else {
                            if (userDocdata.doc) {
                                if (req.body.status == 2 || req.body.status == 0) {
                                    io.of('/chat').emit('admin_changed', { user_id: req.body._id });
                                    io.of('/chat').in(req.body._id).emit('r2e_user_logout', { userId: req.body._id, status: req.body.status });
                                }
                                res.send({ "status": 1, "data": data, message: "Successfully Updated" });
                            }
                        }
                    } catch (error) {
                        res.send({ "status": "0", "message": "Something went wrong" });
                        console.log(error);
                    }

                    // db.UpdateDocument('users', { _id: req.body._id }, data, {}, function (err, userDocdata) {
                    //     if (err) {
                    //         console.log("errdd", err)
                    //         res.send({ "status": "0", "message": "Something went wrong" });
                    //     } else {
                    //         if (userDocdata.n) {
                    //             if (req.body.status == 2 || req.body.status == 0) {
                    //                 io.of('/chat').emit('admin_changed', { user_id: req.body._id });
                    //                 io.of('/chat').in(req.body._id).emit('r2e_user_logout', { userId: req.body._id, status: req.body.status });
                    //             }
                    //             res.send({ "status": 1, "data": data, message: "Successfully Updated" });
                    //         }
                    //     }
                    // });
                }
                // db.GetDocument('users', { _id: { $ne: req.body._id }, "email": data.email }, {}, {}, function (err, emaildocs) {
                //     if (emaildocs.length != 0) {
                //         res.send({ "status": 0, "message": 'Email already exist' });
                //     } else {
                //         db.UpdateDocument('users', { _id: req.body._id }, data, {}, function (err, userDocdata) {
                //             if (err) {
                //                 console.log("errdd", err)
                //                 res.send({ "status": "0", "message": "Something went wrong" });
                //             } else {
                //                 if (userDocdata.n) {
                //                     if (req.body.status == 2 || req.body.status == 0) {
                //                         io.of('/chat').emit('admin_changed', { user_id: req.body._id });
                //                         io.of('/chat').in(req.body._id).emit('r2e_user_logout', { userId: req.body._id, status: req.body.status });
                //                     }
                //                     res.send({ "status": 1, "data": data, message: "Successfully Updated" });
                //                 }
                //             }
                //         });
                //     }
                // });
            }
            // db.GetDocument('users', { _id: { $ne: req.body._id }, "phone.number": data.phone.number, "phone.code": data.phone.code }, {}, {}, function (err, phonedocs) {
            //     if (phonedocs.length != 0) {
            //         res.send({ "status": 0, "message": 'Phone number already exist' });
            //     } else {
            //         db.GetDocument('users', { _id: { $ne: req.body._id }, "email": data.email }, {}, {}, function (err, emaildocs) {
            //             if (emaildocs.length != 0) {
            //                 res.send({ "status": 0, "message": 'Email already exist' });
            //             } else {
            //                 db.UpdateDocument('users', { _id: req.body._id }, data, {}, function (err, userDocdata) {
            //                     if (err) {
            //                         console.log("errdd", err)
            //                         res.send({ "status": "0", "message": "Something went wrong" });
            //                     } else {
            //                         if (userDocdata.n) {
            //                             if (req.body.status == 2 || req.body.status == 0) {
            //                                 io.of('/chat').emit('admin_changed', { user_id: req.body._id });
            //                                 io.of('/chat').in(req.body._id).emit('r2e_user_logout', { userId: req.body._id, status: req.body.status });
            //                             }
            //                             res.send({ "status": 1, "data": data, message: "Successfully Updated" });
            //                         }
            //                     }
            //                 });
            //             }
            //         });
            //     }
            // });
        } else {
            data.unique_code = req.body.unique_code;
            if (typeof req.body.unique_code == "undefined" || typeof req.body._id == "undefined") {
                var code = '';
                for (var i = 0; i < len; i++) {
                    var rnum = Math.floor(Math.random() * token.length);
                    code += token.substring(rnum, rnum + 1);
                }
                data.unique_code = code;
            }
            data.activity.created = new Date();
            const phonedocs = await db.GetDocument('users', { "phone.number": data.phone.number, "phone.code": data.phone.code }, {}, {})
            if (phonedocs.doc.length != 0) {
                res.send({ "status": 0, "message": 'Phone number already exists' });
            } else {
                const emaildocs = await db.GetDocument('users', { "email": data.email }, {}, {})
                if (emaildocs.doc.length != 0) { res.send({ "status": 0, "message": 'Email already exists' }); }
                else {
                    const result = await db.InsertDocument('users', data)
                    if (!result) {
                        console.log("err1", err)
                        res.send({ "status": 0, "message": "Something went wrong" });
                    } else {
                        res.send({ "status": 1, "data": result, message: "Successfully Added." });
                    }
                    // db.InsertDocument('users', data, function (err, result) {
                    //     if (err) {
                    //         console.log("err1", err)
                    //         res.send({ "status": 0, "message": "Something went wrong" });
                    //     } else {
                    //         res.send({ "status": 1, "data": result, message: "Successfully Added." });
                    //     }
                    // });
                }
                // db.GetDocument('users', { "email": data.email }, {}, {}, function (err, emaildocs) {
                //     if (emaildocs.length != 0) { res.send({ "status": 0, "message": 'Email already exists' }); }
                //     else {
                //         db.InsertDocument('users', data, function (err, result) {
                //             if (err) {
                //                 console.log("err1", err)
                //                 res.send({ "status": 0, "message": "Something went wrong" });
                //             } else {
                //                 res.send({ "status": 1, "data": result, message: "Successfully Added." });
                //             }
                //         });
                //     }
                // })
            }
            // db.GetDocument('users', { "phone.number": data.phone.number, "phone.code": data.phone.code }, {}, {}, function (err, phonedocs) {
            //     if (phonedocs.length != 0) {
            //         res.send({ "status": 0, "message": 'Phone number already exists' });
            //     } else {
            //         db.GetDocument('users', { "email": data.email }, {}, {}, function (err, emaildocs) {
            //             if (emaildocs.length != 0) { res.send({ "status": 0, "message": 'Email already exists' }); }
            //             else {
            //                 db.InsertDocument('users', data, function (err, result) {
            //                     if (err) {
            //                         console.log("err1", err)
            //                         res.send({ "status": 0, "message": "Something went wrong" });
            //                     } else {
            //                         res.send({ "status": 1, "data": result, message: "Successfully Added." });
            //                     }
            //                 });
            //             }
            //         })
            //     }
            // });
        };
    }

    router.orderAddress = function (req, res) {
        var or_location = {};
        or_location.lng = req.body.data.address.lng;
        or_location.lat = req.body.data.address.lat;
        db.UpdateDocument('users', { _id: req.body.data.id }, { 'order_address': req.body.data.address, 'order_location': or_location }, {}, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    }

    router.getuserdetails = function (req, res) {
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            var getQuery = [{
                "$match": { role: 'user', status: { $in: [1, 2, 3] } }
            },
            {
                $project: {
                    email: 1,
                    username: 1,
                    status: 1,
                    createdAt: 1,

                    "avatar": {
                        $ifNull: ["$avatar", settings.settings.site_url + CONFIG.USER_PROFILE_IMAGE_DEFAULT]
                    }
                }
            }, {
                $project: {
                    document: "$$ROOT"
                }
            },
            {
                $sort: {
                    "document.createdAt": -1
                }
            },
            {
                $limit: 10
            },
            {
                $group: { "_id": "_id", "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
            }

            ];
            db.GetAggregation('users', getQuery, function (err, data) {
                if (err) {
                    res.send(err);
                } else {
                    if (data.length != 0) {
                        res.send(data[0].documentData);
                    } else {
                        res.send([0]);
                    }
                }
            });
        });
    };

    router.getpendinglist = async function (req, res) {
        //  console.log('-------------------------------')
        let err =""
        const shops = await db.GetDocument('restaurant', { status: { $eq: 3 } }, {}, {})
        if (shops.status === false) {
            res.send(err);
        } else {
            const drivers = await db.GetDocument('drivers', { status: { $eq: 3 } }, {}, {})
            if (drivers.status === false) {
                res.send(err);
            } else {
                var aggerationQuery = [
                    { $match: { seen_status: { $eq: 0 }, status: { $eq: 1 } } },
                    { $sort: { createdAt: -1 } }
                ]
                const orders = await db.GetAggregation('orders', aggerationQuery)
                if (!orders) {
                    res.send(err);
                }
                else {
                    res.send([shops, drivers, orders]);
                }
            }
        }
        // db.GetDocument('restaurant', { status: { $eq: 3 } }, {}, {}, function (err, shops) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         db.GetDocument('drivers', { status: { $eq: 3 } }, {}, {}, function (err, drivers) {
        //             if (err) {
        //                 res.send(err);
        //             }
        //             else {
        //                 var aggerationQuery = [
        //                     { $match: { seen_status: { $eq: 0 }, status: { $eq: 1 } } },
        //                     { $sort: { createdAt: -1 } }
        //                 ]
        //                 db.GetAggregation('orders', aggerationQuery, function (err, orders) {
        //                     if (err) {
        //                         res.send(err);
        //                     }
        //                     else {
        //                         res.send([shops, drivers, orders]);
        //                     }
        //                 });
        //             }
        //         });
        //     }
        // });
    };

    router.edit = async function (req, res) {
        var data = { userDetails: {} }
        const resp = await db.GetOneDocument('users', { _id: req.body.id }, { password: 0 }, {})
        if (resp.status === false) {
            res.send({ status: 0, message: err.message });
        } else {
            if (!resp.doc.avatar) {
                resp.doc.avatar = './' + CONFIG.USER_PROFILE_IMAGE_DEFAULT;
            }
            data.userDetails = resp.doc;
            res.send({ status: 1, data: data });
        }
        // db.GetOneDocument('users', { _id: req.body.id }, { password: 0 }, {}, function (err, resp) {
        //     if (err) {
        //         res.send({ status: 0, message: err.message });
        //     } else {
        //         if (!resp.avatar) {
        //             resp.avatar = './' + CONFIG.USER_PROFILE_IMAGE_DEFAULT;
        //         }
        //         data.userDetails = resp;
        //         res.send({ status: 1, data: data });
        //     }
        // });
    };

    router.transactionsList = function (req, res) {
        var data = {};
        data.user_id = req.body.id;
        if (req.body.id != '') {
            db.GetOneDocument('walletReacharge', { user_id: req.body.id }, {}, {}, function (userErr, userRespo) {
                if (userRespo) {

                    var usersQuery = [{
                        "$match": { user_id: new mongoose.Types.ObjectId(req.body.id) }
                    },
                    {
                        $project:
                        {
                            'transactions': 1,
                            'user_id': 1,
                            'total': 1
                        }
                    },
                    {
                        $project: {
                            //title: 1,
                            //type: 1,
                            document: "$$ROOT"
                        }
                    },
                    {
                        $group: { "_id": "$user_id", "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
                    }
                    ];

                    usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
                    usersQuery.push({ $unwind: { path: "$documentData.transactions", preserveNullAndEmptyArrays: true } });

                    //search
                    //  if (req.body.search != '' && req.body.search != 'undefined' && req.body.search) {
                    //    console.log("search",req.body);
                    //   condition['username'] = { $regex: new RegExp('^' + req.body.search, 'i') };
                    //   searchs = req.body.search;
                    //   usersQuery.push({
                    //       "$match": {
                    //           $or: [
                    //               { "documentData.transactions.title": { $regex: searchs + '.*', $options: 'si' } }
                    //           ]
                    //       }
                    //   });
                    //   }

                    //pagination
                    if ((req.body.limit && req.body.skip >= 0) && !req.body.search) {
                        usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });

                    }
                    usersQuery.push({ $group: { "_id": null, "total": { "$sum": "$count" }, "transactions": { $push: "$documentData.transactions" } } });
                    usersQuery.push({ $group: { "_id": null, "count": { "$sum": "$total" }, "documentData": { $push: "$$ROOT" } } });
                    //pagination
                    db.GetAggregation('walletReacharge', usersQuery, function (walletErr, walletRespo) {
                        if (walletErr || walletRespo.length == 0) {
                            res.send({
                                "status": "0",
                                "response": 'Data Not available'
                            });
                        } else {
                            if (walletRespo.length >= 0 && walletRespo[0].documentData[0].transactions) {
                                var total_amount = walletRespo[0].documentData[0].total;
                                var transArr = [];
                                for (var i = 0; i < walletRespo[0].documentData[0].transactions.length; i++) {
                                    var title = '';
                                    var transacData = {};
                                    if (walletRespo[0].documentData[0].transactions[i].type == 'CREDIT') {
                                        if (walletRespo[0].documentData[0].transactions[i].credit_type == 'welcome') {
                                            title = 'Welcome Bonus';
                                        } else if (walletRespo[0].documentData[0].transactions[i].credit_type == 'referral') {
                                            title = 'Referral reward';
                                            if (walletRespo[0].documentData[0].transactions[i].ref_id != null) {
                                                title = 'Wallet Recharge';
                                            }
                                        } else {
                                            title = 'Wallet Recharge';
                                        }
                                    } else if (walletRespo[0].documentData[0].transactions[i].type == 'DEBIT') {
                                        //title = 'Booking for #' + walletRespo[0].documentData[0].transactions[i].ref_id;
                                        title = 'Payment by wallet';
                                    }
                                    transacData.type = walletRespo[0].documentData[0].transactions[i].type || '';
                                    transacData.trans_amount = walletRespo[0].documentData[0].transactions[i].trans_amount || 0;
                                    transacData.title = title;
                                    transacData.trans_date = new Date(walletRespo[0].documentData[0].transactions[i].trans_date);
                                    transacData.balance_amount = walletRespo[0].documentData[0].transactions[i].avail_amount;
                                    transArr.push(transacData);
                                }

                                db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
                                    if (err || !settings) {
                                        res.send({
                                            "status": 0,
                                            "message": 'Please check the email and try again'
                                        });
                                    } else {
                                        res.send({
                                            "status": "1",
                                            "response": { 'currency': settings.settings.currency_code, 'total_amount': parseInt(total_amount), 'total_transaction': walletRespo[0].documentData[0].transactions.length, 'trans': transArr, 'count': userRespo.transactions.length }
                                        })
                                    }
                                });
                            }
                        }
                    });
                } else {
                    res.send({
                        "status": "0",
                        "message": "Invalid User"
                    });
                }
            });
        }
    };

    router.allUsers = async function getusers(req, res) {

        // var errors = req.validationErrors();
        var query = {};
        if (req.body.status == 0) {
            query = { status: { $ne: 0 } };
        }
        else if (req.body.status == 4) {
            query = { status: { $eq: 0 } };
        } else {
            query = { status: { $eq: req.body.status } };
        }

        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }
        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }

        var usersQuery = [{
            "$match": query
        }, {
            $project: {
                createdAt: 1,
                updatedAt: 1,
                first_name: 1,
                username: 1,
                sort_username: { $toLower: "$username" },
                last_name: 1,
                phone: 1,
                address: 1,
                gender: 1,
                role: 1,
                status: 1,
                flag: 1,
                email: 1,
                dname: { $toLower: '$' + sorted },
                activity: 1
            }
        }, {
            $project: {
                username: 1,
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }];


        var condition = { status: { $ne: 0 } };
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

        if (req.body.search) {
            var searchs = req.body.search;
            usersQuery.push({ "$match": { $or: [{ "documentData.sort_username": { $regex: searchs + '.*', $options: 'si' } }, { "documentData.address.city": { $regex: searchs + '.*', $options: 'si' } }, { "documentData.phone.number": { $regex: searchs + '.*', $options: 'si' } }, { "documentData.phone.code": { $regex: searchs + '.*', $options: 'si' } }, { "documentData.last_name": { $regex: searchs + '.*', $options: 'si' } }, { "documentData.email": { $regex: searchs + '.*', $options: 'si' } }] } });
            //search limit
            usersQuery.push({ $group: { "_id": null, "countvalue": { "$sum": 1 }, "documentData": { $push: "$documentData" } } });
            usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
            if (req.body.limit && req.body.skip >= 0) {
                usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
            }
            usersQuery.push({ $group: { "_id": null, "count": { "$first": "$countvalue" }, "documentData": { $push: "$documentData" } } });
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
        try {
            console.log();
            const docData = await db.GetAggregation('users', usersQuery)
            console.log(docData[0]?.documentData || [], 'what is in the docdata');
            if (!docData) {
                res.send({ err: 1 });
            } else {
                var count = {};
                const [allValue, activeValue, deactivateValue, deletedUsers] = await Promise.all([
                    db.GetCount('users', { status: { $in: [1, 2] } }),
                    db.GetCount('users', { status: { $eq: 1 } }),
                    db.GetCount('users', { status: { $eq: 2 } }),
                    db.GetCount('users', { status: { $eq: 0 } }),
                ]);
                const totalCount = {
                    allValue,
                    activeValue,
                    deactivateValue,
                    deletedUsers,
                };
                console.log(totalCount, 'this is the total count');
                console.log(docData, 'docDatadocData');

                if (docData.length == 0) {
                    res.send([[], 0, totalCount]);
                } else {
                    res.send([docData[0]?.documentData || [], docData[0]?.count || 0, totalCount]);
                }
                // const allValue=await db.GetCount('users', { status: { $in: [1, 2] } })
                // const activeValue= await db.GetCount('users', { status: { $eq: 1 } })
                // const deactivateValue= await db.GetCount('users', { status: { $eq: 2 } })
                // const deletedUsers= await db.GetCount('users', { status: { $eq: 0 } })
                // Promise.all([allValue, activeValue, deactivateValue, deletedUsers])
                // async.parallel([
                //     //All user
                //     function (callback) {
                //         db.GetCount('users', { status: { $in: [1, 2] } }, function (err, allValue) {
                //             if (err) return callback(err);
                //             count.allValue = allValue;

                //             callback();
                //         });
                //     },
                //     //Active user
                //     function (callback) {
                //         db.GetCount('users', { status: { $eq: 1 } }, function (err, activeValue) {
                //             if (err) return callback(err);
                //             count.activeValue = activeValue;

                //             callback();
                //         });
                //     },
                //     //Deactive user
                //     function (callback) {
                //         db.GetCount('users', { status: { $eq: 2 } }, function (err, deactivateValue) {
                //             if (err) return callback(err);
                //             count.deactivateValue = deactivateValue;
                //             callback();
                //         });
                //     },
                //     //Deleted user
                //     function (callback) {
                //         db.GetCount('users', { status: { $eq: 0 } }, function (err, deletedUsers) {
                //             if (err) return callback(err);
                //             count.deletedUsers = deletedUsers;

                //             callback();
                //         });
                //     },

                // ], function (err) {
                //     if (err) return next(err);
                //     var totalCount = count;
                //     if (err || docdata.length <= 0) {
                //         res.send([[], 0, totalCount]);
                //     } else {
                //         res.send([docdata[0].documentData, docdata[0].count, totalCount]);
                //         //  console.log(docdata[0].count)
                //     }
                // });
            }
            // db.GetAggregation('users', usersQuery, function (err, docdata) {
            //     if (err) {
            //         res.send(err);
            //     } else {
            //         var count = {};
            //         async.parallel([
            //             //All user
            //             function (callback) {
            //                 db.GetCount('users', { status: { $in: [1, 2] } }, function (err, allValue) {
            //                     if (err) return callback(err);
            //                     count.allValue = allValue;

            //                     callback();
            //                 });
            //             },
            //             //Active user
            //             function (callback) {
            //                 db.GetCount('users', { status: { $eq: 1 } }, function (err, activeValue) {
            //                     if (err) return callback(err);
            //                     count.activeValue = activeValue;

            //                     callback();
            //                 });
            //             },
            //             //Deactive user
            //             function (callback) {
            //                 db.GetCount('users', { status: { $eq: 2 } }, function (err, deactivateValue) {
            //                     if (err) return callback(err);
            //                     count.deactivateValue = deactivateValue;
            //                     callback();
            //                 });
            //             },
            //             //Deleted user
            //             function (callback) {
            //                 db.GetCount('users', { status: { $eq: 0 } }, function (err, deletedUsers) {
            //                     if (err) return callback(err);
            //                     count.deletedUsers = deletedUsers;

            //                     callback();
            //                 });
            //             },

            //         ], function (err) {
            //             if (err) return next(err);
            //             var totalCount = count;
            //             if (err || docdata.length <= 0) {
            //                 res.send([[], 0, totalCount]);
            //             } else {
            //                 res.send([docdata[0].documentData, docdata[0].count, totalCount]);
            //                 //  console.log(docdata[0].count)
            //             }
            //         });
            //     }
            // });
        } catch (e) {
            // console.log(e)
        }
    };

    router.userExport = async function exportUsers(req, res, next) {
        let query = {};

        // Apply the filtering based on request body (similar to allUsers)
        if (req.body.status == 0) {
            query = { status: { $ne: 0 } };
        } else if (req.body.status == 4) {
            query = { status: { $eq: 0 } };
        } else {
            query = { status: { $eq: req.body.status } };
        }

        const usersQuery = [{
            "$match": query
        }, {
            $project: {
                Name: { $concat: ["$first_name", " ", "$last_name"] }, // Concatenating first_name and last_name
                email: 1,
                'phone': 1,  // Assuming phone is stored as a nested field
                status: 1
            }
        }];

        // Apply sorting logic
        let sorting = {};
        if (req.body.sort) {
            const sorter = req.body.sort.field;
            sorting[sorter] = req.body.sort.order;
        } else {
            sorting["createdAt"] = -1;
        }
        usersQuery.push({ $sort: sorting });

        try {
            // Fetch the user data
            const userList = await db.GetAggregation('users', usersQuery);
            console.log(userList);


            const formatteduserList = userList.map(user => ({
                ...user,
                status: user.status === 1 ? 'Active' : user.status === 2 ? 'Inactive' : '',
            }));
            // Prepare CSV fields
            const fields = [
                { label: 'Name', value: 'Name' },  // Concatenated name
                { label: 'Email', value: 'email' },
                { label: 'Phone', value: 'phone.number' },  // Assuming phone is an object with a number field
                { label: 'Status', value: 'status' }
            ];

            // Pass the data and fields to the CSV export middleware
            req.fields = fields;
            req.data = formatteduserList;
            next();  // Move to CSV middleware

        } catch (err) {
            console.error("Error exporting user list:", err);
            res.status(500).send("Error exporting user list");
        }
    };





    router.subscribeUsers = async (req, res) => {

        // var errors = req.validationErrors();
        var query = {};
        query = { status: { $eq: 1 } };


        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }
        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }

        var usersQuery = [{
            "$match": query
        }, {
            $project: {
                createdAt: 1,
                updatedAt: 1,
                email: 1,
                status: 1
            }
        }, {
            $project: {
                email: 1,
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }];


        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });


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
        if (req.body.search) {
            var searchs = req.body.search;
            usersQuery.push({ "$match": { $or: [{ "documentData.email": { $regex: searchs + '.*', $options: 'si' } }] } });
            //search limit
            usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });


        }
        usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });

        try {
            const docdata = await db.GetAggregation('subscribe', usersQuery)
            if (!docdata) {
                res.send({ status: 0, message: err.message });
            } else {
                var totalCount = docdata[0].count;
                if (docdata.length <= 0) {
                    return res.send({ status: 1, data: [], count: 0, total: totalCount });
                } else {
                    return res.send({ status: 1, data: docdata[0].documentData, count: docdata[0].count, total: totalCount });
                }
            }
            // db.GetAggregation('subscribe', usersQuery, function (err, docdata) {
            //     if (err) {
            //         res.send({ status: 0, message: err.message });
            //     } else {
            //         var totalCount = docdata[0].count;
            //         if (err || docdata.length <= 0) {
            //             return res.send({ status: 1, data: [], count: 0, total: totalCount });
            //         } else {
            //             return res.send({ status: 1, data: docdata[0].documentData, count: docdata[0].count, total: totalCount });
            //         }
            //     }
            // });
        } catch (e) {
            console.log("++++++++++++++++++", e.message)
        }
    };

    router.subscribe_Data = async (req, res) => {
        try {

            const { email } = req.body;
            // const data = {
            // 	email
            // }

            const subscribeData = await db.InsertDocument('subscribe', { email })

            // const contactData = await contact.insertOne({email ,name,message},{});

            if (!subscribeData) {
                return res.send({ status: 0, message: 'something went wrong' });
            } else {
                return res.send({ status: 1, message: 'Subscribe Successfully' });

            }

        } catch (error) {
            console.error(error.message);
            // return res.send({status:1,message:'Message Added Successfully'});

        }
    }

    router.deleteSubscribe = async (req, res) => {
        try {
            const { ids, username, password, forcedelete, tabledelete } = req.body;

            // Check if ids is an array and not empty
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.send({ status: 0, message: 'No IDs provided' });
            }

            // Perform the deletion
            const deletePromises = ids.map(id => db.DeleteDocument('subscribe', { _id: id }));
            const results = await Promise.all(deletePromises);

            // Check if all deletions were successful
            const allDeleted = results.every(result => result);

            if (allDeleted) {
                return res.send({ status: 1, message: 'All subscriptions deleted successfully' });
            } else {
                return res.send({ status: 0, message: 'Some subscriptions could not be deleted' });
            }
        } catch (error) {
            console.error(error.message);
            return res.send({ status: 0, message: 'An error occurred while deleting subscriptions' });
        }
    };


    router.unsubscribe = async (req, res) => {
        try {
            // Extract email from the query parameters
            const { email } = req.query;
    
            // Validate the email input
            if (!email) {
                return res.send({ status: 0, message: 'Email is required for unsubscription' });
            }
    
            // Decode the email in case it's URL encoded (e.g., %40 for @)
            const decodedEmail = decodeURIComponent(email);
    
            // Check if the email exists in the database
            const subscriber = await db.GetDocument('subscribe', { email: decodedEmail },{},{});
    
            if (!Array.isArray(subscriber.doc)) {
                return res.send({ status: 0, message: 'No subscriber found with this email' });
            }
    
            // Perform the deletion of the subscriber
            const deleteResult = await db.DeleteDocument('subscribe', { email: decodedEmail });
    
            if (deleteResult) {
                return res.send({ status: 1, message: 'Subscription successfully deleted' });
            } else {
                return res.send({ status: 0, message: 'Failed to delete the subscription' });
            }
        } catch (error) {
            console.error('Error unsubscribing:', error.message);
            return res.send({ status: 0, message: 'An error occurred while unsubscribing the email' });
        }
    };
    


    router.deletuserdata = function (req, res) {
        db.UpdateDocument('users', { '_id': req.body.data }, { 'status': 0 }, {}, function (err, data) {
            if (err) {
                res.send(err);
            } else {
                res.send(data);
            }
        });
    };
    // router.getalltransactions = function getalltransactions(req, res) {


    //     var errors = req.validationErrors();
    //     if (errors) {
    //         res.send(errors, 400);
    //         return;
    //     }

    //     if (req.body.sort) {
    //         var sorted = req.body.sort.field;
    //     }


    //     var usersQuery = [{
    //         "$match": { status: { $ne: 0 }, "role": "user" }
    //     }, {
    //             $project: {
    //                 createdAt: 1,
    //                 updatedAt: 1,
    //                 username: 1,
    //                 role: 1,
    //                 email: 1,
    //                 dname: { $toLower: '$' + sorted },
    //                 activity: 1
    //             }
    //         }, {
    //             $project: {
    //                 username: 1,
    //                 document: "$$ROOT"
    //             }
    //         }, {
    //             $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
    //         }];


    //     var condition = { status: { $ne: 0 } };
    //     usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

    //     if (req.body.search) {
    //         condition['username'] = { $regex: new RegExp('^' + req.body.search, 'i') };
    //         var searchs = req.body.search;
    //         usersQuery.push({ "$match": { "documentData.username": { $regex: searchs + '.*', $options: 'si' } } });
    //     }

    //     var sorting = {};
    //     if (req.body.sort) {
    //         var sorter = 'documentData.' + req.body.sort.field;
    //         sorting[sorter] = req.body.sort.order;
    //         usersQuery.push({ $sort: sorting });
    //     } else {
    //         sorting["documentData.createdAt"] = -1;
    //         usersQuery.push({ $sort: sorting });
    //     }

    //     if ((req.body.limit && req.body.skip >= 0) && !req.body.search) {
    //         usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
    //     }
    //     usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });

    //     db.GetAggregation('users', usersQuery, function (err, docdata) {
    //         /*if (err || docdata.length <= 0) {
    //             res.send([0, 0]);
    //         } else {

    //             res.send([docdata[0].documentData, docdata[0].count]);
    //         }*/
    //         if (err) {
    //             res.send(err);
    //         } else {

    //             if (docdata.length != 0) {
    //                 res.send([docdata[0].documentData, docdata[0].count]);
    //             } else {
    //                 res.send([0, 0]);
    //             }
    //         }
    //     });
    // };



    router.recentUser = function recentuser(req, res) {
        // console.log('----user--->>',req.query)
        var errors = req.validationErrors();
        if (errors) {
            res.send(errors, 400);
            return;
        }

        if (req.query.sort != "") {
            var sorted = req.query.sort;
        }


        var usersQuery = [{
            "$match": { status: { $ne: 0 }, "role": "user" }
        }, {
            $project: {
                username: 1,
                role: 1,
                email: 1,
                createdAt: 1,
                dname: { $toLower: '$' + sorted }
            }
        }, {
            $project: {
                username: 1,
                document: "$$ROOT"
            }
        }, {
            $sort: {
                createdAt: -1
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }];

        var sorting = {};
        var searchs = '';

        var condition = { status: { $ne: 0 } };

        if (Object.keys(req.query).length != 0) {
            usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

            if (req.query.search != '' && req.query.search != 'undefined' && req.query.search) {
                condition['username'] = { $regex: new RegExp('^' + req.query.search, 'i') };
                searchs = req.query.search;
                usersQuery.push({ "$match": { "documentData.username": { $regex: searchs + '.*', $options: 'si' } } });
            }
            if (req.query.sort !== '' && req.query.sort) {
                sorting = {};
                if (req.query.status == 'false') {
                    sorting["documentData.dname"] = -1;
                    usersQuery.push({ $sort: sorting });
                } else {
                    sorting["documentData.dname"] = 1;
                    usersQuery.push({ $sort: sorting });
                }
            }
            if (req.query.limit != 'undefined' && req.query.skip != 'undefined') {
                usersQuery.push({ '$skip': parseInt(req.query.skip) }, { '$limit': parseInt(req.query.limit) });
            }
            usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
        }

        db.GetAggregation('users', usersQuery, function (err, docdata) {
            if (err && docdata.length > 0) {
                res.send([0, 0]);
            } else {
                res.send([docdata[0].documentData, docdata[0].count]);
            }
        });
    };

    router.delete = async function (req, res) {
        // req.checkBody('ids', 'Invalid ids').notEmpty();
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }
        const docdata = await db.UpdateAllDocument('users', { _id: { $in: req.body.ids } }, { status: 0 }, { multi: true })
        if (!docdata) {
            res.send({ status: 0, message: err.message });
        } else {
            if (typeof req.body.ids == 'object') {
                for (var i = 0; i < req.body.ids.length; i++) {
                    io.of('/chat').emit('admin_changed', { user_id: req.body.ids[i], status: 0 });
                    io.of('/chat').in(req.body.ids[i]).emit('r2e_user_logout', { userId: req.body.ids[i], status: 0 });
                }
            } else {
                io.of('/chat').emit('admin_changed', { user_id: req.body.ids, status: 0 });
                io.of('/chat').in(req.body.ids).emit('r2e_user_logout', { userId: req.body.ids, status: 0 });
            }
            res.send({ status: 1, message: 'Successfully Deleted' });
        }
    };

    router.permanentdelete = async function (req, res) {
        // req.checkBody('ids', 'Invalid ids').notEmpty();
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }
        const delet = await db.DeleteDocument('users', { _id: { $in: req.body.ids } })
        if (delet.status === false) {
            res.send({ status: 0, message: err.message });
        } else {
            res.send({ status: 1, message: 'Successfully Deleted' });
        }
        // db.DeleteDocument('users', { _id: { $in: req.body.ids } }, function (err, docdata) {
        //     if (err) {
        //         res.send({ status: 0, message: err.message });
        //     } else {

        //         res.send({ status: 1, message: 'Successfully Deleted' });
        //     }
        // });
    };
    router.walletAmount = function (req, res) {
        db.GetDocument('walletReacharge', { user_id: req.body.data }, {}, {}, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };

    router.addaddress = function addaddress(req, res) {

        var order_address = {
            'line1': req.body.data.editaddressdata.line1 || "",
            'street': req.body.data.editaddressdata.street || "",
            'landmark': req.body.data.editaddressdata.landmark || "",
            'status': req.body.data.editaddressdata.status || 1,
            'choose_location': req.body.data.editaddressdata.choose_location || ""
        };
        order_address.user_id = req.body.userid;
        if (req.body.data.addressList.location.lng && req.body.data.addressList.location.lat) {
            order_address.loc = {};
            order_address.loc.lng = req.body.data.addressList.location.lng;
            order_address.loc.lat = req.body.data.addressList.location.lat;
        }

        if (req.body.data.editaddressdata._id) {
            db.GetOneDocument('order_address', { user_id: req.body.userid, '_id': { $ne: req.body.data.editaddressdata._id }, status: { $eq: 1 } }, {}, {}, function (err, detail) {
                if (typeof detail != 'undefined' && detail != 'null' && detail != null && (typeof detail.choose_location != 'undefined' && detail.choose_location != null && detail.choose_location != 'null') && detail.choose_location == order_address.choose_location) {
                    res.status(400).send({ message: "Address Type exists" });
                } else {
                    db.UpdateDocument('order_address', { '_id': req.body.data.editaddressdata._id, user_id: req.body.userid }, order_address, {}, function (err, docdatas) {
                        if (err) { res.send(err) }
                        else {
                            res.send(docdatas)
                        }
                    });
                }
            });
        } else {
            db.GetDocument('order_address', { user_id: req.body.userid, status: { $eq: 1 } }, {}, {}, function (err, docdata) {
                if (docdata.length <= 6) {
                    db.InsertDocument('order_address', order_address, function (err, result) {
                        if (err) {
                            res.send(err)
                        } else {
                            res.send(result)
                        }
                    });
                } else {
                    res.status(400).send({ message: "You can add only six address" });
                }
            });
        }
    };

    router.UserAddress = function (req, res) {
        db.GetDocument('order_address', { user_id: req.body.id, status: { $eq: 1 } }, {}, {}, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };

    router.addressStatus = function (req, res) {
        db.UpdateDocument('order_address', { user_id: req.body.id, status: { $eq: 1 } }, { "status": 1 }, { multi: true }, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                db.UpdateDocument('order_address', { user_id: req.body.id, '_id': req.body.add_id }, { "status": 3 }, {}, function (err, docdata) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.send(docdata);
                    }
                });
            }
        });
    };

    router.deleteUserAddress = function (req, res) {
        db.DeleteDocument('order_address', { '_id': req.body.add_id }, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };

    router.getdeletedusers = function getdeletedusers(req, res) {
        var errors = req.validationErrors();
        var query = {};
        if (errors) {
            res.send(errors, 400);
            return;
        }
        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }
        var usersQuery = [{
            "$match": { status: { $eq: 0 }, "role": "user" }
        }, {
            $project: {
                createdAt: 1,
                updatedAt: 1,
                username: 1,
                sort_name: { $toLower: "$username" },
                address: 1,
                last_name: 1,
                phone: 1,
                role: 1,
                status: 1,
                email: 1,
                dname: { $toLower: '$' + sorted },
                activity: 1
            }
        }, {
            $project: {
                username: 1,
                document: "$$ROOT"
            }
        }, {
            $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        }];
        var condition = { status: { $eq: 0 } };
        usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

        if (req.body.search) {
            condition['username'] = { $regex: new RegExp('^' + req.body.search, 'i') };
            var searchs = req.body.search;
            usersQuery.push({ "$match": { $or: [{ "documentData.username": { $regex: searchs + '.*', $options: 'si' } }, { "documentData.email": { $regex: searchs + '.*', $options: 'si' } }] } });
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
        db.GetAggregation('users', usersQuery, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                var count = {};
                async.parallel([
                    //All Deleted user
                    function (callback) {
                        db.GetCount('users', { status: { $eq: 0 } }, function (err, allValue) {
                            if (err) return callback(err);
                            count.allValue = allValue;
                            callback();
                        });
                    }
                ], function (err) {
                    if (err) return next(err);
                    var totalCount = count;
                    if (err || docdata.length <= 0) {
                        res.send([0, 0]);
                    } else {
                        res.send([docdata[0].documentData, docdata[0].count, totalCount]);
                    }
                });
            }
        });
    };

    router.treeCategories = function (req, res) {
        var categoryQuery = [
            { "$match": { "status": { "$ne": 0 } } },
            { "$project": { 'parent': 1, 'name': 1, '_id': 1, 'position': 1 } },
            { $group: { '_id': "$_id", 'parent': { $first: "$parent" }, 'position': { $first: "$position" }, 'label': { $first: "$name" } } },
        ];
        db.GetAggregation('category', categoryQuery, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    }

    router.getdriverStatisticsData = function getdriverStatisticsData(req, res) {
        if (req.body.main_city) {
            var citycondition = [
                { "$match": { 'cityname': req.body.main_city, 'status': { $eq: 1 } } },
                {
                    $project: {
                        cityname: 1,
                        count: { $literal: 0 },
                    }
                },
            ];

            db.GetAggregation('city', citycondition, function (err, cityDetails) {
                var each = require('async-each-series');
                if (cityDetails && typeof cityDetails != 'undefined' && cityDetails.length > 0) {
                    var index = -1;
                    each(cityDetails, function (city, next) {
                        var condition = [
                            { "$match": { "status": { "$eq": 1 }, main_city: city.cityname, currentStatus: 1 } },
                            {
                                "$group": {
                                    "_id": null,
                                    "count": { $sum: 1 },
                                }
                            },
                        ];
                        index = index + 1;
                        db.GetAggregation('drivers', condition, function (err, orderchart) {
                            if (err || !orderchart) {
                                next()
                            } else {
                                if (orderchart.length > 0) {
                                    cityDetails[index].count = orderchart[0].count;
                                    next()
                                } else {
                                    cityDetails[index].count = 0;
                                    next()
                                }
                            }
                        });
                    }, function (err) {
                        var dataset = [];
                        for (i in cityDetails) {
                            dataset.push({ 'label': cityDetails[i].cityname, 'count': cityDetails[i].count, 'data': cityDetails[i].count })
                        }
                        res.send(dataset);
                    })
                } else {
                    res.send([]);
                }
            });
        }
        else {
            var citycondition = [
                { "$match": { 'status': { $eq: 1 } } },
                {
                    $project: {
                        cityname: 1,
                        count: { $literal: 0 },
                    }
                },
            ];
            db.GetAggregation('city', citycondition, function (err, cityDetails) {
                var each = require('async-each-series');
                if (cityDetails && typeof cityDetails != 'undefined' && cityDetails.length > 0) {
                    var index = -1;
                    each(cityDetails, function (city, next) {
                        var condition = [
                            { "$match": { "status": { "$eq": 1 }, main_city: city.cityname, currentStatus: 1 } },
                            {
                                "$group": {
                                    "_id": null,
                                    "count": { $sum: 1 },
                                }
                            },
                        ];
                        index = index + 1;
                        db.GetAggregation('drivers', condition, function (err, orderchart) {
                            if (err || !orderchart) {
                                next()
                            } else {
                                if (orderchart.length > 0) {
                                    cityDetails[index].count = orderchart[0].count;
                                    next()
                                } else {
                                    cityDetails[index].count = 0;
                                    next()
                                }
                            }
                        });
                    }, function (err) {
                        var dataset = [];
                        for (i in cityDetails) {
                            dataset.push({ 'count': cityDetails[i].count, 'label': cityDetails[i].cityname, 'data': cityDetails[i].count })
                        }
                        res.send(dataset);
                    })
                } else {
                    res.send([]);
                }
            });
        }
    }

    router.getStatisticsData = function getStatisticsData(req, res) {

        var currdate = moment(Date.now()).format('MM/DD/YYYY');
        var t1 = currdate + ' 00:00:00';
        var t2 = currdate + ' 23:59:59';

        if (req.body.main_city && !req.body.sub_city) {
            var citycondition = [
                { "$match": { 'status': { $eq: 1 }, cityname: req.body.main_city } },
                {
                    $project: {
                        area_management: 1,
                        count: { $literal: 0 },
                        amount: { $literal: 0 },
                    }
                },
            ];
            db.GetAggregation('city', citycondition, function (err, cityDetails) {
                var each = require('async-each-series');
                if (cityDetails[0].area_management && typeof cityDetails[0].area_management != 'undefined' && cityDetails[0].area_management.length > 0) {
                    var index = -1;
                    each(cityDetails[0].area_management, function (city, next) {
                        var condition = [
                            { "$match": { "order_history.order_time": { '$gte': new Date(t1), '$lte': new Date(t2) }, "status": { "$eq": 7 }, sub_city: city.area_name } },
                            {
                                "$group": {
                                    "_id": null,
                                    "amount": { "$sum": "$billings.amount.admin_commission" },
                                    "count": { $sum: 1 },
                                }
                            },
                        ];
                        index = index + 1;
                        db.GetAggregation('orders', condition, function (err, orderchart) {
                            if (err || !orderchart) {
                                next()
                            } else {
                                if (orderchart.length > 0) {
                                    cityDetails[0].area_management[index].status = orderchart[0].count;
                                    cityDetails[0].area_management[index].amount = orderchart[0].amount;
                                    next()
                                } else {
                                    cityDetails[0].area_management[index].status = 0;
                                    cityDetails[0].area_management[index].amount = 0;
                                    next()
                                }
                            }
                        });

                    }, function (err) {
                        var dataset = [];
                        for (i in cityDetails[0].area_management) {
                            dataset.push({ 'count': cityDetails[0].area_management[i].status, 'amount': cityDetails[0].area_management[i].amount, 'label': cityDetails[0].area_management[i].area_name, 'data': cityDetails[0].area_management[i].status })
                        }
                        res.send(dataset);
                    })
                } else {
                    res.send([]);
                }
            });
        } else if (req.body.main_city && req.body.sub_city) {
            var condition = [
                { "$match": { "order_history.order_time": { '$gte': new Date(t1), '$lte': new Date(t2) }, "status": { "$eq": 7 }, main_city: req.body.main_city, sub_city: req.body.sub_city } },
                {
                    "$group": {
                        "_id": null,
                        "amount": { "$sum": "$billings.amount.admin_commission" },
                        "count": { $sum: 1 },

                    }
                },
            ];
            db.GetAggregation('orders', condition, function (err, orderchart) {
                if (err || !orderchart) {
                    res.send([]);
                } else {
                    respo = {};
                    respo.data = 0;
                    respo.amount = 0;
                    if (orderchart.length > 0) {
                        respo.data = orderchart[0].count;
                        respo.amount = orderchart[0].amount;
                    }
                    respo.label = req.body.sub_city;
                    respo.count = respo.data;
                    res.send([respo]);
                }
            });
        } else {
            var citycondition = [
                { "$match": { 'status': { $eq: 1 } } },
                {
                    $project: {
                        cityname: 1,
                        count: { $literal: 0 },
                        amount: { $literal: 0 },
                    }
                },
            ];
            db.GetAggregation('city', citycondition, function (err, cityDetails) {
                var each = require('async-each-series');
                if (cityDetails && typeof cityDetails != 'undefined' && cityDetails.length > 0) {
                    var index = -1;
                    each(cityDetails, function (city, next) {
                        var condition = [
                            { "$match": { "order_history.order_time": { '$gte': new Date(t1), '$lte': new Date(t2) }, "status": { "$eq": 7 }, main_city: city.cityname } },
                            {
                                "$group": {
                                    "_id": null,
                                    "amount": { "$sum": "$billings.amount.admin_commission" },
                                    "count": { $sum: 1 },
                                }
                            },
                        ];
                        index = index + 1;
                        db.GetAggregation('orders', condition, function (err, orderchart) {

                            if (err || !orderchart) {
                                next()
                            } else {
                                if (orderchart.length > 0) {
                                    cityDetails[index].count = orderchart[0].count;
                                    cityDetails[index].amount = orderchart[0].amount;
                                    next()
                                } else {
                                    cityDetails[index].count = 0;
                                    cityDetails[index].amount = 0;
                                    next()
                                }
                            }
                        });
                    }, function (err) {
                        var dataset = [];
                        //console.log('cityDetails', cityDetails)
                        for (i in cityDetails) {
                            dataset.push({ 'count': cityDetails[i].count, 'amount': cityDetails[i].amount, 'label': cityDetails[i].cityname, 'data': cityDetails[i].count })
                        }
                        res.send(dataset);
                    })
                } else {
                    res.send([]);
                }
            });
        }
    }

    router.beforeFilter = function beforeFilter(req, res) {
        var request = {};
        request.type = req.body.type || 'all';
        request.lng = req.body.lng;
        request.lat = req.body.lat;
        request.radius = parseInt(req.body.radius);
        request.availability = [0, 1];
        if (req.body.onoff) {
            request.availability = [parseInt(req.body.onoff)];
        }
        var current_time = Date.now();
        var thirty_sec_section = 45 * 1000;
        var before_thirty_sec = current_time - thirty_sec_section;
        var usercondition = [
            {
                "$geoNear": {
                    near: { type: "Point", coordinates: [parseFloat(request.lng), parseFloat(request.lat)] },
                    distanceField: "distance",
                    includeLocs: "location",
                    query: {
                        "status": 1
                    },
                    distanceMultiplier: 0.001,
                    spherical: true
                }
            },
            {
                "$redact": {
                    "$cond": {
                        "if": { "$lte": ["$distance", request.radius] },
                        "then": "$$KEEP",
                        "else": "$$PRUNE"
                    }
                }
            },
            { "$project": { _id: 1, username: 1, role: 1, avatar: 1, logo: 1, restaurantname: 1, address: "$address.fulladres", latitude: "$location.lat", longitude: "$location.lng", types: { $literal: 'user' } } },
            { $group: { _id: null, count: { $sum: 1 }, users: { $push: "$$ROOT" } } }
        ];

        var restaurantcondition = [
            {
                "$geoNear": {
                    near: { type: "Point", coordinates: [parseFloat(request.lng), parseFloat(request.lat)] },
                    distanceField: "distance",
                    includeLocs: "location",
                    query: {
                        "status": 1, availability: { $in: request.availability }
                    },
                    distanceMultiplier: 0.001,
                    spherical: true
                }
            },
            {
                "$redact": {
                    "$cond": {
                        "if": { "$lte": ["$distance", request.radius] },
                        "then": "$$KEEP",
                        "else": "$$PRUNE"
                    }
                }
            },
            { "$project": { _id: 1, username: 1, role: 1, avatar: 1, logo: 1, restaurantname: 1, address: "$address.fulladres", latitude: "$location.lat", longitude: "$location.lng", types: { $literal: 'restaurant' } } },
            { $group: { _id: null, count: { $sum: 1 }, restaurants: { $push: "$$ROOT" } } }
        ];

        var drivercondition = [
            {
                "$geoNear": {
                    near: { type: "Point", coordinates: [parseFloat(request.lng), parseFloat(request.lat)] },
                    distanceField: "distance",
                    includeLocs: "location",
                    query: { "status": 1, avail: { $in: request.availability } },
                    distanceMultiplier: 0.001,
                    spherical: true
                }
            },
            {
                "$redact": {
                    "$cond": {
                        "if": { "$lte": ["$distance", request.radius] },
                        "then": "$$KEEP",
                        "else": "$$PRUNE"
                    }
                }
            },
            { "$project": { _id: 1, username: 1, role: 1, avatar: 1, logo: 1, restaurantname: 1, address: "$address.fulladres", latitude: "$location.lat", longitude: "$location.lng", types: { $literal: 'driver' } } },
            { $group: { _id: null, count: { $sum: 1 }, drivers: { $push: "$$ROOT" } } }
        ];


        var query = { status: { $ne: 0 } };
        var condition = [
            { $match: query },
            { "$project": { _id: 1, username: 1, role: 1, avatar: 1, logo: 1, restaurantname: 1, address: "$address.fulladres", latitude: "$location.lat", longitude: "$location.lng" } }
        ];



        async.parallel({
            restaurant: function (callback) {
                if (request.type == 'restaurant' || request.type == 'all') {
                    db.GetAggregation('restaurant', restaurantcondition, function (err, restaurant) {
                        callback(err, restaurant);
                    });
                } else {
                    callback(null, null);
                }
            },
            users: function (callback) {
                if (request.type == 'users' || request.type == 'all') {
                    /* db.GetAggregation('users', usercondition, function (err, users) {
                        console.log('welcome',err, users)
                        callback(err, users);
                    }); */
                    callback(null, []);
                } else {
                    callback(null, null);
                }
            },
            drivers: function (callback) {
                if (request.type == 'driver' || request.type == 'all') {
                    db.GetAggregation('drivers', drivercondition, function (err, drivers) {
                        callback(err, drivers);
                    });
                } else {
                    callback(null, null);
                }
            }
        }, function (err, results) {
            if (err) {

                res.send({ count: 0, result: [] });
            } else {
                var arr = [];
                // console.log(results);
                if (typeof results.restaurant != 'undefined' && results.restaurant != null && results.restaurant != 'null' && results.restaurant.length > 0) {
                    if (typeof results.restaurant[0].restaurants != 'undefined' && results.restaurant[0].restaurants.length > 0) {
                        for (var i = 0; i < results.restaurant[0].restaurants.length; i++) {
                            arr.push({
                                '_id': results.restaurant[0].restaurants[i]._id,
                                'username': results.restaurant[0].restaurants[i].restaurantname,
                                'role': results.restaurant[0].restaurants[i].role,
                                'avatar': results.restaurant[0].restaurants[i].avatar,
                                'logo': results.restaurant[0].restaurants[i].logo,
                                'address': results.restaurant[0].restaurants[i].address,
                                'latitude': results.restaurant[0].restaurants[i].latitude,
                                'longitude': results.restaurant[0].restaurants[i].longitude,
                                'type': results.restaurant[0].restaurants[i].types,
                            })
                        }
                    }
                }
                var resr = [{ count: arr.length, restaurants: arr }]
                var users = results.users;
                var restaurant = resr;
                var drivers = results.drivers;

                var data = {};
                data.usersCount = 0;
                data.restaurantCount = 0;
                data.driverCount = 0;

                var usersList = [];
                var restaurantList = [];
                var driversList = [];

                if (users) {
                    if (users[0]) {
                        if (users[0].users) {
                            usersList = users[0].users;
                        }
                        data.usersCount = users[0].count;
                    }
                }

                if (restaurant) {
                    if (restaurant[0]) {
                        if (restaurant[0].restaurants) {
                            restaurantList = restaurant[0].restaurants;
                        }
                        data.restaurantCount = restaurant[0].count;
                    }
                }

                if (drivers) {
                    if (drivers[0]) {
                        if (drivers[0].drivers) {
                            driversList = drivers[0].drivers;
                        }
                        data.driverCount = drivers[0].count;
                    }
                }

                data.list = usersList.concat(restaurantList, driversList);

                for (var j = 0; j < data.list.length; j++) {
                    if (data.list[j].avatar == '' || !data.list[j].avatar) {
                        data.list[j].avatar = CONFIG.USER_PROFILE_IMAGE_DEFAULT;
                    }
                    if (data.list[j].logo == '' || !data.list[j].logo) {
                        data.list[j].logo = CONFIG.USER_PROFILE_IMAGE_DEFAULT;
                    }
                }
                res.send(data);
            }
        });
    }

    router.getTrendingProduct = async (req, res) => {
        try {
            // Define the aggregation query
            var query = [
                { $match: { status: 1, offer_status: 1 } }, // Filter for active and offer status products
                { $project: { status: 1, name: 1, avatar: 1, offer_amount: 1 } }, // Select the fields to return
                { $sort: { createdAt: -1, offer_amount: 1 } } // Sort by creation date and offer amount
            ];

            // Perform the aggregation
            let products = await db.GetAggregation('food', query);

            // Check if products were found and respond accordingly
            if (products && products.length > 0) {
                return res.send({ status: 1, data: products });
            } else {
                return res.send({ status: 1, data: [] }); // No products found
            }
        } catch (error) {
            // Handle any errors during the aggregation process
            return res.send({ status: 0, data: [], message: "Something went wrong", error: error.message });
        }
    };

    // router.sendMailSubscribe = async (req, res) => {
    //     try {
    //         // Ensure email and user_id are arrays, and handle them accordingly
    //         const emails = Array.isArray(req.body.email) ? req.body.email : [req.body.email];
    //         const userIds = Array.isArray(req.body.user_id) ? req.body.user_id : [req.body.user_id];
    
    //         // Validate if both arrays have the same length
    //         if (emails.length !== userIds.length) {
    //             return res.send({ status: 0, message: "Email and User ID arrays must be of the same length" });
    //         }
    
    //         // Ensure productid is a single value (not an array)
    //         if (!req.body.productid) {
    //             return res.send({ status: 0, message: "Product ID is required" });
    //         }
    
    //         // Ensure email content is provided (this is now coming from the frontend editor)
    //         if (!req.body.email_content || req.body.email_content.trim() === "") {
    //             return res.send({ status: 0, message: "Email content cannot be empty" });
    //         }
    
    //         // Fetch settings document from the database
    //         const settings = await db.GetOneDocument('settings', { 'alias': 'general' }, {}, {});
    //         console.log(settings);
    
    //         if (!settings) {
    //             return res.send({ status: 0, message: "Something went wrong" });
    //         }
    
    //         // Fetch product details from the 'food' collection
    //         const product = await db.GetOneDocument('food', { _id: new mongoose.Types.ObjectId(req.body.productid), status: 1, offer_status: 1 }, {}, {});
    //         if (!product.doc) {
    //             return res.send({ status: 0, message: "Product not found, please try again" });
    //         }
    
    //         // Prepare additional details (image, price, etc.)
    //         const mrb_price = product.doc.sale_price;
    //         const s_price = parseInt(product.doc.sale_price - ((product.doc.sale_price * product.doc.offer_amount) / 100));
    //         const image = settings.doc.settings.site_url + product.doc.avatar.slice(2);
    //         const p_name = product.doc.name;
    
    //         // Loop through the emails and user IDs
    //         for (let i = 0; i < emails.length; i++) {
    //             const email = emails[i];
    //             const username = email.split('@')[0]; // Get username from email
    
    //             // Prepare the dynamic email content using the frontend editor's HTML content
    //             let emailContent = req.body.email_content;
    
    //             // Replace placeholders with actual data in the HTML content
    //             emailContent = emailContent.replace(/{{name}}/g, username || "");
    //             emailContent = emailContent.replace(/{{product_name}}/g, p_name || "");
    //             emailContent = emailContent.replace(/{{sale_price}}/g, s_price || "");
    //             emailContent = emailContent.replace(/{{mrb_price}}/g, mrb_price || "");
    //             emailContent = emailContent.replace(/{{offer_amount}}/g, product.doc.offer_amount || "");
    //             emailContent = emailContent.replace(/{{image}}/g, image || "");
    //             emailContent = emailContent.replace(/{{link}}/g, settings.doc.settings.site_url || "");
    //             emailContent = emailContent.replace(/{{currency}}/g, 'Rs' || "");
    
    //             // Send email for each user with the dynamically generated content
    //             const mailData = {
    //                 to: email,
    //                 subject: `Special Offer for ${username}`, // You can customize this as needed
    //                 html: emailContent // Use the updated HTML content from the editor
    //             };
    
    //             // Send the email
    //             await mailcontent.sendmail(mailData);
    //         }
    
    //         // Respond with success message
    //         return res.send({ status: 1, message: "Mails sent successfully" });
    //     } catch (error) {
    //         // Handle any errors and send an error response
    //         return res.send({ status: 0, message: "Something went wrong", error: error.message });
    //     }
    // };
    
    router.sendMailSubscribe = async (req, res) => {
        try {
            // Ensure email and user_id are arrays, and handle them accordingly
            const emails = Array.isArray(req.body.recipients) ? req.body.recipients : [req.body.recipients];
            const userIds = Array.isArray(req.body.user_id) ? req.body.user_id : [req.body.user_id];
            const setting =  await db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}) 
            console.log(setting,"settting ");
               
            // Validate if email content is provided
            if (!req.body.content || req.body.content.trim() === "") {
                return res.send({ status: 0, message: "Email content cannot be empty" });
            }
    
            // Loop through the emails and user IDs
            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];
                const username = email.split('@')[0]; // Get username from email
    
                // Prepare the dynamic email content using the frontend editor's HTML content
                let emailContent = req.body.content;
    
                // Replace placeholders for personalized email (if needed)
                emailContent = emailContent.replace(/{{name}}/g, username || "");
                
                // Generate the unsubscribe link (you can customize this URL format)
                const unsubscribeLink = `${setting.doc.settings.site_url}/un-subscribe?email=${encodeURIComponent(email)}`;
    
                // Replace the placeholder `[unsubscribe here]` with the actual link
                if (req.body.footer) {
                    req.body.footer = req.body.footer.replace("[unsubscribe here]", `<a href="${unsubscribeLink}">Unsubscribe here</a>`);
                }
    
                // Add footer to the email content
                emailContent += `<br><br>${req.body.footer || ''}`;
    
                // Send email for each user with the dynamically generated content
                const mailData = {
                    from: req.body.senderEmail,
                    to: email,
                    subject: req.body.subject, // Subject can still be personalized
                    html: emailContent, // The email content now contains the footer with the unsubscribe link
                    temp: "notemp",
                    footer: req.body.footer
                };
    
                // Send the email
                await mailcontent.sendSubmail(mailData);
            }
    
            // Respond with success message
            return res.send({ status: 1, message: "Mails sent successfully" });
        } catch (error) {
            // Handle any errors and send an error response
            return res.send({ status: 0, message: "Something went wrong", error: error.message });
        }
    };
    
    

    router.faqAdd = async (req, res) => {
        var faq_details = {
            faq_details: req.body.faq_details
        }
        try {
            if (req.body._id) {
                let update = await db.UpdateDocument('faq', { '_id': req.body._id }, faq_details,)
                if (update) {
                    res.send({ status: 1, data: update, message: "Updated Successfully" })
                } else {
                    res.send({ status: 0, message: "Something went wrong" })
                }
            } else {
                let result = await db.InsertDocument('faq', faq_details,)
                console.log(result)
                if (result) {
                    res.send({ status: 1, data: result, message: "Added Successfully" });
                } else {
                    res.send({ status: 0, message: "Something went wrong" });
                }
            }
        } catch (error) {
            console.log(error, "error");

        }

    }


    router.faqData = async (req, res) => {
        try {
            var faqGetData = await db.GetOneDocument('faq', {}, {}, {})
            console.log(faqGetData, "faqGetDatafaqGetDatafaqGetData");

            if (faqGetData && faqGetData.doc && faqGetData.doc.faq_details && faqGetData.doc.faq_details.length > 0) {
                return res.send({ status: 1, data: faqGetData })
            } else {
                return res.send({ status: 0, message: "Something went wrong" })
            }
        } catch (error) {
            console.log(error, "error");
        }
    }


    // router.shiprocket = async (req,res) => {
    //     console.log("11111111#################111111111");
    //     // let rs_data = await srShippingRateCalculation(700008,700009,5,2000);
    //     let pickup_postcode = 700008
    //     let delivery_postcode = 700009
    //     let weight = 5
    //     let declared_value = 2000
    //     let resData = {
    //         status: false,
    //         mainToken: {},
    //         message: "Fail!!",
    //       };
    //     try{
    //         let getToken = await srlogin();

    //         let parmers = 'pickup_postcode=' + pickup_postcode;
    //         parmers += '&delivery_postcode=' + delivery_postcode;
    //         parmers += '&weight=' + weight;
    //         parmers += '&cod=1';
    //         parmers += '&declared_value=' + declared_value;
    //         parmers += '&rate_calculator=1';
    //         parmers += '&blocked=1';
    //         parmers += '&is_return=0';
    //         parmers += '&is_web=1';
    //         parmers += '&is_dg=0';
    //         parmers += '&only_qc_couriers=0';

    //         if (getToken.status) {
    //             var config = {
    //               method: 'get',
    //               maxBodyLength: Infinity,
    //               url: 'https://apiv2.shiprocket.in/v1/external/courier/serviceability?' + parmers,
    //               headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${getToken.mainToken}`
    //               }
    //             };
    //             axios(config).then(function(response) {
    //               resData.status = true;
    //               resData.message = 'Success!!';
    //               resData.mainset = response.data;
    //               res.send(resData);
    //             }).catch(function(error) {
    //               //++++++++++++++++++++++++++++++++++++
    //               console.log(error);
    //               console.log('srShippingRateCalculation');
    //               //++++++++++++++++++++++++++++++++++++
    //               resData.status = false;
    //               resData.message = 'Error!!';
    //               resData.mainset = JSON.stringify(error);
    //               res.send(resData);
    //             });
    //           } else {
    //             //+++++++++++++++++++++++++++++++++++++++++
    //             console.log('srShippingRateCalculation');
    //             //+++++++++++++++++++++++++++++++++++++++++
    //             resData.status = false;
    //             resData.message = 'Error!!';
    //             res.send(resData);
    //           }
    //     }catch(error){
    //         console.log(error,"error")
    //     }
    // }


    // function srlogin() {
    //     return new Promise(async (resolve, reject) => {
    //       let resData = {
    //         status: false,
    //         mainToken: {},
    //         message: "Fail!!",
    //       };
    //       //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //       var srlogindata = JSON.stringify({
    //         "email": CONFIG.SHIPROCKET_EMAIL,
    //         "password": CONFIG.SHIPROCKET_PWD
    //       });
    //       //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //       try {
    //         var config = {
    //           method: 'post',
    //           maxBodyLength: Infinity,
    //           url: 'https://apiv2.shiprocket.in/v1/external/auth/login',
    //           headers: {
    //             'Content-Type': 'application/json'
    //           },
    //           data: srlogindata
    //         };
    //         //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //         //CALL
    //         //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //         axios(config)
    //           .then(function(response) {
    //             resData.status = true;
    //             resData.message = 'Success!!';
    //             resData.mainToken = response.data.token;
    //             resolve(resData);
    //           }).catch(function(error) {
    //             console.error(error);
    //             reject(resData);
    //           });
    //       } catch (e) {
    //         console.error(e);
    //         reject(resData);
    //       }
    //     });
    //   }


    //   shiprocket()



    router.shiprocket_webhook = async (req, res) => {
        console.log("Received Shiprocket Webhook", req.body);

        // Webhook payload structure
        const {
            awb,
            current_status,
            order_id,
            current_timestamp,
            etd,
            current_status_id,
            shipment_status,
            shipment_status_id,
            channel_order_id,
            channel,
            courier_name,
            scans
        } = req.body;
        console.log(typeof Number(order_id));

        let resData = {
            status: false,
            message: "Failed to process the webhook",
        };

        try {
            // Find the corresponding order in the database by `order_id`
            let order = await db.GetOneDocument('orders', { 'shiprocket_data.order_id': Number(order_id) }, {}, {});
            console.log(order);

            if (order.status === true) {
                // Update the order status in the database with the webhook data
                let updatedOrder = await db.UpdateDocument('orders', { _id: order.doc._id }, {
                    $set: {
                        "shiprocket_data.awb": awb,
                        "shiprocket_data.current_status": current_status,
                        "shiprocket_data.current_timestamp": current_timestamp,
                        "shiprocket_data.etd": etd,
                        "shiprocket_data.current_status_id": current_status_id,
                        "shiprocket_data.shipment_status": shipment_status,
                        "shiprocket_data.shipment_status_id": shipment_status_id,
                        "shiprocket_data.channel_order_id": channel_order_id,
                        "shiprocket_data.channel": channel,
                        "shiprocket_data.courier_name": courier_name,
                        "shiprocket_data.scans": scans,
                        "status": shipment_status_id,
                        "status_description": shipment_status
                    }
                }, {});

                if (updatedOrder) {
                    resData.status = true;
                    resData.message = "Webhook processed and order updated successfully";
                    res.send(resData);
                } else {
                    resData.message = "Failed to update order";
                    res.status(200).send(resData);
                }
            } else {
                resData.message = "Order not found";
                res.status(200).send(resData);
            }
        } catch (error) {
            console.error('Webhook Error:', error); // Log unexpected errors
            res.status(200).send({ message: 'Server Error!', error: error.message });
        }
    };





    router.shiprocket_get_all_order = async (req, res) => {
        console.log("Starting Shiprocket Serviceability Request");
        // let pickup_postcode = 700008;
        // let delivery_postcode = 700009;
        // let weight = 5;
        // let declared_value = 2000;

        const { order_id } = req.body

        //   let orderdetails =  await db.GetOneDocument('orders', {_id:order_id},{},{})
        let shiprocket_orderId = orderdetails.doc.shiprocket_data.order_id
        let resData = {
            status: false,
            mainToken: {},
            message: "Fail!!",
        };

        try {
            // Get the login token
            let getToken = await srlogin();
            console.log('Shiprocket token:', getToken.mainToken); // Log the token

            if (getToken.status) {
                let params = `pickup_postcode=${pickup_postcode}&delivery_postcode=${delivery_postcode}&weight=${weight}&cod=1&declared_value=${declared_value}&rate_calculator=1&blocked=1&is_return=0&is_web=1&is_dg=0&only_qc_couriers=0`;

                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `https://apiv2.shiprocket.in/v1/external/orders/show/${shiprocket_orderId}`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken.mainToken}`
                    }
                };

                // Make the API call
                axios(config)
                    .then(function (response) {
                        console.log('Serviceability Response:', response.data); // Log response
                        resData.status = true;
                        resData.message = 'Success!!';
                        resData.mainset = response.data;
                        res.send(resData);
                    })
                    .catch(function (error) {
                        console.log('API Error:', error.response ? error.response.data : error.message); // Log error details
                        resData.status = false;
                        resData.message = 'Error during Shiprocket serviceability request!';
                        resData.mainset = error.response ? error.response.data : error.message;
                        res.status(403).send(resData);
                    });
            } else {
                console.log('Shiprocket Login Failed');
                resData.message = 'Login failed, unable to get token.';
                res.status(403).send(resData);
            }
        } catch (error) {
            console.error('Unexpected Error:', error); // Log unexpected errors
            res.status(500).send({ message: 'Server Error!', error: error.message });
        }
    };



    // Login Function for Shiprocket



    router.shiprocket_getorder_details = async (req, res) => {
        console.log("Starting Shiprocket Serviceability Request");

        const { order_id } = req.body;
        console.log(order_id);

        if (!order_id) {
            return res.status(400).send({ status: false, message: "Order ID is required." });
        }

        let orderdetails;
        try {
            orderdetails = await db.GetOneDocument('orders', { order_id: order_id }, {}, {});
            console.log(orderdetails, "orderdetails");

            if (!orderdetails || !orderdetails.doc) {
                return res.status(404).send({ status: false, message: "Order not found." });
            }

            // Check if shiprocket_data exists in the order
            if (!orderdetails.doc.shiprocket_data) {
                return res.status(404).send({ status: false, message: "Shiprocket data not found for this order." });
            }

        } catch (error) {
            console.error('Database Error:', error);
            return res.status(500).send({ status: false, message: "Error fetching order details." });
        }

        const shiprocket_orderId = orderdetails.doc.shiprocket_data.order_id;
        let resData = { status: false, mainToken: {}, message: "Fail!!" };
        const internalStatusMapping = {
            Ordered: 1,
            Packed: 3,
            Shipped: 6,
            Delivered: 7,
            Cancelled: 9,
            "Return Confirmed": 16,
            Collected: 17,
            Refunded: 18,
        };

        // Shiprocket Status Codes categorized
        const statusCategorization = {
            Ordered: [1, 2],
            Packed: [3, 4],
            Shipped: [6, 17, 18, 19, 38, 51, 52,43],
            Delivered: [7, 23],
            Cancelled: [8, 5, 9, 16, 21, 40, 41, 46],
            "Return Confirmed": [13, 14, 15, 42],
            Refunded: [18, 48, 47, 50],
        };

        // Map Shiprocket status code to internal category and numerical status
        const mapToInternalStatus = (statusCode) => {
            for (const [category, codes] of Object.entries(statusCategorization)) {
                if (codes.includes(statusCode)) {
                    const internalCode = internalStatusMapping[category];
                    return { category, internalCode }; // Return both category and code
                }
            }
            return { category: "Unknown", internalCode: null }; // Fallback
        };

        try {
            let getToken = await srlogin();
            console.log('Shiprocket token:', getToken.mainToken);

            if (!getToken.status) {
                console.log('Shiprocket Login Failed');
                return res.status(403).send({ status: false, message: 'Login failed, unable to get token.' });
            }

            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://apiv2.shiprocket.in/v1/external/orders/show/${shiprocket_orderId}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken.mainToken}`
                }
            };

            const response = await axios(config);
            console.log('Serviceability Response:', response.data);

            const shiprocketStatusCode = response.data.data.status_code; // Get Shiprocket status code
            const { category, internalCode } = mapToInternalStatus(shiprocketStatusCode); // Map to internal status
            console.log(`Mapped Shiprocket Status Code ${shiprocketStatusCode} to Internal Status: ${internalCode} (${category})`);


            let orderDetails = await db.GetOneDocument('orders', { order_id: order_id }, {}, {});
            if (orderDetails && orderDetails.doc && orderDetails.doc.shiprocket_timeline) {
                let lastStatus = orderDetails.doc.shiprocket_timeline[orderDetails.doc.shiprocket_timeline.length - 1];
                if (lastStatus.status_code === shiprocketStatusCode) {
                    // If the latest status is the same as the incoming status, do not add it again
                    console.log('Status is the same as the last status, skipping update.');
                    return res.status(200).send({ status: 1, message: 'No new status to update.' });
                }
            }

            let timeline = {
                status_code: shiprocketStatusCode,
                shiprocket_status: response.data.data.status,
                internal_status: internalCode,
                timestamp: new Date()
            };

            let doc = {
                $push: {
                    shiprocket_timeline: timeline
                }
            };

            // Update the order status in the database
            await db.UpdateDocument('orders', { order_id: order_id }, {
                $set: {
                    status: internalCode, // Save internal numerical status
                    'shiprocket_data.status': response.data.data.status || "",
                    'shiprocket_data.etd': response.data.data.shipments.etd || "",
                    'shiprocket_data.out_for_delivery_date': response.data.data.out_for_delivery_date || '',
                    'shiprocket_data.shipped_date': response.data.data.shipped_date || '',
                    'shiprocket_data.delivered_date': response.data.data.delivered_date || '',
                    'shiprocket_data.awb_code': response.data.data.shipments.awb || '',
                    'shiprocket_data.pickup_scheduled_date': response.data.data.shipments.pickup_scheduled_date || '',
                    'shiprocket_data.courier': response.data.data.shipments.courier || '',
                    'shiprocket_data.scans': response.data.data.shipments.scans || [],
                },
                ...doc
            });

            resData.status = true;
            resData.message = 'Success!!';
            resData.mainset = response.data;
            return res.send({ status: 1, data: resData });
        } catch (error) {
            console.log('API Error:', error.response ? error.response.data : error.message);
            resData.status = false;
            resData.message = 'Error during Shiprocket serviceability request!';
            resData.mainset = error.response ? error.response.data : error.message;
            return res.status(403).send(resData);
        }
    }
    // Login Function for Shiprocket


    router.shiprocket_check_multiple_orders_status = async (req, res) => {
        console.log("Starting Bulk Shiprocket Status Update");
    
        const resData = { status: false, mainToken: {}, message: "Fail!!" };
    
        try {
            // Step 1: Fetch all orders with status = 3 and shiprocket_data exists
            const orders = await db.GetDocument('orders', {
                status: {$gte:3},
                'shiprocket_data': { $exists: true, $ne: null }
            }, {}, {});
    
            if (!orders || !orders.doc || orders.doc.length === 0) {
                console.log("No orders found with status 3 and Shiprocket data.");
                return res.status(404).send({ status: false, message: "No eligible orders found for update." });
            }
    
            console.log(`${orders.doc.length} orders found for status update.`);
    
            // Step 2: Get Shiprocket API token
            const getToken = await srlogin();
            console.log('Shiprocket token:', getToken.mainToken);
    
            if (!getToken.status) {
                console.log('Shiprocket Login Failed');
                return res.status(403).send({ status: false, message: "Login failed, unable to get token." });
            }
    
            // Step 3: Prepare for processing orders
            const internalStatusMapping = {
                Ordered: 1,
                Packed: 3,
                Shipped: 6,
                Delivered: 7,
                Cancelled: 9,
                "Return Confirmed": 16,
                Collected: 17,
                Refunded: 18,
            };
    
            const statusCategorization = {
                Ordered: [1, 2],
                Packed: [3, 4],
                Shipped: [6, 17, 18, 19, 38, 51, 52],
                Delivered: [7, 23],
                Cancelled: [8, 5, 9, 16, 21, 40, 41, 46],
                "Return Confirmed": [13, 14, 15, 42],
                Refunded: [18, 48, 47, 50],
            };
    
            const mapToInternalStatus = (statusCode) => {
                for (const [category, codes] of Object.entries(statusCategorization)) {
                    if (codes.includes(statusCode)) {
                        const internalCode = internalStatusMapping[category];
                        return { category, internalCode };
                    }
                }
                return { category: "Unknown", internalCode: null };
            };
    
            // Step 4: Iterate over the orders and update status for each
            let updatedOrdersCount = 0;
    
            for (let order of orders.doc) {
                const shiprocket_orderId = order.shiprocket_data.order_id;
                const config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `https://apiv2.shiprocket.in/v1/external/orders/show/${shiprocket_orderId}`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken.mainToken}`
                    }
                };
    
                try {
                    // Fetch the order details from Shiprocket
                    const response = await axios(config);
                    console.log(`Serviceability Response for order ID ${shiprocket_orderId}:`, response.data);
    
                    const shiprocketStatusCode = response.data.data.status_code;
                    const { category, internalCode } = mapToInternalStatus(shiprocketStatusCode);
                    console.log(`Mapped Shiprocket Status Code ${shiprocketStatusCode} to Internal Status: ${internalCode} (${category})`);
    
                    if (order.shiprocket_timeline) {
                        const lastStatus = order.shiprocket_timeline[order.shiprocket_timeline.length - 1];
                        if (lastStatus.status_code === shiprocketStatusCode) {
                            console.log(`Order ${shiprocket_orderId} already has the latest status. Skipping update.`);
                            continue;
                        }
                    }
    
                    const timeline = {
                        status_code: shiprocketStatusCode,
                        shiprocket_status: response.data.data.status,
                        internal_status: internalCode,
                        timestamp: new Date()
                    };
    
                    await db.UpdateDocument('orders', { _id: order._id }, {
                        $set: {
                            status: internalCode,
                            'shiprocket_data.status': response.data.data.status || "",
                            'shiprocket_data.etd': response.data.data.shipments?.etd || "",
                            'shiprocket_data.out_for_delivery_date': response.data.data?.out_for_delivery_date || "",
                            'shiprocket_data.awb_code': response.data.data.shipments?.awb || "",
                            'shiprocket_data.pickup_scheduled_date': response.data.data.shipments?.pickup_scheduled_date || "",
                            'shiprocket_data.courier': response.data.data.shipments?.courier || "",
                            'shiprocket_data.scans': response.data.data.shipments?.scans || []
                        },
                        $push: {
                            shiprocket_timeline: timeline
                        }
                    });
    
                    updatedOrdersCount++;
                } catch (error) {
                    console.error(`Error updating order ID ${order._id}:`, error.response ? error.response.data : error.message);
                    continue;
                }
            }
    
            // Step 5: Respond with the update summary
            resData.status = true;
            resData.message = `${updatedOrdersCount} orders have been updated successfully.`;
            return res.status(200).send(resData);
    
        } catch (error) {
            console.error('Error during bulk Shiprocket status update:', error);
            resData.message = 'Error during Shiprocket serviceability request for multiple orders!';
            resData.mainset = error.response ? error.response.data : error.message;
            return res.status(500).send(resData);
        }
    };

   


    router.shiprocket_create_order = async (req, res) => {
        console.log("Starting Shiprocket Serviceability Request");
        const { order_id, height, length, breadth } = req.body
        console.log(order_id, height, "order_id, height");

        // let pickup_postcode = 700008;
        // let delivery_postcode = 700009;
        // let weight = 5;
        // let declared_value = 2000;




        var editTasksQuery = [{
            $match: {
                _id: new mongoose.Types.ObjectId(order_id),
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
                email: 1,
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
                billing_address: 1
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

        console.log(docdata[0].documentData, "orderdata");
        //      let weight = [];

        // //   for (let item of docdata[0].documentData[0].cart_details.cart_details) {
        // //     weight.push({weight:item.variations[0][0].chaild_name,quantity:item.quantity});
        // //   }
        let transaction = docdata[0].documentData[0].transactions[0].type === "COD" ? "COD" : "Prepaid";
        // console.log(transaction,"asdasdasdas");

        //  let totalWeight = calculateTotalWeight(weight) 
        let totalWeight = docdata[0].documentData[0].billings.amount.total_weight
        let shippingCharge = docdata[0].documentData[0].billings.amount.shippingCharge
        let tax = docdata[0].documentData[0].billings.amount.service_tax

        let orderdata = {
            order_id: docdata[0].documentData[0].order_id,
            order_date: docdata[0].documentData[0].order_history.order_time,
            pickup_location: "Pillai's Foods", // Change this to your actual pickup location
            billing_customer_name: docdata[0].documentData[0].delivery_address.first_name || docdata[0].documentData[0].delivery_address.username,
            billing_last_name: docdata[0].documentData[0].delivery_address.last_name || '', // If applicable
            billing_address: docdata[0].documentData[0].delivery_address.line1,
            billing_city: docdata[0].documentData[0].delivery_address.city,
            billing_pincode: docdata[0].documentData[0].delivery_address.zipcode,
            billing_state: docdata[0].documentData[0].delivery_address.state,
            billing_country: docdata[0].documentData[0].delivery_address.country,
            billing_email: docdata[0].documentData[0].email || docdata[0].documentData[0].delivery_address.email || docdata[0].documentData[0].user[0].email || '',
            billing_phone: docdata[0].documentData[0].delivery_address.phone,
            shipping_is_billing: true,
            order_items: docdata[0].documentData[0].foods.map(food => ({
                name: food.name,
                sku: food.sku || food.slug,
                units: food.quantity,
                selling_price: food.price,
                discount: food.offer_price, // If there are discounts
                tax: tax,
            })),
            payment_method: transaction, // Adjust based on payment method
            shipping_charges: shippingCharge, // If any shipping charges
            giftwrap_charges: 0, // If any gift wrap charges
            transaction_charges: 0, // If any transaction charges
            total_discount: 0, // If any discounts
            sub_total: docdata[0].documentData[0].billings.amount.total,
            length: length || 0.5,
            breadth: breadth || 0.5,
            height: height || 0.5,
            weight: totalWeight | 1,
        };
        console.log(orderdata, "sending order");

        let resData = {
            status: false,
            mainToken: {},
            message: "Fail!!",
        };

        try {
            // Get the login token
            let getToken = await srlogin();
            console.log('Shiprocket token:', getToken.mainToken); // Log the token

            if (getToken.status) {

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `https://apiv2.shiprocket.in/v1/external/orders/create/adhoc`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken.mainToken}`
                    },
                    data: orderdata
                };

                // Make the API call
                axios(config)
                    .then(async function (response) {
                        console.log('order Response:', response.data);

                        let timeline = {
                            status_code: response.data.status_code,
                            shiprocket_status: response.data.status,
                            timestamp: new Date()
                        }

                        let updateDoc = {
                            $push: {
                                shiprocket_timeline: timeline
                            },
                            shiprocket_data: response.data
                        };
                        console.log(timeline, 'timelinetimelinetimelinetimeline');

                        const newdata = await db.UpdateDocument('orders', { _id: order_id }, updateDoc, {})
                        resData.status = true;
                        resData.message = 'Success!!';
                        resData.mainset = response.data;
                        res.send(resData);

                    })
                    .catch(function (error) {
                        console.log('API Error:', error.response ? error.response.data : error.message);
                        resData.status = false;
                        resData.message = 'Error during Shiprocket order request!';
                        resData.mainset = error.response ? error.response.data : error.message;
                        res.status(403).send(resData);
                    });
            } else {
                console.log('Shiprocket Login Failed');
                resData.message = 'Login failed, unable to get token.';
                res.status(403).send(resData);
            }
        } catch (error) {
            console.error('Unexpected Error:', error); // Log unexpected errors
            res.status(500).send({ message: 'Server Error!', error: error.message });
        }
    };


    function calculateTotalWeight(weights) {
        const densityKgPerL = 1;

        const totalWeightKg = weights.reduce((total, weight) => {
            const match = weight.weight.match(/^(\d+(\.\d+)?)\s*(g|kg|ml|l)$/i);

            if (match) {
                const value = parseFloat(match[1]) * weight.quantity;
                const unit = match[3].toLowerCase();

                if (unit === 'g') {
                    return total + value / 1000;
                } else if (unit === 'kg') {
                    return total + value;
                } else if (unit === 'ml') {
                    return total + (value / 1000) * densityKgPerL;
                } else if (unit === 'l') {
                    return total + value * densityKgPerL;
                }
            }

            console.warn(`Invalid weight format: ${weight}`);
            return total;
        }, 0);

        return totalWeightKg;
    }

    // Login Function for Shiprocket
    function srlogin() {
        return new Promise(async (resolve, reject) => {
            let resData = {
                status: false,
                mainToken: {},
                message: "Fail!!",
            };
            // "email": CONFIG.SHIPROCKET_EMAIL,
            //     "password": CONFIG.SHIPROCKET_PWD
            let srlogindata = JSON.stringify({
                "email": "fancyteam@teamtweaks.com",
                "password": "Fancy@#123"
            });

            // let srlogindata = JSON.stringify({
            //     "email": CONFIG.SHIPROCKET_API_EMAIL,
            //     "password": CONFIG.SHIPROCKET_API_PWD
            // });
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://apiv2.shiprocket.in/v1/external/auth/login',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: srlogindata
            };

            try {
                axios(config)
                    .then(function (response) {
                        console.log('Login Success:', response.data); // Log successful login
                        resData.status = true;
                        resData.message = 'Success!!';
                        resData.mainToken = response.data.token;
                        resolve(resData);
                    })
                    .catch(function (error) {
                        console.log('Login Error:', error.response ? error.response.data : error.message); // Log error details
                        reject(resData);
                    });
            } catch (e) {
                console.error('Login Exception:', e); // Log unexpected errors
                reject(resData);
            }
        });
    }








    // router.shiprocket = async (req,res) => {
    //     //++++++++++++++++++++++++++++++++++++++++++++++++++
    //     let rs_data = await srShippingRateCalculation(700008,700009,5,2000);
    //     //++++++++++++++++++++++++++++++++++++++++++++++++++
    //     res.status(200).json(rs_data);
    //     //++++++++++++++++++++++++++++++++++++++++++++++++++
    //     //Function ShippingRateCalculation
    //     //++++++++++++++++++++++++++++++++++++++++++++++++++
    //     function srShippingRateCalculation(pickup_postcode, delivery_postcode, weight, declared_value) {
    //       return new Promise(async (resolve, reject) => {
    //         let resData = {
    //           status: false,
    //           mainToken: {},
    //           message: "Fail!!",
    //         };
    //         try {
    //           //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //           let getToken = await srlogin();
    //           //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //           let parmers = 'pickup_postcode=' + pickup_postcode;
    //           parmers += '&delivery_postcode=' + delivery_postcode;
    //           parmers += '&weight=' + weight;
    //           parmers += '&cod=1';
    //           parmers += '&declared_value=' + declared_value;
    //           parmers += '&rate_calculator=1';
    //           parmers += '&blocked=1';
    //           parmers += '&is_return=0';
    //           parmers += '&is_web=1';
    //           parmers += '&is_dg=0';
    //           parmers += '&only_qc_couriers=0';
    //           //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //           if (getToken.status) {
    //             var config = {
    //               method: 'get',
    //               maxBodyLength: Infinity,
    //               url: 'https://apiv2.shiprocket.in/v1/external/courier/serviceability?' + parmers,
    //               headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${getToken.mainToken}`
    //               }
    //             };
    //             axios(config).then(function(response) {
    //               resData.status = true;
    //               resData.message = 'Success!!';
    //               resData.mainset = response.data;
    //               resolve(resData);
    //             }).catch(function(error) {
    //               //++++++++++++++++++++++++++++++++++++
    //               console.log(error);
    //               console.log('srShippingRateCalculation');
    //               //++++++++++++++++++++++++++++++++++++
    //               resData.status = false;
    //               resData.message = 'Error!!';
    //               resData.mainset = JSON.stringify(error);
    //               reject(resData);
    //             });
    //           } else {
    //             //+++++++++++++++++++++++++++++++++++++++++
    //             console.log('srShippingRateCalculation');
    //             //+++++++++++++++++++++++++++++++++++++++++
    //             resData.status = false;
    //             resData.message = 'Error!!';
    //             reject(resData);
    //           }
    //         } catch (e) {
    //           //+++++++++++++++++++++++++++++++++++++++++
    //           console.error(e);
    //           console.log('srShippingRateCalculation');
    //           //+++++++++++++++++++++++++++++++++++++++++
    //           reject(resData);
    //         }
    //       });
    //     }
    //     //++++++++++++++++++++++++++++++++++++++++++++++++++
    //     //Function Login
    //     //++++++++++++++++++++++++++++++++++++++++++++++++++
    //     function srlogin() {
    //       return new Promise(async (resolve, reject) => {
    //         let resData = {
    //           status: false,
    //           mainToken: {},
    //           message: "Fail!!",
    //         };
    //         //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //         var srlogindata = JSON.stringify({
    //           "email": "",
    //           "password": ""
    //         });
    //         //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //         try {
    //           var config = {
    //             method: 'post',
    //             maxBodyLength: Infinity,
    //             url: 'https://apiv2.shiprocket.in/v1/external/auth/login',
    //             headers: {
    //               'Content-Type': 'application/json'
    //             },
    //             data: srlogindata
    //           };
    //           //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //           //CALL
    //           //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //           axios(config)
    //             .then(function(response) {
    //               resData.status = true;
    //               resData.message = 'Success!!';
    //               resData.mainToken = response.data.token;
    //               resolve(resData);
    //             }).catch(function(error) {
    //               console.error(error);
    //               reject(resData);
    //             });
    //         } catch (e) {
    //           console.error(e);
    //           reject(resData);
    //         }
    //       });
    //     }

    //   };

    router.newsLetterList = async (req, res) => {
        const { skip, limit, search } = req.body;
        try {
            let matchStage = { status: 1 };

            if (search) {
                matchStage = {
                    $and: [
                        { status: 1 },
                        {
                            $or: [
                                // { name: { $regex: search, $options: 'i' } },
                                { email: { $regex: search, $options: 'i' } },
                            ]
                        }
                    ]
                };
            }

            let aggregates = [
                { $match: matchStage },
                {
                    $facet: {
                        "count": [{ $count: "count" }],
                        documentdata: [
                            { $sort: { 'createdAt': -1 } },
                            { $skip: skip ? skip : 0 },
                            { $limit: limit ? limit : 100 },
                        ]
                    }
                }
            ];

            // var newsletter = await SubscribedNewsletter.aggregate(aggregates);
            const newsletter = await db.GetAggregation('subscribe', aggregates)
            return res.send({ status: true, data: newsletter });
        } catch (error) {
            return res.send({ status: false, message: "Error fetching newsLetter: " + error.message });
        }
    }


    return router;
}
