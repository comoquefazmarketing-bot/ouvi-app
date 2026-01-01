"use client";
import React from 'react';
import PostCard from '../components/dashboard/Post/PostCard';

export default function FeedList({ posts, onOpenThread }: any) {
  if (!posts || posts.length === 0) return null;

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} onOpenThread={onOpenThread} />
      ))}
    </div>
  );
}