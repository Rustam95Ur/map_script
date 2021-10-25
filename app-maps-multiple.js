var map, marker1, marker2, rectangle, marker_count = 0,
    coordinates = [],

    info_window = new google.maps.InfoWindow();

function initMap() {
    var mapOptions = {
        zoom: 5,
        center: new google.maps.LatLng(51.169392, 71.449074)
    };
    map = new google.maps.Map(document.getElementById('map'),
        mapOptions);

    $('#add-button').on('click', function () {
        $('.search-block').show()
        var dividerLat = parseInt($('#divider_lat_count').val());
        var dividerLng = parseInt($('#divider_lon_count').val());
        var subdivision = parseInt($('#subdivision_select').val());
        if (!dividerLat) {
            set_validate_message('lat_count')
            return false
        }
        if (!dividerLng) {
            set_validate_message('lon_count')
            return false
        }
        if (!subdivision) {
            set_validate_message('subdivision')
            return false
        }
        disable_activate_btn(true)
        map = new google.maps.Map(document.getElementById('map'),
            mapOptions);
        map.addListener("click", (e) => {
            if (marker_count === 0) {
                placeMarkerAndPanTo(e.latLng, map);
            } else if (marker_count === 1) {
                placeMarkerAndPanTo(e.latLng, map);
            }
            if (marker_count === 2) {
                create_grid_route()
                marker_count = false
            }
            map.addListener('click', function () {
                info_window.close();
            })
        });
    })

    function create_grid_route() {
        google.maps.event.addListener(marker1, 'click', function (evt) {
            info_window.setContent(marker1.getPosition().toUrlValue(6));
            info_window.open(map, this);
        });

        google.maps.event.addListener(marker2, 'click', function (evt) {
            info_window.setContent(marker1.getPosition().toUrlValue(6));
            info_window.open(map, this);
        });
        let color = $('#color').val();

        rectangle = new google.maps.Rectangle({
            strokeColor: color,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.1,
            map: map,
            bounds: new google.maps.LatLngBounds(
                marker1.getPosition(),
                marker2.getPosition())
        });


        var leftSideDist = Math.round((marker2.getPosition().lng() - marker1.getPosition().lng()) * 10000) / 100;
        var belowSideDist = Math.round((marker2.getPosition().lat() - marker1.getPosition().lat()) * 10000) / 100;

        google.maps.event.addListener(marker1, 'dragend', function () {

            rectangle.setBounds(new google.maps.LatLngBounds(marker1.getPosition(), marker2.getPosition()));
            leftSideDist = Math.round((marker2.getPosition().lng() - marker1.getPosition().lng()) * 10000) / 100;
            makeGrid();

        });

        google.maps.event.addListener(marker2, 'dragend', function () {

            rectangle.setBounds(new google.maps.LatLngBounds(marker1.getPosition(), marker2.getPosition()));
            belowSideDist = Math.round((marker2.getPosition().lat() - marker1.getPosition().lat()) * 10000) / 100;
            makeGrid();
        });
        makeGrid();
    }


}

function placeMarkerAndPanTo(latLng, map) {
    disable_activate_btn(true)
    if (marker_count === 0) {
        marker1 = new google.maps.Marker({
            position: latLng,
            map: map,
            draggable: true,
        });
    } else if (marker_count === 1) {
        marker2 = new google.maps.Marker({
            position: latLng,
            map: map,
            draggable: true,
        });
    }
    marker_count += 1
    map.panTo(latLng);
}

infoWindow = new google.maps.InfoWindow;

function showArrays(event) {
    infoWindow.setContent(this.content);
    infoWindow.setPosition(event.latLng);
    infoWindow.open(map);
}

var rectangleLat = [];
var rectangleLng = [];

