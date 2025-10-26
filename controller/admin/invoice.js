// "use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var moment = require("moment");
  var controller = {};

  /**
   * @route POST /invoice/add
   * @desc Add / Update Invoice
   */
  controller.saveInvoice = async function (req, res) {
    try {
      const body = req.body;

      // prepare invoice data
      let invoiceData = {
        invoiceNo: body.invoiceNo,
        date: body.date ? new Date(body.date) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        clientName: body.clientName,
        contract: body.contract ? new mongoose.Types.ObjectId(body.contract) : null,
        items: body.items || [],
        status: body.status || "Pending",
        remarks: body.remarks || "",
        totalAmount: body.totalAmount || 0,
        paymentDetails: {
          bankName: body.paymentDetails?.bankName || "",
          accountNo: body.paymentDetails?.accountNo || "",
        },
      };

      let result;
      if (body._id) {
        // --- Update Invoice ---
        result = await db.UpdateDocument(
          "invoice",
          { _id: mongoose.Types.ObjectId(body._id) },
          invoiceData
        );
        return res.send({
          status: true,
          message: "Invoice updated successfully",
          data: result,
        });
      } else {
        // --- Add Invoice ---
        result = await db.InsertDocument("invoice", invoiceData);
        return res.send({
          status: true,
          message: "Invoice added successfully",
          data: result,
        });
      }
    } catch (error) {
      console.log(error, "ERROR saveInvoice");
      return res.send({
        status: false,
        message: "Something went wrong while saving invoice.",
      });
    }
  };

  /**
   * @route POST /invoice/list
   * @desc List invoices with filters + pagination
   */
  controller.listInvoices = async function (req, res) {
  try {
    const {
      page = 1, limit = 10, search = "", status, startDate, endDate, sortBy = "date", sortOrder = "desc"
    } = req.body;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let match = {};
    if (status) match.status = status;
    if (startDate && endDate) match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

    if (search) {
      match.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { invoiceNo: { $regex: search, $options: "i" } },
        { 'contractDetails.contractId': { $regex: search, $options: 'i' } }
      ];
    }

    let sort = {};
    if (sortBy === "date") sort.date = sortOrder === "asc" ? 1 : -1;
    else if (sortBy === "client") sort.clientName = sortOrder === "asc" ? 1 : -1;
    else sort.date = -1;

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "contract",
          localField: "contractId",
          foreignField: "_id",
          as: "contractDetails"
        }
      },
      { $unwind: { path: "$contractDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          clientName: 1,
          invoiceNo: 1,
          date: 1,
          dueDate: 1,
          status: 1,
          remarks: 1,
          totalAmount: 1,
          items: 1,
          'contractDetails.contractId': 1,
          'contractDetails.clientName': 1
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const [data, totalA] = await Promise.all([
      db.GetAggregation("invoice", pipeline),
      db.GetAggregation("invoice", [{ $match: match }, { $count: "total" }])
    ]);

    const total = (totalA && totalA[0]) ? totalA[0].total : 0;

    return res.send({
      status: true,
      count: total,
      page: parseInt(page),
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.log(error, "ERROR listInvoices");
    return res.send({
      status: false,
      message: "Something went wrong while fetching invoices.",
    });
  }
};


  /**
   * @route GET /invoice/view/:id
   * @desc Get invoice details by ID
   */
  controller.viewInvoice = async function (req, res) {
    try {
      const { id } = req.body;

      const result = await db.GetOneDocument(
        "invoice",
        { _id: new mongoose.Types.ObjectId(id) },
        {},
        {}
      );

      if (!result || !result.status) {
        return res.send({ status: false, message: "Invoice not found" });
      }

      return res.send({ status: true, data: result.doc });
    } catch (error) {
      console.log(error, "ERROR viewInvoice");
      return res.send({
        status: false,
        message: "Something went wrong while fetching invoice details.",
      });
    }
  };

  /**
   * @route DELETE /invoice/delete/:id
   * @desc Delete invoice (soft delete = status=0)
   */
  controller.deleteInvoice = async function (req, res) {
    try {
      const { id } = req.params;

      const result = await db.UpdateDocument(
        "invoice",
        { _id: new mongoose.Types.ObjectId(id) },
        { status: "Deleted" }
      );

      return res.send({
        status: true,
        message: "Invoice deleted successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR deleteInvoice");
      return res.send({
        status: false,
        message: "Something went wrong while deleting invoice.",
      });
    }
  };

  controller.updateInvoiceStatus = async function (req, res) {
  try {
    const { _id, status } = req.body;
    if (!_id || !status) {
      return res.send({ status: false, message: "Invoice ID and status required" });
    }

    const result = await db.UpdateDocument(
      "invoice",
      { _id: new mongoose.Types.ObjectId(_id) },
      { status: status }
    );

    return res.send({ status: true, message: "Invoice status updated", data: result });
  } catch (error) {
    console.log(error, "ERROR updateInvoiceStatus");
    return res.send({ status: false, message: "Error updating invoice status" });
  }
};


  return controller;
};
