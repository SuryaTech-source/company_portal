"use strict";

const { log } = require("async");

module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  /**
   * @route POST /attendance/save
   * @desc Add or Update Attendance
   */
//   controller.saveAttendance = async function (req, res) {
//     try {
//       const body = req.body;

//       if (!body.employee || !body.date || !body.status) {
//         return res.send({ status: false, message: "Missing required fields" });
//       }

//       let attendanceDate = new Date(body.date);
//       attendanceDate.setHours(0, 0, 0, 0); // normalize date

//       let data = {
//         employee: new mongoose.Types.ObjectId(body.employee),
//         date: attendanceDate,
//         status: body.status,
//         remarks: body.remarks || "",
//       };

//       let result;

//       if (body._id && body._id !== "null") {
//         // ---- Update existing attendance ----
//         result = await db.UpdateDocument(
//           "attendance",
//           { _id: new mongoose.Types.ObjectId(body._id) },
//           data
//         );
//       } else {
//         // ---- Upsert (if attendance for employee already exists that date, update it) ----
//         result = await db.UpdateDocument(
//           "attendance",
//           { employee: data.employee, date: data.date },
//           data,
//           { upsert: true }
//         );
//       }

//       return res.send({
//         status: true,
//         message: body._id ? "Attendance updated successfully" : "Attendance saved successfully",
//         data: result,
//       });
//     } catch (error) {
//       console.log(error, "ERROR saveAttendance");
//       return res.send({
//         status: false,
//         message: "Something went wrong while saving attendance.",
//       });
//     }
//   };
controller.saveAttendance = async function (req, res) {
  try {
    const { employee, date, status, remarks = "" } = req.body;
    console.log(req.body, "body");

    if (!employee || !date || !status) {
      return res.send({ status: false, message: "Missing required fields" });
    }

    const employeeId = new mongoose.Types.ObjectId(employee);
    const targetDate = new Date(date);

    // Check if attendance document exists for employee
    let existingAttendance = await db.GetOneDocument("attendance", { employee: employeeId }, {}, {});
    console.log(existingAttendance, "existingAttendance");
    
    if (!existingAttendance.status) {
      // Create new document for this employee
      const newDoc = {
        employee: employeeId,
        records: [{ date: targetDate, status, remarks }],
      };
      const result = await db.InsertDocument("attendance", newDoc);
      return res.send({ status: true, message: "Attendance created successfully", data: result });
    }

    // If it exists, update or replace record for same date
    const recordExists = existingAttendance.doc.records.some(
      (r) => r.date.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10)
    );

    let updateQuery;
    if (recordExists) {
      // Replace record for same date
      updateQuery = {
        $set: {
          "records.$[elem].status": status,
          "records.$[elem].remarks": remarks,
        },
      };
      const options = {
        arrayFilters: [{ "elem.date": targetDate }],
        new: true,
      };
      await db.UpdateDocumentWithOptions("attendance", { employee: employeeId }, updateQuery, options);
      return res.send({ status: true, message: "Attendance updated successfully" });
    } else {
      // Push new record for new date
      await db.UpdateDocument("attendance", { employee: employeeId }, { $push: { records: { date: targetDate, status, remarks } } });
      return res.send({ status: true, message: "Attendance added successfully" });
    }

  } catch (err) {
    console.log("ERROR saveAttendance", err);
    return res.send({ status: false, message: "Error saving attendance" });
  }
};

  
/**
   * @route POST /attendance/list
   * @desc List Attendance with filters, pagination, sorting, search
   */


 controller.listAttendance = async function (req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder = "desc",
    } = req.body;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔹 Sorting
    let sort = {};
    if (sortBy === "date") sort["records.date"] = sortOrder === "asc" ? 1 : -1;
    else if (sortBy === "employee") sort["employeeData.fullName"] = sortOrder === "asc" ? 1 : -1;
    else sort["records.date"] = -1; // default: latest date first

    // 🔹 Base pipeline
    let pipeline = [
      {
        $lookup: {
          from: "employee",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      { $unwind: { path: "$employeeData", preserveNullAndEmptyArrays: true } },
      {
        $unwind: {
          path: "$records",
          preserveNullAndEmptyArrays: true, // ✅ Keeps employees even if records is []
        },
      },
    ];

    // 🔹 Match filters
    let match = {};
    if (search) {
      match.$or = [
        { "records.remarks": { $regex: search, $options: "i" } },
        { "employeeData.fullName": { $regex: search, $options: "i" } },
      ];
    }
    if (status) match["records.status"] = status;
    if (startDate && endDate) {
      match["records.date"] = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (Object.keys(match).length > 0) pipeline.push({ $match: match });

    // 🔹 Project
    pipeline.push({
  $project: {
    _id: 1,
    date: "$records.date",
    status: "$records.status",
    remarks: "$records.remarks",
    employeeId: "$employeeData.employeeId",   // flatten
    employeeName: "$employeeData.fullName",   // flatten
    employeeRefId: "$employeeData._id",       // keep ref for updates
  },
});

    // 🔹 Apply sorting + pagination
    pipeline.push({ $sort: sort }, { $skip: skip }, { $limit: parseInt(limit) });

    // 🔹 Data + total count
    const [data, total] = await Promise.all([
      db.GetAggregation("attendance", pipeline),
      db.GetAggregation("attendance", [
        {
          $lookup: {
            from: "employee",
            localField: "employee",
            foreignField: "_id",
            as: "employeeData",
          },
        },
        { $unwind: { path: "$employeeData", preserveNullAndEmptyArrays: true } },
        {
          $unwind: {
            path: "$records",
            preserveNullAndEmptyArrays: true,
          },
        },
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        { $count: "total" },
      ]),
    ]);

    return res.send({
      status: true,
      count: total.length > 0 ? total[0].total : 0,
      page: parseInt(page),
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.log(error, "ERROR listAttendance");
    return res.send({
      status: false,
      message: "Something went wrong while fetching attendance.",
    });
  }
};





// Bulk mark attendance for multiple employees
controller.bulkMarkAttendance = async function (req, res) {
  try {
    const { employeeIds = [], date, status, remarks = "" } = req.body;
    if (!employeeIds.length || !date || !status) {
      return res.send({ status: false, message: "Employee IDs, date, and status are required" });
    }

    const targetDate = new Date(date);

    const operations = employeeIds.map(empId => ({
      updateOne: {
        filter: { employee: new mongoose.Types.ObjectId(empId) },
        update: {
          $setOnInsert: { employee: new mongoose.Types.ObjectId(empId) },
          // First remove existing record for this date
          $pull: { records: { date: targetDate } }
        },
        upsert: true
      }
    }));

    // Run $pull pass (remove duplicates)
    await db.BulkWrite("attendance", operations);

    // Run $push pass (insert new record)
    const pushOps = employeeIds.map(empId => ({
      updateOne: {
        filter: { employee: new mongoose.Types.ObjectId(empId) },
        update: {
          $push: {
            records: { date: targetDate, status, remarks }
          }
        }
      }
    }));

    await db.BulkWrite("attendance", pushOps);

    return res.send({ status: true, message: "Bulk attendance updated successfully" });
  } catch (err) {
    console.log(err, "ERROR bulkMarkAttendance");
    return res.send({ status: false, message: "Error updating bulk attendance" });
  }
};



// Mark ALL employees as present for today
controller.markAllPresentToday = async function (req, res) {
  try {
    const today = new Date();
    const todayDate = new Date(today.toISOString().split("T")[0]); // normalize date (no time)

    // Fetch all employees
    const employees = await db.GetDocument("employee", { status: 1 }, {}, {});
    if (!employees.length) {
      return res.send({ status: false, message: "No active employees found" });
    }

    // Loop and insert/update attendance
    const operations = employees.map(emp => ({
      updateOne: {
        filter: { employee: emp._id },
        update: {
          $setOnInsert: { employee: emp._id },
          $pull: { records: { date: todayDate } }
        },
        upsert: true
      }
    }));
    await db.BulkWrite("attendance", operations);

    const pushOps = employees.map(emp => ({
      updateOne: {
        filter: { employee: emp._id },
        update: {
          $push: { records: { date: todayDate, status: "P", remarks: "" } }
        }
      }
    }));
    await db.BulkWrite("attendance", pushOps);

    return res.send({ status: true, message: "All employees marked present for today" });
  } catch (err) {
    console.log(err, "ERROR markAllPresentToday");
    return res.send({ status: false, message: "Error marking all employees present" });
  }
};


 controller.getDailyReport = async function (req, res) {
  try {
    const { date } = req.body;
    const targetDate = new Date(date);

    let result = await db.GetAggregation("attendance", [
      { $unwind: "$records" },
      { $match: { "records.date": targetDate } },
      {
        $lookup: {
          from: "employee",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      { $unwind: "$employeeData" },
      {
        $project: {
          "employeeData.fullName": 1,
          "employeeData.employeeId": 1,
          status: "$records.status",
          remarks: "$records.remarks",
        },
      },
    ]);

    return res.send({ status: true, data: result });
  } catch (err) {
    console.log(err, "ERROR getDailyReport");
    return res.send({ status: false, message: "Error fetching daily report" });
  }
};


controller.getMonthlyReport = async function (req, res) {
  try {
    const { month, year } = req.body;
    let start = new Date(year, month - 1, 1);
    let end = new Date(year, month, 0); // last day

    let result = await db.GetAggregation("attendance", [
      { $unwind: "$records" },
      { $match: { "records.date": { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { employee: "$employee", status: "$records.status" },
          days: { $sum: 1 }
        }
      }
    ]);

    return res.send({ status: true, data: result });
  } catch (err) {
    console.log(err, "ERROR getMonthlyReport");
    return res.send({ status: false, message: "Error fetching monthly report" });
  }
};


  controller.saveCustomerPayment = async function (req, res) {
  try {
    const body = req.body;

    const data = {
      client: body.client, // ref to Client
      contractId: body.contractId,
      invoiceNo: body.invoiceNo,
      dueDate: new Date(body.dueDate),
      amountPaid: body.amountPaid,
      status: body.status,
      balance: body.balance,
      remarks: body.remarks || "",
    };

    let result;
    if (body._id) {
      result = await db.UpdateDocument("customerPayment", { _id: body._id }, data);
    } else {
      result = await db.InsertDocument("customerPayment", data);
    }

    return res.send({
      status: true,
      message: body._id ? "Customer payment updated" : "Customer payment saved",
      data: result,
    });
  } catch (err) {
    console.log("ERROR saveCustomerPayment", err);
    return res.send({ status: false, message: "Error saving customer payment" });
  }
};


controller.saveVendorPayment = async function (req, res) {
  try {
    const body = req.body;

    const data = {
      vendor: body.vendor, // ref to Vendor
      contractId: body.contractId,
      invoiceNo: body.invoiceNo,
      dueDate: new Date(body.dueDate),
      amountPaid: body.amountPaid,
      status: body.status,
      balance: body.balance,
      remarks: body.remarks || "",
    };

    let result;
    if (body._id) {
      result = await db.UpdateDocument("vendorPayment", { _id: body._id }, data);
    } else {
      result = await db.InsertDocument("vendorPayment", data);
    }

    return res.send({
      status: true,
      message: body._id ? "Vendor payment updated" : "Vendor payment saved",
      data: result,
    });
  } catch (err) {
    console.log("ERROR saveVendorPayment", err);
    return res.send({ status: false, message: "Error saving vendor payment" });
  }
};


controller.listCustomerPayment = async function (req, res) {
  try {
    let { page, pagesize, search, status, startDate, endDate, sortField, sortOrder } = req.query;

    page = parseInt(page) || 1;
    pagesize = parseInt(pagesize) || 10;
    sortOrder = sortOrder === "desc" ? -1 : 1;

    let query = {};
    if (status) query.status = status;
    if (startDate && endDate) {
      query.dueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      query.$or = [
        { invoiceNo: { $regex: search, $options: "i" } },
        { contractId: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    let sortObj = {};
    if (sortField) sortObj[sortField] = sortOrder;
    else sortObj.createdAt = -1;

    const result = await db.GetAggregation("customerpayment", [
      { $match: query },
      {
        $lookup: {
          from: "customers",
          localField: "client",
          foreignField: "_id",
          as: "clientData",
        },
      },
      { $unwind: { path: "$clientData", preserveNullAndEmptyArrays: true } },
      { $sort: sortObj },
      { $skip: (page - 1) * pagesize },
      { $limit: pagesize },
    ]);

    const count = await db.GetCount("customerpayment", query);

    return res.send({ status: true, count, data: result });
  } catch (err) {
    console.log(err, "ERROR listCustomerPayment");
    return res.send({ status: false, message: "Error fetching customer payments" });
  }
};

// 🔹 List Vendor Payments
controller.listVendorPayment = async function (req, res) {
  try {
    let { page, pagesize, search, status, startDate, endDate, sortField, sortOrder } = req.query;

    page = parseInt(page) || 1;
    pagesize = parseInt(pagesize) || 10;
    sortOrder = sortOrder === "desc" ? -1 : 1;

    let query = {};
    if (status) query.status = status;
    if (startDate && endDate) {
      query.dueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      query.$or = [
        { invoiceNo: { $regex: search, $options: "i" } },
        { contractId: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    let sortObj = {};
    if (sortField) sortObj[sortField] = sortOrder;
    else sortObj.createdAt = -1;

    const result = await db.GetAggregation("vendorpayment", [
      { $match: query },
      {
        $lookup: {
          from: "vendors",
          localField: "vendor",
          foreignField: "_id",
          as: "vendorData",
        },
      },
      { $unwind: { path: "$vendorData", preserveNullAndEmptyArrays: true } },
      { $sort: sortObj },
      { $skip: (page - 1) * pagesize },
      { $limit: pagesize },
    ]);

    const count = await db.GetCount("vendorpayment", query);

    return res.send({ status: true, count, data: result });
  } catch (err) {
    console.log(err, "ERROR listVendorPayment");
    return res.send({ status: false, message: "Error fetching vendor payments" });
  }
};



  return controller;
};
