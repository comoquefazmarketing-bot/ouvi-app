export default function PrivacyPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Política de Privacidade
        </p>
        <h1 className="text-2xl font-semibold text-zinc-100">
          Política de Privacidade da OUVI
        </h1>
        <p className="text-sm text-zinc-400">
          Transparência sobre os dados que coletamos e como usamos.
        </p>
      </header>

      <div className="space-y-4 text-sm text-zinc-300">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Quais dados coletamos
          </h2>
          <p>
            Coletamos dados de cadastro, informações de perfil e conteúdos que
            você publica (foto, vídeo, texto e metadados necessários).
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Como usamos seus dados
          </h2>
          <p>
            Utilizamos os dados para entregar a experiência da OUVI, personalizar
            o feed e garantir segurança, incluindo prevenção a abusos.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Retenção e exclusão
          </h2>
          <p>
            Mantemos os dados pelo tempo necessário para operar a plataforma.
            Você pode solicitar exclusão ou exportação a qualquer momento.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Moderação e denúncias
          </h2>
          <p>
            Usamos ferramentas e processos para moderar conteúdos e permitir que
            a comunidade denuncie abusos.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">Contato</h2>
          <p>
            Para dúvidas ou solicitações, escreva para privacidade@ouvi.app.
          </p>
        </section>
      </div>
    </section>
  );
}
