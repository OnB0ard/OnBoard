package com.ssafy.backend.whiteBoard.entity;

import com.ssafy.backend.common.entity.DateEntity;
import com.ssafy.backend.plan.entity.DayPlace;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.place.entity.Place;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "white_board_object")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhiteBoardObject extends DateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "white_board_object_id")
    private Long whiteBoardObjectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "object_type", nullable = false)
    private ObjectType objectType;

    private Double x;
    private Double y;

    @Column(name = "scale_x")
    private Double scaleX;

    @Column(name = "scale_y")
    private Double scaleY;

    @Column(name = "rotation")
    private Double rotation;

    @Column(name = "points", columnDefinition = "json")
    private String points;

    private String text;
    private String stroke;
    private String fill;
    private Double radius;
    private Double height;
    private Double width;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @OneToMany(mappedBy = "whiteBoardObject")
    private List<DayPlace> dayPlaces;
}
