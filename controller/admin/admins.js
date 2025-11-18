//"use strict";
var db = require('../../controller/adaptor/mongodb.js');
var bcrypt = require('bcrypt-nodejs');
var mailcontent = require('../../model/mailcontent.js');
var async = require('async');
var moment = require('moment');
var library = require('../../model/library.js');
var timezone = require('moment-timezone');
var mongoose = require("mongoose");

module.exports = function (io) {
    var router = {};
    router.forgotpassave = function (req, res) {
        var userid = req.body.data.userid
        var data = bcrypt.hashSync(req.body.data.formData, bcrypt.genSaltSync(8), null);
        db.UpdateDocument('admins', { '_id': userid }, { 'password': data }, {}, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };
    /* router.forgotpassave = function (req, res) {
        var userid = req.body.data.userid
        var uniqueID = req.body.data.uniqueID;
        var password = bcrypt.hashSync(req.body.data.formData, bcrypt.genSaltSync(8), null);
        db.GetOneDocument('admins', { '_id': userid }, {}, {}, function (err, user) {
            if(user && typeof user._id != 'undefined'){
                if (typeof uniqueID != 'undefined' && user.uniqueID == uniqueID) {
                    var currentTime = Date.now();
                    //var expire = 5 * 60 * 1000; // 5 min;
                    var expire = 3 * 60 * 1000; // 5 min;
                    if (typeof user.unique_verification != 'undefined' && typeof user.unique_verification.timestamp != 'undefined') {
                        var diff = currentTime - parseInt(user.unique_verification.timestamp);
                        if (diff < expire) {
                            db.UpdateDocument('admins', { '_id': userid }, { 'password': password }, {}, function (err, docdata) {
                                if (err) {
                                    res.status(400).send({ message: err });
                                } else {
                                    res.send({ status:"1", message: '' });
                                }
                            });
                        } else {
                            res.status(400).send({ message: 'Session expired.' });
                        }
                    }else{
                        res.status(400).send({ message: 'User is unauthorized' });
                    }
                } else {
                    res.status(400).send({ message: 'User is unauthorized' });
                }
            }else{
                res.status(400).send({ message: "Invalid Login User" });
            }
        })
    }; */
    router.getusers = function (req, res) {
        db.GetDocument('admins', {}, {}, {}, function (err, docdata) {
            if (err) {
                res.send(err);
            } else {
                res.send(docdata);
            }
        });
    };
    router.forgotpass = async function forgotpass(req, res) {
        var data = {};
        var request = {};
        request.email = req.body.email;
        const [user, settings] = await Promise.all([
            db.GetOneDocument('admins', { 'email': request.email }, {}, {}),
            db.GetOneDocument('settings', { 'alias': 'general' }, {}, {})
        ])

        // console.log("_______________________________________------------------------------------------------------")

        // console.log(user)

        // console.log(user)



        // console.log("_______________________________________------------------------------------------------------")

        if (!settings.status) {
            data.status = 0;
            data.response = 'Configure Your Settings!';
            res.status(201).send(data);
        } else {
            if (!user.status) {
                data.status = 0;
                data.response = "Email is not registered with us"
                res.send(data)
            } else {
                if (user.doc && typeof user.doc._id != 'undefined') {
                    var uniqueID = library.randomString(8, '#');
                    var updateDetails = { uniqueID: uniqueID, unique_verification: { timestamp: Date.now() } };
                    await db.UpdateDocument('admins', { _id: user.doc._id }, updateDetails, { multi: true })
                    var url = '';

                    url = '<a href=' + settings.doc.settings.site_url ? settings.doc.settings.site_url : '' + 'admin#/forgotpwdadminmail/' + user.doc._id + '/' + uniqueID + '>Click to reset the password</a>';
                    var mailData = {};
                    mailData.template = 'AdminForgotpassword';
                    mailData.to = user.doc.email;
                    mailData.html = [];
                    mailData.html.push({ name: 'name', value: user.doc.username });
                    mailData.html.push({ name: 'email', value: user.doc.email });
                    mailData.html.push({ name: 'link', value: url || "" });
                    mailcontent.sendmail(mailData, function (err, response) { });
                    data.status = '1';
                    data.response = 'Mail Sent Successfully!';
                    res.send(data);

                    // db.UpdateDocument('admins', { _id: user._id }, updateDetails, { multi: true }, function (err, response) {
                    //     var url = '';
                    //     url = '<a href=' + settings.settings.site_url + 'admin#/forgotpwdadminmail/' + user._id + '/' + uniqueID + '>Click to reset the password</a>';
                    //     var mailData = {};
                    //     mailData.template = 'AdminForgotpassword';
                    //     mailData.to = user.email;
                    //     mailData.html = [];
                    //     mailData.html.push({ name: 'name', value: user.username });
                    //     mailData.html.push({ name: 'email', value: user.email });
                    //     mailData.html.push({ name: 'link', value: url || "" });
                    //     mailcontent.sendmail(mailData, function (err, response) { });
                    //     data.status = '1';
                    //     data.response = 'Mail Sent Successfully!';
                    //     res.send(data);
                    // });
                } else {
                    res.status(400).send({ message: "Invalid Login User" });
                }
            }

        }

        // async.waterfall([
        //     function (callback) {
        //         db.GetOneDocument('admins', { 'email': request.email }, {}, {}, function (err, user) {
        //             callback(err, user);
        //         });
        //     },
        //     function (user, callback) {
        //         db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
        //             callback(err, user, settings);
        //         });
        //     }
        // ], function (err, user, settings) {
        //     if (err || !user) {
        //         data.status = '0';
        //         data.response = 'Errror!';
        //         res.status(201).send(data);
        //     } else {
        //         if (user && typeof user._id != 'undefined') {
        //             var uniqueID = library.randomString(8, '#');
        //             var updateDetails = { uniqueID: uniqueID, unique_verification: { timestamp: Date.now() } };
        //             db.UpdateDocument('admins', { _id: user._id }, updateDetails, { multi: true }, function (err, response) {
        //                 var url = '';
        //                 url = '<a href=' + settings.settings.site_url + 'admin#/forgotpwdadminmail/' + user._id + '/' + uniqueID + '>Click to reset the password</a>';
        //                 var mailData = {};
        //                 mailData.template = 'AdminForgotpassword';
        //                 mailData.to = user.email;
        //                 mailData.html = [];
        //                 mailData.html.push({ name: 'name', value: user.username });
        //                 mailData.html.push({ name: 'email', value: user.email });
        //                 mailData.html.push({ name: 'link', value: url || "" });
        //                 mailcontent.sendmail(mailData, function (err, response) { });
        //                 data.status = '1';
        //                 data.response = 'Mail Sent Successfully!';
        //                 res.send(data);
        //             });
        //         } else {
        //             res.status(400).send({ message: "Invalid Login User" });
        //         }
        //     }
        // });
    }

    router.currentUser = async function (req, res) {
        // req.checkBody('currentUserData', 'Invalid currentUserData').notEmpty();
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors);
        //     return;
        // }
        const docdata= await db.GetDocument('admins', { username: req.body.currentUserData }, { username: 1, privileges: 1, role: 1 }, {})
        if (!docdata.status) {
            res.send({status:false, message:docdata.message});
        } else {
            res.send({status:true,doc:docdata.doc[0]});
        }
        // db.GetDocument('admins', { username: req.body.currentUserData }, { username: 1, privileges: 1, role: 1 }, {}, function (err, docdata) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         res.send(docdata);
        //     }
        // });
    };

    router.getusersrole = async function (req, res) {
        let docdatas = await db.GetDocument('admins', { _id: new mongoose.Types.ObjectId(req.body.data), status: { $ne: 0 }, role: "subadmin" }, { password: 0 }, {})
        console.log(docdatas, "111111111111111");
        if (docdatas && docdatas.doc && docdatas.doc.length > 0) {

        }
        return res.send(docdatas.doc[0]);
    }

    router.rolemanager = async function (req, res) {
        var data = {};
        var privileges = [];
        data.username = req.body.username;
        data.name = req.body.name;
        data.email = req.body.email;
        data.role = 'subadmin';
        data.status = 1;
        data.privileges = req.body.privileges;
        var privilegesIndex = data.privileges.map(function (e) { return e.alias; }).indexOf('administrators');
        if (privilegesIndex != -1) {
            data.privileges[privilegesIndex].status = { add: false, delete: false, edit: false, view: false };
        }
        if (req.body.confirmPassword) {
            data.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
        }

        if (req.body._id != null || req.body._id != undefined || req.body._id != undefined) {
            console.log(req.body._id, "11111111111");
            const docdata= await db.UpdateDocument('admins', { _id: req.body._id }, data, {})
            if (!docdata.status) {
                res.send({status:false,docdata:docdata.message});
            } else {
                res.send({status:true,docdata: docdata});
            }
            // db.UpdateDocument('admins', { _id: req.body._id }, data, {}, function (err, docdata) {
            //     if (err) {
            //         res.send(err);
            //     } else {
            //         res.send(docdata);
            //     }
            // });

        }

        else {
            (async () => {
                try {
                    let getdata = await db.GetDocument('admins', { 'username': data.username }, {}, {});
                    console.log(getdata, "getdatagetdatagetdata");

                    if (getdata.doc.length != 0) {
                        return res.status(400).send({ message: 'Username is Already Exist' });
                    } else {
                        console.log("3333333333333333");
                        data.status = 1;
                        let result = await db.InsertDocument('admins', data);
                        res.send(result);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    res.status(500).send({ message: 'Internal Server Error' });
                }
            })();
            // console.log("222222222222222");
            // db.GetDocument('admins', { 'username': data.username }, {}, {}, function (err, getdata) {
            //     if (getdata.length != 0) {
            //         res.status(400).send({ message: 'Username is Already Exist' });
            //     } else {
            //         data.status = 1;
            //         db.InsertDocument('admins', data, function (err, result) {
            //             console.log(result)
            //             if (err) {
            //                 res.send(err);
            //             } else {
            //                 res.send(result);
            //             }
            //         });
            //     }
            // });
        }
    }

    router.save = async function (req, res) {
        var data = {
            activity: {}
        };
        data.username = req.body.username;
        data.name = req.body.name;
        data.email = req.body.email;
        data.role = 'admin';
        data.status = 1;
        if (req.body.password_confirm) {
            data.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
        }
        if (req.body._id) {
            const docdata = await db.UpdateDocument('admins', { _id: req.body._id }, data, {})
            if (!docdata) {
                res.send('err');
            } else {
                res.send(docdata.doc);
            }
            // db.UpdateDocument('admins', { _id: req.body._id }, data, {}, function (err, docdata) {
            //     if (err) {
            //         res.send(err);
            //     } else {
            //         res.send(docdata);
            //     }
            // });
        } else {
            const getdata = await db.GetDocument('admins', { 'username': req.body.username }, {}, {})
            if (getdata.doc.length != 0) {
                res.status(400).send({ message: 'Username is Already Exist' });
            } else {
                //  data.activity.created = new Date();
                data.status = 1;
                const result = await db.InsertDocument('admins', data)
                if (!result) {
                    res.send('err');
                } else {
                    res.send(result);
                }

                // db.InsertDocument('admins', data, function (err, result) {
                //     if (err) {
                //         res.send(err);
                //     } else {
                //         res.send(result);
                //     }
                // });
            }
            // db.GetDocument('admins', { 'username': req.body.username }, {}, {}, function (err, getdata) {
            //     if (getdata.length != 0) {
            //         res.status(400).send({ message: 'Username is Already Exist' });
            //     } else {
            //         //  data.activity.created = new Date();
            //         data.status = 1;
            //         db.InsertDocument('admins', data, function (err, result) {
            //             if (err) {
            //                 res.send(err);
            //             } else {
            //                 res.send(result);
            //             }
            //         });
            //     }
            // });
        }
    };

    router.edit = async function (req, res) {
        const data = await db.GetDocument('admins', { _id: req.body.id }, { password: 0 }, {})
        if (data.status === false) {
            res.send(err);
        } else {
            res.send(data.doc);
        }
        // db.GetDocument('admins', { _id: req.body.id }, { password: 0 }, {}, function (err, data) {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         res.send(data);
        //     }
        // });
    };
    router.allAdmins = async function getusers(req, res) {

        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }
        var data = {}
        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }
        const settings = await db.GetOneDocument('settings', { 'alias': 'general' }, {}, {})
        console.log(settings.doc, 'this is the settings 1');
        if (settings.status === false) {
            data.response = 'Configure your website settings'; res.send(data);
        } else {
            var format = "";
            var usersQuery = [
                { "$match": { status: { $ne: 0 }, "role": "admin" } },
                {
                    //  "$project": { createdAt: 1, updatedAt: 1, username: 1, role: 1, email: 1, activity: 1, time_zone: { $literal: timezone.tz("$createdAt", "America/Toronto") } }
                    "$project": { createdAt: 1, updatedAt: 1, username: 1, role: 1, email: 1, activity: 1 }
                },
                { "$project": { username: 1, document: "$$ROOT" } }, {
                    $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
                }
            ];

            var condition = { status: { $ne: 0 } };
            usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
            console.log(req.body, 'these are request body...');

            if (req.body.search) {
                condition['username'] = { $regex: new RegExp('^' + req.body.search, 'i') };
                var searchs = req.body.search;
                usersQuery.push({
                    "$match": {
                        $or: [
                            { "documentData.username": { $regex: searchs + '.*', $options: 'si' } },
                            { "documentData.email": { $regex: searchs + '.*', $options: 'si' } }
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
            const docdata = await db.GetAggregation('admins', usersQuery)
            if (docdata.length <= 0) {
                res.send([0, 0]);
            } else {
                for (var i = 0; i < docdata[0].documentData.length; i++) {
                    if (docdata[0].documentData[i] && typeof docdata[0].documentData[i].activity != 'undefined' && typeof docdata[0].documentData[i].activity.last_login != 'undefined') {
                        docdata[0].documentData[i].activity.last_login = settings.time_zone ? timezone.tz(docdata[0].documentData[i].activity.last_login, settings.time_zone).format(settings.date_format) : docdata[0].documentData[i].activity.last_login
                    }
                }
                res.send([docdata[0].documentData, docdata[0].count]);
            }
            // db.GetAggregation('admins', usersQuery, function (err, docdata) {
            //     if (err || docdata.length <= 0) {
            //         res.send([0, 0]);
            //     } else {
            //         for (var i = 0; i < docdata[0].documentData.length; i++) {
            //             if (docdata[0].documentData[i] && typeof docdata[0].documentData[i].activity != 'undefined' && typeof docdata[0].documentData[i].activity.last_login != 'undefined') {
            //                 docdata[0].documentData[i].activity.last_login = settings.time_zone? timezone.tz(docdata[0].documentData[i].activity.last_login, settings.time_zone).format(settings.date_format):docdata[0].documentData[i].activity.last_login
            //             }
            //         }
            //         res.send([docdata[0].documentData, docdata[0].count]);
            //     }
            // });
        }



        // async.waterfall([
        //     function (callback) {
        //         db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
        //             if (err || !settings) {
        //                 data.response = 'Configure your website settings'; res.send(data);
        //             } else {
        //                 callback(settings.settings);
        //             }
        //         });
        //     }], function (settings, callback) {
        //         var format = "";
        //         var usersQuery = [
        //             { "$match": { status: { $ne: 0 }, "role": "admin" } },
        //             {
        //                 //  "$project": { createdAt: 1, updatedAt: 1, username: 1, role: 1, email: 1, activity: 1, time_zone: { $literal: timezone.tz("$createdAt", "America/Toronto") } }
        //                 "$project": { createdAt: 1, updatedAt: 1, username: 1, role: 1, email: 1, activity: 1 }
        //             },
        //             { "$project": { username: 1, document: "$$ROOT" } }, {
        //                 $group: { "_id": null, "count": { "$sum": 1 }, "documentData": { $push: "$document" } }
        //             }
        //         ];

        //         var condition = { status: { $ne: 0 } };
        //         usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });

        //         if (req.body.search) {
        //             condition['username'] = { $regex: new RegExp('^' + req.body.search, 'i') };
        //             var searchs = req.body.search;
        //             usersQuery.push({
        //                 "$match": {
        //                     $or: [
        //                         { "documentData.username": { $regex: searchs + '.*', $options: 'si' } },
        //                         { "documentData.email": { $regex: searchs + '.*', $options: 'si' } }
        //                     ]
        //                 }

        //             });
        //             //search limit
        //             usersQuery.push({ $group: { "_id": null, "countvalue": { "$sum": 1 }, "documentData": { $push: "$documentData" } } });
        //             usersQuery.push({ $unwind: { path: "$documentData", preserveNullAndEmptyArrays: true } });
        //             if (req.body.limit && req.body.skip >= 0) {
        //                 usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        //             }
        //             usersQuery.push({ $group: { "_id": null, "count": { "$first": "$countvalue" }, "documentData": { $push: "$documentData" } } });
        //             //search limit
        //         }

        //         var sorting = {};
        //         if (req.body.sort) {
        //             var sorter = 'documentData.' + req.body.sort.field;
        //             sorting[sorter] = req.body.sort.order;
        //             usersQuery.push({ $sort: sorting });
        //         } else {
        //             sorting["documentData.createdAt"] = -1;
        //             usersQuery.push({ $sort: sorting });
        //         }

        //         if ((req.body.limit && req.body.skip >= 0) && !req.body.search) {
        //             usersQuery.push({ '$skip': parseInt(req.body.skip) }, { '$limit': parseInt(req.body.limit) });
        //         }
        //         if (!req.body.search) {
        //             usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
        //         }

        //         db.GetAggregation('admins', usersQuery, function (err, docdata) {
        //             if (err || docdata.length <= 0) {
        //                 res.send([0, 0]);
        //             } else {
        //                 for (var i = 0; i < docdata[0].documentData.length; i++) {
        //                     if (docdata[0].documentData[i] && typeof docdata[0].documentData[i].activity != 'undefined' && typeof docdata[0].documentData[i].activity.last_login != 'undefined') {
        //                         docdata[0].documentData[i].activity.last_login = settings.time_zone? timezone.tz(docdata[0].documentData[i].activity.last_login, settings.time_zone).format(settings.date_format):docdata[0].documentData[i].activity.last_login
        //                     }
        //                 }
        //                 res.send([docdata[0].documentData, docdata[0].count]);
        //             }
        //         });
        //     });

    }

    router.delete = function (req, res) {
        db.GetDocument('admins', { _id: { $in: req.body.ids } }, {}, {}, function (err, docdata) {
            console.log(err, docdata, "sssssssssssssss");

            if (err) {
                res.send({ status: 0, message: err.message });
            } else {
                if (docdata[0].role == 'subadmin') {
                    db.GetDocument('admins', { 'role': 'subadmin', 'status': 1 }, {}, {}, function (err, docdata) {
                        if (err) {
                            res.send({ status: 0, message: err.message });
                        } else {
                            if (docdata.length != 1) {
                                db.UpdateDocument('admins', { _id: { $in: req.body.ids } }, { status: 0 }, { multi: true }, function (err, result) {
                                    if (err) {
                                        res.send({ status: 0, message: err.message });
                                    } else {
                                        if (typeof req.body.ids == 'string') {
                                            io.of('/chat').emit('r2e_subadmin_logout', { subadmin_id: req.body.ids });
                                        } else {
                                            for (var i = 0; i < req.body.ids.length; i++) {
                                                io.of('/chat').emit('r2e_subadmin_logout', { subadmin_id: req.body.ids[i] });
                                            }
                                        }
                                        res.send({ status: 1, message: 'Successfully Deleted' });
                                    }
                                });
                            } else {
                                res.send({ status: 0, message: 'Atleast one subadmin need' });
                            }
                        }
                    });
                } else {
                    db.GetDocument('admins', { 'role': 'admin', 'status': 1 }, {}, {}, function (err, docdata) {
                        if (err) {
                            res.send(err);
                        } else {
                            if (docdata.length != 1) {
                                //  db.UpdateDocument('admins', { _id: { $in: req.body.delData } }, { 'status': 0 }, { multi: true }, function (err, data) {
                                db.DeleteDocument('admins', { _id: { $in: req.body.ids } }, function (err, data) {
                                    if (err) {
                                        res.send({ status: 0, message: err.message });
                                    } else {
                                        res.send({ status: 1, data: data, message: "Successfully Deleted" });
                                    }
                                });
                            } else {
                                res.send({ status: 0, message: 'Atleast one admin need to maintain the site' });
                            }
                        }
                    });
                }
            }
        });
    };

    router.allSubAdmins = async function getusers(req, res) {
        // var errors = req.validationErrors();
        // if (errors) {
        //     res.send(errors, 400);
        //     return;
        // }

        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }


        var usersQuery = [{
            "$match": { status: { $ne: 0 }, "role": "subadmin" }
        }, {
            $project: {
                createdAt: 1,
                updatedAt: 1,
                username: 1,
                sort_name: { $toLower: "$username" },
                role: 1,
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
            condition['username'] = { $regex: new RegExp('^' + req.body.search, 'i') };
            var searchs = req.body.search;
            usersQuery.push({
                "$match": {
                    $or: [
                        { "documentData.username": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.email": { $regex: searchs + '.*', $options: 'si' } }
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
        //usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });
        let settingsData = await db.GetOneDocument('settings', { alias: 'general' }, {}, {})

        console.log("settingsData", settingsData)
        // db.GetOneDocument('settings', { alias: 'general' }, {}, {}, function (err, settings)

        let subAdmin = await db.GetAggregation('admins', usersQuery)

        // console.log(subAdmin)
        //  res.send(subAdmin)

        if (subAdmin && subAdmin.length > 0) {
            // for (var i = 0; i < subAdmin[0].documentData.length; i++) {
            //     subAdmin[0].documentData[i].dname = '';
            //         if (subAdmin[0].documentData[i].activity) {



            //         //  var initialTimeZone  = timezone.tz(subAdmin[0].documentData[i].activity.last_login, settings.settings.time_zone)

            //         var finalOutPut = initialTimeZone.format();

            //         subAdmin[0].subAdmin[i].dname = finalOutPut

            //         }
            //     }
            res.send([subAdmin[0].documentData, subAdmin[0].count]);
        } else {
            res.send([0, 0]);
        }
        // db.GetAggregation('admins', usersQuery, function (err, docdata) {
        //     if (err || docdata.length <= 0) {
        //         res.send([0, 0]);
        //     } else {
        //         db.GetOneDocument('settings', { alias: 'general' }, {}, {}, function (err, settings) {
        //             if (err) {
        //                 res.send(err);
        //             } else {
        //                 for (var i = 0; i < docdata[0].documentData.length; i++) {
        //                     docdata[0].documentData[i].dname = '';
        //                     if (docdata[0].documentData[i].activity) {
        //                         docdata[0].documentData[i].dname = timezone.tz(docdata[0].documentData[i].activity.last_login, settings.settings.time_zone).format(settings.settings.date_format);
        //                     }
        //                 }
        //                 res.send([docdata[0].documentData, docdata[0].count]);
        //             }
        //         });

        //     }
        // });
    };

    router.deletedSubAdmins = function deletedSubAdmins(req, res) {
        var errors = req.validationErrors();
        if (errors) {
            res.send(errors, 400);
            return;
        }

        if (req.body.sort) {
            var sorted = req.body.sort.field;
        }

        var usersQuery = [{
            "$match": { status: { $eq: 0 }, "role": "subadmin" }
        }, {
            $project: {
                createdAt: 1,
                updatedAt: 1,
                username: 1,
                role: 1,
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
            condition['username'] = { $regex: new RegExp('^' + req.body.search, 'i') };
            var searchs = req.body.search;
            usersQuery.push({
                "$match": {
                    $or: [
                        { "documentData.username": { $regex: searchs + '.*', $options: 'si' } },
                        { "documentData.email": { $regex: searchs + '.*', $options: 'si' } }
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
        //usersQuery.push({ $group: { "_id": null, "count": { "$first": "$count" }, "documentData": { $push: "$documentData" } } });

        db.GetAggregation('admins', usersQuery, function (err, docdata) {
            if (err || docdata.length <= 0) {
                res.send([0, 0]);
            } else {
                db.GetOneDocument('settings', { alias: 'general' }, {}, {}, function (err, settings) {
                    if (err) {
                        res.send(err);
                    } else {
                        for (var i = 0; i < docdata[0].documentData.length; i++) {
                            docdata[0].documentData[i].dname = '';
                            if (docdata[0].documentData[i].activity) {
                                docdata[0].documentData[i].dname = timezone.tz(docdata[0].documentData[i].activity.last_login, settings.settings.time_zone).format(settings.settings.date_format);
                            }
                        }
                        res.send([docdata[0].documentData, docdata[0].count]);
                    }
                });

            }
        });
    };

    router.earningsDetails = function (req, res) {
        var data = {};
        db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, function (err, settings) {
            if (err || !settings) {
                res.send({
                    "status": 0,
                    "message": 'Invalid Provider, Please check your data'
                });
            } else {
                var CurrentDate = new Date();
                var StatsDate = CurrentDate.setMonth(CurrentDate.getMonth() - 6);
                var pipeline = [
                    { $match: { 'status': 7, 'booking_information.booking_date': { $gt: CurrentDate, $lt: new Date() } } },
                    { $project: { 'status': 1, 'booking_information': 1, 'invoice': 1, 'month': { $month: "$booking_information.booking_date" }, 'year': { $year: "$booking_information.booking_date" } } },
                    { $group: { '_id': { year: '$year', month: '$month' }, 'status': { $first: '$status' }, 'month': { $first: '$month' }, 'year': { $first: '$year' }, 'amount': { $sum: '$invoice.amount.grand_total' }, 'adminEarnings': { $sum: '$invoice.amount.admin_commission' } } },
                    { $group: { '_id': '$status', 'status': { $first: '$status' }, 'earnings': { $push: { 'month': '$month', 'year': '$year', 'amount': { $sum: '$amount' }, 'admin_earnings': { $sum: '$adminEarnings' } } }, 'total_earnings': { $sum: '$amount' } } }
                ];
                db.GetAggregation('task', pipeline, function (err, bookings) {
                    if (err) {
                        data.response = 'Unable to get your stats, Please check your data';
                        res.send(data);
                    } else {
                        data.status = '1';
                        data.response = {};
                        var earning = [];
                        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        var monthNamesval = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

                        if (bookings.length == 0) {
                            for (var i = 0; i < 6; i++) {
                                var amount = 0;
                                var admin_earnings = 0;
                                var CurrentDate = new Date();
                                var StatsDate = CurrentDate.setMonth(CurrentDate.getMonth() - i);
                                var StatsMonth = CurrentDate.getMonth() + 1;
                                var StatsYear = CurrentDate.getFullYear();
                                earning.push({ 'month': monthNames[StatsMonth - 1], 'monthval': monthNamesval[StatsMonth - 1], 'amount': 0, 'admin_earnings': 0 });
                            }
                            data.response.unit = '';
                            data.response.total_earnings = 0;
                            data.response.interval = 0;
                            data.response.earnings = earning;
                            data.response.max_earnings = 0;
                            data.response.currency_code = settings.settings.currency_code;
                            res.send(data);
                        }
                        else {
                            for (var i = 0; i < 6; i++) {
                                var amount = 0;
                                var admin_earnings = 0;
                                var CurrentDate = new Date();
                                var StatsDate = CurrentDate.setMonth(CurrentDate.getMonth() - i);
                                var StatsMonth = CurrentDate.getMonth() + 1;
                                var StatsYear = CurrentDate.getFullYear();
                                if (bookings[0]) {
                                    for (var j = 0; j < bookings[0].earnings.length; j++) {
                                        if (StatsMonth == bookings[0].earnings[j].month && StatsYear == bookings[0].earnings[j].year) {
                                            amount = bookings[0].earnings[j].amount;
                                            admin_earnings = bookings[0].earnings[j].admin_earnings;
                                        }
                                    }
                                }
                                if (amount != 0) {
                                    earning.push({ 'month': monthNames[StatsMonth - 1], 'monthval': monthNamesval[StatsMonth - 1], 'amount': (amount).toFixed(2), 'admin_earnings': (admin_earnings).toFixed(2) });
                                } else {
                                    earning.push({ 'month': monthNames[StatsMonth - 1], 'monthval': monthNamesval[StatsMonth - 1], 'amount': 0, 'admin_earnings': 0 });
                                }
                            }
                            data.status = '1';
                            data.response = {};
                            if (bookings[0]) {
                                if (bookings[0].total_earnings > 0) { data.response.unit = '(In Thousands)'; } else { data.response.unit = '' }
                                data.response.total_earnings = Math.round(bookings[0].total_earnings);
                                data.response.interval = 1;
                            } else {
                                data.response.unit = '';
                                data.response.total_earnings = 0;
                                data.response.interval = 0;
                            }
                            //  data.response.admin_earnings = bookings[0].admin_earnings;
                            data.response.earnings = earning;
                            data.response.max_earnings = Math.round(Math.max.apply(Math, earning.map(function (o) { return o.amount; })));
                            if (data.response.max_earnings > 0) { data.response.interval = Math.round(data.response.max_earnings / 10); }
                            data.response.currency_code = settings.settings.currency_code;
                            res.send(data);
                        }
                    }
                })
            }
        })
    };

    router.getAllDetails = function (req, res) {

        var currdate = moment(Date.now()).format('MM/DD/YYYY');
        var t1 = currdate + ' 00:00:00';
        var t2 = currdate + ' 23:59:59';
        var today = {
            'status': { "$in": [1, 2, 7, 8] },
            "createdAt": { '$gte': new Date(t1), '$lte': new Date(t2) }
        };
        var today_condition = [{ $match: today }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 1))
        var sdate = moment(yesterday).format('MM/DD/YYYY');
        var st1 = sdate + ' 00:00:00';
        var st2 = sdate + ' 23:59:59';
        var secday = {
            'status': { "$in": [1, 2, 7, 8] },
            "createdAt": { '$gte': new Date(st1), '$lte': new Date(st2) }
        };
        var sday_condition = [{ $match: secday }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 2))
        var tdate = moment(yesterday).format('MM/DD/YYYY');
        var tt1 = tdate + ' 00:00:00';
        var tt2 = tdate + ' 23:59:59';
        var thirdday = {
            'status': { "$in": [1, 2, 7, 8] },
            "createdAt": { '$gte': new Date(tt1), '$lte': new Date(tt2) }
        };
        var thirdday_condition = [{ $match: thirdday }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 3))
        var fdate = moment(yesterday).format('MM/DD/YYYY');
        var ft1 = fdate + ' 00:00:00';
        var ft2 = fdate + ' 23:59:59';
        var fourthdday = {
            'status': { "$in": [1, 2, 7, 8] },
            "createdAt": { '$gte': new Date(ft1), '$lte': new Date(ft2) }
        };
        var fourthdday_condition = [{ $match: fourthdday }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 4))
        var fifthdate = moment(yesterday).format('MM/DD/YYYY');
        var fit1 = fifthdate + ' 00:00:00';
        var fit2 = fifthdate + ' 23:59:59';
        var fifthdday = {
            'status': { "$in": [1, 2, 7, 8] },
            "createdAt": { '$gte': new Date(fit1), '$lte': new Date(fit2) }
        };
        var fifthdday_condition = [{ $match: fifthdday }, { "$project": { status: 1, order_id: 1 } }];



        var request = {};
        request.type = 'all';
        var query = { status: { $ne: 0 } };
        var condition = [
            { $match: query },
            { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, restaurantname: 1, status: 1, order_id: 1 } },
            { $sort: { "createdAt": -1 } },
            { $limit: 10 }
        ];


        var dashboardbox_condition = [
            { $match: query },
            { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, restaurantname: 1, status: 1, order_id: 1 } },
            { $sort: { "createdAt": -1 } }
        ];


        var order_condition =
            [
                { $match: query },
                { "$lookup": { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                { "$lookup": { from: "drivers", localField: "driver_id", foreignField: "_id", as: "driver" } },
                { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
                { "$lookup": { from: "restaurant", localField: "restaurant_id", foreignField: "_id", as: "restaurant" } },
                { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
                { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, restaurantname: 1, status: 1, order_id: 1, 'user.username': 1, 'user._id': 1, 'restaurant.restaurantname': 1, 'restaurant._id': 1, 'driver.username': 1, 'driver._id': 1 } },
                { $sort: { "createdAt": -1 } },
                { $limit: 10 }
            ];


        async.parallel({
            //chart count
            todayorders: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('orders', today_condition, function (err, todayorders) {
                        callback(err, todayorders);
                    });
                } else {
                    callback(null, null);
                }
            },
            secdayorders: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('orders', sday_condition, function (err, secdayorders) {
                        callback(err, secdayorders);
                    });
                } else {
                    callback(null, null);
                }
            },
            thirdayorders: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('orders', thirdday_condition, function (err, thirdayorders) {
                        callback(err, thirdayorders);
                    });
                } else {
                    callback(null, null);
                }
            },
            fourthorders: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('orders', fourthdday_condition, function (err, fourthorders) {
                        callback(err, fourthorders);
                    });
                } else {
                    callback(null, null);
                }
            },
            fifthorders: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('orders', fifthdday_condition, function (err, fifthorders) {
                        callback(err, fifthorders);
                    });
                } else {
                    callback(null, null);
                }
            },
            //only for count
            restaurantcount: function (callback) {
                if (request.type == 'all') {
                    db.GetCount('restaurant', { status: { $eq: 1 } }, function (err, restaurantcount) {
                        callback(err, restaurantcount);
                    });
                } else {
                    callback(null, null);
                }
            },
            driverscount: function (callback) {
                if (request.type == 'all') {
                    db.GetCount('drivers', { status: { $eq: 1 } }, function (err, driverscount) {
                        callback(err, driverscount);
                    });
                } else {
                    callback(null, null);
                }
            },
            userscount: function (callback) {
                if (request.type == 'all') {
                    db.GetCount('users', { status: { $eq: 1 } }, function (err, userscount) {
                        callback(err, userscount);
                    });
                } else {
                    callback(null, null);
                }
            },
            orderscount: function (callback) {
                if (request.type == 'all') {
                    db.GetCount('orders', { status: { $ne: 0 } }, function (err, orderscount) {
                        callback(err, orderscount);
                    });
                } else {
                    callback(null, null);
                }
            },

            //-----------------only for datas
            restaurant: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('restaurant', condition, function (err, restaurant) {
                        callback(err, restaurant);
                    });
                } else {
                    callback(null, null);
                }
            },
            users: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('users', condition, function (err, users) {
                        callback(err, users);
                    });
                } else {
                    callback(null, null);
                }
            },
            drivers: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('drivers', condition, function (err, drivers) {
                        callback(err, drivers);
                    });
                } else {
                    callback(null, null);
                }
            },
            orders: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('orders', order_condition, function (err, orders) {
                        callback(err, orders);
                    });
                } else {
                    callback(null, null);
                }
            },
            //only for box count 
            boxrestaurant: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('restaurant', dashboardbox_condition, function (err, boxrestaurant) {
                        callback(err, boxrestaurant);
                    });
                } else {
                    callback(null, null);
                }
            },
            boxusers: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('users', dashboardbox_condition, function (err, boxusers) {
                        callback(err, boxusers);
                    });
                } else {
                    callback(null, null);
                }
            },
            boxdrivers: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('drivers', dashboardbox_condition, function (err, boxdrivers) {
                        callback(err, boxdrivers);
                    });
                } else {
                    callback(null, null);
                }
            },
            boxorders: function (callback) {
                if (request.type == 'all') {
                    db.GetAggregation('orders', dashboardbox_condition, function (err, boxorders) {
                        callback(err, boxorders);
                    });
                } else {
                    callback(null, null);
                }
            }, site_details: function (callback) {
                if (request.type == 'all') {
                    db.GetOneDocument('settings', { 'alias': 'general' }, {}, {}, (err, ress) => {
                        callback(err, ress);
                    })
                }
                else {
                    callback(null, null);
                }
            }
        }, function (err, results) {
            if (err) {
                res.send({ count: 0, result: [] });
            } else {

                var users = results.users || '';
                var restaurant = results.restaurant || '';
                var drivers = results.drivers || '';
                var orders = results.orders || '';
                var site_details = results.site_details || {};

                var data = {};
                data.user_count = results.userscount || 0;
                data.rest_count = results.restaurantcount | 0;
                data.driver_count = results.driverscount || 0;
                data.orders_count = results.orderscount || 0;
                data.list = results;
                data.site_details = site_details;

                for (var j = 0; j < data.list.length; j++) {
                    if (data.list[j].role == '' || !data.list[j].role) {
                        data.list[j].role = 'order';
                    }
                }
                res.send(data)
            }
        });
    }


