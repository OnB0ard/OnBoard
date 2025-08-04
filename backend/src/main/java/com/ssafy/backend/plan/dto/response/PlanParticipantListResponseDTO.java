package com.ssafy.backend.plan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanParticipantListResponseDTO {
    private CreatorResponseDTO creator;
    private List<ParticipantResponseDTO> userlist;
}
