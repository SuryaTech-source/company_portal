"use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  /**
   * @route POST /fleet/assign
   * @desc Assign fleet to driver (with validation & history)
   */
  controller.assignFleet = async function (req, res) {
    try {
      const body = req.body;

      if (!body.fleetId || !body.driverId) {
        return res.send({ status: false, message: "Fleet and Driver are required" });
      }

      const fleetId = new mongoose.Types.ObjectId(body.fleetId);
      const driverId = new mongoose.Types.ObjectId(body.driverId);

      // --- Validation 1: Check if fleet already has active assignment ---
      const activeAssignment = await db.GetOneDocument(
        "fleetAssignment",
        { fleetId, status: 1 },
        {},
        {}
      );

      if (activeAssignment.status && activeAssignment.doc) {
        // Same driver trying to reassign same fleet?
        if (activeAssignment.doc.driverId.toString() === driverId.toString()) {
          return res.send({
            status: false,
            message: "This fleet is already assigned to the same driver."
          });
        } else {
          return res.send({
            status: false,
            message: "This fleet is already assigned to another driver. Unassign first."
          });
        }
      }

      // --- Validation 2: Check if driver already has the same fleet (historical check) ---
      const existingHistory = await db.GetOneDocument(
        "fleetAssignment",
        { fleetId, driverId, status: { $in: [1, 2] } },
        {},
        {}
      );

      if (existingHistory.status && existingHistory.doc && existingHistory.doc.status === 1) {
        return res.send({
          status: false,
          message: "This driver already has this fleet assigned."
        });
      }

      // --- Create new assignment ---
      const data = {
        fleetId,
        driverId,
        dateAssigned: body.dateAssigned ? new Date(body.dateAssigned) : new Date(),
        odometerReadingStart: body.odometerReadingStart || 0,
        contractId: body.contractId || "",
        remarks: body.remarks || "",
        status: 1
      };

      const result = await db.InsertDocument("fleetAssignment", data);

      // Mark fleet as deployed
      await db.UpdateDocument("fleet", { _id: fleetId }, { isDeployed: true });

      return res.send({
        status: true,
        message: "Fleet assigned successfully",
        data: result
      });
    } catch (err) {
      console.log("ERROR assignFleet", err);
      return res.send({ status: false, message: "Error while assigning fleet" });
    }
  };

  /**
   * @route POST /fleet/unassign
   * @desc Unassign fleet (keeps history)
   */
  controller.unassignFleet = async function (req, res) {
    try {
      const { assignmentId, odometerReadingEnd, remarks, dateUnassigned } = req.body;

      if (!assignmentId) return res.send({ status: false, message: "Assignment ID required" });

      const nowDate = dateUnassigned ? new Date(dateUnassigned) : new Date();

      const result = await db.UpdateDocument(
        "fleetAssignment",
        { _id: new mongoose.Types.ObjectId(assignmentId) },
        {
          status: 2,
          dateUnassigned: nowDate,
          odometerReadingEnd: odometerReadingEnd || 0,
          remarks: remarks || "",
          updatedAt: new Date()
        }
      );

      // Update fleet as available
      if (result.status) {
        const assignment = result.doc;
        await db.UpdateDocument("fleet", { _id: assignment.fleetId }, { isDeployed: false });
      }

      return res.send({
        status: true,
        message: "Fleet unassigned successfully",
        data: result
      });
    } catch (err) {
      console.log("ERROR unassignFleet", err);
      return res.send({ status: false, message: "Error while unassigning fleet" });
    }
  };

  /**
   * @route POST /fleet/assignment-edit
   * @desc Edit assignment details (dates, odometer) even after unassignment
   */
  controller.editAssignment = async function (req, res) {
    try {
      const { assignmentId, dateAssigned, dateUnassigned, odometerReadingStart, odometerReadingEnd, remarks } = req.body;

      if (!assignmentId) return res.send({ status: false, message: "Assignment ID required" });

      const updateData = {
        updatedAt: new Date(),
        remarks: remarks || ""
      };

      if (dateAssigned) updateData.dateAssigned = new Date(dateAssigned);
      if (dateUnassigned) updateData.dateUnassigned = new Date(dateUnassigned);
      if (odometerReadingStart !== undefined) updateData.odometerReadingStart = odometerReadingStart;
      if (odometerReadingEnd !== undefined) updateData.odometerReadingEnd = odometerReadingEnd;

      const result = await db.UpdateDocument(
        "fleetAssignment",
        { _id: new mongoose.Types.ObjectId(assignmentId) },
        updateData
      );

      return res.send({
        status: true,
        message: "Assignment updated successfully",
        data: result
      });
    } catch (err) {
      console.log("ERROR editAssignment", err);
      return res.send({ status: false, message: "Error while updating assignment" });
    }
  };

  /**
   * @route POST /fleet/assignments
   * @desc Paginated list with driver/fleet info
   */
  controller.listFleetAssignments = async function (req, res) {
    try {
      const { page = 1, limit = 10, search = "", sortBy = "dateAssigned", sortOrder = "desc" } = req.body;
      const skip = (page - 1) * limit;

      const match = { status: { $in: [1, 2] } };

      if (search) {
        match.$or = [
          { "fleet.vehicleName": { $regex: search, $options: "i" } },
          { "fleet.registrationNo": { $regex: search, $options: "i" } },
          { "driver.fullName": { $regex: search, $options: "i" } },
          { "contract.contractId": { $regex: search, $options: "i" } } // updated to search in contract details
        ];
      }

      const pipeline = [
        {
          $lookup: {
            from: "fleet",
            localField: "fleetId",
            foreignField: "_id",
            as: "fleet"
          }
        },
        { $unwind: "$fleet" },
        {
          $lookup: {
            from: "employee",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        },
        { $unwind: "$driver" },
        {
          $lookup: {
            from: "contract", // join with contract collection
            localField: "contractId",
            foreignField: "_id",
            as: "contract"
          }
        },
        { $unwind: { path: "$contract", preserveNullAndEmptyArrays: true } },
        { $match: match },
        {
          $project: {
            vehicleName: "$fleet.vehicleName",
            registrationNo: "$fleet.registrationNo",
            assetCode: "$fleet.assetCode",
            assignedTo: "$driver.fullName",
            driverId: "$driver._id",
            contractId: "$contract.contractId", // ✅ show actual contractId string
            clientName: "$contract.clientName", // optional extra field
            dateAssigned: 1,
            dateUnassigned: 1,
            odometerReadingStart: 1,
            odometerReadingEnd: 1,
            remarks: 1,
            status: 1
          }
        },
        { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];

      const data = await db.GetAggregation("fleetAssignment", pipeline);
      const totalCount = await db.GetCount("fleetAssignment", { status: { $in: [1, 2] } });

      return res.send({
        status: true,
        count: totalCount,
        page,
        data
      });
    } catch (err) {
      console.log("ERROR listFleetAssignments", err);
      return res.send({ status: false, message: "Error while listing assignments" });
    }
  };

  /**
   * @route POST /fleet/assignment-stats
   * @desc Dashboard summary
   */
  controller.fleetAssignmentCounts = async function (req, res) {
    try {
      const totalVehicles = await db.GetCount("fleet", { status: { $ne: 0 } });
      const deployed = await db.GetCount("fleetAssignment", { status: 1 });
      const maintenance = await db.GetCount("fleet", {
        "maintenance.nextMaintenanceDue": { $lte: new Date() },
        status: 1
      });
      console.log(totalVehicles, deployed, maintenance);

      return res.send({
        status: true,
        data: {
          totalVehicles,
          deployed,
          maintenance
        }
      });
    } catch (err) {
      console.log("ERROR fleetAssignmentCounts", err);
      return res.send({ status: false, message: "Error while fetching counts" });
    }
  };




  return controller;
};
