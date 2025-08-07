package com.ssafy.backend.mouse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MousePositionDTO {
    private Long userId; // 세션 ID나 유저 이름
    private double x;
    private double y;
}
