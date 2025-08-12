package com.ssafy.backend.whiteBoard.dto.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.whiteBoard.dto.request.CreateDiagramRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.CreateLineRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.CreateTravelRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.ModifyWhiteBoardObjectRequestDTO;
import com.ssafy.backend.whiteBoard.entity.WhiteBoardObject;
import lombok.*;

import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Builder
public class WhiteBoardSocketDTO {

    // 공통 메타정보
    private String action; // "MOVE", "MODIFY", "CREATE", "CREATE_PLACE", "DELETE"
    private Long whiteBoardObjectId; // 삭제/수정/생성된 도형 ID
    private Long placeId;
    // 도형 공통 속성
    private String type;   // RECT, TEXT, PEN, ARROW, CIRCLE, PLACE 등
    private Double x;
    private Double y;
    private Double scaleX;
    private Double scaleY;
    private Double rotation;

    // 도형별 속성
    private String text;
    private String stroke;
    private String fill;
    private Double radius;
    private Double width;
    private Double height;
    private List<Double> points; // 펜, 화살표 전용

    // 장소형 도형용 필드 (CREATE_PLACE 전용)
    private CreateTravelRequestDTO.ObjectInfo objectInfo;
    private CreateTravelRequestDTO.WhiteBoardPlaceInfo whiteBoardPlace;

    // =====================================
    // 변환 메서드: to → 기존 RequestDTO
    // =====================================


    public ModifyWhiteBoardObjectRequestDTO toModifyRequestDTO() {
        return ModifyWhiteBoardObjectRequestDTO.builder()
                .type(type)
                .x(x)
                .y(y)
                .scaleX(scaleX)
                .scaleY(scaleY)
                .rotation(rotation)
                .points(points)
                .text(text)
                .build();
    }

    public CreateDiagramRequestDTO toCreateDiagramRequestDTO() {
        return CreateDiagramRequestDTO.builder()
                .type(type)
                .x(x)
                .y(y)
                .scaleX(scaleX)
                .scaleY(scaleY)
                .rotation(rotation)
                .stroke(stroke)
                .fill(fill)
                .radius(radius)
                .width(width)
                .height(height)
                .points(points)
                .text(text)
                .build();
    }

    public CreateTravelRequestDTO toCreateTravelRequestDTO() {
        return CreateTravelRequestDTO.builder()
                .objectInfo(objectInfo)
                .whiteBoardPlace(whiteBoardPlace)
                .build();
    }
    public CreateLineRequestDTO toCreateLineRequestDTO() {
        return CreateLineRequestDTO.builder()
                .action(action)
                .type(type)
                .x(x)
                .y(y)
                .points(points)
                .stroke(stroke)
                .build();
    }

    private static List<Double> parsePoints(String pointsJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(pointsJson, new TypeReference<List<Double>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