router.getusersrole = async function (req, res) {
  try {
    // 1️⃣ Get all totals concurrently
    const [vendorDocs, driverCount, contractCount, employeeCount,alertcount] = await Promise.all([
      db.GetDocument('vendor', { status: 1 }, {}, {}), // vendor docs
      db.GetCount('deals', { status: 1 }),             // driver total
      db.GetCount('contract', { status: 1 }),          // contract total
      db.GetCount('employee', { status: 1 }),
      db.GetCount('alert',{})           // employee total
    ]);

    // 2️⃣ Calculate vendor totals
    const vendorTotal = vendorDocs.doc.length;
    const totalNoOfBuses = vendorDocs.doc.reduce(
      (sum, v) => sum + (v.noOfBuses || 0),
      0
    );

    // 3️⃣ Combine all results
    const result = {
      totals: {
        vendorTotal,
        totalNoOfBuses,
        driverTotal: driverCount,
        contractTotal: contractCount,
        employeeTotal: employeeCount,
        alertcount:alertcount
      }
    };

    return res.status(200).send(result);
  } catch (err) {
    console.error('Error in getusersrole:', err);
    return res.status(500).send({ message: 'Internal server error', error: err });
  }
};



    router.AfterFilter = function (req, res) {

        var request = {};
        request.main_city = req.body.main_city || '';
        request.sub_city = req.body.sub_city || '';


        var query = { status: { $ne: 0 }, 'main_city': request.main_city };
        if (request.sub_city) { query = { status: { $ne: 0 }, 'main_city': request.main_city, 'sub_city': request.sub_city }; }
        var condition = [
            { $match: query },
            { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, restaurantname: 1, status: 1, order_id: 1 } },
            {
                $sort: {
                    "createdAt": -1
                }
            }
        ];

        var user_query = { status: { $ne: 0 } };
        var user_condition = [
            { $match: user_query },
            { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, status: 1 } },
            {
                $sort: {
                    "createdAt": -1
                }
            }
        ];


        var driver_query = { status: { $ne: 0 }, 'main_city': request.main_city };
        var driver_condition = [
            { $match: driver_query },
            { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, status: 1 } },
            {
                $sort: {
                    "createdAt": -1
                }
            }
        ];

        var order_condition =
            [
                { $match: query },
                { "$lookup": { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                { "$lookup": { from: "restaurant", localField: "restaurant_id", foreignField: "_id", as: "restaurant" } },
                { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
                { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, restaurantname: 1, status: 1, order_id: 1, 'user.username': 1, 'user._id': 1, 'restaurant.restaurantname': 1, 'restaurant._id': 1 } },
                { $sort: { "createdAt": -1 } }
                //{ $limit: 10 }
            ];


        // query for chart data starts
        var currdate = moment(Date.now()).format('MM/DD/YYYY');
        var t1 = currdate + ' 00:00:00';
        var t2 = currdate + ' 23:59:59';
        var today = {
            'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city,
            "createdAt": { '$gte': new Date(t1), '$lte': new Date(t2) }
        };
        if (request.sub_city) {
            today = {
                'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city, 'sub_city': request.sub_city,
                "createdAt": { '$gte': new Date(t1), '$lte': new Date(t2) }
            };
        }
        var today_condition = [{ $match: today }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 1))
        var sdate = moment(yesterday).format('MM/DD/YYYY');
        var st1 = sdate + ' 00:00:00';
        var st2 = sdate + ' 23:59:59';
        var secday = {
            'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city,
            "createdAt": { '$gte': new Date(st1), '$lte': new Date(st2) }
        };
        if (request.sub_city) {
            secday = {
                'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city, 'sub_city': request.sub_city,
                "createdAt": { '$gte': new Date(st1), '$lte': new Date(st2) }
            };
        }
        var sday_condition = [{ $match: secday }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 2))
        var tdate = moment(yesterday).format('MM/DD/YYYY');
        var tt1 = tdate + ' 00:00:00';
        var tt2 = tdate + ' 23:59:59';
        var thirdday = {
            'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city,
            "createdAt": { '$gte': new Date(tt1), '$lte': new Date(tt2) }
        };
        if (request.sub_city) {
            thirdday = {
                'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city, 'sub_city': request.sub_city,
                "createdAt": { '$gte': new Date(tt1), '$lte': new Date(tt2) }
            };
        }
        var thirdday_condition = [{ $match: thirdday }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 3))
        var fdate = moment(yesterday).format('MM/DD/YYYY');
        var ft1 = fdate + ' 00:00:00';
        var ft2 = fdate + ' 23:59:59';
        var fourthdday = {
            'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city,
            "createdAt": { '$gte': new Date(ft1), '$lte': new Date(ft2) }
        };

        if (request.sub_city) {
            fourthdday = {
                'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city, 'sub_city': request.sub_city,
                "createdAt": { '$gte': new Date(ft1), '$lte': new Date(ft2) }
            };
        }
        var fourthdday_condition = [{ $match: fourthdday }, { "$project": { status: 1, order_id: 1 } }];

        var today = new Date();
        var yesterday = new Date(today.setDate(today.getDate() - 4))
        var fifthdate = moment(yesterday).format('MM/DD/YYYY');
        var fit1 = fifthdate + ' 00:00:00';
        var fit2 = fifthdate + ' 23:59:59';
        var fifthdday = {
            'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city,
            "createdAt": { '$gte': new Date(fit1), '$lte': new Date(fit2) }
        };
        if (request.sub_city) {
            fifthdday = {
                'status': { "$in": [1, 2, 7, 8] }, 'main_city': request.main_city, 'sub_city': request.sub_city,
                "createdAt": { '$gte': new Date(fit1), '$lte': new Date(fit2) }
            };
        }
        var fifthdday_condition = [{ $match: fifthdday }, { "$project": { status: 1, order_id: 1 } }];
        //query for charts data ends

        async.parallel({
            //query for chart data starts
            todayorders: function (callback) {
                db.GetAggregation('orders', today_condition, function (err, todayorders) {
                    callback(err, todayorders);
                });
            },
            secdayorders: function (callback) {
                db.GetAggregation('orders', sday_condition, function (err, secdayorders) {
                    callback(err, secdayorders);
                });
            },
            thirdayorders: function (callback) {
                db.GetAggregation('orders', thirdday_condition, function (err, thirdayorders) {
                    callback(err, thirdayorders);
                });
            },
            fourthorders: function (callback) {
                db.GetAggregation('orders', fourthdday_condition, function (err, fourthorders) {
                    callback(err, fourthorders);
                });
            },
            fifthorders: function (callback) {
                db.GetAggregation('orders', fifthdday_condition, function (err, fifthorders) {
                    callback(err, fifthorders);
                });
            },
            //query for chart data ends
            restaurant: function (callback) {
                db.GetAggregation('restaurant', condition, function (err, restaurant) {
                    callback(err, restaurant);
                });
            },
            users: function (callback) {
                db.GetAggregation('users', user_condition, function (err, users) {
                    callback(err, users);
                });
            },
            drivers: function (callback) {
                db.GetAggregation('drivers', driver_condition, function (err, drivers) {
                    callback(err, drivers);
                });
            },
            orders: function (callback) {
                db.GetAggregation('orders', order_condition, function (err, orders) {
                    callback(err, orders);
                });
            }
        }, function (err, results) {
            if (err) {
                res.send({ count: 0, result: [] });
            } else {

                var users = results.users || '';
                var restaurant = results.restaurant || '';
                var drivers = results.drivers || '';
                var orders = results.orders || '';

                var data = {};
                data.user_count = users.length || 0;
                data.rest_count = restaurant.length | 0;
                data.driver_count = drivers.length || 0;
                data.orders_count = orders.length || 0;
                data.list = results;
                for (var j = 0; j < data.list.length; j++) {
                    if (data.list[j].role == '' || !data.list[j].role) {
                        data.list[j].role = 'order';
                    }
                }
                res.send(data)
            }
        });
    }


    
    router.changeStatus = async (req, res) => {
        var request = {};
        request.id = req.body.id;
        request.db = req.body.db;
        request.value = req.body.value;
        if (request.db == 'drivers') {
            const driverDetails = await db.GetOneDocument('drivers', { '_id': new mongoose.Types.ObjectId(request.id) }, {}, {})
            if (!driverDetails) {
                res.send({ status: 0, resp: err });
            } else {
                var old_status = driverDetails.status;
                const update = await db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value, old_status: old_status }, {})
                if (!update) {
                    res.send({ status: 0, resp: err });
                } else {
                    if (request.value == 2 || request.value == 0) {
                        io.of('/chat').emit('AdminRemoveDriver', { driverId: request.id, status: request.value });
                    }
                    res.send({ status: 1, resp: updated });
                }
                // db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value, old_status: old_status }, {}, (err, updated) => {
                //     if (err) {
                //         res.send({ status: 0, resp: err });
                //     } else {
                //         if (request.value == 2 || request.value == 0) {
                //             io.of('/chat').emit('AdminRemoveDriver', { driverId: request.id, status: request.value });
                //         }
                //         res.send({ status: 1, resp: updated });
                //     }
                // })
            }
            // db.GetOneDocument('drivers', { '_id': new mongoose.Types.ObjectId(request.id) }, {}, {}, function (err, driverDetails) {
            //     if (!driverDetails) {
            //         res.send({ status: 0, resp: err });
            //     } else {
            //         var old_status = driverDetails.status;
            //         db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value, old_status: old_status }, {}, (err, updated) => {
            //             if (err) {
            //                 res.send({ status: 0, resp: err });
            //             } else {
            //                 if (request.value == 2 || request.value == 0) {
            //                     io.of('/chat').emit('AdminRemoveDriver', { driverId: request.id, status: request.value });
            //                 }
            //                 res.send({ status: 1, resp: updated });
            //             }
            //         })
            //     }
            // })
        } else if (request.db == 'food') {


            if (req.body.for == 'expensive') {

                const expensiveupdate = await db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(req.body.id) }, { expensive: req.body.value }, {})

                const unexpensiveupdate = await db.UpdateAllDocument(request.db, { '_id': { $ne: new mongoose.Types.ObjectId(req.body.id) } }, { expensive: 0 }, {})
                if (!expensiveupdate) {
                    res.send({ status: 0, resp: "Something Went Wrong" });
                } else {
                    res.send({ status: 1, resp: expensiveupdate });
                }

                // console.log("comming in this file as in the if condition as always")

            } else {
                const update = await db.UpdateDocument(request.db, { '_id': { $exists: true } }, { expensive: 0 }, { multi: true })
                if (!update) {
                    res.send({ status: 0, resp: err });
                }
                else {
                    const updated = await db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { expensive: request.value }, {})
                    if (!updated) {
                        res.send({ status: 0, resp: err });
                    } else {
                        res.send({ status: 1, resp: updated });
                    }


                }
            }


        } else if (request.db == 'attributes') {
            var data = {}
            // {"price_details.attributes.parrent_id":"659fcb5ef1a657cd5fc5ad8e"}


            if (request.value == 1) {
                const updateUnitsactive = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {})
                if (updateUnitsactive && updateUnitsactive.doc && updateUnitsactive.doc.modifiedCount > 0) {
                    data.status = 1
                    data.message = "Status Updated Successfully"
                    data.result = updateUnitsactive
                    res.send(data)
                } else {
                    data.status = 0
                    data.message = "Something Went Wrong"
                    res.send(data)
                }
            } else {
                const units = await db.GetDocument('food', { "price_details.attributes.parrent_id": request.id }, {}, {})

                if (units && units.doc && units.doc.length > 0) {

                    data.status = 0
                    data.message = "Some products are mapped with the selected attribute. Please remove it from those products"
                    res.send(data)

                } else {

                    const updateUnits = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {})
                    if (updateUnits && updateUnits.doc && updateUnits.doc.modifiedCount > 0) {
                        data.status = 1
                        data.message = "Status Updated Successfully"
                        data.result = updateUnits
                        res.send(data)
                    } else {
                        data.status = 0
                        data.message = "Something Went Wrong"
                        res.send(data)
                    }


                }
            }











        } else if (request.db == 'timeslots') {

            var timeData = {}


            if (request.value == 1) {

                const updatedTimeslotactive = await db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {})

                if (updatedTimeslotactive && updatedTimeslotactive.doc && updatedTimeslotactive.doc.modifiedCount > 0) {
                    timeData.status = 1
                    timeData.message = "Timeslot status updated successfully"
                    timeData.result = updatedTimeslotactive
                    res.send(timeData)

                } else {
                    timeData.status = 0
                    timeData.message = "Something Went Wrong"
                    // timeData.result = updatedTimeslotactive
                    res.send(timeData)
                }

            } else {
                const timeslots = await db.GetDocument(request.db, { _id: { $ne: new mongoose.Types.ObjectId(request.id) }, status: 1 }, {}, {})
                if (timeslots && timeslots.doc && timeslots.doc.length > 0) {

                    const updatedTimeslot = await db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {})

                    if (updatedTimeslot && updatedTimeslot.doc && updatedTimeslot.doc.modifiedCount > 0) {
                        timeData.status = 1
                        timeData.message = "Timeslot status updated successfully"
                        timeData.result = updatedTimeslot
                        res.send(timeData)

                    } else {
                        timeData.status = 0
                        timeData.message = "Something Went Wrong"
                        // timeData.result = updatedTimeslotactive
                        res.send(timeData)
                    }



                } else {
                    timeData.status = 0
                    timeData.message = "Atleast one timeslot need to be active"
                    // timeData.result = updatedTimeslotactive
                    res.send(timeData)
                }
            }



        } else if (request.db == 'bannertype') {

            const updateDoc = await db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {})
            if (!updateDoc) {
                res.send({ status: 0, resp: err });
            } else {
                res.send({ status: 1, resp: updateDoc });
            }
        }
        else {
            const updated = await db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {})
            if (!updated) {
                res.send({ status: 0, resp: err });
            }
            else {
                if (request.db == 'rcategory') {
                    updateCategoryRelat(request.id, request.value);
                }
                if (request.db == 'scategory') {
                    updateSubcatgRelat(request.id, request.value);
                }
                if (request.db == 'users') {
                    if (request.value == 2 || request.value == 0) {
                        io.of('/chat').emit('admin_changed', { user_id: request.id, status: request.value });
                    }
                }
                if (request.db == 'users') {
                    if (request.value == 2 || request.value == 0) {
                        io.of('/chat').in(request.id).emit('r2e_user_logout', { userId: request.id, status: request.value });
                    }
                }

                if (request.db == 'restaurant') {
                    if (request.value == 2 || request.value == 0) {
                        io.of('/chat').emit('r2e_rest_logout', { rest_id: request.id, status: request.value });
                        // io.of('/chat').in(request.id).emit('r2e_rest_logout', { rest_id: request.id });
                    }
                }
                /* if (request.db == 'restaurant') {
                    if (request.value == 2 || request.value == 0) {
                        io.of('/chat').in(request.id).emit('r2e_rest_logout', { rest_id: request.id });
                    }
                } */
                res.send({ status: 1, resp: updated });
            }
            // db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {}, (err, updated) => {
            //     if (err) {
            //         res.send({ status: 0, resp: err });
            //     }
            //     else {
            //         if(request.db == 'rcategory'){
            //             updateCategoryRelat(request.id, request.value);
            //         }
            //         if(request.db == 'scategory'){
            //             updateSubcatgRelat(request.id, request.value);
            //         }
            //         if (request.db == 'users') {
            //             if (request.value == 2 || request.value == 0) {
            //                 io.of('/chat').emit('admin_changed', { user_id: request.id, status: request.value });
            //             }
            //         }
            //         if (request.db == 'users') {
            //             if (request.value == 2 || request.value == 0) {
            //                 io.of('/chat').in(request.id).emit('r2e_user_logout', { userId: request.id, status: request.value });
            //             }
            //         }

            //         if (request.db == 'restaurant') {
            //             if (request.value == 2 || request.value == 0) {
            //                 io.of('/chat').emit('r2e_rest_logout', { rest_id: request.id, status: request.value });
            //                 // io.of('/chat').in(request.id).emit('r2e_rest_logout', { rest_id: request.id });
            //             }
            //         }
            //         /* if (request.db == 'restaurant') {
            //             if (request.value == 2 || request.value == 0) {
            //                 io.of('/chat').in(request.id).emit('r2e_rest_logout', { rest_id: request.id });
            //             }
            //         } */
            //         res.send({ status: 1, resp: updated });
            //     }
            // })
        }
    }













    router.changeFlag = async (req, res) => {
        try {
            const { value, id } = req.body;

            if (!value || typeof value !== 'number') {
                return res.status(400).send({ status: 0, message: "Invalid or missing flag value" });
            }
            if (!req.body.db || typeof req.body.db !== 'string') {
                return res.status(400).send({ status: 0, message: "Invalid or missing database collection name" });
            }
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).send({ status: 0, message: "Invalid or missing ID" });
            }

            const updateFlag = await db.UpdateDocument(req.body.db,
                { _id: new mongoose.Types.ObjectId(id) },
                { $set: { flag: value } }, {}
            );

            if (updateFlag.nModified === 0 && !updateFlag.upserted) {
                return res.status(404).send({ status: 0, message: "Document not found or no changes made" });
            }

            return res.status(200).send({ status: 1, message: "Flag updated or created successfully" });
        } catch (error) {
            console.error("Error in changeFlag:", error);
            return res.status(500).send({ status: 0, message: "An error occurred while updating the flag" });
        }
    };









    async function updateCategoryRelat(id, value) {
        const updated = await db.UpdateDocument('food', { 'rcategory': new mongoose.Types.ObjectId(id) }, { status: value }, { multi: true })
        console.log("err, updated rcategory food +++++++++", updated)
        const update = await db.UpdateDocument('scategory', { 'rcategory': new mongoose.Types.ObjectId(id) }, { status: value }, { multi: true })
        console.log("err, updated rcategory scategory --------------", update)

        // db.UpdateDocument('food', { 'rcategory': new mongoose.Types.ObjectId(id) }, { status: value }, {multi: true}, (err, updated) => {
        // })
        // db.UpdateDocument('scategory', { 'rcategory': new mongoose.Types.ObjectId(id) }, { status: value }, {multi: true}, (err, updated) => {
        // })
    }
    async function updateSubcatgRelat(id, value) {
        const updated = await db.UpdateDocument('food', { 'scategory': new mongoose.Types.ObjectId(id) }, { status: value }, { multi: true })
        console.log("err, updated scategory food +++++++++", updated)

        // db.UpdateDocument('food', { 'scategory': new mongoose.Types.ObjectId(id) }, { status: value }, {multi: true}, (err, updated) => {
        // })
    }



    router.multichangeStatus = async (req, res) => {
        var request = {};
        request.ids = req.body.ids;
        request.db = req.body.db;
        request.value = req.body.value;
        console.log(req.body, "reqreqreqreqreqreq");


        if (request.db == 'attributes') {
            if (request.value == 1) {
                const updatedsss = await db.UpdateAllDocument(request.db, { '_id': { $in: req.body.ids } }, { status: request.value }, { multi: true })
                await db.UpdateAllDocument('food', { "price_details.attributes.parrent_id": { $in: request.ids } }, { status: 1 }, {})
                if (updatedsss && updatedsss.doc && updatedsss.doc.modifiedCount > 0) {
                    res.send({ status: 1, resp: updatedsss, message: request.db + " status changed." });
                } else {
                    res.send({ status: 0, message: "Something Went Wrong" });

                }
            } else {

                const getAttriproduct = await db.GetDocument('food', { "price_details.attributes.parrent_id": { $in: request.ids } }, {}, {})

                if (getAttriproduct && getAttriproduct.doc && getAttriproduct.doc.length > 0) {
                    res.send({ status: 0, message: "Some products are mapped with the selected attribute. Please remove it from those products" });
                } else {
                    const updateds = await db.UpdateAllDocument(request.db, { '_id': { $in: req.body.ids } }, { status: request.value }, { multi: true })

                    if (updateds && updateds.doc && updateds.doc.modifiedCount > 0) {
                        res.send({ status: 1, resp: updateds, message: request.db + " status changed." });
                    } else {
                        res.send({ status: 0, message: "Something Went Wrong" });

                    }
                }
            }

        } else if (request.db == 'bannertype') {
            const admin = await db.GetOneDocument('admins', { username: req.body.username }, {}, {})
            if (admin.status === false) {
                res.send({ status: false, message: 'Username you entered is not correct.' })
            } else {
                const hashedPassword = admin.doc.password;
                console.log(hashedPassword, 'hashedpassword');
                const isMatch = bcrypt.compareSync(req.body.password, hashedPassword);
                if (isMatch) {

                    // return
                    const updated = await db.UpdateAllDocument(request.db, { '_id': { $in: req.body.ids } }, { status: request.value }, { multi: true })
                    if (!updated) {
                        res.send({ status: 0, message: "Something Went Wrong" });
                    }
                    else {
                        res.send({ status: 1, resp: updated, message: request.db + " status changed." });
                    }
                } else {
                    return res.send({ status: false, message: 'The password is incorrect' })
                }


            }

        }
        else {
            const admin = await db.GetOneDocument('admins', { username: req.body.username }, {}, {})
            if (admin.status === false) {
                res.send({ status: false, message: 'Username you entered is not correct.' })
            } else {
                const hashedPassword = admin.doc.password;
                console.log(hashedPassword, 'hashedpassword');
                const isMatch = bcrypt.compareSync(req.body.password, hashedPassword);
                if (isMatch) {
                    const updated = await db.UpdateAllDocument(request.db, { '_id': { $in: req.body.ids } }, { status: request.value }, { multi: true })
                    if (!updated) {
                        res.send({ status: 0, message: "Something Went Wrong" });
                    }
                    else {
                        if (request.db == 'users') {
                            if (request.value == 2 || request.value == 0) {
                                request.ids.map(function (value) {
                                    io.of('/chat').emit('admin_changed', { user_id: value, status: request.value });
                                    io.of('/chat').in(request.id).emit('r2e_user_logout', { userId: value, status: request.value });
                                });
                            }
                        }

                        res.send({ status: 1, resp: updated, message: request.db + " status changed." });
                    }

                } else {
                    return res.send({ status: false, message: 'The password is incorrect' })
                }
            }


        }


        // db.UpdateDocument(request.db, { '_id': { $in: req.body.ids } }, { status: request.value }, { multi: true }, (err, updated) => {
        //     if (err) {
        //         res.send({ status: 0, resp: err, message: err.message });
        //     }
        //     else {
        //         if (request.db == 'users') {
        //             if (request.value == 2 || request.value == 0) {
        //                 request.ids.map(function (value) {
        //                     io.of('/chat').emit('admin_changed', { user_id: value, status: request.value });
        //                     io.of('/chat').in(request.id).emit('r2e_user_logout', { userId: value, status: request.value });
        //                 });
        //             }
        //         }

        //         res.send({ status: 1, resp: updated, message: request.db + " status changed." });
        //     }
        // });
    }

    router.changeFeatured = async (req, res) => {

        var request = {};
        request.id = req.body.id;
        request.db = req.body.db;
        request.value = req.body.value;
        var updateData = {};

        console.log(request, 'request');

        if (request.value == 1 && request.db == 'rcategory') {

            const featur_count = await db.GetCount(request.db, { $and: [{ 'feature': { $eq: 1 } }, { 'status': { $eq: 1 } }] });


            request.count = featur_count
            if (request.count < 10) {
                const feautu_doc = await db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {})

                console.log("-------------feautu_doc------------------", feautu_doc.doc)



                if (feautu_doc.doc.feature == 0) {
                    updateData = { feature: 1 };
                } else {
                    updateData = { feature: 0 };
                }
                const update_featur = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData)


                if (update_featur.doc.modifiedCount == 1) {
                    res.send({ status: 1, resp: "updated" });
                } else {
                    res.send({ status: 0, resp: "err" });
                }


            } else {
                res.send({ status: 0, resp: "error" });
            }

        }

        else if (request.db == 'food') {

            const food_doc = await db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {})
            if (food_doc && food_doc.doc.status) {
                if (food_doc.doc.status == 1) {
                    updateData = { status: 2 };
                } else {
                    updateData = { status: 1 };
                }

                const update_food = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData)
                if (update_food.doc.modifiedCount == 1) {
                    res.send({ status: 1, resp: "updated" });
                } else {
                    res.send({ status: 0, resp: "err" });
                }
            }
            // db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {}, function (err, userData) {
            //     if (userData.status == 1) {
            //         updateData = { status: 2 };
            //     } else {
            //         updateData = { status: 1 };
            //     }
            //     db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData, function (err, updated) {
            //         if (err) {
            //             console.log(err)
            //             res.send({ status: 0, resp: err });
            //         } else {
            //             res.send({ status: 1, resp: updated });
            //         }
            //     });
            // });
        } else if (request.db == 'tags') {
            const tag_doc = await db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {})
            if (tag_doc && tag_doc.doc.status) {
                if (tag_doc.doc.status == 1) {
                    updateData = { status: 2 };
                } else {
                    updateData = { status: 1 };
                }

                const update_tag = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData)
                if (update_tag) {
                    res.send({ status: 1, resp: "updated" });
                } else {
                    res.send({ status: 0, resp: "err" });
                }
            }
        } else if (request.db == 'deals') {
            const tag_doc = await db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {})
            if (tag_doc && tag_doc.doc.status) {
                if (tag_doc.doc.status == 1) {
                    updateData = { status: 2 };
                } else {
                    updateData = { status: 1 };
                }

                const update_tag = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData)
                if (update_tag) {
                    res.send({ status: 1, resp: "updated" });
                } else {
                    res.send({ status: 0, resp: "err" });
                }
            }
        }
        else if (request.db == 'offermanagement') {
            const tag_doc = await db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {});


            if (tag_doc && tag_doc.doc.status) {
                if (tag_doc.doc.status == 1) {
                    updateData = { status: 2 };
                } else {
                    updateData = { status: 1 };
                }

                const update_tag = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData)
                if (update_tag) {
                    res.send({ status: 1, resp: "updated" });
                } else {
                    res.send({ status: 0, resp: "err" });
                }
            }
        }
        else if (request.db == 'testimonial') {
            const tag_doc = await db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {});


            if (tag_doc && tag_doc.doc.status) {
                if (tag_doc.doc.status == 1) {
                    updateData = { status: 2 };
                } else {
                    updateData = { status: 1 };
                }

                const update_tag = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData)
                if (update_tag) {
                    res.send({ status: 1, resp: "updated" });
                } else {
                    res.send({ status: 0, resp: "err" });
                }
            }
        }
        else {
            request.count = 0;
            if (request.count < 2) {

                const get_feauture = await db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {})

                if (get_feauture) {
                    if (get_feauture.doc.feature == 0) {
                        updateData = { feature: 1 };
                    } else {
                        updateData = { feature: 0 };
                    }
                    const upda_feu = await db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData)
                    console.log("------------hello-----------------", upda_feu.doc.modifiedCount)
                    if (upda_feu.doc.modifiedCount == 1) {
                        res.send({ status: 1, resp: "updated" });
                    } else {
                        res.send({ status: 0, resp: "Feature was not updated" });
                    }

                }
                // db.GetOneDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, {}, {}, function (err, userData) {
                //     if (userData.feature == 0) {
                //         updateData = { feature: 1 };
                //     } else {
                //         updateData = { feature: 0 };
                //     }
                //     db.UpdateDocument(request.db, { _id: new mongoose.Types.ObjectId(request.id) }, updateData, function (err, updated) {
                //         if (err) {
                //             console.log(err)
                //             res.send({ status: 0, resp: err });
                //         } else {
                //             res.send({ status: 1, resp: updated });
                //         }
                //     });
                // });
            }
            else {
                res.send({ status: 0, resp: "error" });
            }
        }

    }

    router.changeAvailbility = (req, res) => {
        var request = {};
        request.id = req.body.id;
        request.db = req.body.db;
        request.value = req.body.value;
        db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { availability: request.value }, {}, (err, updated) => {
            if (err) {
                res.send({ status: 0, resp: err });
            }
            else {
                if (request.db == 'restaurant') {
                    if (request.value == 0 || request.value == 1) {
                        // io.of('/chat').in(request.id).emit('r2e_rest_online_change', { rest_id: request.id, value: request.value });
                        io.of('/chat').emit('r2e_rest_online_change', { rest_id: request.id, value: request.value });
                    }
                }
                res.send({ status: 1, resp: updated });
            }
        })
    }

    router.Restore = (req, res) => {
        var request = {};
        request.id = req.body.id;
        request.db = req.body.db;
        request.value = req.body.value;
        if (request.db == 'drivers') {
            db.GetOneDocument('drivers', { '_id': new mongoose.Types.ObjectId(request.id) }, {}, {}, function (err, driverDetails) {
                if (!driverDetails) {
                    res.send({ status: 0, resp: err });
                } else {
                    var old_status = request.value;
                    if (driverDetails.old_status != 'undefined' && driverDetails.old_status != 0) {
                        old_status = driverDetails.old_status
                    }
                    db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: old_status }, {}, (err, updated) => {
                        if (err) {
                            res.send({ status: 0, resp: err });
                        }
                        else {
                            res.send({ status: 1, resp: updated });
                        }
                    })
                }
            })
        } else {
            db.UpdateDocument(request.db, { '_id': new mongoose.Types.ObjectId(request.id) }, { status: request.value }, {}, (err, updated) => {
                if (err) {
                    res.send({ status: 0, resp: err });
                }
                else {
                    res.send({ status: 1, resp: updated });
                }
            })
        }
    }

    /*
      router.AfterFilter = function (req, res) {
     
            var request = {};
            request.main_city = req.body.main_city || '';
            request.sub_city = req.body.sub_city || '';
     
     
            var query = { status: { $ne: 0 }, 'main_city': request.main_city };
            if (request.sub_city) { query = { status: { $ne: 0 }, 'main_city': request.main_city, 'sub_city': request.sub_city }; }
            var condition = [
                { $match: query },
                { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, restaurantname: 1, status: 1, order_id: 1 } },
                {
                    $sort: {
                        "createdAt": -1
                    }
                }
            ];
     
            var user_query = { status: { $ne: 0 } };
            var user_condition = [
                { $match: user_query },
                { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, status: 1 } },
                {
                    $sort: {
                        "createdAt": -1
                    }
                }
            ];
     
     
            var driver_query = { status: { $ne: 0 }, 'main_city': request.main_city };
            var driver_condition = [
                { $match: driver_query },
                { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, status: 1 } },
                {
                    $sort: {
                        "createdAt": -1
                    }
                }
            ];
     
            var order_condition =
                [
                    { $match: query },
                    { "$lookup": { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
                    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                    { "$lookup": { from: "restaurant", localField: "restaurant_id", foreignField: "_id", as: "restaurant" } },
                    { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
                    { "$project": { _id: 1, username: 1, role: 1, createdAt: 1, restaurantname: 1, status: 1, order_id: 1, 'user.username': 1, 'restaurant.restaurantname': 1 } },
                    { $sort: { "createdAt": -1 } },
                    { $limit: 10 }
                ];
     
            async.parallel({
                restaurant: function (callback) {
                    db.GetAggregation('restaurant', condition, function (err, restaurant) {
                        callback(err, restaurant);
                    });
                },
                users: function (callback) {
                    db.GetAggregation('users', user_condition, function (err, users) {
                        callback(err, users);
                    });
                },
                drivers: function (callback) {
                    db.GetAggregation('drivers', driver_condition, function (err, drivers) {
                        callback(err, drivers);
                    });
                },
                orders: function (callback) {
                    db.GetAggregation('orders', order_condition, function (err, orders) {
                        callback(err, orders);
                    });
                }
            }, function (err, results) {
                if (err) {
                    res.send({ count: 0, result: [] });
                } else {
     
                    var users = results.users || '';
                    var restaurant = results.restaurant || '';
                    var drivers = results.drivers || '';
                    var orders = results.orders || '';
     
                    var data = {};
                    data.user_count = users.length || 0;
                    data.rest_count = restaurant.length | 0;
                    data.driver_count = drivers.length || 0;
                    data.orders_count = orders.length || 0;
                    data.list = results;
     
                    for (var j = 0; j < data.list.length; j++) {
                        if (data.list[j].role == '' || !data.list[j].role) {
                            data.list[j].role = 'order';
                        }
                    }
                    res.send(data)
                }
            });
        }    
    */
    return router;
};
