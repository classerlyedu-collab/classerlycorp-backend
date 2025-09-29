const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
function generateSixDigitCode() {
  var code = "";
  for (var i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

// Generate employee code in format EMP-XXXXXX with uniqueness check
async function generateEmployeeCode(employeeModel) {
  const maxAttempts = 10; // Prevent infinite loops
  let attempts = 0;

  while (attempts < maxAttempts) {
    const randomCode = Math.floor(100000 + Math.random() * 900000); // 6 digit random number
    const employeeCode = `EMP-${randomCode}`;

    try {
      // Check if this code already exists
      const existingEmployee = await employeeModel.findOne({ code: employeeCode });

      if (!existingEmployee) {
        // Code is unique
        return employeeCode;
      }

      attempts++;
    } catch (error) {
      throw new Error('Error checking code uniqueness: ' + error.message);
    }
  }

  throw new Error('Unable to generate unique employee code after multiple attempts');
}

module.exports = { generateSixDigitCode, generateOTP, generateEmployeeCode };
