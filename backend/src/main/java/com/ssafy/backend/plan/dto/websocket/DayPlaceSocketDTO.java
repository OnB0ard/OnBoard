package com.ssafy.backend.plan.dto.websocket;

import com.ssafy.backend.plan.dto.request.CreateDayPlaceRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdateInnerPositionRequestDTO;
import com.ssafy.backend.plan.dto.request.RenameMemoRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdateOuterPositionRequestDTO;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DayPlaceSocketDTO {
    private String action;

    private Long dayPlaceId;

    private Long dayScheduleId;
    private Long modifiedDayScheduleId;
    private Long placeId;

    private Integer indexOrder;
    private Integer modifiedIndexOrder;

    private String memo;

    public CreateDayPlaceRequestDTO toCreateDayPlaceRequestDTO() {
        return CreateDayPlaceRequestDTO.builder()
                .placeId(placeId)
                .indexOrder(indexOrder)
                .build();
    }

    public UpdateInnerPositionRequestDTO toUpdateInnerPositionRequestDTO() {
        return UpdateInnerPositionRequestDTO.builder()
                .dayPlaceId(dayPlaceId)
                .indexOrder(indexOrder)
                .modifiedIndexOrder(modifiedIndexOrder)
                .build();
    }

    public UpdateOuterPositionRequestDTO toUpdateOuterPositionRequestDTO() {
        return UpdateOuterPositionRequestDTO.builder()
                .dayPlaceId(dayPlaceId)
                .modifiedDayScheduleId(modifiedDayScheduleId)
                .indexOrder(indexOrder)
                .modifiedIndexOrder(modifiedIndexOrder)
                .build();
    }

    public RenameMemoRequestDTO toRenameMemoRequestDTO() {
        return RenameMemoRequestDTO.builder()
                .memo(memo)
                .build();
    }
}
