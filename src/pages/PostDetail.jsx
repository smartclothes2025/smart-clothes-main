import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { useToast } from '../components/ToastProvider';

const API_BASE = import.meta.env.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

function resolveGcsUrl(gsOrHttp) {
    if (!gsOrHttp) return null;
    if (gsOrHttp.startsWith("http://") || gsOrHttp.startsWith("https://")) return gsOrHttp;
    if (gsOrHttp.startsWith("gs://")) {
        const without = gsOrHttp.replace("gs://", "");
        const slash = without.indexOf("/");
        if (slash > 0) {
            const bucket = without.slice(0, slash);
            const object = encodeURI(without.slice(slash + 1));
            return `https://storage.googleapis.com/${bucket}/${object}`;
        }
    }
    return gsOrHttp;
}

function pickCoverUrl(media) {
    if (!Array.isArray(media) || media.length === 0) return null;
    const cover = media.find((m) => m?.is_cover) || media[0];
    const raw =
        cover?._view ||
        cover?.authenticated_url ||
        cover?.url ||
        cover?.image_url ||
        cover?.image ||
        cover?.gcs_uri ||
        cover?.gcsUrl || null;
    return resolveGcsUrl(raw);
}

async function resolveMediaArray(mediaArr, token) {
    const trySign = async (gcsUri) => {
        const url = `${API_BASE}/media/signed-url?gcs_uri=${encodeURIComponent(gcsUri)}`;
        try {
            const r = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (r.ok) {
                const j = await r.json().catch(() => ({}));
                return j.authenticated_url || j.url || null;
            }
        } catch { }
        return null;
    };

    const out = [];
    for (const m of mediaArr || []) {
        const direct = m?.authenticated_url || m?.url || m?.image_url;
        if (direct) {
            out.push({ ...m, _view: direct });
            continue;
        }
        const gcs = m?.gcs_uri || m?.image || null;
        if (!gcs) {
            out.push(m);
            continue;
        }
        let signed = await trySign(gcs);
        if (!signed) {
            signed = resolveGcsUrl(gcs);
        }
        out.push({ ...m, _view: signed });
    }
    return out;
}

