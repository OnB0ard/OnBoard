package com.ssafy.backend.plan.responseDTO;

import com.ssafy.backend.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatorDTO {
    private Long userId;
    private String userName;
    private String googleEmail;
    private String profileImage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private UserStatus userStatus;
}
