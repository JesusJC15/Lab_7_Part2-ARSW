package edu.eci.arsw.collabpaint;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    private ConcurrentMap<String, List<Point>> drawings = new ConcurrentHashMap<>();

    private static final int POLYGON_SIZE = 4;

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.printf("Nuevo punto recibido en dibujo %s: %s%n", numdibujo, pt);

        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        drawings.putIfAbsent(numdibujo, new ArrayList<>());
        List<Point> currentPoints = drawings.get(numdibujo);

        synchronized (currentPoints) {
            currentPoints.add(pt);

            if (currentPoints.size() == POLYGON_SIZE) {
                Polygon polygon = new Polygon(new ArrayList<>(currentPoints));
                msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);
                System.out.println("¡Polígono enviado! (" + numdibujo + "): " + polygon);
                currentPoints.clear();
            }
        }
    }
}