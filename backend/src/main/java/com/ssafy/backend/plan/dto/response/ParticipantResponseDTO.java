package com.ssafy.backend.plan.dto.response;

import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.entity.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ParticipantResponseDTO {
    private Long userId;
    private String userName;
    private String googleEmail;
    private String profileImage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private UserType userType;
    private UserStatus userStatus;
}
