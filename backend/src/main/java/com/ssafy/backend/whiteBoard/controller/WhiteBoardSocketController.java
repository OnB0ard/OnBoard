package com.ssafy.backend.whiteBoard.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.backend.whiteBoard.dto.request.*;
import com.ssafy.backend.whiteBoard.dto.websocket.WhiteBoardSocketDTO;
import com.ssafy.backend.whiteBoard.service.WhiteBoardService;
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
public class WhiteBoardSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final WhiteBoardService whiteBoardService;

    @MessageMapping("/whiteboard/{planId}")
    public void handleWhiteBoardSocket(@DestinationVariable Long planId,
                                       @Payload WhiteBoardSocketDTO whiteBoardSocketDTO,
                                       SimpMessageHeaderAccessor accessor) throws JsonProcessingException {

        Long userId = (Long) accessor.getSessionAttributes().get("userId");

        switch (whiteBoardSocketDTO.getAction()) {
            case "MOVE":
                // 도형 실시간 이동 (저장 없음)
                messagingTemplate.convertAndSend("/topic/whiteboard/" + planId, whiteBoardSocketDTO);
                break;

            case "MODIFY":
                // 도형 최종 수정
                ModifyWhiteBoardObjectRequestDTO modifyDto = whiteBoardSocketDTO.toModifyRequestDTO();
                whiteBoardService.modifyWhiteBoardObject(planId, whiteBoardSocketDTO.getWhiteBoardObjectId(), modifyDto, userId);

                // 수정 내용 그대로 브로드캐스트 (ID 포함됨)
                messagingTemplate.convertAndSend("/topic/whiteboard/" + planId, whiteBoardSocketDTO);
                break;

            case "CREATE":
                // 일반 도형 생성 → 저장된 도형으로 응답 whiteBoardSocketDTO 구성
                CreateDiagramRequestDTO createDiagramDTO = whiteBoardSocketDTO.toCreateDiagramRequestDTO();
                Long diagramId = whiteBoardService.createDiagram(planId, createDiagramDTO, userId);
                whiteBoardSocketDTO.setWhiteBoardObjectId(diagramId);
                messagingTemplate.convertAndSend("/topic/whiteboard/" + planId, whiteBoardSocketDTO);
                break;

            case "CREATE_PLACE":
                // 장소 기반 도형 생성 → 저장된 도형으로 응답 whiteBoardSocketDTO 구성
                CreateTravelRequestDTO createTravelDTO = whiteBoardSocketDTO.toCreateTravelRequestDTO();
                CreateTravelResult result  = whiteBoardService.createTravel(planId, createTravelDTO, userId);
                whiteBoardSocketDTO.setWhiteBoardObjectId(result.getWhiteBoardObjectId());
                whiteBoardSocketDTO.setPlaceId(result.getPlaceId());

                log.info("[CREATE_PLACE][Broadcast] whiteBoardObjectId={}, placeId={}",
                        whiteBoardSocketDTO.getWhiteBoardObjectId(),
                        whiteBoardSocketDTO.getPlaceId());

                messagingTemplate.convertAndSend("/topic/whiteboard/" + planId, whiteBoardSocketDTO);
                break;

            case "DELETE":
                // 도형 삭제 → ID만 포함된 DTO로 응답
                whiteBoardService.deleteWhiteBoardObject(planId, whiteBoardSocketDTO.getWhiteBoardObjectId(), userId);
                WhiteBoardSocketDTO deleteDto = WhiteBoardSocketDTO.builder()
                        .action("DELETE")
                        .whiteBoardObjectId(whiteBoardSocketDTO.getWhiteBoardObjectId())
                        .build();
                messagingTemplate.convertAndSend("/topic/whiteboard/" + planId, deleteDto);
                break;
            case "MODIFY_LINE":
                CreateLineRequestDTO createLineRequestDTO = whiteBoardSocketDTO.toCreateLineRequestDTO();
                Long lineId = whiteBoardService.createLine(planId, createLineRequestDTO, userId);
                createLineRequestDTO.setWhiteBoardObjectId(lineId);
                createLineRequestDTO.setUserId(userId);
                messagingTemplate.convertAndSend("/topic/whiteboard/" + planId, createLineRequestDTO);
                break;
            default:
                log.warn("지원하지 않는 WebSocket action: {}", whiteBoardSocketDTO.getAction());
                throw new IllegalArgumentException("지원하지 않는 WebSocket action: " + whiteBoardSocketDTO.getAction());
        }
    }
}
