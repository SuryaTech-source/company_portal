var db = require('../../model/mongodb.js');


// This is the function which returns result or error for gets the doccument 
async function GetDocument(model, query, projection, extension,) {
    try {
        var query = await db[model].find(query, projection, extension.options);
        if (extension.populate) {
            query.populate(extension.populate);
        }
        if (extension.sort) {
            query = query.sort(extension.sort);
        }
        // console.log('query..... ',query);
        if (query && query != null) {
            let settings = {
                status: true,
                doc: query
            }
            return settings
        } else {
            let err = {
                status: false,
                doc: "No data found"
            }
            return err
        }
    } catch (er) {
        // console.log('m err ',er);
        let data = {
            status: false,
            message: 'Something went wrong' + er
        }
        return data;
    }
    // if (extension.populate) {
    //     query.populate(extension.populate);
    // }
    // if (extension.sort) {
    //     query.sort(extension.sort);
    // }
    // query.exec(function (err, docs) {
    //     if (extension.count) {
    //         query.count(function (err, docs) {
    //             callback(err, docs);
    //         });
    //     } else {
    //         callback(err, docs);
    //     }
    // });
}



// This is the function for getting the result or err for get one doccument 
async function GetOneDocument(model, query, projection, extension) {
    // console.log(model, query, projection, extension,);
    try {
        var query = await db[model].findOne(query, projection, extension.options);
        if (query && query != null) {
            let settings = {
                status: true,
                doc: query
            }
            return settings;
        }
        else {
            let err = {
                status: false,
                doc: "Data Not found"
            }
            return err
        }

    } catch (e) {
        let data = {
            status: false,
            message: 'Something went wrong' + e
        }
        return data
    }
    // console.log(query);
    // if(query){
    //     callback(query)
    // }
    // callback(err, docs);
    // if (extension.populate) {
    //     query.populate(extension.populate);
    // }
    // if (extension.sort) {
    //     query.sort(extension.sort);
    // }
    // query.exec(function (err, docs) {
    //   
    // });
}

// async function GetAggregation(model, query) {
//     var qry = db[model].aggregate(query);
//     qry.options = { allowDiskUse: true };  /* for sort exceeding error */
//     qry.collation({ locale: 'en_US', caseLevel: true, caseFirst: 'upper' }); /* for checking upper case and lower cse */
//     console.log(query,'query++++');
//     qry.exec(function (err, docs) {
//         callback(err, docs);
//     });
// }

async function GetAggregation(model, query) {
    try {
        var qry = db[model].aggregate(query);
        qry.option({ allowDiskUse: true }); /* for sort exceeding error */
        qry = qry.collation({ locale: 'en_US', caseLevel: true, caseFirst: 'upper' }); /* for checking upper case and lower case */
        const docs = await qry.exec();
        return docs;
    } catch (err) {
        throw err;

    }
}




async function InsertDocument(model, docs) {
    try {
        const res = await db[model].create(docs);
        return res;
    } catch (err) {
        console.error(err);
        return err;
    }
}


// update the doccument delete 
async function DeleteDocument(model, criteria) {
    try {
        const del = await db[model].deleteMany(criteria)
        const data = {
            status: true,
            doc: del
        }
        if (del) {
            return data
        }
    } catch (err) {
        const data = {
            status: false,
            doc: err
        }
        return data
    }
    // db[model].deleteMany(criteria).then((res)=>{
    //     const data={
    //         status:true,
    //         doc:res
    //     }
    //     console.log(data,'daata of db');
    //     return data
    // }).catch((err)=>{
    //     const data={
    //         status:false,
    //         doc:err
    //     }
    //     console.log(data,'data of the dataaa');
    //     return data

    // })
    // db[model].remove(criteria, function (err, docs) {
    //     callback(err, docs);
    // });
}

// update doccument updated
async function UpdateDocument(model, criteria, doc, options) {
    try {
        const update = await db[model].updateOne(criteria, doc, options)
        console.log(update, 'this is the update from the mongodb');
        if (update && update != null) {
            let result = {
                status: true,
                doc: update
            }
            return result;
        } else {
            let result = {
                status: false,
                doc: 'Updation has error'
            }
            return result;
        }
    } catch (err) {
        let data = {
            status: false,
            message: 'Something went wrong' + err
        }
        return data
    }

    // update.then((res)=>{
    //     console.log(res,'resres');
    //     if(res){
    //         const data={
    //             status:true,
    //             doc:res
    //         }
    //         return data
    //     }
    // }).catch((err)=>{
    //     console.log(err,'err');
    //     const data={
    //         status:false,
    //         doc:err
    //     }
    //     return data
    // })
    // db[model].update(criteria, doc, options, function (err, docs) {
    //     callback(err, docs);
    // });
}


async function UpdateAllDocument(model, criteria, doc, options) {
    try {
        const update = await db[model].updateMany(criteria, doc, options)
        console.log(update, 'this is the update from the mongodb');
        if (update && update != null) {
            let result = {
                status: true,
                doc: update
            }
            return result;
        } else {
            let result = {
                status: false,
                doc: 'Updation has error'
            }
            return result;
        }
    } catch (err) {
        let data = {
            status: false,
            message: 'Something went wrong' + err
        }
        return data
    }


}

async function GetCount(model, conditions = {}) {
    try {
        const count = await db[model].countDocuments(conditions);
        return count;
    } catch (err) {
        console.error("Error in GetCount:", err);
        throw err;
    }
}


function PopulateDocument(model, docs, options, callback) {
    db[model].populate(docs, options, function (err, docs) {
        callback(err, docs);
    });
}

function RemoveDocument(model, criteria, callback) {
    db[model].remove(criteria, function (err, docs) {
        callback(err, docs);
    });
}

const GetDoc = async (model, query, projection, extension) => {
    try {
        const Query = db[model].find(query, projection, extension.options);

        if (extension.populate) {
            Query.populate(extension.populate);
        }
        if (extension.sort) {
            Query.sort(extension.sort);
        }

        if (extension.count) {
            return await Query.countDocuments();
        } else {
            return await Query.exec();
        }
    } catch (err) {
        throw err;
    }
}





async function BulkWriteDocument(model, operations, options = {}) {
    try {
        const result = await db[model].bulkWrite(operations, options);
        if (result) {
            return {
                status: true,
                doc: result
            };
        } else {
            return {
                status: false,
                doc: "Bulk write failed"
            };
        }
    } catch (err) {
        console.error("BulkWrite Error:", err);
        return {
            status: false,
            message: "Something went wrong during bulk write: " + err
        };
    }
}


module.exports = {
    "GetDocument": GetDocument,
    "GetOneDocument": GetOneDocument,
    "InsertDocument": InsertDocument,
    "DeleteDocument": DeleteDocument,
    "UpdateDocument": UpdateDocument,
    "GetAggregation": GetAggregation,
    "PopulateDocument": PopulateDocument,
    "RemoveDocument": RemoveDocument,

    "GetCount": GetCount,
    "GetDoc": GetDoc,
    "UpdateAllDocument": UpdateAllDocument,
    "BulkWrite": BulkWriteDocument
};