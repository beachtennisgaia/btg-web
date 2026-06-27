import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — BTG Beach Tennis Gaia",
  description: "Como o BTG recolhe, usa e protege os teus dados pessoais.",
};

const LAST_UPDATED = "27 de junho de 2026";
const CONTACT_EMAIL = "geral@btgaia.pt";

export default function PrivacidadePage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
      <Link
        href="/"
        style={{ fontSize: 13, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 32 }}
      >
        ← Voltar ao início
      </Link>

      <h1 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 32, fontWeight: 700, color: "#111", marginBottom: 8 }}>
        Política de Privacidade
      </h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 40 }}>
        Última atualização: {LAST_UPDATED}
      </p>

      <Section title="1. Responsável pelo Tratamento">
        <p>
          O responsável pelo tratamento dos teus dados pessoais é a{" "}
          <strong>Associação BTG — Beach Tennis Gaia</strong>, com sede em Vila Nova de Gaia, Portugal.
        </p>
        <p>
          Contacto: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4A800" }}>{CONTACT_EMAIL}</a>
        </p>
      </Section>

      <Section title="2. Dados que Recolhemos">
        <p>Ao criares conta e usares a plataforma, recolhemos:</p>
        <ul>
          <li><strong>Nome e endereço de email</strong> — fornecidos no registo</li>
          <li><strong>Número de telemóvel</strong> — opcional, para contacto relativo a torneios</li>
          <li><strong>Sexo</strong> — opcional, para categorização em torneios</li>
          <li><strong>Nível de jogo</strong> — autodeclarado, para organização de competições</li>
          <li><strong>Inscrições em torneios e resultados</strong> — gerados pela participação na atividade da associação</li>
          <li><strong>Ranking e pontos</strong> — calculados com base nos resultados dos torneios</li>
          <li><strong>Posts e comentários</strong> — conteúdo publicado por ti na área de comunidade</li>
          <li><strong>Data de aceitação desta política</strong> — registo de consentimento</li>
        </ul>
      </Section>

      <Section title="3. Finalidade e Base Legal">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#F5F5F5" }}>
              <th style={thStyle}>Finalidade</th>
              <th style={thStyle}>Base legal (RGPD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Gestão de sócios e autenticação</td>
              <td style={tdStyle}>Execução de contrato — Art. 6.º, n.º 1, al. b)</td>
            </tr>
            <tr style={{ background: "#FAFAFA" }}>
              <td style={tdStyle}>Organização e inscrição em torneios</td>
              <td style={tdStyle}>Execução de contrato — Art. 6.º, n.º 1, al. b)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Ranking público com nomes de jogadores</td>
              <td style={tdStyle}>Interesse legítimo da associação — Art. 6.º, n.º 1, al. f)</td>
            </tr>
            <tr style={{ background: "#FAFAFA" }}>
              <td style={tdStyle}>Comunicações sobre atividades da associação</td>
              <td style={tdStyle}>Interesse legítimo — Art. 6.º, n.º 1, al. f)</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="4. Partilha com Terceiros">
        <p>
          A tua informação não é vendida nem partilhada para fins comerciais. Para operarmos a plataforma,
          recorremos aos seguintes subcontratantes, todos vinculados por Cláusulas Contratuais Tipo (CCT)
          em conformidade com o RGPD:
        </p>
        <ul>
          <li><strong>Clerk, Inc.</strong> (EUA) — autenticação e gestão de contas</li>
          <li><strong>Neon, Inc.</strong> (EUA) — base de dados</li>
          <li><strong>Vercel, Inc.</strong> (EUA) — alojamento web e armazenamento de imagens</li>
        </ul>
        <p>
          Estes fornecedores atuam exclusivamente segundo as nossas instruções e não podem usar os teus
          dados para fins próprios.
        </p>
      </Section>

      <Section title="5. Retenção de Dados">
        <p>
          Os teus dados são conservados enquanto mantiveres conta ativa na plataforma. Após o cancelamento,
          os dados necessários para cumprimento de obrigações legais (ex.: historial de competições)
          podem ser conservados de forma anonimizada.
        </p>
      </Section>

      <Section title="6. Os Teus Direitos">
        <p>Nos termos do RGPD, tens direito a:</p>
        <ul>
          <li><strong>Acesso</strong> — saber que dados temos sobre ti</li>
          <li><strong>Retificação</strong> — corrigir dados incorretos ou incompletos</li>
          <li><strong>Apagamento</strong> — solicitar a eliminação dos teus dados pessoais</li>
          <li><strong>Limitação</strong> — restringir o tratamento em determinadas circunstâncias</li>
          <li><strong>Portabilidade</strong> — receber os teus dados num formato estruturado</li>
          <li><strong>Oposição</strong> — opor-te ao tratamento baseado em interesse legítimo</li>
        </ul>
        <p>
          Para exerceres qualquer um destes direitos, contacta-nos em{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4A800" }}>{CONTACT_EMAIL}</a>.
          Respondemos no prazo de 30 dias.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Esta plataforma utiliza cookies estritamente necessários para o funcionamento da autenticação
          (sessão de utilizador). Não utilizamos cookies de rastreio ou publicidade.
        </p>
      </Section>

      <Section title="8. Autoridade de Controlo">
        <p>
          Tens o direito de apresentar reclamação à autoridade de controlo portuguesa:{" "}
          <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong> —{" "}
          <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" style={{ color: "#D4A800" }}>
            www.cnpd.pt
          </a>
        </p>
      </Section>

      <Section title="9. Alterações a esta Política">
        <p>
          Podemos atualizar esta política periodicamente. Em caso de alterações significativas,
          notificaremos os sócios por email. A data de última atualização é sempre indicada no topo desta página.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #F5C000" }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: "#333", display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </section>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 700,
  color: "#555",
  border: "1px solid #E5E5E5",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 14,
  color: "#333",
  border: "1px solid #E5E5E5",
  verticalAlign: "top",
};
