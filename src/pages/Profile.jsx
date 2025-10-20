import { useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';
import PropTypes from "prop-types";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { Cog6ToothIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import PostCard from "../components/PostCard";
import StyledButton from "../components/ui/StyledButton";
import EditProfileModal from "./EditProfileModal";
import { useToast } from "../components/ToastProvider";

const StatItem = ({ count, label }) => (
  <div className="text-center"><div className="font-bold text-xl text-slate-700">{count}</div><div className="text-sm text-slate-500">{label}</div></div>
);

const TabButton = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 relative ${active ? "text-indigo-600" : "text-slate-500 hover:text-indigo-500"}`}>
    {label}
    {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-indigo-500 rounded-full" />}
  </button>
);

const MeasurementItem = ({ label, value, unit }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="bg-slate-100 p-3 rounded-lg text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800">{value} <span className="text-sm text-slate-400">{unit}</span></div>
    </div>
  );
};

export default function Profile() {
  const toast = useToast();
  const [tab, setTab] = useState("posts");
  const [user, setUser] = useState({
    displayName: "載入中...", bio: "", height: null, weight: null, bust: null, waist: null, hip: null, shoulder: null,
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 如果 URL query 包含 edit=1 則自動打開 modal
  const location = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const edit = params.get('edit');
      if (edit === '1' || edit === 'true') setIsModalOpen(true);
    } catch (e) { }
  }, [location.search]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const [r1, r2] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            signal: controller.signal,
          }),
          fetch("http://127.0.0.1:8000/api/v1/me/body_metrics", {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            signal: controller.signal,
          }),
        ]);

        let authData = {};
        if (r1.ok) authData = await r1.json().catch(() => ({}));
        let metrics = {};
        if (r2.ok) metrics = await r2.json().catch(() => ({}));

  // 優先使用 app_users 的 display_name (authData.display_name)，其次才使用 body_metrics.display_name
  // app_users 的自介欄位名稱為 interformation
  const displayName = (authData.display_name || metrics.display_name || authData.name || "用戶");
  const bio = authData.interformation || "";

        setUser({
          displayName,
          bio,
          height: metrics.height_cm ?? null,
          weight: metrics.weight_kg ?? null,
          bust: metrics.chest_cm ?? null,
          waist: metrics.waist_cm ?? null,
          hip: metrics.hip_cm ?? null,
          shoulder: metrics.shoulder_cm ?? null,
        });
      } catch (err) {
        if (err.name !== "AbortError") console.warn("取得使用者資料失敗：", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onProfileUpdated = (e) => {
      const detail = e?.detail || {};
      setUser(prev => ({
        ...prev,
        displayName: detail.display_name || prev.displayName,
        bio: prev.bio || '',
        height: detail.height_cm ?? prev.height,
        weight: detail.weight_kg ?? prev.weight,
        bust: detail.chest_cm ?? prev.bust,
        waist: detail.waist_cm ?? prev.waist,
        hip: detail.hip_cm ?? prev.hip,
        shoulder: detail.shoulder_cm ?? prev.shoulder,
      }));

      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const merged = {
          ...localUser,
          display_name: detail.display_name || localUser.display_name || user.displayName,
          bio: localUser.bio || user.bio || '',
          height: detail.height_cm ?? localUser.height ?? user.height,
          weight: detail.weight_kg ?? localUser.weight ?? user.weight,
          chest: detail.chest_cm ?? localUser.chest ?? user.bust,
          waist: detail.waist_cm ?? localUser.waist ?? user.waist,
          hip: detail.hip_cm ?? localUser.hip ?? user.hip,
          shoulder: detail.shoulder_cm ?? localUser.shoulder ?? user.shoulder,
        };
        localStorage.setItem('user', JSON.stringify(merged));
      } catch (err) {
      }
    };

    window.addEventListener('user-profile-updated', onProfileUpdated);
    return () => window.removeEventListener('user-profile-updated', onProfileUpdated);
  }, [user.displayName, user.bio, user.height, user.weight, user.bust, user.waist, user.hip, user.shoulder]);

  const handleSaveProfile = async (updatedData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("請先登入");
      return;
    }

    const payload = {
      display_name: updatedData.displayName || null,
      // note 已從後端 schema 移除，前端不再傳 note
      height_cm: updatedData.height ? Number(updatedData.height) : null,
      weight_kg: updatedData.weight ? Number(updatedData.weight) : null,
      chest_cm: updatedData.bust ? Number(updatedData.bust) : null,
      waist_cm: updatedData.waist ? Number(updatedData.waist) : null,
      hip_cm: updatedData.hip ? Number(updatedData.hip) : null,
      shoulder_cm: updatedData.shoulder ? Number(updatedData.shoulder) : null,
  // 將 modal 的自介寫入 app_users.interformation
  interformation: updatedData.bio ?? null,
    };

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/me/body_metrics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errObj = await res.json().catch(() => null);
        throw new Error(errObj?.detail || `儲存失敗 (status ${res.status})`);
      }

      const saved = await res.json();

      setUser(prev => ({
        ...prev,
        displayName: saved.display_name || updatedData.displayName,

        bio: updatedData.bio ?? "",
        height: saved.height_cm ?? updatedData.height,
        weight: saved.weight_kg ?? updatedData.weight,
        bust: saved.chest_cm ?? updatedData.bust,
        waist: saved.waist_cm ?? updatedData.waist,
        hip: saved.hip_cm ?? updatedData.hip,
        shoulder: saved.shoulder_cm ?? updatedData.shoulder,
      }));

      localStorage.setItem("user", JSON.stringify({
        display_name: saved.display_name || updatedData.displayName,
        bio: updatedData.bio ?? "",
        height: saved.height_cm ?? updatedData.height,
        weight: saved.weight_kg ?? updatedData.weight,
        chest: saved.chest_cm ?? updatedData.bust,
        waist: saved.waist_cm ?? updatedData.waist,
        hip: saved.hip_cm ?? updatedData.hip,
        shoulder: saved.shoulder_cm ?? updatedData.shoulder,
      }));

  setIsModalOpen(false);
  toast.addToast && toast.addToast({ type: 'success', title: '修改成功' });
    } catch (err) {
      console.error("儲存個人檔案失敗:", err);
      alert(`儲存失敗: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const avatarChar = user.displayName?.charAt(0)?.toUpperCase() || "?";

  return (
    <Layout title="個人檔案">
  <div className="page-wrapper" aria-busy={loading}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-2xl shadow-md w-full">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-4xl font-semibold text-slate-500">{avatarChar}</span>
              </div>
              <div className="flex-grow w-full text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-800">{user.displayName}</h1>
                <p className="text-slate-500 mt-1 text-sm">{user.bio}</p>
                <div className="mt-4 flex justify-center sm:justify-start items-center gap-4">
                  <StyledButton onClick={() => setIsModalOpen(true)}>
                    <PencilSquareIcon className="w-4 h-4" />
                    編輯檔案
                  </StyledButton>
                  <Link to="/settings">
                    <StyledButton variant="secondary">
                      <Cog6ToothIcon className="w-4 h-4" />
                      設定
                    </StyledButton>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">穿搭資訊</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <MeasurementItem label="身高" value={user.height} unit="cm" />
                <MeasurementItem label="體重" value={user.weight} unit="kg" />
                <MeasurementItem label="胸圍" value={user.bust} unit="cm" />
                <MeasurementItem label="腰圍" value={user.waist} unit="cm" />
                <MeasurementItem label="臀圍" value={user.hip} unit="cm" />
                <MeasurementItem label="肩寬" value={user.shoulder} unit="cm" />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-center border-b border-slate-200">
              <TabButton label="貼文" active={tab === "posts"} onClick={() => setTab("posts")} />
              <TabButton label="收藏" active={tab === "collections"} onClick={() => setTab("collections")} />
              <TabButton label="粉絲" active={tab === "followers"} onClick={() => setTab("followers")} />
            </div>
            <div className="py-6">
              {tab === "posts" && <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><PostCard /></div>}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && <EditProfileModal user={user} onClose={() => setIsModalOpen(false)} onSave={handleSaveProfile} />}
    </Layout>
  );
}

StatItem.propTypes = { count: PropTypes.number, label: PropTypes.string };
TabButton.propTypes = { label: PropTypes.string.isRequired, active: PropTypes.bool, onClick: PropTypes.func };
MeasurementItem.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.any, unit: PropTypes.string };