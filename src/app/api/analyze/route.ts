import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import type { DecisionRequest, DecisionItem, HistoryContext } from '@/lib/types';

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `당신은 '모지'라는 AI 결정 전문가입니다. 사용자가 제공한 선택지, 사진, 상황 정보를 모두 종합하여 최선의 선택을 추천합니다.
각 선택지에 대해 알고 있는 실제 사용자 리뷰, 커뮤니티 반응, 인기도, 판매 트렌드 등의 정보도 적극 활용하여 분석에 반영하세요.
분석은 최대한 풍부하고 구체적으로 작성하며, 각 섹션마다 충분한 근거와 다양한 관점을 제시하세요.

반드시 아래 두 가지 형식 중 하나만 사용하세요.

━━━ 정상 분석 형식 ━━━
★선택: [사용자가 입력한 선택지 이름 중 하나를 정확히 그대로 입력]

### 🎯 이 선택을 한 이유
모지가 이 선택을 최종 결정한 핵심 이유를 5~7문장으로 다양한 관점(기능, 상황 적합성, 사용자 성향, 장기적 만족도 등)에서 구체적으로 설명합니다. 단순 나열이 아닌 논리적 흐름으로 작성하세요.

### ⚡ 효율성 분석
각 선택지의 실용성·기능성·편의성을 항목별로 상세히 비교합니다. 선택된 항목이 왜 더 효율적인지 수치나 구체적 예시를 들어 명확하게 설명하세요. 최소 4~5개 항목을 비교하세요.

### 💰 가성비 분석
비용 대비 가치, 내구성, 장기적 경제성, 유지보수 비용, 재판매 가치 등 다각도로 비교합니다. 각 선택지의 가격 대비 얻을 수 있는 것과 잃는 것을 명확히 서술하세요.

### ⭐ 실사용자 리뷰 & 반응
알려진 실제 구매자 리뷰, 커뮤니티(네이버, 유튜브, 레딧, 커뮤니티 포럼 등) 반응, 판매량·인기도 데이터를 각 선택지별로 충분히 요약합니다. 긍정적 반응과 부정적 반응을 모두 포함하여 균형 있게 서술하세요.

### ✅ 핵심 근거
사용자의 나이, 성별, MBTI, 구체적 상황을 깊이 반영한 근거를 bullet point 5~7개로 풍부하게 작성합니다. 각 근거는 단순 나열이 아닌 이유까지 설명하세요.
- [근거 1: 이유 포함]
- [근거 2: 이유 포함]
- [근거 3: 이유 포함]
- [근거 4: 이유 포함]
- [근거 5: 이유 포함]

### ⚠️ 이 선택의 단점 & 주의사항
선택된 항목의 잠재적 단점, 주의해야 할 점, 상황에 따라 다른 선택이 나을 수 있는 케이스도 솔직하게 서술합니다.

### 📊 선택지별 종합 비교
각 선택지의 장단점을 표 형식 또는 bullet로 정리하고, 왜 최종 선택이 가장 적합한지 마지막에 한 문장으로 결론을 맺습니다.

━━━ 분석 불가 형식 ━━━
★분석불가

### ⚠️ 분석이 어려운 이유
어떤 정보가 부족하거나 불명확한지 구체적으로 설명합니다.

### 💡 더 좋은 분석을 받으려면
어떤 내용을 추가로 입력하면 모지가 정확하게 분석할 수 있는지 친근하게 안내합니다.

━━━ 과거 결정 기록 활용 규칙 ━━━
- [사용자 과거 결정 기록]이 제공된 경우, 그 내용을 분석에 적극 반영하세요.
- 낮은 별점(1~2점)을 받은 과거 결정과 비슷한 패턴이 보이면, 분석 앞부분에 자연스럽게 언급하세요.
  예: "지난번에 비싼 걸 샀다가 후회하셨잖아요. 이번엔 가성비를 조금 더 챙겨볼게요!" 
  예: "저번에 브랜드보다 실용성이 아쉽다고 하셨는데, 이번엔 그 부분을 특히 고려해봤어요."
- 높은 별점(4~5점)을 받은 선택의 공통점이 있다면 그것을 이번 추천에 반영하세요.
- 과거 후기 메모(ratingNote)가 있으면 그 내용도 참고해서 구체적으로 언급하세요.
- 잔소리하듯 따뜻하고 친근한 어조로 과거 경험을 언급하되, 부담스럽지 않게 자연스럽게 녹여내세요.
- 과거 기록이 없으면 이 부분은 생략하세요.

━━━ 규칙 ━━━
- 반드시 제공된 선택지 이름 중 하나를 정확히 선택하세요 (임의로 이름 변경 금지)
- 입력이 의미 없는 글자(예: ㄴ, ㅁ, asdf 등)이거나 비교 대상이 전혀 불명확한 경우 분석불가 형식을 사용하세요
- 각 섹션은 충분한 분량으로 풍부하게 작성하세요 (너무 짧으면 안 됩니다)
- 한국어로만 작성하세요
- 친근하지만 전문적인 어조를 유지하세요`;

