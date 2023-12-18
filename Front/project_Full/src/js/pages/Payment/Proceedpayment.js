import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useRef, useState } from 'react';
import { SERVER_URL } from 'js';
import { useNavigate, useParams } from 'react-router';
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'; // 결제 위젯 설치

/* 결제위젯 연동 키 [테스트] */
const clientKey = "test_ck_yZqmkKeP8gNz6vBPKOmnrbQRxB9l"
const customerKey = "test_sk_vZnjEJeQVxNJ0bwYXo2P8PmOoBN0"

/* 결제 기능 1번(여행 예약에 대한 결제) */
/* 패키지 여행 결제 페이지*/
function Proceedpayment() {
    const { resNum } = useParams(); // 패키지 여행 예약 번호 받아오기
    const [member, setMember] = useState([]); // 회원정보
    const [Packreservation, setPackreservation] = useState([]); // 패키지 여행 예약 목록 정보
    const navigate = useNavigate(); // Navigate 객체에 접근 // 메인화면으로 보내준다.

    /* 금액 표시 */
    const formatPrice = (price) => {
        //가격을 만원, 천원으로 분리
        const unit = price >= 10000 ? '만' : '';
        const mainPrice = Math.floor(price / (unit === '만' ? 10000 : 1000)); //만 단위로 표시하면 만 단위의 가격을 계산, 그 외에는 천 단위로 계산
        const remainder = price % (unit === '만' ? 10000 : 1000); //remainder: 만 단위로 표시되면 가격을 1만으로 나눈 나머지를, 그렇지 않으면 1천으로 나눈 나머지를 계산

        // 포맷된 문자열 생성
        const formattedPrice = `${mainPrice}${unit}${remainder > 0 ? ` ${remainder}` : ''}원`; //가격 문자열

        return formattedPrice;
    };

    /* 벡엔드에 Controller(컨트롤러)에서 설정한 패키지여행 예약 목록 */
    useEffect(() => {

        const jwt = sessionStorage.getItem('jwt');

        if (jwt === undefined || jwt === '') { return; }

        // - 회원 
        fetch(SERVER_URL + `getUser?jwt=${jwt}`, { method: 'GET' })
            .then((response) => response.json())
            .then((data) => { setMember(data); })
            .catch(err => console.error(err));

        // - 패키지 여행에 대한 상세 정보
        fetch(SERVER_URL + `packreservation/${resNum}`)
            .then(response => response.json())
            .then(data => {

                console.log(data) // 패키지여행의 데이터를 잘가져오는지 확인

                // data에서 "travalPack"을 추출하고 그 안의 "price"(가격)와 예약한 인원 수 "count"(인원 수)를 곱한 값 
                const packreservation = data.price * data.count;
                console.log("최종 패키지 여행의 가격:" + packreservation)

                // 패키지 여행의 가격값을 입력폼에 출력
                setPaymentInfo({ payamount: packreservation, });

                // 패키지 여행 예약 목록 state 업데이트
                setPackreservation([data]);
            })
            .catch(err => { console.error(err); });
    }, [resNum]);

    /* 패키지 여행 에약 목록 */
    /* ----------------------------------------------------------------------- */
    // 패키지 여행 에약 목록 컬럼
    const columns = [
        // { field: 'resNum', headerName: '패키지 예약 번호', width: 150 },
        { field: 'memId', headerName: '예약한 회원', width: 200 },
        { field: 'packName', headerName: '패키지 여행명', width: 200 },
        { field: 'startDate', headerName: '예약한 날', width: 200 },
        { field: 'price', headerName: '가격', width: 100, renderCell: (params) => < ToggleCell value={params.value} /> }, // 클릭시'금액'과 '한국 통화 형식'변환
        { field: 'dateCnt', headerName: '기간', width: 200 },
        { field: 'count', headerName: '인원수', width: 100 },
    ];
    /* ----------------------------------------------------------------------- */

    /* 결제 위젯 전용 */
    const paymentWidgetRef = useRef(null);
    const paymentMethodsWidgetRef = useRef(null);

    /* 패키지 예약 결제 정보 데이터베이스로 보내기 */
    /* ----------------------------------------------------------- */
    const handleButtonClick = async () => {
        if (!paymentInfo.cardnumber || paymentInfo.cardnumber.trim() === '') { // - 카드번호가 true 또는 입력 안 할시 카드번호 입력 경고문 출력 
            alert('카드 번호를 입력해주세요.');
        } else if (paymentInfo.cardnumber.length !== 16) { // - 카드번호가 16자리가 아닐 경우에 경고문 출력 
            alert('카드 번호는 16자리입니다. 다시 입력해주세요.');
        } else {
            try {
                // 처리 중일 때 버튼을 비활성화
                const button = document.querySelector('button');
                button.disabled = true;

                // 결제 위젯
                const paymentWidget = paymentWidgetRef.current;

                // 패키지예약내역, 결제금액, 카드번호에대한 데이터 추가
                const data = {
                    resNum: Packreservation[0].resNum, // 패키지 여행 예약 번호
                    payamount: paymentInfo.payamount, // 사용자 입력값으로 업데이트
                    cardnumber: paymentInfo.cardnumber, // 사용자 입력값으로 업데이트
                };

                /* 1. DB에 예약한 정보를 먼저 전송(해결해야할 문제: 결제창 닫고 다시 결제버튼 누를시 다시한번 적용되는 현상) */
                // API에 결제 정보를 전송
                const response = await fetch(`${SERVER_URL}payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                // 콘솔창에 성공했다는 내용을 표시
                console.log('POST 요청 성공:', response);

                /* 2. 1을 수행 후 결제창(카드, 가상계좌 등)으로 이동 */
                await paymentWidget?.requestPayment({
                    orderId: member.memId + clientKey, // 주문아이디가 6~21자리가 넘어가야 하므로 내 클라이언트 키를 삽입
                    orderName: Packreservation[0].packName, // 패키지 예약내역의 여행 상품 이름
                    customerName: member.nema, // 회원 이름
                    customerEmail: member.email, // 회원 이메일
                    successUrl: `${window.location.origin}/success`, // 성공시 결제 성공 창으로
                    failUrl: `${window.location.origin}/fail`, // 실패시 결제 실패창으로(아직 미구현)
                });

            } catch (error) {
                alert(error);
            } finally {
                // 에러 발생 여부에 상관없이 처리가 끝난 후 버튼 활성화
                const button = document.querySelector('button');
                button.disabled = false;
            }
        }
    };
    /* ----------------------------------------------------------- */


    /* 결재 금액과 카드번호 입력 */
    /* ----------------------------------------------------------- */
    const [paymentInfo, setPaymentInfo] = useState({
        payamount: 0, // 초기값은 0으로 설정하거나 다른 값으로 초기화
        cardnumber: "", // 초기값은 빈 문자열로 설정하거나 다른 값으로 초기화
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentInfo({
            ...paymentInfo,
            [name]: value,
        });
    };
    /* ----------------------------------------------------------- */

    /* 행 클릭시 해당되는 row.resNum 번호를 콘솔에 출력 */
    // const handleCellClick = (params) => {
    //     const selectedResNum = params.row.resNum;
    //     console.log("Selected ResNum:", selectedResNum);
    //     // 여기서 선택한 ResNum을 사용하여 필요한 작업 수행
    // };

    /* Tosspayments 위젯(결제위젯) 불러오기 */
    /* --------------------------------------------------------------------------------- */
    useEffect(() => {
        if (Packreservation.length > 0) {
            const loadWidget = async () => {
                try {
                    const paymentWidget = await loadPaymentWidget(clientKey, customerKey);
                    const paymentMethodsWidget = paymentWidget.renderPaymentMethods("#payment-widget", paymentInfo.payamount);

                    // Ref에 위젯을 할당
                    paymentWidgetRef.current = paymentWidget;
                    paymentMethodsWidgetRef.current = paymentMethodsWidget;
                } catch (error) {
                    alert('결제 위젯 로드 중 오류 발생:', error);
                }
            };

            loadWidget();
        }
    }, [paymentInfo.payamount]);
    console.log("결제 위젯에 값이 들어갔는지 확인용(패키지 여행 * 인원 수 가격): " + paymentInfo.payamount);
    /* --------------------------------------------------------------------------------- */
    console.log(member.phonNum);


    const [isKoreanFormat, setIsKoreanFormat] = useState(true);
    const paymentAmount = paymentInfo.payamount;

    /* 최종 결제 금액에 대한 '금액'과 '한국 통화 형식'변환*/
    const handleToggleFormat = () => {
        setIsKoreanFormat((prevFormat) => !prevFormat);
    };

    /*datagrid의 행의 금액에 대한 '금액'과 '한국 통화 형식'변환*/
    const ToggleCell = ({ value }) => {
        const [toggle, setToggle] = useState(false);

        const handleClick = () => {
            setToggle(!toggle);
        };

        return (
            <div onClick={handleClick} style={{ cursor: 'pointer' }}>
                {toggle ? value.toLocaleString() + `원` : formatPrice(value)}
            </div>
        );
    };

    return (
        <div style={{
            textAlign: 'center'
        }}>
            <h1> - 패키지 여행 결제 - </h1>

            {/* 패키지 여행 결제 목록 스타일 */}
            <div style={{
                marginLeft: "0%",
                marginRight: "0%",
                marginBottom: "3%",
                marginTop: "1%",
                backgroundColor: 'white',
                border: '1px solid',

            }}>
                <DataGrid
                    rows={Packreservation}
                    columns={columns}
                    getRowId={row => row.resNum}
                    hideFooter={true} // 표의 푸터바 제거
                // onCellClick={handleCellClick} // 셀이 클릭되었을 때의 이벤트 핸들러
                />
                <div style={{ marginLeft: "20%", marginRight: "20%", }}>
                    <label>
                        카드 번호:
                        <input type="text" name="cardnumber" value={paymentInfo.cardnumber} onChange={handleInputChange} />
                    </label>
                </div>

                {/* <div style={{ textAlign: 'center' }}>
                    <h1>패키지 여행 가격 정보</h1>
                    {Packreservation.map((reservation, index) => (
                        <div key={index}>
                            <h2 onClick={handleToggleFormat}>패키지 여행의 가격: {isKoreanFormat ? formatPrice(reservation.price) : reservation.price.toLocaleString() + '원' }</h2>
                            <h2>예약인원: {reservation.count}</h2>
                            <h2>{reservation.price.toLocaleString() + ' X ' + reservation.count}</h2>
                        </div>
                    ))}
                </div> */}

                {/* 금액(~원)을 클릭시 '금액'과 '한국 통화 형식'변환 */}
                <div>
                    <h1>최종 결제 금액</h1>
                    <h2 onClick={handleToggleFormat}>
                        {isKoreanFormat ? formatPrice(paymentAmount) : `${paymentAmount.toLocaleString()} 원`}
                    </h2>
                </div>

                {/* 결제 위젯을 화면에 출력 */}
                <div id="payment-widget" />

                <button onClick={handleButtonClick}>
                    결제하기
                </button>
            </div>
        </div >
    );
};

export default Proceedpayment;

/*
    - 참고
        - React로 결제 페이지 개발하기 (ft. 결제위젯)
        > https://velog.io/@tosspayments/React%EB%A1%9C-%EA%B2%B0%EC%A0%9C-%ED%8E%98%EC%9D%B4%EC%A7%80-%EA%B0%9C%EB%B0%9C%ED%95%98%EA%B8%B0-ft.-%EA%B2%B0%EC%A0%9C%EC%9C%84%EC%A0%AF

*/