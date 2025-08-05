package com.ssafy.backend.whiteBoard.dto.request;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ModifyWhiteBoardObjectRequestDTO {
    // 공통 필드
    private String type;     // 예: CIRCLE, TEXT, PEN, ARROW 등
    private double x;
    private double y;
    private double scaleX;
    private double scaleY;
    private double rotation;

    // 선택적 필드
    private List<Double> points; // 화살표나 펜 도형일 경우
    private String text;         // 텍스트 도형일 경우
}
