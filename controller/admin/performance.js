"use strict";
module.exports = function () {
  const db = require("../../controller/adaptor/mongodb.js");
  const mongoose = require("mongoose");
  const moment = require("moment");
  const controller = {};

  /**
   * @route POST /performance/report
   * @desc Generate performance analysis report for a given month & year
   */
  controller.performanceReport = async function (req, res) {
    try {
      const { month, year, search, sortBy, sortOrder = "asc", role } = req.body;

      if (!month || !year)
        return res.send({ status: false, message: "Month and Year are required" });

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Fetch all employees (active ones)
      const employees = await db.GetDocument(
        "employee",
        role ? { status: 1, role } : { status: 1 },
        {},
        {}
      );

      if (!employees.status || !employees.doc.length)
        return res.send({ status: false, message: "No employees found" });

      const results = [];

      // Fetch all penalties for the month (for Driving Behavior automation)
      const allPenaltiesRes = await db.GetDocument(
        "penalty",
        { date: { $gte: startDate, $lte: endDate } },
        {},
        {}
      );
      const allPenalties = (allPenaltiesRes.status && allPenaltiesRes.doc) ? allPenaltiesRes.doc : [];

      for (const emp of employees.doc) {
        // Get attendance document for employee
        const attnDoc = await db.GetOneDocument(
          "attendance",
          { employee: emp._id },
          {},
          {}
        );

        let leaveDays = 0,
          sickDays = 0,
          presentDays = 0,
          totalDays = 0;

        if (attnDoc.status && attnDoc.doc && attnDoc.doc.records && attnDoc.doc.records.length > 0) {
          // Fixed: Check .records existence
          const records = attnDoc.doc.records.filter(
            (r) => r.date >= startDate && r.date <= endDate
          );

          // Count logic - assuming records contain one entry per working day
          // Or should we use totalWorkingDays from elsewhere?
          // Using recorded entries as Total Days for now.
          totalDays = records.length;
          records.forEach((r) => {
            if (r.status === "P") presentDays++;
            if (r.status === "A") leaveDays++; // Absent counts as leave? or Unpaid Leave?
            if (r.status === "L") { leaveDays++; } // Leave
            if (r.status === "S") { sickDays++; } // Sick
          });

          // If totalDays is 0 (no attendance records), use standard 30?
          // For now, keep existing logic: 0% if no records.
        }

        // Compute performance percentage
        // Logic: (Present / Total Recorded Days) * 100
        const performancePercent =
          totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : "0.00";

        // AUTOMATED DRIVING BEHAVIOUR
        let drivingBehaviour = null;
        if (emp.role === "Driver") {
          const empPenalties = allPenalties.filter(p => p.employee.toString() === emp._id.toString());

          const counts = {
            speedViolations: 0,
            accidents: 0,
            trafficPenalties: 0,
            incidents: 0,
            others: 0
          };

          empPenalties.forEach(p => {
            if (p.type === "Speed Violations") counts.speedViolations++;
            else if (p.type === "Accidents") counts.accidents++;
            else if (p.type === "Traffic Penalties") counts.trafficPenalties++;
            else if (p.type === "Incidents") counts.incidents++;
            else counts.others++;
          });

          // Only show behavior object if there are relevant stats? Or always show 0?
          // User screenshot shows "-" if empty.
          // If we have data, we send it.
          drivingBehaviour = {
            speedViolations: counts.speedViolations,
            accidents: counts.accidents,
            trafficPenalties: counts.trafficPenalties,
            incidents: counts.incidents
          };
        }

        results.push({
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          role: emp.role,
          doj: emp.dateOfJoining,
          leaveDays,
          sickDays,
          performancePercent,
          drivingBehaviour,
          remarks: "",
        });
      }

      // Sorting
      if (sortBy) {
        results.sort((a, b) => {
          let compare = 0;
          if (sortBy === "doj") {
            compare = new Date(a.doj) - new Date(b.doj);
          } else if (sortBy === "performance") {
            compare = a.performancePercent - b.performancePercent;
          }
          return sortOrder === "asc" ? compare : -compare;
        });
      }

      // Search filter
      let filtered = results;
      if (search) {
        filtered = results.filter((r) =>
          r.employeeName.toLowerCase().includes(search.toLowerCase())
        );
      }

      return res.send({
        status: true,
        count: filtered.length,
        data: filtered,
      });
    } catch (error) {
      console.log(error, "ERROR performanceReport");
      return res.send({
        status: false,
        message: "Error generating performance report",
      });
    }
  };

  controller.updateDrivingBehaviour = async function (req, res) {
    try {
      const { employeeId, month, year, speedViolations, accidents, trafficPenalties, incidents } = req.body;

      if (!employeeId || !month || !year)
        return res.send({ status: false, message: "Employee ID, month, and year are required" });

      const emp = await db.GetOneDocument("employee", { _id: new mongoose.Types.ObjectId(employeeId) }, {}, {});
      if (!emp.status) return res.send({ status: false, message: "Employee not found" });

      await db.UpdateDocument(
        "attendance",
        { employee: emp.doc._id },
        {
          $pull: { performance: { month, year } }
        }
      );

      await db.UpdateDocument(
        "attendance",
        { employee: emp.doc._id },
        {
          $push: {
            performance: {
              month,
              year,
              speedViolations,
              accidents,
              trafficPenalties,
              incidents
            }
          }
        }
      );

      return res.send({ status: true, message: "Driving behaviour updated successfully" });
    } catch (err) {
      console.log(err, "ERROR updateDrivingBehaviour");
      return res.send({ status: false, message: "Error updating driving behaviour" });
    }
  };

  return controller;
};
