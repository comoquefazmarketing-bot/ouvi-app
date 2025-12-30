import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function PerfilPage({ params }: { params: { username: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  );

  // 1. Busca os dados do perfil para o cabeçalho
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single();

  if (!profile) return notFound();

  // 2. Busca os posts desse perfil para a grade
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header do Perfil */}
      <div className="flex flex-col items-center pt-10 pb-8 border-b border-zinc-800">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src={profile.avatar_url || '/default-avatar.png'}
            alt={profile.username}
            fill
            className="rounded-full object-cover border-2 border-zinc-700"
          />
        </div>
        <h1 className="text-xl font-bold">@{profile.username}</h1>
        <p className="text-zinc-500 text-sm mt-1">{posts?.length || 0} publicações</p>
      </div>

      {/* Grade 3x3 */}
      <div className="grid grid-cols-3 gap-0.5 mt-1">
        {posts?.map((post) => (
          <div key={post.id} className="relative aspect-square bg-zinc-900 group cursor-pointer">
            {post.media_type === 'video' ? (
              <video 
                src={post.media_url} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
              />
            ) : post.media_type === 'image' ? (
              <Image
                src={post.media_url}
                alt="Post"
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full border border-zinc-800">
                <span className="text-[10px] text-zinc-500">ÁUDIO</span>
              </div>
            )}
            
            {/* Overlay de hover */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
               <span className="text-white text-xs font-bold">VER</span>
            </div>
          </div>
        ))}
      </div>

      {/* Se não tiver nada */}
      {(!posts || posts.length === 0) && (
        <div className="text-center py-20 text-zinc-600">
          <p>Nenhuma publicação ainda.</p>
        </div>
      )}
    </div>
  );
}