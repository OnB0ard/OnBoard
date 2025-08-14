package com.ssafy.backend.whiteBoard.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class WhiteBoardDiagramDTO {
    private Long whiteBoardObjectId;
    private String type;

    private Double x;
    private Double y;
    private Double scaleX;
    private Double scaleY;
    private Double rotation;

    private Double radius;
    private Double width;
    private Double height;

    private String stroke;
    private String fill;
    private String text;

    private List<Double> points;
}
