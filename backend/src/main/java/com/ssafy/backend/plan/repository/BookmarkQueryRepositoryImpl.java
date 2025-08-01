    package com.ssafy.backend.plan.repository;

    import com.querydsl.jpa.impl.JPAQueryFactory;
    import com.ssafy.backend.place.entity.QPlace;
    import com.ssafy.backend.plan.dto.response.BookmarkDTO;
    import com.ssafy.backend.plan.entity.Bookmark;
    import com.ssafy.backend.plan.entity.QBookmark;
    import lombok.RequiredArgsConstructor;

    import java.util.List;

    @RequiredArgsConstructor
    public class BookmarkQueryRepositoryImpl implements BookmarkQueryRepository {

        private final JPAQueryFactory queryFactory;

        public List<Bookmark> findBookmarksByPlanId(Long planId)
        {
            QBookmark bm = QBookmark.bookmark;
            QPlace p = QPlace.place;

            return queryFactory
                    .selectFrom(bm)
                    .join(bm.place, p).fetchJoin()
                    .where(bm.plan.planId.eq(planId))
                    .fetch();
        }
    }
