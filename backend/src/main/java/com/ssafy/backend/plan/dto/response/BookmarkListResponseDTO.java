package com.ssafy.backend.plan.dto.response;

import lombok.*;

import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookmarkListResponseDTO {
    private List<BookmarkResponseDTO> bookmarkList;
}
