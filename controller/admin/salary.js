module.exports = function () {
    var db = require("../../controller/adaptor/mongodb.js");
    var mongoose = require("mongoose");
    var controller = {};


    controller.listSalaries = async function (req, res) {
        try {
            const { month, year, search } = req.body;

            const matchQuery = {};

            if (month) matchQuery.month = parseInt(month);
            if (year) matchQuery.year = parseInt(year);

            const pipeline = [
                { $match: matchQuery },
                {
                    $lookup: {
                        from: "employee",
                        localField: "employee",
                        foreignField: "_id",
                        as: "employeeDetails"
                    }
                },
                { $unwind: "$employeeDetails" }
            ];

            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { "employeeDetails.fullName": { $regex: search, $options: "i" } },
                            { "employeeDetails.employeeId": { $regex: search, $options: "i" } }
                        ]
                    }
                });
            }

            // Sorting
            let { sortBy, sortOrder } = req.body;
            let sortStage = {};

            if (sortBy) {
                sortOrder = parseInt(sortOrder) || 1; // Default to 1 (Ascending)

                // Map frontend sort keys to backend fields
                const sortMapping = {
                    'employeeName': 'employeeDetails.fullName',
                    'employeeId': 'employeeDetails.employeeId',
                    'status': 'paymentStatus',
                    'daysPresent': 'daysPresent',
                    'overtime': 'overtimeAmount',
                    'salary': 'finalSalary'
                };

                const dbField = sortMapping[sortBy] || sortBy;
                sortStage[dbField] = sortOrder;
            } else {
                sortStage = { "employeeDetails.fullName": 1 }; // Default sort
            }

            pipeline.push({ $sort: sortStage });

            const salaries = await db.GetAggregation("salary", pipeline);


            return res.send({ status: true, data: salaries });

        } catch (error) {
            console.error("ERROR listSalaries:", error);
            return res.send({ status: false, message: "Failed to fetch salary list." });
        }
    };

    controller.listByEmployee = async function (req, res) {
        try {
            const { employeeId } = req.body;
            if (!mongoose.isObjectIdOrHexString(employeeId)) {
                return res.send({ status: false, message: "Invalid Employee ID" });
            }

            const salaries = await db.GetDocument(
                "salary",
                { employee: employeeId },
                {}, // Projection: Empty object to get all fields
                {} // Extension: Contains the sort options
            );
            console.log(salaries);

            return res.send({ status: true, data: salaries });

        } catch (error) {
            // Use a logging library in production to avoid exposing sensitive info
            if (process.env.NODE_ENV !== 'production') {
                console.error("ERROR listByEmployee:", error);
            } else {
                // Example: Replace with your logger, e.g., logger.error("ERROR listByEmployee:", error.message);
            }
            return res.send({ status: false, message: "Failed to fetch salaries." });
        }
    };

    // PUT /admin/salary/:salaryId
    controller.updateSalary = async function (req, res) {
        try {
            const { salaryId } = req.body;
            const body = req.body.data || {};

            if (!mongoose.isObjectIdOrHexString(salaryId)) {
                return res.send({ status: false, message: "Invalid Salary ID" });
            }

            const originalSalaryRes = await db.GetOneDocument("salary", { _id: salaryId }, {}, {});
            if (!originalSalaryRes || !originalSalaryRes.doc) {
                return res.send({ status: false, message: "Salary record not found." });
            }
            const originalSalary = originalSalaryRes.doc;

            // --- Recalculate derived fields ---
            const overtimeHours = Number(body.overtimeHours) || 0;
            const overtimeRate = Number(body.overtimeRate) || 0;
            const penalties = Array.isArray(body.penalties) ? body.penalties : [];
            // New deductions
            const penaltyDeduction = Number(body.penaltyDeduction) || 0;
            const allowanceDeduction = Number(body.allowanceDeduction) || 0;
            const leaveDeduction = Number(body.leaveDeduction) || 0;

            const overtimeAmount = overtimeHours * overtimeRate;
            // Existing inline penalties array (optional, keeping for backward compat if used)
            const inlinePenaltyAmount = penalties.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            // Total Deductions for reference (Penalties)
            const totalPenaltyAmount = inlinePenaltyAmount + penaltyDeduction;

            // --- USER FORMULA ---
            // finalSalary = baseSalary + overtime - penalty - allowance - leave
            let finalSalary = 0;
            const baseSalary = Number(originalSalary.baseSalary) || 0;

            finalSalary += baseSalary;
            finalSalary += overtimeAmount;
            finalSalary -= totalPenaltyAmount;
            finalSalary -= allowanceDeduction;
            finalSalary -= leaveDeduction;

            const totalEarnings = baseSalary + overtimeAmount;

            // Should we update daysPresent? No, user didn't ask to change that.
            // But we should probably set day info effectively ignored for calculation.

            const updateData = {
                overtimeHours,
                overtimeRate,
                overtimeAmount,
                penalties,
                penaltyDeduction,
                allowanceDeduction,
                totalPenaltyAmount: totalPenaltyAmount + allowanceDeduction,
                totalEarnings,
                finalSalary,
                leaveDeduction,
                paymentStatus: body.paymentStatus || 'Pending',
                paymentDate: body.paymentStatus === 'Paid' ? (body.paymentDate || new Date()) : null,
                remarks: body.remarks || originalSalary.remarks,
                updatedAt: new Date()
            };

            const result = await db.UpdateDocument("salary", { _id: salaryId }, updateData, {});
            return res.send({ status: true, message: "Salary updated successfully", data: result });

        } catch (error) {
            console.error("ERROR updateSalary:", error);
            return res.send({ status: false, message: "Failed to update salary." });
        }
    };

    /**
     * @route POST /salary/penalty/add
     */
    controller.addPenalty = async function (req, res) {
        try {
            const { fleetId, date, amount, reason, type } = req.body;
            if (!fleetId || !date || !amount) {
                return res.send({ status: false, message: "Fleet, Date and Amount are required" });
            }

            // Fetch Driver
            const targetDate = new Date(date);
            const assignment = await db.GetOneDocument(
                "fleetAssignment",
                {
                    fleetId: new mongoose.Types.ObjectId(fleetId),
                    dateAssigned: { $lte: targetDate },
                    $or: [
                        { dateUnassigned: { $gte: targetDate } },
                        { dateUnassigned: null },
                        { dateUnassigned: { $exists: false } } // Handle missing field
                    ]
                },
                {},
                { sort: { dateAssigned: -1 } } // Get most recent assignment
            );

            // Allow manual override if needed, but for now strict auto-fetch
            const driverId = assignment.doc ? assignment.doc.driverId : null;

            if (!driverId) {
                return res.send({ status: false, message: "No driver found assigned to this vehicle on the specified date." });
            }

            const data = {
                fleet: fleetId,
                employee: driverId,
                date: targetDate,
                amount: Number(amount),
                type: type || "Other",
                reason: reason || "",
                status: "Pending",
                paidAmount: 0
            };

            const result = await db.InsertDocument("penalty", data);
            return res.send({ status: true, message: "Penalty recorded", data: result });

        } catch (error) {
            console.error("ERROR addPenalty", error);
            return res.send({ status: false, message: "Error adding penalty" });
        }
    };

    /**
     * @route POST /salary/allowance/add
     */
    controller.addAllowance = async function (req, res) {
        try {
            const { employeeId, date, amount, notes } = req.body;
            if (!employeeId || !date || !amount) return res.send({ status: false, message: "Missing fields" });

            const data = {
                employee: employeeId,
                date: new Date(date),
                amount: Number(amount),
                notes: notes || "",
                status: "Pending",
                repaidAmount: 0
            };

            const result = await db.InsertDocument("allowance", data);
            return res.send({ status: true, message: "Allowance recorded", data: result });
        } catch (error) {
            console.error("ERROR addAllowance", error);
            return res.send({ status: false, message: "Error adding allowance" });
        }
    };

    /**
     * @route POST /salary/outstanding
     */
    controller.getOutstandingBalance = async function (req, res) {
        try {
            const { employeeId } = req.body;
            if (!employeeId) return res.send({ status: false });

            const empId = new mongoose.Types.ObjectId(employeeId);

            // 1. Total Penalties (Master Records)
            const penaltyPipeline = [
                { $match: { employee: empId } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ];
            const penaltyRes = await db.GetAggregation("penalty", penaltyPipeline);

            const totalPenaltyRecorded = penaltyRes.length ? penaltyRes[0].total : 0;

            // 2. Total Allowances (Master Records)
            const allowancePipeline = [
                { $match: { employee: empId } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ];
            const allowanceRes = await db.GetAggregation("allowance", allowancePipeline);
            const totalAllowanceRecorded = allowanceRes.length ? allowanceRes[0].total : 0;

            // 3. Total Deductions (from Salary Slips)
            const salaryPipeline = [
                { $match: { employee: empId } },
                {
                    $group: {
                        _id: null,
                        totalPenaltyDeducted: { $sum: "$penaltyDeduction" },
                        totalAllowanceDeducted: { $sum: "$allowanceDeduction" }
                    }
                }
            ];
            const salaryRes = await db.GetAggregation("salary", salaryPipeline);
            const deducted = salaryRes.length ? salaryRes[0] : { totalPenaltyDeducted: 0, totalAllowanceDeducted: 0 };

            return res.send({
                status: true,
                data: {
                    outstandingPenalty: totalPenaltyRecorded - deducted.totalPenaltyDeducted,
                    outstandingAllowance: totalAllowanceRecorded - deducted.totalAllowanceDeducted
                }
            });

        } catch (error) {
            console.error("ERROR getOutstandingBalance", error);
            return res.send({ status: false, message: "Error" });
        }
    };

    /**
     * @route POST /salary/driver-on-date
     */
    controller.getDriverOnDate = async function (req, res) {
        try {
            const { fleetId, date } = req.body;
            if (!fleetId || !date) return res.send({ status: false, message: "Missing params" });

            const targetDate = new Date(date);
            const assignment = await db.GetOneDocument(
                "fleetAssignment",
                {
                    fleetId: new mongoose.Types.ObjectId(fleetId),
                    dateAssigned: { $lte: targetDate },
                    $or: [
                        { dateUnassigned: { $gte: targetDate } },
                        { dateUnassigned: null },
                        { dateUnassigned: { $exists: false } }
                    ]
                },
                {},
                { sort: { dateAssigned: -1 }, populate: ["driverId"] }
            );

            if (assignment.doc && assignment.doc.driverId) {
                return res.send({ status: true, driver: assignment.doc.driverId });
            } else {
                return res.send({ status: false, message: "No driver found" });
            }

        } catch (error) {
            console.error("ERROR getDriverOnDate", error);
            return res.send({ status: false, message: "Error" });
        }
    };


    return controller;
};