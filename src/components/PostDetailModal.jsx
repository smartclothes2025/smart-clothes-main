import { useState, useEffect } from 'react';
import { X, Trash2, Edit3, UserPlus, UserCheck } from 'lucide-react';
import AskModal from './AskModal';
import { useToast } from './ToastProvider';

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

export default function PostDetailModal({ postId, onClose }) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (!postId) return;

        // 重置狀態，確保每次都從載入中開始
        setPost(null);
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
            setError("請先登入");
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchPost = async () => {
            try {
                // 這裡不需要再設置 setLoading(true) 因為上面已經設置了

                const res = await fetch(`${API_BASE}/posts/${postId}`, {
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

                // 取得作者資訊
                let authorName = "使用者";
                let authorAvatar = null;

                if (data.user) {
                    authorName = data.user.display_name || data.user.name || "使用者";
                    authorAvatar = resolveGcsUrl(data.user.picture || null);
                } else if (data.author) {
                    authorName = data.author.display_name || data.author.name || "使用者";
                    authorAvatar = resolveGcsUrl(data.author.picture || null);
                } else if (data.display_name) {
                    authorName = data.display_name;
                    authorAvatar = resolveGcsUrl(data.picture || null);
                }

                // 格式化時間
                const createdTime = data.created_at ? new Date(data.created_at).toLocaleString('zh-TW') : '';

                // 檢查是否為貼文擁有者（使用外部的 token 變量）
                let currentUserId = null;
                
                // 從 token 中解析 user_id（格式：user-{uuid}-token）
                if (token && token.startsWith('user-') && token.endsWith('-token')) {
                    currentUserId = token.slice(5, -6); // 移除 'user-' 前綴和 '-token' 後綴
                }
                
                // 備用：從 localStorage 中的 user 物件取得
                if (!currentUserId) {
                    try {
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        currentUserId = currentUser.id;
                    } catch (e) {
                        console.error('解析 user 資料失敗:', e);
                    }
                }
                
                const postUserId = data.user_id;
                const ownerMatch = currentUserId && postUserId && String(currentUserId) === String(postUserId);
                
                console.log('🔍 擁有者檢查:', {
                    currentUserId,
                    postUserId,
                    ownerMatch,
                    token: token ? token.substring(0, 20) + '...' : 'no token'
                });
                
                setIsOwner(ownerMatch);

                // 檢查是否已追蹤此用戶（從 localStorage 讀取）
                if (!ownerMatch && postUserId) {
                    try {
                        const followList = JSON.parse(localStorage.getItem('followingUsers') || '[]');
                        setIsFollowing(followList.includes(postUserId));
                    } catch (e) {
                        console.error('讀取追蹤列表失敗:', e);
                    }
                }

                setPost({
                    id: data.id,
                    user_id: data.user_id,
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
    }, [postId]);

    // 刪除貼文
    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error('刪除失敗');
            }

            // 通知其他組件更新
            window.dispatchEvent(new CustomEvent('post-deleted', { detail: { id: postId } }));
            
            // 顯示成功提示
            addToast({
                type: 'success',
                title: '刪除成功',
                message: '貼文已被刪除',
                autoDismiss: 3000
            });
            
            // 關閉 Modal
            onClose();
        } catch (err) {
            console.error('刪除貼文失敗:', err);
            addToast({
                type: 'error',
                title: '刪除失敗',
                message: err.message || '未知錯誤',
                autoDismiss: 5000
            });
        } finally {
            setDeleting(false);
        }
    };

    // 編輯貼文（待實作）
    const handleEdit = () => {
        addToast({
            type: 'info',
            title: '功能開發中',
            message: '編輯功能尚在開發中，敬請期待！',
            autoDismiss: 3000
        });
        // TODO: 實作編輯功能
    };

    // 追蹤/取消追蹤用戶
    const handleFollowToggle = async () => {
        if (!post?.user_id) return;
        
        setFollowLoading(true);
        try {
            // TODO: 實作後端追蹤 API
            // const token = localStorage.getItem("token");
            // const endpoint = isFollowing 
            //     ? `${API_BASE}/users/${post.user_id}/unfollow`
            //     : `${API_BASE}/users/${post.user_id}/follow`;
            // const res = await fetch(endpoint, {
            //     method: 'POST',
            //     headers: { Authorization: `Bearer ${token}` }
            // });
            
            // 暫時使用 localStorage 模擬
            const followList = JSON.parse(localStorage.getItem('followingUsers') || '[]');
            let newFollowList;
            let message;
            
            if (isFollowing) {
                // 取消追蹤
                newFollowList = followList.filter(id => id !== post.user_id);
                message = `已取消追蹤 ${post.author}`;
            } else {
                // 追蹤
                newFollowList = [...followList, post.user_id];
                message = `已追蹤 ${post.author}`;
            }
            
            localStorage.setItem('followingUsers', JSON.stringify(newFollowList));
            setIsFollowing(!isFollowing);
            
            addToast({
                type: 'success',
                title: isFollowing ? '取消追蹤成功' : '追蹤成功',
                message: message,
                autoDismiss: 2000
            });
        } catch (err) {
            console.error('追蹤操作失敗:', err);
            addToast({
                type: 'error',
                title: '操作失敗',
                message: err.message || '未知錯誤',
                autoDismiss: 3000
            });
        } finally {
            setFollowLoading(false);
        }
    };

    // 點擊背景關閉
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // ESC 鍵關閉
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // 防止背景滾動並保存滾動位置
    useEffect(() => {
        // 保存當前滾動位置
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // 固定 body 位置以防止滾動
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = `-${scrollX}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        
        return () => {
            // 恢復 body 樣式
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            
            // 恢復滾動位置
            window.scrollTo(scrollX, scrollY);
        };
    }, []);

    // 優先顯示載入中狀態（包括還沒有資料的情況）
    if (loading || !post) {
        // 如果有明確的錯誤且不在載入中，才顯示錯誤
        if (!loading && error) {
            return (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
                >
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">載入失敗</h3>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        
        // 否則顯示載入中
        return (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleBackdropClick}
            >
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">載入中...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 如果有錯誤（這個情況理論上不會到達，因為上面已經處理了）
    if (error) {
        return (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleBackdropClick}
            >
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">載入失敗</h3>
                        <p className="text-gray-600 mb-6">{error || '找不到此貼文'}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                        >
                            關閉
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* 關閉按鈕 - 改進設計 */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between z-10 shadow-lg">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        貼文詳情
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* 編輯和刪除按鈕（僅擁有者可見） */}
                        {isOwner && (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 group"
                                    aria-label="編輯"
                                    title="編輯貼文"
                                >
                                    <Edit3 className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    disabled={deleting}
                                    className="p-2 rounded-full hover:bg-red-500/30 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="刪除"
                                    title="刪除貼文"
                                >
                                    <Trash2 className="w-5 h-5 text-white" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 group"
                            aria-label="關閉"
                        >
                            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                    </div>
                </div>

                {/* 貼文內容 */}
                <div className="overflow-y-auto flex-1">
                <div className="p-6 md:p-8">
                    {/* 標題 - 更有設計感 */}
                    <div className="mb-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 break-words text-left">
                            {post.title}
                        </h1>
                        <div className="h-1 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
                    </div>

                    {/* 作者資訊 - 更現代化 */}
                    <div className="flex items-center mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                        {post.avatar ? (
                            <img
                                src={post.avatar}
                                alt={post.author}
                                className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-white shadow-md"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full mr-3 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border-2 border-white shadow-md">
                                <span className="text-white font-bold text-lg">
                                    {post.author?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                            </div>
                        )}
                        <div className="text-left flex-1">
                            <h3 className="font-bold text-gray-900 leading-tight">{post.author}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {post.time}
                            </div>
                        </div>
                        
                        {/* 追蹤按鈕（僅非擁有者顯示） */}
                        {!isOwner && (
                            <button
                                onClick={handleFollowToggle}
                                disabled={followLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isFollowing
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                                }`}
                            >
                                {isFollowing ? (
                                    <>
                                        <UserCheck className="w-4 h-4" />
                                        <span className="text-sm">已追蹤</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        <span className="text-sm">追蹤</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* 貼文內容 (文字) */}
                    {post.content && (
                        <div className="mb-6 text-left">
                            <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                                {post.content}
                            </p>
                        </div>
                    )}

                    {/* 標籤 - 更精緻 */}
                    {post.tags && (
                        <div className="mb-6 text-left flex flex-wrap gap-2">
                            {post.tags.split(',').map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 貼文圖片 (主圖) - 更好的陰影和邊框 */}
                    {post.coverImage && (
                        <div className="mb-6">
                            <img
                                src={post.coverImage}
                                alt={post.title || "貼文圖片"}
                                className="w-full rounded-2xl object-cover shadow-2xl border-4 border-white ring-1 ring-gray-100"
                            />
                        </div>
                    )}

                    {/* 多張圖片顯示 (縮圖) - 更精緻的網格 */}
                    {post.images && post.images.length > 1 && (
                        <div className="mb-6 text-left">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                更多圖片 ({post.images.filter(img => img._view !== post.coverImage).length})
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                {post.images.filter(img => img._view !== post.coverImage).map((img, idx) => (
                                    img._view && (
                                        <div key={idx} className="group relative overflow-hidden rounded-xl">
                                            <img
                                                src={img._view}
                                                alt={`圖片 ${idx + 2}`}
                                                className="w-full aspect-square object-cover shadow-md border-2 border-white ring-1 ring-gray-100 group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t-2 border-gray-100">
                        {/* 互動按鈕 - 更精緻的設計 */}
                        <div className="flex items-center gap-4 justify-center">
                            {/* 點讚按鈕 */}
                            <button className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-red-50 hover:from-pink-100 hover:to-red-100 text-gray-700 hover:text-red-600 px-6 py-3 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md">
                                <svg
                                    className="w-6 h-6 group-hover:scale-125 group-hover:fill-red-500 transition-all duration-200"
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
                                <span className="font-bold">{post.likes}</span>
                                <span className="font-medium">讚</span>
                            </button>

                            {/* 評論按鈕 */}
                            <button className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 hover:text-indigo-600 px-6 py-3 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md">
                                <svg
                                    className="w-6 h-6 group-hover:scale-110 transition-all duration-200"
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
                                <span className="font-bold">{post.comments}</span>
                                <span className="font-medium">評論</span>
                            </button>
                        </div>

                        {/* 評論區 - 更有設計感 */}
                        <div className="mt-8 pt-6 border-t-2 border-gray-100 text-left">
                            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                評論區
                            </h4>
                            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 text-gray-500 text-center py-8 rounded-2xl border-2 border-dashed border-indigo-200">
                                <svg className="w-12 h-12 text-indigo-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="font-semibold text-gray-700">尚無評論</p>
                                <p className="text-sm mt-1 text-gray-500">成為第一個留言的人！</p>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            
            {/* 刪除確認對話框 */}
            <AskModal
                open={showDeleteConfirm}
                title="刪除貼文"
                message="確定要刪除這篇貼文嗎？此操作無法復原。"
                confirmText="刪除"
                cancelText="取消"
                destructive={true}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
