import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../../pages/EditProfileModal';
import { useToast } from '../../components/ToastProvider';

// 假設的身體數據 (只保留數值，單位在旁邊顯示)
const initialMetrics = {
  height: '165', weight: '55', bust: '85', shoulder: '40',
  waist: '68', hips: '92', shoeSize: '24.5',
  // **資料庫欄位：性別，預設為女**
  sex: '女', // 使用中文
};
// 單位物件，方便管理
const units = {
  height: 'cm', weight: 'kg', bust: 'cm', shoulder: 'cm',
  waist: 'cm', hips: 'cm', shoeSize: ''
};

// 輔助函式：將字串轉為數字（空值 / 非數字會得到 NaN）
const N = (v) => {
  const num = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(num) ? num : NaN;
};

// 計算 BMI 和判斷
function calculateBMI({ height, weight }) {
  const H = N(height) / 100; // 轉換為公尺
  const W = N(weight);
  
  if (!Number.isFinite(H) || !Number.isFinite(W) || H <= 0 || W <= 0) {
    return { bmi: null, category: '資料不足', info: '請輸入身高和體重' };
  }
  
  const bmi = W / (H * H);
  let category = '';
  let info = '';
  
  if (bmi < 18.5) {
    category = '體重過輕';
    info = 'BMI 低於 18.5，建議增加營養攝取';
  } else if (bmi >= 18.5 && bmi < 24) {
    category = '正常範圍';
    info = 'BMI 在健康範圍內，請保持良好習慣';
  } else if (bmi >= 24 && bmi < 27) {
    category = '過重';
    info = 'BMI 介於 24-27，建議注意飲食和運動';
  } else if (bmi >= 27 && bmi < 30) {
    category = '輕度肥胖';
    info = 'BMI 介於 27-30，建議諮詢營養師';
  } else if (bmi >= 30 && bmi < 35) {
    category = '中度肥胖';
    info = 'BMI 介於 30-35，建議尋求專業協助';
  } else {
    category = '重度肥胖';
    info = 'BMI 超過 35，強烈建議就醫諮詢';
  }
  
  return { bmi: bmi.toFixed(1), category, info };
}

// 女性身材比例判斷（使用新標準）
function getFemaleBodyType({ bust, waist, hips, shoulder }) {
  const B = N(bust), W = N(waist), H = N(hips), S = N(shoulder);
  const S2 = S * 2; // 肩寬 × 2
  const isAllValid = [B, W, H, S].every(Number.isFinite);

  if (!isAllValid) return { type: null, info: '請先完整輸入：肩寬、胸圍、腰圍、臀圍' };

  // 判斷依據數值
  const diffBW = B - W;  // 胸圍 - 腰圍
  const diffHW = H - W;  // 臀圍 - 腰圍
  const diffHS = H - S2; // 臀圍 - 肩寬×2
  const diffSH = S2 - H; // 肩寬×2 - 臀圍
  const diffBH = Math.abs(B - H); // 胸圍與臀圍差異

  // 除錯日誌
  console.log('🔍 身材判斷數據:', {
    胸圍: B, 腰圍: W, 臀圍: H, 肩寬: S, 肩寬x2: S2.toFixed(1),
    '胸圍-腰圍': diffBW.toFixed(1),
    '臀圍-腰圍': diffHW.toFixed(1),
    '臀圍-肩寬x2': diffHS.toFixed(1),
    '肩寬x2-臀圍': diffSH.toFixed(1),
    '胸臀差': diffBH.toFixed(1)
  });

  // 1. 沙漏型身材（最優先判斷）：胸圍與臀圍接近，腰明顯較細
  // 再放寬標準：胸圍-腰圍 12-28 cm，臀圍-腰圍 15-33 cm，胸臀差 ≤ 7 cm
  const isHourglassRelaxed = (diffBW >= 12 && diffBW <= 28) && 
                              (diffHW >= 15 && diffHW <= 33) && 
                              (diffBH <= 7);
  
  if (isHourglassRelaxed) {
    console.log('✅ 判定為沙漏型');
    return { 
      type: '沙漏型身材', 
      info: `胸圍-腰圍 ${diffBW.toFixed(1)} cm，臀圍-腰圍 ${diffHW.toFixed(1)} cm，胸臀比例均衡，曲線優美。` 
    };
  }

  // 2. 倒三角身材：肩寬×2 - 臀圍 > 5 公分
  if (diffSH > 5) {
    console.log('✅ 判定為倒三角');
    return { 
      type: '倒三角身材', 
      info: `肩寬×2 (${S2.toFixed(1)} cm) 明顯大於 臀圍 (${H} cm)，差值 ${diffSH.toFixed(1)} cm。上半身較寬。` 
    };
  }

  // 3. 梨型身材（酪梨身材）：臀圍明顯大於胸圍和肩寬
  // 條件：臀圍 - 肩寬×2 > 5 公分 且 臀圍 > 胸圍 + 3
  if (diffHS > 5 && H > B + 3) {
    console.log('✅ 判定為梨型');
    return { 
      type: '梨型身材（酪梨身材）', 
      info: `臀圍 (${H} cm) 明顯大於胸圍 (${B} cm) 和肩寬×2 (${S2.toFixed(1)} cm)，下半身較為豐滿。` 
    };
  }

  // 4. H 型身材（矩形身材）：腰圍與胸臀差異小
  // 條件：胸圍-腰圍 < 15 或 臀圍-腰圍 < 20
  if (diffBW < 15 || diffHW < 20) {
    console.log('✅ 判定為 H 型');
    return { 
      type: 'H 型身材（矩形身材）', 
      info: `腰部曲線不明顯，胸圍-腰圍 ${diffBW.toFixed(1)} cm，臀圍-腰圍 ${diffHW.toFixed(1)} cm，身形較為平直。` 
    };
  }

  // 5. 蘋果型身材：腰圍 > 臀圍
  if (W > H) {
    console.log('✅ 判定為蘋果型');
    return { 
      type: '蘋果型身材', 
      info: `腰圍 (${W} cm) 大於 臀圍 (${H} cm)，腰部較為豐滿。` 
    };
  }

  console.log('⚠️ 未分類');
  return { type: '未分類', info: '數據介於臨界值，建議再量一次或屬於不常見類型。' };
}

