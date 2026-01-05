// "use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  /**
   * @route POST /vendor/save
   * @desc Add or Update a vendor
   */
  controller.saveVendor = async function (req, res) {
    try {
      const body = req.body;

      // 🔍 Check for duplicate Vendor Name
      if (body.vendorName) {
        const duplicateCheck = await db.GetOneDocument(
          "vendor",
          {
            vendorName: { $regex: new RegExp(`^${body.vendorName.trim()}$`, "i") },
            status: { $ne: 0 }, // Check active vendors
          },
          {},
          {}
        );

        if (duplicateCheck.status && duplicateCheck.doc) {
          const existing = duplicateCheck.doc;
          // If creating new OR updating diff ID
          if (!body.id || existing._id.toString() !== body.id) {
            return res.send({ status: false, message: "Vendor name already exists." });
          }
        }
      }



      // ✅ Drivers & Buses (Manual Entry)
      let drivers = [];
      if (body.drivers) {
        let driversArray = typeof body.drivers === "string"
          ? JSON.parse(body.drivers)
          : body.drivers;

        drivers = driversArray.map((drv, index) => {
          // Find uploaded doc for this driver index
          let file = req.files?.find(
            (f) => f.fieldname === `drivers[${index}][file]`
          );

          return {
            busRegisterNumber: drv.busRegisterNumber,
            driverName: drv.driverName,
            driverContact: drv.driverContact,
            driverCivilId: drv.driverCivilId,
            driverDocUrl: file ? file.destination + file.filename : drv.driverDocUrl || null,
          };
        });
      }

      const vendorData = {
        vendorName: body.vendorName,
        contractId: body.contractId ? new mongoose.Types.ObjectId(body.contractId) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,

        drivers, // ✅ save manual driver entries

        noOfBuses: body.noOfBuses || 0,
        noOfDrivers: body.noOfDrivers || 0,
        contactOfficer: body.contactOfficer || "",
        contractType: body.contractType || "",
        invoicingDate: body.invoicingDate ? new Date(body.invoicingDate) : null,
        lastPayment: body.lastPayment ? new Date(body.lastPayment) : null,

        status: Number(body.status) || 1
      };

      let result;

      if (body.id) {
        result = await db.UpdateDocument(
          "vendor",
          { _id: new mongoose.Types.ObjectId(body.id) },
          vendorData
        );
        return res.send({ status: true, message: "Vendor updated", data: result });
      }

      // Try Inserting
      result = await db.InsertDocument("vendor", vendorData);

      // Check if result is a duplicate key error on contractId
      // InsertDocument returns the error object itself if it fails
      if (result && result.code === 11000 && result.keyPattern && result.keyPattern.contractId) {
        try {
          console.log("⚠️ Detected duplicate key error on contractId. Removing unique index...");
          await mongoose.connection.collection("vendor").dropIndex("contractId_1");
          console.log("✅ Unique index 'contractId_1' dropped. Retrying save...");

          // Retry Insert
          result = await db.InsertDocument("vendor", vendorData);

          // If retry fails again with error
          if (result && (result.code || result instanceof Error)) {
            return res.send({ status: false, message: "Error saving vendor", error: result });
          }

          return res.send({ status: true, message: "Vendor saved", data: result });

        } catch (retryError) {
          console.error("❌ Retry failed:", retryError);
          return res.send({ status: false, message: "Error saving vendor even after index fix", error: retryError });
        }
      }

      // Check for other errors
      if (result && (result.code || result instanceof Error)) {
        return res.send({ status: false, message: "Error saving vendor", error: result });
      }

      return res.send({ status: true, message: "Vendor saved", data: result });

    } catch (error) {
      console.log("ERROR saveVendor", error);
      return res.send({ status: false, message: "Error saving vendor", error });
    }
  };

  /**
   * @route POST /vendor/view
   * @desc View vendor by ID
   */
  controller.viewVendor = async function (req, res) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.send({ status: false, message: "Vendor ID is required" });
      }

      const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "contract",
            localField: "contractId",
            foreignField: "_id",
            as: "contractDetails",
          },
        },
        { $unwind: { path: "$contractDetails", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            vendorName: 1,
            startDate: 1,
            endDate: 1,
            contactOfficer: 1,
            contractType: 1,
            invoicingDate: 1,
            lastPayment: 1,
            status: 1,

            drivers: 1, // Include complete driver/bus structure
            "contractDetails._id": 1,
            "contractDetails.contractId": 1,
            "contractDetails.clientName": 1,
            "contractDetails.startDate": 1,
            "contractDetails.endDate": 1,
          },
        },
      ];

      const result = await db.GetAggregation("vendor", pipeline);

      if (!result || result.length === 0) {
        return res.send({ status: false, message: "Vendor not found" });
      }

      return res.send({ status: true, data: result[0] });
    } catch (error) {
      console.log(error, "ERROR viewVendor");
      return res.send({
        status: false,
        message: "Something went wrong while fetching vendor details.",
      });
    }
  };

  /**
   * @route POST /vendor/list
   * @desc List vendors with filters
   */
  controller.listVendors = async function (req, res) {
    try {
      const { status, contractType, startDate, endDate, search } = req.body;

      let match = {};
      if (status) match.status = parseInt(status);
      if (contractType) match.contractType = contractType;
      if (startDate && endDate) {
        match.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      // Base pipeline
      let pipeline = [
        { $match: match },
        {
          $lookup: {
            from: "contract",
            localField: "contractId",
            foreignField: "_id",
            as: "contractDetails",
          },
        },
        { $unwind: { path: "$contractDetails", preserveNullAndEmptyArrays: true } },
      ];

      // Search logic (vendorName, contractId, clientName)
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { vendorName: { $regex: search, $options: "i" } },
              { "contractDetails.contractId": { $regex: search, $options: "i" } },
              { "contractDetails.clientName": { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      // Projection
      pipeline.push({
        $project: {
          vendorName: 1,
          startDate: 1,
          endDate: 1,
          contactOfficer: 1,
          contractType: 1,
          invoicingDate: 1,
          lastPayment: 1,
          status: 1,
          drivers: 1, // now contains bus info too
          "contractDetails.contractId": 1,
          "contractDetails.clientName": 1,
        },
      });

      pipeline.push({ $sort: { startDate: -1 } });

      const result = await db.GetAggregation("vendor", pipeline);

      return res.send({
        status: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR listVendors");
      return res.send({
        status: false,
        message: "Something went wrong while fetching vendors.",
      });
    }
  };

  return controller;
};
