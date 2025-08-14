package com.ssafy.backend.whiteBoard.dto.request;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CreateDiagramRequestDTO {
    // 공통 필드
    private String type;       // CIRCLE, RECT, PEN, TEXT, ARROW 등

    private Double x;
    private Double y;
    private Double scaleX;
    private Double scaleY;
    private Double rotation;

    private String stroke;
    private String fill;

    // TEXT 전용
    private String text;

    // CIRCLE 전용
    private Double radius;

    // RECT 전용
    private Double width;
    private Double height;

    // PEN, ARROW 전용
    private List<Double> points;
}
