package com.ssafy.backend.plan.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.backend.plan.dto.request.CreateDayPlaceRequestDTO;
import com.ssafy.backend.plan.dto.request.RenameMemoRequestDTO;
import com.ssafy.backend.plan.dto.websocket.DayPlaceSocketDTO;
import com.ssafy.backend.plan.service.DayPlaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DayPlaceSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final DayPlaceService dayPlaceService;

    @MessageMapping("/dayPlace/{planId}")
    public void handleDayPlaceSocket(@DestinationVariable Long planId,
                                     DayPlaceSocketDTO dayPlaceSocketDTO,
                                     SimpMessageHeaderAccessor accessor) throws JsonProcessingException {

        Long userId = (Long) accessor.getSessionAttributes().get("userId");

        switch (dayPlaceSocketDTO.getAction()) {
            case "CREATE":
                CreateDayPlaceRequestDTO createDayPlaceRequestDTO = dayPlaceSocketDTO.toCreateDayPlaceRequestDTO();
                Long dayPlaceId = dayPlaceService.createDayPlace(planId, dayPlaceSocketDTO.getDayScheduleId(), createDayPlaceRequestDTO, userId);
                dayPlaceSocketDTO.setDayPlaceId(dayPlaceId);
                messagingTemplate.convertAndSend("/topic/dayPlace/" + planId, dayPlaceSocketDTO);
                break;

            case "RENAME":
                RenameMemoRequestDTO renameMemoRequestDTO = dayPlaceSocketDTO.toRenameMemoRequestDTO();
                dayPlaceService.renameMemo(planId, dayPlaceSocketDTO.getDayScheduleId(), dayPlaceSocketDTO.getDayPlaceId(), renameMemoRequestDTO, userId);
                messagingTemplate.convertAndSend("/topic/dayPlace/" + planId, dayPlaceSocketDTO);
                break;

            case "MOVE" :
                // 실시간 이동 (저장 없음)
                messagingTemplate.convertAndSend("/topic/dayPlace/" + planId, dayPlaceSocketDTO);
                break;

            case "UPDATE_INNER" :
                dayPlaceService.updateInnerPosition(planId, dayPlaceSocketDTO.getDayScheduleId(), dayPlaceSocketDTO.toUpdateInnerPositionRequestDTO(), userId);
                DayPlaceSocketDTO updateInnerDayPlaceSocketDTO = DayPlaceSocketDTO.builder()
                        .action("UPDATE_INNER")
                        .dayPlaceId(dayPlaceSocketDTO.getDayPlaceId())
                        .dayScheduleId(dayPlaceSocketDTO.getDayScheduleId())
                        .indexOrder(dayPlaceSocketDTO.getIndexOrder())
                        .modifiedIndexOrder(dayPlaceSocketDTO.getModifiedIndexOrder())
                        .build();
                messagingTemplate.convertAndSend("/topic/dayPlace/" + planId, updateInnerDayPlaceSocketDTO);
                break;

            case "UPDATE_OUTER" :
                dayPlaceService.updateOuterPosition(planId, dayPlaceSocketDTO.getDayScheduleId(), dayPlaceSocketDTO.toUpdateOuterPositionRequestDTO(), userId);
                DayPlaceSocketDTO updateOuterDayPlaceSocketDTO = DayPlaceSocketDTO.builder()
                        .action("UPDATE_OUTER")
                        .dayPlaceId(dayPlaceSocketDTO.getDayPlaceId())
                        .dayScheduleId(dayPlaceSocketDTO.getDayScheduleId())
                        .modifiedDayScheduleId(dayPlaceSocketDTO.getModifiedDayScheduleId())
                        .indexOrder(dayPlaceSocketDTO.getIndexOrder())
                        .modifiedIndexOrder(dayPlaceSocketDTO.getModifiedIndexOrder())
                        .build();
                messagingTemplate.convertAndSend("/topic/dayPlace/" + planId, updateOuterDayPlaceSocketDTO);
                break;

            case "DELETE":
                dayPlaceService.deleteDayPlace(planId, dayPlaceSocketDTO.getDayScheduleId(), dayPlaceSocketDTO.getDayPlaceId(), userId);
                DayPlaceSocketDTO deleteDayPlaceSocketDTO = DayPlaceSocketDTO.builder()
                        .action("DELETE")
                        .dayScheduleId(dayPlaceSocketDTO.getDayScheduleId())
                        .dayPlaceId(dayPlaceSocketDTO.getDayPlaceId())
                        .build();
                messagingTemplate.convertAndSend("/topic/dayPlace/" + planId, deleteDayPlaceSocketDTO);
                break;

            default:
                log.warn("지원하지 않는 WebSocket action: {}", dayPlaceSocketDTO.getAction());
                throw new IllegalArgumentException("지원하지 않는 WebSocket action: " + dayPlaceSocketDTO.getAction());
        }
    }
}
