// 새 파일: com.ssafy.backend.whiteBoard.dto.response.CreateTravelResult.java
package com.ssafy.backend.whiteBoard.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CreateTravelResult {
    private final Long whiteBoardObjectId;
    private final Long placeId;
}
