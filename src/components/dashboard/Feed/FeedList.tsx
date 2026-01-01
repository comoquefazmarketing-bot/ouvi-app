"use client";
import React from 'react';
import PostCard from '../Post/PostCard';

interface FeedListProps {
  posts: any[];
  onOpenThread?: (post: any) => void;
}

export default function FeedList({ posts, onOpenThread }: FeedListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#00f2fe' }}>
        <h2 style={{ letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '900' }}>O SILÊNCIO É PROFUNDO.</h2>
        <p style={{ color: '#444', fontSize: '12px' }}>SEJA O PRIMEIRO A QUEBRÁ-LO.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onOpenThread={onOpenThread} />
      ))}
    </div>
  );
}