import React, { useState, useEffect, useRef } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  Upload, Settings, Play, TrendingUp, AlertCircle, CheckCircle2, 
  FileSpreadsheet, Link as LinkIcon, Search, Building2, ChevronRight, Activity, Database, Star, ThumbsUp, ThumbsDown, ArrowLeft, Lock, User, LogOut, CheckCircle, Calculator, TrendingDown, Info, FileDown, Loader2, MessageSquare
} from 'lucide-react';

// 正規分布に従う乱数生成（Box-Muller変換）
const randomNormal = (mean, stdDev) => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  return num * stdDev + mean;
};

// パーセンタイル取得ヘルパー
const getPercentile = (arr, p) => {
  const index = Math.max(0, Math.min(arr.length - 1, Math.floor(arr.length * p)));
  return arr[index];
};

// 御社のベースロジックに基づく1年後の目標月商算出
const getTargetSales = (current) => {
  if (current < 100000) return current + 300000;
  if (current < 1000000) return current * 4;
  if (current < 3000000) return current * 3.3;
  if (current < 5000000) return current * 2.5;
  if (current < 7000000) return current * 2.2;
  if (current < 10000000) return current * 2;
  if (current < 30000000) return current * 1.5;
  return current * 1.5;
};

// ジャンル別インサイト
const genreInsights = {
  'ファッション': '弊社支援のファッションジャンル（18社）の実績では、サーチ申請×限定SALEで新規流入を平月の8倍にした事例あり。季節切り替え（3月・9月）前にAI検索（AIEO）向けの属性100%入力とサムネイル刷新を行うことで、スーパーSALE期間中のCTRが平均+22%向上。在庫切れによるAIペナルティ（順位下落）を防ぐサイズ・カラー別在庫管理と、購入後の同梱フォロー（次回クーポン同封）によるLTV設計が売上基盤を安定させます。',
  '韓国コスメ': '弊社支援の韓国コスメブランド（15社）では、メガ割・スーパーSALE前にUGC（ユーザー生成コンテンツ）を計画的に蓄積し、AI検索で選ばれる「具体的解決策レビュー」の質化を実施。外部SNS（TikTok/Meta）から楽天への誘導フローを構築することで、モール内検索ランクが自動上昇するサイクルを確立。初回購入後の同梱物＋フォローメールで2回目購入率を30%以上改善しています。',
  'コスメ': '弊社支援のコスメジャンル（22社）では、お試しセット設計による初回獲得コスト回収の仕組みを先行構築。その後LINE公式アカウントを通じた定期クーポン配信でリピート購入を育成。5と0のつく日のポイントUP合わせたメルマガ刈り取りフローにより、広告依存から脱却した安定成長モデルを実現。CVRは「使用後の肌変化」を具体的に訴求したページ設計で+1.8倍が標準値です。',
  '時計': '弊社支援の時計・アクセサリージャンル（7社）では、比較検討期間が長い商材特性に合わせ、リターゲティング広告×SPUポイント訴求で購入の最後の一押しを設計。ボーナス・ギフト需要が集中する12月スーパーSALEに向け、早期から特設ページとAI検索向け属性整備を完了させることが勝ちパターン。公式ストア限定の延長保証設定で価格競争からの脱却も必須施策です。',
  '食品': '弊社支援の食品ジャンル（31社）では、お買い物マラソン「まとめ買い需要」の刈り取りが最重要施策。お気に入り登録促進→5と0のつく日のLINE刈り取りフローで月次成長率105%以上を安定維持。在庫切れによるAIランキングペナルティを防ぐ在庫管理の徹底と、大容量セットの訴求による客単価アップが利益率改善に直結します。ポイント還元依存の薄利経営は最大禁忌です。',
  '菓子': '弊社支援のスイーツ・菓子ジャンル（14社）では、バレンタイン等のギフト需要に向けたラッピング無料訴求で当日需要を刈り取り。送料無料ライン設定と同梱セット商品の見せ方でAOV（客単価）を引き上げるのが利益率改善の王道。スーパーSALE期間中は「ついで買い需要」が急増するため、関連商品への回遊バナー設置で客単価+10%が標準的な改善幅です。',
  '電子製品': '弊社支援の家電・電子製品ジャンル（12社）では、型番検索流入に対して独自の「比較表」と「詳細スペック解説」をページ内に設置し、価格競争からの脱却に成功した事例が多数。AI検索（AIEO）向けの属性100%埋込と構造化データ整備でオーガニック流入を確立。スーパーSALE時に一気に売上を立てる在庫確保計画が年商1億円突破の共通項です。',
  '調理器具': '弊社支援の調理器具ジャンル（9社）では、新生活（3月）・年末年始（12月）のピーク前に特設ページとAI検索向け属性整備を完了させることが絶対条件。「使用後の生活の変化」を動画で訴求することでCVRが平均+35%改善。同梱物を活用した関連商品誘導と、ラッピング無料のギフト対応でリピーター母数を拡大する設計が重要です。',
  'ディスプレイ': '弊社支援の什器・ディスプレイジャンル（5社）では、BtoB需要（法人顧客）を意識したページ改修（領収書発行・まとめ買い割引・インボイス対応）で、セール依存しない安定した売上基盤を構築。法人顧客はリピート率が高くLTVも長期になるため、初回獲得後の顧客対応品質がモール内評価（レビュー・評価スコア）に直結し、AI検索での選出率を高めます。',
  '家具': '弊社支援のインテリア・家具ジャンル（11社）では、新生活（2〜4月）ピーク前の特設ページ制作とAI検索対応が最重要。送料設計・組み立て有無・部屋内サイズ感の動画訴求がCVR直結要因。スーパーSALE時のポイント大量訴求で高額商材の購入ハードルを下げる設計と、購入後の満足度向上（組み立てサポート動画等）によるレビュー質化がAI検索で選ばれる鍵です。',
  'IT': '弊社支援のIT・PC周辺機器ジャンル（8社）では、テレワーク需要の定着で平月も安定トラフィックがあります。スペック比較がシビアなため、商品ページ内での「明確な比較表」と「専門用語のわかりやすい解説」の設置が転換率を劇的に改善。AI検索（AIEO）向けの属性100%埋込と、競合との明確な差別化（独自保証・サポート体制）の訴求が価格競争からの脱却に必須です。',
  '家庭用品': '弊社支援の日用雑貨・家庭用品ジャンル（25社）では、消耗品のリピート需要を活かした定期購入・大容量セット訴求が売上基盤。お買い物マラソン期間中のまとめ買い需要を確実に刈り取るためのお気に入り登録促進→LINEフォローフローが必須。同梱物（次回購入クーポン・使い方ガイド）によるLTV向上と、在庫切れゼロ維持（AIペナルティ回避）がランキング維持に直結します。'
};

const getGenreInsight = (genreName) => {
    return genreInsights[genreName] || `弊社が支援する同ジャンル（過去実績データ）の推移と、今回抽出した課題・施策を掛け合わせ、妥当性の高い予測モデルを生成しました。`;
};

// ════════════════════════════════════════════════════════════════
// 【新機能】高度な分析ロジック
// ════════════════════════════════════════════════════════════════

// 1️⃣ ROI分析 - 広告費投下に対する利益倍率
const calculateROI = (sales, operatingCosts) => {
  const initialAOV = operatingCosts.aov || 5000;
  const platformFeePercent = operatingCosts.platformFeePercent || 5;
  const shippingCostPerOrder = operatingCosts.shippingCost || 500;
  const fixedCostMonthly = operatingCosts.operationalCostFixed || 100000;
  const adSpendPercent = (operatingCosts.adSpendMinPercent + operatingCosts.adSpendMaxPercent) / 2;

  const orders = Math.round(sales / initialAOV);
  const adSpend = Math.round(sales * (adSpendPercent / 100));
  const platformFee = Math.round(sales * (platformFeePercent / 100));
  const shippingCost = Math.round(orders * shippingCostPerOrder);
  const fixedCost = fixedCostMonthly;

  const netProfit = sales - adSpend - platformFee - shippingCost - fixedCost;

  if (adSpend === 0) return null;

  const roi = ((netProfit - adSpend) / adSpend) * 100;
  const roas = netProfit / adSpend;

  return {
    roi: roi.toFixed(1),
    roas: roas.toFixed(2),
    adSpend,
    netProfit
  };
};

// 2️⃣ 損益分岐点分析 - 何月で黒字化するか
const calculateBreakEvenMonth = (simulationData, operatingCosts, formData) => {
  if (!simulationData || simulationData.length === 0) return null;

  const initialAOV = operatingCosts.aov || 5000;
  const platformFeePercent = operatingCosts.platformFeePercent || 5;
  const shippingCostPerOrder = operatingCosts.shippingCost || 500;
  const fixedCostMonthly = operatingCosts.operationalCostFixed || 100000;
  const adSpendMin = operatingCosts.adSpendMinPercent || 3;
  const adSpendMax = operatingCosts.adSpendMaxPercent || 8;

  // 【各日ごとに累積損益を計算】
  let cumulativeProfit = 0;
  let breakEvenDay = null;
  let breakEvenMonth = null;

  for (let dayIdx = 0; dayIdx < simulationData.length; dayIdx++) {
    const dayData = simulationData[dayIdx];
    const monthIndex = Math.floor((dayIdx) / 30) + 1;

    // その月の進捗率（0.0 ～ 1.0）
    const progressRatio = (monthIndex - 1) / 11;
    const adSpendPercent = adSpendMin + (adSpendMax - adSpendMin) * progressRatio;

    // 日次売上からの日次利益を計算
    const dailySales = dayData.supportScenario;
    const dailyOrders = Math.ceil(dailySales / initialAOV);
    const dailyAdSpend = Math.round(dailySales * (adSpendPercent / 100) / 30);
    const dailyPlatformFee = Math.round(dailySales * (platformFeePercent / 100) / 30);
    const dailyShippingCost = dailyOrders * shippingCostPerOrder;
    const dailyFixedCost = fixedCostMonthly / 30;

    const dailyProfit = 
      dailySales 
      - dailyAdSpend 
      - dailyPlatformFee 
      - dailyShippingCost 
      - dailyFixedCost;

    cumulativeProfit += dailyProfit;

    // ⭐ 累積利益が正に転じた最初の時点
    if (cumulativeProfit > 0 && breakEvenDay === null) {
      breakEvenDay = dayIdx + 1;
      breakEvenMonth = monthIndex;
      
      return {
        breakEvenDay,
        breakEvenMonth,
        dateStr: dayData.dateStr,
        monthSales: Math.round(dayData.supportScenario),
        cumulativeProfit: Math.round(cumulativeProfit),
        isWithinYear: breakEvenMonth <= 12
      };
    }
  }

  // 12ヶ月以内に黒字化しない場合
  return {
    breakEvenDay: null,
    breakEvenMonth: null,
    dateStr: null,
    monthSales: null,
    cumulativeProfit: Math.round(cumulativeProfit),
    isWithinYear: false,
    message: `12ヶ月以内に黒字化できません（最終累積利益: ${Math.round(cumulativeProfit).toLocaleString()}円）`
  };
};

// ════════════════════════════════════════════════════════════════
// 【完全修正版】複数シナリオ比較用データ
// ════════════════════════════════════════════════════════════════

const generateMultiScenarioData = (simulationData, operatingCosts) => {
  if (!simulationData || simulationData.length === 0) return [];

  const initialAOV = operatingCosts.aov || 5000;
  const platformFeePercent = operatingCosts.platformFeePercent || 5;
  const shippingCostPerOrder = operatingCosts.shippingCost || 500;
  const fixedCostMonthly = operatingCosts.operationalCostFixed || 100000;
  const adSpendMin = operatingCosts.adSpendMinPercent || 3;
  const adSpendMax = operatingCosts.adSpendMaxPercent || 8;

  return simulationData.map((dayData) => {
    const monthIndex = Math.floor((dayData.dayIndex - 1) / 30) + 1;
    const progressRatio = Math.min((monthIndex - 1) / 11, 1);

    const sales = dayData.supportScenario;
    const orders = Math.round(sales / initialAOV);

    // ★ 3シナリオ計算
    const scenarios = {};
    ['min', 'mid', 'max'].forEach((scenario) => {
      let adPercent;
      if (scenario === 'min') {
        adPercent = adSpendMin;
      } else if (scenario === 'max') {
        adPercent = adSpendMax;
      } else {
        adPercent = (adSpendMin + adSpendMax) / 2;
      }

      const adSpend = Math.round(sales * (adPercent / 100));
      const platformFee = Math.round(sales * (platformFeePercent / 100));
      const shippingCost = Math.round(orders * shippingCostPerOrder);
      const fixedCost = fixedCostMonthly;

      const totalExpense = adSpend + platformFee + shippingCost + fixedCost;
      const netProfit = sales - totalExpense;
      const profitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

      scenarios[scenario] = {
        adSpend,
        adPercent: adPercent.toFixed(1),
        netProfit,
        profitMargin: profitMargin.toFixed(1)
      };
    });

    return {
      dayIndex: dayData.dayIndex,
      dateStr: dayData.dateStr,
      sales,
      orders,
      
      // ★ 最小シナリオ
      minAdSpend: scenarios.min.adSpend,
      minProfit: scenarios.min.netProfit,
      minMargin: scenarios.min.profitMargin,

      // ★ 中位シナリオ
      midAdSpend: scenarios.mid.adSpend,
      midProfit: scenarios.mid.netProfit,
      midMargin: scenarios.mid.profitMargin,

      // ★ 最大シナリオ
      maxAdSpend: scenarios.max.adSpend,
      maxProfit: scenarios.max.netProfit,
      maxMargin: scenarios.max.profitMargin
    };
  });
};

const generateProfitForecastCSV = (detailedMonthly, formData, operatingCosts) => {
  const headers = [
    '月',
    '売上（円）',
    '購入件数',
    'CVR（%）',
    '広告費（円）',
    '広告比率（%）',
    '手数料（円）',
    '送料（円）',
    '固定費（円）',
    '総経費（円）',
    '利益（円）',
    '利益率（%）',
    '前月比（%）',
    '初月比（%）'
  ];

  const rows = [headers.map(h => `"${h}"`).join(',')];

  detailedMonthly.forEach((month) => {
    const row = [
      month.monthIndex,
      month.売上,
      month.購入件数,
      Number(month.CVR).toFixed(2),
      month.広告費,
      month.広告比率,
      month.手数料,
      month.送料,
      month.固定費,
      month.総経費,
      month.利益,
      month.利益率,
      month.前月比,
      month.初月比
    ];

    rows.push(row.map(cell => 
      typeof cell === 'string' ? `"${cell}"` : cell
    ).join(','));
  });

  return rows.join('\n');
};