// 男性身材比例判斷（使用新標準）
function getMaleBodyType({ shoulder, waist, hips }) {
    const S = N(shoulder), W = N(waist), H = N(hips);
    const S2 = S * 2; // 肩寬 × 2
    const isAllValid = [S, W, H].every(Number.isFinite);

    if (!isAllValid) return { type: null, info: '請先完整輸入：肩寬、腰圍、臀圍' };

    // 判斷依據數值
    const diffHS = H - S2; // 臀圍 - 肩寬×2
    const diffSH = S2 - H; // 肩寬×2 - 臀圍

    // 1. 蘋果型身材：腰圍 > 臀圍
    if (W > H) {
        return {
            type: '蘋果型身材',
            info: `腰圍 (${W} cm) 大於 臀圍 (${H} cm)，腰部較為豐滿。`,
        };
    }

    // 2. 梨型身材（酪梨身材）：臀圍 - 肩寬×2 > 3 公分
    if (diffHS > 3) {
        return {
            type: '梨型身材（酪梨身材）',
            info: `臀圍 (${H} cm) 明顯大於 肩寬×2 (${S2.toFixed(1)} cm)，差值 ${diffHS.toFixed(1)} cm。下半身較為豐滿。`,
        };
    }

    // 3. 倒三角身材：肩寬×2 - 臀圍 > 3 公分
    if (diffSH > 3) {
        return {
            type: '倒三角身材',
            info: `肩寬×2 (${S2.toFixed(1)} cm) 明顯大於 臀圍 (${H} cm)，差值 ${diffSH.toFixed(1)} cm。上半身較寬。`,
        };
    }

    // 4. H 型身材（矩形身材）：肩寬×2 - 臀圍 < 3 公分
    if (Math.abs(diffSH) < 3) {
        return {
            type: 'H 型身材（矩形身材）',
            info: `肩寬×2 (${S2.toFixed(1)} cm) 與 臀圍 (${H} cm) 差異在 3 cm 以內，身形較為平直。`,
        };
    }

    return { type: '未分類', info: '數據介於臨界值，建議再量一次或屬於不常見類型。' };
}

// 統一的身體分析函式 (根據性別切換邏輯)
function analyseBodyShape(metrics) {
    const { sex } = metrics; // 使用 sex
    
    // 計算 BMI
    const bmiResult = calculateBMI(metrics);
    
    if (sex === '女') {
        const result = getFemaleBodyType(metrics);
        return {
            type: result.type,
            details: result.info,
            analysisModel: '女性身體比例模型',
            bmi: bmiResult.bmi,
            bmiCategory: bmiResult.category,
            bmiInfo: bmiResult.info,
        };
    } else if (sex === '男') {
        const result = getMaleBodyType(metrics);
        return {
            type: result.type,
            details: result.info,
            analysisModel: '男性身體比例模型',
            bmi: bmiResult.bmi,
            bmiCategory: bmiResult.category,
            bmiInfo: bmiResult.info,
        };
    }
    return {
        type: '無效性別',
        details: '請選擇性別以進行身材分析。',
        analysisModel: 'N/A',
        bmi: bmiResult.bmi,
        bmiCategory: bmiResult.category,
        bmiInfo: bmiResult.info,
    };
}

