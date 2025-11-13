module.exports = function () {
  var db = require("../../controller/adaptor/mongodb.js");
  var mongoose = require("mongoose");
  var controller = {};

 
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
        
        const originalSalary = await db.GetOneDocument("salary", { _id: salaryId }, {}, {});
        if (!originalSalary) {
            return res.send({ status: false, message: "Salary record not found." });
        }
        
        // --- Recalculate derived fields ---
        const overtimeHours = Number(body.overtimeHours) || 0;
        const overtimeRate = Number(body.overtimeRate) || 0;
        const penalties = Array.isArray(body.penalties) ? body.penalties : [];
        
        const overtimeAmount = overtimeHours * overtimeRate;
        const totalPenaltyAmount = penalties.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
        // Prorated salary based on days present
        const proratedBase = originalSalary.totalWorkingDays > 0
            ? (originalSalary.baseSalary / originalSalary.totalWorkingDays) * originalSalary.daysPresent
            : 0;
        
        const totalEarnings = proratedBase + overtimeAmount;
        const finalSalary = totalEarnings - totalPenaltyAmount;
        
        const updateData = {
            overtimeHours,
            overtimeRate,
            overtimeAmount,
            penalties,
            totalPenaltyAmount,
            totalEarnings,
            finalSalary,
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


  return controller;
};