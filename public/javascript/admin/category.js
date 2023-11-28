$(document).on("click", ".popupBTN", function () {
    var cId = $(this).data('id');
    var cVal = $(this).data('val');

    $(".modal-body #catID").val(cId);
    $(".modal-body #newName").val(cVal);

});

$(document).on("click", ".offerBtn", function () {
    var cId = $(this).data('id');
    $("#offerCategoryId").val(cId);

});

$('.modalBTN').click( function () {
    var catId = $(this).data('id');
    var routeURL = '/admin/category/status/'+catId
    $(".modal-footer #confirmBTN").attr('href', routeURL);
});



function validateForm() {
    const categoryName = document.getElementById('categoryName').value;
    const categoryError = document.getElementById('categoryError');

    if (!categoryName || categoryName.length === 0 || categoryName.trim().length > 25 || /^\s/.test(categoryName) || /\s{2,}/.test(categoryName) || /\s$/.test(categoryName) || !/^[\w]+(?:[\s][\w]+)*$/.test(categoryName)) {
        categoryError.innerHTML = "Note:Category name must be between 1 and 25 characters.";
        return false; // Prevent form submission
    }

    // Clear error message if validation passes
    categoryError.innerHTML = "";
    return true; // Allow form submission
}

function validateEditForm() {
    const editedCategoryName = document.getElementById('newName').value;
    const editCategoryError = document.getElementById('editCategoryError');

if (!editedCategoryName || editedCategoryName.length === 0 || editedCategoryName.trim().length > 25 || /^\s/.test(editedCategoryName) || /\s{2,}/.test(editedCategoryName) || /\s$/.test(editedCategoryName) || !/^[\w]+(?:[\s][\w]+)*$/.test(editedCategoryName)) {
    editCategoryError.innerHTML = "Category name must be valid and between 1 and 25 characters.";
       return false; // Prevent form submission
    }

    // Clear error message if validation passes
    editCategoryError.textContent = "";
    return true; // Allow form submission
}