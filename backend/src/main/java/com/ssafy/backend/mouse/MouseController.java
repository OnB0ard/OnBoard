package com.ssafy.backend.mouse;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MouseController {
    private final SimpMessagingTemplate messagingTemplate;
    @MessageMapping("/mouse/move/{planId}") // 클라이언트 → 서버: /app/mouse.move
//    @SendTo("/topic/mouse/{planId}")        // 서버 → 모든 클라이언트: /topic/mouse
    public void  broadcastMouse(@DestinationVariable String planId, MousePositionDTO dto, SimpMessageHeaderAccessor accessor) {
        dto.setUserName((String) accessor.getSessionAttributes().get("userName"));
        dto.setUserId((Long) accessor.getSessionAttributes().get("userId"));
        messagingTemplate.convertAndSend("/topic/mouse/" + planId, dto);
    }
}
