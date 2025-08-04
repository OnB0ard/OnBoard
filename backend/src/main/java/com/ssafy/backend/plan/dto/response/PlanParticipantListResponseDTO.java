package com.ssafy.backend.plan.dto.response;

import lombok.*;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanParticipantListResponseDTO {
    private CreatorResponseDTO creator;
    private List<ParticipantResponseDTO> userlist;
}