// 身體數據元件
const BodyMetrics = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // profileUser 應包含所有欄位，包括性別
  const [profileUser, setProfileUser] = useState({ sex: initialMetrics.sex }); // 使用 sex

  // helper to map backend fields to frontend keys
  const mapFromServer = (data) => ({
    height: data.height_cm != null ? String(data.height_cm) : '',
    weight: data.weight_kg != null ? String(data.weight_kg) : '',
    bust: data.chest_cm != null ? String(data.chest_cm) : '',
    shoulder: data.shoulder_cm != null ? String(data.shoulder_cm) : '',
    waist: data.waist_cm != null ? String(data.waist_cm) : '',
    hips: data.hip_cm != null ? String(data.hip_cm) : '',
    shoeSize: data.shoe_size != null ? String(data.shoe_size) : '',
    // 從後端 body_metrics 支援 sex 欄位
    sex: data.sex != null ? String(data.sex) : '',
  });

  // 載入使用者資料和身體數據 (包含性別)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 假設 sex 從 auth/me 取得 (或另一個 profile API)
        const [r1, r2] = await Promise.all([
            fetch('https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/auth/me', { headers }).catch(() => null),
            fetch('https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/me/body_metrics', { headers }).catch(() => null),
        ]);

        let authData = {};
        if(r1 && r1.ok) authData = await r1.json().catch(() => ({}));
        
        let bmData = {};
        if(r2 && r2.ok) bmData = await r2.json().catch(() => ({}));

        const hasMetrics = (bmData.height_cm || bmData.weight_kg || bmData.chest_cm || bmData.waist_cm || bmData.hip_cm || bmData.shoulder_cm || bmData.shoe_size);

        if (hasMetrics || authData.sex || bmData.sex) {
          // 優先使用 body_metrics 回傳的 sex，否則使用 auth/me 的 sex，接著再 fallback 到 localStorage 的 user 資料
          let localUserSex = null;
          try {
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            localUserSex = localUser.sex ?? localUser.gender ?? null;
          } catch (e) {
            localUserSex = null;
          }

          const chosenSex = bmData.sex ?? authData.sex ?? localUserSex ?? prev.sex;

          setMetrics(prev => ({
            ...prev,
            ...mapFromServer(bmData),
            // **從資料庫載入性別** (優先 body_metrics.sex)
            sex: chosenSex,
          }));
        }
      } catch (err) {
        console.warn('載入身體數據或性別失敗', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 載入使用者資料以開啟 Modal
  const loadProfileForModal = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      const [r1, r2] = await Promise.all([
        fetch('https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/me/body_metrics', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);
      let auth = {}; if (r1 && r1.ok) auth = await r1.json().catch(() => ({}));
      let bm = {}; if (r2 && r2.ok) bm = await r2.json().catch(() => ({}));
      
      const userObj = {
        displayName: auth.display_name || bm.display_name || auth.name || '',
        bio: auth.interformation || '',
        // 帶入目前分析用的狀態和資料庫性別：優先 body_metrics.sex，再 fallback 到 auth.sex、最後是目前 metrics
        sex: bm.sex ?? auth.sex ?? metrics.sex,
        height: bm.height_cm ?? '',
        weight: bm.weight_kg ?? '',
        bust: bm.chest_cm ?? '',
        waist: bm.waist_cm ?? '',
        hip: bm.hip_cm ?? '',
        shoulder: bm.shoulder_cm ?? '',
      };
      setProfileUser(userObj);
      setIsProfileModalOpen(true);
    } catch (err) {
      console.warn('載入使用者資料失敗', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // 處理 Modal 儲存 (包含性別和身體數據)
  const handleModalSave = async (updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      
      // 1. 更新身體數據（包含性別）
      const bodyMetricsPayload = {
        height_cm: updatedData.height ? Number(updatedData.height) : null,
        weight_kg: updatedData.weight ? Number(updatedData.weight) : null,
        chest_cm: updatedData.bust ? Number(updatedData.bust) : null,
        waist_cm: updatedData.waist ? Number(updatedData.waist) : null,
        hip_cm: updatedData.hip ? Number(updatedData.hip) : null,
        shoulder_cm: updatedData.shoulder ? Number(updatedData.shoulder) : null,
        sex: updatedData.sex || null, // 將性別加入 body_metrics
      };

      const resMetrics = await fetch('https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/me/body_metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyMetricsPayload),
      });
      if (!resMetrics.ok) {
        const body = await resMetrics.text().catch(() => '');
        throw new Error(`身體數據儲存失敗: ${body || `HTTP ${resMetrics.status}`}`);
      }
      const savedMetrics = await resMetrics.json().catch(() => ({}));
      
      // 2. 更新本地狀態：優先使用後端回傳的 sex，否則使用 modal 的值
      setMetrics(prev => ({
        ...prev,
        ...mapFromServer(savedMetrics),
        sex: savedMetrics.sex ?? updatedData.sex ?? prev.sex,
      }));
      setProfileUser(updatedData);
      setIsProfileModalOpen(false);
      toast.addToast && toast.addToast({ type: 'success', title: '修改成功' });
      
      // 3. 更新 localStorage 中的使用者資料
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...localUser, sex: savedMetrics.sex ?? updatedData.sex }));
      } catch (e) {
        console.warn('更新 localStorage 失敗', e);
      }
      
      // 4. 發送事件讓其他元件知道資料已更新
      window.dispatchEvent(new Event('user-profile-updated'));
      
    } catch (err) {
      console.error('儲存失敗', err);
      setError(err.message || String(err));
      toast.addToast && toast.addToast({ type: 'error', title: '儲存失敗', description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  // 渲染單個數據項 
  const renderMetricItem = (key, label) => (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-gray-700">{label}</span>
      <span className="font-medium text-black">
        {metrics[key] || '未輸入'} {metrics[key] ? units[key] : ''}
      </span>
    </div>
  );

  const analysisResult = analyseBodyShape(metrics);

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {/* 頂部操作區 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">身體數據與分析</h3>
          <div className="flex items-center gap-2">
            {loading && <div className="text-sm text-gray-400">載入中…</div>}
            {error && <div className="text-sm text-rose-600">錯誤</div>}
            <button
              onClick={async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                  navigate('/');
                  return;
                }
                await loadProfileForModal();
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition duration-150"
            >
              編輯數據
            </button>
          </div>
        </div>

        {/* 數據列表 */}
        <div className="border border-gray-200 rounded-lg p-3 mb-6">
          <h4 className="font-semibold text-indigo-700 mb-2">我的測量結果</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            {renderMetricItem('height', '身高')}
            {renderMetricItem('weight', '體重')}
            {renderMetricItem('bust', '胸圍')}
            {renderMetricItem('shoulder', '肩寬')}
            {renderMetricItem('waist', '腰圍')}
            {renderMetricItem('hips', '臀圍')}
          </div>
        </div>

        {/* BMI 分析區塊 */}
        <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-lg font-bold text-emerald-800">BMI 分析</div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-gray-700">BMI 值</span>
            <span className="text-2xl font-bold text-emerald-600">
              {analysisResult.bmi || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-gray-700">分類</span>
            <span className={`text-base font-bold ${
              analysisResult.bmiCategory === '正常範圍' ? 'text-green-600' :
              analysisResult.bmiCategory === '體重過輕' ? 'text-yellow-600' :
              analysisResult.bmiCategory === '過重' ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {analysisResult.bmiCategory || '資料不足'}
            </span>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">建議：</span>{analysisResult.bmiInfo}
          </div>
        </div>

        {/* 性別與身形分析結果區塊 */}
        <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-bold text-indigo-800">身形分析</div>
            <div className="text-sm text-gray-500">{analysisResult.analysisModel}</div>
          </div>

          <div className="flex items-center justify-between mb-3 border-b border-indigo-200 pb-2">
            <span className="text-base font-semibold text-gray-700">性別</span>
            <span className="text-base font-medium text-indigo-600">
              {metrics.sex || '未設定'}
              {metrics.sex === '女' && ' 👩'}
              {metrics.sex === '男' && ' 👨'}
            </span>
          </div>

          <div>
            <div className="text-base font-semibold text-gray-800 mb-1">判斷身形：
              <span className={`ml-2 text-xl font-extrabold ${analysisResult.type && analysisResult.type.includes('型') ? 'text-indigo-600' : 'text-amber-600'}`}>
                {analysisResult.type || '資料不足'}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">判斷依據：</span>{analysisResult.details}
            </div>
          </div>
        </div>

      </div>
      {/* 彈出視窗 Modal */}
      {isProfileModalOpen && profileUser && (
        // 假設 EditProfileModal 已經支援 sex 欄位
        <EditProfileModal user={profileUser} onClose={() => setIsProfileModalOpen(false)} onSave={handleModalSave} />
      )}
    </>
  );
};

// 👇 只保留身體數據分析，不再顯示「我的衣櫥」分頁
export default function Analysis() {
  return (
    <div>
      <BodyMetrics />
    </div>
  );
}