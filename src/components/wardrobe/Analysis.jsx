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

// ➊ 女性身材比例判斷 (保留您原有的邏輯)
function getFemaleBodyType({ bust, waist, hips, shoulder }) {
  const B = N(bust), W = N(waist), H = N(hips), S2 = N(shoulder) * 2;
  const isAllValid = [B, W, H, S2].every(Number.isFinite);

  if (!isAllValid) return { type: null, info: '請先完整輸入：肩寬、胸圍、腰圍、臀圍' };

  // 判斷依據數值
  const diffBH = Math.abs(S2 - H); // 肩寬x2 vs 臀圍差
  const diffBW = B - W;           // 胸圍 vs 腰圍差
  const diffHW = H - W;           // 臀圍 vs 腰圍差

  // 沙漏：胸-腰 18~20 且 臀-腰 23~25（含臨界）
  const condHourglass = (diffBW >= 18 && diffBW <= 20) && (diffHW >= 23 && diffHW <= 25);
  if (condHourglass) return { type: '沙漏型身材', info: `胸-腰 ${diffBW.toFixed(1)} cm，臀-腰 ${diffHW.toFixed(1)} cm，符合沙漏條件。` };

  // 蘋果：腰圍 > 臀圍
  if (W > H) return { type: '蘋果型身材', info: `腰圍 (${W} cm) 大於 臀圍 (${H} cm)。` };

  // 倒三角：肩寬×2 - 臀圍 > 3
  if (S2 - H > 3) return { type: '倒三角身材', info: `肩寬×2 (${S2.toFixed(1)} cm) 明顯大於 臀圍 (${H} cm)，差值 ${ (S2 - H).toFixed(1) } cm。` };

  // 梨型：臀圍 - 肩寬×2 > 3
  if (H - S2 > 3) return { type: '梨型身材（酪梨身材）', info: `臀圍 (${H} cm) 明顯大於 肩寬×2 (${S2.toFixed(1)} cm)，差值 ${(H - S2).toFixed(1)} cm。` };

  // H 型：肩寬×2 與 臀圍差 < 3
  if (Math.abs(S2 - H) < 3) return { type: 'H 型身材（矩形身材）', info: `肩寬×2 (${S2.toFixed(1)} cm) 與 臀圍 (${H} cm) 差異在 3 cm 以內。` };

  return { type: '未分類', info: '數據介於臨界值，建議再量一次或屬於不常見類型。' };
}

// ➋ 新增：男性身材比例判斷
function getMaleBodyType({ shoulder, waist, hips }) {
    const S = N(shoulder), W = N(waist), H = N(hips);
    const isAllValid = [S, W, H].every(Number.isFinite);

    if (!isAllValid) return { type: null, info: '請先完整輸入：肩寬、腰圍、臀圍' };

    // 判斷依據數值
    const diffSH = S - H; // 肩寬 vs 臀圍差
    const diffSW = S - W; // 肩寬 vs 腰圍差
    const diffWH = Math.abs(W - H); // 腰圍 vs 臀圍差

    // 倒三角 (V-shape): 肩膀明顯寬於臀部 (S > H, 且差值 > 5cm)
    if (diffSH > 5) {
        return {
            type: '倒三角型身材（V 型）',
            info: `肩寬 (${S} cm) 明顯大於 臀圍 (${H} cm)，差值 ${(diffSH).toFixed(1)} cm。`,
        };
    }
    
    // 橢圓/蘋果 (Oval/Apple): 腰圍是最大或接近最大的部位 (W > H 且 W > S)
    if (W > H && W > S && W - S > 3) {
        return {
            type: '橢圓型身材（蘋果型）',
            info: `腰圍 (${W} cm) 大於臀圍 (${H} cm) 和肩寬 (${S} cm)。`,
        };
    }

    // 三角 (Triangle/Pear): 臀部明顯寬於肩膀 (H > S, 且差值 > 3cm)
    if (H - S > 3) {
        return {
            type: '三角型身材',
            info: `臀圍 (${H} cm) 明顯大於 肩寬 (${S} cm)，差值 ${(H - S).toFixed(1)} cm。`,
        };
    }

    // 矩形 (Rectangle/H-shape): 肩、腰、臀三者尺寸差異小 (e.g., within 5cm)
    if (Math.abs(diffSH) <= 5 && diffWH <= 5 && Math.abs(diffSW) <= 5) {
        return {
            type: '矩形型身材（H 型）',
            info: `肩寬、腰圍、臀圍差異皆在 5 cm 內。`,
        };
    }

    return { type: '未分類', info: '數據介於臨界值，建議再量一次或屬於不常見類型。' };
}