export default function PostDetail({ theme, setTheme }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liking, setLiking] = useState(false); // 避免連點

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("請先登入");
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchPost = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`${API_BASE}/posts/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    },
                    signal: controller.signal,
                });

                if (res.status === 401) {
                    throw new Error("未授權，請重新登入");
                }

                if (res.status === 404) {
                    throw new Error("找不到此貼文");
                }

                if (!res.ok) {
                    throw new Error(`讀取貼文失敗 (${res.status})`);
                }

                const data = await res.json();

                // 解析 media 陣列
                let mediaArr = [];
                try {
                    mediaArr = Array.isArray(data.media) ? data.media : JSON.parse(data.media || "[]");
                } catch {
                    mediaArr = [];
                }

                // 解析圖片 URL
                const resolvedMedia = await resolveMediaArray(mediaArr, token);

                // ✅ 取得作者資訊：從後端回傳的資料中取得
                // 後端應該已經 JOIN app_users 表並回傳 display_name 和 picture
                console.log('PostDetail - 完整貼文資料:', data); // 除錯用

                let authorName = "使用者";
                let authorAvatar = null;

                // 優先從貼文資料中的 user 物件取得 (後端可能已經 JOIN app_users)
                if (data.user) {
                    authorName = data.user.display_name || data.user.name || "使用者";
                    authorAvatar = resolveGcsUrl(data.user.picture || null);
                    console.log('從 data.user 取得:', { authorName, authorAvatar }); // 除錯用
                }
                // 如果沒有 user 物件，嘗試從 author 物件取得
                else if (data.author) {
                    authorName = data.author.display_name || data.author.name || "使用者";
                    authorAvatar = resolveGcsUrl(data.author.picture || null);
                    console.log('從 data.author 取得:', { authorName, authorAvatar }); // 除錯用
                }
                // 如果都沒有，嘗試直接從 data 取得 (有些後端會直接展開)
                else if (data.display_name) {
                    authorName = data.display_name;
                    authorAvatar = resolveGcsUrl(data.picture || null);
                    console.log('從 data 直接取得:', { authorName, authorAvatar }); // 除錯用
                }

                console.log('最終作者資訊:', { authorName, authorAvatar }); // 除錯用

                // 格式化時間
                const createdTime = data.created_at ? new Date(data.created_at).toLocaleString('zh-TW') : '';

                setPost({
                    id: data.id,
                    title: data.title || '無標題貼文',
                    content: data.content || '',
                    author: authorName,
                    avatar: authorAvatar,
                    time: createdTime,
                    images: resolvedMedia,
                    coverImage: pickCoverUrl(resolvedMedia),
                    likes: data.like_count ?? 0,
                    comments: data.comment_count ?? 0,
                    tags: data.tag || '',
                    visibility: data.visibility || 'public',
                });
            } catch (err) {
                if (err?.name !== "AbortError") {
                    console.error('獲取貼文失敗:', err);
                    setError(err.message || '載入失敗');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
        return () => controller.abort();
    }, [id]);

        const handleLike = async () => {
        if (!post) return;
        if (liking) return; // 正在送出就不要重複按

        const token = localStorage.getItem("token");
        if (!token) {
            addToast({
                type: "error",
                title: "按讚失敗",
                message: "請先登入後再按讚。",
                autoDismiss: 4000,
            });
            return;
        }

        setLiking(true);
        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}/like`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const rawText = await res.text();
            console.log("like response raw:", res.status, rawText);
            let data = {};
            try {
                data = JSON.parse(rawText || "{}");
            } catch {}

            if (!res.ok) {
                throw new Error(data.detail || `HTTP ${res.status}`);
            }

            // 依照後端回傳的 like_count 更新
            const newLikeCount =
                typeof data.like_count === "number"
                    ? data.like_count
                    : (post.likes ?? 0) + 1;

            setPost((prev) => ({
                ...prev,
                likes: newLikeCount,
            }));
        } catch (err) {
            console.error("like error:", err);
            addToast({
                type: "error",
                title: "按讚失敗",
                message: err.message || "請稍後再試。",
                autoDismiss: 4000,
            });
        } finally {
            setLiking(false);
        }
    };

    if (loading) {
        return (
            <Layout theme={theme} setTheme={setTheme} customClass="bg-gray-50"> {/* 確保佈局背景色不同 */}
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="text-xl text-slate-500">載入中...</div>
                </div>
            </Layout>
        );
    }

    if (error || !post) {
        return (
            <Layout theme={theme} setTheme={setTheme} customClass="bg-gray-50"> {/* 確保佈局背景色不同 */}
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6">
                    <div className="text-xl mb-4 text-red-600 font-semibold">{error || '找不到此貼文'}</div>
                    <button
                        onClick={() => navigate('/post')}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
                    >
                        返回貼文列表
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="貼文" customClass="bg-gray-50">
            <div className="page-wrapper h-full overflow-y-auto py-8">
                <br />
                <button
                    onClick={() => {
                        // 如果有歷史記錄，返回上一頁；否則跳轉到 /profile
                        if (window.history.length > 1 && location.key !== 'default') {
                            navigate(-1);
                        } else {
                            navigate('/profile');
                        }
                    }}
                    className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                    <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    返回
                </button>

                {/* 貼文內容主卡片 */}
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"> 
                    <div className="p-6 md:p-8">

                        {/* 標題 - 確保沒有置中樣式 */}
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 break-words text-left">
                            {post.title}
                        </h1>

                        {/* 作者資訊 */}
                        <div className="flex items-center mb-6 border-b pb-4">
                            {post.avatar ? (
                                <img
                                    src={post.avatar}
                                    alt={post.author}
                                    className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-gray-300"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                                    <span className="text-gray-600 font-bold text-lg">
                                        {post.author?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                </div>
                            )}
                            <div className="text-left"> {/* 確保文字左對齊 */}
                                <h3 className="font-bold text-gray-800 leading-tight">{post.author}</h3>
                                <p className="text-xs text-gray-500">{post.time}</p>
                            </div>
                        </div>

                        {/* 貼文內容 (文字) - 確保沒有置中樣式 */}
                        {post.content && (
                            <div className="mb-6 text-left">
                                <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                                    {post.content}
                                </p>
                            </div>
                        )}

                        {/* 標籤 */}
                        {post.tags && (
                            <div className="mb-6 text-left">
                                {post.tags.split(',').map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mr-2 mb-2"
                                    >
                                        #{tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 貼文圖片 (主圖) */}
                    {post.coverImage && (
                        <div className="mb-6 px-6 md:px-8">
                            <img
                                src={post.coverImage}
                                alt={post.title || "貼文圖片"}
                                className="w-full rounded-xl object-cover shadow-lg border border-gray-200 aspect-video"
                            />
                        </div>
                    )}

                    {/* 多張圖片顯示 (縮圖) */}
                    {post.images && post.images.length > 1 && (
                        <div className="mb-6 px-6 md:px-8 text-left">
                            <h4 className="font-semibold text-gray-700 mb-3">其他圖片 ({post.images.filter(img => img._view !== post.coverImage).length})</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {post.images.filter(img => img._view !== post.coverImage).map((img, idx) => (
                                    img._view && (
                                        <img
                                            key={idx}
                                            src={img._view}
                                            alt={`圖片 ${idx + 2}`}
                                            className="w-full rounded-lg object-cover aspect-square shadow-sm border border-gray-100 hover:opacity-90 transition cursor-pointer"
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-6 md:p-8 border-t border-gray-200">
                        {/* 互動按鈕 */}
                        <div className="flex items-center gap-8 justify-center">
                            {/* 點讚按鈕 */}
                            <button
                            type="button"
                            onClick={handleLike}
                            disabled={liking}
                            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition group disabled:opacity-60 disabled:cursor-not-allowed"
                            >

                                <svg
                                    className="w-6 h-6 group-hover:scale-110 transition duration-150"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                <span className="font-semibold">{post.likes} 讚</span>
                            </button>

                            {/* 評論按鈕 */}
                            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition group">
                                <svg
                                    className="w-6 h-6 group-hover:translate-y-[-1px] transition duration-150"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                <span className="font-semibold">{post.comments} 評論</span>
                            </button>
                        </div>

                        {/* 評論區 */}
                        <div className="mt-8 pt-6 border-t border-gray-200 text-left">
                            <h4 className="text-xl font-bold text-gray-800 mb-4">評論區 (Comments)</h4>
                            <div className="bg-gray-50 text-gray-500 text-center py-6 rounded-lg border border-dashed border-gray-300">
                                <p className="font-medium">尚無評論或評論功能未實作</p>
                                <p className="text-sm mt-1">（待加入評論輸入框和列表）</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}