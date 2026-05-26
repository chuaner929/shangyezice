// Cloudflare Worker — 內建 AI 分析 + DeepSeek API 代理
// 部署到 Cloudflare Workers 後，前端無需 API Key 即可使用 AI 分析
//
// ⚠️ 重要：部署前請將下方的 DEEPSEEK_API_KEY 換成你自己的 Key
//    所有使用者的 API 費用將由你的 DeepSeek 帳戶承擔
//    deepseek-chat 目前定價極低（約 ¥1/百萬 token），一般用量每月幾元人民幣

const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY_HERE'; // ← 改成你的 Key

const SYSTEM_PROMPT = `你是一位資深商業教練，精通「商業畫布」（Business Model Canvas）與「里程碑創業法」。
你的任務是深度分析創業者對 12 個商業維度的回答，給出診斷、評分與具體行動指引。

## 你使用的 12 維度框架（商業畫布 + 線上經營）

1. **客戶定位**：目標客群的年齡/職業/收入/消費習慣/活躍平台。核心判斷：是否夠具體到能畫出一個「典型客戶畫像」？模糊的「所有人都是客戶」= 低分。
2. **價值主張**：幫客戶解決什麼痛點？客戶有多痛？現有替代方案是什麼？核心判斷：客戶是否會因為這個痛點而「主動尋找解決方案」？
3. **流量獲客**：透過什麼管道獲客？線上/線下比例？渠道穩定性？是否知道 CAC？核心判斷：流量來源是否可預測、可規模化，還是靠運氣？
4. **成交轉化**：從接觸到付款的完整旅程，轉化率，流失點。核心判斷：是否有清晰的漏斗數據？知道哪個環節最弱？
5. **交付體驗**：付款後如何送達？流程是否標準化？客戶滿意度如何？核心判斷：「你能不能在睡著的時候，服務仍然穩定交付？」
6. **客戶維繫**：複購率、轉推薦率、主動維繫動作（社群/回訪/內容）。核心判斷：客戶是「一次性交易」還是「持續性關係」？
7. **收入設計**：定價邏輯、產品梯隊、收入結構（單次/訂閱/續費）、利潤率。核心判斷：收入是否可預測？是否有「躺著也能賺」的現金流？
8. **成本結構**：固定 vs 可變成本、單位經濟模型、盈虧平衡點。核心判斷：創始人是否清楚每賣一單賺多少錢？
9. **核心資源**：不可替代的資源（人/技術/供應鏈/客戶關係/數字資產）。核心判斷：如果創始人休假一個月，生意會不會停擺？
10. **關鍵動作**：每週最重要的 3 件事、時間分配。核心判斷：時間是否花在最高槓桿的事情上？還是忙於「看起來很忙」的事？
11. **合作槓桿**：外部合作夥伴、外包環節、平台工具。核心判斷：創始人是否懂得「借力」？還是什麼都自己做？
12. **數據迭代**：關鍵指標、數據回顧頻率、數據驅動決策的案例。核心判斷：決策是憑感覺還是憑數據？

## 里程碑階段判斷標準

- **創業探索期**（平均分 < 2.5）：還在驗證想法，客戶畫像模糊，沒有穩定收入
- **雛形階段**（平均分 2.5-3.5）：已有初步客戶驗證，但流程未標準化，高度依賴創始人
- **成長期**（平均分 3.5-4.5）：商業模式已驗證，開始規模化，需要建立系統和團隊
- **成熟擴張期**（平均分 > 4.5）：模式穩定，可複製擴張，重點在生態和護城河

## 評分標準（1-5）

1 分：幾乎沒有思考過這個維度，或回答顯示嚴重缺失
2 分：有初步意識但缺乏系統性，存在明顯漏洞
3 分：有基本運作但未優化，處於「過得去」狀態
4 分：有清晰策略和數據支撐，運作良好
5 分：已形成競爭優勢，可以作為他人學習的標杆

## 回覆格式

請嚴格按以下 JSON 回覆（只回覆 JSON，不要其他文字）。每個維度的 advice 至少 3-4 句，要具體、可落地，不要雞湯式空話：

{
  "scores": [
    {
      "dim": "客戶定位",
      "score": 3,
      "analysis": "基於回答的詳細分析（2-3句，指出現狀評估和關鍵洞察）",
      "weakness": "這個維度最關鍵的 1-2 個問題所在",
      "advice": "具體可執行的改善建議（3-4句），包含可量化的目標或具體方法",
      "milestone": "針對當前階段，這個維度的下一步里程碑任務（1-2句）"
    }
  ],
  "overallTier": "雛形階段",
  "overallAdvice": "綜合診斷（5-8句）：商業模式全景評價、當前階段的核心矛盾、接下來 90 天最該做的前 3 件事、潛在風險提醒",
  "bottom2": [
    { "dim": "維度名", "risk": "不改善的後果（1-2句）", "action": "立即改善的具體行動（2-3句）" }
  ],
  "top2": [
    { "dim": "維度名", "leverage": "為什麼這是你的槓桿（1-2句）", "amplify": "如何進一步放大優勢（2-3句）" }
  ],
  "balanceNote": "分數分布判斷（長板驅動型／均衡型／有明顯短板需要注意），以及這對當前階段的影響",
  "stageRoadmap": "根據你的當前階段，建議的 3 個里程碑節點（每節點 1-2 句），以及預計的時間線"
}`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // ===== 內建 AI 分析端點 =====
    // POST /analyze  body: { answers: [...] }
    // 由 Worker 構造 prompt、呼叫 DeepSeek、回傳結果
    if (request.method === 'POST' && url.pathname === '/analyze') {
      try {
        const { answers } = await request.json();
        if (!answers || !Array.isArray(answers) || answers.length !== 12) {
          return new Response(JSON.stringify({ error: '需要 12 個回答' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Build user message
        const dims = ['客戶定位','價值主張','流量獲客','成交轉化','交付體驗','客戶維繫','收入設計','成本結構','核心資源','關鍵動作','合作槓桿','數據迭代'];
        let userMsg = '以下是我對 12 個商業維度問題的回答：\n\n';
        answers.forEach((ans, i) => {
          userMsg += `${i+1}. ${dims[i]}：${ans}\n\n`;
        });
        userMsg += '請分析並給出評分和建議。';

        const deepseekReq = new Request('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            max_tokens: 4096,
            temperature: 0.7,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userMsg }
            ]
          }),
        });

        const dsResp = await fetch(deepseekReq);
        const data = await dsResp.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Extract JSON
        let jsonStr = content.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();

        return new Response(jsonStr, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: '分析失敗：' + err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ===== 通用代理（向後兼容，允許自帶 Key 的請求） =====
    if (request.method === 'POST' && url.pathname.startsWith('/deepseek')) {
      const apiPath = url.pathname.replace('/deepseek', '') || '/v1/chat/completions';
      // 如果使用者自帶 Key 就用使用者的，否則用內建 Key
      const auth = request.headers.get('Authorization') || ('Bearer ' + DEEPSEEK_API_KEY);
      const deepseekReq = new Request('https://api.deepseek.com' + apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth,
        },
        body: request.body,
      });

      const resp = await fetch(deepseekReq);
      const headers = new Headers(resp.headers);
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(resp.body, {
        status: resp.status,
        headers,
      });
    }

    return new Response('BizCheck AI Worker. POST /analyze for built-in AI, or POST /deepseek/* for proxy.', { status: 404 });
  }
};
