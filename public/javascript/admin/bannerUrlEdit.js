document.getElementById('editButton').addEventListener('click', function () {
    var inputField = document.getElementById('editableInput');
    inputField.removeAttribute('readonly');
    inputField.focus(); // This will automatically focus the cursor in the input field after clicking the "Edit" button.
});

document.getElementById('editButton2').addEventListener('click', function () {
    var inputField = document.getElementById('editableInput2');
    inputField.removeAttribute('readonly');
    inputField.focus(); // This will automatically focus the cursor in the input field after clicking the "Edit" button.
});