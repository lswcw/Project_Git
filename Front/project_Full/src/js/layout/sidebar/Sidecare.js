// Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // 부트스트랩 임포트
import './Sidecare.css';
import profileImage from './profile-image.png';
import { useEffect, useState } from 'react';
import { SERVER_URL } from 'js';

function Sidebar() {
  const [member, setMember] = useState([]);
  useEffect(() => {

    const jwt = sessionStorage.getItem('jwt');
    if (jwt === undefined || jwt === '') { return; }

    const fetchMemberData = async () => {
      try {
        const response = await fetch(SERVER_URL + `getUser?jwt=${jwt}`, { method: 'GET' });
        const data = await response.json();
        setMember(data);
        // console.log(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMemberData();
  }, []); // 두 번째 매개변수로 빈 배열을 전달하여 한번만 실행하게 설정
  return (
    <aside className="sidebar">
      <div className="text-center"> {/* 부트스트랩 클래스 */}
        <img src={profileImage} alt="Profile" className="profile-image" />
      </div>
      <h2 className='side-title'>{member.name}님</h2>
      <div className='link-container'>
        <Link to="/info" className="link">예약 정보 관리</Link>
        <Link to="/saleInfo" className="link">판매 정보 관리</Link>
        <Link to="/qna" className="link">Q&A 관리</Link>
        <Link to="/festivals" className="link">축제 관리</Link>
        <Link to="/user" className="link">유저 관리</Link>
        <Link to="/blackList" className="link">블랙 리스트</Link>
        <Link to="/memberinfo" className="link">회원정보 수정</Link>
        <Link to="/servicedown" className="link">서비스 제한</Link>
      </div>
    </aside>
  );
}

export default Sidebar;