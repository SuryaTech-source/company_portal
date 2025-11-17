const { create } = require("html-pdf");

module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

  controller.listAlerts = async function (req, res) {
    try {
      let alerts = await db.GetDocument(
        "alert",
        {},
        {},
        {}
      );
      return res.status(200).json({ status: 1, data: alerts });
    } catch (err) {
      res.status(500).json({ status: 0, message: err.message });
    }
  };

  return controller;
};
