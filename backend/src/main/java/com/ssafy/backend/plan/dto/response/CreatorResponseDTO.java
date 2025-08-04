package com.ssafy.backend.plan.dto.response;

import com.ssafy.backend.user.entity.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatorResponseDTO {
    private Long userId;
    private String userName;
    private String googleEmail;
    private String profileImage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private UserStatus userStatus;
}
