// src/components/wardrobe/Analysis.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../../pages/EditProfileModal';
import { useToast } from '../../components/ToastProvider';

// 假設的身體數據 (只保留數值，單位在旁邊顯示)
const initialMetrics = {
  height: '165', weight: '55', bust: '85', shoulder: '40',
  waist: '68', hips: '92', shoeSize: '24.5'
};
// 單位物件，方便管理
const units = {
  height: 'cm', weight: 'kg', bust: 'cm', shoulder: 'cm',
  waist: 'cm', hips: 'cm', shoeSize: ''
};

// 身體數據元件 (已更新為可編輯)
// 身體數據元件（加入：身材類型判斷 + 結果顯示）
const BodyMetrics = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  const loadProfileForModal = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      const [r1, r2] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('http://127.0.0.1:8000/api/v1/me/body_metrics', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);
      let auth = {};
      if (r1 && r1.ok) auth = await r1.json().catch(() => ({}));
      let bm = {};
      if (r2 && r2.ok) bm = await r2.json().catch(() => ({}));

      const userObj = {
        displayName: auth.display_name || bm.display_name || auth.name || '',
        bio: auth.interformation || '',
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

  const handleModalSave = async (updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      const payload = {
        display_name: updatedData.displayName || null,
        interformation: updatedData.bio ?? null,
        height_cm: updatedData.height ? Number(updatedData.height) : null,
        weight_kg: updatedData.weight ? Number(updatedData.weight) : null,
        chest_cm: updatedData.bust ? Number(updatedData.bust) : null,
        waist_cm: updatedData.waist ? Number(updatedData.waist) : null,
        hip_cm: updatedData.hip ? Number(updatedData.hip) : null,
        shoulder_cm: updatedData.shoulder ? Number(updatedData.shoulder) : null,
      };

      const res = await fetch('http://127.0.0.1:8000/api/v1/me/body_metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `HTTP ${res.status}`);
      }
      const saved = await res.json().catch(() => ({}));
      // update local metrics and profileUser
      setMetrics(prev => ({
        ...prev,
        height: saved.height_cm != null ? String(saved.height_cm) : prev.height,
        weight: saved.weight_kg != null ? String(saved.weight_kg) : prev.weight,
        bust: saved.chest_cm != null ? String(saved.chest_cm) : prev.bust,
        waist: saved.waist_cm != null ? String(saved.waist_cm) : prev.waist,
        hips: saved.hip_cm != null ? String(saved.hip_cm) : prev.hips,
        shoulder: saved.shoulder_cm != null ? String(saved.shoulder_cm) : prev.shoulder,
        shoeSize: saved.shoe_size != null ? String(saved.shoe_size) : prev.shoeSize,
      }));
      setProfileUser(updatedData);
      setIsProfileModalOpen(false);
      toast.addToast && toast.addToast({ type: 'success', title: '修改成功' });
      try {
        const eventDetail = saved || {};
        const localUser = {
          display_name: eventDetail.display_name || profileUser?.displayName || '',
          bio: profileUser?.bio || '',
          height: eventDetail.height_cm ?? profileUser?.height ?? '',
          weight: eventDetail.weight_kg ?? profileUser?.weight ?? '',
          chest: eventDetail.chest_cm ?? profileUser?.bust ?? '',
          waist: eventDetail.waist_cm ?? profileUser?.waist ?? '',
          hip: eventDetail.hip_cm ?? profileUser?.hip ?? '',
          shoulder: eventDetail.shoulder_cm ?? profileUser?.shoulder ?? '',
        };
        localStorage.setItem('user', JSON.stringify(localUser));
        window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: eventDetail }));
      } catch (e) {
        // non-fatal
      }
    } catch (err) {
      console.error('儲存失敗', err);
      setError(err.message || String(err));
      toast.addToast && toast.addToast({ type: 'error', title: '儲存失敗', description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  // helper to map backend fields to frontend keys
  const mapFromServer = (data) => ({
    height: data.height_cm != null ? String(data.height_cm) : '',
    weight: data.weight_kg != null ? String(data.weight_kg) : '',
    bust: data.chest_cm != null ? String(data.chest_cm) : '',
    shoulder: data.shoulder_cm != null ? String(data.shoulder_cm) : '',
    waist: data.waist_cm != null ? String(data.waist_cm) : '',
    hips: data.hip_cm != null ? String(data.hip_cm) : '',
    shoeSize: data.shoe_size != null ? String(data.shoe_size) : '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/api/v1/me/body_metrics', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok && res.status !== 200) {
          // If 401 or other, don't crash UI — keep defaults
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        // backend may return only display_name when no metrics exist
        if (data && (data.height_cm || data.weight_kg || data.chest_cm || data.waist_cm || data.hip_cm || data.shoulder_cm || data.shoe_size)) {
          setMetrics(prev => ({ ...prev, ...mapFromServer(data) }));
        } else {
          // no metrics yet — keep defaults but allow editing
        }
      } catch (err) {
        console.warn('載入身體數據失敗', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetrics(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        height_cm: metrics.height !== '' ? Number(metrics.height) : null,
        weight_kg: metrics.weight !== '' ? Number(metrics.weight) : null,
        chest_cm: metrics.bust !== '' ? Number(metrics.bust) : null,
        waist_cm: metrics.waist !== '' ? Number(metrics.waist) : null,
        hip_cm: metrics.hips !== '' ? Number(metrics.hips) : null,
        shoulder_cm: metrics.shoulder !== '' ? Number(metrics.shoulder) : null,
      };

      const res = await fetch('http://127.0.0.1:8000/api/v1/me/body_metrics', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `HTTP ${res.status}`);
      }
      const saved = await res.json().catch(() => ({}));
      // update UI with canonical saved values
      setMetrics(prev => ({ ...prev, ...mapFromServer(saved) }));
      setIsEditing(false);
    } catch (err) {
      console.error('儲存身體數據失敗', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // ➊ 將字串轉為數字（空值 / 非數字會得到 NaN）
  const N = (v) => {
    const num = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(num) ? num : NaN;
  };

  // ➋ 依你給的規則判斷身材類型
  function getBodyType({ bust, waist, hips, shoulder }) {
    const B = N(bust), W = N(waist), H = N(hips), S2 = N(shoulder) * 2;
    if (![B, W, H, S2].every(Number.isFinite)) return null;

    // 沙漏：胸-腰 18~20 且 臀-腰 23~25（含臨界）
    const condHourglass = (B - W >= 18 && B - W <= 20) && (H - W >= 23 && H - W <= 25);
    if (condHourglass) return '沙漏型身材';

    // 蘋果：腰圍 > 臀圍
    if (W > H) return '蘋果型身材';

    // 倒三角：肩寬×2 - 臀圍 > 3
    if (S2 - H > 3) return '倒三角身材';

    // 梨型：臀圍 - 肩寬×2 > 3
    if (H - S2 > 3) return '梨型身材（酪梨身材）';

    // H 型：肩寬×2 與 臀圍差 < 3
    if (Math.abs(S2 - H) < 3) return 'H 型身材（矩形身材）';

    return '未分類（介於臨界，建議再量一次）';
  }

  const bodyType = getBodyType(metrics);

  const renderMetricItem = (key, label) => (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-gray-700">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            name={key}
            value={metrics[key]}
            onChange={handleInputChange}
            className="w-24 text-right p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {units[key] && <span className="text-gray-500">{units[key]}</span>}
        </div>
      ) : (
        <span className="font-medium text-black">{metrics[key]} {units[key]}</span>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">身體數據</h3>
        <div className="flex items-center gap-2">
          {loading && <div className="text-sm text-gray-400">儲存/載入中…</div>}
          {error && <div className="text-sm text-rose-600">錯誤</div>}
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              儲存
            </button>
          ) : (
            <button
              onClick={async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                  navigate('/');
                  return;
                }
                await loadProfileForModal();
              }}
              className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
            >
              編輯
            </button>
          )}
        </div>
      </div>

      {/* 數據列表 */}
      <div className="space-y-2">
        {renderMetricItem('height', '身高')}
        {renderMetricItem('weight', '體重')}
        {renderMetricItem('bust', '胸圍')}
        {renderMetricItem('shoulder', '肩寬')}
        {renderMetricItem('waist', '腰圍')}
        {renderMetricItem('hips', '臀圍')}
        {renderMetricItem('shoeSize', '鞋子尺寸')}
      </div>

      {/* ➌ 分析結果（即時根據目前輸入顯示） */}
      <div className="mt-6 p-4 rounded-xl border bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold mb-1">身材類型</div>
            <div className="text-gray-800">{bodyType ?? '請先完整輸入：肩寬、胸圍、腰圍、臀圍'}</div>
          </div>
          <div className="text-sm text-gray-500">資料來源：資料庫</div>
        </div>

        {/* 顯示判斷依據，方便對照與除錯 */}
        {['bust','waist','hips','shoulder'].every(k => Number.isFinite(N(metrics[k]))) && (
          <div className="mt-2 text-sm text-gray-500">
            依據：肩寬×2 = {(N(metrics.shoulder)*2).toFixed(1)} cm，
            胸-腰 = {(N(metrics.bust)-N(metrics.waist)).toFixed(1)} cm，
            臀-腰 = {(N(metrics.hips)-N(metrics.waist)).toFixed(1)} cm
          </div>
        )}
  </div>
  </div>
  {isProfileModalOpen && profileUser && (
        <EditProfileModal user={profileUser} onClose={() => setIsProfileModalOpen(false)} onSave={handleModalSave} />
      )}
    </>
  );
};

// 我的衣櫥分析元件 (維持不變)

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
      <div className="flex gap-4 mb-4">
        {analysisTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-1 font-medium ${activeSubTab === tab ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
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