package com.ssafy.backend.mouse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MousePositionDTO {
    private String userName;
    private double x;
    private double y;
    private Long userId;
}
