package com.ssafy.backend.place.entity;

import com.ssafy.backend.common.entity.DateEntity;
import com.ssafy.backend.plan.entity.Bookmark;
import com.ssafy.backend.whiteBoard.entity.WhiteBoardObject;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "place")
@Data
@Builder
@AllArgsConstructor
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

    @Column(name = "place_url")
    private String placeUrl;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "site_url")
    private String siteUrl;

    private String category;

    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WhiteBoardObject> WhiteBoardObjects;

    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bookmark> bookMarks;
}