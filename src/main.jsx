import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bell, Bookmark, Camera, Heart, Home, Image, MessageCircle,
  MoreHorizontal, Plus, Search, Send, Sparkles, UserPlus, Users, X
} from 'lucide-react'
import './styles.css'

const currentUser = { id: 'me', name: 'Nandani Singh', handle: '@nandanisingh', initials: 'NS', bio: 'Collecting small moments and good ideas.', color: '#dcebd9' }

const initialUsers = [
  currentUser,
  { id: 'lina', name: 'Lina Cho', handle: '@linacho', initials: 'LC', bio: 'Designer, reader, occasional baker.', color: '#f0d9d4' },
  { id: 'marcus', name: 'Marcus Bell', handle: '@marcusbell', initials: 'MB', bio: 'Building things that make the internet feel human.', color: '#d8e1f0' },
  { id: 'sofia', name: 'Sofia Patel', handle: '@sofiapatel', initials: 'SP', bio: 'Photos, food, and places worth walking to.', color: '#f0e5c9' }
]

const initialPosts = [
  { id: 'p1', authorId: 'lina', text: 'A quiet morning, a warm cup of coffee, and a blank page. The best kind of reset.', time: '2h', likes: 42, comments: 7, liked: false, image: 'morning' },
  { id: 'p2', authorId: 'marcus', text: 'The most underrated feature in any product is making someone feel like they belong there.', time: '5h', likes: 86, comments: 13, liked: true },
  { id: 'p3', authorId: 'sofia', text: 'Found a new walking route today. Three blocks longer, twice as beautiful.', time: '1d', likes: 31, comments: 4, liked: false, image: 'walk' }
]

const initialNotifications = [
  { id: 'n1', text: 'Lina Cho liked your latest post.', time: '12 min ago', type: 'like', read: false },
  { id: 'n2', text: 'Marcus Bell started following you.', time: '1 hour ago', type: 'follow', read: false },
  { id: 'n3', text: 'Sofia Patel commented on a post you follow.', time: '3 hours ago', type: 'comment', read: true }
]

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function Avatar({ user, size = 'normal' }) {
  return <div className={`avatar ${size}`} style={{ background: user.color }}>{user.avatarUrl ? <img src={user.avatarUrl} alt={`${user.name} profile`} /> : user.initials}</div>
}

