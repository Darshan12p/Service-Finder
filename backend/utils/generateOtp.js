const otpGenerator = require("otp-generator");

const generateOtp = () => {
  return otpGenerator.generate(6, {
    digits: true,        // ✅ allow numbers 0–9
    lowerCaseAlphabets: false, 
    upperCaseAlphabets: false, 
    specialChars: false, 
  });
};

module.exports = generateOtp;
