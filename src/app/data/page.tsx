export default function DataPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Dados pessoais
        </p>
        <h1 className="text-2xl font-semibold text-zinc-100">
          Solicitar dados ou exclusão
        </h1>
        <p className="text-sm text-zinc-400">
          Como exercer seus direitos de LGPD na OUVI.
        </p>
      </header>

      <div className="space-y-4 text-sm text-zinc-300">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Quais dados coletamos
          </h2>
          <p>
            Armazenamos dados de conta, perfil e conteúdos enviados na OUVI para
            operar o serviço com segurança.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Como usamos
          </h2>
          <p>
            Usamos seus dados para autenticação, personalização e prevenção de
            abuso.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Retenção e exclusão
          </h2>
          <p>
            Mantemos dados enquanto sua conta estiver ativa. Você pode solicitar
            exclusão completa e receber confirmação do processo.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Como solicitar download
          </h2>
          <p>
            Envie um e-mail para dados@ouvi.app informando seu @username e a
            solicitação de exportação. Responderemos com o status em até 10 dias.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">
            Moderação e denúncias
          </h2>
          <p>
            A OUVI mantém processos de moderação. Se encontrar abuso ou conteúdo
            inadequado, reporte para moderacao@ouvi.app.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">Contato</h2>
          <p>
            Dúvidas sobre privacidade podem ser direcionadas para
            privacidade@ouvi.app.
          </p>
        </section>
      </div>
    </section>
  );
}