const handleDownloadCSV = (detailedMonthly, formData, operatingCosts) => {
  const csv = generateProfitForecastCSV(detailedMonthly, formData, operatingCosts);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const fileName = `利益予測_${formData.companyName || '対象企業'}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PPTX生成関数（pptxgenjsをCDN経由で使用）
const loadPptxGenJs = () => {
  return new Promise((resolve, reject) => {
    if (window.PptxGenJS) { resolve(window.PptxGenJS); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
    script.onload = () => resolve(window.PptxGenJS);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const generatePptx = async (analysisResult, formData, genreStats, formatCurrency, getGenreInsight) => {
  const PptxGenJS = await loadPptxGenJs();
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.title = `EC売上改善提案書 - ${formData.companyName || '対象店舗'}`;

  // ── カラーパレット (資料ベース.pptx 準拠 / Pure Flat ブランド) ──
  const C = {
    teal:       '53BEB1',   // メインティール（濃）
    tealDark:   '3DAA9D',   // アクセント用やや濃
    tealMid:    '53BEB1',
    tealLight:  'BDE7E0',   // ライトティール（背面ウェーブ・装飾）
    tealBg:     'ECFAF6',   // 極薄ミント（ドーナツ円塗り・背景）
    tealBg2:    'F4FCFA',
    navy:       '3DAA9D',
    navyMid:    '53BEB1',
    white:      'FFFFFF',
    dark:       '3F3F3F',   // 資料ベース準拠の本文色
    slate:      '3F3F3F',
    slateLight: '888888',   // 資料ベース準拠のサブテキスト色
    slateBg:    'F6F8F7',
    rose:       'F43F5E',
    roseDark:   'BE123C',
    roseBg:     'FFF1F3',
    roseLight:  'FECDD3',
    blue:       '3B82F6',
    blueDark:   '1D4ED8',
    blueBg:     'EFF6FF',
    emerald:    '10B981',
    emeraldBg:  'ECFDF5',
    amber:      'F59E0B',
    amberBg:    'FFFBEB',
    purple:     '8B5CF6',
    purpleBg:   'F5F3FF',
    gold:       'F59E0B',
    gradStart:  '53BEB1',
    gradEnd:    '3DAA9D',
  };
  const fontJP = 'Yu Gothic';
  const fontEN = 'Arial';

  const companyName = formData.companyName || '対象店舗';
  const genreName   = formData.genre || 'EC';
  const currentSales = Number(formData.currentMonthlySales);
  const finalSales   = analysisResult.finalSales || currentSales * 2;
  const noSupportFinal = Math.round(currentSales * 0.85);
  const growthMultiple = (finalSales / currentSales).toFixed(1);
  const growthRate = ((finalSales / currentSales - 1) * 100).toFixed(0);

  // ── 資料ベース.pptx のデザインをそのまま反映した背景画像（base64/PNG）──
  //   SECTION_BG  … 白背景＋右上ドーナツ円（ECFAF6）＋ハッチ入り白円＋装飾リング＋ドットグリッド＋Pure Flatロゴ
  //   CONTENT_BG  … 左上2層ウェーブ（BDE7E0 + 53BEB1）
  //   スライドサイズ = 10" × 5.625" (16:9)
  const SECTION_BG = 'data:image/png;base64,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';
  const CONTENT_BG = 'data:image/png;base64,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BAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAEHoLQAAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAIAi9BQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAACAIAQAAEAQAgAAIAgBAAAQhAAAAAhCAAAABCEAAACCEAAAAEEIAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAQBACAAAgCAEAABCEAAAACEIAAAAEIQAAAIIQAAAAQQgAAIAgBAAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAAEIQAAAAIQgAAAAQhAAAAghAAAABBCAAAgCAEAABAEAIAACAIAQAA+Cv7/wGuP0w3XOw3IQAAAABJRU5ErkJggg==';

  // ── ヘルパー：セクション扉背景（PPTXベース.slide1 と同等）──
  const addSectionCover = (slide) => {
    slide.addImage({ data: SECTION_BG, x: 0, y: 0, w: 10, h: 5.625 });
  };

  // ── ヘルパー：コンテンツスライド背景（PPTXベース.slide2 と同等 / 2層波＋ロゴ配置相当）──
  const addContentBase = (slide) => {
    slide.addImage({ data: CONTENT_BG, x: 0, y: 0, w: 10, h: 5.625 });
  };

  // ── ヘルパー：Pure Flat ロゴ（セクション扉の白背景部分に直接置くとき用・コンテンツ扉は背景に含まれる）──
  const addLogo = (slide) => { /* SECTION_BG 内に既に含まれるため何もしない（互換目的で残置）*/ };

  // ── ヘルパー：コンテンツスライドのウェーブ背景（後方互換名・中身は新版）──
  const addWaveBackground = (slide) => { addContentBase(slide); };

  // ── ヘルパー：セクション扉の装飾（後方互換名・中身は新版）──
  const addRingDecoration = (slide) => { /* SECTION_BG 内に含まれる */ };

  // ── ヘルパー：フッター（ページ番号）──
  const addFooter = (slide, num) => {
    if (num) {
      slide.addText(`${num}`, {
        x: 9.3, y: 5.32, w: 0.5, h: 0.2,
        fontSize: 9, fontFace: fontEN, color: C.slateLight, bold: false, align: 'right', margin: 0
      });
    }
  };

  // ── ヘルパー：コンテンツヘッダー（資料ベース.slide2 準拠 / 左上ウェーブ上に白色タイトル）──
  const addSlideHeader = (slide, num, title, subtitle) => {
    addContentBase(slide);
    // タイトル：濃いティール波の上に白で配置（資料ベース.slide2 のテキスト位置 x=0.58", y=0.67" 相当）
    slide.addText(title, {
      x: 0.58, y: 0.12, w: 7.0, h: 0.48,
      fontSize: 20, fontFace: fontJP, color: C.white, bold: true, valign: 'middle', margin: 0
    });
    // サブタイトル：波の中（下部ライトティール領域）に黒で小さく配置
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.58, y: 0.6, w: 7.2, h: 0.28,
        fontSize: 9, fontFace: fontJP, color: C.dark, bold: true, margin: 0
      });
    }
    // ページ番号（右下）
    if (num) addFooter(slide, num);
  };

  // ── ヘルパー：セクションバッジ ──
  const addSectionBadge = (slide, x, y, text, color, textColor = C.white) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: text.length * 0.13 + 0.4, h: 0.3,
      fill: { color }, line: { color }, rectRadius: 0.06
    });
    slide.addText(text, {
      x: x + 0.05, y: y + 0.02, w: text.length * 0.13 + 0.3, h: 0.26,
      fontSize: 9, fontFace: fontJP, color: textColor, bold: true, align: 'center', margin: 0
    });
  };

  // ── ヘルパー：KPIカード ──
  const addKpiCard = (slide, x, y, w, h, label, value, sub, accent = false) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: accent ? C.tealBg : C.white },
      line: { color: accent ? C.teal : C.tealLight, width: accent ? 2 : 1 },
      rectRadius: 0.12
    });
    if (accent) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w, h: 0.08,
        fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.1
      });
    }
    slide.addText(label, {
      x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.25,
      fontSize: 9, fontFace: fontJP, color: C.slateLight, bold: true, margin: 0
    });
    slide.addText(value, {
      x: x + 0.1, y: y + 0.38, w: w - 0.2, h: 0.55,
      fontSize: accent ? 17 : 15, fontFace: fontJP,
      color: accent ? C.tealDark : C.dark, bold: true, margin: 0
    });
    if (sub) {
      slide.addText(sub, {
        x: x + 0.15, y: y + 0.9, w: w - 0.3, h: 0.22,
        fontSize: 8, fontFace: fontJP, color: accent ? C.tealMid : C.slateLight, bold: accent, margin: 0
      });
    }
  };

  // ════════════════════════════════════════════════════════
  // SLIDE 1: 表紙（PureFlat PDFデザイン準拠 - 白背景＋右側ティール円）
  // ════════════════════════════════════════════════════════
  const s1 = pres.addSlide();
  s1.background = { color: C.white };

  // 資料ベース.pptx と完全同一のセクション扉背景（ドーナツ円＋ハッチ入り白円＋装飾リング＋ドットグリッド＋Pure Flatロゴ）
  addSectionCover(s1);

  // テキストコンテンツ（左側）
  s1.addText('楽天市場', {
    x: 0.7, y: 1.1, w: 4.0, h: 0.38,
    fontSize: 13, fontFace: fontJP, color: C.tealDark, bold: true, margin: 0
  });
  s1.addText('EC売上改善 提案書', {
    x: 0.7, y: 1.5, w: 4.5, h: 0.95,
    fontSize: 34, fontFace: fontJP, color: C.dark, bold: true, margin: 0
  });
  s1.addText(companyName, {
    x: 0.7, y: 2.55, w: 4.5, h: 0.6,
    fontSize: 24, fontFace: fontJP, color: C.teal, bold: true, margin: 0
  });
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 3.28, w: 3.5, h: 0.04,
    fill: { color: C.tealLight }, line: { color: C.tealLight, width: 0 }
  });
  s1.addText(`ジャンル: ${genreName}`, {
    x: 0.7, y: 3.42, w: 4.5, h: 0.28,
    fontSize: 10, fontFace: fontJP, color: C.slate, margin: 0
  });
  s1.addText(`現在月商: ${formatCurrency(currentSales)}　　作成日: ${new Date().toLocaleDateString('ja-JP')}`, {
    x: 0.7, y: 3.7, w: 4.5, h: 0.28,
    fontSize: 10, fontFace: fontJP, color: C.slate, margin: 0
  });
  // 1年後目標ボックス
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 4.1, w: 2.8, h: 1.0,
    fill: { color: C.teal }, line: { color: C.teal, width: 0 }, rectRadius: 0.12
  });
  s1.addText('1年後目標月商', {
    x: 0.85, y: 4.18, w: 2.5, h: 0.26,
    fontSize: 9, fontFace: fontJP, color: C.tealLight, bold: true, margin: 0
  });
  s1.addText(formatCurrency(finalSales), {
    x: 0.85, y: 4.43, w: 2.5, h: 0.52,
    fontSize: 20, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  // 現状比ボックス
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 3.65, y: 4.1, w: 1.85, h: 1.0,
    fill: { color: C.tealBg }, line: { color: C.tealLight, width: 1.5 }, rectRadius: 0.12
  });
  s1.addText('現状比', {
    x: 3.75, y: 4.18, w: 1.65, h: 0.26,
    fontSize: 9, fontFace: fontJP, color: C.tealDark, bold: true, margin: 0
  });
  s1.addText(`+${growthRate}%`, {
    x: 3.75, y: 4.43, w: 1.65, h: 0.52,
    fontSize: 20, fontFace: fontEN, color: C.tealDark, bold: true, margin: 0
  });
  // ロゴ（左下）
  addLogo(s1);

  // ════════════════════════════════════════════════════════
  // SLIDE 2: 商品・現状サマリー
  // ════════════════════════════════════════════════════════
  const s2 = pres.addSlide();
  s2.background = { color: C.white };
  addSlideHeader(s2, 1, '貴社・商品の現状サマリー', `${companyName} / ${genreName}`);

  // 左カラム：商品情報
  s2.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.15, w: 4.7, h: 4.15,
    fill: { color: C.slateBg }, line: { color: C.tealLight, width: 1 }, rectRadius: 0.15
  });
  s2.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.15, w: 4.7, h: 0.5,
    fill: { color: C.tealDark }, line: { color: C.tealDark }, rectRadius: 0.15
  });
  s2.addText('🏪  企業・商品情報', {
    x: 0.5, y: 1.2, w: 4.3, h: 0.38,
    fontSize: 13, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  const qd = analysisResult.quantitativeData || {};
  const infoLines = [
    { lbl: '企業名',       val: companyName },
    { lbl: 'ジャンル',     val: genreName },
    { lbl: '現在月商',     val: formatCurrency(currentSales) },
    { lbl: '価格帯',       val: qd.price || '—' },
    { lbl: 'レビュー件数', val: qd.reviews || '—' },
    { lbl: '平均評価',     val: qd.averageRating || '—' },
    { lbl: 'クーポン等',   val: qd.coupon || '—' },
  ];
  infoLines.forEach((row, i) => {
    const ry = 1.75 + i * 0.5;
    s2.addShape(pres.shapes.RECTANGLE, {
      x: 0.38, y: ry, w: 4.55, h: 0.44,
      fill: { color: i % 2 === 0 ? C.white : C.slateBg },
      line: { color: 'E2E8F0', width: 0.5 }
    });
    s2.addText(row.lbl, {
      x: 0.5, y: ry + 0.08, w: 1.4, h: 0.28,
      fontSize: 9.5, fontFace: fontJP, color: C.slateLight, bold: true, margin: 0
    });
    s2.addText(row.val, {
      x: 1.95, y: ry + 0.05, w: 2.85, h: 0.34,
      fontSize: 11, fontFace: fontJP, color: C.dark, bold: true, margin: 0
    });
  });

  // 右カラム：評価スコア視覚化 + 商品概要
  s2.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.15, w: 4.5, h: 1.6,
    fill: { color: C.amberBg }, line: { color: C.amber, width: 1.5 }, rectRadius: 0.15
  });
  const ratingVal = parseFloat(qd.averageRating) || 0;
  s2.addText('⭐ 平均評価スコア', {
    x: 5.4, y: 1.25, w: 4.1, h: 0.28,
    fontSize: 11, fontFace: fontJP, color: C.amber, bold: true, margin: 0
  });
  s2.addText(`${ratingVal > 0 ? ratingVal.toFixed(2) : '—'}`, {
    x: 5.4, y: 1.55, w: 1.8, h: 0.6,
    fontSize: 40, fontFace: fontEN, color: C.dark, bold: true, margin: 0
  });
  // 星グラフィック（5段階）
  for (let si = 0; si < 5; si++) {
    const starColor = si < Math.floor(ratingVal) ? C.amber : (si < ratingVal ? C.amber : 'E2E8F0');
    s2.addText('★', {
      x: 7.3 + si * 0.28, y: 1.72, w: 0.28, h: 0.36,
      fontSize: 16, fontFace: fontEN, color: starColor, bold: true, margin: 0
    });
  }
  s2.addText(`/ 5.00  レビュー${qd.reviews || '0'}`, {
    x: 5.4, y: 2.08, w: 4.1, h: 0.25,
    fontSize: 9, fontFace: fontJP, color: C.slateLight, margin: 0
  });

  s2.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 2.9, w: 4.5, h: 2.4,
    fill: { color: C.tealBg }, line: { color: C.teal, width: 1.5 }, rectRadius: 0.15
  });
  s2.addText('📋  商品・ページ概要', {
    x: 5.4, y: 3.0, w: 4.1, h: 0.28,
    fontSize: 11, fontFace: fontJP, color: C.tealDark, bold: true, margin: 0
  });
  s2.addText(analysisResult.productInfo || '商品情報の詳細', {
    x: 5.4, y: 3.32, w: 4.1, h: 1.85,
    fontSize: 10, fontFace: fontJP, color: C.dark, margin: 3, align: 'left', valign: 'top'
  });
  addFooter(s2, 1);

  // ════════════════════════════════════════════════════════
  // SLIDE 3: 現状分析（強み・弱み）
  // ════════════════════════════════════════════════════════
  const s3 = pres.addSlide();
  s3.background = { color: C.white };
  addSlideHeader(s3, 2, '現状分析　強み ／ 改善点', 'AIが商品ページを解析し、数値根拠に基づいて抽出');

  const goodPoints = analysisResult.currentStatus?.good || [];
  const badPoints  = analysisResult.currentStatus?.bad  || [];

  // 強みカラム
  s3.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.15, w: 4.6, h: 4.15,
    fill: { color: C.emeraldBg }, line: { color: C.emerald, width: 2 }, rectRadius: 0.15
  });
  s3.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.15, w: 4.6, h: 0.55,
    fill: { color: C.emerald }, line: { color: C.emerald }, rectRadius: 0.15
  });
  s3.addText('✅  強み（数値根拠）', {
    x: 0.5, y: 1.22, w: 4.2, h: 0.38,
    fontSize: 14, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  goodPoints.slice(0, 4).forEach((pt, i) => {
    const py = 1.82 + i * 0.82;
    s3.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y: py, w: 4.4, h: 0.74,
      fill: { color: C.white }, line: { color: '86EFAC', width: 1 }, rectRadius: 0.1
    });
    s3.addShape(pres.shapes.OVAL, {
      x: 0.5, y: py + 0.17, w: 0.4, h: 0.4,
      fill: { color: C.emerald }, line: { color: C.emerald }
    });
    s3.addText(`${i+1}`, {
      x: 0.5, y: py + 0.17, w: 0.4, h: 0.4,
      fontSize: 13, fontFace: fontEN, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0
    });
    s3.addText(pt, {
      x: 1.05, y: py + 0.08, w: 3.65, h: 0.58,
      fontSize: 9.5, fontFace: fontJP, color: C.dark, bold: true, margin: 2, align: 'left', valign: 'top'
    });
  });

  // 弱みカラム
  s3.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.15, w: 4.6, h: 4.15,
    fill: { color: C.roseBg }, line: { color: C.rose, width: 2 }, rectRadius: 0.15
  });
  s3.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.15, w: 4.6, h: 0.55,
    fill: { color: C.rose }, line: { color: C.rose }, rectRadius: 0.15
  });
  s3.addText('⚠️  改善点（優先課題）', {
    x: 5.3, y: 1.22, w: 4.2, h: 0.38,
    fontSize: 14, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  badPoints.slice(0, 4).forEach((pt, i) => {
    const py = 1.82 + i * 0.82;
    s3.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: py, w: 4.4, h: 0.74,
      fill: { color: C.white }, line: { color: C.roseLight, width: 1 }, rectRadius: 0.1
    });
    s3.addShape(pres.shapes.OVAL, {
      x: 5.3, y: py + 0.17, w: 0.4, h: 0.4,
      fill: { color: C.rose }, line: { color: C.rose }
    });
    s3.addText(`${i+1}`, {
      x: 5.3, y: py + 0.17, w: 0.4, h: 0.4,
      fontSize: 13, fontFace: fontEN, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0
    });
    s3.addText(pt, {
      x: 5.85, y: py + 0.08, w: 3.65, h: 0.58,
      fontSize: 9.5, fontFace: fontJP, color: C.dark, bold: true, margin: 2, align: 'left', valign: 'top'
    });
  });
  addFooter(s3, 2);

  // ════════════════════════════════════════════════════════
  // SLIDE 4: 市場データ・ジャンル分析
  // ════════════════════════════════════════════════════════
  const s4 = pres.addSlide();
  s4.background = { color: C.white };
  addSlideHeader(s4, 3, '市場データ・ジャンル分析', `弊社支援${genreName}ジャンル実績データに基づく市場洞察`);

  // ジャンル洞察テキスト
  const genreAnalysis = getGenreInsight(genreName);
  s4.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.15, w: 9.4, h: 1.9,
    fill: { color: C.tealBg }, line: { color: C.teal, width: 1.5 }, rectRadius: 0.15
  });
  s4.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.15, w: 0.1, h: 1.9,
    fill: { color: C.teal }, line: { color: C.teal }
  });
  s4.addText(`弊社の${genreName}支援実績からの洞察`, {
    x: 0.6, y: 1.22, w: 9, h: 0.3,
    fontSize: 11, fontFace: fontJP, color: C.tealDark, bold: true, margin: 0
  });
  s4.addText(genreAnalysis, {
    x: 0.55, y: 1.52, w: 9.0, h: 1.4,
    fontSize: 10.5, fontFace: fontJP, color: C.dark, margin: 3, align: 'left', valign: 'top'
  });

  // 楽天セールカレンダー
  s4.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 3.18, w: 9.4, h: 0.38,
    fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.08
  });
  s4.addText('📅  楽天市場 主要セールカレンダー（年間活用すべき重要イベント）', {
    x: 0.5, y: 3.22, w: 9, h: 0.28,
    fontSize: 11, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });

  const saleMonths = [
    { mon: '1月', name: '新春ポイントUP', color: C.teal },
    { mon: '3月', name: 'スーパーSALE', color: C.rose },
    { mon: '4月', name: 'お買い物マラソン', color: C.blue },
    { mon: '5月', name: 'ゴールデンW祭', color: C.emerald },
    { mon: '6月', name: 'スーパーSALE', color: C.rose },
    { mon: '8月', name: 'お盆セール', color: C.amber },
    { mon: '9月', name: 'スーパーSALE', color: C.rose },
    { mon: '10月', name: 'お買い物マラソン', color: C.blue },
    { mon: '11月', name: 'ブラックフライデー', color: C.purple },
    { mon: '12月', name: 'スーパーSALE', color: C.rose },
  ];

  saleMonths.forEach((ev, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const ex = 0.35 + col * 1.87;
    const ey = 3.65 + row * 0.88;
    s4.addShape(pres.shapes.RECTANGLE, {
      x: ex, y: ey, w: 1.78, h: 0.78,
      fill: { color: C.white }, line: { color: ev.color, width: 1.5 }, rectRadius: 0.1
    });
    s4.addShape(pres.shapes.RECTANGLE, {
      x: ex, y: ey, w: 1.78, h: 0.28,
      fill: { color: ev.color }, line: { color: ev.color }, rectRadius: 0.1
    });
    s4.addText(ev.mon, {
      x: ex + 0.05, y: ey + 0.02, w: 0.7, h: 0.24,
      fontSize: 11, fontFace: fontEN, color: C.white, bold: true, align: 'center', margin: 0
    });
    s4.addText(ev.name, {
      x: ex + 0.08, y: ey + 0.32, w: 1.62, h: 0.42,
      fontSize: 8.5, fontFace: fontJP, color: C.dark, bold: true, align: 'center', valign: 'middle', margin: 0
    });
  });
  addFooter(s4, 3);

  // ════════════════════════════════════════════════════════
  // SLIDE 5: 課題整理（アクセス×CVR 2軸）
  // ════════════════════════════════════════════════════════
  const s5 = pres.addSlide();
  s5.background = { color: C.white };
  addSlideHeader(s5, 4, '抽出された課題', 'アクセス数不足 ／ 転換率（CVR）低下の2軸で整理');

  // 中央フロー矢印
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 4.72, y: 1.25, w: 0.56, h: 4.05,
    fill: { color: C.slateBg }, line: { color: C.slateBg }
  });
  s5.addText('課\n題\n整\n理', {
    x: 4.72, y: 2.3, w: 0.56, h: 1.8,
    fontSize: 10, fontFace: fontJP, color: C.slateLight, bold: true, align: 'center', valign: 'middle', margin: 0
  });

  // ── アクセス課題（左列）──
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.15, w: 4.3, h: 0.44,
    fill: { color: C.blue }, line: { color: C.blue }, rectRadius: 0.08
  });
  s5.addText('📊  アクセス数不足の課題', {
    x: 0.45, y: 1.18, w: 4.0, h: 0.35,
    fontSize: 12, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });

  const rawIssues = analysisResult.currentIssues || [];
  const accessIssues = Array.isArray(rawIssues)
    ? rawIssues.slice(0, 3)
    : (rawIssues.access || []).slice(0, 3);

  accessIssues.forEach((issue, i) => {
    const iy = 1.7 + i * 1.12;
    s5.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: iy, w: 4.3, h: 1.02,
      fill: { color: C.blueBg }, line: { color: '93C5FD', width: 1.5 }, rectRadius: 0.12
    });
    s5.addShape(pres.shapes.OVAL, {
      x: 0.42, y: iy + 0.28, w: 0.44, h: 0.44,
      fill: { color: C.blue }, line: { color: C.blue }
    });
    s5.addText(`${i+1}`, {
      x: 0.42, y: iy + 0.28, w: 0.44, h: 0.44,
      fontSize: 15, fontFace: fontEN, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0
    });
    s5.addText(issue, {
      x: 1.0, y: iy + 0.08, w: 3.52, h: 0.86,
      fontSize: 9.5, fontFace: fontJP, color: C.dark, bold: true, margin: 2, align: 'left', valign: 'top'
    });
  });

  // ── CVR課題（右列）──
  s5.addShape(pres.shapes.RECTANGLE, {
    x: 5.4, y: 1.15, w: 4.3, h: 0.44,
    fill: { color: C.rose }, line: { color: C.rose }, rectRadius: 0.08
  });
  s5.addText('🔄  転換率（CVR）低下の課題', {
    x: 5.55, y: 1.18, w: 4.0, h: 0.35,
    fontSize: 12, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });

  const rawCvrIssues = Array.isArray(rawIssues)
    ? rawIssues.slice(3, 6)
    : (rawIssues.cvr || []).slice(0, 3);
  // CVR課題が3つ未満の場合はデフォルト課題で補完
  const cvrDefaults = [
    '商品ページの訴求力不足：購入後の生活変化・ビフォーアフターが具体的に訴求できておらず、比較検討中の顧客が離脱しやすい状態です。権威訴求や詳細スペック・競合比較表の設置によるCVR向上が急務です。',
    'レビュー質・件数の不足：楽天AI検索（AIEO）に選ばれるためには「具体的な解決策」を記載したレビューの蓄積が必須です。購入後フォローメール未整備がレビュー獲得率を低下させています。',
    'LTV設計の未整備：同梱物による2回目購入促進フローとLINE公式アカウントへの誘導が未実施で、広告依存型の成長構造が続き、リピーター基盤が形成されていません。',
  ];
  const cvrIssues = rawCvrIssues.length >= 3
    ? rawCvrIssues
    : [...rawCvrIssues, ...cvrDefaults.slice(0, 3 - rawCvrIssues.length)];

  cvrIssues.forEach((issue, i) => {
    const iy = 1.7 + i * 1.12;
    s5.addShape(pres.shapes.RECTANGLE, {
      x: 5.4, y: iy, w: 4.3, h: 1.02,
      fill: { color: C.roseBg }, line: { color: C.roseLight, width: 1.5 }, rectRadius: 0.12
    });
    s5.addShape(pres.shapes.OVAL, {
      x: 5.52, y: iy + 0.28, w: 0.44, h: 0.44,
      fill: { color: C.rose }, line: { color: C.rose }
    });
    s5.addText(`${i+1}`, {
      x: 5.52, y: iy + 0.28, w: 0.44, h: 0.44,
      fontSize: 15, fontFace: fontEN, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0
    });
    s5.addText(issue, {
      x: 6.1, y: iy + 0.08, w: 3.52, h: 0.86,
      fontSize: 9.5, fontFace: fontJP, color: C.dark, bold: true, margin: 2, align: 'left', valign: 'top'
    });
  });
  addFooter(s5, 4);

  // ════════════════════════════════════════════════════════
  // SLIDE 6: 施策① アクセス数増加
  // ════════════════════════════════════════════════════════
  const s6 = pres.addSlide();
  s6.background = { color: C.white };
  addSlideHeader(s6, 5, 'アクセス数の増加（舟瀬式）', '楽天絞込ハック／Yahoo!優良配送／CTR特化／AIEO×外部流入');

  // 施策4カード（舟瀬式ナレッジベース：楽天・Yahoo!両対応のアクセス戦略）
  const accessStrategies = [
    {
      icon: '🔎', title: '楽天：絞り込み検索ハック × 属性100%埋込',
      body: '1ワード1位の「強者の戦い」を避け、ユーザーの絞り込み行動を先回りしニッチ属性の組合せで独占状態を作る舟瀬式戦略。売れ筋TOP5商品のタグID未入力項目を全て埋め、サジェストKW（AI検索対応）を商品説明文に注入。サーチ申請×限定SALEで新規流入最大8倍実績。',
      kpi: '絞り込み検索順位＆CVR',
      action: '楽天RMS｜商品属性100%埋込｜即日完了'
    },
    {
      icon: '🚚', title: 'Yahoo!：優良配送認定 × アイテムマッチ広告',
      body: 'Yahoo!は「お節介なレコメンド文化」をハックしたもん勝ち。優良配送認定（14時までの当日発送）で検索露出優先度を確保し、アイテムマッチ広告でレコメンド枠へ強制露出。LINEヤフー統合で13.6%成長市場の追い風に乗るタイミング。AIに「優等生な店」と学習させ露出面を強制拡張。',
      kpi: 'アイテムマッチROAS＆レコメンド占有率',
      action: 'ストアクリエイターPro｜優良配送設定｜1週間以内'
    },
    {
      icon: '🖼️', title: 'メイン画像CTR特化 × LINE小画面対応',
      body: '「0.1秒で指を止める」サムネイル設計が全モール共通の勝ちパターン。LINEショッピングタブや他社レコメンド枠という「小さな枠」でも商品が何か分かる大きな文字訴求を徹底。商品画像1枚目のABテストで検索結果のCTRを最大化し、規約ギリギリの訴求＋競合差別化デザインを実装。',
      kpi: 'CTR +20〜35%',
      action: '画像1枚目ABテスト｜最新トレンド反映｜3日以内'
    },
    {
      icon: '🌐', title: 'AIEO × 外部流入によるランク自動上昇',
      body: 'キーワード詰込SEOは終了。AIに「この商品は悩みを解決する」と確信させる質と量の両面攻め。カスタマーレビューの具体性蓄積＋構造化商品データ＋Q&A充実でAI推奨枠を獲得。Meta/X/TikTok広告で外部流入を誘導→モール内検索ランクが自動上昇する仕組みを構築し、RPP依存から卒業。',
      kpi: 'オーガニック流入 +30〜50%',
      action: '商品紹介1行目にレビューKW採用｜当日実行'
    },
  ];

  accessStrategies.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = 0.3 + col * 4.85;
    const sy = 1.7 + row * 1.75;

    s6.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: sy, w: 4.65, h: 1.62,
      fill: { color: C.tealBg2 }, line: { color: C.tealLight, width: 1.5 }, rectRadius: 0.14
    });
    s6.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: sy, w: 4.65, h: 0.4,
      fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.14
    });
    s6.addText(`${st.icon}  ${st.title}`, {
      x: sx + 0.12, y: sy + 0.04, w: 4.35, h: 0.32,
      fontSize: 11, fontFace: fontJP, color: C.white, bold: true, margin: 0
    });
    s6.addText(st.body, {
      x: sx + 0.12, y: sy + 0.46, w: 4.35, h: 0.78,
      fontSize: 8.5, fontFace: fontJP, color: C.dark, margin: 2, align: 'left', valign: 'top'
    });
    // KPIバッジ
    s6.addShape(pres.shapes.RECTANGLE, {
      x: sx + 0.12, y: sy + 1.28, w: 2.2, h: 0.22,
      fill: { color: C.tealDark }, line: { color: C.tealDark }, rectRadius: 0.06
    });
    s6.addText(`📈 ${st.kpi}`, {
      x: sx + 0.15, y: sy + 1.3, w: 2.14, h: 0.19,
      fontSize: 7.5, fontFace: fontJP, color: C.white, bold: true, margin: 0
    });
    // 即時アクションバッジ
    s6.addShape(pres.shapes.RECTANGLE, {
      x: sx + 2.4, y: sy + 1.28, w: 2.15, h: 0.22,
      fill: { color: 'F59E0B' }, line: { color: 'F59E0B' }, rectRadius: 0.06
    });
    s6.addText(`⚡ ${st.action}`, {
      x: sx + 2.43, y: sy + 1.3, w: 2.09, h: 0.19,
      fontSize: 7, fontFace: fontJP, color: C.white, bold: true, margin: 0
    });
  });

  // サマリーバー
  s6.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 5.1, w: 9.4, h: 0.25,
    fill: { color: C.tealDark }, line: { color: C.tealDark }, rectRadius: 0.06
  });
  s6.addText('舟瀬式：楽天絞込ハック＋Yahoo!優良配送＋AIEOレビューKW注入＋外部流入フライホイール。広告依存しない自走型アクセス基盤を構築。', {
    x: 0.5, y: 5.12, w: 9, h: 0.2,
    fontSize: 8.5, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  addFooter(s6, 5);

  // ════════════════════════════════════════════════════════
  // SLIDE 7: 施策② CVR向上（商品ページ改善）
  // ════════════════════════════════════════════════════════
  const s7 = pres.addSlide();
  s7.background = { color: C.white };
  addSlideHeader(s7, 6, '転換率(CVR)の向上（舟瀬式）', 'カゴ落ち94%対策／レビュー質化／ギフト3恐怖排除／回遊×LTV');

  const cvrStrategies = [
    {
      icon: '🛒', title: 'カゴ落ち94%対策 × 決済摩擦ゼロ設計',
      body: '94%がカート投入後に離脱する現実。舟瀬式「穴の空いたバケツに水を注ぐのをやめる」戦略。送料無料ライン・配送日・返品ポリシーをカート内で即座に明示。ID決済（Amazon Pay/楽天ペイ）導入で決済画面のクリック数を半減。「一瞬でも迷う書き方」を10秒以内で判断し排除。',
      kpi: 'カート放棄率 -15〜25%',
      action: '自社カート画面を自分で触る｜当日修正'
    },
    {
      icon: '⭐', title: 'レビュー質化（AI意味解析対策）',
      body: '件数でなく「文脈」が検索順位に直結するセマンティック・レビュー時代。星5レビュー3件を選びKWを商品名冒頭へリライト。サンクスメールで「〇〇についての感想を」とAI学習KWを自然誘導。低評価への神対応を公開し店舗の誠実さで転換率向上。サクラ禁忌。',
      kpi: 'レビューKW出現率＆自然検索流入',
      action: '星5レビューKWで商品名リライト｜当日実行'
    },
    {
      icon: '🎁', title: 'ギフト対応3恐怖の排除（客単価+10%）',
      body: '舟瀬式：贈る側の「届かない・ボロボロで届く・値段がバレる」3恐怖を先回り排除。ラッピング/メッセージカード/手提げ袋を画像2枚目までに明示。「金額明細は入れません」を決済ボタン直上に大表示。ラッピング有料は禁忌。ギフト対応は選ばれるための最低条件。',
      kpi: 'ギフトKW経由CVR＆星5率',
      action: 'のし/ラッピング無料設定＋画像追加｜3日以内'
    },
    {
      icon: '🔄', title: '回遊バナー × LTV同梱設計',
      body: '商品ページを「終着駅」にさせない舟瀬式回遊戦略。スマホ決済ボタンの上下に売れ筋ベスト3バナー設置でPV/UU比改善。同梱物（次回クーポン・使い方ガイド）で2回目購入率最大化。LINEヤフー連携・5と0のつく日ポイントUP連動で広告ゼロのリピーター基盤を構築。',
      kpi: '客単価＋10%／リピート＋25〜40%',
      action: '決済ボタン上下に回遊バナー設置｜当日実行'
    },
  ];

  cvrStrategies.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = 0.3 + col * 4.85;
    const sy = 1.7 + row * 1.75;

    s7.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: sy, w: 4.65, h: 1.62,
      fill: { color: C.tealBg2 }, line: { color: C.tealLight, width: 1.5 }, rectRadius: 0.14
    });
    s7.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: sy, w: 4.65, h: 0.4,
      fill: { color: C.tealDark }, line: { color: C.tealDark }, rectRadius: 0.14
    });
    s7.addText(`${st.icon}  ${st.title}`, {
      x: sx + 0.12, y: sy + 0.04, w: 4.35, h: 0.32,
      fontSize: 11, fontFace: fontJP, color: C.white, bold: true, margin: 0
    });
    s7.addText(st.body, {
      x: sx + 0.12, y: sy + 0.46, w: 4.35, h: 0.78,
      fontSize: 8.5, fontFace: fontJP, color: C.dark, margin: 2, align: 'left', valign: 'top'
    });
    s7.addShape(pres.shapes.RECTANGLE, {
      x: sx + 0.12, y: sy + 1.28, w: 2.2, h: 0.22,
      fill: { color: C.teal }, line: { color: C.teal }, rectRadius: 0.06
    });
    s7.addText(`📈 ${st.kpi}`, {
      x: sx + 0.15, y: sy + 1.3, w: 2.14, h: 0.19,
      fontSize: 7.5, fontFace: fontJP, color: C.white, bold: true, margin: 0
    });
    s7.addShape(pres.shapes.RECTANGLE, {
      x: sx + 2.4, y: sy + 1.28, w: 2.15, h: 0.22,
      fill: { color: 'F59E0B' }, line: { color: 'F59E0B' }, rectRadius: 0.06
    });
    s7.addText(`⚡ ${st.action}`, {
      x: sx + 2.43, y: sy + 1.3, w: 2.09, h: 0.19,
      fontSize: 7, fontFace: fontJP, color: C.white, bold: true, margin: 0
    });
  });

  // サマリーバー
  s7.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 5.1, w: 9.4, h: 0.25,
    fill: { color: C.tealDark }, line: { color: C.tealDark }, rectRadius: 0.06
  });
  s7.addText('舟瀬式：カゴ落ち94%対策＋レビュー質化（AI意味解析）＋ギフト3恐怖排除＋回遊×LTV。広告費ゼロで売上を伸ばす王道の4点セット。', {
    x: 0.5, y: 5.12, w: 9, h: 0.2,
    fontSize: 8.5, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  addFooter(s7, 6);

  // ════════════════════════════════════════════════════════
  // SLIDE 8: 施策ロードマップ（タイムライン）
  // ════════════════════════════════════════════════════════
  const s8 = pres.addSlide();
  s8.background = { color: C.white };
  addSlideHeader(s8, 7, '施策ロードマップ　12ヶ月計画', '課題解決から成果刈り取りまでの全体スケジュール');

  // フェーズヘッダー
  const phases = [
    { label: 'Phase 1', sub: '基盤構築期',   range: '1〜3ヶ月',    color: C.tealLight },
    { label: 'Phase 2', sub: '加速期',       range: '4〜6ヶ月',    color: C.tealMid },
    { label: 'Phase 3', sub: '定着・拡大期', range: '7〜9ヶ月',    color: C.teal },
    { label: 'Phase 4', sub: '目標達成期',   range: '10〜12ヶ月',  color: C.tealDark },
  ];

  phases.forEach((ph, i) => {
    const px = 0.3 + i * 2.38;
    const textClr = i < 2 ? C.dark : C.white;
    s8.addShape(pres.shapes.RECTANGLE, {
      x: px, y: 1.15, w: 2.22, h: 0.7,
      fill: { color: ph.color }, line: { color: ph.color }, rectRadius: 0.1
    });
    s8.addText(ph.label, {
      x: px + 0.1, y: 1.18, w: 2.02, h: 0.3,
      fontSize: 13, fontFace: fontEN, color: textClr, bold: true, margin: 0
    });
    s8.addText(`${ph.sub}（${ph.range}）`, {
      x: px + 0.1, y: 1.48, w: 2.02, h: 0.28,
      fontSize: 8.5, fontFace: fontJP, color: textClr, margin: 0
    });
  });

  // タイムラインライン
  s8.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.93, w: 9.4, h: 0.06,
    fill: { color: C.tealLight }, line: { color: C.tealLight }
  });

  // 施策ロウ
  const roadmapItems = [
    { cat: '📊 アクセス施策', color: C.blue,
      ph1: 'AIEO属性100%入力\nメイン画像CTR特化設計',
      ph2: 'サーチ申請×限定SALE\n外部SNS誘導フロー構築',
      ph3: '特設ページ×SALE最大化\nMeta/TikTok広告本格化',
      ph4: 'SALE連動×外部流入最大化\nAI検索自走サイクル確立'
    },
    { cat: '🔄 CVR施策', color: C.rose,
      ph1: '商品ページ権威訴求改修\n購入後ストーリー設計',
      ph2: 'レビュー質化フロー構築\n同梱物LTV設計導入',
      ph3: 'LINE×ポイントデー刈取\nギフト対応・回遊バナー設置',
      ph4: 'LTVフロー完成・リピート最大化\nRPP広告依存ゼロへ'
    },
    { cat: '📈 期待売上', color: C.tealDark,
      ph1: `${formatCurrency(Math.round(currentSales * 1.3))}〜`,
      ph2: `${formatCurrency(Math.round(currentSales * 1.8))}〜`,
      ph3: `${formatCurrency(Math.round(currentSales * 2.3))}〜`,
      ph4: `${formatCurrency(finalSales)} 達成`
    },
  ];

  roadmapItems.forEach((row, ri) => {
    const ry = 2.1 + ri * 1.05;
    s8.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: ry, w: 1.35, h: 0.95,
      fill: { color: row.color }, line: { color: row.color }, rectRadius: 0.1
    });
    s8.addText(row.cat, {
      x: 0.35, y: ry + 0.18, w: 1.25, h: 0.6,
      fontSize: 8.5, fontFace: fontJP, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0
    });
    [row.ph1, row.ph2, row.ph3, row.ph4].forEach((txt, pi) => {
      const px = 1.72 + pi * 2.38;
      const isFinal = ri === 2 && pi === 3;
      s8.addShape(pres.shapes.RECTANGLE, {
        x: px, y: ry, w: 2.22, h: 0.95,
        fill: { color: isFinal ? C.tealBg : C.slateBg },
        line: { color: isFinal ? C.teal : 'E2E8F0', width: isFinal ? 2 : 1 },
        rectRadius: 0.08
      });
      s8.addText(txt, {
        x: px + 0.1, y: ry + 0.08, w: 2.02, h: 0.8,
        fontSize: ri === 2 ? 10 : 8.5, fontFace: fontJP,
        color: isFinal ? C.tealDark : C.dark,
        bold: isFinal, margin: 2, align: 'center', valign: 'middle'
      });
    });
  });

  // セール目印
  [[1, '3月SALE'], [3, '6月SALE'], [5, '9月SALE'], [7, '12月SALE']].forEach(([col, label]) => {
    if (col < 8) {
      const mx = 1.72 + Math.floor(col/2) * 2.38 + (col%2)*1.1;
      s8.addShape(pres.shapes.RECTANGLE, {
        x: mx, y: 4.3, w: 1.0, h: 0.28,
        fill: { color: C.rose }, line: { color: C.rose }, rectRadius: 0.06
      });
      s8.addText(`🔥 ${label}`, {
        x: mx + 0.05, y: 4.33, w: 0.9, h: 0.22,
        fontSize: 7.5, fontFace: fontJP, color: C.white, bold: true, align: 'center', margin: 0
      });
    }
  });
  addFooter(s8, 7);

  // ════════════════════════════════════════════════════════
  // SLIDE 9: シミュレーション概要（PDFデザイン準拠 セクション扉）
  // ════════════════════════════════════════════════════════
  const s9 = pres.addSlide();
  s9.background = { color: C.white };

  // 資料ベース.pptx と完全同一のセクション扉背景
  addSectionCover(s9);

  // セクションタイトル（中央左）
  s9.addText('売上シミュレーション', {
    x: 0.7, y: 2.2, w: 6.0, h: 0.75,
    fontSize: 34, fontFace: fontJP, color: C.dark, bold: true, margin: 0
  });
  s9.addText('モンテカルロ法1,000回試行による確率的売上予測', {
    x: 0.7, y: 3.05, w: 4.5, h: 0.35,
    fontSize: 11, fontFace: fontJP, color: C.tealDark, margin: 0
  });
  s9.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 3.5, w: 3.5, h: 0.04,
    fill: { color: C.tealLight }, line: { color: C.tealLight, width: 0 }
  });

  // ════════════════════════════════════════════════════════
  // SLIDE 9b: シミュレーション概要 KPI（コンテンツ）
  // ════════════════════════════════════════════════════════
  const s9b = pres.addSlide();
  s9b.background = { color: C.white };
  addSlideHeader(s9b, 8, '売上シミュレーション概要', 'モンテカルロ法1,000回試行による確率的売上予測');

  // 3つのKPIカード（大型）
  const bigKpis = [
    { label: '現在の月商',         value: formatCurrency(currentSales),     sub: '基準値（現状）',  dark: false },
    { label: '1年後 支援なし',      value: formatCurrency(noSupportFinal),   sub: '▼15% 現状維持シナリオ', dark: false },
    { label: '1年後目標 支援あり',  value: formatCurrency(finalSales),       sub: `現状比 ${growthMultiple}倍 (+${growthRate}%)`, dark: true },
  ];

  bigKpis.forEach((kpi, i) => {
    const kx = 0.3 + i * 3.2;
    s9b.addShape(pres.shapes.RECTANGLE, {
      x: kx, y: 1.1, w: 3.05, h: 1.45,
      fill: { color: kpi.dark ? C.teal : C.slateBg },
      line: { color: kpi.dark ? C.tealMid : C.tealLight, width: kpi.dark ? 2 : 1 },
      rectRadius: 0.15
    });
    s9b.addText(kpi.label, {
      x: kx + 0.15, y: 1.2, w: 2.75, h: 0.3,
      fontSize: 10, fontFace: fontJP, color: kpi.dark ? C.tealLight : C.slateLight, bold: true, margin: 0
    });
    s9b.addText(kpi.value, {
      x: kx + 0.1, y: 1.49, w: 2.85, h: 0.62,
      fontSize: kpi.dark ? 20 : 18, fontFace: fontJP,
      color: kpi.dark ? C.white : C.dark, bold: true, margin: 0
    });
    s9b.addText(kpi.sub, {
      x: kx + 0.15, y: 2.11, w: 2.75, h: 0.28,
      fontSize: 9, fontFace: fontJP, color: kpi.dark ? C.tealBg : C.slateLight, margin: 0
    });
  });

  // 目標根拠の内訳
  s9b.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 2.7, w: 9.4, h: 0.35,
    fill: { color: C.teal }, line: { color: C.teal, width: 0 }, rectRadius: 0.08
  });
  s9b.addText('目標達成の根拠内訳（弊社支援データ連動）', {
    x: 0.5, y: 2.75, w: 9, h: 0.25,
    fontSize: 11, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });

  const rationaleItems = analysisResult.targetRationale?.breakdown || [
    { label: 'アクセス増加施策（RPP広告・SEO・サムネイル等）', value: Math.round((finalSales - currentSales) * 0.55), ratio: '55%' },
    { label: 'CVR向上施策（商品ページ・レビュー・差別化等）', value: Math.round((finalSales - currentSales) * 0.35), ratio: '35%' },
    { label: 'ジャンル自然成長・季節イベント効果',           value: Math.round((finalSales - currentSales) * 0.10), ratio: '10%' },
  ];

  const rationaleColors = [C.tealDark, C.blue, C.emerald];
  rationaleItems.forEach((item, i) => {
    const ry = 3.15 + i * 0.72;
    s9b.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: ry, w: 9.4, h: 0.64,
      fill: { color: i % 2 === 0 ? C.tealBg2 : C.white },
      line: { color: C.tealLight, width: 0.5 }
    });
    s9b.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: ry, w: 0.7, h: 0.64,
      fill: { color: rationaleColors[i] }, line: { color: rationaleColors[i] }
    });
    s9b.addText(item.ratio, {
      x: 0.3, y: ry + 0.15, w: 0.7, h: 0.34,
      fontSize: 11, fontFace: fontEN, color: C.white, bold: true, align: 'center', margin: 0
    });
    s9b.addText(item.label, {
      x: 1.1, y: ry + 0.13, w: 6.5, h: 0.38,
      fontSize: 10, fontFace: fontJP, color: C.dark, bold: true, margin: 0, valign: 'middle'
    });
    s9b.addText(`+${formatCurrency(item.value)} / 月`, {
      x: 7.7, y: ry + 0.1, w: 1.85, h: 0.42,
      fontSize: 12, fontFace: fontJP, color: C.tealDark, bold: true, align: 'right', valign: 'middle', margin: 0
    });
  });
  addFooter(s9b, 8);

  // ════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════
  // SLIDE 10: シミュレーション詳細① マイルストーン＋要因
  // ════════════════════════════════════════════════════════
  // SLIDE 11: シミュレーション詳細② マイルストーン＋要因
  // ════════════════════════════════════════════════════════
  const s11 = pres.addSlide();
  s11.background = { color: C.white };
  addSlideHeader(s11, 9, 'シミュレーション詳細①　マイルストーン', '4段階マイルストーンの目標値と上昇・リスク要因');

  const simData2 = analysisResult.simulationData || [];
  const getMilestoneData = (month) => {
    const dayIdx = month * 30;
    const d = simData2.find(x => x.dayIndex === dayIdx) || simData2[Math.min(dayIdx-1, simData2.length-1)];
    return d ? d.supportScenario : 0;
  };

  const msData = [
    { month: 3,  label: '初期効果期', sales: getMilestoneData(3),  desc: '基本ページ改善・RPP広告開始による\n初期CVR向上とセール流入増加' },
    { month: 6,  label: '加速期',     sales: getMilestoneData(6),  desc: 'スーパーSALE（6月）恩恵大\nリピート購入層の形成開始' },
    { month: 9,  label: '定着期',     sales: getMilestoneData(9),  desc: '施策フル稼働・口コミ評価向上\nスーパーSALE（9月）追加押し上げ' },
    { month: 12, label: '目標達成',   sales: getMilestoneData(12), desc: '12月スーパーSALE×施策相乗効果\n年間目標達成・持続可能成長基盤完成' },
  ];

  msData.forEach((ms, i) => {
    const mx = 0.3 + i * 2.38;
    const isTarget = i === 3;
    s11.addShape(pres.shapes.RECTANGLE, {
      x: mx, y: 1.15, w: 2.22, h: 2.8,
      fill: { color: isTarget ? C.tealBg : C.slateBg },
      line: { color: isTarget ? C.teal : C.tealLight, width: isTarget ? 2 : 1 },
      rectRadius: 0.14
    });
    s11.addShape(pres.shapes.RECTANGLE, {
      x: mx, y: 1.15, w: 2.22, h: 0.45,
      fill: { color: isTarget ? C.teal : C.tealLight }, line: { color: isTarget ? C.teal : C.tealLight }, rectRadius: 0.14
    });
    s11.addText(`${ms.month}ヶ月目`, {
      x: mx + 0.1, y: 1.18, w: 2.02, h: 0.28,
      fontSize: 13, fontFace: fontEN, color: isTarget ? C.white : C.tealDark, bold: true, align: 'center', margin: 0
    });
    s11.addText(ms.label, {
      x: mx + 0.1, y: 1.44, w: 2.02, h: 0.18,
      fontSize: 8, fontFace: fontJP, color: isTarget ? C.tealLight : C.tealDark, align: 'center', margin: 0
    });
    s11.addText('月商予測', {
      x: mx + 0.1, y: 1.72, w: 2.02, h: 0.22,
      fontSize: 8.5, fontFace: fontJP, color: C.slateLight, align: 'center', margin: 0
    });
    s11.addText(formatCurrency(ms.sales), {
      x: mx + 0.05, y: 1.93, w: 2.12, h: 0.48,
      fontSize: isTarget ? 14 : 13, fontFace: fontJP,
      color: isTarget ? C.tealDark : C.dark, bold: true, align: 'center', margin: 0
    });
    const growth = ((ms.sales / currentSales - 1) * 100).toFixed(0);
    s11.addText(`現状比 +${growth}%`, {
      x: mx + 0.1, y: 2.41, w: 2.02, h: 0.22,
      fontSize: 9, fontFace: fontJP,
      color: isTarget ? C.tealDark : C.emerald, bold: true, align: 'center', margin: 0
    });
    s11.addShape(pres.shapes.RECTANGLE, {
      x: mx + 0.1, y: 2.68, w: 2.02, h: 0.01,
      fill: { color: isTarget ? C.teal : C.tealLight }, line: { color: isTarget ? C.teal : C.tealLight }
    });
    s11.addText(ms.desc, {
      x: mx + 0.1, y: 2.74, w: 2.02, h: 1.12,
      fontSize: 8, fontFace: fontJP, color: C.slate, margin: 2, align: 'left', valign: 'top'
    });
  });

  // 上昇・リスク要因
  const upsides = (analysisResult.simulationContext?.upsideFactors || []).slice(0, 2);
  const downsides = (analysisResult.simulationContext?.downsideFactors || []).slice(0, 2);

  s11.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.1, w: 4.65, h: 1.2,
    fill: { color: C.emeraldBg }, line: { color: C.emerald, width: 1.5 }, rectRadius: 0.12
  });
  s11.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.1, w: 4.65, h: 0.38,
    fill: { color: C.emerald }, line: { color: C.emerald }, rectRadius: 0.12
  });
  s11.addText('▲  上昇要因（アップサイド）', {
    x: 0.5, y: 4.14, w: 4.25, h: 0.28,
    fontSize: 11, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  upsides.forEach((u, i) => {
    s11.addText(`• ${u.substring(0, 80)}${u.length > 80 ? '...' : ''}`, {
      x: 0.45, y: 4.54 + i * 0.38, w: 4.45, h: 0.34,
      fontSize: 8.5, fontFace: fontJP, color: C.dark, margin: 2
    });
  });

  s11.addShape(pres.shapes.RECTANGLE, {
    x: 5.05, y: 4.1, w: 4.65, h: 1.2,
    fill: { color: C.amberBg }, line: { color: C.amber, width: 1.5 }, rectRadius: 0.12
  });
  s11.addShape(pres.shapes.RECTANGLE, {
    x: 5.05, y: 4.1, w: 4.65, h: 0.38,
    fill: { color: C.amber }, line: { color: C.amber }, rectRadius: 0.12
  });
  s11.addText('▼  リスク要因（ダウンサイド）', {
    x: 5.25, y: 4.14, w: 4.25, h: 0.28,
    fontSize: 11, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  downsides.forEach((d, i) => {
    s11.addText(`• ${d.substring(0, 80)}${d.length > 80 ? '...' : ''}`, {
      x: 5.2, y: 4.54 + i * 0.38, w: 4.45, h: 0.34,
      fontSize: 8.5, fontFace: fontJP, color: C.dark, margin: 2
    });
  });
  addFooter(s11, 9);

  // ════════════════════════════════════════════════════════
  // SLIDE 12: シミュレーション詳細③ 月次KPI分解表
  // ════════════════════════════════════════════════════════
  const s12 = pres.addSlide();
  s12.background = { color: C.white };
  addSlideHeader(s12, 10, 'シミュレーション詳細②　月次KPI分解', '売上＝アクセス×CVR×客単価（逆算）/ 購入件数の月次内訳');

  // テーブルヘッダー
  const tableHeaders = ['月', '売上予測', 'アクセス数', 'CVR', '客単価', '購入件数', '前月比'];
  const colWidths = [0.45, 1.42, 1.05, 0.72, 0.9, 0.85, 0.72];
  let tableX = 0.28;

  // ヘッダー行
  tableHeaders.forEach((h, i) => {
    const tx = tableX + colWidths.slice(0, i).reduce((a,b) => a+b, 0);
    s12.addShape(pres.shapes.RECTANGLE, {
      x: tx, y: 1.15, w: colWidths[i], h: 0.35,
      fill: { color: C.tealDark }, line: { color: C.tealDark }
    });
    s12.addText(h, {
      x: tx + 0.02, y: 1.18, w: colWidths[i] - 0.04, h: 0.28,
      fontSize: 8.5, fontFace: fontJP, color: C.white, bold: true, align: 'center', margin: 0
    });
  });

  // 月次データ行
  const simDataFull = analysisResult.simulationData || [];
  const kpiInitialTraffic = 10000;
  const kpiInitialCVR = 0.012;

  for (let month = 1; month <= 12; month++) {
    const dayIdx = month * 30;
    const d = simDataFull.find(x => x.dayIndex === dayIdx) || simDataFull[Math.min(dayIdx-1, simDataFull.length-1)];
    if (!d) continue;
    const sales = d.supportScenario;
    const progressRatio = (month - 1) / 11;
    const simInitSales = kpiInitialTraffic * kpiInitialCVR * 5000;
    const trafficGF = Math.pow(sales / Math.max(simInitSales, 1), 0.85);
    const traffic = Math.round(kpiInitialTraffic * trafficGF);
    const cvr = kpiInitialCVR * (1 + progressRatio * 0.5);
    const orders = Math.max(1, Math.round(traffic * cvr));
    const aov = orders > 0 ? Math.round(sales / orders) : 5000;
    const prevIdx = (month - 1) * 30;
    const prevD = month > 1 ? (simDataFull.find(x => x.dayIndex === prevIdx) || simDataFull[Math.min(prevIdx-1, simDataFull.length-1)]) : null;
    const prevSales = prevD ? prevD.supportScenario : currentSales;
    const growth = prevSales > 0 ? ((sales / prevSales - 1) * 100).toFixed(1) : '—';

    const rowY = 1.5 + (month - 1) * 0.32;
    const isTarget = month === 12;
    const isEven = month % 2 === 0;
    const rowBg = isTarget ? C.tealBg : isEven ? C.slateBg : C.white;
    const rowBorder = isTarget ? C.teal : 'E2E8F0';

    const rowVals = [
      `${month}月`,
      formatCurrency(sales),
      traffic.toLocaleString(),
      `${(cvr*100).toFixed(2)}%`,
      formatCurrency(aov),
      `${orders}件`,
      month === 1 ? '—' : `${Number(growth) >= 0 ? '+' : ''}${growth}%`,
    ];

    rowVals.forEach((val, ci) => {
      const cx = tableX + colWidths.slice(0, ci).reduce((a,b) => a+b, 0);
      s12.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: rowY, w: colWidths[ci], h: 0.3,
        fill: { color: rowBg }, line: { color: rowBorder, width: 0.5 }
      });
      const isGrowthCol = ci === 6;
      const growthNum = isGrowthCol ? parseFloat(growth) : 0;
      const textColor = isTarget ? C.tealDark : isGrowthCol ? (growthNum > 0 ? C.emerald : growthNum < 0 ? C.rose : C.slateLight) : C.dark;
      s12.addText(val, {
        x: cx + 0.02, y: rowY + 0.04, w: colWidths[ci] - 0.04, h: 0.22,
        fontSize: ci === 0 ? 8.5 : 8, fontFace: ci === 0 ? fontJP : fontEN,
        color: textColor, bold: isTarget, align: ci === 0 ? 'center' : 'right', margin: 0
      });
    });
  }

  // 注釈
  s12.addText('※ 売上＝シミュレーション算出値（真値）　アクセス・CVRはKPI設定から近似　客単価＝売上÷購入件数（逆算）', {
    x: 0.3, y: 5.35, w: 9.4, h: 0.2,
    fontSize: 7.5, fontFace: fontJP, color: C.slateLight, margin: 0
  });
  addFooter(s12, 10);

  // ════════════════════════════════════════════════════════
  // SLIDE 13: シミュレーション詳細④ ROI・費用対効果
  // ════════════════════════════════════════════════════════
  const s13 = pres.addSlide();
  s13.background = { color: C.white };
  addSlideHeader(s13, 11, 'シミュレーション詳細③　費用対効果・ROI分析', '広告投資対効果と12ヶ月累計利益シミュレーション');

  // 現状 vs 目標 ROI比較
  const adPct = 5.5; // 平均広告費率
  const pfPct = 5;
  const shipPerOrder = 500;
  const fixedCost = 100000;

  const calcProfit = (sales, aov) => {
    const ords = Math.round(sales / (aov || 5000));
    const ad = Math.round(sales * adPct / 100);
    const pf = Math.round(sales * pfPct / 100);
    const ship = ords * shipPerOrder;
    const profit = sales - ad - pf - ship - fixedCost;
    const margin = sales > 0 ? (profit / sales * 100).toFixed(1) : 0;
    return { ad, pf, ship, profit, margin };
  };

  const curProfit = calcProfit(currentSales, 5000);
  const tgtProfit = calcProfit(finalSales, 5000);

  // 比較カード2枚
  [
    { label: '現在の月商',   sales: currentSales,  profit: curProfit, color: C.slate,    bgColor: C.slateBg },
    { label: '目標月商（1年後）', sales: finalSales, profit: tgtProfit, color: C.tealDark, bgColor: C.tealBg },
  ].forEach((card, ci) => {
    const cx = 0.3 + ci * 4.85;
    s13.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.15, w: 4.6, h: 3.7,
      fill: { color: card.bgColor }, line: { color: ci === 1 ? C.teal : C.tealLight, width: ci === 1 ? 2 : 1 }, rectRadius: 0.15
    });
    s13.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.15, w: 4.6, h: 0.48,
      fill: { color: ci === 1 ? C.teal : C.tealDark }, line: { color: ci === 1 ? C.teal : C.tealDark }, rectRadius: 0.15
    });
    s13.addText(card.label, {
      x: cx + 0.15, y: 1.2, w: 4.3, h: 0.36,
      fontSize: 13, fontFace: fontJP, color: C.white, bold: true, margin: 0
    });
    s13.addText(formatCurrency(card.sales), {
      x: cx + 0.15, y: 1.72, w: 4.3, h: 0.55,
      fontSize: 22, fontFace: fontJP, color: ci === 1 ? C.tealDark : C.dark, bold: true, margin: 0
    });

    const items = [
      { lbl: '広告費',   val: formatCurrency(card.profit.ad),   color: C.rose },
      { lbl: '取扱手数料', val: formatCurrency(card.profit.pf), color: C.rose },
      { lbl: '送料',     val: formatCurrency(card.profit.ship), color: C.rose },
      { lbl: '固定費',   val: formatCurrency(fixedCost),        color: C.rose },
      { lbl: '純利益',   val: formatCurrency(card.profit.profit), color: card.profit.profit > 0 ? C.emerald : C.rose },
      { lbl: '利益率',   val: `${card.profit.margin}%`,          color: card.profit.profit > 0 ? C.emerald : C.rose },
    ];
    items.forEach((item, ii) => {
      const iy = 2.35 + ii * 0.38;
      const isBold = ii >= 4;
      s13.addShape(pres.shapes.RECTANGLE, {
        x: cx + 0.15, y: iy, w: 4.3, h: 0.34,
        fill: { color: isBold ? (ci === 1 ? 'D1FAE5' : 'F0FDF4') : C.white },
        line: { color: 'E2E8F0', width: 0.5 }
      });
      s13.addText(item.lbl, {
        x: cx + 0.25, y: iy + 0.06, w: 1.5, h: 0.22,
        fontSize: 9.5, fontFace: fontJP, color: C.slateLight, bold: isBold, margin: 0
      });
      s13.addText(item.val, {
        x: cx + 1.8, y: iy + 0.04, w: 2.55, h: 0.26,
        fontSize: isBold ? 12 : 10, fontFace: fontJP, color: isBold ? item.color : C.dark,
        bold: isBold, align: 'right', margin: 0
      });
    });
  });

  // 累計売上増加額
  const annualExtra = Math.round(finalSales * 7 - currentSales * 12);
  s13.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 5.0, w: 9.4, h: 0.35,
    fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.08
  });
  s13.addText(`12ヶ月累計での売上増加額（概算）：+${formatCurrency(Math.max(0, annualExtra))}　　広告費は売上対比 ${adPct}% 平均想定`, {
    x: 0.5, y: 5.05, w: 9, h: 0.24,
    fontSize: 9.5, fontFace: fontJP, color: C.white, bold: true, margin: 0
  });
  addFooter(s13, 11);

  // ── ファイル出力 ──
  const fileName = `EC改善提案書_${companyName}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pptx`;
  await pres.writeFile({ fileName });
};
// ════════════════════════════════════════════════════════════════
// 【新機能】月次売上要素の詳細分解算出（完全修正版）
// ════════════════════════════════════════════════════════════════
const calculateDynamicAOV = (month, baseAOV, upliftFactor = 1.15) => {
  // 月を進むに従ってAOVが上昇する（ページ最適化・クーポン施策による客単価UP）
  const monthProgress = Math.min(month / 12, 1); // 0.0 ~ 1.0
  const aovIncrease = baseAOV * (upliftFactor - 1) * monthProgress;
  return Math.round(baseAOV + aovIncrease);
};

const augmentMonthlyDetails = (simulationData, kpiData, operatingCosts, formData) => {
  if (!simulationData || simulationData.length === 0) return [];

  const currentSales = Number(formData.currentMonthlySales);
  const initialAOV = operatingCosts.aov || 5000;
  const initialCVR = kpiData.initialCVR || 0.012;
  const initialTraffic = kpiData.initialTraffic || 10000;
  
  const platformFeePercent = operatingCosts.platformFeePercent || 5;
  const shippingCostPerOrder = operatingCosts.shippingCost || 500;
  const fixedCostMonthly = operatingCosts.operationalCostFixed || 100000;
  const adSpendMin = operatingCosts.adSpendMinPercent || 3;
  const adSpendMax = operatingCosts.adSpendMaxPercent || 8;

  const initialSimulatedSales = Math.round(initialTraffic * initialCVR * initialAOV);
  console.log(`初月検証: ${initialTraffic} × ${(initialCVR * 100).toFixed(2)}% × ${initialAOV}円 = ${initialSimulatedSales}円`);

  const monthlySimData = {};
  
  // 各日ごとのデータを集約
  simulationData.forEach((dayData) => {
    const monthIndex = Math.floor((dayData.dayIndex - 1) / 30) + 1;
    
    if (!monthlySimData[monthIndex] || dayData.dayIndex % 30 === 0) {
      monthlySimData[monthIndex] = {
        monthIndex,
        dayIndex: dayData.dayIndex,
        dateStr: dayData.dateStr,
        supportScenario: dayData.supportScenario
      };
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 【月ごとの詳細計算】
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const detailedMonthly = Object.values(monthlySimData).map((monthData, idx) => {
    const monthIndex = monthData.monthIndex;
    const sales = Math.round(monthData.supportScenario);

    const progressRatio = (monthIndex - 1) / 11;

    const trafficGrowthFactor = Math.pow(sales / initialSimulatedSales, 0.85);
    const traffic = Math.round(initialTraffic * trafficGrowthFactor);

    const cvrImprovementRate = progressRatio * 0.5;
    const cvr = initialCVR * (1 + cvrImprovementRate);

    // 購入件数 = アクセス数 × CVR（小数）← アクセス・CVRはユーザー入力から近似
    const orders = Math.max(1, Math.round(traffic * cvr));

    // 客単価（逆算）= 売上 ÷ 購入件数  ← 売上はシミュレーション真値
    const derivedAOV = orders > 0 ? Math.round(sales / orders) : initialAOV;

    // 検証用
    const calculatedSales = Math.round(traffic * cvr * derivedAOV);
    const salesDifference = Math.abs(sales - calculatedSales);

    console.log(`月${monthIndex}: 売上=${sales}円, アクセス=${traffic}, CVR=${(cvr*100).toFixed(2)}%, 客単価(逆算)=${derivedAOV}円, 購入件数=${orders}件`);

    const adSpendPercent = adSpendMin + (adSpendMax - adSpendMin) * progressRatio;
    const adSpend = Math.round(sales * (adSpendPercent / 100));

    const platformFee = Math.round(sales * (platformFeePercent / 100));
    const shippingCostTotal = Math.round(orders * shippingCostPerOrder);
    const fixedCost = fixedCostMonthly;

    const totalExpense = adSpend + platformFee + shippingCostTotal + fixedCost;
    const profit = sales - totalExpense;
    const profitMargin = sales > 0 ? (profit / sales) * 100 : 0;

    let prevMonthSales = monthIndex === 1 ? currentSales : 0;
    if (monthIndex > 1 && idx > 0) {
      const prevMonthData = Object.values(monthlySimData)[idx - 1];
      prevMonthSales = Math.round(prevMonthData.supportScenario);
    }
    
    const monthRatio = prevMonthSales > 0 
      ? ((sales / prevMonthSales) - 1) * 100 
      : 0;

    const cpc = 50;
    const adAccessCount = adSpend > 0 ? Math.round(adSpend / cpc) : 0;
    const baseAccessCount = Math.max(0, traffic - adAccessCount);
    const adAccessRatio = traffic > 0 ? adAccessCount / traffic : 0;

    return {
      monthIndex,
      dateStr: monthData.dateStr,
      dayIndex: monthData.dayIndex,
      売上: sales,
      訪問数: traffic,
      アクセス数: traffic,
      購入件数: orders,
      CVR: (cvr * 100).toFixed(2),  // 既に%値（例: 1.20）として保存
      客単価: derivedAOV,  // 逆算値: 売上÷購入件数
      検証売上: calculatedSales,
      誤差: salesDifference,
      広告費: adSpend,
      広告比率: adSpendPercent.toFixed(1),
      手数料: platformFee,
      送料: shippingCostTotal,
      固定費: fixedCost,
      総経費: totalExpense,
      利益: profit,
      利益率: profitMargin.toFixed(1),
      前月比: monthRatio.toFixed(1),
      前月比成長率: monthIndex === 1 ? null : (monthRatio / 100),
      想定CPC: cpc,
      ベースアクセス: baseAccessCount,
      広告経由アクセス: adAccessCount,
      広告経由比率: adAccessRatio
    };
  });

  return detailedMonthly;
};
export default function App() {
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
    const root = document.getElementById('root');
    if (root) {
      root.style.maxWidth = '100%';
      root.style.margin = '0';
      root.style.padding = '0';
      root.style.textAlign = 'left';
      root.style.width = '100vw';
      root.style.minHeight = '100vh';
    }
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.overflowX = 'hidden';
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('simulate');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0); 
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uiError, setUiError] = useState('');
  
  const [showSimulation, setShowSimulation] = useState(false);
  const [isGeneratingSim, setIsGeneratingSim] = useState(false);
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [pptxError, setPptxError] = useState('');
  
  const [genres, setGenres] = useState([]);
  const [genreStats, setGenreStats] = useState({});
  const [csvStatus, setCsvStatus] = useState('初期データを読み込み中...');
  const fileInputRef = useRef(null);

  // 【新機能】KPIと運営費用ステート
  const [kpiData, setKpiData] = useState({
    initialTraffic: 10000,
    initialAOV: 5000,
    initialCVR: 0.012,
  });

  const [operatingCosts, setOperatingCosts] = useState({
    adSpendMinPercent: 3,
    adSpendMaxPercent: 8,
    shippingCost: 500,
    platformFeePercent: 5,
    operationalCostFixed: 100000,
     aov: 5000,  
  });
  
  const [formData, setFormData] = useState({
    companyName: '',
    genre: '',
    productUrl: '',
    currentMonthlySales: 5000000,
    hearingDetails: ''
  });

  // 【新機能】売上分解・利益計算ロジック
  const calculateSalesDecomposition = (traffic, aov, cvr) => {
    const sales = Math.round(traffic * aov * cvr);
    return sales;
  };

const calculateProfitMargin = (sales, costs, scenario = 'mid') => {
  const adSpendPercent = scenario === 'min' 
    ? costs.adSpendMinPercent
    : scenario === 'max'
    ? costs.adSpendMaxPercent
    : (costs.adSpendMinPercent + costs.adSpendMaxPercent) / 2;

  const adSpend = Math.round(sales * (adSpendPercent / 100));
  const platformFee = Math.round(sales * (costs.platformFeePercent / 100));
  const aov = costs.aov || 5000;  // ✅ この行を追加
  const orders = Math.round(sales / aov) || 1;  // ✅ costs.aov → aov に変更
  const shippingCost = Math.round(orders * costs.shippingCost);
  const totalOperatingCost = costs.operationalCostFixed;

  const grossProfit = sales - platformFee - shippingCost - totalOperatingCost;
  const netProfit = grossProfit - adSpend;
  const profitMarginPercent = sales > 0 ? ((netProfit / sales) * 100).toFixed(1) : 0;

  return {
    sales,
    adSpend,
    platformFee,
    shippingCost,
    totalOperatingCost,
    grossProfit,
    netProfit,
    profitMarginPercent
  };
};
  const defaultCsvData = `,MKトレンド,ラネージュ,ダニエル・ウェリントン,コンビタ,BISCO,イーシージャパン,エストラ,プリメラ,アサヒ軽金属,店研創意,白神屋,コーユーレンティア,JAPANNEXT,タケヤ化学工業
,ファッション,韓国コスメ,時計,食品,菓子,電子製品,韓国コスメ,コスメ,調理器具,ディスプレイ,食品,家具,IT,家庭用品
2025-01-01,2048010,25507762,7441023,28876603,34467160,13128424,19153138,1646082,26481230,13397080,25043560,3034187,39439929,11522860
2025-02-01,1551151,20061015,5072708,21754208,24701880,12155120,11360506,1206865,31983131,13453001,12637636,1645613,37718465,10884010
2025-03-01,2794326,21275860,10912674,23407760,35095420,16891467,11825578,2205127,45387545,15852867,11186409,3562955,51465085,14654537
2025-04-01,2284598,20624226,7363311,15768861,34267270,16225448,13684083,1800000,42000000,14000000,12000000,4000000,55000000,15000000`;

  const processCsvText = (csvText, fileName) => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 3) throw new Error("データ行が不足しています");
      const headers = lines[0].split(',');
      const genreRow = lines[1].split(',');
      const data = [];
      for (let i = 2; i < lines.length; i++) data.push(lines[i].split(','));
      
      const stats = {};
      const uniqueGenres = new Set();
      
      for (let col = 1; col < headers.length; col++) {
        const genre = genreRow[col]?.trim();
        if (!genre) continue;
        uniqueGenres.add(genre);
        if (!stats[genre]) stats[genre] = { rates: [] };
        for (let row = 1; row < data.length; row++) {
          const prev = parseFloat(data[row-1][col]);
          const curr = parseFloat(data[row][col]);
          if (prev > 0 && curr > 0) stats[genre].rates.push(curr / prev);
        }
      }
      
      Object.keys(stats).forEach(genre => {
        const rates = stats[genre].rates;
        if (rates.length > 0) {
          const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
          const variance = rates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rates.length;
          stats[genre].mean = mean;
          stats[genre].stdDev = Math.max(Math.sqrt(variance), 0.10); 
        } else {
          stats[genre].mean = 1.03;
          stats[genre].stdDev = 0.15;
        }
      });
      
      const genreList = Array.from(uniqueGenres).map(g => ({ id: g, name: g }));
      setGenres(genreList);
      setGenreStats(stats);
      if (genreList.length > 0) setFormData(prev => ({ ...prev, genre: genreList[0].id }));
      setCsvStatus(`✅ [${fileName}] から実績データを解析しました（${genreList.length}ジャンル）`);
    } catch (e) {
      setCsvStatus(`❌ エラー: データの読み込みに失敗しました (${e.message})`);
    }
  };

  useEffect(() => {
    processCsvText(defaultCsvData, "提供サンプルデータ");
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPass === 'pf123456') {
      setIsLoggedIn(true);
      setActiveTab('simulate');
      setLoginError('');
    } else {
      setLoginError('パスワードが正しくありません');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => processCsvText(evt.target.result, file.name);
    reader.readAsText(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKPIChange = (e) => {
    const { name, value } = e.target;
    setKpiData(prev => ({ 
      ...prev, 
      [name]: name === 'initialCVR' 
        ? parseFloat(value) / 100 
        : parseInt(value) || 0 
    }));
  };

  const handleOperatingCostsChange = (e) => {
    const { name, value } = e.target;
    setOperatingCosts(prev => ({ 
      ...prev, 
      [name]: parseFloat(value) || 0 
    }));
  };

  const runRealisticSimulation = (aiSeasonality) => {
    const currentSales = Number(formData.currentMonthlySales);
    const targetSales = getTargetSales(currentSales);
    const noSupportTargetSales = currentSales * 0.85; 

    const currentGenreStats = genreStats[formData.genre] || { mean: 1.03, stdDev: 0.15 };
    const genreTargetSales = currentSales * Math.pow(Math.max(currentGenreStats.mean, 1.01), 12);

    const SIMULATION_COUNT = 1000;
    const DISPLAY_SIM_COUNT = 25; 
    
    const supportVol = 0.08; 
    const noSupportVol = 0.05;
    const genreVol = currentGenreStats.stdDev / Math.sqrt(30);

    const startDate = new Date();
    
    const generatePath = (type) => {
        let path = [];
        let current = currentSales;
        let target, vol;

        if (type === 'support') {
            target = targetSales;
            vol = supportVol;
        } else if (type === 'noSupport') {
            target = noSupportTargetSales;
            vol = noSupportVol;
        } else {
            target = genreTargetSales; 
            vol = genreVol;
        }

        const dailyDrift = Math.log(target / currentSales) / 365;

        for(let i = 1; i <= 365; i++) {
            let date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            let m = date.getMonth() + 1;
            let d = date.getDate();

            let seasonDrift = 0;
            if (aiSeasonality?.offPeakMonths?.includes(m)) seasonDrift = -0.005; 
            else if (aiSeasonality?.peakMonths?.includes(m)) seasonDrift = 0.005;

            let eventMult = 1.0;
            if ([3, 6, 9, 12].includes(m)) {
                if (d >= 4 && d <= 10) {
                    eventMult = 1.25 + Math.random() * 0.3; 
                } else if (d >= 11 && d <= 15) {
                    eventMult = 0.85; 
                }
            }
            if (d % 5 === 0) eventMult *= 1.1; 

            let z = randomNormal(0, 1);
            let totalDrift = dailyDrift + seasonDrift;
            
            current = current * Math.exp((totalDrift - (vol**2)/2) + vol * z);
            
            let expected = currentSales + (target - currentSales) * Math.pow(i/365, type === 'support' ? 1.2 : 1.0);
            if (type !== 'noSupport') {
                current = current * 0.95 + expected * 0.05; 
            }

            let plotValue = current * eventMult;
            path.push(Math.max(0, plotValue));
        }
        return path;
    };

    let supportPaths = [];
    let noSupportPaths = [];
    let genrePaths = [];
    
    for(let i=0; i<SIMULATION_COUNT; i++){
        supportPaths.push(generatePath('support'));
        noSupportPaths.push(generatePath('noSupport'));
        genrePaths.push(generatePath('genre'));
    }

    supportPaths.sort((a, b) => a[364] - b[364]);
    noSupportPaths.sort((a, b) => a[364] - b[364]);
    genrePaths.sort((a, b) => a[364] - b[364]);

    const medianSupportPath = supportPaths[Math.floor(SIMULATION_COUNT / 2)];
    const medianNoSupportPath = noSupportPaths[Math.floor(SIMULATION_COUNT / 2)];
    const medianGenrePath = genrePaths[Math.floor(SIMULATION_COUNT / 2)];
    
    const p10SupportPath = supportPaths[Math.floor(SIMULATION_COUNT * 0.1)];
    const p90SupportPath = supportPaths[Math.floor(SIMULATION_COUNT * 0.9)];

    const displayPaths = [];
    for(let i=0; i<DISPLAY_SIM_COUNT; i++){
        displayPaths.push(supportPaths[Math.floor(Math.random() * SIMULATION_COUNT)]);
    }

    let chartData = [];
    for (let day = 1; day <= 365; day++) {
      let date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      let m = date.getMonth() + 1;
      let d = date.getDate();

      let dayData = {
        dayIndex: day,
        dateStr: `${m}/${d}`,
        isSaleEvent: ([3, 6, 9, 12].includes(m) && d === 4),
        supportScenario: Math.round(medianSupportPath[day-1]),
        noSupportScenario: Math.round(medianNoSupportPath[day-1]),
        genreTrendScenario: Math.round(medianGenrePath[day-1]),
        supportRange: [Math.round(p10SupportPath[day-1]), Math.round(p90SupportPath[day-1])]
      };

      for (let i = 0; i < DISPLAY_SIM_COUNT; i++) {
        dayData[`sim_${i}`] = Math.round(displayPaths[i][day-1]);
      }
      chartData.push(dayData);
    }

    const finalSales = Math.round(medianSupportPath[364]);
    const finalGenreSales = Math.round(medianGenrePath[364]);

    return {
      chartData,
      displaySimCount: DISPLAY_SIM_COUNT,
      finalSales,
      genreTargetSales: finalGenreSales
    };
  };

  const handleSimulate = async () => {
    setUiError('');
    setAnalysisStep('');
    setAnalysisProgress(0);
    setShowSimulation(false);
    
    if (!formData.productUrl || !apiKey) {
      setUiError("APIキーと対象ページURLを正しく入力してください。");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const currentSales = Number(formData.currentMonthlySales);
    const genreName = genres.find(g => g.id === formData.genre)?.name || formData.genre;
    let pageContent = "";
    let preExtracted = "";
    let aiResult = null;
    
    try {
      setAnalysisStep('対象URLへアクセスし、ページデータを取得中...');
      setAnalysisProgress(20);
      
      const jinaResponse = await fetch(`https://r.jina.ai/${formData.productUrl}`);
      if (jinaResponse.ok) {
        const fullText = await jinaResponse.text();
        
        const priceMatches = fullText.match(/[0-9,]{3,}\s*円/g) || [];
        const reviewMatches = fullText.match(/\([0-9,]+\s*件\)|[0-9,]+\s*件/g) || [];
        const ratingMatches = fullText.match(/★\s*[0-5]\.[0-9]{1,2}|[0-5]\.[0-9]{1,2}/g) || [];

        const uniquePrices = [...new Set(priceMatches)].slice(0, 5).join(', ');
        const uniqueReviews = [...new Set(reviewMatches)].slice(0, 5).join(', ');
        const uniqueRatings = [...new Set(ratingMatches)].slice(0, 5).join(', ');

        preExtracted = `
【システム事前抽出データ（探索のヒント）】
プログラムがページ内から以下の数値をピックアップしました。
- 価格の表記候補: ${uniquePrices || '抽出なし'}
- レビュー件数の表記候補: ${uniqueReviews || '抽出なし'}
- 平均評価の表記候補: ${uniqueRatings || '抽出なし'}
`;

        const lines = fullText.split('\n');
        let contextLines = [];
        const keywords = ['円', '件', '★', '評価', 'レビュー', 'ポイント', 'クーポン', 'OFF', '送料'];
        for (let i = 0; i < lines.length; i++) {
          if (keywords.some(k => lines[i].includes(k))) {
             contextLines.push(lines[i].trim());
          }
        }
        
        const overview = fullText.substring(0, 400);
        const compressedText = contextLines.filter(line => line.length > 0).join('\n');
        pageContent = overview + "\n...\n" + compressedText.substring(0, 1000); 

      } else {
        throw new Error("指定されたURLへアクセスできません。存在しないかブロックされています。");
      }

      setAnalysisStep('AIがノイズを除外し、数値を抽出中...');
      setAnalysisProgress(50);
      
      const targetSales = getTargetSales(currentSales);

      const systemPrompt = `あなたは株式会社ピュアフラットの最高レベルのデータドリブンECコンサルタントAIです。楽天EC専門の現場ノウハウを持ち、年商1億円突破を複数社で実現してきたプロとして、データと仕組みで属人性を排除し、プラットフォーム変化に即座に適応する施策を立案します。

【対象ページとデータ抽出の極秘ルール（※絶対厳守）】
1. ユーザーが入力したURLが「店舗トップページ（ショップ全体）」の場合、商品が多数並んでいるため、価格やレビューが複数存在します。
2. その場合、【絶対に「1.3〜4.25」のような範囲で答えたり、「商品ごとにばらつきあり」といった言い訳をしてはいけません】。必ず、ショップ全体の評価、または主力商品の代表的な数値を【ズバリ1つだけ（例：4.82）】選んで出力してください。
3. 提供される【システム事前抽出データ】と【読み込んだページの内容】を両方確認し、実際に存在する事実の数値だけを出力してください。どうしても事実が見当たらない、完全にゼロであると確信した場合のみ「評価なし」や「0件」と出力し、勝手な捏造は絶対にしないでください。
4. 【事前ヒアリング・特記事項】が入力されている場合、その内容（現在の悩み、商品の強み、伸ばしたい部分など）を【最重要視】し、それを解決または最大化するための課題抽出と施策立案を優先的に行ってください。
5. 抽出する課題や施策、シミュレーションの要因は、誰が見ても納得できるよう【プロの視点で詳細かつ具体的に（各項目80〜150文字程度で深く）】言語化してください。短く表面的な指摘は評価を下げます。

【楽天EC専門知識フレームワーク（2026年最新版・必ず施策立案に反映）】

■ アクセス増加の最重要施策（優先順位順）
1. サーチ申請ハック：楽天の限定SALE設定でサーチ申請を行い、新規流入を最大8倍にした実績施策。スーパーSALE直前の申請タイミングと入札設定が鍵。検索順位5位以内のクリックシェアは45%超のため上位獲得は必須。
2. AI検索対応（AIEO）：カテゴリ属性を漏らさず100%入力し、商品説明を自然言語化。楽天AI推奨商品に選ばれることで広告費ゼロの恒久的な流入チャネルを確立。在庫切れはAIペナルティで即座に順位下落するため絶対回避。
3. メイン画像CTR特化設計：「0.1秒で指を止める」サムネイル設計が楽天での勝ちパターン。LINE/モール小画面対応の確認と、競合との視覚的差別化が必要。
4. 外部流入×モール内SEO自動向上：Meta広告（CPC 4円水準）/TikTok/SNS経由で楽天商品ページへ外部流入を誘導することで、モール内検索ランクが自動的に上昇する仕組みを構築。

■ CVR改善の最重要施策
1. 商品ページ「購入後の生活変化」ストーリー：使用後のビフォーアフターを画像・動画・テキストで具体的に訴求。権威訴求と詳細スペック・比較表の設置がCVR向上の基本。
2. レビュー質化（AI検索選別突破）：「具体的な解決策」が書かれたレビューを蓄積することがAI検索での選別突破に必須。購入後フォローメール自動化でレビュー獲得を加速。
3. LTV設計（同梱物×2回目購入フロー）：同梱物（次回購入クーポン・使い方ガイド）で購入体験を向上。LINE公式アカウントへの誘導と5と0のつく日のポイントUP合わせたフォローで、広告依存しない安定リピーター基盤を構築。
4. ギフト対応×回遊設計：ラッピング無料でギフト需要を確実に刈り取り。商品ページ内に関連商品バナーを設置して回遊設計を最適化することで、AOV（客単価）を+10%引き上げる弊社標準施策。

■ 絶対に避けるべき禁忌（必ず課題として指摘すること）
- 在庫切れ：AIペナルティで順位即座下落、絶対回避
- 属性未入力：AI検索から排除される致命的欠陥
- 古いバナー・リンク切れ：CVRに直撃する機会損失
- ポイント還元依存：薄利経営の最大原因、早期改善必須

【楽天の市場・セール動向を踏まえた予測強化】
以下の主要セールスケジュールを前提に、課題・施策を現実的かつ具体的に立案してください。
- 1月: 新春ポイントアップ祭（新規獲得の好機）
- 3, 6, 9, 12月: 楽天スーパーSALE（各月上旬・年間最重要イベント）
- 毎月5と0のつく日: ポイント5倍デー（LINEフォローフローの刈り取りタイミング）
- お買い物マラソン: まとめ買い需要・回遊設計が鍵

【出力内容の絶対ルール】
1. 課題と改善施策には、必ず具体的な数値を含めること。
2. quantitativeDataの各項目は、必ず単一の数値や明確な事実のみを記載すること。（「1.3〜4.25」などの範囲回答や「ばらつきあり」といった言い訳は絶対禁止）
3. currentIssuesには必ず「在庫切れリスク/属性入力状況」「レビュー質の現状」「LTV設計の有無」に関わる課題を含めること。
4. proposedSolutionsには必ず「AIEO属性整備」「サーチ申請×SALE設計」「LTV同梱フロー」のいずれかの施策を含めること。
3. 課題、施策、アップサイド/ダウンサイド要因は、具体的なアクションや理由を伴う詳細な文章で記載すること。とくにアップサイド要因には「〇〇の施策により月商ベースで〇〇万円程度の押し上��が見込める」といった目標数値を裏付ける金額的根拠を含めること。

以下のJSON形式で必ず出力してください。
{
  "thought_process": "数値をどのように決定したか（店舗全体か、どの代表商品か等）と、事前ヒアリング情報をどう施策に落とし込んだかを記載",
  "productInfo": "対象の概要",
  "quantitativeData": {
    "price": "販売価格または主力価格帯（単一の代表値。範囲や言い訳は禁止）",
    "images": "画像やバナーの充実度",
    "reviews": "レビュー件数（例: 216件 ※単一の代表値。範囲や言い訳は禁止。事実がなければ0件）",
    "averageRating": "平均評価（例: 4.82 ※単一の代表値。範囲や言い訳は禁止。事実がなければ評価なし）",
    "coupon": "キャンペーン・送料情報"
  },
  "currentStatus": { 
    "good": ["良い点1（※詳細に）", "良い点2（※詳細に）"], 
    "bad": ["悪い点1（※詳細に）", "悪い点2（※詳細に）"] 
  },
  "currentIssues": [
    "課題1（※ヒアリング内容や数値を踏まえ、なぜそれが課題なのか具体的かつ詳細に記載）", 
    "課題2（※詳細に記載）", 
    "課題3（※詳細に記載）", 
    "課題4（※詳細に記載）"
  ],
  "proposedSolutions": [
    "施策1（※課題解決に向けた具体的なアクション、期待される数値改善幅、実行のステップなどを詳細に記載）", 
    "施策2（※詳細に記載）", 
    "施策3（※詳細に記載）", 
    "施策4（※詳細に記載）"
  ],
  "seasonality": { "peakMonths": [7, 8], "offPeakMonths": [2, 11] },
  "simulationContext": {
    "upsideFactors": [
      "上がる要因1（※施策実行によるCVR向上やセール時のトラフィック増など、明確な理由と『月商〇〇万円程度の底上げに繋がる』といった金額ベースの根拠を詳細に解説）", 
      "上がる要因2（※詳細に解説）"
    ],
    "downsideFactors": [
      "下がる要因1（※課題放置による機会損失や閑散期のリスクなど、理由を詳細に解説）", 
      "下がる要因2（※詳細に解説）"
    ],
    "genreTrendAnalysis": "対象ページの現状、ヒアリング内容、施策の効果、楽天の市場動向を総合し、なぜこのシミュレーション軌跡（1年後の着地）になるのか、プロのコンサルタントとしての詳細な分析見解（200〜300文字程度で深く論理的に解説してください）"
  }
}`;

      const userPrompt = `企業名: ${formData.companyName}\nジャンル: ${genreName}\n現在の月商: ${currentSales}円\n目標月商: ${targetSales}円\n対象URL: ${formData.productUrl}\n\n【事前ヒアリング・特記事項】\n${formData.hearingDetails || '特になし'}\n\n${preExtracted}\n\n【読み込んだページの内容(抜粋)】\n${pageContent}`;
      
      const isGitHubToken = apiKey.startsWith('ghp_') || apiKey.startsWith('github_pat_');
      const apiUrl = isGitHubToken ? 'https://models.inference.ai.azure.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      
      setAnalysisStep('事実データに基づく定量的課題・要因を生成中...');
      setAnalysisProgress(75);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o', 
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.1 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.message?.includes('does not exist') || data.error?.code === 'model_not_found') {
            const fallbackResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                response_format: { type: "json_object" },
                temperature: 0.1 
              })
            });
            const fallbackData = await fallbackResponse.json();
            if (!fallbackResponse.ok) throw new Error(`AI通信エラー: ${fallbackData.error?.message || fallbackResponse.statusText}`);
            aiResult = JSON.parse(fallbackData.choices[0].message.content);
        } else {
            if (response.status === 401) throw new Error("APIキーが間違っています。「データ設定」から正しいキーを入力してください。");
            if (response.status === 429) throw new Error("APIの利用上限に達しています。残高を確認してください。");
            throw new Error(`AI通信エラー: ${data.error?.message || response.statusText}`);
        }
      } else {
        if (!data.choices || data.choices.length === 0) {
          throw new Error("AIから正しい形式の回答が返ってきませんでした。");
        }
        aiResult = JSON.parse(data.choices[0].message.content);
      }

      setAnalysisStep('シミュレーション結果のコンパイル中...');
      setAnalysisProgress(90);

      if (aiResult) {
        const simResult = runRealisticSimulation(aiResult.seasonality);
        const simData = simResult.chartData;
        
        const finalSales = simResult.finalSales;
        const actualMultiple = (finalSales / currentSales).toFixed(1);
        
        const priceStr = aiResult.quantitativeData?.price || "";
        const aovMatch = priceStr.match(/[0-9,]+/);
        const aov = aovMatch ? parseInt(aovMatch[0].replace(/,/g, '')) : 5000;
        
        const currentCvr = 0.012; 
        const currentTraffic = Math.round(currentSales / (aov * currentCvr));
        
        setAnalysisResult({
          ...aiResult,
          proposedSolutions: [
            `【目標】1年後に月間アクセス数を約${Math.round(currentTraffic * Math.sqrt(actualMultiple)).toLocaleString()}に引き上げ、売上${actualMultiple}倍(${finalSales.toLocaleString()}円)の着地を目指す`,
            ...aiResult.proposedSolutions
          ],
          simulationData: simData,
          displaySimCount: simResult.displaySimCount,
          finalSales: finalSales,
          genreTargetSales: simResult.genreTargetSales
        });
        setAnalysisProgress(100);
        
        setTimeout(() => {
          setActiveTab('result');
          setIsAnalyzing(false);
        }, 500);
      } else {
        setIsAnalyzing(false);
      }

    } catch (error) {
      console.error(error);
      setUiError(`${error.message}`);
      setIsAnalyzing(false);
    } 
  };

  const handleGeneratePptx = async () => {
    if (!analysisResult) return;
    setPptxError('');
    setIsGeneratingPptx(true);
    try {
      await generatePptx(analysisResult, formData, genreStats, formatCurrency, getGenreInsight);
    } catch (e) {
      console.error(e);
      setPptxError(`資料の生成に失敗しました: ${e.message}`);
    } finally {
      setIsGeneratingPptx(false);
    }
  };

  const handleGenerateSimulation = () => {
    setIsGeneratingSim(true);
    setTimeout(() => {
      setIsGeneratingSim(false);
      setShowSimulation(true);
       setTimeout(() => {
      document.querySelector('[data-simulation-section]')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
    }, 2500); 
  };

const handleExportCSV = () => {
  if (!analysisResult) return;
  setIsExportingCSV(true);
  setTimeout(() => {
    const enhancedCosts = {
      ...operatingCosts,
      aov: kpiData.initialAOV  // ✅ この行を追加
    };
    const scenarioData = generateMultiScenarioData(
      analysisResult.simulationData, 
      enhancedCosts,  // ✅ operatingCosts → enhancedCosts に変更
      calculateProfitMargin
    );
    handleDownloadCSV(analysisResult, formData, enhancedCosts, scenarioData, calculateProfitMargin);
    setIsExportingCSV(false);
  }, 500);
};

  const formatCurrency = (value) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);

  const selectedGenreName = genres.find(g => g.id === formData.genre)?.name;

  // 【新機能UI】ROI分析セクション
  const renderROIAnalysis = (currentSales, finalSales) => {
    const currentProfit = calculateProfitMargin(currentSales, operatingCosts, 'mid');
    const projectedProfit = calculateProfitMargin(finalSales, operatingCosts, 'mid');

    // 【修正】数値をそのまま計算して渡すように変更
    const currentROI = currentProfit.adSpend > 0 ? {
      roi: (currentProfit.netProfit / currentProfit.adSpend) * 100,
      roasMultiplier: currentProfit.sales / currentProfit.adSpend
    } : null;

    const projectedROI = projectedProfit.adSpend > 0 ? {
      roi: (projectedProfit.netProfit / projectedProfit.adSpend) * 100,
      roasMultiplier: projectedProfit.sales / projectedProfit.adSpend
    } : null;
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200 shadow-lg mb-8">
        <h4 className="text-2xl font-black mb-8 flex items-center gap-3 text-blue-700">
          <TrendingUp className="w-8 h-8" /> ROI / ROAS 分析
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl border border-blue-200">
            <p className="text-sm font-bold text-slate-500 mb-4">📊 現在のROI</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-blue-100">
                <span className="font-bold text-slate-600">広告費</span>
                <span className="font-black text-slate-800">
                  {formatCurrency(currentProfit.adSpend)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-blue-100">
                <span className="font-bold text-slate-600">純利益</span>
                <span className={`font-black ${currentProfit.netProfit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(currentProfit.netProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg mt-4">
                <span className="font-black text-blue-700">ROI</span>
                <span className={`text-2xl font-black ${currentROI?.roi > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {currentROI ? `${currentROI.roi.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-indigo-50 px-4 rounded-lg">
                <span className="font-black text-indigo-700">ROAS</span>
                <span className="text-2xl font-black text-indigo-600">
                  {currentROI ? `${currentROI.roasMultiplier.toFixed(2)}x` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-md">
            <p className="text-sm font-bold text-slate-500 mb-4">🎯 目標達成時のROI</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-emerald-100">
                <span className="font-bold text-slate-600">広告費</span>
                <span className="font-black text-slate-800">
                  {formatCurrency(projectedProfit.adSpend)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-emerald-100">
                <span className="font-bold text-slate-600">純利益</span>
                <span className="font-black text-emerald-600">
                  +{formatCurrency(projectedProfit.netProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-emerald-50 px-4 rounded-lg mt-4">
                <span className="font-black text-emerald-700">ROI</span>
                <span className="text-2xl font-black text-emerald-600">
                  {projectedROI ? `${projectedROI.roi.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-teal-50 px-4 rounded-lg">
                <span className="font-black text-teal-700">ROAS</span>
                <span className="text-2xl font-black text-teal-600">
                  {projectedROI ? `${projectedROI.roasMultiplier.toFixed(2)}x` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {projectedROI && currentROI && (
          <div className="mt-8 p-6 bg-white border-l-4 border-emerald-500 rounded-lg">
            <p className="text-sm font-bold text-slate-500 mb-3">📈 ROI改善度</p>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-3xl font-black text-emerald-600">
                  +{(projectedROI.roi - currentROI.roi).toFixed(1)}%
                </span>
                <p className="text-sm font-bold text-slate-500 mt-2">ROI上昇幅</p>
              </div>
              <div className="text-slate-300">|</div>
              <div>
                <span className="text-3xl font-black text-teal-600">
                  {((projectedROI.roasMultiplier / currentROI.roasMultiplier - 1) * 100).toFixed(0)}%
                </span>
                <p className="text-sm font-bold text-slate-500 mt-2">ROAS倍率改善</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 【新機能UI】損益分岐点分析セクション
  const renderBreakEvenAnalysis = (breakEvenData) => {
    if (!breakEvenData) {
      return (
        <div className="bg-amber-50 p-8 rounded-2xl border-2 border-dashed border-amber-300 mb-8">
          <p className="text-center font-bold text-amber-800">
            ⚠️ 12ヶ月以内に黒字化しない予測結果です。経営費用の見直しをご検討ください。
          </p>
        </div>
      );
    }

    const months = breakEvenData.breakEvenMonth;
    const weeks = Math.ceil(breakEvenData.breakEvenDay / 7);

    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-300 shadow-lg mb-8">
        <h4 className="text-2xl font-black mb-8 flex items-center gap-3 text-emerald-700">
          <CheckCircle2 className="w-8 h-8" /> 損益分岐点分析
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">黒字化月数</p>
            <p className="text-5xl font-black text-emerald-600">{months}</p>
            <p className="text-sm font-bold text-slate-500 mt-3">ヶ月目</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">黒字化���数</p>
            <p className="text-5xl font-black text-teal-600">{weeks}</p>
            <p className="text-sm font-bold text-slate-500 mt-3">週目</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">黒字化売上</p>
            <p className="text-4xl font-black text-slate-800">{formatCurrency(breakEvenData.sales)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">黒字化日付</p>
            <p className="text-3xl font-black text-slate-700">{breakEvenData.dateStr}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white border-l-4 border-emerald-500 rounded-lg">
          <p className="text-sm font-bold text-slate-600">
            ✓ 施策実行より <span className="text-emerald-600 font-black">{months}ヶ月</span> で黒字化が見込まれます。初期投資の回収期間を短縮できる見通しです。
          </p>
        </div>
      </div>
    );
  };

  // 【新機能UI】複数シナリオ比較チャート
  const renderMultiScenarioChart = (scenarioData) => {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg mb-8">
        <h4 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-800">
          <TrendingUp className="w-8 h-8 text-slate-600" /> 複数シナリオ比較：利益推移
        </h4>

        <div className="w-full h-[500px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scenarioData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0"/>
              
              <XAxis 
                dataKey="dateStr" 
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                tickLine={false}
                tick={{ fontSize: 13, fontWeight: 'bold', fill: '#64748b' }}
                dy={15}
                interval={29}
                tickFormatter={(tick) => tick.split('/')[0] + '月'}
              />

              <YAxis 
                domain={['auto', 'auto']}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                tickLine={false}
                tick={{ fontSize: 13, fontWeight: 'bold', fill: '#64748b' }}
                tickFormatter={(value) => `${Math.round(value / 10000)}万円`}
                width={80}
              />

              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200">
                        <p className="text-sm font-bold text-slate-600 mb-3">{data.dateStr}</p>
                        <div className="space-y-2">
                          <div><span className="text-xs font-bold text-red-500">最小シナリオ: </span><span className="font-black text-red-600">{formatCurrency(data.minProfit)}</span></div>
                          <div><span className="text-xs font-bold text-[#26A69A]">中位シナリオ: </span><span className="font-black text-[#26A69A]">{formatCurrency(data.midProfit)}</span></div>
                          <div><span className="text-xs font-bold text-emerald-600">最大シナリオ: </span><span className="font-black text-emerald-600">{formatCurrency(data.maxProfit)}</span></div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend 
                verticalAlign="top"
                content={() => (
                  <div className="flex flex-wrap justify-center gap-8 pb-4 font-bold">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 bg-red-400 rounded"></span>
                      <span className="text-slate-700">最小シナリオ（広告費 {operatingCosts.adSpendMinPercent}%）</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 bg-[#4ECDC4] rounded"></span>
                      <span className="text-slate-700">中位シナリオ（広告費 {((operatingCosts.adSpendMinPercent + operatingCosts.adSpendMaxPercent) / 2).toFixed(1)}%）</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 bg-emerald-500 rounded"></span>
                      <span className="text-slate-700">最大シナリオ（広告費 {operatingCosts.adSpendMaxPercent}%）</span>
                    </div>
                  </div>
                )}
              />

              <Area type="linear" dataKey="minProfit" name="" stroke="none" fill="url(#minGrad)"/>
              <Area type="linear" dataKey="midProfit" name="" stroke="none" fill="url(#midGrad)"/>
              <Area type="linear" dataKey="maxProfit" name="" stroke="none" fill="url(#maxGrad)"/>

              <Line type="linear" dataKey="minProfit" name="" stroke="#ef4444" strokeWidth={2} dot={false}/>
              <Line type="linear" dataKey="midProfit" name="" stroke="#26A69A" strokeWidth={3} dot={false}/>
              <Line type="linear" dataKey="maxProfit" name="" stroke="#10b981" strokeWidth={2} dot={false}/>

              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" strokeWidth={2}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs font-bold text-red-600 mb-2">最小シナリオ</p>
            <p className="text-sm font-bold text-slate-700">積極的な広告投下を抑えた保守的なシナリオ</p>
          </div>
          <div className="p-4 bg-[#E0F2F1] rounded-lg border border-[#B2DFDB]">
            <p className="text-xs font-bold text-[#26A69A] mb-2">中位シナリオ</p>
            <p className="text-sm font-bold text-slate-700">バランスの取れた施策実行シナリオ（推奨）</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs font-bold text-emerald-600 mb-2">最大シナリオ</p>
            <p className="text-sm font-bold text-slate-700">最大限の広告投下による攻撃的なシナリオ</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {!isLoggedIn ? (
        <div className="w-full min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans overflow-y-auto">
          <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
            <div className="bg-gradient-to-br from-[#4ECDC4] to-[#26A69A] p-10 md:p-14 text-white flex flex-col justify-center">
              <TrendingUp className="w-14 h-14 mb-8 opacity-90" />
              <h1 className="text-4xl font-black mb-8 leading-tight tracking-tight">PureFlat AI<br/>Simulator</h1>
              <div className="space-y-6 opacity-90">
                <div className="flex gap-4 items-start">
                  <Database className="w-6 h-6 shrink-0 mt-1" />
                  <p className="text-sm md:text-base font-medium leading-relaxed">弊社の過去の支援実績データベースを活用。実際のデータ変動率に基づいた妥当性の高いシミュレーションを算出します。</p>
                </div>
                <div className="flex gap-4 items-start">
                  <Search className="w-6 h-6 shrink-0 mt-1" />
                  <p className="text-sm md:text-base font-medium leading-relaxed">商品や店舗トップページのURLを入力するだけで、AIが複雑な構造から正確に情報を抽出し、現状の課題と施策を提示します。</p>
                </div>
              </div>
              <p className="mt-12 text-xs font-bold opacity-60">© 株式会社ピュアフラット 営業部</p>
            </div>
            <div className="p-10 md:p-16 flex flex-col justify-center bg-slate-50">
              <h2 className="text-3xl font-black text-slate-800 mb-4 text-center md:text-left">社内システム ログイン</h2>
              <p className="text-slate-500 font-medium mb-10 text-center md:text-left text-sm">ツールを利用するためのパスワードを入力してください</p>
              <form onSubmit={handleLogin} className="space-y-6 w-full max-w-md mx-auto md:mx-0">
                {loginError && <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-200">{loginError}</div>}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">パスワード</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none text-lg font-medium shadow-sm transition-all"
                      placeholder="pureflat1234"
                    />
                  </div>
                </div>
                <button className="w-full py-4 mt-4 bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] text-white font-bold text-lg rounded-2xl shadow-lg hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  ログインしてツールを開始
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="w-full bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] px-6 md:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <TrendingUp className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">PureFlat AI Simulator</h1>
                <p className="text-xs font-bold text-teal-100">EC売上予測・解析ツール (リアル解析Ver.)</p>
              </div>
            </div>
            <nav className="flex items-center bg-black/15 p-1.5 rounded-xl overflow-x-auto w-full sm:w-auto">
              <button onClick={() => {setActiveTab('simulate'); setShowSimulation(false);}} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'simulate' ? 'bg-white text-[#26A69A] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>新規シミュレーション</button>
              <button onClick={() => {setActiveTab('settings'); setShowSimulation(false);}} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-white text-[#26A69A] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}><Settings className="w-4 h-4" /> データ設定</button>
              {analysisResult && <button onClick={() => setActiveTab('result')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'result' ? 'bg-white text-[#26A69A] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}><Activity className="w-4 h-4" /> 解析・予測結果</button>}
              <div className="w-px h-6 bg-white/20 mx-2"></div>
              <button onClick={() => setIsLoggedIn(false)} className="px-5 py-2.5 text-sm font-bold text-white/70 hover:text-red-300 hover:bg-white/10 transition-all flex items-center gap-2"><LogOut className="w-4 h-4" /> ログアウト</button>
            </nav>
          </header>

          <main className="flex-grow p-4 md:p-8 lg:p-12 w-full max-w-[1600px] mx-auto relative">
            
            {isGeneratingSim && (
              <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 transition-opacity duration-500">
                <Calculator className="w-20 h-20 text-[#4ECDC4] mb-8 animate-bounce" />
                <h3 className="text-3xl font-black text-white mb-4 tracking-widest animate-pulse">モデル演算中...</h3>
                <p className="text-teal-200 font-bold text-xl text-center">抽出された課題・施策データと、弊社のジャンル別支援実績をクロス分析し、<br/>最適化された1年後の売上推移をモデリングしています。</p>
                <div className="w-64 h-2 bg-slate-800 rounded-full mt-10 overflow-hidden">
                  <div className="h-full bg-[#4ECDC4] animate-[progress_2s_ease-in-out_forwards]"></div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-[#26A69A]"><Settings className="w-6 h-6" /> API設定</h2>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">APIキー (OpenAI または GitHub)</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none text-lg font-medium transition-all" />
                  </div>
                </div>

                {/* 【新機能】初月KPI入力セクション */}
                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
                  <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-[#26A69A]"><Database className="w-6 h-6" /> 初月の営業KPI設定</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">月間アクセス数</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          name="initialTraffic"
                          value={kpiData.initialTraffic}
                          onChange={handleKPIChange}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-black text-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">平均客単価 (AOV)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
                        <input
                          type="number"
                          name="initialAOV"
                          value={kpiData.initialAOV}
                          onChange={handleKPIChange}
                          className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-black text-lg text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">転換率 (CVR)</label>
                      <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                        <input
                          type="number"
                          step="0.001"
                          name="initialCVR"
                          value={(kpiData.initialCVR * 100).toFixed(2)}
                          onChange={handleKPIChange}
                          className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-black text-lg text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 売上分解式の表示 */}
                  <div className="bg-gradient-to-r from-[#E0F2F1] to-[#F0FFFE] p-6 rounded-2xl border border-[#B2DFDB] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-slate-500 mb-2">📊 売上分解式</p>
                      <div className="flex flex-col md:flex-row items-center gap-3 text-lg font-black text-slate-700">
                        <span>{kpiData.initialTraffic.toLocaleString()}</span>
                        <span className="text-slate-300">×</span>
                        <span className="text-[#26A69A]">{kpiData.initialAOV.toLocaleString()}円</span>
                        <span className="text-slate-300">×</span>
                        <span className="text-[#26A69A]">{(kpiData.initialCVR * 100).toFixed(2)}%</span>
                        <span className="text-slate-300">=</span>
                        <span className="text-3xl text-[#26A69A] font-black">
                          {formatCurrency(calculateSalesDecomposition(kpiData.initialTraffic, kpiData.initialAOV, kpiData.initialCVR))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 【新機能】運営費用設定セクション */}
                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
                  <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-pink-600"><Calculator className="w-6 h-6" /> 運営費用・経費設定</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50">
                      <p className="text-sm font-bold text-slate-600 mb-6 flex items-center gap-2">💰 広告支出額（売上対比%）</p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block">最小値（保守的シナリオ）</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              name="adSpendMinPercent"
                              value={operatingCosts.adSpendMinPercent}
                              onChange={handleOperatingCostsChange}
                              className="w-full pl-4 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none font-bold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block">最大値（積極的シナリオ）</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              name="adSpendMaxPercent"
                              value={operatingCosts.adSpendMaxPercent}
                              onChange={handleOperatingCostsChange}
                              className="w-full pl-4 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none font-bold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50">
                      <p className="text-sm font-bold text-slate-600 mb-6 flex items-center gap-2">📦 変動費</p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block">送料/1件</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                            <input
                              type="number"
                              name="shippingCost"
                              value={operatingCosts.shippingCost}
                              onChange={handleOperatingCostsChange}
                              className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none font-bold text-right"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block">取扱手数料/売上</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              name="platformFeePercent"
                              value={operatingCosts.platformFeePercent}
                              onChange={handleOperatingCostsChange}
                              className="w-full pl-4 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none font-bold text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 border border-slate-200 p-6 rounded-2xl bg-slate-50">
                      <p className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">🏢 固定運営費/月</p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                        <input
                          type="number"
                          name="operationalCostFixed"
                          value={operatingCosts.operationalCostFixed}
                          onChange={handleOperatingCostsChange}
                          className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none font-bold text-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-[#26A69A]"><FileSpreadsheet className="w-6 h-6" /> RMS過去実績データ取込</h2>
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <Database className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{csvStatus}</span>
                  </div>
                  <div className="p-12 border-2 border-dashed border-[#4ECDC4]/50 rounded-3xl text-center cursor-pointer hover:bg-[#E0F2F1]/30 transition-all bg-slate-50/50" onClick={() => fileInputRef.current.click()}>
                    <Upload className="w-12 h-12 text-[#4ECDC4] mx-auto mb-4" />
                    <p className="text-base font-black text-slate-700">最新のCSVファイルを選択してアップロード</p>
                    <p className="text-sm font-bold text-slate-400 mt-2">※ジャンルや実績データが自動でアップデートされます</p>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'simulate' && (
              <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8">
                    <div className="relative w-24 h-24 mb-8">
                      <div className="absolute inset-0 border-4 border-[#E0F2F1] rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-[#4ECDC4] rounded-full border-t-transparent animate-spin"></div>
                      <Search className="absolute inset-0 m-auto w-10 h-10 text-[#26A69A] animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">データドリブン高精度解析 実行中</h3>
                    <p className="text-[#26A69A] font-bold text-lg text-center h-8 transition-all">{analysisStep}</p>
                    
                    <div className="w-full max-w-md mt-10">
                      <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                        <span>進捗状況</span>
                        <span>{analysisProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${analysisProgress}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="mt-8 space-y-3 w-full max-w-md">
                      <div className={`flex items-center gap-3 text-sm font-bold ${analysisProgress >= 20 ? 'text-[#26A69A]' : 'text-slate-300'}`}><CheckCircle className="w-4 h-4" /> ページ内全テキストデータの取得</div>
                      <div className={`flex items-center gap-3 text-sm font-bold ${analysisProgress >= 50 ? 'text-[#26A69A]' : 'text-slate-300'}`}><CheckCircle className="w-4 h-4" /> ノイズ除外と重要数値（価格/レビュー等）の特定</div>
                      <div className={`flex items-center gap-3 text-sm font-bold ${analysisProgress >= 75 ? 'text-[#26A69A]' : 'text-slate-300'}`}><CheckCircle className="w-4 h-4" /> 数値根拠に基づく課題・要因分析の実行</div>
                      <div className={`flex items-center gap-3 text-sm font-bold ${analysisProgress >= 90 ? 'text-[#26A69A]' : 'text-slate-300'}`}><CheckCircle className="w-4 h-4" /> レポートのコンパイル</div>
                    </div>
                  </div>
                )}

                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">AI 解析シミュレーション</h2>
                  <p className="text-slate-500 font-bold mt-3 text-sm md:text-base">商品ページまたは店舗トップページのURLから現状を抽出し、改善予測を立てます</p>
                </div>
                
                {uiError && <div className="mb-8 text-red-600 text-sm font-bold bg-red-50 p-5 rounded-2xl border border-red-200 flex items-center gap-3"><AlertCircle className="w-5 h-5 flex-shrink-0" />{uiError}</div>}
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">対象企業名 / 店舗名</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="株式会社サンプル" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-bold text-lg transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">商品ジャンル</label>
                      <select name="genre" value={formData.genre} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-bold text-lg appearance-none transition-all cursor-pointer">
                        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">現在の月商（目安）</label>
                    <div className="relative">
                      <input type="number" name="currentMonthlySales" value={formData.currentMonthlySales} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-black text-xl text-right pr-12 transition-all text-slate-800" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">円</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">解析対象のページURL (商品 or 店舗) <span className="text-pink-500">*</span></label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="url" name="productUrl" value={formData.productUrl} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-medium text-base transition-all" placeholder="https://item.rakuten.co.jp/... または https://www.rakuten.ne.jp/..." />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-slate-400" />事前ヒアリング情報・商品の特徴など</span>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg tracking-wider">任意</span>
                    </label>
                    <textarea 
                      name="hearingDetails" 
                      value={formData.hearingDetails} 
                      onChange={handleInputChange} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4ECDC4] outline-none font-medium text-sm md:text-base transition-all resize-none h-32 leading-relaxed" 
                      placeholder="例: リピート率は高いが新規獲得に苦戦している。&#13;&#10;客単価を上げるためのセット販売を強化したい。など" 
                    />
                  </div>

                  <button 
                    onClick={handleSimulate} disabled={isAnalyzing || !formData.productUrl}
                    className="w-full py-6 bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-xl mt-4 flex items-center justify-center gap-3"
                  >
                    <Search className="w-6 h-6" /> ページ解析を開始
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'result' && analysisResult && (
              <div className="w-full animate-in fade-in duration-700">
                
                {!showSimulation && (
                  <div className="space-y-8 slide-in-from-bottom-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <h2 className="text-2xl md:text-4xl font-black flex items-center gap-4 text-slate-800 tracking-tight"><Search className="text-[#26A69A] w-8 h-8 md:w-10 md:h-10" /> ページ課題・施策レポート</h2>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleGeneratePptx}
                          disabled={isGeneratingPptx}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 text-sm"
                        >
                          {isGeneratingPptx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                          {isGeneratingPptx ? '生成中...' : '提案資料を自動生成 (.pptx)'}
                        </button>
                        <button onClick={() => setActiveTab('simulate')} className="text-slate-500 bg-slate-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 hover:text-slate-800 transition-colors border border-slate-200"><ArrowLeft className="w-5 h-5" /> 条件入力に戻る</button>
                      </div>
                    </div>
                    {pptxError && <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-2xl border border-red-200 flex items-center gap-3"><AlertCircle className="w-5 h-5 flex-shrink-0" />{pptxError}</div>}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">抽出された定量データ</h3>
                        <div className="flex items-center gap-6 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <div className="bg-amber-100 p-4 rounded-full text-amber-500 shadow-inner"><Star className="w-10 h-10 fill-current" /></div>
                          <div><p className="text-sm font-bold text-slate-500 mb-1">平均評価</p><p className="text-5xl font-black text-slate-800">{analysisResult.quantitativeData.averageRating}</p></div>
                        </div>
                        <div className="space-y-6 text-base font-bold flex-grow">
                          {Object.entries(analysisResult.quantitativeData).map(([key, val]) => key !== 'averageRating' && (
                            <div key={key} className="flex justify-between items-center border-b border-slate-100 pb-4">
                              <span className="text-slate-500">{key === 'price' ? '価格帯' : key === 'reviews' ? 'レビュー数' : key === 'images' ? '画像・バナー数' : '特典・送料'}</span>
                              <span className={`text-right ${key === 'coupon' ? 'text-pink-500' : 'text-slate-800 text-lg'}`}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">現状分析・ステータス</h3>
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl text-slate-700 font-bold leading-loose border border-slate-200 text-lg">
                          {analysisResult.productInfo}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                          <div className="bg-emerald-50/80 p-6 rounded-3xl border border-emerald-200 shadow-sm">
                            <h4 className="flex items-center gap-3 font-black text-emerald-700 mb-5 text-xl"><ThumbsUp className="w-6 h-6" /> 良い点（数値根拠）</h4>
                            <ul className="space-y-4">
                              {analysisResult.currentStatus.good.map((t, i) => <li key={i} className="flex gap-3 text-base font-bold text-slate-700 leading-relaxed"><span className="text-emerald-500 mt-1">●</span>{t}</li>)}
                            </ul>
                          </div>
                          <div className="bg-pink-50/80 p-6 rounded-3xl border border-pink-200 shadow-sm">
                            <h4 className="flex items-center gap-3 font-black text-pink-700 mb-5 text-xl"><ThumbsDown className="w-6 h-6" /> 改善点（数値根拠）</h4>
                            <ul className="space-y-4">
                              {analysisResult.currentStatus.bad.map((t, i) => <li key={i} className="flex gap-3 text-base font-bold text-slate-700 leading-relaxed"><span className="text-pink-500 mt-1">●</span>{t}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 md:p-10 rounded-[2rem] border-t-8 border-pink-400 shadow-lg">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-pink-600"><AlertCircle className="w-8 h-8" /> 定量的な課題</h3>
                        <div className="space-y-4">
                          {analysisResult.currentIssues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-4 text-base p-5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl font-bold text-slate-700 border border-slate-200">
                              <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                              <span className="leading-relaxed pt-1">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white p-8 md:p-10 rounded-[2rem] border-t-8 border-[#4ECDC4] shadow-lg flex flex-col justify-between">
                        <div>
                          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-[#26A69A]"><CheckCircle2 className="w-8 h-8" /> 具体的な改善アクション</h3>
                          <div className="space-y-4 mb-8">
                            {analysisResult.proposedSolutions.map((sol, i) => (
                              <div key={i} className="flex items-start gap-4 text-base p-5 bg-[#E0F2F1]/40 hover:bg-[#E0F2F1]/70 transition-colors rounded-2xl font-bold text-slate-800 border border-[#B2DFDB]/60">
                                <ChevronRight className="w-6 h-6 text-[#26A69A] flex-shrink-0 mt-1" />
                                <span className="leading-relaxed pt-1">{sol}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center pt-8 pb-12">
                      <button 
                        onClick={handleGenerateSimulation}
                        className="group relative inline-flex items-center justify-center px-12 py-8 text-2xl font-black text-white transition-all duration-300 ease-in-out bg-slate-800 border border-slate-700 rounded-[2rem] shadow-2xl hover:scale-105 hover:shadow-[#4ECDC4]/50 focus:outline-none overflow-hidden"
                      >
                        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                        <span className="absolute inset-0 w-full h-full transition-all duration-500 ease-out transform translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[100%]"></span>
                        <span className="relative flex items-center gap-4">
                          <TrendingUp className="w-10 h-10 text-[#4ECDC4]" /> 
                          改善施策実行時の売上シミュレーションを算出する
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {showSimulation && (
                  <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl overflow-hidden relative border border-slate-100 slide-in-from-bottom-8"
                      data-simulation-section  // ← スクロール対象マーク
  >                
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E0F2F1] to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                    
                    <div className="mb-6 z-10 relative">
                      <button onClick={() => setShowSimulation(false)} className="text-slate-400 font-bold flex items-center gap-2 hover:text-[#26A69A] transition-colors"><ArrowLeft className="w-4 h-4" /> 課題・施策レポートに戻る</button>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 relative z-10">
                      <div>
                        <h3 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4"><TrendingUp className="w-10 h-10 text-[#26A69A]" /> 1年後の売上予測シミュレーション</h3>
                        <p className="text-base font-bold text-slate-500 mt-4 flex items-center gap-3">
                          <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-600">※モンテカルロ法による1,000回のシミュレーション試行軌跡と予測中央値</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-4">
                        <button
                          onClick={handleGeneratePptx}
                          disabled={isGeneratingPptx}
                          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:translate-y-0 text-base"
                        >
                          {isGeneratingPptx ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                          {isGeneratingPptx ? '提案資料を生成中...' : '提案資料を自動生成 (.pptx)'}
                        </button>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 w-full lg:w-auto text-center lg:text-right shadow-md">
                          <p className="text-sm font-black text-slate-400 mb-2 uppercase tracking-widest">1年後の着地予測月商</p>
                          <p className="text-5xl md:text-6xl font-black text-[#26A69A] tracking-tighter">{formatCurrency(analysisResult.finalSales)}</p>
                          <p className="text-sm font-bold text-slate-500 mt-3 bg-slate-50 inline-block px-4 py-2 rounded-xl border border-slate-100">
                            現状からの純増額: <span className="text-[#26A69A] ml-1">+{formatCurrency(analysisResult.finalSales - Number(formData.currentMonthlySales))}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 relative z-10">
                      {(() => {
                        const currentSales = Number(formData.currentMonthlySales);
                        const milestones = {};
                        
                        for (const month of [3, 6, 9, 12]) {
                          const targetDay = month * 30;
                          const dataPoint = analysisResult.simulationData.find(d => d.dayIndex === targetDay) || 
                                           analysisResult.simulationData[Math.min(targetDay, analysisResult.simulationData.length - 1)];
                          
                          if (dataPoint) {
                            const supportValue = dataPoint.supportScenario;
                            const growth = ((supportValue - currentSales) / currentSales) * 100;
                            milestones[month] = {
                              sales: supportValue,
                              growth: growth,
                              dateStr: dataPoint.dateStr,
                              dayIndex: dataPoint.dayIndex
                            };
                          }
                        }
                        
                        return [3, 6, 9, 12].map(month => {
                          const milestone = milestones[month];
                          if (!milestone) return null;
                          
                          const isTarget = month === 12;
                          
                          return (
                            <div
                              key={month}
                              className={`p-6 rounded-2xl border-2 transition-all ${
                                isTarget
                                  ? 'bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] border-[#4ECDC4] shadow-lg scale-105'
                                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <span className={`text-lg font-black ${isTarget ? 'text-[#26A69A]' : 'text-slate-400'}`}>
                                  {month}ヶ月
                                </span>
                                {isTarget && <Star className="w-5 h-5 text-[#4ECDC4] fill-current" />}
                              </div>
                              
                              <div className="mb-4 pb-4 border-b-2 border-slate-100">
                                <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">月商予測</p>
                                <p className={`text-3xl font-black ${isTarget ? 'text-[#26A69A]' : 'text-slate-700'}`}>
                                  {formatCurrency(milestone.sales)}
                                </p>
                              </div>
                              
                              <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-black ${
                                  milestone.growth > 0 ? 'text-emerald-600' : 'text-slate-400'
                                }`}>
                                  {milestone.growth > 0 ? '+' : ''}{milestone.growth.toFixed(1)}%
                                </span>
                                <span className="text-xs font-bold text-slate-400">前月比</span>
                              </div>
                              
                              {isTarget && (
                                <div className="mt-4 pt-4 border-t-2 border-[#4ECDC4]/30 text-center">
                                  <p className="text-xs font-black text-[#26A69A] uppercase tracking-wider">目標達成地点</p>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* 🆕 ROI/ROAS分析セクション */}
                    {renderROIAnalysis(Number(formData.currentMonthlySales), analysisResult.finalSales)}

                    {/* 🆕 損益分岐点分析セクション */}
                    {renderBreakEvenAnalysis(calculateBreakEvenMonth(analysisResult.simulationData, operatingCosts, formData, calculateProfitMargin))}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 relative z-10">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="text-sm font-black text-slate-400 mb-4 flex items-center gap-2"><Database className="w-4 h-4" /> 弊社支援実績に基づく市場データ（{selectedGenreName}）</h4>
                        <div className="flex-grow flex flex-col gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="inline-block px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-black rounded mb-2">ピュアフラット ジャンル別支援実績</span>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                              {getGenreInsight(selectedGenreName)}
                            </p>
                          </div>
                          {analysisResult.simulationContext?.genreTrendAnalysis && (
                            <p className="text-sm font-bold text-slate-500 leading-relaxed"><span className="text-[#26A69A] mr-1">AI個別見解:</span>{analysisResult.simulationContext.genreTrendAnalysis}</p>
                          )}
                          <div className="grid grid-cols-2 gap-3 mt-auto">
                            <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="text-[10px] font-bold text-slate-400">平均月次成長率</p>
                              <p className="text-lg font-black text-slate-700">{((genreStats[formData.genre]?.mean || 1.03) * 100 - 100).toFixed(1)}%</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="text-[10px] font-bold text-slate-400">ボラティリティ</p>
                              <p className="text-lg font-black text-slate-700">{(genreStats[formData.genre]?.stdDev || 0.15).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                        <h4 className="text-sm font-black text-emerald-600 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 上昇要因（アップサイド）</h4>
                        <ul className="space-y-3">
                          {analysisResult.simulationContext?.upsideFactors?.map((factor, i) => (
                             <li key={i} className="text-sm font-bold text-emerald-800 flex items-start gap-2"><span className="text-emerald-500 mt-1">●</span><span className="leading-snug">{factor}</span></li>
                          )) || <li className="text-sm font-bold text-emerald-800">施策実行によるCVR改善</li>}
                          <li className="text-sm font-bold text-emerald-800 flex items-start gap-2"><span className="text-emerald-500 mt-1">●</span><span className="leading-snug">大型セール（3,6,9,12月）でのトラフィック急増</span></li>
                        </ul>
                      </div>

                      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-black text-slate-500 mb-4 flex items-center gap-2"><TrendingDown className="w-4 h-4" /> 停滞・下落要因（ダウンサイド）</h4>
                        <ul className="space-y-3">
                          {analysisResult.simulationContext?.downsideFactors?.map((factor, i) => (
                             <li key={i} className="text-sm font-bold text-slate-600 flex items-start gap-2"><span className="text-slate-400 mt-1">●</span><span className="leading-snug">{factor}</span></li>
                          )) || <li className="text-sm font-bold text-slate-600">現状の課題放置による機会損失</li>}
                          <li className="text-sm font-bold text-slate-600 flex items-start gap-2"><span className="text-slate-400 mt-1">●</span><span className="leading-snug">セール直後の反動減と閑散期トレンド</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* 🆕 複数シナリオ比較チャート */}
                    {(() => {
                      const scenarioData = generateMultiScenarioData(analysisResult.simulationData, operatingCosts, calculateProfitMargin);
                      return renderMultiScenarioChart(scenarioData);
                    })()}

                    <div className="w-full h-[500px] md:h-[700px] relative z-10 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analysisResult.simulationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.4}/><stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/></linearGradient>
                            <pattern id="salePattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.1" /></pattern>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                           {[3, 6, 9, 12].map(month => {
            const targetDay = month * 30;
            const dataPoint = analysisResult.simulationData[Math.min(targetDay, analysisResult.simulationData.length - 1)];
            return (
              <ReferenceLine
                key={`milestone-${month}`}
                x={dataPoint?.dateStr}
                stroke={month === 12 ? '#4ECDC4' : '#cbd5e1'}
                strokeWidth={month === 12 ? 3 : 1}
                strokeDasharray={month === 12 ? '0' : '4 4'}
                label={{
                  value: `${month}M`,
                  position: 'top',
                  fill: month === 12 ? '#4ECDC4' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            );
          })}
                          {analysisResult.simulationData.filter(d => d.dateStr.endsWith('/1')).map((data, index) => (
                            <ReferenceLine key={`month-${index}`} x={data.dateStr} stroke="#e2e8f0" strokeDasharray="3 3" />
                          ))}

                          <XAxis 
                            dataKey="dateStr" 
                            axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }} 
                            tickLine={false} 
                            tick={{ fontSize: 14, fontWeight: '900', fill: '#64748b' }} 
                            dy={15}
                            interval={29} 
                            tickFormatter={(tick) => tick.split('/')[0] + '月'}
                          />
                          
                          <YAxis 
                            domain={['auto', 'auto']}
                            axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }} 
                            tickLine={false} 
                            tick={{ fontSize: 13, fontWeight: 'bold', fill: '#64748b' }} 
                            tickFormatter={(value) => `${Math.round(value / 10000)}万円`}
                            width={80}
                          />
                          
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const mainPayloads = payload.filter(p => p.name && !p.name.startsWith('sim_'));
                                return (
                                  <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100">
                                    <p className="text-slate-500 font-bold mb-3 border-b border-slate-100 pb-2">{`予測時点: ${label}`}</p>
                                    {mainPayloads.map((entry, index) => (
                                      <div key={index} className="mb-2 last:mb-0" style={{ color: entry.color }}>
                                        <span className="text-xs font-bold mr-2 opacity-80">{entry.name}</span>
                                        <span className="font-black text-[15px]">
                                          {Array.isArray(entry.value) 
                                            ? `${formatCurrency(entry.value[0])} 〜 ${formatCurrency(entry.value[1])}` 
                                            : formatCurrency(entry.value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          
                          <Legend 
                            verticalAlign="top" 
                            content={(props) => {
                              const { payload } = props;
                              const filtered = payload.filter(entry => entry.dataKey && !entry.dataKey.startsWith('sim_'));
                              return (
                                <div className="flex flex-wrap justify-center gap-6 pb-6 font-black text-[15px]">
                                  {filtered.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <span style={{ color: entry.color }}>●</span>
                                      <span className="text-slate-500">{entry.value}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          
                          <Area type="linear" dataKey="supportRange" name="予測範囲帯" stroke="none" fill="url(#areaGrad)" />
                          
                          {Array.from({ length: analysisResult.displaySimCount }).map((_, i) => (
                            <Line 
                              key={`sim-${i}`} 
                              type="linear" 
                              dataKey={`sim_${i}`} 
                              name="" 
                              stroke="#4ECDC4" 
                              strokeWidth={1} 
                              strokeOpacity={0.06} 
                              dot={false} 
                              activeDot={false} 
                              isAnimationActive={false} 
                            />
                          ))}
                          
                          <Line type="linear" dataKey="genreTrendScenario" name="ジャンル平均トレンド (元データ基準)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 5 }} />
                          <Line type="linear" dataKey="noSupportScenario" name="支援なし (現状維持トレンド)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 6" dot={false} activeDot={{ r: 5 }} />
                          <Line type="linear" dataKey="supportScenario" name="支援あり (目標シナリオ)" stroke="#26A69A" strokeWidth={3} dot={false} activeDot={{ r: 7, strokeWidth: 0, fill: '#4ECDC4' }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 mt-10 relative z-10">
                      <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                        <Info className="w-6 h-6 text-[#4ECDC4]" />
                        マイルストーン達成シナリオの詳細
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                          <p className="text-sm font-bold text-slate-500 mb-3">🎯 3ヶ月目: 初期施策の効果測定期</p>
                          <p className="text-base font-bold text-slate-700 leading-relaxed">
                            ページ改善（画像・説明文・クーポン設定）の初期実装により、CVR向上が見られ始める段階。セール連動での効果が徐々に顕在化。
                          </p>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                          <p className="text-sm font-bold text-slate-500 mb-3">📈 6ヶ月目: 施策累積効果の加速期</p>
                          <p className="text-base font-bold text-slate-700 leading-relaxed">
                            リピート購入層の形成と、新規獲得トラフィックの定着で、月商が大きく跳ね上がる。スーパーSALE（6月）の恩恵が大きい。
                          </p>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                          <p className="text-sm font-bold text-slate-500 mb-3">💪 9ヶ月目: 施策フル稼働・ブランド認知の定着期</p>
                          <p className="text-base font-bold text-slate-700 leading-relaxed">
                            口コミ・評価の向上による有機検索流入増加と、セール時期（9月）の恩恵で、売上が着実に成長軌道へ。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] p-5 rounded-xl border border-[#4ECDC4]">
                          <p className="text-sm font-black text-[#26A69A] mb-3 uppercase tracking-wider">🚀 12ヶ月目: 目標達成・持続可能な成長基盤の完成期</p>
                          <p className="text-base font-black text-[#26A69A] leading-relaxed">
                            1年間の施策実行により、基本的なCVRが定着。セール依存度も低下し、平月の売上ベースが上昇。ボーナス時期（12月）での追い込みで年間目標達成。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 🆕 CSVエクスポートボタン */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-10 pb-12 relative z-10">
{/* 🆕 月次売上要素の詳細分解テーブル */}
                    <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-lg mb-10 mt-10 overflow-hidden relative z-10">
                      <h4 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800">
                        <Calculator className="w-8 h-8 text-slate-600" /> 月次売上達成に必要なKPI分解表
                      </h4>

                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl mb-6 border border-slate-200">
                        <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          売上＝シミュレーション算出値（真値）　アクセス・CVRはユーザー入力から近似　客単価＝売上÷購入件数（逆算）　購入件数＝アクセス×CVR
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs md:text-sm border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-[#E0F2F1] to-[#B2DFDB] text-[#26A69A] font-black sticky top-0">
                              <th className="border border-slate-300 px-3 py-3 text-left">月</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">売上</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">アクセス</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">CVR</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">客単価</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">購入件数</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">広告費</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">広告比率<br/>（3～8%）</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">想定CPC</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">ベース<br/>アクセス</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">広告経由<br/>アクセス</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">広告経由<br/>比率</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">送料</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">手数料</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">固定費</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">総経費</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">利益</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">利益率</th>
                              <th className="border border-slate-300 px-3 py-3 text-right">前月比</th>
                                <th className="border border-slate-300 px-3 py-3 text-left">アクセス/CVR軸</th>
                              <th className="border border-slate-300 px-3 py-3 text-left">対応課題</th>
                              <th className="border border-slate-300 px-3 py-3 text-left">施策内容</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const monthlyDetails = augmentMonthlyDetails(
                                analysisResult.simulationData,
                                kpiData,
                                operatingCosts,
                                formData,
                                {}
                              );

                            return monthlyDetails.map((month, idx) => {
                                const isTarget = month.monthIndex === 12;
                                const isGrowing = month.前月比成長率 !== null && month.前月比成長率 > 0;
                                const isProfitable = month.利益 > 0;

                               return (
                                  <tr
                                    key={idx}
                                    className={`font-bold transition-colors ${
                                      isTarget
                                        ? 'bg-gradient-to-r from-[#E0F2F1] to-[#F0FFFE] border-2 border-[#4ECDC4]'
                                        : 'border border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <td className={`border border-slate-300 px-3 py-3 text-center font-black ${isTarget ? 'text-[#26A69A] text-lg' : 'text-slate-700'}`}>
                                      {month.monthIndex}月
                                    </td>
                                    <td className={`border border-slate-300 px-3 py-3 text-right ${isTarget ? 'text-[#26A69A] font-black text-base' : 'text-slate-700'}`}>
                                      {formatCurrency(month.売上)}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-700">
                                      {month.アクセス数.toLocaleString()}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-700">
                                      {Number(month.CVR).toFixed(2)}%
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-700">
                                      {formatCurrency(month.客単価)}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-700 font-black">
                                      {month.購入件数.toLocaleString()}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-pink-600 font-black">
                                      {formatCurrency(month.広告費)}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-pink-600 font-black">
                                      {month.広告比率}%
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-700">
                                      ¥{month.想定CPC}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-emerald-600 font-black">
                                      {month.ベースアクセス.toLocaleString()}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-blue-600 font-black">
                                      {month.広告経由アクセス.toLocaleString()}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-blue-600 font-black">
                                      {(month.広告経由比率 * 100).toFixed(1)}%
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-500">
                                      {formatCurrency(month.送料)}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-500">
                                      {formatCurrency(month.手数料)}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-500">
                                      {formatCurrency(month.固定費)}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-right text-slate-700 font-black">
                                      {formatCurrency(month.総経費)}
                                    </td>
                                    <td className={`border border-slate-300 px-3 py-3 text-right font-black text-base ${
                                      isProfitable ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                                    }`}>
                                      {formatCurrency(month.利益)}
                                    </td>
                                    <td className={`border border-slate-300 px-3 py-3 text-right font-black ${
                                      isProfitable ? 'text-emerald-600' : 'text-red-600'
                                    }`}>
                                      {month.利益率}%
                                    </td>
                                    <td className={`border border-slate-300 px-3 py-3 text-right font-black ${
                                      month.前月比成長率 === null ? 'text-slate-300' : isGrowing ? 'text-emerald-600' : 'text-red-600'
                                    }`}>
                                      {month.前月比成長率 === null 
                                        ? '—' 
                                        : `${month.前月比成長率 > 0 ? '+' : ''}${(month.前月比成長率 * 100).toFixed(1)}%`}
                                    </td>
                                     <td className="border border-slate-300 px-3 py-3 text-left text-xs font-bold">
                                      {month.monthIndex <= 2 ? '🔹 基盤構築' : month.monthIndex <= 5 ? '🔹 アクセス増' : month.monthIndex <= 9 ? '🔹 CVR向上' : '🔹 LTV最大化'}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-left text-xs font-bold text-slate-600">
                                      {month.monthIndex <= 2
                                        ? 'AIEO属性未整備・在庫切れリスク・CTR低下'
                                        : month.monthIndex <= 5
                                        ? 'サーチ申請未活用・外部流入不足・SALE設計なし'
                                        : month.monthIndex <= 9
                                        ? 'レビュー質・ページ訴求力・回遊設計・ギフト未対応'
                                        : '同梱LTV未設計・LINE刈取フロー未完成・RPP依存'}
                                    </td>
                                    <td className="border border-slate-300 px-3 py-3 text-left text-xs font-bold text-slate-700">
                                      {month.monthIndex <= 2
                                        ? 'AIEO属性100%入力・メイン画像CTR改善・在庫管理徹底'
                                        : month.monthIndex <= 5
                                        ? 'サーチ申請×限定SALE・Meta/TikTok外部流入構築'
                                        : month.monthIndex <= 9
                                        ? 'ページ購入後ストーリー改修・レビュー質化・ギフト対応・回遊バナー'
                                        : 'LINE×ポイントデー刈取・同梱LTVフロー・RPP広告段階的卒業'}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                          <p className="text-sm font-black text-emerald-600 mb-3 uppercase tracking-wider">📊 アクセス成長</p>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">
                            初月から12月にかけて最大80%のアクセス増加を想定。施策実行による自然流入増加+広告投下による拡大
                          </p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                          <p className="text-sm font-black text-blue-600 mb-3 uppercase tracking-wider">🎯 CVR改善</p>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">
                            ページ改善・LTV施策により段階的に改善。初月（入力値）→ 12月（約1.5倍）を目標として推計（CVRは入力値から近似）
                          </p>
                        </div>
                        <div className="bg-pink-50 p-6 rounded-2xl border border-pink-200">
                          <p className="text-sm font-black text-pink-600 mb-3 uppercase tracking-wider">💰 広告費最適化</p>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">
                            初月3%（保守的）から12月8%（攻撃的）へ段階的に増加。ROI・ROAS管理により効率化
                          </p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                          <p className="text-sm font-black text-purple-600 mb-3 uppercase tracking-wider">📈 利益最大化</p>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">
                            固定費・送料・手数料を考慮した実質利益を表示。月次の黒字化タイミングを把握可能
                          </p>
                        </div>
                      </div>
                    </div>
                      <button
                        onClick={handleExportCSV}
                        disabled={isExportingCSV}
                        className="flex-grow flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:translate-y-0 text-lg"
                      >
                        {isExportingCSV ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            エクスポート中...
                          </>
                        ) : (
                          <>
                            <FileDown className="w-6 h-6" />
                            詳細利益予測表をCSV出力
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleGeneratePptx}
                        disabled={isGeneratingPptx}
                        className="flex-grow flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:translate-y-0 text-lg"
                      >
                        {isGeneratingPptx ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <FileDown className="w-6 h-6" />
                            提案資料を自動生成 (.pptx)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
          
          <footer className="w-full bg-white border-t border-slate-200 p-6 text-center text-slate-400 text-sm font-bold mt-auto z-10 relative">
            © 株式会社ピュアフラット 営業部 2026
          </footer>
        </>
      )}
    </div>
  );
}