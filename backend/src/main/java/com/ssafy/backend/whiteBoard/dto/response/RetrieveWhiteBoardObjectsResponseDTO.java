package com.ssafy.backend.whiteBoard.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class RetrieveWhiteBoardObjectsResponseDTO {
    private List<WhiteBoardDiagramDTO> whiteBoardDiagrams;
    private List<WhiteBoardPlaceDTO> whiteBoardPlaces;
}
