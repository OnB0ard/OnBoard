package com.ssafy.backend.plan.dto.response;

import com.ssafy.backend.user.entity.UserStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserStatusResponseDTO {
    private UserStatus userStatus;
}
