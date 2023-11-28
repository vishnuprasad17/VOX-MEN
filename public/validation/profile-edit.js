const fnameError = document.getElementById("fname-Error")
const lnameError = document.getElementById("lname-Error")
const mobileError = document.getElementById("mobile-Error")

const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
const mobileRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/


//fname
function validateName1() {
    let name = document.getElementById("fname").value

    if (name.length === 0) {
        fnameError.innerHTML = "Name required!";
        return false;
    }
    if (!name.match(nameRegex)) {
        fnameError.innerHTML = "Only letters are allowed";
        return false;
    }
    fnameError.innerHTML = "";
    return true;
}
//lname
function validateName2() {
    let name = document.getElementById("lname").value
    if (name.length === 0) {
        lnameError.innerHTML = "Name required!";
        return false;
    }
    if (!name.match(nameRegex)) {
        lnameError.innerHTML = "Only letters are allowed";
        return false;
    }
    lnameError.innerHTML = "";
    return true;
}


function validateMobile() {
    let mobile = document.getElementById('mobile').value

    if (mobile.length === 0) {
        mobileError.innerHTML = "Mobile required!";
        return false;
    }
    if (!mobile.match(mobileRegex)) {
        mobileError.innerHTML = 'Enter a valid mobile no.'
        return false
    }
    mobileError.innerHTML = ""
    return true
}


function validateForm() {
    if (!validateName1() || !validateName2() || !validateMobile()) {
        return false;
    }
}