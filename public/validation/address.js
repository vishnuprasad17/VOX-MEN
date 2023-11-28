const nameError = document.getElementById("name-error")
const mobileError = document.getElementById("mobile-error")
const pincodeError = document.getElementById("pincode-error")
const townError = document.getElementById("town-error")
const stateError = document.getElementById("state-error")
const addressError = document.getElementById("address-error")

const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
const mobileRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/
const pincodeRegex = /^[1-9][0-9]{5}$/

function validateName() {
    let name = document.getElementById("name").value

    if (name.length === 0) {
        nameError.innerHTML = "Name required!";
        return false;
    }
    if (!name.match(nameRegex)) {
        nameError.innerHTML = "Only letters are allowed";
        return false;
    }
    nameError.innerHTML = "";
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

function validateAddress(){
    let address = document.getElementById("address").value
    if (!address.replace(/\s/g, '').length) {
        addressError.innerHTML = "Enter valid address";
        return false;
      }
      addressError.innerHTML=""
      return true
}

function validatePincode() {
    let pincode = document.getElementById('pincode').value

    if (pincode.length === 0) {
        pincodeError.innerHTML = "Pincode required!";
        return false;
    }
    if (!pincode.match(pincodeRegex)) {
        pincodeError.innerHTML = 'Enter a valid pincode no.'
        return false
    }
    pincodeError.innerHTML = ""
    return true
}

function validateTown() {
    let town = document.getElementById("town").value

    if (town.length === 0) {
        townError.innerHTML = "Town required!";
        return false;
    }
    if (!town.match(nameRegex)) {
        townError.innerHTML = "Only letters are allowed";
        return false;
    }
    townError.innerHTML = "";
    return true;
}

function validateState() {
    let state = document.getElementById("state").value

    if (state.length === 0) {
        stateError.innerHTML = "State required!";
        return false;
    }
    if (!state.match(nameRegex)) {
        stateError.innerHTML = "Only letters are allowed";
        return false;
    }
    stateError.innerHTML = "";
    return true;
}




function validateForm() {
    if (!validateName() || !validateMobile() || !validatePincode() ||!validateAddress()|| !validateTown() || !validateState() ) {
        return false;
    }
}