import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ModalComponent, ModalFunction, SERVER_URL, ToggleCell } from 'js';

import LuggageIcon from '@mui/icons-material/Luggage';
import { Button, Pagination, Stack } from '@mui/material';
import './TravelPackList.css'; // CSS 파일을 임포트

/* 여행 예약 1번*/
/* - 여행 패키지 목록 페이지 */
function TravelPackList() {

    /* useState(함수의 상태관리), useNavigate(라우터 내에서 경로를 변경), ModalFunction(모달창의 열고 닫는 기능) */
    /* ▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤ */
    
    /* 여행 패키지 */
    const [TravalPack, setTravalPack] = useState([]);

    /* 패키지 여행 데이터 로딩 */
    const [loading, setLoading] = useState(true);

    /* 페이지네이션 상태 설정 */
    const [page, setPage] = useState(1); // 현재 페이지 번호를 관리하는 상태
    const [rowsPerPage, setRowsPerPage] = useState(5); // 페이지당 행의 수를 설정하는 상태

    const navigate = useNavigate(); // 페이지 이동을 위한 함수

    const getRows = () => { // 페이지네이션 함수
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return TravalPack.slice(startIndex, endIndex);
    };

    /* 부트 스트랩 팝업창 기능 */
    const { modalOpenMap, handleModalOpen, handleModalClose } = ModalFunction();

    /* ▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤ */

    /* 벡엔드에 Controller(컨트롤러)에서 설정한 패키지여행의 전체 정보 불러오기 */
    useEffect(() => {
        fetch(SERVER_URL + "travalpackAll", { method: 'GET' })
            .then(response => response.json())
            .then(data => { setTravalPack(data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });

    }, []);

    /* 패키지 여행 로딩 상태 관리 */
    if (loading) {
        return (
            <div>
                <p>패키지 여행 데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    /* 행의 예약하기 버튼 클릭시 여행 예약 페이지로 이동(로그인이 안되어 있으면 로그인창으로 보내기)*/
    const handleCellClick = (params) => {
        const jwt = sessionStorage.getItem('jwt');

        if (!jwt) {
            alert('로그인이 필요합니다'); 
            navigate('/login'); 
            return;
        }
        else {
            navigate(`/packreservation/reservation/${params}`);
        }
    };

    /* 패키지 여행의 컬럼 */
    const columns = [
        {
            field: 'image', // 이미지 필드가 있다고 가정
            headerName: '여행 이미지',
            width: 300,
            renderCell: (params) => (
                <div className="image-cell">
                    {/* 테스트용 이미지 */}
                    <img class="custom-image"
                        src="https://gongu.copyright.or.kr/gongu/wrt/cmmn/wrtFileImageView.do?wrtSn=9046601&filePath=L2Rpc2sxL25ld2RhdGEvMjAxNC8yMS9DTFM2L2FzYWRhbFBob3RvXzI0MTRfMjAxNDA0MTY=&thumbAt=Y&thumbSe=b_tbumb&wrtTy=10004"
                        alt="축제이미지"
                        onClick={() => handleModalOpen(params.row.packNum)} // 모달 열기 함수 호출
                    />
                    <ModalComponent
                        showModal={modalOpenMap[params.row.packNum]}
                        handleClose={() => handleModalClose(params.row.packNum)}
                        selectedImage={"https://gongu.copyright.or.kr/gongu/wrt/cmmn/wrtFileImageView.do?wrtSn=9046601&filePath=L2Rpc2sxL25ld2RhdGEvMjAxNC8yMS9DTFM2L2FzYWRhbFBob3RvXzI0MTRfMjAxNDA0MTY=&thumbAt=Y&thumbSe=b_tbumb&wrtTy=10004"}
                        params={params}
                    />
                </div>
            ),
        },
        { // 한개의 컬럼에 여러 컬럼의 정보를 출력
            field: 'travelinformation',
            headerName: '여행 정보',
            width: 900,
            renderCell: (params) => (
                <div className="travelinformation">
                    <p>{params.row.name}</p>
                    {/* 클릭시'금액'과 '한국 통화 형식'변환 */}
                    <p className='inform2'>가격:</p><p className='inform3'><ToggleCell value={params.row.price} /></p>
                    <p>숙박기간: {params.row.startDate} ~ {params.row.endDate}</p>
                    <p>최대인원: {params.row.count}</p>
                    <p>흡연실(금연실): {params.row.smoke}</p>
                    <p>몇 인실: {params.row.person}</p>
                    <p>예약 가능한 상태: {params.row.reservation}</p>
                </div>
            ),
        },
        {
            field: 'packreservation',
            headerName: '예약하기',
            renderCell: row =>
                <Button onClick={() => { handleCellClick(row.row.packNum) }}>
                    <h1 className='button-font'>예약하기</h1>
                </Button>
            ,
            width: 110,
        }
    ];

    /* 화면 출력 */
    /* ▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤▤ */
    return (
        <div>
            {/* 패키지 여행 목록 */}
            <div className="PackageTravelList">
                <h1 className="traval-pack-list-header">
                    <LuggageIcon fontSize='large' className='custom-luggage-icon' /> 여행 패키지 목록
                </h1>
                {/* DataGrid를 이용한 여행 패키지 목록 표시 */}
                <DataGrid
                    className="hideHeaders" // 컬럼 헤더 숨기기
                    rows={getRows()} // 표시할 행 데이터
                    columns={columns}// 열(컬럼) 설정
                    getRowId={row => row.packNum}// 각 행의 고유 ID 설정
                    checkboxSelection={false} // 체크박스(false(비활성화))
                    hideFooter={true} // 표의 푸터바 제거
                    getRowHeight={params => 400} // DataGrid의 특정 행의 높이를 100 픽셀로 설정(CSS로 분리불가)
                />
            </div>

            {/* 페이지징 */}
            <div className="stackContainer">
                <Stack spacing={2}>
                    <Pagination
                        count={Math.ceil(TravalPack.length / rowsPerPage)}
                        page={page}
                        onChange={(event, value) => setPage(value)}
                        variant="outlined"
                        shape="rounded"
                    />
                </Stack>
            </div>

        </div>
    );

};

export default TravelPackList;
