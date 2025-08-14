//package com.ssafy.backend.plan.repository;
//
//import com.querydsl.jpa.impl.JPAQueryFactory;
//import com.ssafy.backend.common.config.QuerydslTestConfig;
//import com.ssafy.backend.plan.entity.Plan;
//import com.ssafy.backend.user.entity.User;
//import com.ssafy.backend.user.entity.UserPlan;
//import com.ssafy.backend.user.entity.UserType;
//import jakarta.persistence.EntityManager;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
//import org.springframework.context.annotation.Import;
//
//import java.time.LocalDate;
//import java.util.ArrayList;
//import java.util.List;
//
//import static org.assertj.core.api.Assertions.assertThat;
//
//@DataJpaTest
//@Import({QuerydslTestConfig.class})
//class PlanQueryRepositoryTest {
//
//    @Autowired
//    private EntityManager em;
//
//    private PlanQueryRepository planQueryRepository;
//    private Long user1Id;
//    private Long user2Id;
//    private Long plan1Id;
//    private Long plan2Id;
//
//    @BeforeEach
//    void setUp() {
//        planQueryRepository = new PlanQueryRepositoryImpl(new JPAQueryFactory(em));
//
//        // 테스트 데이터 생성
//        User user1 = User.builder()
//                .userName("테스트 유저1")
//                .googleEmail("test1@gmail.com")
//                .profileImage("profile1.jpg")
//                .userPlans(new ArrayList<>())
//                .tokens(new ArrayList<>())
//                .build();
//        em.persist(user1);
//
//        User user2 = User.builder()
//                .userName("테스트 유저2")
//                .googleEmail("test2@gmail.com")
//                .profileImage("profile2.jpg")
//                .userPlans(new ArrayList<>())
//                .tokens(new ArrayList<>())
//                .build();
//        em.persist(user2);
//
//        Plan plan1 = new Plan();
//        plan1.setPlanName("제주도 여행");
//        plan1.setPlanDescription("제주도 3박 4일 여행");
//        plan1.setStartDate(LocalDate.now());
//        plan1.setEndDate(LocalDate.now().plusDays(3));
//        plan1.setPlanImage("jeju.jpg");
//        plan1.setUserPlans(new ArrayList<>());
//        plan1.setPlanPlaces(new ArrayList<>());
//        plan1.setBookmarks(new ArrayList<>());
//        em.persist(plan1);
//
//        Plan plan2 = new Plan();
//        plan2.setPlanName("부산 여행");
//        plan2.setPlanDescription("부산 2박 3일 여행");
//        plan2.setStartDate(LocalDate.now().plusWeeks(1));
//        plan2.setEndDate(LocalDate.now().plusWeeks(1).plusDays(2));
//        plan2.setPlanImage("busan.jpg");
//        plan2.setUserPlans(new ArrayList<>());
//        plan2.setPlanPlaces(new ArrayList<>());
//        plan2.setBookmarks(new ArrayList<>());
//        em.persist(plan2);
//
//        // UserPlan 연결
//        UserPlan userPlan1 = new UserPlan();
//        userPlan1.setUser(user1);
//        userPlan1.setPlan(plan1);
//        userPlan1.setUserType(UserType.CREATOR);
//        em.persist(userPlan1);
//
//        UserPlan userPlan2 = new UserPlan();
//        userPlan2.setUser(user2);
//        userPlan2.setPlan(plan2);
//        userPlan2.setUserType(UserType.CREATOR);
//        em.persist(userPlan2);
//
//        em.flush();
//        em.clear();
//
//        user1Id = user1.getUserId();
//        user2Id = user2.getUserId();
//        plan1Id = plan1.getPlanId();
//        plan2Id = plan2.getPlanId();
//    }
//
//    @Test
//    @DisplayName("특정 사용자가 작성한 계획 목록을 조회할 수 있다")
//    void findByWriter() {
//        // given
//
//        // when
//        List<Plan> plans = planQueryRepository.findByWriter(user1Id);
//
//        // then
//        assertThat(plans).isNotEmpty();
//        assertThat(plans).hasSize(1);
//        assertThat(plans.get(0).getPlanName()).isEqualTo("제주도 여행");
//        assertThat(plans.get(0).getPlanDescription()).isEqualTo("제주도 3박 4일 여행");
//    }
//
//    @Test
//    @DisplayName("존재하지 않는 사용자의 계획 목록은 빈 리스트를 반환한다")
//    void findByWriter_WhenUserNotExists() {
//        // given
//        Long nonExistentUserId = 999L;
//
//        // when
//        List<Plan> plans = planQueryRepository.findByWriter(nonExistentUserId);
//
//        // then
//        assertThat(plans).isEmpty();
//    }
//}
