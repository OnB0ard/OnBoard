package com.ssafy.backend.plan.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "place_photo")
@Data
public class PlacePhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "iamge_url")
    private String iamgeUrl;

    @Column(name = "width_px")
    private Integer widthPx;

    @Column(name = "height_px")
    private Integer heightPx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;
}
