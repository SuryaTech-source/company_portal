const { log } = require("async");

// "use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  /**
   * @route POST /spareparts/save
   * @desc Add or Update Spare Part
   */
  controller.saveSparePart = async function (req, res) {
    try {
      const body = req.body;

      let partData = {
        name: body.name,
        partNumber: body.partNumber,
        status: 1,
      };

      // check if part already exists by partNumber
      let existing = await db.GetOneDocument(
        "sparepart",
        { partNumber: body.partNumber },
        {},
        {}
      );
      console.log(existing, "exitingggggggg");

      if (existing.doc && existing.doc.status) {
        // 🔹 Update inventory (increase totalQuantity + push batch)
        let newQuantity = existing.doc.totalQuantity + body.totalQuantity;

        await db.UpdateDocument(
          "sparepart",
          { _id: existing.doc._id },
          {
            $set: {
              totalQuantity: newQuantity,
              discount: body.discount,
              finalPrice: body.finalPrice,
            },
            $push: {
              addedBatches: {
                quantity: body.totalQuantity,
                pricePerUnit: body.unitPrice,
                discount: body.discount,
                finalPrice: body.finalPrice,
                supplier: body.supplier,
                addedDate: body.addedDate || new Date(),
              },
            },
          }
        );

        return res.send({ status: true, message: "Spare part stock updated" });
      } else {
        // 🔹 Insert new part
        let insertData = {
          ...partData,
          totalQuantity: body.totalQuantity,
          discount: body.discount,
          finalPrice: body.finalPrice,
          addedBatches: [
            {
              quantity: body.totalQuantity,
              pricePerUnit: body.unitPrice,
              supplier: body.supplier,
              addedDate: body.addedDate || new Date(),
            },
          ],
        };

        await db.InsertDocument("sparepart", insertData);

        return res.send({ status: true, message: "Spare part added" });
      }
    } catch (error) {
      console.log(error, "ERROR saveSparePart");
      return res.send({ status: false, message: "Error saving spare part" });
    }
  };

  /**
   * @route POST /spareparts/list
   * @desc List Spare Parts Inventory
   */
  controller.listSpareParts = async function (req, res) {
    try {
      const { page = 1, limit = 10, search = "" } = req.body;

      let match = { status: 1 };

      if (search) {
        match.$or = [
          { name: { $regex: search, $options: "i" } },
          { partNumber: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [data, total] = await Promise.all([
        db.GetAggregation("sparepart", [
          { $match: match },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
        ]),
        db.GetCount("sparepart", match),
      ]);

      return res.send({
        status: true,
        count: total,
        page: parseInt(page),
        limit: parseInt(limit),
        data,
      });
    } catch (error) {
      console.log(error, "ERROR listSpareParts");
      return res.send({ status: false, message: "Error fetching spare parts" });
    }
  };

  /**
   * @route POST /spareparts/use
   * @desc Deduct spare parts when used in maintenance
   */
  controller.useSparePart = async function (req, res) {
    try {
      const { partNumber, usedQuantity } = req.body;

      let part = await db.GetOneDocument("sparepart", { partNumber }, {}, {});
      if (!part) return res.send({ status: false, message: "Part not found" });

      if (part.totalQuantity < usedQuantity) {
        return res.send({ status: false, message: "Not enough stock" });
      }

      await db.UpdateDocument(
        "sparepart",
        { _id: part._id },
        { $inc: { totalQuantity: -usedQuantity } }
      );

      return res.send({
        status: true,
        message: "Stock deducted",
        remaining: part.totalQuantity - usedQuantity,
      });
    } catch (error) {
      console.log(error, "ERROR useSparePart");
      return res.send({ status: false, message: "Error deducting spare part" });
    }
  };

  controller.viewSparePart = async function (req, res) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.send({
          status: false,
          message: "Spare part ID is required",
        });
      }

      const part = await db.GetOneDocument(
        "sparepart",
        { _id: new mongoose.Types.ObjectId(id), status: 1 },
        {},
        {}
      );

      if (!part) {
        return res.send({ status: false, message: "Spare part not found" });
      }

      return res.send({ status: true, data: part });
    } catch (error) {
      console.log(error, "ERROR viewSparePart");
      return res.send({ status: false, message: "Error fetching spare part" });
    }
  };

  return controller;
};
