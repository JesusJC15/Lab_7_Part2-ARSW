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
        });
    };

    var setStatus = function (text) {
        document.getElementById("status").textContent = text;
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

            stompClient.send(currentTopic, {}, JSON.stringify(pt));
        }

    };

})();