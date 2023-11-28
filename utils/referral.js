const USER = require('../models/userModel')
function generateReferralCode() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const minLength = 5;
    const maxLength = 9;

    const codeLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let code = '';

    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        code += charset[randomIndex];
    }

    return code;
}

const referralCode = async () => {
    const referral = await generateReferralCode()
    const codeExist = await USER.findOne({ referralCode: referral })
    if (codeExist) referralCode()
    return referral
}



module.exports = referralCode