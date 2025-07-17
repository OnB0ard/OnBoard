package com.ssafy.backend.whiteBoard.entity;

import com.ssafy.backend.plan.entity.Plan;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "white_board")
@Getter
public class WhiteBoard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "white_board_id")
    private Long whiteBoardId;
    private String type;

    @ManyToOne
    @JoinColumn(name = "plan_id")
    private Plan plan;
}