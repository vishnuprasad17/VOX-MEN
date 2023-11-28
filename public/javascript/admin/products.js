$('#sortTable').DataTable({
    responsive: true
});

$(document).on("click", ".offerBtn", function () {
    var cId = $(this).data('id');
    $("#offerProductId").val(cId);

});

$(document).on("click", ".offerProductBtn", function () {
    var cId = $(this).data('id');
    $("#offerProductId").val(cId);

});

$('.modalBTN').click(function () {
    var userId = $(this).data('id');
    var routeURL = '/admin/product/delete/' + userId
    $(".modal-footer #confirmBTN").attr('href', routeURL);
});