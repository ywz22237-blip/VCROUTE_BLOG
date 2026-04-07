// netlify/functions/posts.js
// 아임웹 API 프록시 — CORS 문제 해결용

exports.handler = async (event) => {
  const API_KEY    = process.env.IMWEB_API_KEY;
  const SECRET_KEY = process.env.IMWEB_SECRET_KEY;
  const BOARD_CODE = process.env.IMWEB_BOARD_CODE;

  if (!API_KEY || !SECRET_KEY || !BOARD_CODE) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "환경변수가 설정되지 않았습니다." }),
    };
  }

  try {
    // 1. 토큰 발급
    const authRes = await fetch(
      `https://api.imweb.me/v2/auth?key=${API_KEY}&secret=${SECRET_KEY}`
    );
    const authData = await authRes.json();

    if (authData.code !== 200) {
      throw new Error("토큰 발급 실패: " + JSON.stringify(authData));
    }
    const access_token = authData.data.access_token;

    // 2. 게시글 조회
    const limit = event.queryStringParameters?.limit || 20;
    const page  = event.queryStringParameters?.page  || 1;

    const postRes = await fetch(
      `https://api.imweb.me/v2/boards/${BOARD_CODE}/posts?limit=${limit}&page=${page}`,
      { headers: { "access-token": access_token } }
    );
    const postData = await postRes.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(postData.data),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