function makeGrid() {
    for (x in rectangleLng) {
        for (y in rectangleLng[x]) {
            if (rectangleLng[x][y].setMap) {
                rectangleLng[x][y].setMap(null)
                rectangleLng[x][y] = null;
            }
        }
    }

    var leftSideDist = marker2.getPosition().lng() - marker1.getPosition().lng();
    var belowSideDist = marker2.getPosition().lat() - marker1.getPosition().lat();
    let color = $('#color').val();

    var dividerLat = parseInt($('#divider_lat_count').val());
    var dividerLng = parseInt($('#divider_lon_count').val());
    var excLat = belowSideDist / dividerLat;
    var excLng = leftSideDist / dividerLng;

    var m1Lat = marker1.getPosition().lat();
    var m1Lng = marker1.getPosition().lng();
    var route_number = parseInt($("#route_number").val());
    coordinates = [];
    for (var i = 0; i < dividerLat; i++) {
        if (!rectangleLng[i]) rectangleLng[i] = [];
        for (var j = 0; j < dividerLng; j++) {
            if (!rectangleLng[i][j]) rectangleLng[i][j] = {};

            var title = 'Маршрут ' + route_number;
            rectangleLng[i][j] = new google.maps.Rectangle({
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: 0.1,
                content: title,
                map: map,
                bounds: new google.maps.LatLngBounds(
                    new google.maps.LatLng(m1Lat + (excLat * i), m1Lng + (excLng * j)),
                    new google.maps.LatLng(m1Lat + (excLat * (i + 1)), m1Lng + (excLng * (j + 1))))

            });
            var bounds = rectangleLng[i][j].getBounds()
            var ne = bounds.getNorthEast();
            var sw = bounds.getSouthWest();
            var coordinate = {}
            coordinate['title'] = title
            coordinate['coordinate_lat'] = [['ne', ne.lat()], ['sw', sw.lat()]]
            coordinate['coordinate_lon'] = [['ne', ne.lng()], ['sw', sw.lng()]]
            coordinates.push(coordinate)
            rectangleLng[i][j].addListener('click', showArrays);
            route_number += 1
        }
    }
    $('#save-button').show()
    $('#add-button').hide()
    $('#delete-button').show()
}

function clearMap() {
    if (marker1) {
        marker1.setMap(null)
        marker1 = false
    }
    if (marker2) {
        marker2.setMap(null)
        marker2 = false
    }
    if (rectangle) {
        rectangle.setMap(null)
        rectangle = false
    }
    for (x in rectangleLng) {
        for (y in rectangleLng[x]) {
            if (rectangleLng[x][y]) {
                rectangleLng[x][y].setMap(null)
                rectangleLng[x][y] = false;
            }
        }
    }
    $('#delete-button').hide()
    $('#save-button').hide()
    $('#add-button').hide()
    marker_count = 0
    disable_activate_btn(false)
}

function clearMarker() {
    if (marker1) {
        marker1.setMap(null)
        marker1 = false
    }
    if (marker2) {
        marker2.setMap(null)
        marker2 = false
    }
    if (rectangle) {
        rectangle.setMap(null)
        rectangle = false
    }
    $('#delete-button').hide()
    $('#save-button').hide()
    $('#add-button').show()
    $('.search-block').hide()
    marker_count = 0
    disable_activate_btn(false)
}

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
google.maps.event.addDomListener(window, 'load', initMap);
google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', clearMap);


function set_validate_message(type) {
    var message = '<div class="alert alert-danger mt-1 alert-validation-msg"\n' +
        'role="alert"><i class="feather icon-info mr-1 align-middle"></i>\n' +
        '<span>Данное поле обезательное</span></div>';
    $('#validate-' + type).html(message)
    setTimeout(function () {
        $('#validate-' + type).html('')
    }, 4000);
}

function disable_activate_btn(status) {
    document.getElementById("color").disabled = status;
    document.getElementById("subdivision_select").disabled = status;
    document.getElementById("divider_lat_count").readOnly = status;
    document.getElementById("divider_lon_count").readOnly = status;
}

$('#save-button').on('click', function () {
    var formData = new FormData(document.forms.save_route);

    if (!formData.get('subdivision')) {
        set_validate_message('subdivision')
        return false
    }
    var f = (function () {
        var xhr = [], i;
        for (i = 0; i < coordinates.length; i++) { //for loop
            (function (i) {
                formData.append("coordinate_lon", JSON.stringify(coordinates[i]['coordinate_lon']));
                formData.append("coordinate_lat", JSON.stringify(coordinates[i]['coordinate_lat']));
                formData.append("title", coordinates[i]['title']);
                formData.append('type', 'rectangle')
                xhr[i] = new XMLHttpRequest();
                url = "/maps/route/save";
                xhr[i].open("POST", url);
                xhr[i].send(formData);
            })(i);
        }
    })();
    Swal.fire({
        title: "Успешно!",
        text: "Новые маршруты созданы!",
        type: "success",
        confirmButtonClass: 'btn btn-primary',
        buttonsStyling: false,
    });
    clearMarker()
})
$('#subdivision_select').on('change', function () {
    var subdivision_id = $(this).val();
    $('input[name="subdivision"]').val(subdivision_id)
})