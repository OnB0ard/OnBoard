package com.ssafy.backend.user.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RetrieveProfileResponseDTO {
    private Long userId;
    private String googleEmail;
    private String userName;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
