package com.ssafy.backend.whiteBoard.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ObjectInfoDTO {
    private Long whiteBoardObjectId;
    private Double x;
    private Double y;
}