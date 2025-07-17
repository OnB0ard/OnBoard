package com.ssafy.backend.plan.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "place")
@Getter
public class Place {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "google_place_id")
    private String googlePlaceId;
    @Column(name = "place_name")
    private String placeName;
    private Double lat;
    private Double lon;

    @OneToMany(mappedBy = "place",cascade = CascadeType.ALL)
    private List<PlanPlace> planPlaces;

    @OneToMany(mappedBy = "place",cascade = CascadeType.ALL)
    private List<Bookmark> bookMarks;
}