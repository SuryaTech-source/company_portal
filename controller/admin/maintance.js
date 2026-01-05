// "use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  /**
   * @route POST /maintenance/save
   * @desc Add or Update Maintenance Record
   */
  controller.saveMaintenance = async function (req, res) {
    try {
      const body = req.body;

      // 🧩 Auto calculate cost server-side
      let totalCost = 0;
      if (body.partsUsed && body.partsUsed.length > 0) {
        for (let p of body.partsUsed) {
          const partData = await db.GetOneDocument("sparepart", { _id: new mongoose.Types.ObjectId(p.part) });
          if (partData) {
            const price = partData.finalPrice || 0;
            const discount = partData.discount || 0;
            const discounted = price - (price * discount / 100);
            const finalPrice = discounted * (p.quantity || 1);

            totalCost += finalPrice;

            // save detailed values for history
            p.pricePerUnit = price;
            p.discount = discount;
            p.finalPrice = finalPrice;
          }
        }
      }

      totalCost += Number(body.extraCharges || 0);

      let maintenanceData = {
        vehicle: body.vehicle,
        driver: body.driver,
        maintenanceDate: body.maintenanceDate ? new Date(body.maintenanceDate) : new Date(),
        maintenanceType: body.maintenanceType,
        partsUsed: body.partsUsed || [],
        maintenanceCost: totalCost,
        remarks: body.remarks || "",
        extraCharges: body.extraCharges || 0
      };

      let result;
      if (body._id && body._id !== "null") {
        result = await db.UpdateDocument(
          "maintenance",
          { _id: new mongoose.Types.ObjectId(body._id) },
          maintenanceData
        );
      } else {
        result = await db.InsertDocument("maintenance", maintenanceData);
      }

      // 🧩 Deduct stock
      if (maintenanceData.partsUsed && maintenanceData.partsUsed.length > 0) {
        for (let item of maintenanceData.partsUsed) {
          await db.UpdateDocument(
            "sparepart",
            { _id: new mongoose.Types.ObjectId(item.part) },
            { $inc: { totalQuantity: -item.quantity } }
          );
        }
      }

      return res.send({
        status: true,
        message: body._id ? "Maintenance updated successfully" : "Maintenance added successfully",
        data: result,
      });

    } catch (error) {
      console.log(error, "ERROR saveMaintenance");
      return res.send({
        status: false,
        message: "Something went wrong while saving maintenance.",
      });
    }
  };


  /**
   * @route POST /maintenance/list
   * @desc Get Maintenance Records with filters
   */
  controller.listMaintenances = async function (req, res) {
    try {
      const { vehicle, driver, startDate, endDate, search } = req.body;

      let match = {};
      if (vehicle) match.vehicle = new mongoose.Types.ObjectId(vehicle);
      if (driver) match.driver = new mongoose.Types.ObjectId(driver);
      if (startDate && endDate) {
        match.maintenanceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      const pipeline = [
        { $match: match },

        // Vehicle details
        {
          $lookup: {
            from: "fleet",
            localField: "vehicle",
            foreignField: "_id",
            as: "vehicleData",
          },
        },
        { $unwind: { path: "$vehicleData", preserveNullAndEmptyArrays: true } },

        // Driver details
        {
          $lookup: {
            from: "employee",
            localField: "driver",
            foreignField: "_id",
            as: "driverData",
          },
        },
        { $unwind: { path: "$driverData", preserveNullAndEmptyArrays: true } },

        // Spare part details
        {
          $lookup: {
            from: "sparepart",
            localField: "partsUsed.part",
            foreignField: "_id",
            as: "partDetails",
          },
        },

        // Merge partDetails with partsUsed array
        {
          $addFields: {
            partsUsed: {
              $map: {
                input: "$partsUsed",
                as: "pu",
                in: {
                  $mergeObjects: [
                    "$$pu",
                    {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$partDetails",
                            as: "pd",
                            cond: { $eq: ["$$pd._id", "$$pu.part"] },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $project: {
            maintenanceDate: 1,
            maintenanceType: 1,
            maintenanceCost: 1,
            extraCharges: 1,
            remarks: 1,
            vehicleData: { vehicleName: 1, registrationNo: 1, _id: 1 },
            driverData: { fullName: 1, _id: 1 },
            partsUsed: {
              part: 1,
              name: 1,
              partNumber: 1,
              quantity: 1,
              pricePerUnit: 1,
              discount: 1,
              finalPrice: 1,
            },
          },
        },

        { $sort: { maintenanceDate: -1 } },
      ];

      const result = await db.GetAggregation("maintenance", pipeline);

      return res.send({
        status: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR listMaintenances");
      return res.send({
        status: false,
        message: "Something went wrong while fetching maintenance records.",
      });
    }
  };


  /**
   * @route POST /maintenance/delete
   * @desc Delete Maintenance Record and Restore Stock
   */
  controller.deleteMaintenance = async function (req, res) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.send({ status: false, message: "Maintenance ID is required." });
      }

      // 1. Get the maintenance record to know parts used
      const maintenanceData = await db.GetOneDocument("maintenance", { _id: new mongoose.Types.ObjectId(id) }, {}, {});

      if (!maintenanceData) {
        return res.send({ status: false, message: "Maintenance record not found." });
      }

      // 2. Restore stock
      if (maintenanceData.partsUsed && maintenanceData.partsUsed.length > 0) {
        for (let item of maintenanceData.partsUsed) {
          if (item.part && item.quantity) {
            await db.UpdateDocument(
              "sparepart",
              { _id: new mongoose.Types.ObjectId(item.part) },
              { $inc: { totalQuantity: item.quantity } } // Increase stock back
            );
          }
        }
      }

      // 3. Delete the record
      const result = await db.DeleteDocument("maintenance", { _id: new mongoose.Types.ObjectId(id) });

      return res.send({
        status: true,
        message: "Maintenance record deleted and stock restored successfully.",
        data: result
      });

    } catch (error) {
      console.log(error, "ERROR deleteMaintenance");
      return res.send({
        status: false,
        message: "Something went wrong while deleting maintenance record.",
        error: error
      });
    }
  };



  return controller;
};
