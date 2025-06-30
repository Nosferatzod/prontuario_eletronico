<template>
  <div id="app">
    <HeaderProntuario v-if="mostrarHeader" />
    <div class="main-content" :class="{ 'with-header': mostrarHeader }">
      <router-view/>
    </div>
    <FooterPrincipal/>
  </div>
</template>

<script>
import HeaderProntuario from '@/components/HeaderProntuario.vue';
import FooterPrincipal from '@/components/FooterPrincipal.vue';

export default {
  name: 'App',
  components: {
    HeaderProntuario,
    FooterPrincipal
  },
  computed: {
    mostrarHeader() {
      return this.$route.meta.requiresAuth;
    }
  }
};
</script>

<style>
/* Estilos globais para resetar margens e garantir que a página não role */
html, body {
  margin: 0;
  padding: 0;
  height: 100%; /* Garante que html e body ocupem 100% da altura da viewport */
/* PRINCIPAL: Impede a rolagem da página inteira */
}

#app {
  display: flex;
  flex-direction: column; /* Organiza os componentes filhos em coluna */
  min-height: 100vh; /* Garante que o #app ocupe a altura total da viewport */
  background-color: #f0f2f5; /* Cor de fundo geral, semelhante à imagem do login */
}

.main-content-area {
  display: flex;
  flex-direction: column; /* Organiza o conteúdo interno (TelaLogin) verticalmente */
  justify-content: center; /* Centraliza verticalmente o conteúdo */
  align-items: center; /* Centraliza horizontalmente o conteúdo */
  flex-grow: 1; /* Permite que esta área ocupe o espaço restante após o cabeçalho e a nav bar */
  /* Remove overflow: hidden daqui para permitir que o conteúdo interno, se crescer muito, role dentro desta área,
     mas a página principal ainda não rolará. Se quiser que nem esta área role, adicione de volta. */
  padding: 20px; /* Adiciona algum espaço ao redor do conteúdo */
  box-sizing: border-box;
}

/* Os estilos para HeaderProntuario, SecondaryNavBar e TelaLogin (e seus sub-elementos)
   devem estar dentro de seus respectivos arquivos Vue em <style scoped>. */

/* Exemplo de estilos em HeaderProntuario.vue (se você não tiver ainda) */
/*
.app-header {
  background-color: #4A90E2;
  color: white;
  padding: 15px 20px;
  height: 60px;
  flex-shrink: 0;
}
*/

/* Exemplo de estilos em SecondaryNavBar.vue (se você não tiver ainda) */
/*
.secondary-nav-bar {
  background-color: #e0e0e0;
  height: 60px;
  flex-shrink: 0;
}
*/

/* Exemplo de estilos em TelaLogin.vue (se você não tiver ainda) */
/*
.login-page-content {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-card {
  // ... estilos do card ...
}
*/
</style>