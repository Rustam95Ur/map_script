var drawingManager,
    selectedShape,
    coordinate_lon_array = [],
    coordinate_lat_array = [],
    markers = [];

function clearSelection() {
    if (selectedShape) {
        selectedShape.setEditable(false);
        selectedShape = null;
    }
}

function setSelection(shape) {
    clearSelection();
    selectedShape = shape;
    shape.setEditable(true);
}

function deleteSelectedShape() {
    $('#delete-button').hide()
    $('#save-button').hide()
    $('#add-button').show()
    document.getElementById("color").disabled = false;
    document.getElementById("subdivision_select").disabled = false;
    document.getElementById("title").readOnly = false;
    if (selectedShape) {
        selectedShape.setMap(null);
    }
}

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: new google.maps.LatLng(51.169392, 71.449074),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true
    });

    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon']
        },
        polygonOptions: {
            editable: true
        }


    });
    // $('#subdivision_select').on('change', function () {
    //     var xhr = new XMLHttpRequest(),
    //         subdivision_id = $(this).val();
    //     clearMarkers();
    //     if (selectedShape) {
    //         selectedShape.setMap(null);
    //     }
    //     xhr.onload = xhr.onerror = function () {
    //         var response = JSON.parse(this.response);
    //         if (this.status === 200) {
    //             $.each(response.result, function (key, value) {
    //                 var coordinate_lat = JSON.parse(value.coordinate_lat),
    //                     coordinate_lon = JSON.parse(value.coordinate_lon);
    //                 var coordinates = []
    //                 for (let k = 0; k < coordinate_lon.length; k++) {
    //                     coordinates.push(new google.maps.LatLng(coordinate_lat[k], coordinate_lon[k]))
    //                 }
    //                 var boundary = new google.maps.Polygon({
    //                     paths: coordinates,
    //                     geodesic: true,
    //                     strokeColor: value.color,
    //                     strokeOpacity: 1,
    //                     strokeWeight: 2,
    //                     fillColor: value.color,
    //                     fillOpacity: 0.1,
    //                     content: value.title
    //                 });
    //                 markers.push(boundary);
    //                 boundary.setMap(map);
    //                 boundary.addListener('click', showArrays);
    //             });
    //         }
    //     }
    //     xhr.open('GET', '/maps/route/coordinate/' + subdivision_id, false);
    //     xhr.send();
    // })

    infoWindow = new google.maps.InfoWindow;

    function showArrays(event) {
        var vertices = this.getPath();
        infoWindow.setContent(this.content);
        infoWindow.setPosition(event.latLng);
        infoWindow.open(map);
    }

    function clearMarkers() {
        setMapOnAll(null);
    }

    function setMapOnAll(map) {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
        markers = []
    }

    $('#add-button').on('click', function () {
        let color = $('#color').val();
        let title = $('#title').val();
        let subdivision = $('#subdivision_select').val()
        if (!title) {
            set_validate_message('title')
            return false
        }
        if (!subdivision) {
            set_validate_message('subdivision')
            return false
        }
        $('#add-button').hide()
        document.getElementById("color").disabled = true;
        document.getElementById("subdivision_select").disabled = true;
        document.getElementById("title").readOnly = true;
        drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: ['polygon']
            },
            polygonOptions: {
                editable: true
            }

        });
        drawingManager.setMap(map);
        google.maps.event.addListener(drawingManager, 'polygoncomplete', function (polygon) {
            polygon.setOptions({
                strokeColor: color,
                geodesic: true,
                content: title,
                fillOpacity: 0.1,
                strokeWeight: 2
            });
            $('#delete-button').show()
            $('#save-button').show()
            $('#add-button').hide()
            drawingManager.setOptions({
                drawingControl: true
            });
            drawingManager.setMap(null);
            drawingManager.setDrawingMode(null);
            polygon.addListener('click', showArrays);
            var coordinates = (polygon.getPath().getArray());
            for (let key in coordinates) {
                coordinate_lon_array.push(coordinates[key].lng())
                coordinate_lat_array.push(coordinates[key].lat())
            }
            google.maps.event.addListener(polygon.getPath(), 'set_at', function () {
                var coordinates = (polygon.getPath().getArray());
                coordinate_lon_array = []
                coordinate_lat_array = []
                for (let key in coordinates) {
                    coordinate_lon_array.push(coordinates[key].lng())
                    coordinate_lat_array.push(coordinates[key].lat())
                }
            });

        });
        google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
            if (e.type != google.maps.drawing.OverlayType.MARKER) {
                drawingManager.setDrawingMode(null);
                var newShape = e.overlay;
                newShape.type = e.type;
                setSelection(newShape);
            }
        });
    });

    $(".search").keyup(function () {
        var autocomplete = new google.maps.places.Autocomplete($('.search')[0]);
        autocomplete.addListener('place_changed', function () {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                return false;
            }
            map.panTo(place.geometry.location);
        });
    });

    google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
    google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', deleteSelectedShape);
    google.maps.event.addDomListener(window, 'load', initMap);
}

$('#save-button').on('click', function () {
    var formData = new FormData(document.forms.save_route);

    if (!formData.get('title')) {
        set_validate_message('title')
        return false
    } else if (!formData.get('subdivision')) {
        set_validate_message('subdivision')
        return false
    }
    formData.append("coordinate_lon", JSON.stringify(coordinate_lon_array));
    formData.append("coordinate_lat", JSON.stringify(coordinate_lat_array));
    formData.append('type', 'polygon')
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/maps/route/save");
    xhr.send(formData);
    xhr.onreadystatechange = function () { // (3)
        if (xhr.status != 200) {
            console.log(xhr.status + ': ' + xhr.statusText);
        } else {
            console.log(xhr.response)
            Swal.fire({
                title: "Успешно!",
                text: "Новый маршрут создан!",
                type: "success",
                confirmButtonClass: 'btn btn-primary',
                buttonsStyling: false,
            });
            selectedShape.setEditable(false);
            $('#delete-button').hide()
            $('#save-button').hide()
            $('#add-button').show()
            document.getElementById("color").disabled = false;
            document.getElementById("subdivision_select").disabled = false;
            document.getElementById("title").readOnly = false;
        }

    }
})
$('#subdivision_select').on('change', function () {
    $('input[name="subdivision"]').val($(this).val())
});
$('#color').on('change', function () {
    $('input[name="fill_color"]').val($(this).val())
});

function set_validate_message(type) {
    var message = '<div class="alert alert-danger mt-1 alert-validation-msg"\n' +
        'role="alert"><i class="feather icon-info mr-1 align-middle"></i>\n' +
        '<span>Данное поле обезательное</span></div>';
    $('#validate-' + type).html(message)
    setTimeout(function () {
        $('#validate-' + type).html('')
    }, 4000);
}

