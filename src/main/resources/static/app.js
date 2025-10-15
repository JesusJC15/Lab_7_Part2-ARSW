var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var currentTopic = null;
    var connected = false;
    var currentId = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.stroke();
    };

    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function (id) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        currentId = id;
        currentTopic = "/topic/newpoint." + id;

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            connected = true;
            setStatus("Conectado a " + currentTopic);
            document.getElementById("connectBtn").disabled = true;
            document.getElementById("disconnectBtn").disabled = false;
            document.getElementById("drawingId").disabled = true;

            stompClient.subscribe(currentTopic, function (eventbody) {
                var theObject = JSON.parse(eventbody.body);
                addPointToCanvas(theObject);
            });

            var polygonTopic = "/topic/newpolygon." + id;
            stompClient.subscribe(polygonTopic, function (message) {
                var polygon = JSON.parse(message.body);
                drawPolygon(polygon.points);
            });
        });
    };

    var setStatus = function (text) {
        document.getElementById("status").textContent = text;
    };

    var drawPolygon = function(points) {
        if (points.length < 3) return;
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 150, 255, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "blue";
        ctx.stroke();
    };

    return {

        init: function () {
            var canvas = document.getElementById("canvas");

            canvas.addEventListener('click', function (event) {
                if (!connected) {
                    alert("Conéctate primero seleccionando un ID y pulsando 'Conectarse'");
                    return;
                }
                var pos = getMousePosition(event);
                app.publishPoint(pos.x, pos.y);
            });

            document.getElementById("connectBtn").addEventListener("click", function () {
                var id = document.getElementById("drawingId").value;
                if (id === "") {
                    alert("Ingresa un número de dibujo");
                    return;
                }
                connectAndSubscribe(id);
            });

            document.getElementById("disconnectBtn").addEventListener("click", function () {
                if (stompClient !== null) {
                    stompClient.disconnect();
                }
                connected = false;
                setStatus("Desconectado");
                document.getElementById("connectBtn").disabled = false;
                document.getElementById("disconnectBtn").disabled = true;
                document.getElementById("drawingId").disabled = false;
            });
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at: (" + pt.x + "," + pt.y + ")");
            addPointToCanvas(pt);

            stompClient.send("/app/newpoint." + currentId, {}, JSON.stringify(pt));
        }

    };

})();