function App() {
  const [users, setUsers] = useState(() => load('ground-users', initialUsers).map(user => user.id === 'me' ? { ...user, ...currentUser } : user))
  const [posts, setPosts] = useState(() => load('ground-posts', initialPosts))
  const [following, setFollowing] = useState(() => load('ground-following', ['lina']))
  const [activeTab, setActiveTab] = useState('home')
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftImage, setDraftImage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [postAuthorId, setPostAuthorId] = useState('me')
  const [search, setSearch] = useState('')
  const [commenting, setCommenting] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [notifications, setNotifications] = useState(() => load('ground-notifications', initialNotifications))
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState(() => load('ground-bookmarks', []))

  useEffect(() => { localStorage.setItem('ground-users', JSON.stringify(users)) }, [users])
  useEffect(() => { localStorage.setItem('ground-posts', JSON.stringify(posts)) }, [posts])
  useEffect(() => { localStorage.setItem('ground-following', JSON.stringify(following)) }, [following])
  useEffect(() => { localStorage.setItem('ground-notifications', JSON.stringify(notifications)) }, [notifications])
  useEffect(() => { localStorage.setItem('ground-bookmarks', JSON.stringify(bookmarks)) }, [bookmarks])

  const getUser = id => users.find(user => user.id === id) ?? currentUser
  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return posts.filter(post => {
      const author = getUser(post.authorId)
      return !term || post.text.toLowerCase().includes(term) || author.name.toLowerCase().includes(term)
    })
  }, [posts, search, users])

  function createPost() {
    if (!draft.trim() && !draftImage) return
    setPosts([{ id: `p-${Date.now()}`, authorId: postAuthorId, text: draft.trim(), time: 'now', likes: 0, comments: 0, liked: false, imageUrl: draftImage }, ...posts])
    setDraft('')
    setDraftImage('')
    setPostAuthorId('me')
    setComposerOpen(false)
  }

  function selectImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5 MB.')
      event.target.value = ''
      return
    }
    setUploadError('')
    const reader = new FileReader()
    reader.onload = () => setDraftImage(String(reader.result))
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function toggleLike(id) {
    setPosts(posts.map(post => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post))
  }

  function addComment(id) {
    if (!commentText.trim()) return
    setPosts(posts.map(post => post.id === id ? { ...post, comments: post.comments + 1 } : post))
    setCommentText('')
    setCommenting(null)
  }

  function toggleFollow(id) {
    setFollowing(following.includes(id) ? following.filter(userId => userId !== id) : [...following, id])
  }

  function toggleBookmark(id) {
    setBookmarks(bookmarks.includes(id) ? bookmarks.filter(postId => postId !== id) : [...bookmarks, id])
  }

  function openNotifications() {
    setNotificationsOpen(!notificationsOpen)
    if (!notificationsOpen) setNotifications(notifications.map(notification => ({ ...notification, read: true })))
  }

  function clearNotifications() {
    setNotifications([])
    setNotificationsOpen(false)
  }

  function uploadProfilePhoto(userId, event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => setUsers(users.map(user => user.id === userId ? { ...user, avatarUrl: String(reader.result) } : user))
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">●</span> social media</div>
        <nav className="main-nav">
          <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}><Home size={19} /> Home</button>
          <button className={activeTab === 'discover' ? 'active' : ''} onClick={() => setActiveTab('discover')}><Sparkles size={19} /> Discover</button>
          <button onClick={() => setComposerOpen(true)}><Plus size={20} /> Create</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><Avatar user={currentUser} size="tiny" /> Profile</button>
        </nav>
        <div className="sidebar-bottom">
          <button className="notification-button" onClick={openNotifications}><Bell size={19} /> Notifications {notifications.some(notification => !notification.read) && <span className="notification-dot" />}</button>
          <button onClick={() => setActiveTab('bookmarks')} className={activeTab === 'bookmarks' ? 'active' : ''}><Bookmark size={19} /> Bookmarks</button>
          <div className="sidebar-user"><Avatar user={currentUser} size="small" /><div><strong>{currentUser.name}</strong><span>{currentUser.handle}</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <main className="content">
        <header className="mobile-header"><div className="brand"><span className="brand-mark">●</span> social media</div><Avatar user={currentUser} size="small" /></header>
        <div className="page-heading">
          <div><p className="eyebrow">{activeTab === 'discover' ? 'Explore' : activeTab === 'profile' ? 'Your space' : 'Your daily dose'}</p><h1>{activeTab === 'discover' ? 'Discover' : activeTab === 'profile' ? 'Profile' : 'Home'}</h1></div>
          <button className="icon-button search-toggle" aria-label="Search"><Search size={19} /></button>
        </div>

        {activeTab === 'profile' ? <Profile users={users} posts={posts} following={following} onFollow={toggleFollow} onAvatarUpload={uploadProfilePhoto} /> : activeTab === 'discover' ? <PeopleExplore users={users} following={following} search={search} setSearch={setSearch} onFollow={toggleFollow} onAvatarUpload={uploadProfilePhoto} /> : activeTab === 'bookmarks' ? <BookmarksView posts={posts.filter(post => bookmarks.includes(post.id))} users={users} onLike={toggleLike} onBookmark={toggleBookmark} bookmarks={bookmarks} /> : (
          <>
            <div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search posts or people" /></div>
            <button className="quick-composer" onClick={() => setComposerOpen(true)}><Avatar user={currentUser} size="small" /><span>Share something with your circle...</span><Image size={19} /></button>
            <section className="feed">
              <div className="feed-label"><span>{activeTab === 'discover' ? 'Trending this week' : 'Latest from your circle'}</span><button>Most recent ↓</button></div>
              {visiblePosts.map(post => <PostCard key={post.id} post={post} author={getUser(post.authorId)} onLike={toggleLike} onComment={() => setCommenting(commenting === post.id ? null : post.id)} commenting={commenting === post.id} commentText={commentText} setCommentText={setCommentText} addComment={addComment} onBookmark={toggleBookmark} bookmarked={bookmarks.includes(post.id)} />)}
              {!visiblePosts.length && <div className="empty-state"><Search size={26} /><h3>No posts found</h3><p>Try a different search term.</p></div>}
            </section>
          </>
        )}
      </main>

      <aside className="right-rail">
        <div className="rail-card">
          <div className="rail-title"><h2>People to follow</h2><Users size={18} /></div>
          {users.filter(user => user.id !== 'me').map(user => <div className="suggestion" key={user.id}><Avatar user={user} size="small" /><div className="suggestion-info"><strong>{user.name}</strong><span>{user.handle}</span></div><button className={following.includes(user.id) ? 'following' : ''} onClick={() => toggleFollow(user.id)}>{following.includes(user.id) ? 'Following' : 'Follow'}</button></div>)}
          <button className="see-all">See everyone →</button>
        </div>
        <div className="rail-note"><Sparkles size={18} /><div><strong>A kinder feed</strong><p>Less noise, more of what matters to you.</p></div></div>
        <footer>© 2025 Common Ground<br /><span>About · Guidelines · Privacy</span></footer>
      </aside>
      {notificationsOpen && <div className="notifications-panel"><div className="notifications-header"><div><h2>Notifications</h2><span>{notifications.length ? `${notifications.length} recent updates` : 'You’re all caught up'}</span></div><button onClick={clearNotifications}>Clear all</button></div>{notifications.length ? notifications.map(notification => <div className={`notification-item ${notification.read ? 'read' : ''}`} key={notification.id}><div className={`notification-icon ${notification.type}`}><Bell size={15} /></div><div><p>{notification.text}</p><span>{notification.time}</span></div></div>) : <div className="notifications-empty"><Bell size={22} /><p>No new notifications</p></div>}</div>}

      {composerOpen && <div className="modal-backdrop" onClick={() => setComposerOpen(false)}><div className="composer-modal" onClick={event => event.stopPropagation()}><div className="modal-header"><h2>Create a post</h2><button className="icon-button" onClick={() => setComposerOpen(false)}><X size={20} /></button></div><label className="author-picker">Post as <select value={postAuthorId} onChange={event => setPostAuthorId(event.target.value)}>{users.map(user => <option value={user.id} key={user.id}>{user.name} ({user.handle})</option>)}</select></label><div className="composer-author"><Avatar user={getUser(postAuthorId)} size="small" /><div><strong>{getUser(postAuthorId).name}</strong><span>Posting to their profile</span></div></div><textarea autoFocus value={draft} onChange={event => setDraft(event.target.value)} placeholder="What’s on your mind?" maxLength={500} />{draftImage && <div className="upload-preview"><img src={draftImage} alt="Selected upload preview" /><button className="icon-button" onClick={() => setDraftImage('')} aria-label="Remove selected image"><X size={17} /></button></div>}{uploadError && <p className="upload-error">{uploadError}</p>}<div className="composer-actions"><label className="upload-button"><Image size={18} /> Add image<input type="file" accept="image/*" onChange={selectImage} /></label><span>{draft.length}/500</span><button className="primary-button" onClick={createPost} disabled={!draft.trim() && !draftImage}>Publish <Send size={16} /></button></div></div></div>}
    </div>
  )
}

