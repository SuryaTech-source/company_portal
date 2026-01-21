const contact = require("./contact.js");

//"use strict";
module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var async = require("async");
  var mongoose = require("mongoose");
  var moment = require("moment");
  var controller = {};

  /**
   * @route POST /employee/add
   * @desc Add a new employee
   */
  // controller.saveEmployee = async function (req, res) {
  //   try {
  //     const body = req.body;

  // console.log(body,"bodyssssssssssbody");
  // console.log(req.files,"filesssssssss");

  //     return

  //     let employeeData = {
  //       fullName: body.fullName,
  //       nationality: body.nationality || null,
  //       bloodGroup: body.bloodGroup || null,
  //       dob: body.dob ? new Date(body.dob) : null,
  //       permanentAddress: body.permanentAddress || null,
  //       designation: body.designation || null,
  //       employeeId: body.employeeId,
  //       employmentType: body.employmentType || "Full-Time",
  //       dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : new Date(),
  //       underContract: body.underContract || null,
  //       salary: body.salary || 0,
  //       bankDetails: body.bankDetails || {},
  //       nominee: body.nominee || {},
  //       visaExpiry: body.visaExpiry ? new Date(body.visaExpiry) : null,
  //       licenseNo: body.licenseNo || null,
  //       role: body.role || "Staff", // Default role Staff
  //       documents: body.documents || [],
  //       status: body.status || 1
  //     };

  //     let result;

  //     if (body._id) {
  //       // ---- Update Employee ----
  //       result = await db.UpdateDocument(
  //         "employee",
  //         { _id: mongoose.Types.ObjectId(body._id) },
  //         employeeData
  //       );
  //       return res.send({
  //         status: true,
  //         message: "Employee updated successfully",
  //         data: result,
  //       });
  //     } else {
  //       // ---- Add New Employee ----
  //       result = await db.InsertDocument("employee", employeeData);
  //       return res.send({
  //         status: true,
  //         message: "Employee added successfully",
  //         data: result,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error, "ERROR saveEmployee");
  //     return res.send({
  //       status: false,
  //       message: "Something went wrong while saving employee.",
  //     });
  //   }
  // };

  // controller.saveEmployee = async function (req, res) {
  //   try {
  //     const body = req.body;

  //     console.log(body, "bodyssssssssssbody");
  //     console.log(req.files, "filesssssssss");

  //     // Normalize documents
  //     let documents = [];
  //     if (body.documents) {
  //       let docsFromBody = typeof body.documents === "string"
  //         ? JSON.parse(body.documents)
  //         : body.documents;

  //       documents = docsFromBody.map((doc, index) => {
  //         let matchedFile = req.files.find(
  //           (f) => f.fieldname === `documents[${index}][file]`
  //         );

  //         return {
  //           documentType: doc.type, // map type → documentType
  //           fileUrl: matchedFile
  //             ? matchedFile.destination + matchedFile.filename
  //             : null,
  //         };
  //       });
  //     }

  //     let employeeData = {
  //       fullName: body.fullName,
  //       nationality: body.nationality || null,
  //       bloodGroup: body.bloodGroup || null,
  //       contactNumber: body.contactNumber || null,
  //       dob: body.dob ? new Date(body.dob) : null,
  //       permanentAddress: body.permanentAddress || null,
  //       designation: body.designation || null,
  //       employeeId: body.employeeId,
  //       employmentType: body.employmentType || "Full-Time",
  //       dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : new Date(),
  //       underContract: body.underContract || null,
  //       salary: body.salary || 0,
  //       bankDetails: body.bankDetails ? JSON.parse(body.bankDetails) : {},
  //       nominee: body.nominee ? JSON.parse(body.nominee) : {},
  //       visaExpiry: body.visaExpiry ? new Date(body.visaExpiry) : null,
  //       licenseNo: body.licenseNo || null,
  //       role: body.role || "Staff",
  //       status: Number(body.status) || 1,
  //       documents: documents
  //     };
  // console.log(employeeData,"employeeDataemployeeDataemployeeData");

  //     let result;
  //     if (body._id && body._id !== "null") {
  //       // ---- Update Employee ----
  //       result = await db.UpdateDocument(
  //         "employee",
  //         { _id:new mongoose.Types.ObjectId(body._id) },
  //         employeeData
  //       );
  //       return res.send({
  //         status: true,
  //         message: "Employee updated successfully",
  //         data: result,
  //       });
  //     } else {
  //       // ---- Add New Employee ----
  //       result = await db.InsertDocument("employee", employeeData);
  //       console.log(result,"resultresultresult");
  //        await db.InsertDocument("attendance", {
  //         employee: result._id,
  //         records: []
  //       });

  //       return res.send({
  //         status: true,
  //         message: "Employee added successfully",
  //         data: result,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error, "ERROR saveEmployee");
  //     return res.send({
  //       status: false,
  //       message: "Something went wrong while saving employee.",
  //     });
  //   }
  // };

  // Controller
  controller.saveEmployee = async function (req, res) {
    try {
      const body = req.body;

      const { civilId, civilIdExpiry, licenseNo, licenseExpiry, designation } =
        req.body;

      // Required validations
      if (!civilId || !civilIdExpiry) {
        return res.json({
          status: false,
          message: "Civil ID and expiry are required",
        });
      }
      if (designation === "Driver" && (!licenseNo || !licenseExpiry)) {
        return res.json({
          status: false,
          message: "License No and expiry are required for drivers",
        });
      }

      // Rebuild documents array from bracketed fields and uploaded files
      // Multer.any() yields req.files as an array with fieldname matching the appended key
      // body.documents may be either:
      // - an array of objects when sent as bracketed keys
      // - undefined if no documents were appended
      const filesArr = Array.isArray(req.files) ? req.files : [];
      const documents = [];

      // Collect unique indices seen in body for documents[i][...]
      // body.documents could be an object keyed by indices or an array; normalize access
      const docBody = body.documents || {};
      // Determine indices present by scanning both body and files fieldnames
      const indexSet = new Set();

      // From body: documents[<i>][type] / [existingFileUrl] / [documentId]
      Object.keys(docBody).forEach((k) => {
        // k could be '0','1' if parsed as array-like into object; or keys like '[0]' in some parsers
        indexSet.add(k);
      });

      // From files: fieldname like 'documents[0][file]'
      filesArr.forEach((f) => {
        const m = f.fieldname.match(/^documents\[(\d+)\]\[file\]$/);
        if (m) indexSet.add(m[1]);
      });

      // Build document items per index
      for (const idx of indexSet) {
        // Access possible shapes:
        // - docBody[idx] is an object when your parser maps bracketed keys
        // - otherwise fall back to direct properties like body[`documents[${idx}][type]`]
        const byObj = docBody[idx] || {};
        const type =
          byObj.type || body[`documents[${idx}][type]`] || byObj.documentType;

        // match uploaded file for this index
        const matchedFile = filesArr.find(
          (f) => f.fieldname === `documents[${idx}][file]`,
        );

        // existing file url path (if no new file)
        const existingFileUrl =
          byObj.existingFileUrl || body[`documents[${idx}][existingFileUrl]`];

        // documentId (for updates)
        const documentId =
          byObj.documentId || body[`documents[${idx}][documentId]`];

        // Resolve fileUrl
        let fileUrl = null;
        if (matchedFile) {
          fileUrl =
            (matchedFile.destination || "") + (matchedFile.filename || "");
        } else if (existingFileUrl) {
          fileUrl = existingFileUrl;
        }

        // Only push when type present; type is required by your front-end validation
        if (type) {
          const docItem = {
            documentType: type,
            fileUrl: fileUrl || null,
          };
          // If you want to keep _id during update merges, you can include it transiently
          if (documentId) docItem._id = documentId;
          documents.push(docItem);
        }
      }

      const employeeData = {
        fullName: body.fullName,
        nationality: body.nationality || null,
        bloodGroup: body.bloodGroup || null,
        contactNumber: body.contactNumber || null,
        dob: body.dob ? new Date(body.dob) : null,
        permanentAddress: body.permanentAddress || null,
        designation: body.designation || null,
        employeeId: body.employeeId,
        employmentType: body.employmentType || "Full-Time",
        dateOfJoining: body.dateOfJoining
          ? new Date(body.dateOfJoining)
          : new Date(),
        underContract: body.underContract || null,
        salary: body.salary || 0,
        bankDetails: body.bankDetails ? JSON.parse(body.bankDetails) : {},
        nominee: body.nominee ? JSON.parse(body.nominee) : {},
        visaExpiry: body.visaExpiry ? new Date(body.visaExpiry) : null,
        licenseNo: body.licenseNo || null,
        role: body.designation || "Staff",
        status: Number(body.status) || 1,

        civilId: body.civilId,
        civilIdExpiry: body.civilIdExpiry ? new Date(body.civilIdExpiry) : null,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,

        documents: documents,
      };

      let result;
      if (body._id && body._id !== "null") {
        // Update
        result = await db.UpdateDocument(
          "employee",
          { _id: new mongoose.Types.ObjectId(body._id) },
          employeeData,
        );
        return res.send({
          status: true,
          message: "Employee updated successfully",
          data: result,
        });
      } else {
        // Insert

        // 1. Check if employeeId already exists
        const existingEmp = await db.GetOneDocument(
          "employee",
          { employeeId: body.employeeId },
          {},
          {},
        );
        if (existingEmp.status) {
          return res.send({
            status: false,
            message: "Employee ID already exists",
          });
        }

        result = await db.InsertDocument("employee", employeeData);

        // 2. Validate result
        if (!result || !result._id) {
          return res.send({
            status: false,
            message: "Failed to create employee. Check unique fields.",
          });
        }

        await db.InsertDocument("attendance", {
          employee: result._id,
          records: [],
        });
        return res.send({
          status: true,
          message: "Employee added successfully",
          data: result,
        });
      }
    } catch (error) {
      console.log(error, "ERROR saveEmployee");
      return res.send({
        status: false,
        message: "Something went wrong while saving employee.",
      });
    }
  };

  controller.viewemployee = async function (req, res) {
    try {
      const { id } = req.body;

      const result = await db.GetOneDocument(
        "employee",
        { _id: new mongoose.Types.ObjectId(id) },
        {},
        {},
      );

      if (!result) {
        return res.send({ status: false, message: "employee not found" });
      }

      return res.send({ status: true, data: result });
    } catch (error) {
      console.log(error, "ERROR viewemployee");
      return res.send({
        status: false,
        message: "Something went wrong while fetching employee details.",
      });
    }
  };

  /**
   * @route POST /employee/list
   * @desc Get employees with filters
   */
  controller.listEmployees = async function (req, res) {
    try {
      const {
        role,
        status,
        nationality,
        designation,
        startDate,
        endDate,
        search,
      } = req.body;

      let match = {};

      if (role) match.role = role;

      // Status filter logic:
      // - If 'all', do not filter by status
      // - If explicit status provided (e.g. 0), filter by it
      // - If undefined/null, default to 1 (Active)
      if (status === "all") {
        // No status filter
      } else if (status !== undefined && status !== null && status !== "") {
        match.status = parseInt(status);
      } else {
        match.status = 1;
      }

      if (nationality) match.nationality = nationality;
      if (designation) match.designation = designation;

      // Date range filter (DOJ)
      if (startDate && endDate) {
        match.dateOfJoining = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Text search (fullName / employeeId)
      if (search) {
        match.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ];
      }

      let pipeline = [
        { $match: match },
        {
          $project: {
            fullName: 1,
            employeeId: 1,
            designation: 1,
            nationality: 1,
            contactNumber: 1,
            dateOfJoining: 1,
            visaExpiry: 1,
            salary: 1,
            nominee: 1,
            licenseNo: 1,
            role: 1,
            status: 1,
          },
        },
        { $sort: { dateOfJoining: -1 } },
      ];

      const result = await db.GetAggregation("employee", pipeline);

      return res.send({
        status: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR listEmployees");
      return res.send({
        status: false,
        message: "Something went wrong while fetching employees.",
      });
    }
  };

  controller.bulkMarkAttendance = async function (req, res) {
    try {
      const { employeeIds = [], date, status, remarks = "" } = req.body;
      if (!employeeIds.length || !date || !status) {
        return res.send({
          status: false,
          message: "Employee IDs, date, and status are required",
        });
      }

      const targetDate = new Date(date);

      // Loop through employee IDs and upsert records
      const operations = employeeIds.map((empId) => ({
        updateOne: {
          filter: { employee: new mongoose.Types.ObjectId(empId) },
          update: {
            $setOnInsert: { employee: new mongoose.Types.ObjectId(empId) },
            $pull: { records: { date: targetDate } }, // remove existing for same date
          },
          upsert: true,
        },
      }));

      await db.BulkWrite("attendance", operations);

      // Now push updated records
      const pushOps = employeeIds.map((empId) => ({
        updateOne: {
          filter: { employee: new mongoose.Types.ObjectId(empId) },
          update: {
            $push: {
              records: { date: targetDate, status, remarks },
            },
          },
        },
      }));

      await db.BulkWrite("attendance", pushOps);

      return res.send({
        status: true,
        message: "Bulk attendance updated successfully",
      });
    } catch (err) {
      console.log(err, "ERROR bulkMarkAttendance");
      return res.send({
        status: false,
        message: "Error updating bulk attendance",
      });
    }
  };

  // Mark ALL employees as present for today
  controller.markAllPresentToday = async function (req, res) {
    try {
      const today = new Date();
      const todayDate = new Date(today.toISOString().split("T")[0]); // normalize date (no time)

      // Fetch all employees
      const employees = await db.GetDocument("employee", { status: 1 }, {}, {});
      if (!employees.length) {
        return res.send({
          status: false,
          message: "No active employees found",
        });
      }

      // Loop and insert/update attendance
      const operations = employees.map((emp) => ({
        updateOne: {
          filter: { employee: emp._id },
          update: {
            $setOnInsert: { employee: emp._id },
            $pull: { records: { date: todayDate } },
          },
          upsert: true,
        },
      }));
      await db.BulkWrite("attendance", operations);

      const pushOps = employees.map((emp) => ({
        updateOne: {
          filter: { employee: emp._id },
          update: {
            $push: { records: { date: todayDate, status: "P", remarks: "" } },
          },
        },
      }));
      await db.BulkWrite("attendance", pushOps);

      return res.send({
        status: true,
        message: "All employees marked present for today",
      });
    } catch (err) {
      console.log(err, "ERROR markAllPresentToday");
      return res.send({
        status: false,
        message: "Error marking all employees present",
      });
    }
  };

  /**
   * @route POST /employee/delete
   * @desc Soft delete employee (status = 0)
   */
  controller.deleteEmployee = async function (req, res) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.send({
          status: false,
          message: "Employee ID is required",
        });
      }

      const result = await db.UpdateDocument(
        "employee",
        { _id: new mongoose.Types.ObjectId(id) },
        { status: 0 },
        {},
      );

      return res.send({
        status: true,
        message: "Employee deleted successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR deleteEmployee");
      return res.send({
        status: false,
        message: "Something went wrong while deleting employee.",
      });
    }
  };

  /**
   * @route POST /employee/restore
   * @desc Restore deleted employee (status = 1)
   */
  controller.restoreEmployee = async function (req, res) {
    try {
      const { id } = req.body;
      if (!id)
        return res.send({ status: false, message: "Employee ID is required" });

      const result = await db.UpdateDocument(
        "employee",
        { _id: new mongoose.Types.ObjectId(id) },
        { status: 1 },
        {},
      );

      return res.send({
        status: true,
        message: "Employee restored successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR restoreEmployee");
      return res.send({ status: false, message: "Error restoring employee" });
    }
  };

  /**
   * @route POST /employee/permanent-delete
   * @desc Hard delete employee from database
   */
  controller.permanentDeleteEmployee = async function (req, res) {
    try {
      const { id } = req.body;
      if (!id)
        return res.send({ status: false, message: "Employee ID is required" });

      const empId = new mongoose.Types.ObjectId(id);

      // Delete Employee Document
      const result = await db.DeleteDocument("employee", { _id: empId });

      // Optionally delete related attendance?
      // For now, let's also clean up attendance to avoid orphans, as per previous debugging session learnings
      await db.DeleteDocument("attendance", { employee: empId });

      if (result.status) {
        return res.send({
          status: true,
          message: "Employee permanently deleted",
        });
      } else {
        return res.send({
          status: false,
          message: "Failed to delete employee",
        });
      }
    } catch (error) {
      console.log(error, "ERROR permanentDeleteEmployee");
      return res.send({
        status: false,
        message: "Error deleting employee permanently",
      });
    }
  };

  controller.addVacation = async function (req, res) {
    try {
      const { employeeId, startDate, endDate, type, remarks } = req.body;

      if (!employeeId || !startDate || !endDate) {
        return res.send({
          status: false,
          message: "Employee ID, Start Date and End Date are required",
        });
      }

      const vacationData = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || "Vacation",
        remarks: remarks || "",
      };

      const result = await db.UpdateDocument(
        "employee",
        { _id: new mongoose.Types.ObjectId(employeeId) },
        { $push: { vacations: vacationData } },
      );

      return res.send({
        status: true,
        message: "Vacation added successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR addVacation");
      return res.send({
        status: false,
        message: "Error adding vacation",
      });
    }
  };

  /**
   * @route POST /employee/vacations/list
   * @desc List active and future vacations
   */
  controller.listVacations = async function (req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pipeline = [
        { $unwind: "$vacations" },
        {
          $match: {
            "vacations.endDate": { $gte: today }, // Active or Future
          },
        },
        {
          $project: {
            fullName: 1,
            employeeId: 1,
            designation: 1,
            vacationId: "$vacations._id",
            startDate: "$vacations.startDate",
            endDate: "$vacations.endDate",
            type: "$vacations.type",
            remarks: "$vacations.remarks",
          },
        },
        { $sort: { startDate: 1 } },
      ];

      const result = await db.GetAggregation("employee", pipeline);

      return res.send({
        status: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR listVacations");
      return res.send({ status: false, message: "Error fetching vacations" });
    }
  };

  /**
   * @route POST /employee/vacation/edit
   * @desc Edit vacation details
   */
  controller.editVacation = async function (req, res) {
    try {
      const { vacationId, employeeId, startDate, endDate, type, remarks } =
        req.body;

      if (!vacationId || !employeeId || !startDate || !endDate) {
        return res.send({ status: false, message: "Missing required fields" });
      }

      const result = await db.UpdateDocument(
        "employee",
        {
          _id: new mongoose.Types.ObjectId(employeeId),
          "vacations._id": new mongoose.Types.ObjectId(vacationId),
        },
        {
          $set: {
            "vacations.$.startDate": new Date(startDate),
            "vacations.$.endDate": new Date(endDate),
            "vacations.$.type": type,
            "vacations.$.remarks": remarks,
          },
        },
      );

      return res.send({
        status: true,
        message: "Vacation updated successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR editVacation");
      return res.send({ status: false, message: "Error updating vacation" });
    }
  };

  /**
   * @route POST /employee/vacation/delete
   * @desc Delete vacation entry
   */
  controller.deleteVacation = async function (req, res) {
    try {
      const { vacationId, employeeId } = req.body;

      if (!vacationId || !employeeId) {
        return res.send({ status: false, message: "Missing required fields" });
      }

      const result = await db.UpdateDocument(
        "employee",
        { _id: new mongoose.Types.ObjectId(employeeId) },
        {
          $pull: {
            vacations: { _id: new mongoose.Types.ObjectId(vacationId) },
          },
        },
      );

      return res.send({
        status: true,
        message: "Vacation deleted successfully",
        data: result,
      });
    } catch (error) {
      console.log(error, "ERROR deleteVacation");
      return res.send({ status: false, message: "Error deleting vacation" });
    }
  };

  /**
   * @route POST /admin/employee/history
   * @description Get comprehensive history (Penalties, Allowances, Vacations)
   */
  controller.getEmployeeHistory = async function (req, res) {
    try {
      const { employeeId } = req.body;
      if (!employeeId)
        return res.send({ status: false, message: "Employee ID required" });

      const empId = new mongoose.Types.ObjectId(employeeId);

      // 1. Fetch Employee (for Profile & Vacations)
      const employee = await db.GetOneDocument(
        "employee",
        { _id: empId },
        {},
        { lean: true },
      );
      if (!employee)
        return res.send({ status: false, message: "Employee not found" });

      // 2. Fetch Penalties
      const penalties = await db.GetDoc(
        "penalty",
        { employee: empId },
        {},
        { sort: { date: -1 }, populate: ["fleet"] },
      );

      // 3. Fetch Allowances
      const allowances = await db.GetDoc(
        "allowance",
        { employee: empId },
        {},
        { sort: { date: -1 } },
      );

      // 4. Calculate Stats (Outstanding done via salary deduction sum usually,
      // but for history list, we might just show raw totals or try to calculate outstanding.

      const salaryPipeline = [
        { $match: { employee: empId } },
        {
          $group: {
            _id: null,
            totalPenaltyDeducted: { $sum: "$penaltyDeduction" },
            totalAllowanceDeducted: { $sum: "$allowanceDeduction" },
          },
        },
      ];
      const salaryRes = await db.GetAggregation("salary", salaryPipeline);
      const deducted = salaryRes.length
        ? salaryRes[0]
        : { totalPenaltyDeducted: 0, totalAllowanceDeducted: 0 };

      const totalPenaltyAmount = penalties.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );
      const totalAllowanceAmount = allowances.reduce(
        (sum, a) => sum + (a.amount || 0),
        0,
      );

      // Organize Vacations (Sort by Date Desc)
      const vacations = (employee.vacations || []).sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate),
      );

      const data = {
        employee: {
          fullName: employee.fullName,
          employeeId: employee.employeeId,
          designation: employee.designation,
          joiningDate: employee.joiningDate,
        },
        penalties: {
          list: penalties,
          totalCount: penalties.length,
          totalAmount: totalPenaltyAmount,
          paidAmount: deducted.totalPenaltyDeducted, // Best effort "Paid"
          balance: totalPenaltyAmount - deducted.totalPenaltyDeducted,
        },
        allowances: {
          list: allowances,
          totalCount: allowances.length,
          totalAmount: totalAllowanceAmount,
          repaidAmount: deducted.totalAllowanceDeducted,
          balance: totalAllowanceAmount - deducted.totalAllowanceDeducted,
        },
        vacations: {
          list: vacations,
          totalCount: vacations.length,
        },
      };

      return res.send({ status: true, data: data });
    } catch (error) {
      console.error("ERROR getEmployeeHistory", error);
      return res.send({ status: false, message: "Error fetching history" });
    }
  };

  /**
   * @route POST /employee/check-id
   * @desc Check if employee ID exists
   */
  controller.checkEmployeeId = async function (req, res) {
    try {
      const { employeeId } = req.body;
      if (!employeeId)
        return res.send({ status: false, message: "Employee ID is required" });

      const existingEmp = await db.GetOneDocument(
        "employee",
        { employeeId: employeeId },
        {},
        {},
      );
      console.log(existingEmp,"existingEmpexistingEmp");

      if (existingEmp.status) {
        return res.send({
          status: true,
          exists: true,
          message: "Employee ID already exists",
        });
      } else {
        return res.send({
          status: true,
          exists: false,
          message: "Employee ID is available",
        });
      }
    } catch (error) {
      console.log(error, "ERROR checkEmployeeId");
      return res.send({ status: false, message: "Error checking ID" });
    }
  };

  return controller;
};
