package com.ssafy.backend.plan.entity;

import com.ssafy.backend.common.entity.DateEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "place")
@Data
public class Place extends DateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "google_place_id")
    private String googlePlaceId;
    @Column(name = "place_name")
    private String placeName;
    private Double latitude;
    private Double longitude;

    @Column(name = "phone_number")
    private String phoneNumber;

    private String address;

    private Double rating;
    @Column(name = "rating_count")
    private Integer ratingCount;
    @Column(name = "google_url")
    private String googleUrl;

    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlanPlace> planPlaces;

    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bookmark> bookMarks;

    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlacePhoto>  placePhotos;
}