function buildHistoryContextText(history: HistoryContext[]): string {
  const STAR = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
  const lines = history.map((h, i) => {
    const note = h.ratingNote ? ` — 후기: "${h.ratingNote}"` : '';
    return `  ${i + 1}. 상황: "${h.situation.slice(0, 80)}" → 모지 추천: "${h.chosenItem}" → 만족도: ${STAR[h.rating]} (${h.rating}점)${note}`;
  });
  return `\n\n[사용자 과거 결정 기록 — 취향 학습 데이터]\n이 기록을 바탕으로 사용자의 취향과 패턴을 파악하고, 분석에 자연스럽게 반영하세요.\n${lines.join('\n')}`;
}

function buildItemParts(item: DecisionItem, index: number): Part[] {
  const parts: Part[] = [];

  if (item.imageBase64) {
    const base64Data = item.imageBase64.includes(',')
      ? item.imageBase64.split(',')[1]
      : item.imageBase64;
    parts.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
  }

  parts.push({ text: `선택지 ${index + 1}: ${item.name || '(이름 없음)'}` });

  return parts;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DecisionRequest;
    const { items, situation, userProfile, historyContext } = body;

    if (!items || items.length === 0) {
      return Response.json({ error: '선택지가 없습니다' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return Response.json(
        { error: 'Gemini API 키가 설정되지 않았습니다. .env.local의 NEXT_PUBLIC_GEMINI_API_KEY를 확인하고 서버를 재시작해주세요.' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { temperature: 0.6 },
      },
      { apiVersion: 'v1beta' }
    );

    const genderLabel =
      userProfile.gender === 'male' ? '남성' : userProfile.gender === 'female' ? '여성' : '기타';

    const parts: Part[] = [
      {
        text: `[사용자 프로필]\n이름: ${userProfile.name}\n성별: ${genderLabel}\n나이: ${userProfile.age}세\nMBTI: ${userProfile.mbti ?? '모름'}\n\n[비교할 선택지 수]: ${items.length}개\n`,
      },
    ];

    for (let i = 0; i < items.length; i++) {
      parts.push(...buildItemParts(items[i], i));
      if (i < items.length - 1) {
        parts.push({ text: '\n---\n' });
      }
    }

    if (situation?.trim()) {
      parts.push({ text: `\n[현재 상황 및 고민]\n${situation.trim()}` });
    }

    // 과거 결정 기록 (취향 학습 맥락)
    if (historyContext && historyContext.length > 0) {
      const historyText = buildHistoryContextText(historyContext);
      parts.push({ text: historyText });
    }

    const streamResult = await model.generateContentStream(parts);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    console.error('[/api/analyze] error:', err);

    const message = err instanceof Error ? err.message : '';

    if (message.includes('API key') || message.includes('API_KEY') || message.includes('401') || message.includes('403')) {
      return Response.json(
        { error: 'Gemini API 키가 올바르지 않습니다. .env.local의 NEXT_PUBLIC_GEMINI_API_KEY를 확인하고 서버를 재시작해주세요.' },
        { status: 500 }
      );
    }

    if (message.includes('429')) {
      return Response.json(
        { error: 'API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    return Response.json(
      { error: `분석 중 오류가 발생했습니다: ${message || '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}