function PostCard({ post, author, onLike, onComment, commenting, commentText, setCommentText, addComment, onBookmark, bookmarked }) {
  return <article className="post-card"><div className="post-top"><Avatar user={author} /><div className="post-meta"><strong>{author.name}</strong><span>{author.handle} · {post.time}</span></div><button className="icon-button more"><MoreHorizontal size={19} /></button></div>{post.text && <p className="post-text">{post.text}</p>}{post.imageUrl ? <img className="uploaded-post-image" src={post.imageUrl} alt="Post upload" /> : post.image && <div className={`post-image ${post.image}`}><Camera size={25} /><span>{post.image === 'morning' ? 'slow mornings' : 'take the scenic route'}</span></div>}<div className="post-actions"><button className={post.liked ? 'liked' : ''} onClick={() => onLike(post.id)}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes}</button><button onClick={onComment}><MessageCircle size={18} /> {post.comments}</button><button className={bookmarked ? 'bookmarked' : ''} onClick={() => onBookmark?.(post.id)}><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} /></button><button><Send size={17} /></button></div>{commenting && <div className="comment-box"><input autoFocus value={commentText} onChange={event => setCommentText(event.target.value)} onKeyDown={event => event.key === 'Enter' && addComment(post.id)} placeholder="Write a thoughtful reply..." /><button onClick={() => addComment(post.id)}><Send size={16} /></button></div>}</article>
}

