import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState({ title: "", content: "" });

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data } = await supabase.from('posts').select();
    setPosts(data);
  }

  async function createPost() {
    await supabase.from('posts').insert({ title: post.title, content: post.content });
    fetchPosts();
    setPost({ title: "", content: "" }); // フォームをクリア
  }

  return (
    <div>
      <h1>Matching Board</h1>
      
      {/* 投稿フォーム */}
      <input
        type="text"
        placeholder="Title"
        value={post.title}
        onChange={e => setPost({ ...post, title: e.target.value })}
      />
      <textarea
        placeholder="Content"
        value={post.content}
        onChange={e => setPost({ ...post, content: e.target.value })}
      />
      <button onClick={createPost}>Create Post</button>

      <hr />

      {/* 投稿一覧 */}
      <div>
        {posts.map((post) => (
          <div key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
