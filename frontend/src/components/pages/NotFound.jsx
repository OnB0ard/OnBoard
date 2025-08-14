import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';
import { Button } from '../atoms/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound">
      <div className="notfound__content">
        <h1 className="notfound__title">404</h1>
        <p className="notfound__message">페이지를 찾을 수 없습니다</p>
        <div className="notfound__actions">
          <Button
            background="white"
            textColor="black"
            border="gray"
            onClick={() => navigate(-1)}
          >
            뒤로 가기
          </Button>
          <Button
            background="sky"
            textColor="black"
            onClick={() => navigate('/')}
          >
            홈으로 가기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
