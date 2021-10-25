var dataTable = $(".route-table").DataTable({
    "scrollY": 250,
});
let url = '/maps/route/delete/'

$(document).on('click', '.subdivision-info', function (e) {
    var subdivision = this;
    var ajax_url = "/maps/route/coordinate?subdivision_id=" + subdivision.id
    dataTable.destroy();
    dataTable = $('.route-table').DataTable({
        order: [
            [1, 'asc']
        ],
        scrollY: 300,
        serverSide: true,
        processing: true,
        ajax: ajax_url,
         initComplete: function (settings, json) {
            delete_confirm(dataTable, url)
        }
    });
});


dataTable.on('draw.dt', function () {
        delete_confirm(dataTable, url)
        setTimeout(function () {
            if (navigator.userAgent.indexOf("Mac OS X") != -1) {
                $(".dt-checkboxes-cell input, .dt-checkboxes").addClass("mac-checkbox")
            }
        }, 50);
    });