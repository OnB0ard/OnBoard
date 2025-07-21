package com.ssafy.backend.plan.dto.request;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class CreatePlanReq {
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String hashTag;
}