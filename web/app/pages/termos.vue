<template>
  <div class="pa-4 pb-10 legal-page">
    <div class="legal-header mb-6">
      <h1 class="app-page-title text-h5 mb-1">Termos de Uso</h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Última atualização: 12 de agosto de 2026
      </p>
    </div>

    <v-card class="legal-card rounded-xl pa-5 elevation-1">
      <section class="legal-section">
        <h2>1. Sobre o ChurchApp</h2>
        <p>
          O ChurchApp é uma plataforma de gestão para igrejas, oferecida por meio do site
          churchapp.site, que ajuda pastores e líderes a organizar membros, ministérios, escalas
          de serviço, devocionais, pedidos de oração, avisos e a página pública da igreja. Ao
          criar uma conta ou usar o ChurchApp, você concorda com estes Termos de Uso e com a
          nossa <NuxtLink to="/privacidade">Política de Privacidade</NuxtLink>.
        </p>
      </section>

      <section class="legal-section">
        <h2>2. Cadastro e conta</h2>
        <p>
          Para usar o ChurchApp, o pastor titular cria uma conta com nome, e-mail, telefone e
          senha, e cadastra os dados da igreja. Você é responsável por manter suas credenciais em
          sigilo e por tudo o que acontecer na sua conta. Membros da igreja podem receber acesso
          próprio, criado pelo pastor ou por um administrador da igreja.
        </p>
        <p>
          Você garante que as informações fornecidas são verdadeiras e que tem autorização para
          representar a igreja cadastrada.
        </p>
      </section>

      <section class="legal-section">
        <h2>3. Planos e cobrança</h2>
        <p>
          O ChurchApp tem um plano <strong>Free</strong>, com o essencial pra igreja rodar no dia
          a dia, e um plano <strong>Pro</strong>, pago, que libera recursos adicionais. Toda igreja
          nova recebe automaticamente 90 dias de teste gratuito do plano Pro, sem necessidade de
          cadastrar cartão.
        </p>
        <p>
          A assinatura do plano Pro é processada pelo Mercado Pago, com cobrança recorrente mensal
          no valor informado na tela de planos no momento da assinatura. Você pode cancelar a
          qualquer momento pela tela "Planos" dentro do app — o cancelamento é enviado
          imediatamente ao Mercado Pago e você mantém acesso ao Pro até o fim do período já pago.
        </p>
        <p>
          Se um pagamento falhar, você tem um prazo de carência para regularizar antes de perder o
          acesso aos recursos do Pro. Não fazemos reembolso de períodos já cobrados, salvo
          exigência legal ou decisão nossa em caso específico.
        </p>
      </section>

      <section class="legal-section">
        <h2>4. Uso permitido</h2>
        <p>Ao usar o ChurchApp, você concorda em não:</p>
        <ul>
          <li>Usar a plataforma para fins ilegais ou para prejudicar terceiros;</li>
          <li>
            Tentar acessar dados de outras igrejas ou contas sem autorização, ou burlar limites
            técnicos da plataforma;
          </li>
          <li>Enviar spam, conteúdo ofensivo ou malicioso através das notificações ou avisos;</li>
          <li>Revender ou redistribuir o acesso ao ChurchApp sem autorização por escrito.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>5. Conteúdo inserido por você</h2>
        <p>
          Você é responsável pelos dados que cadastra no ChurchApp — informações de membros,
          escalas, devocionais, pedidos de oração, avisos, letras e cifras de músicas, fotos e
          demais conteúdos ("Conteúdo do Usuário"). Você garante ter os direitos necessários para
          inserir esse conteúdo e autoriza o ChurchApp a armazená-lo e exibi-lo dentro da
          plataforma, inclusive na página pública da igreja quando você optar por publicá-la.
        </p>
        <p>
          Pedidos de oração marcados como privados são moderados apenas por quem sua igreja
          autorizar; conteúdo marcado como público pode ficar visível a qualquer visitante da
          página da igreja.
        </p>
      </section>

      <section class="legal-section">
        <h2>6. Propriedade intelectual</h2>
        <p>
          O ChurchApp, sua marca, design e código-fonte pertencem aos seus desenvolvedores. Você
          recebe uma licença de uso não exclusiva para usar a plataforma enquanto sua conta
          estiver ativa. Isso não te transfere nenhuma propriedade sobre o software.
        </p>
      </section>

      <section class="legal-section">
        <h2>7. Disponibilidade e limitação de responsabilidade</h2>
        <p>
          Fazemos o possível para manter o ChurchApp disponível e funcionando corretamente, mas
          não garantimos operação livre de interrupções ou erros. Na máxima extensão permitida por
          lei, não nos responsabilizamos por danos indiretos decorrentes do uso ou da
          impossibilidade de uso da plataforma.
        </p>
      </section>

      <section class="legal-section">
        <h2>8. Cancelamento e encerramento de conta</h2>
        <p>
          Você pode encerrar sua conta a qualquer momento entrando em contato pelo suporte. Também
          podemos suspender ou encerrar contas que violem estes Termos, mediante aviso sempre que
          possível. Ao encerrar a conta, seus dados são tratados conforme descrito na nossa
          <NuxtLink to="/privacidade">Política de Privacidade</NuxtLink>.
        </p>
      </section>

      <section class="legal-section">
        <h2>9. Alterações nestes Termos</h2>
        <p>
          Podemos atualizar estes Termos de tempos em tempos. Mudanças relevantes serão
          comunicadas dentro do app ou por e-mail. O uso continuado do ChurchApp após uma
          atualização significa que você concorda com os novos termos.
        </p>
      </section>

      <section class="legal-section">
        <h2>10. Contato</h2>
        <p>
          Dúvidas sobre estes Termos podem ser enviadas para
          <a href="mailto:contato@churchapp.site">contato@churchapp.site</a>.
        </p>
      </section>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "not-app-bottom" });
</script>

<style scoped>
.legal-page {
  max-width: 760px;
  margin: 0 auto;
}

.legal-card {
  border: 1px solid var(--app-color-border, #e5e7eb);
  background: var(--app-color-surface, #fff);
}

.legal-section {
  margin-bottom: 24px;
}

.legal-section:last-child {
  margin-bottom: 0;
}

.legal-section h2 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--app-color-text, #111827);
}

.legal-section p {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--app-color-text-soft, #374151);
  margin-bottom: 10px;
}

.legal-section p:last-child {
  margin-bottom: 0;
}

.legal-section ul {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--app-color-text-soft, #374151);
  padding-left: 20px;
  margin-bottom: 10px;
}

.legal-section li {
  margin-bottom: 4px;
}

.legal-section a {
  color: var(--app-color-accent, #B5472A);
  font-weight: 600;
}
</style>
