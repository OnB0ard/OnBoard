package com.ssafy.backend.plan.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.backend.plan.dto.request.CreateDayScheduleRequestDTO;
import com.ssafy.backend.plan.dto.request.RenameDayScheduleRequestDTO;
import com.ssafy.backend.plan.dto.websocket.DayScheduleSocketDTO;
import com.ssafy.backend.plan.service.DayScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DayScheduleSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final DayScheduleService dayScheduleService;

    @MessageMapping("/daySchedule/{planId}")
    public void handleDayScheduleSocket(@DestinationVariable Long planId,
                                        @Payload DayScheduleSocketDTO dayScheduleSocketDTO,
                                        SimpMessageHeaderAccessor accessor) throws JsonProcessingException {

        Long userId = (Long) accessor.getSessionAttributes().get("userId");

        switch (dayScheduleSocketDTO.getAction()) {
            case "CREATE" :
                CreateDayScheduleRequestDTO createDayScheduleRequestDTO = dayScheduleSocketDTO.toCreateDayScheduleRequestDTO();
                Long dayScheduleId = dayScheduleService.createDaySchedule(planId, createDayScheduleRequestDTO, userId);
                dayScheduleSocketDTO.setDayScheduleId(dayScheduleId);
                messagingTemplate.convertAndSend("/topic/daySchedule/" + planId, dayScheduleSocketDTO);
                break;

            case "RENAME" :
                RenameDayScheduleRequestDTO renameDayScheduleRequestDTO = dayScheduleSocketDTO.toRenameDayScheduleRequestDTO();
                dayScheduleService.renameDaySchedule(planId, dayScheduleSocketDTO.getDayScheduleId(), renameDayScheduleRequestDTO, userId);
                messagingTemplate.convertAndSend("/topic/daySchedule/" + planId, dayScheduleSocketDTO);
                break;

            case "MOVE" :
                // 실시간 이동 (저장 없음)
                messagingTemplate.convertAndSend("/topic/daySchedule/" + planId, dayScheduleSocketDTO);
                break;

            case "UPDATE_SCHEDULE" :
                dayScheduleService.updateSchedulePosition(planId, dayScheduleSocketDTO.getDayScheduleId(), dayScheduleSocketDTO.toUpdateSchedulePositionRequestDTO(), userId);
                DayScheduleSocketDTO updateScheduleDayScheduleSocketDTO = DayScheduleSocketDTO.builder()
                        .action("UPDATE_SCHEDULE")
                        .dayScheduleId(dayScheduleSocketDTO.getDayScheduleId())
                        .dayOrder(dayScheduleSocketDTO.getDayOrder())
                        .modifiedDayOrder(dayScheduleSocketDTO.getModifiedDayOrder())
                        .build();
                messagingTemplate.convertAndSend("/topic/daySchedule/" + planId, updateScheduleDayScheduleSocketDTO);
                break;

            case "DELETE" :
                dayScheduleService.deleteDaySchedule(planId, dayScheduleSocketDTO.getDayScheduleId(), userId);
                DayScheduleSocketDTO deleteDayScheduleSocketDTO = DayScheduleSocketDTO.builder()
                        .action("DELETE")
                        .dayScheduleId(dayScheduleSocketDTO.getDayScheduleId())
                        .build();
                messagingTemplate.convertAndSend("/topic/daySchedule/" + planId, deleteDayScheduleSocketDTO);
                break;

            default:
                log.warn("지원하지 않는 WebSocket action: {}", dayScheduleSocketDTO.getAction());
                throw new IllegalArgumentException("지원하지 않는 WebSocket action: " + dayScheduleSocketDTO.getAction());
        }
    }
}