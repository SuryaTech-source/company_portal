"use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  /**
   * @route POST /contract/save
   * @desc Add or Update a contract
   */
  controller.saveContract = async function (req, res) {
    try {
      const body = req.body;

      let contractData = {
        clientName: body.clientName,
        contractId: body.contractId,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        busesDeployed: body.busesDeployed || [],
        driversDeployed: body.driversDeployed || [],
        contactOfficer: body.contactOfficer,
        contractType: body.contractType,
        invoicingDate: body.invoicingDate ? new Date(body.invoicingDate) : null,
        lastPayment: body.lastPayment ? new Date(body.lastPayment) : null,
        status: body.status || 1,
      };

      let result;

      if (body._id) {
        // --- Update Contract ---
        result = await db.UpdateDocument(
          "contract",
          { _id: new mongoose.Types.ObjectId(body._id) },
          contractData
        );
        return res.send({
          status: true,
          message: "Contract updated successfully",
          data: result,
        });
      } else {
        // --- Add Contract ---
        result = await db.InsertDocument("contract", contractData);
        return res.send({
          status: true,
          message: "Contract added successfully",
          data: result,
        });
      }
    } catch (error) {
      console.log(error, "ERROR saveContract");
      return res.send({
        status: false,
        message: "Something went wrong while saving contract.",
      });
    }
  };

  /**
   * @route POST /contract/list
   * @desc List contracts with filters
   */
  controller.listContracts = async function (req, res) {
    try {
      const { status, contractType, search, startDate, endDate } = req.body;

      let match = {};

      if (status) match.status = parseInt(status);
      if (contractType) match.contractType = contractType;

      // Filter by contract duration
      if (startDate && endDate) {
        match.startDate = { $gte: new Date(startDate) };
        match.endDate = { $lte: new Date(endDate) };
      }

      // Search by clientName or contractId
      if (search) {
        match.$or = [
          { clientName: { $regex: search, $options: "i" } },
          { contractId: { $regex: search, $options: "i" } },
        ];
      }

      let pipeline = [
        { $match: match },
        {
          $lookup: {
            from: "fleets",
            localField: "busesDeployed",
            foreignField: "_id",
            as: "fleetDetails",
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "driversDeployed",
            foreignField: "_id",
            as: "driverDetails",
          },
        },
        {
          $project: {
            clientName: 1,
            contractId: 1,
            startDate: 1,
            endDate: 1,
            contractType: 1,
            invoicingDate: 1,
            lastPayment: 1,
            status: 1,
            fleetDetails: { vehicleName: 1, registrationNo: 1 },
            driverDetails: { name: 1, employeeId: 1 },
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const result = await db.GetAggregation("contract", pipeline);

      return res.send({
        status: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR listContracts");
      return res.send({
        status: false,
        message: "Something went wrong while fetching contracts.",
      });
    }
  };


  controller.listActiveContracts = async function (req, res) {
  try {
    const result = await db.GetDocument(
      "contract",
      { status: 1 },
      { _id: 1, clientName: 1, contractId: 1, contractType: 1 },
      { createdAt: -1 }
    );

    return res.send({
      status: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.log(error, "ERROR listActiveContracts");
    return res.send({
      status: false,
      message: "Something went wrong while fetching active contracts."
    });
  }
};


  /**
   * @route POST /contract/view
   * @desc Get contract details by ID
   */
  controller.viewContract = async function (req, res) {
    try {
      const { id } = req.body;

      const result = await db.GetOneDocument(
        "contract",
        { _id: new mongoose.Types.ObjectId(id) },
        {},
        {}
      );

      if (!result) {
        return res.send({ status: false, message: "Contract not found" });
      }

      return res.send({ status: true, data: result });
    } catch (error) {
      console.log(error, "ERROR viewContract");
      return res.send({
        status: false,
        message: "Something went wrong while fetching contract details.",
      });
    }
  };

  /**
   * @route POST /contract/delete
   * @desc Delete/Deactivate contract (status = 0)
   */
  controller.deleteContract = async function (req, res) {
    try {
      const { id } = req.body;

      const result = await db.UpdateDocument(
        "contract",
        { _id: mongoose.Types.ObjectId(id) },
        { status: 0 }
      );

      return res.send({
        status: true,
        message: "Contract deleted/deactivated successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR deleteContract");
      return res.send({
        status: false,
        message: "Something went wrong while deleting contract.",
      });
    }
  };

  return controller;
};
