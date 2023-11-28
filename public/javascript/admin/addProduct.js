function handleCheckboxChange() {
    var frCheckboxes = document.querySelectorAll('#size-number input[type="checkbox"]');
    var anDiv = document.getElementById('size-character');

    // Check if any checkbox in the "fr" div is selected
    var isChecked = Array.from(frCheckboxes).some(function (checkbox) {
        return checkbox.checked;
    });

    // Enable or disable the "an" div based on the checkbox state
    if (isChecked) {
        anDiv.style.pointerEvents = 'none'; // Disable the div
        anDiv.style.opacity = '0.5'; // Optional: Reduce the opacity to indicate it's disabled
    } else {
        anDiv.style.pointerEvents = 'auto'; // Enable the div
        anDiv.style.opacity = '1'; // Optional: Restore the original opacity
    }
}


function handleCheckboxChange1() {
    var frCheckboxes = document.querySelectorAll('#size-character input[type="checkbox"]');
    var anDiv = document.getElementById('size-number');
    const brand = document.getElementById('brand').value.trim();

    // Check if any checkbox in the "fr" div is selected
    var isChecked = Array.from(frCheckboxes).some(function (checkbox) {
        return checkbox.checked;
    });

    // Enable or disable the "an" div based on the checkbox state
    if (isChecked) {
        anDiv.style.pointerEvents = 'none'; // Disable the div
        anDiv.style.opacity = '0.5'; // Optional: Reduce the opacity to indicate it's disabled
    } else {
        anDiv.style.pointerEvents = 'auto'; // Enable the div
        anDiv.style.opacity = '1'; // Optional: Restore the original opacity
    }
}




// Function to check if at least one size checkbox is checked
function isSizeChecked() {
    const characterSizes = document.querySelectorAll("#size-character input[type=checkbox]");
    const numberSizes = document.querySelectorAll("#size-number input[type=checkbox]");
    // Check if at least one checkbox is checked in either group
    return Array.from(characterSizes).some(checkbox => checkbox.checked) ||
        Array.from(numberSizes).some(checkbox => checkbox.checked);
}

    const brandError = document.getElementById('brandError');
    const productNameError = document.getElementById('productNameError');
    const descriptionError = document.getElementById('descriptionError');
    const sizeError = document.getElementById('sizeError')
    const categoryError = document.getElementById('categoryError')
    const priceError = document.getElementById('priceError')
    const discountPriceError = document.getElementById('discountPriceError')
    const compareError = document.getElementById('compareError')
// Function to handle form submission
function validateBrand() {
    const brand = document.getElementById('brand').value;

    if (!brand || brand.length === 0 || /^\s/.test(brand) || /\s{2,}/.test(brand) || /\s$,/.test(brand) || !/^[\w+|']+(?:[\s][\w+|']+)*$/.test(brand)) {
        brandError.innerHTML = "Enter a valid brand!";
        return false;
    }
    if (brand.trim().length > 25) {
        brandError.innerHTML = "Maximum 25 charecters are allowed";
        return false;
    }
    brandError.innerHTML = "";
    return true;
}

function validateProduct() {
    const productname=document.getElementById('name').value;

    if (!productname || productname.length === 0 || /^\s/.test(productname) || /\s{2,}/.test(productname) || /\s$,/.test(productname)) {
        productNameError.innerHTML = "Enter a valid product name!";
        return false;
    }
    if (productname.trim().length > 50) {
        productNameError.innerHTML = "Maximum 50 charecters are allowed";
        return false;
    }
    productNameError.innerHTML = "";
    return true;
}

function validateSize() {

    if (!isSizeChecked()) {
        sizeError.innerHTML = "Please select at least one size!";
        return false;
    }
    sizeError.innerHTML = "";
    return true;
}

function validateCategory() {
    const category = document.getElementById('category').value;

    if (category === 'null') {
        categoryError.innerHTML = "Please select at least one size!";
        return false;
    }
    categoryError.innerHTML = "";
    return true;
}

function validateDescription() {
    const description = document.getElementById('description').value;

    if (!description || description.length === 0 || /^\s/.test(description) || /\s{2,}/.test(description) || /\s$.,/.test(description)) {
        descriptionError.innerHTML = "Enter a valid description!";
        return false;
    }
    if (description.trim().length > 150) {
        descriptionError.innerHTML = "Maximum 150 characters are allowed";
        return false;
    }
    descriptionError.innerHTML = "";
    return true;
}


function validatePrice() {
    const priceInput = document.getElementById('priceid');
    const price = parseFloat(priceInput.value);

    if (isNaN(price) || price <= 0) {
        priceError.innerHTML = "Please enter a valid positive price!";
        priceInput.classList.add('is-invalid'); // Optionally add a visual indication of error
        return false;
    } else {
        priceError.innerHTML = "";
        priceInput.classList.remove('is-invalid'); // Remove error indication if valid
        return true;
    }
}


function validateDiscountPrice() {
    const discountPrice = parseFloat(document.getElementById('discountprice').value);
    const actualPrice = parseFloat(document.getElementById('priceid').value);

    if (isNaN(discountPrice) || discountPrice >= actualPrice) {
        discountPriceError.innerHTML = "Enter a valid discount price!";
        return false;
    }
    discountPriceError.innerHTML = "";
    return true;
}




function validateForm() {
    if (!validateBrand() || !validateProduct() || !validateSize() || !validateCategory() || !validateDescription()|| !validatePrice() || !validateDiscountPrice()) {
        return false;
    }
}
