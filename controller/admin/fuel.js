// "use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  /**
   * @route POST /fuel/save
   * @desc Add or Update Fuel Record
   */
  controller.saveFuel = async (req, res) => {
  try {
    const body = req.body;

    if (!body.vehicleId || !body.driverId || !body.contractId) {
      return res.send({ status: false, message: "Vehicle, Driver, and Contract are required." });
    }

    if (body.startOdometer < 0 || body.endOdometer < 0) {
      return res.send({ status: false, message: "Invalid odometer values." });
    }

    if (body.fuelConsumed <= 0 || body.amountPaid < 0) {
      return res.send({ status: false, message: "Invalid fuel or amount values." });
    }

    const fuelData = {
      vehicle: new mongoose.Types.ObjectId(body.vehicleId),
      driver: new mongoose.Types.ObjectId(body.driverId),
      contract: new mongoose.Types.ObjectId(body.contractId),
      monthlyAllowance: Number(body.monthlyAllowance) || 0,
      actualUsage: Number(body.actualUsage) || 0,
      lastRechargeDate: body.prevDate ? new Date(body.prevDate) : null,
      remarks: body.remarks || "",
      startOdometer: Number(body.startOdometer),
      endOdometer: Number(body.endOdometer),
      amountPaid: Number(body.amountPaid),
      issuedBy: body.issuedBy || "",
      fuelConsumed: Number(body.fuelConsumed)
    };

    let result;

    if (body._id) {
      result = await db.UpdateDocument("fuel", { _id: new mongoose.Types.ObjectId(body._id) }, fuelData);
      return res.send({ status: true, message: "Fuel record updated successfully", data: result });
    } else {
      result = await db.InsertDocument("fuel", fuelData);
      return res.send({ status: true, message: "Fuel record added successfully", data: result });
    }
  } catch (error) {
    console.error("ERROR saveFuel:", error);
    return res.send({ status: false, message: "Something went wrong while saving fuel record." });
  }
};  

  /**
   * @route POST /fuel/view
   * @desc View single fuel record
   */
  controller.viewFuel = async function (req, res) {
  try {
    const { id } = req.body;

    const result = await db.GetOneDocument(
      "fuel",
      { _id: new mongoose.Types.ObjectId(id) },
      {},
      { populate: ["vehicle", "driver"] }
    );

    if (!result) {
      return res.send({ status: false, message: "Fuel record not found" });
    }

    return res.send({ status: true, data: result });
  } catch (error) {
    console.log(error, "ERROR viewFuel");
    return res.send({
      status: false,
      message: "Something went wrong while fetching fuel record.",
    });
  }
};


  /**
   * @route POST /fuel/list
   * @desc Get list of fuel records with filters
   */
 controller.listFuels = async function (req, res) {
  try {
    const { vehicle, driver, contract, startDate, endDate, search } = req.body;

    let match = {};
    if (vehicle) match.vehicle = new mongoose.Types.ObjectId(vehicle);
    if (driver) match.driver = new mongoose.Types.ObjectId(driver);
    if (contract) match.contract = new mongoose.Types.ObjectId(contract);

    if (startDate && endDate) {
      match.lastRechargeDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      match.$or = [
        { remarks: { $regex: search, $options: "i" } },
        // Allow searching by registration number, driver name, or contract name
        { "vehicleData.registrationNo": { $regex: search, $options: "i" } },
        { "driverData.fullName": { $regex: search, $options: "i" } },
        { "contractData.contractName": { $regex: search, $options: "i" } },
      ];
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "fleet",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicleData",
        },
      },
      { $unwind: { path: "$vehicleData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "employee",
          localField: "driver",
          foreignField: "_id",
          as: "driverData",
        },
      },
      { $unwind: { path: "$driverData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "contract",
          localField: "contract",
          foreignField: "_id",
          as: "contractData",
        },
      },
      { $unwind: { path: "$contractData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          contract: 1,
          monthlyAllowance: 1,
          actualUsage: 1,
          lastRechargeDate: 1,
          remarks: 1,
          startOdometer: 1,
          endOdometer: 1,
          amountPaid: 1,
          issuedBy: 1,
          fuelConsumed: 1,
          "vehicleData._id": 1,
          "vehicleData.vehicleName": 1,
          "vehicleData.registrationNo": 1,
          "driverData._id": 1,
          "driverData.fullName": 1,
          "driverData.employeeId": 1,
          "contractData.contractId": 1,
          "contractData._id": 1,
          "contractData.clientName": 1
        },
      },
      { $sort: { lastRechargeDate: -1 } },
    ];

    const result = await db.GetAggregation("fuel", pipeline);

    return res.send({
      status: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error(error, "ERROR listFuels");
    return res.send({
      status: false,
      message: "Something went wrong while fetching fuel records.",
    });
  }
};



