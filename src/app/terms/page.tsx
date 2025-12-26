export default function TermsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Termos de Uso
        </p>
        <h1 className="text-2xl font-semibold text-zinc-100">
          Termos de Uso da OUVI
        </h1>
        <p className="text-sm text-zinc-400">
          Estes termos descrevem como a OUVI funciona e o que esperamos da
          comunidade.
        </p>
      </header>

      <div className="space-y-4 text-sm text-zinc-300">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Uso da plataforma
          </h2>
          <p>
            A OUVI é um espaço para compartilhar momentos visuais e interações
            por áudio. Ao usar o serviço, você concorda em respeitar outras
            pessoas e manter o conteúdo apropriado.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Moderação e denúncias
          </h2>
          <p>
            Conteúdos que violem regras de segurança ou direitos de terceiros
            podem ser removidos. Denúncias são avaliadas pela equipe de
            moderação.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Coleta e uso de dados
          </h2>
          <p>
            Usamos informações mínimas de cadastro e perfil para manter a
            comunidade segura e oferecer a experiência da OUVI.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Retenção e exclusão
          </h2>
          <p>
            Mantemos dados enquanto sua conta estiver ativa. Você pode solicitar
            exclusão a qualquer momento pelos canais oficiais.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">Contato</h2>
          <p>
            Para dúvidas sobre estes termos, fale com suporte@ouvi.app.
          </p>
        </section>
      </div>
    </section>
  );
}
