import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useParticipantStore } from '../store/usePlanUserStore';

// 접근 권한 체크 및 모달 상태/핸들러 관리
export function usePlanAccessControl(planId) {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const { fetchMyRole, joinPlan } = useParticipantStore();

  const [accessStatus, setAccessStatus] = useState('loading'); // 'loading' | 'approved' | 'pending' | 'denied'
  const [modalState, setModalState] = useState({ isOpen: false, type: 'permission', message: '' });

  const checkAccess = useCallback(async () => {
    // 유효하지 않은 planId면 즉시 404로 이동
    if (!planId || Number.isNaN(Number(planId))) {
      navigate('/not-found', { replace: true });
      return;
    }

    if (!userId) {
      setAccessStatus('denied');
      setModalState({ isOpen: true, type: 'error', message: '로그인이 필요합니다.' });
      return;
    }

    try {
      const response = await fetchMyRole(planId, userId);
      const status = response?.body?.userStatus;

      if (status === 'APPROVED' || status === 'PARTICIPANT') {
        setAccessStatus('approved');
      } else if (status === 'PENDING') {
        setAccessStatus('pending');
        setModalState({ isOpen: true, type: 'pending', message: '승인 대기중입니다. 방장의 수락을 기다려주세요.' });
      } else {
        setAccessStatus('denied');
        setModalState({ isOpen: true, type: 'permission', message: '이 플랜에 접근할 권한이 없습니다. 참여를 요청하시겠습니까?' });
      }
    } catch (error) {
      const status = error?.response?.status;
      const code = error?.response?.data?.body?.code;

      // 플랜이 존재하지 않는 경우: 404 또는 백엔드 정의 코드에 맞춰 404로 이동
      if (status === 404 || code === 'PLAN-001' || code === 'PLAN-010') {
        navigate('/not-found', { replace: true });
        return;
      }

      // 권한 부족 케이스 (예: 초대/승인 필요)
      if (status === 403 && code === 'PLAN-013') {
        setAccessStatus('denied');
        setModalState({
          isOpen: true,
          type: 'permission',
          message: '이 플랜에 접근할 권한이 없습니다. 참여를 요청하시겠습니까?',
        });
        return;
      }

      // 기타 오류는 에러 모달 표시
      setAccessStatus('denied');
      setModalState({ isOpen: true, type: 'error', message: '접근 권한을 확인하는 중 오류가 발생했습니다.' });
    }
  }, [planId, userId, navigate, fetchMyRole]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const handleRequestPermission = useCallback(async () => {
    try {
      await joinPlan(planId);
      setAccessStatus('pending');
      setModalState({ isOpen: true, type: 'pending', message: '참여 요청을 보냈습니다. 수락을 기다려주세요.' });
    } catch (error) {
      const errorCode = error.response?.data?.body?.code;
      const errorMessage = error.response?.data?.body?.message;

      if (errorCode === 'PLAN-011') {
        setAccessStatus('pending');
        setModalState({ isOpen: true, type: 'pending', message: '이미 참여 요청을 보냈습니다. 방장의 승인을 기다려주세요.' });
      } else {
        setModalState((prev) => ({ ...prev, message: errorMessage || '참여 요청에 실패했습니다. 다시 시도해주세요.' }));
      }
    }
  }, [joinPlan, planId]);

  const handleCloseModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { accessStatus, modalState, handleRequestPermission, handleCloseModal };
}
