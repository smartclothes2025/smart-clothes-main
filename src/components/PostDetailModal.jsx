// src/components/PostDetailModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Edit3, UserPlus, UserCheck, Share2 } from 'lucide-react';
import AskModal from './AskModal';
import { useToast } from './ToastProvider';

const API_BASE = import.meta.env.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

/** gs:// → https 可公開網址；http(s) 直接回傳 */
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

/** 從 media 陣列選封面 */
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
    cover?.gcsUrl ||
    null;
  return resolveGcsUrl(raw);
}

/** 將 media 項目補上 _view（先試簽名，失敗則公開網址） */
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
    if (direct) { out.push({ ...m, _view: direct }); continue; }

    const gcs = m?.gcs_uri || m?.image || null;
    if (!gcs) { out.push(m); continue; }

    let signed = await trySign(gcs);
    if (!signed) signed = resolveGcsUrl(gcs);
    out.push({ ...m, _view: signed });
  }
  return out;
}

export default function PostDetailModal({ postId, onClose }) {
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');

  // ESC 關閉
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 鎖定背景滾動
  useEffect(() => {
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(scrollX, scrollY);
    };
  }, []);

  // 載入貼文 + 評論
  useEffect(() => {
    if (!postId) return;
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
        const res = await fetch(`${API_BASE}/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: controller.signal,
        });
        if (res.status === 401) throw new Error("未授權，請重新登入");
        if (res.status === 404) throw new Error("找不到此貼文");
        if (!res.ok) throw new Error(`讀取貼文失敗 (${res.status})`);

        const data = await res.json();

        // 解析 media
        let mediaArr = [];
        try {
          mediaArr = Array.isArray(data.media) ? data.media : JSON.parse(data.media || "[]");
        } catch { mediaArr = []; }
        const resolvedMedia = await resolveMediaArray(mediaArr, token);

        // 作者資訊
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

        // 時間
        const createdTime = data.created_at ? new Date(data.created_at).toLocaleString('zh-TW') : '';

        // 判斷擁有者
        let currentUserId = null;
        if (token && token.startsWith('user-') && token.endsWith('-token')) {
          currentUserId = token.slice(5, -6);
        }
        if (!currentUserId) {
          try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUserId = currentUser.id;
          } catch { /* ignore */ }
        }
        const postUserId = data.user_id;
        const ownerMatch = currentUserId && postUserId && String(currentUserId) === String(postUserId);
        setIsOwner(!!ownerMatch);

        // 追蹤狀態（localStorage 模擬）
        if (!ownerMatch && postUserId) {
          try {
            const followList = JSON.parse(localStorage.getItem('followingUsers') || '[]');
            setIsFollowing(followList.includes(postUserId));
          } catch { /* ignore */ }
        }

        const likedList = (() => {
          try {
            return JSON.parse(localStorage.getItem('likedPosts') || '[]');
          } catch {
            return [];
          }
        })();

        const favoriteList = (() => {
          try {
            return JSON.parse(localStorage.getItem('favoritePosts') || '[]');
          } catch {
            return [];
          }
        })();

        const alreadyLiked = Array.isArray(likedList) && likedList.includes(data.id);
        const alreadyFavorited = Array.isArray(favoriteList) && favoriteList.includes(data.id);

        // 是否已按讚/收藏（綜合後端狀態與 localStorage）
        setIsLiked(!!data.liked_by_me || alreadyLiked);
        setIsFavorited(!!alreadyFavorited);

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

    const fetchComments = async () => {
      try {
        setCommentLoading(true);
        const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('評論載入失敗');
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setComments(normalized.map((c) => ({
          id: c.id,
          author: c.user?.display_name || c.user?.name || c.author || '訪客',
          avatar: resolveGcsUrl(c.user?.picture || null),
          content: c.content || '',
          createdAt: c.created_at ? new Date(c.created_at).toLocaleString('zh-TW') : '',
        })));
      } catch (err) {
        console.error('評論載入失敗:', err);
        setComments([]);
      } finally {
        setCommentLoading(false);
      }
    };

    fetchPost();
    fetchComments();
    return () => controller.abort();
  }, [postId]);

  // 點讚切換（toggle，可收回愛心）
  async function handleToggleLike() {
    if (!post) return;
    const token = localStorage.getItem("token");
    if (!token) {
      addToast({ type: 'error', title: '請先登入', message: '登入後才可按讚', autoDismiss: 3000 });
      return;
    }

    const prevLiked = isLiked;
    const prevCount = post.likes;

    // 樂觀更新：先在前端切換狀態
    const optimisticLiked = !prevLiked;
    setIsLiked(optimisticLiked);
    setPost(p => ({ ...p, likes: Math.max((p.likes ?? 0) + (optimisticLiked ? 1 : -1), 0) }));

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const rawText = await res.text();
      let data = {};
      try { data = JSON.parse(rawText || "{}"); } catch {}
      if (!res.ok) throw new Error(data.detail || rawText || `HTTP ${res.status}`);

      const serverCount = typeof data.like_count === "number" ? data.like_count : null;
      const serverLiked = typeof data.liked === "boolean" ? data.liked : null;

      const finalLiked = serverLiked !== null ? serverLiked : optimisticLiked;
      const delta = finalLiked === prevLiked ? 0 : (finalLiked ? 1 : -1);
      const newLikeCount = serverCount !== null
        ? serverCount
        : Math.max((prevCount ?? 0) + delta, 0);

      setIsLiked(finalLiked);
      setPost(p => ({ ...p, likes: newLikeCount }));

      try {
        let likedList = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        if (!Array.isArray(likedList)) likedList = [];
        if (finalLiked) {
          if (!likedList.includes(post.id)) {
            likedList.push(post.id);
          }
        } else {
          likedList = likedList.filter((pid) => pid !== post.id);
        }
        localStorage.setItem('likedPosts', JSON.stringify(likedList));
      } catch {}
    } catch (e) {
      // 回滾
      setIsLiked(prevLiked);
      setPost(p => ({ ...p, likes: prevCount }));
      console.error('like toggle failed:', e);
      addToast({ type: 'error', title: '按讚失敗', message: e.message || '請稍後再試', autoDismiss: 3000 });
    }

  }

  // 留言送出
  const handleCommentSubmit = async (e) => {
    e?.preventDefault?.();
    const trimmed = commentInput.trim();
    if (!trimmed || postingComment) return;

    const token = localStorage.getItem('token');
    if (!token) {
      addToast({ type: 'error', title: '請先登入', message: '登入後才可以留言', autoDismiss: 3000 });
      return;
    }

    try {
      setPostingComment(true);
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) throw new Error('留言失敗，請稍後再試');

      const data = await res.json();
      const newComment = {
        id: data.id,
        author: data.user?.display_name || data.user?.name || '我',
        avatar: resolveGcsUrl(data.user?.picture || null),
        content: data.content || trimmed,
        createdAt: data.created_at ? new Date(data.created_at).toLocaleString('zh-TW') : new Date().toLocaleString('zh-TW'),
      };

      setComments((prev) => [newComment, ...prev]);
      setCommentInput('');
      // 同步前端的計數（後端也會 +1）
      setPost(p => ({ ...p, comments: (p?.comments ?? 0) + 1 }));

      addToast({ type: 'success', title: '留言成功', message: '你的留言已送出', autoDismiss: 2000 });
    } catch (err) {
      console.error('留言失敗:', err);
      addToast({ type: 'error', title: '留言失敗', message: err.message || '請稍後再試', autoDismiss: 3000 });
    } finally {
      setPostingComment(false);
    }
  };

  // 刪除貼文
  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('刪除失敗');

      // 通知其他組件刷新
      window.dispatchEvent(new CustomEvent('post-deleted', { detail: { id: postId } }));
      addToast({ type: 'success', title: '刪除成功', message: '貼文已被刪除', autoDismiss: 3000 });
      onClose();
    } catch (err) {
      console.error('刪除貼文失敗:', err);
      addToast({ type: 'error', title: '刪除失敗', message: err.message || '未知錯誤', autoDismiss: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  // 追蹤/取消追蹤（呼叫後端，並同步 localStorage）
  const handleFollowToggle = async () => {
    if (!post?.user_id) return;
    const token = localStorage.getItem('token');
    if (!token) {
      addToast({ type: 'error', title: '請先登入', message: '登入後才可以追蹤其他使用者', autoDismiss: 3000 });
      return;
    }

    const prevFollowing = isFollowing;
    const optimisticFollowing = !prevFollowing;
    setIsFollowing(optimisticFollowing);
    setFollowLoading(true);

    try {
      const res = await fetch(`${API_BASE}/users/${post.user_id}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const rawText = await res.text();
      let data = {};
      try { data = JSON.parse(rawText || '{}'); } catch { }
      if (!res.ok) {
        throw new Error(data.detail || rawText || `HTTP ${res.status}`);
      }

      const serverFollowing = typeof data.following === 'boolean' ? data.following : null;
      const finalFollowing = serverFollowing !== null ? serverFollowing : optimisticFollowing;
      setIsFollowing(finalFollowing);

      try {
        let followList = JSON.parse(localStorage.getItem('followingUsers') || '[]');
        if (!Array.isArray(followList)) followList = [];
        if (finalFollowing) {
          if (!followList.includes(post.user_id)) followList.push(post.user_id);
        } else {
          followList = followList.filter((id) => id !== post.user_id);
        }
        localStorage.setItem('followingUsers', JSON.stringify(followList));
      } catch { }

      const message = finalFollowing ? `已追蹤 ${post.author}` : `已取消追蹤 ${post.author}`;
      addToast({
        type: 'success',
        title: finalFollowing ? '追蹤成功' : '取消追蹤成功',
        message,
        autoDismiss: 2000,
      });
    } catch (err) {
      console.error('追蹤操作失敗:', err);
      setIsFollowing(prevFollowing);
      addToast({ type: 'error', title: '操作失敗', message: err.message || '未知錯誤', autoDismiss: 3000 });
    } finally {
      setFollowLoading(false);
    }
  };

  // 收藏/取消收藏（呼叫後端，並同步 localStorage）
  const handleFavoriteToggle = async () => {
    if (!post) return;
    const token = localStorage.getItem('token');
    if (!token) {
      addToast({ type: 'error', title: '請先登入', message: '登入後才可以收藏貼文', autoDismiss: 3000 });
      return;
    }

    const prevFavorited = isFavorited;
    const optimisticFavorited = !prevFavorited;
    setIsFavorited(optimisticFavorited);
    setFavoriteLoading(true);

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/favorite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const rawText = await res.text();
      let data = {};
      try { data = JSON.parse(rawText || '{}'); } catch { }
      if (!res.ok) {
        throw new Error(data.detail || rawText || `HTTP ${res.status}`);
      }

      const serverFavorited = typeof data.favorited === 'boolean' ? data.favorited : null;
      const finalFavorited = serverFavorited !== null ? serverFavorited : optimisticFavorited;
      setIsFavorited(finalFavorited);

      try {
        let favoriteList = JSON.parse(localStorage.getItem('favoritePosts') || '[]');
        if (!Array.isArray(favoriteList)) favoriteList = [];
        if (finalFavorited) {
          if (!favoriteList.includes(post.id)) favoriteList.push(post.id);
        } else {
          favoriteList = favoriteList.filter((pid) => pid !== post.id);
        }
        localStorage.setItem('favoritePosts', JSON.stringify(favoriteList));
      } catch { }

      addToast({
        type: 'success',
        title: finalFavorited ? '已加入收藏' : '已取消收藏',
        message: finalFavorited ? '這篇貼文已加入收藏列表' : '已從收藏列表移除',
        autoDismiss: 2000,
      });
    } catch (err) {
      console.error('favorite toggle failed:', err);
      setIsFavorited(prevFavorited);
      addToast({ type: 'error', title: '收藏失敗', message: err.message || '請稍後再試', autoDismiss: 3000 });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleEdit = () => {
    if (!post) return;
    setEditTitle(post.title || '');
    setEditContent(post.content || '');
    setEditTag(post.tags || '');
    setEditVisibility(post.visibility || 'public');
    setIsEditing(true);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${postId}`;
    const shareData = {
      title: post?.title || 'SmartCloset 貼文',
      text: post?.content?.slice(0, 80) || '快來看看這篇穿搭分享！',
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        addToast({ type: 'success', title: '分享成功', message: '已呼叫系統分享選單', autoDismiss: 2000 });
        return;
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('分享失敗:', err);
        addToast({ type: 'error', title: '分享失敗', message: err.message || '無法完成分享', autoDismiss: 3000 });
      }
      return;
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        addToast({ type: 'success', title: '已複製連結', message: '貼文連結已複製到剪貼簿', autoDismiss: 2000 });
        return;
      } catch (err) {
        console.error('複製連結失敗:', err);
      }
    }
    addToast({ type: 'error', title: '分享不可用', message: '無法使用分享或複製連結功能', autoDismiss: 3000 });
  };

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  // 載入/錯誤狀態 UI
  if (loading || !post) {
    if (!loading && error) {
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">載入失敗</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                關閉
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">載入中...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">載入失敗</h3>
            <p className="text-gray-600 mb-6">{error || '找不到此貼文'}</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
              關閉
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-300 to-purple-100 px-3 py-4 flex items-center justify-between z-10 shadow-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            貼文詳情
          </h2>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <button onClick={handleEdit} className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 group" aria-label="編輯" title="編輯貼文">
                  <Edit3 className="w-5 h-5 text-white" />
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} disabled={deleting} className="p-2 rounded-full hover:bg-red-500/30 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed" aria-label="刪除" title="刪除貼文">
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </>
            )}
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 group" aria-label="分享" title="分享貼文">
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 group" aria-label="關閉">
              <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 md:p-8">
            {/* 標題 */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 break-words text-left">
                {post.title}
              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
            </div>

            {/* 作者 */}
            <div className="flex items-center mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <button
                type="button"
                onClick={() => {
                  if (!post?.user_id) return;
                  let currentUserId = null;
                  try {
                    const token = localStorage.getItem('token') || '';
                    if (token.startsWith('user-') && token.endsWith('-token')) {
                      currentUserId = token.slice(5, -6);
                    }
                  } catch {}
                  if (!currentUserId) {
                    try {
                      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                      currentUserId = localUser.id;
                    } catch {}
                  }
                  if (currentUserId && String(currentUserId) === String(post.user_id)) {
                    navigate('/profile');
                  } else {
                    navigate(`/user/${post.user_id}`);
                  }
                  if (typeof onClose === 'function') {
                    onClose();
                  }
                }}
                className="flex items-center flex-1 text-left focus:outline-none"
              >
                {post.avatar ? (
                  <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-white shadow-md" />
                ) : (
                  <div className="w-12 h-12 rounded-full mr-3 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border-2 border-white shadow-md">
                    <span className="text-white font-bold text-lg">{post.author?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                )}
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 leading-tight">{post.author}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {post.time}
                  </div>
                </div>
              </button>
              {!isOwner && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFollowing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
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

            {/* 文字內容 */}
            {post.content && (
              <div className="mb-6 text-left">
                <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed break-words">{post.content}</p>
              </div>
            )}

            {isEditing && (
              <div className="mb-6 text-left border border-indigo-100 rounded-2xl p-4 bg-indigo-50/40">
                <h3 className="text-base font-semibold text-gray-800 mb-3">編輯貼文內容</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">標題</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">內容</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[120px] rounded-lg border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">標籤（以逗號分隔）</label>
                    <input
                      type="text"
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">可見範圍</label>
                    <select
                      value={editVisibility}
                      onChange={(e) => setEditVisibility(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="public">公開</option>
                      <option value="friends">好友</option>
                      <option value="private">私人</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 text-sm hover:bg-gray-100"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!post) return;
                        const token = localStorage.getItem('token');
                        if (!token) {
                          addToast({ type: 'error', title: '無法編輯', message: '請先登入後再編輯貼文', autoDismiss: 3000 });
                          return;
                        }
                        try {
                          const res = await fetch(`${API_BASE}/posts/${postId}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                              Accept: 'application/json',
                            },
                            body: JSON.stringify({
                              title: editTitle,
                              content: editContent,
                              tag: editTag,
                              visibility: editVisibility,
                            }),
                          });
                          const rawText = await res.text();
                          let data = {};
                          try { data = JSON.parse(rawText || '{}'); } catch {}
                          if (!res.ok) {
                            throw new Error(data.detail || rawText || `HTTP ${res.status}`);
                          }
                          setPost((prev) => ({
                            ...prev,
                            title: data.title ?? editTitle,
                            content: data.content ?? editContent,
                            tags: data.tag ?? editTag,
                            visibility: data.visibility ?? editVisibility,
                          }));
                          setIsEditing(false);
                          addToast({ type: 'success', title: '已更新貼文', message: '貼文內容已儲存', autoDismiss: 2000 });
                        } catch (e) {
                          console.error('update post failed:', e);
                          addToast({ type: 'error', title: '編輯失敗', message: e.message || '請稍後再試', autoDismiss: 3000 });
                        }
                      }}
                      className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                    >
                      儲存變更
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 標籤 */}
            {post.tags && (
              <div className="mb-6 text-left flex flex-wrap gap-2">
                {post.tags.split(',').map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* 主圖 */}
            {post.coverImage && (
              <div className="mb-6">
                <img src={post.coverImage} alt={post.title || "貼文圖片"} className="w-full rounded-2xl object-cover shadow-2xl border-4 border-white ring-1 ring-gray-100" />
              </div>
            )}

            {/* 多圖 */}
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
                        <img src={img._view} alt={`圖片 ${idx + 2}`} className="w-full aspect-square object-cover shadow-md border-2 border-white ring-1 ring-gray-100 group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* 互動列 */}
            <div className="pt-6 border-t-2 border-gray-100">
              <div className="flex items-center gap-4 justify-center flex-wrap">
                {/* 讚 */}
                <button
                  onClick={handleToggleLike}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md
                    ${isLiked
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gradient-to-r from-pink-50 to-red-50 hover:from-pink-100 hover:to-red-100 text-gray-700 hover:text-red-600'
                    }`}
                >
                  <svg
                    className={`w-6 h-6 transition-all duration-200 ${isLiked ? 'fill-red-500' : 'group-hover:scale-125'}`}
                    fill={isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-bold">{post.likes}</span>
                  <span className="font-medium">{isLiked ? '已讚' : '讚'}</span>
                </button>

                {/* 評論數展示（按鈕留給 UI 一致性） */}
                <button className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 hover:text-indigo-600 px-6 py-3 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md">
                  <svg className="w-6 h-6 group-hover:scale-110 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-bold">{post.comments}</span>
                  <span className="font-medium">評論</span>
                </button>

                {/* 收藏 */}
                <button
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                    ${isFavorited
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-gray-700 hover:text-yellow-700'
                    }`}
                >
                  <svg
                    className={`w-6 h-6 transition-all duration-200 ${isFavorited ? 'fill-yellow-500' : 'group-hover:scale-110'}`}
                    fill={isFavorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 4a2 2 0 012-2h10a2 2 0 012 2v17l-7-4-7 4V4z"
                    />
                  </svg>
                  <span className="font-medium">{isFavorited ? '已收藏' : '收藏'}</span>
                </button>
              </div>

              {/* 評論區 */}
              <div className="mt-8 pt-6 border-t-2 border-gray-100 text-left">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  評論區
                </h4>

                <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="分享你的看法..."
                    className="w-full min-h-[100px] rounded-2xl border border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 bg-white/80 backdrop-blur px-4 py-3 text-gray-700 placeholder-gray-400 transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!commentInput.trim() || postingComment}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {postingComment ? '送出中...' : '送出留言'}
                    </button>
                  </div>
                </form>

                {commentLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                    載入評論中...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-gray-500 bg-gray-50 rounded-xl px-4 py-3 border border-dashed border-gray-200">
                    尚無留言，成為第一個分享想法的人吧！
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3 bg-white/80 backdrop-blur rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
                        {comment.avatar ? (
                          <img src={comment.avatar} alt={comment.author} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {comment.author?.charAt(0)?.toUpperCase() || '訪'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">{comment.author}</span>
                            <span className="text-sm text-gray-400">{comment.createdAt}</span>
                          </div>
                          <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 刪除確認 */}
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
