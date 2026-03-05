import React, { useState, useEffect, useRef } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  Upload, Settings, Play, TrendingUp, AlertCircle, CheckCircle2, 
  FileSpreadsheet, Link as LinkIcon, Search, Building2, ChevronRight, Activity, Database, Star, ThumbsUp, ThumbsDown, ArrowLeft, Lock, User
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

// 御社のベースロジックに基づく1年後の目標月商算出 (シミュレーションのドリフト計算用)
const getTargetSales = (current) => {
  if (current < 10000) return current;
  if (current < 100000) return current + 800000;
  if (current < 1000000) return current * 10;
  if (current < 3000000) return current * 8;
  if (current < 5000000) return current * 6.5;
  if (current < 7000000) return current * 5;
  if (current < 10000000) return current * 3;
  if (current < 30000000) return current * 2.5;
  return current * 2;
};

export default function App() {
  // ★追加：デザイン(Tailwind CSS)を自動で読み込む魔法の処理
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('simulate');
  
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [apiKey, setApiKey] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uiError, setUiError] = useState('');
  
  const [genres, setGenres] = useState([]);
  const [genreStats, setGenreStats] = useState({});
  const [csvStatus, setCsvStatus] = useState('初期データを読み込み中...');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    genre: '',
    productUrl: '',
    currentMonthlySales: 5000000
  });

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
    if (loginPass === 'pureflat1234') {
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

  const runMonteCarloSimulation = (aiSeasonality) => {
    const SIMULATION_COUNT = 1000;
    const currentSales = Number(formData.currentMonthlySales);
    const targetSales = getTargetSales(currentSales);
    const stats = genreStats[formData.genre] || { stdDev: 0.15 };
    const annualVol = stats.stdDev * Math.sqrt(12);

    const supportDrift = Math.log(targetSales / currentSales);
    const noSupportDrift = -0.05;

    let results = [];
    const startMonth = new Date().getMonth() + 1; 

    for (let i = 0; i <= 12; i++) {
      const calcMonth = (startMonth + i - 1) % 12 || 12;
      results.push({
        month: i === 0 ? '現在' : `${calcMonth}月`,
        actualMonthIndex: calcMonth,
        isSaleMonth: [3, 6, 9, 12].includes(calcMonth), 
        supportSimulations: [],
        noSupportSimulations: []
      });
    }

    for (let i = 0; i < SIMULATION_COUNT; i++) {
      let currentSupportDaily = currentSales / 30;
      let currentNoSupportDaily = currentSales / 30;
      
      results[0].supportSimulations.push(currentSales);
      results[0].noSupportSimulations.push(currentSales);
      
      for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
        let monthlySupportSales = 0;
        let monthlyNoSupportSales = 0;
        
        for (let day = 1; day <= 30; day++) {
          const dt = 1 / 365;
          const Z1 = randomNormal(0, 1);
          const Z2 = randomNormal(0, 1);
          
          currentSupportDaily *= Math.exp((supportDrift - Math.pow(annualVol, 2) / 2) * dt + annualVol * Math.sqrt(dt) * Z1);
          currentNoSupportDaily *= Math.exp((noSupportDrift - Math.pow(annualVol, 2) / 2) * dt + annualVol * Math.sqrt(dt) * Z2);
          
          monthlySupportSales += currentSupportDaily;
          monthlyNoSupportSales += currentNoSupportDaily;
        }

        const currentMonthNum = results[monthIndex].actualMonthIndex;
        let seasonalMultiplier = 1.0;
        let noSupportSeasonalMultiplier = 1.0;

        if ([3, 6, 9, 12].includes(currentMonthNum)) {
          seasonalMultiplier *= 1.45; 
          noSupportSeasonalMultiplier *= 1.15;
        }

        if (aiSeasonality?.peakMonths?.includes(currentMonthNum)) {
          seasonalMultiplier *= 1.25;
          noSupportSeasonalMultiplier *= 1.1;
        }

        if (aiSeasonality?.offPeakMonths?.includes(currentMonthNum)) {
          seasonalMultiplier *= 0.65; 
          noSupportSeasonalMultiplier *= 0.8;
        }
        
        results[monthIndex].supportSimulations.push(monthlySupportSales * seasonalMultiplier);
        results[monthIndex].noSupportSimulations.push(monthlyNoSupportSales * noSupportSeasonalMultiplier);
      }
    }

    return results.map(r => {
      r.supportSimulations.sort((a, b) => a - b);
      r.noSupportSimulations.sort((a, b) => a - b);
      
      const supportMedian = getPercentile(r.supportSimulations, 0.5);
      const noSupportMedian = getPercentile(r.noSupportSimulations, 0.5);
      
      return {
        month: r.month,
        isSaleMonth: r.isSaleMonth,
        supportMedian: Math.round(supportMedian),
        supportRange: [
          Math.round(getPercentile(r.supportSimulations, 0.1)),
          Math.round(getPercentile(r.supportSimulations, 0.9))
        ],
        noSupportMedian: Math.round(noSupportMedian),
        difference: Math.round(supportMedian - noSupportMedian)
      };
    });
  };

  const handleSimulate = async () => {
    setUiError('');
    setAnalysisStep('');

    if (!formData.productUrl || !apiKey) {
      setUiError("APIキーと商品ページURLを正しく入力してください。");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    const currentSales = Number(formData.currentMonthlySales);
    const genreName = genres.find(g => g.id === formData.genre)?.name || formData.genre;

    let pageContent = "";
    let aiResult = null;

    try {
      setAnalysisStep('指定されたURLのページ内容を取得中...');
      try {
        const jinaResponse = await fetch(`https://r.jina.ai/${formData.productUrl}`);
        if (jinaResponse.ok) {
          pageContent = await jinaResponse.text();
          pageContent = pageContent.substring(0, 15000); 
        } else {
          throw new Error(`ページ取得失敗 (${jinaResponse.status})`);
        }
      } catch (err) {
        throw new Error("指定されたURLへのアクセスが拒否されたか、存在しないページです。");
      }

      if (!pageContent) throw new Error("ページの内容を取得できませんでした。");

      setAnalysisStep('ページ内容を解析し、定量的課題を抽出中...');
      const systemPrompt = `あなたは株式会社ピュアフラットの優秀なECコンサルタントAIです。
以下の「企業名」「ジャンル」「現在の月商」と、読み込んだ【商品ページの内容】を精読し、現状の分析、課題、具体的な改善施策を解析してください。

※必ず「読み込んだページ内容」に基づいた事実を抽出してください。
※現状分析、課題、施策は【数値を伴う定量的で具体的な内容】にしてください。
※【重要】課題および改善施策は、必ずそれぞれ4〜5個出力してください。各項目には「〇〇%」「〇〇枚」「〇〇円」「〇倍」といった具体的な数値（競合平均などを用いた推測含む）を必ず入れて、説得力を持たせてください。

以下のJSON形式で必ず出力してください。
{
  "productInfo": "実際のページ内容から抽出した商品の概要（150文字程度）",
  "quantitativeData": {
    "price": "販売価格（例: 3,980円。不明な場合は『記載なし』）",
    "images": "推測される画像・コンテンツの充実度（例: 商品画像5枚、詳細LPあり）",
    "reviews": "レビュー数（例: 45件）",
    "averageRating": "平均評価の数値のみ（例: 4.2。不明な場合は『-』）",
    "coupon": "キャンペーン・クーポン情報"
  },
  "currentStatus": {
    "good": [
      "ページ内容から読み取れる現状の良い点1（定量的に。例: レビューが平均4.5以上あり、〇〇の訴求が明確）",
      "ページ内容から読み取れる現状の良い点2"
    ],
    "bad": [
      "ページ内容から読み取れる現状の悪い点1（定量的に。例: クーポン等によるクロージングがなく離脱率が〇%と推測される）",
      "ページ内容から読み取れる現状の悪い点2"
    ]
  },
  "currentIssues": [
    "ページ内容に基づいた現状の課題1（※必ず数値を伴う定量的な課題。例: 画像が3枚しかなく競合平均8枚に劣り、直帰率65%超と推測）",
    "課題2（※必ず数値を伴う定量的な課題）",
    "課題3（※必ず数値を伴う定量的な課題）",
    "課題4（※必ず数値を伴う定量的な課題）",
    "課題5（※必ず数値を伴う定量的な課題。4個の場合は省略可）"
  ],
  "proposedSolutions": [
    "課題に対する改善施策1（※定量的アクション。例: 画像を5枚追加し、1枚目に権威性バッジを配置してCTRを1.5倍に改善）",
    "課題に対する改善施策2（※定量的アクション）",
    "課題に対する改善施策3（※定量的アクション）",
    "課題に対する改善施策4（※定量的アクション）",
    "課題に対する改善施策5（※定量的アクション。課題の数に合わせる）"
  ],
  "seasonality": {
    "peakMonths": [対象商品の繁忙期となる月を1~12の数字の配列で推測。例: [7, 8]],
    "offPeakMonths": [対象商品の閑散期となる月を数字の配列で推測。例: [2, 11]]
  }
}`;

      const userPrompt = `企業名: ${formData.companyName}\n商品ジャンル: ${genreName}\n現在の月商: ${currentSales}円\n商品ページURL: ${formData.productUrl}\n\n【読み込んだ商品ページの内容】\n${pageContent}`;
      const isGitHubToken = apiKey.startsWith('ghp_') || apiKey.startsWith('github_pat_');
      const apiUrl = isGitHubToken ? 'https://models.inference.ai.azure.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.2 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AI APIエラー: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const rawContent = data.choices[0].message.content;
      aiResult = JSON.parse(rawContent.replace(/```json/g, '').replace(/```/g, '').trim());

    } catch (error) {
      console.error(error);
      setUiError(`解析エラー: ${error.message}`);
      setIsAnalyzing(false);
      return; 
    } 

    if (aiResult) {
      try {
        setAnalysisStep('季節性を加味したモンテカルロ・シミュレーションを実行中...');
        
        const simData = runMonteCarloSimulation(aiResult.seasonality);

        const finalSales = simData[12].supportMedian;
        const actualMultiple = finalSales / currentSales;
        const actualMultipleStr = actualMultiple.toFixed(1);

        const aovMatch = aiResult.quantitativeData?.price?.match(/[0-9,]+/);
        const aov = aovMatch ? parseInt(aovMatch[0].replace(/,/g, '')) : 5000;
        const currentCvr = 0.012; 
        const currentTraffic = Math.round(currentSales / (aov * currentCvr));

        const combinedResult = {
          ...aiResult,
          proposedSolutions: [
            `【目標】シミュレーション予測に基づき、1年後に売上約${actualMultipleStr}倍(${finalSales.toLocaleString()}円)の着地を目指す`,
            ...aiResult.proposedSolutions
          ],
          kpiTargets: {
            currentTraffic: `約 ${currentTraffic.toLocaleString()} / 月`,
            targetTraffic: `約 ${Math.round(currentTraffic * Math.sqrt(actualMultiple)).toLocaleString()} / 月`, 
            currentCVR: "1.2 %",
            targetCVR: `${(1.2 * Math.sqrt(actualMultiple)).toFixed(1)} %`,
            currentAOV: `${aov.toLocaleString()} 円`,
            targetAOV: `${Math.round(aov * 1.15).toLocaleString()} 円`
          },
          simulationData: simData,
          stats: genreStats[formData.genre]
        };

        setAnalysisResult(combinedResult);
        setActiveTab('result'); 
      } catch (err) {
        console.error("結果処理中のエラー:", err);
        setUiError("シミュレーション結果の計算中にエラーが発生しました。");
      }
    }
    
    setIsAnalyzing(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#E0F2F1] to-slate-50 z-0 opacity-70"></div>
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-[#4ECDC4] rounded-full blur-[120px] opacity-20 z-0"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-[#26A69A] rounded-full blur-[100px] opacity-20 z-0"></div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white">
          <div className="bg-gradient-to-br from-[#4ECDC4] to-[#26A69A] p-10 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl inline-block mb-6 shadow-inner">
                <TrendingUp className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-wide mb-6 text-white drop-shadow-md">
                PureFlat AI<br/>Simulator
              </h1>
              <div className="space-y-6 mt-8">
                <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-sm shadow-sm">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-100" /> 実績ベースのシミュレーション
                  </h3>
                  <p className="text-teal-50 text-sm leading-relaxed">
                    弊社の過去の支援実績データベースを活用。商品ジャンルを指定することで、実際のデータ変動率に基づいた妥当性の高い1年後の売上シミュレーションを算出します。
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-sm shadow-sm">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Search className="w-5 h-5 text-teal-100" /> URLからAIが現状を解析
                  </h3>
                  <p className="text-teal-50 text-sm leading-relaxed">
                    商品ページのURLを入力するだけで、AIが実際のページ内容を読み取り、現状の課題抽出から具体的な改善施策までを定量的にアウトプットします。
                  </p>
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-10">
              <p className="text-xs text-teal-100/70 font-medium tracking-wider">© 株式会社ピュアフラット 営業部</p>
            </div>
          </div>

          <div className="p-10 flex flex-col justify-center bg-white/50">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">社内システム ログイン</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">ツールを利用するためのパスワードを入力してください</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {loginError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">パスワード</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="pl-12 w-full px-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent outline-none transition-all shadow-sm font-medium"
                    />
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 mt-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 text-lg transition-all bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] hover:opacity-90 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                ログインしてツールを開始
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] px-6 py-4 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight tracking-wide">PureFlat AI Simulator</h1>
            <p className="text-xs text-teal-50 font-medium">EC売上予測・解析ツール (リアル解析Ver.)</p>
          </div>
        </div>
        <nav className="flex space-x-2 bg-black/10 p-1.5 rounded-xl backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('simulate')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'simulate' ? 'bg-white text-[#26A69A] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
          >
            新規シミュレーション
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white text-[#26A69A] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
          >
            <Settings className="w-4 h-4" /> データ設定
          </button>
          {analysisResult && (
            <button 
              onClick={() => setActiveTab('result')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'result' ? 'bg-white text-[#26A69A] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              <Activity className="w-4 h-4" /> 解析結果
            </button>
          )}
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 text-white/80 hover:text-red-300 hover:bg-white/10 ml-4 border-l border-white/20 pl-6"
          >
             ログアウト
          </button>
        </nav>
      </header>

      <div className="w-full h-6 bg-white relative z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#4ECDC4] to-[#26A69A]" style={{ clipPath: 'ellipse(70% 100% at 50% 0%)' }}></div>
      </div>

      <main className="flex-grow p-6 w-full flex justify-center">
        {activeTab === 'settings' && (
          <div className="w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-[#B2DFDB] shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#26A69A]"><Settings className="w-5 h-5" /> API設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">APIキー (OpenAI または GitHub)</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-... または github_pat_..." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4ECDC4] focus:border-[#4ECDC4] outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">※OpenAI (sk-...) と GitHub Models (github_pat_...) の両方に対応しています。</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-[#B2DFDB] shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#26A69A]"><FileSpreadsheet className="w-5 h-5" /> RMS過去実績データ取込</h2>
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{csvStatus}</span>
              </div>
              <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <div 
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-[#B2DFDB] rounded-2xl p-10 text-center hover:bg-[#B2DFDB]/10 transition-colors cursor-pointer bg-slate-50/50"
              >
                <Upload className="w-10 h-10 text-[#4ECDC4] mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-700">最新のCSVファイルを選択してアップロード</p>
                <p className="text-xs text-slate-500 mt-2">※ジャンルや実績データが自動でアップデートされます</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulate' && (
          <div className="w-full max-w-3xl flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
            {isAnalyzing ? (
              <div className="bg-white border-2 border-[#B2DFDB] rounded-3xl h-full flex flex-col items-center justify-center p-16 text-[#26A69A] min-h-[500px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
                </div>
                <Database className="w-20 h-20 mb-8 animate-bounce text-[#4ECDC4]" />
                <h3 className="text-2xl font-extrabold mb-3 tracking-tight">AI解析 実行中</h3>
                <p className="text-[#26A69A]/80 font-bold text-lg">{analysisStep}</p>
                <p className="text-slate-400 text-sm mt-4">実際のページデータを取得し、定量的な事実確認を行っています...</p>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">AI 解析シミュレーション</h2>
                  <p className="text-slate-500 font-medium mt-2">対象ページURLから現状を抽出し、具体的な改善予測を立てます</p>
                </div>

                {uiError && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700 font-bold">{uiError}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">対象企業名 / 店舗名</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                          type="text" name="companyName" value={formData.companyName} onChange={handleInputChange}
                          placeholder="株式会社サンプル" 
                          className="pl-11 w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent outline-none transition-all font-medium text-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">商品ジャンル</label>
                      <select 
                        name="genre" value={formData.genre} onChange={handleInputChange}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent outline-none transition-all appearance-none font-medium text-lg"
                      >
                        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        {genres.length === 0 && <option value="">データを読み込んでください</option>}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">現在の月商（目安）</label>
                    <div className="relative">
                      <input 
                        type="number" name="currentMonthlySales" value={formData.currentMonthlySales} onChange={handleInputChange}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent outline-none transition-all text-right pr-10 font-bold text-xl text-slate-800"
                      />
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-bold">円</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">解析対象の商品ページURL <span className="text-pink-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input 
                        type="url" name="productUrl" value={formData.productUrl} onChange={handleInputChange}
                        placeholder="https://item.rakuten.co.jp/..." 
                        className="pl-11 w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSimulate}
                    disabled={!formData.productUrl || genres.length === 0}
                    className={`w-full py-5 mt-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-3 text-lg transition-all ${
                      !formData.productUrl || genres.length === 0
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                        : 'bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] hover:opacity-90 hover:shadow-xl transform hover:-translate-y-1'
                    }`}
                  >
                    <Play className="w-6 h-6 fill-current" /> リアルページ解析＆シミュレーション実行
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'result' && analysisResult && (
          <div className="w-full max-w-[1400px] animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                <Search className="w-8 h-8 text-[#26A69A]" /> 解析結果レポート
              </h2>
              <button 
                onClick={() => setActiveTab('simulate')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> 条件入力に戻る
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quantitative Data</h3>
                  <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-500">
                      <Star className="w-8 h-8 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">平均評価</p>
                      <p className="text-4xl font-black text-slate-800">{analysisResult.quantitativeData.averageRating}</p>
                    </div>
                  </div>
                  <ul className="space-y-4 text-sm">
                    <li className="flex justify-between items-center border-b border-slate-100 pb-2"><span className="text-slate-500 font-bold">販売価格</span><span className="font-extrabold text-slate-800 text-base">{analysisResult.quantitativeData.price}</span></li>
                    <li className="flex justify-between items-center border-b border-slate-100 pb-2"><span className="text-slate-500 font-bold">レビュー数</span><span className="font-extrabold text-slate-800">{analysisResult.quantitativeData.reviews}</span></li>
                    <li className="flex justify-between items-start border-b border-slate-100 pb-2"><span className="text-slate-500 font-bold whitespace-nowrap mr-4">ページ構成</span><span className="font-bold text-slate-700 text-right">{analysisResult.quantitativeData.images}</span></li>
                    <li className="flex justify-between items-start pb-2"><span className="text-slate-500 font-bold whitespace-nowrap mr-4">キャンペーン</span><span className="font-bold text-pink-500 text-right">{analysisResult.quantitativeData.coupon}</span></li>
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Current Status Analysis</h3>
                <div className="mb-6 p-4 bg-slate-50 rounded-xl text-slate-700 font-medium leading-relaxed border border-slate-100">
                  {analysisResult.productInfo}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                    <h4 className="flex items-center gap-2 font-bold text-emerald-700 mb-4 text-lg">
                      <ThumbsUp className="w-5 h-5" /> ページの良い点
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.currentStatus?.good?.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm font-medium text-slate-700 leading-relaxed">
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-pink-50/50 p-5 rounded-2xl border border-pink-100">
                    <h4 className="flex items-center gap-2 font-bold text-pink-700 mb-4 text-lg">
                      <ThumbsDown className="w-5 h-5" /> ページの悪い点（機会損失）
                    </h4>
                    <ul className="space-y-3">
                      {analysisResult.currentStatus?.bad?.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm font-medium text-slate-700 leading-relaxed">
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-pink-400 mt-2"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-pink-100 border-t-4 border-t-pink-400 shadow-sm">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
                  <AlertCircle className="w-6 h-6 text-pink-500" /> 優先的に解決すべき課題
                </h3>
                <ul className="space-y-5">
                  {analysisResult.currentIssues.map((issue, idx) => (
                    <li key={idx} className="flex gap-4 text-base font-medium text-slate-700 bg-slate-50 p-4 rounded-xl">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-black">{idx + 1}</span>
                      <span className="pt-1 leading-relaxed">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-[#B2DFDB] border-t-4 border-t-[#4ECDC4] shadow-sm">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
                  <CheckCircle2 className="w-6 h-6 text-[#26A69A]" /> ピュアフラットの改善施策
                </h3>
                <ul className="space-y-5">
                  {analysisResult.proposedSolutions.map((solution, idx) => (
                    <li key={idx} className="flex gap-4 text-base bg-[#E0F2F1]/30 p-4 rounded-xl border border-[#B2DFDB]/50">
                      <span className="flex-shrink-0 text-[#26A69A] pt-1"><ChevronRight className="w-5 h-5" /></span>
                      <span className="text-slate-800 font-bold leading-relaxed">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-gradient-to-bl from-[#E0F2F1] to-white w-64 h-64 rounded-bl-full -z-10 opacity-50"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 z-10 relative">
                <div>
                  <h3 className="text-3xl font-black flex items-center gap-3 text-slate-800 tracking-tight">
                    <TrendingUp className="w-8 h-8 text-[#26A69A]" /> 1年後の目標着地 シミュレーション
                  </h3>
                  <p className="text-base font-bold text-slate-500 mt-3 flex items-center gap-3">
                    <span className="bg-[#4ECDC4]/20 text-[#26A69A] px-3 py-1 rounded-md text-sm">セール月・閑散期 反映済</span>
                    実績分布と季節変動に基づく成長予測
                  </p>
                </div>
                <div className="text-left md:text-right bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full md:w-auto shadow-sm">
                  <p className="text-sm font-bold text-slate-500 mb-2 flex items-center justify-end gap-2">
                    1年後の予測着地: <span className="text-slate-800">{formatCurrency(analysisResult.simulationData[12].supportMedian)}</span>
                  </p>
                  <p className="text-sm font-bold text-slate-500 mb-2">予測売上差額 (中央値)</p>
                  <p className="text-5xl font-black text-[#26A69A] tracking-tighter">
                    +{formatCurrency(analysisResult.simulationData[12].difference)}
                  </p>
                </div>
              </div>

              <div className="h-[600px] w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisResult.simulationData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorSupport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.05}/>
                      </linearGradient>
                      <pattern id="salePattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.1" />
                      </pattern>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    
                    {analysisResult.simulationData.map((data, index) => {
                      if (data.isSaleMonth) {
                        return (
                          <ReferenceLine 
                            key={`sale-${index}`} 
                            x={data.month} 
                            stroke="none" 
                            fill="url(#salePattern)" 
                            label={{ position: 'insideTop', value: 'SALE', fill: '#f43f5e', fontSize: 12, fontWeight: 'bold', opacity: 0.5 }}
                          />
                        );
                      }
                      return null;
                    })}

                    <XAxis 
                      dataKey="month" 
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 14, fontWeight: 700 }} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 14, fontWeight: 700 }}
                      tickFormatter={(value) => `${Math.round(value / 10000)}万円`}
                      dx={-10}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        Array.isArray(value) ? `${formatCurrency(value[0])} 〜 ${formatCurrency(value[1])}` : formatCurrency(value), 
                        name
                      ]}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      itemStyle={{ fontWeight: '900', fontSize: '15px', paddingBottom: '8px' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={60} 
                      iconType="circle" 
                      wrapperStyle={{ fontWeight: '800', fontSize: '15px' }} 
                    />
                    
                    <Area 
                      type="monotone" 
                      dataKey="supportRange" 
                      name="ピュアフラット支援 (ブレ幅)" 
                      stroke="none" 
                      fill="url(#colorSupport)" 
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="noSupportMedian" 
                      name="支援なし (予測中央値)" 
                      stroke="#94a3b8" 
                      strokeWidth={4}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: '#94a3b8', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />

                    <Line 
                      type="monotone" 
                      dataKey="supportMedian" 
                      name="ピュアフラット支援 (予測中央値)" 
                      stroke="#26A69A" 
                      strokeWidth={6}
                      dot={{ stroke: '#26A69A', strokeWidth: 3, r: 6, fill: '#fff' }}
                      activeDot={{ r: 10, strokeWidth: 0, fill: '#4ECDC4' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}