function Profile({ users, posts, following, onFollow, onAvatarUpload }) {
  const [selected, setSelected] = useState('me')
  const user = users.find(item => item.id === selected) ?? currentUser
  const userPosts = posts.filter(post => post.authorId === user.id)
  return <section className="profile-view"><div className="profile-cover" /><div className="profile-intro"><div className="profile-avatar-upload"><Avatar user={user} size="large" /><label className="avatar-camera" aria-label={`Upload ${user.name}'s profile photo`}><Camera size={14} /><input type="file" accept="image/*" onChange={event => onAvatarUpload(user.id, event)} /></label></div><div className="profile-actions">{user.id !== 'me' && <button className={following.includes(user.id) ? 'following profile-follow' : 'primary-button profile-follow'} onClick={() => onFollow(user.id)}>{following.includes(user.id) ? 'Following' : 'Follow'}</button>}</div><h2>{user.name}</h2><span className="handle">{user.handle}</span><p>{user.bio}</p><div className="profile-stats"><span><strong>{userPosts.length}</strong> posts</span><span><strong>{user.id === 'me' ? following.length : 128}</strong> following</span><span><strong>{user.id === 'me' ? 214 : 842}</strong> followers</span></div></div><div className="profile-switcher"><strong>People</strong>{users.filter(item => item.id !== 'me').map(item => <button key={item.id} className={selected === item.id ? 'selected' : ''} onClick={() => setSelected(item.id)}>{item.name}</button>)}</div>{userPosts.length ? userPosts.map(post => <PostCard key={post.id} post={post} author={user} onLike={() => {}} onComment={() => {}} />) : <div className="empty-state"><UserPlus size={26} /><h3>Your story starts here</h3><p>Share a thought and it will appear on your profile.</p></div>}</section>
}

function PeopleExplore({ users, following, search, setSearch, onFollow, onAvatarUpload }) {
  const people = users.filter(user => {
    if (user.id === 'me') return false
    const term = search.trim().toLowerCase()
    return !term || user.name.toLowerCase().includes(term) || user.handle.toLowerCase().includes(term) || user.bio.toLowerCase().includes(term)
  })

  return <section className="people-explore">
    <div className="explore-intro">
      <div>
        <p className="eyebrow">Find your people</p>
        <h2>Explore people</h2>
        <p>Discover thoughtful voices and find new perspectives to add to your feed.</p>
      </div>
      <Users size={36} strokeWidth={1.2} />
    </div>
    <div className="search-box explore-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search people" /></div>
    <div className="people-grid">
      {people.map(user => <article className="person-card" key={user.id}>
        <div className="person-avatar-upload"><Avatar user={user} size="large" /><label className="avatar-camera" aria-label={`Upload ${user.name}'s profile photo`}><Camera size={13} /><input type="file" accept="image/*" onChange={event => onAvatarUpload(user.id, event)} /></label></div>
        <h3>{user.name}</h3>
        <span className="handle">{user.handle}</span>
        <p>{user.bio}</p>
        <div className="person-stats"><span><strong>{user.id === 'lina' ? 284 : user.id === 'marcus' ? 619 : 421}</strong> followers</span><span><strong>{user.id === 'lina' ? 38 : user.id === 'marcus' ? 72 : 46}</strong> posts</span></div>
        <button className={following.includes(user.id) ? 'following person-follow' : 'primary-button person-follow'} onClick={() => onFollow(user.id)}>{following.includes(user.id) ? 'Following' : 'Follow'}</button>
      </article>)}
    </div>
    {!people.length && <div className="empty-state"><Users size={26} /><h3>No people found</h3><p>Try searching for another name or interest.</p></div>}
  </section>
}

function BookmarksView({ posts, users, onLike, onBookmark, bookmarks }) {
  const getUser = id => users.find(user => user.id === id) ?? currentUser
  return <section className="bookmarks-view"><div className="bookmarks-intro"><Bookmark size={27} /><div><p className="eyebrow">Your collection</p><h2>Bookmarks</h2><p>Keep the posts you want to come back to.</p></div></div>{posts.length ? posts.map(post => <PostCard key={post.id} post={post} author={getUser(post.authorId)} onLike={onLike} onComment={() => {}} onBookmark={onBookmark} bookmarked={bookmarks.includes(post.id)} />) : <div className="empty-state"><Bookmark size={26} /><h3>No bookmarks yet</h3><p>Save a post with the bookmark icon and it will appear here.</p></div>}</section>
}

createRoot(document.getElementById('root')).render(<App />)

export default App
