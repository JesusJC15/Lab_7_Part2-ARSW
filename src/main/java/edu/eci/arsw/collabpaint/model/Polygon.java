package edu.eci.arsw.collabpaint.model;

import java.util.List;

public class Polygon {
    private List<Point> points;

    public Polygon() {}

    public Polygon(List<Point> points) {
        this.points = points;
    }

    public List<Point> getPoints() { return points; }
    public void setPoints(List<Point> points) { this.points = points; }

    @Override
    public String toString() {
        return "Polygon{points=" + points + "}";
    }
}