//"use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var async = require("async");
  var mongoose = require("mongoose");
  var moment = require("moment");
  var controller = {};

  /**
   * @route POST /fleet/add
   * @desc Add new fleet (vehicle/asset)
   */
   controller.saveFleet = async function (req, res) {
    try {
      const body = req.body;
         let documents = [];
if (body.documentType && req.uploadedFiles && req.uploadedFiles.webp) {
  documents.push({
    documentType: body.documentType,
    fileUrl: req.uploadedFiles.original // assuming single file
  });
}
      let fleetData = {
        vehicleName: body.vehicleName,
        type: body.type,
        assetCode: body.assetCode,
        registrationNo: body.registrationNo,
        insuranceNo: body.insuranceNo,
        manufactureDate: body.manufactureDate ? new Date(body.manufactureDate) : null,
        makerName: body.makerName,
        cubicCapacity: body.cubicCapacity,
        colour: body.colour,
        seatingCapacity: body.seatingCapacity,
        deployedContract: body.deployedContract || null,
        maintenance: {
          lastMaintenanceDate: body.lastMaintenanceDate ? new Date(body.lastMaintenanceDate) : null,
          nextMaintenanceDue: body.nextMaintenanceDue ? new Date(body.nextMaintenanceDue) : null,
          lastMaintenanceCost: body.lastMaintenanceCost || 0,
          remarks: body.maintenanceRemarks || ""
        },
        passingExpiry: body.passingExpiry ? new Date(body.passingExpiry) : null,
        documents:documents,
        status: body.status || 1
      };

      let result;

      if (body._id) {
        // --- Update Fleet ---
        result = await db.UpdateDocument(
          "fleet",
          { _id: new  mongoose.Types.ObjectId(body._id) },
          fleetData
        );
        return res.send({
          status: true,
          message: "Fleet updated successfully",
          data: result,
        });
      } else {
        // --- Add Fleet ---
        result = await db.InsertDocument("fleet", fleetData);
        return res.send({
          status: true,
          message: "Fleet added successfully",
          data: result,
        });
      }
    } catch (error) {
      console.log(error, "ERROR saveFleet");
      return res.send({
        status: false,
        message: "Something went wrong while saving fleet.",
      });
    }
  };

  /**
   * @route POST /fleet/list
   * @desc List fleets with filters
   */
  controller.listFleets = async function (req, res) {
    try {
      const { type, status, makerName, startDate, endDate, search } = req.body;

      let match = {};

      if (type) match.type = type;
      if (status) match.status = parseInt(status);
      if (makerName) match.makerName = makerName;

      // Manufacture date range filter
      if (startDate && endDate) {
        match.manufactureDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Search by vehicleName or registrationNo
      if (search) {
        match.$or = [
          { vehicleName: { $regex: search, $options: "i" } },
          { registrationNo: { $regex: search, $options: "i" } },
        ];
      }

      let pipeline = [
        { $match: match },
        {
          $project: {
            vehicleName: 1,
            type: 1,
            assetCode: 1,
            registrationNo: 1,
            insuranceNo: 1,
            manufactureDate: 1,
            makerName: 1,
            seatingCapacity: 1,
            deployedContract: 1,
            passingExpiry: 1,
            status: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const result = await db.GetAggregation("fleet", pipeline);

      return res.send({
        status: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR listFleets");
      return res.send({
        status: false,
        message: "Something went wrong while fetching fleets.",
      });
    }
  };

  /**
   * @route GET /fleet/view/:id
   * @desc Get fleet details by ID
   */
  controller.viewFleet = async function (req, res) {
    try {
      const { id } = req.body;

      const result = await db.GetOneDocument("fleet", { _id: new mongoose.Types.ObjectId(id) }, {}, {});

      if (!result) {
        return res.send({ status: false, message: "Fleet not found" });
      }

      return res.send({ status: true, data: result });
    } catch (error) {
      console.log(error, "ERROR viewFleet");
      return res.send({
        status: false,
        message: "Something went wrong while fetching fleet details.",
      });
    }
  };

  

  /**
   * @route DELETE /fleet/delete/:id
   * @desc Delete/Deactivate fleet (status = 0)
   */
  controller.deleteFleet = async function (req, res) {
    try {
      const { id } = req.body;

      const result = await db.UpdateDocument("fleet", { _id: new mongoose.Types.ObjectId(id) }, { status: 0 });

      return res.send({
        status: true,
        message: "Fleet deleted/deactivated successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR deleteFleet");
      return res.send({
        status: false,
        message: "Something went wrong while deleting fleet.",
      });
    }
  };

  /**
   * @route POST /fleet/maintenance-due
   * @desc List fleets with maintenance or passing due
   */
  controller.maintenanceDue = async function (req, res) {
    try {
      const today = new Date();

      let pipeline = [
        {
          $match: {
            $or: [
              { "maintenance.nextMaintenanceDue": { $lte: today } },
              { passingExpiry: { $lte: today } }
            ],
            status: 1
          },
        },
        {
          $project: {
            vehicleName: 1,
            registrationNo: 1,
            maintenance: 1,
            passingExpiry: 1,
          },
        },
      ];

      const result = await db.GetAggregation("fleet", pipeline);

      return res.send({
        status: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR maintenanceDue");
      return res.send({
        status: false,
        message: "Something went wrong while fetching due fleets.",
      });
    }
  };

  return controller;
};
