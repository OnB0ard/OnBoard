package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.place.entity.QPlace;
import com.ssafy.backend.plan.entity.Bookmark;
import com.ssafy.backend.plan.entity.QBookmark;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

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

    public Optional<Bookmark> findByBookmarkIdAndPlanId(Long bookmarkId, Long planId) {
        QBookmark b = QBookmark.bookmark;

        Bookmark bookmark = queryFactory.selectFrom(b)
                .where(b.bookmarkId.eq(bookmarkId)
                        .and(b.plan.planId.eq(planId)))
                .fetchOne();

        return Optional.ofNullable(bookmark);
    }
}