controller.fuelUsageAnalytics = async function (req, res) {
  try {
    const { vehicle, driver, startDate, endDate, type = "monthly" } = req.body; 
    // type = "daily" | "monthly" | "yearly"

    let match = {};
    if (vehicle) match.vehicle = new mongoose.Types.ObjectId(vehicle);
    if (driver) match.driver = new mongoose.Types.ObjectId(driver);
    if (startDate && endDate) {
      match.lastRechargeDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let groupStage = {};
    let dateFormat = "";

    // 📊 Group based on the selected type
    if (type === "daily") {
      groupStage = {
        _id: {
          year: { $year: "$lastRechargeDate" },
          month: { $month: "$lastRechargeDate" },
          day: { $dayOfMonth: "$lastRechargeDate" },
        },
        totalFuelConsumed: { $sum: "$fuelConsumed" },
        totalAmountPaid: { $sum: "$amountPaid" },
        count: { $sum: 1 },
      };
      dateFormat = "%Y-%m-%d";
    } else if (type === "monthly") {
      groupStage = {
        _id: {
          year: { $year: "$lastRechargeDate" },
          month: { $month: "$lastRechargeDate" },
        },
        totalFuelConsumed: { $sum: "$fuelConsumed" },
        totalAmountPaid: { $sum: "$amountPaid" },
        count: { $sum: 1 },
      };
      dateFormat = "%Y-%m";
    } else if (type === "yearly") {
      groupStage = {
        _id: { year: { $year: "$lastRechargeDate" } },
        totalFuelConsumed: { $sum: "$fuelConsumed" },
        totalAmountPaid: { $sum: "$amountPaid" },
        count: { $sum: 1 },
      };
      dateFormat = "%Y";
    }

    // 📦 Pipeline for aggregation
    const pipeline = [
      { $match: match },
      { $group: groupStage },
      {
        $project: {
          _id: 0,
          label: {
            $dateToString: { format: dateFormat, date: "$_id.date" }
          },
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day",
          totalFuelConsumed: 1,
          totalAmountPaid: 1,
          count: 1
        }
      },
      { $sort: { year: 1, month: 1, day: 1 } },
    ];

    // Fix dateToString field for each grouping type
    if (type === "daily") {
      pipeline[2].$project.label = {
        $concat: [
          { $toString: "$year" },
          "-",
          { $cond: [{ $lt: ["$month", 10] }, { $concat: ["0", { $toString: "$month" }] }, { $toString: "$month" }] },
          "-",
          { $cond: [{ $lt: ["$day", 10] }, { $concat: ["0", { $toString: "$day" }] }, { $toString: "$day" }] }
        ]
      };
    } else if (type === "monthly") {
      pipeline[2].$project.label = {
        $concat: [
          { $toString: "$year" },
          "-",
          { $cond: [{ $lt: ["$month", 10] }, { $concat: ["0", { $toString: "$month" }] }, { $toString: "$month" }] }
        ]
      };
    } else if (type === "yearly") {
      pipeline[2].$project.label = { $toString: "$year" };
    }
  console.log(pipeline,'pipeline');
  
    const result = await db.GetAggregation("fuel", pipeline);
     
    return res.send({
      status: true,
      message: "Fuel usage analytics fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("ERROR fuelUsageAnalytics", error);
    return res.send({
      status: false,
      message: "Error while fetching fuel usage analytics",
    });
  }
};


// controller/fuel.js
controller.fuelEfficiencyAnalytics = async function (req, res) {
  try {
    const { vehicle, driver, startDate, endDate, type = "monthly" } = req.body;

    let match = {};
    if (vehicle) match.vehicle = new mongoose.Types.ObjectId(vehicle);
    if (driver) match.driver = new mongoose.Types.ObjectId(driver);
    if (startDate && endDate) {
      match.lastRechargeDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // --- choose grouping type ---
    let groupId = {};
    if (type === "daily") {
      groupId = {
        year: { $year: "$lastRechargeDate" },
        month: { $month: "$lastRechargeDate" },
        day: { $dayOfMonth: "$lastRechargeDate" },
      };
    } else if (type === "monthly") {
      groupId = {
        year: { $year: "$lastRechargeDate" },
        month: { $month: "$lastRechargeDate" },
      };
    } else if (type === "yearly") {
      groupId = { year: { $year: "$lastRechargeDate" } };
    }

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          distance: { $subtract: ["$endOdometer", "$startOdometer"] },
        },
      },
      {
        $group: {
          _id: groupId,
          totalFuelConsumed: { $sum: "$fuelConsumed" },
          totalDistance: { $sum: "$distance" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day",
          totalFuelConsumed: 1,
          totalDistance: 1,
          fuelEfficiency: {
            $cond: [
              { $eq: ["$totalDistance", 0] },
              0,
              { $divide: ["$totalFuelConsumed", "$totalDistance"] },
            ],
          },
        },
      },
      { $sort: { year: 1, month: 1, day: 1 } },
    ];

    const result = await db.GetAggregation("fuel", pipeline);

    // Build human-readable labels
    const formatted = result.map((r) => {
      let label = "";
      if (type === "daily") {
        const m = r.month.toString().padStart(2, "0");
        const d = r.day.toString().padStart(2, "0");
        label = `${r.year}-${m}-${d}`;
      } else if (type === "monthly") {
        const m = r.month.toString().padStart(2, "0");
        label = `${r.year}-${m}`;
      } else {
        label = `${r.year}`;
      }
      return { ...r, label };
    });

    return res.send({
      status: true,
      message: "Fuel efficiency analytics fetched successfully",
      data: formatted,
    });
  } catch (error) {
    console.error("ERROR fuelEfficiencyAnalytics", error);
    return res.send({
      status: false,
      message: "Error while fetching fuel efficiency analytics",
    });
  }
};

controller.costPerKmAnalytics = async function (req, res) {
  try {
    const { vehicle, driver, startDate, endDate, type = "monthly" } = req.body;

    let match = {};
    if (vehicle) match.vehicle = new mongoose.Types.ObjectId(vehicle);
    if (driver) match.driver = new mongoose.Types.ObjectId(driver);
    if (startDate && endDate) {
      match.lastRechargeDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // --- Grouping logic ---
    let groupId = {};
    if (type === "daily") {
      groupId = {
        year: { $year: "$lastRechargeDate" },
        month: { $month: "$lastRechargeDate" },
        day: { $dayOfMonth: "$lastRechargeDate" },
      };
    } else if (type === "monthly") {
      groupId = {
        year: { $year: "$lastRechargeDate" },
        month: { $month: "$lastRechargeDate" },
      };
    } else if (type === "yearly") {
      groupId = { year: { $year: "$lastRechargeDate" } };
    }

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          distance: { $subtract: ["$endOdometer", "$startOdometer"] },
        },
      },
      {
        $group: {
          _id: groupId,
          totalDistance: { $sum: "$distance" },
          totalAmountPaid: { $sum: "$amountPaid" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day",
          totalDistance: 1,
          totalAmountPaid: 1,
          costPerKm: {
            $cond: [
              { $eq: ["$totalDistance", 0] },
              0,
              { $divide: ["$totalAmountPaid", "$totalDistance"] },
            ],
          },
        },
      },
      { $sort: { year: 1, month: 1, day: 1 } },
    ];

    const result = await db.GetAggregation("fuel", pipeline);

    // Add readable labels
    const formatted = result.map((r) => {
      let label = "";
      if (type === "daily") {
        label = `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;
      } else if (type === "monthly") {
        label = `${r.year}-${String(r.month).padStart(2, "0")}`;
      } else {
        label = `${r.year}`;
      }
      return { ...r, label };
    });

    return res.send({
      status: true,
      message: "Cost per kilometer analytics fetched successfully",
      data: formatted,
    });
  } catch (error) {
    console.error("ERROR costPerKmAnalytics", error);
    return res.send({
      status: false,
      message: "Error while fetching cost per kilometer analytics",
    });
  }
};



  return controller;
};
