package com.ssafy.backend.plan.dto.response;

import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.entity.UserType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserInformationResponseDTO {
    private UserStatus userStatus;
    private UserType userType;
}
