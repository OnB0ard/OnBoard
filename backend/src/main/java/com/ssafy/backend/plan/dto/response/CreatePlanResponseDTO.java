package com.ssafy.backend.plan.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreatePlanResponseDTO {
    private Long planId;
    private String name;
    private String description;
    private String startDate;
    private String endDate;
    private String hashTag;
    private String imageUrl;
}