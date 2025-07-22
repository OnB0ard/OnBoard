package com.ssafy.backend.plan.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class RetrievePlanResponse {
    private Long planId;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String hashTag;
    private String imageUrl;
}
