package com.ssafy.backend.whiteBoard.dto.request;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Builder
@Getter
@Setter
public class CreateLineRequestDTO {
    private Long whiteBoardObjectId;
    private String action;
    private String type;       // CIRCLE, RECT, PEN, TEXT, ARROW 등
    private Double x;
    private Double y;
    private String stroke;
    private List<Double> points; // 펜, 화살표 전용
}
