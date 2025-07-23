package com.ssafy.backend.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Builder
public class ModifyProfileResponseDTO {
    private String userName;
    private String profileImage;
}