// ➌ 統一的身體分析函式 (根據性別切換邏輯)
function analyseBodyShape(metrics) {
    const { sex } = metrics; // 使用 sex
    
    if (sex === '女') {
        const result = getFemaleBodyType(metrics);
        return {
            type: result.type,
            details: result.info,
            analysisModel: '女性身體比例模型 ',
        };
    } else if (sex === '男') {
        const result = getMaleBodyType(metrics);
        return {
            type: result.type,
            details: result.info,
            analysisModel: '男性身體比例模型 ',
        };
    }
    return {
        type: '無效性別',
        details: '請選擇性別以進行身材分析。',
        analysisModel: 'N/A',
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
            fetch('http://127.0.0.1:8000/api/v1/auth/me', { headers }).catch(() => null),
            fetch('http://127.0.0.1:8000/api/v1/me/body_metrics', { headers }).catch(() => null),
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
        fetch('http://127.0.0.1:8000/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('http://127.0.0.1:8000/api/v1/me/body_metrics', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
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

      const resMetrics = await fetch('http://127.0.0.1:8000/api/v1/me/body_metrics', {
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


        {/* ➌ 性別與分析結果區塊 (版面調整重點) */}
        <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-bold text-indigo-800">分析結果</div>
            <div className="text-sm text-gray-500">{analysisResult.analysisModel}</div>
          </div>

          <div className="flex items-center justify-between mb-3 border-b border-indigo-200 pb-2">
            <span className="text-base font-semibold text-gray-700">性別</span>
            <span className="text-base font-medium text-indigo-600">
              {metrics.sex || '未設定'}
              {metrics.sex === '女'}
              {metrics.sex === '男'}
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

// 我的衣櫥分析元件 (保持不變)

const WardrobeAnalysis = () => {
  const items = [
    { name: "牛仔褲", wearCount: 25 }, { name: "白色 T 恤", wearCount: 15 },
    { name: "風衣外套", wearCount: 8 }, { name: "黑色洋裝", wearCount: 3 },
    { name: "A字裙", wearCount: 1 },
  ];
  const frequentlyWorn = items.filter(item => item.wearCount > 10);
  const infrequentlyWorn = items.filter(item => item.wearCount <= 10);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">我的衣櫥</h3>
      <div className="space-y-4">
        <section>
          <h4 className="font-semibold text-green-700">常穿衣物</h4>
          <ul className="list-disc list-inside mt-2 text-gray-600">
            {frequentlyWorn.map(item => <li key={item.name}>{item.name} ({item.wearCount} 次)</li>)}
          </ul>
        </section>
        <section>
          <h4 className="font-semibold text-amber-700">不常穿衣物</h4>
          <ul className="list-disc list-inside mt-2 text-gray-600">
            {infrequentlyWorn.map(item => <li key={item.name}>{item.name} ({item.wearCount} 次)</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
};


const analysisTabs = ["身體數據", "我的衣櫥"];

// 👇 確保這裡是 `export default`
export default function Analysis() {
  const [activeSubTab, setActiveSubTab] = useState(analysisTabs[0]);

  return (
    <div>
      <div className="flex gap-4 mb-4 border-b border-gray-200">
        {analysisTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2 font-medium -mb-px ${activeSubTab === tab ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {activeSubTab === "身體數據" && <BodyMetrics />}
        {activeSubTab === "我的衣櫥" && <WardrobeAnalysis />}
      </div>
    </div>
  );
}