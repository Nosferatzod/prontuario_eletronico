<template>
  <header id="header" class="navbar navbar-expand-lg navbar-dark fixed-top">
    <div class="container-fluid">
      <router-link to="/principal" class="navbar-brand d-flex align-items-center">
        <img src="../assets/LogoProntuario.png" alt="Logo PEP" class="me-2" style="height: 40px;">
        <span class="d-none d-md-inline">PEP - Prontuário Eletrônico Personalizado</span>
      <div class="container-fluid d-flex justify-content-between align-items-center" :class="{ 'show': menuOpen }" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
          </li>
        </ul>
      </div>
      </router-link>
    </div>
  </header>
</template>

<script>
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default {
  name: 'HeaderLogin',
  methods: {
        toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    async fazerLogout() {
      try {
        await signOut(auth);
        this.$router.push('/');
      } catch (erro) {
        console.error("Erro ao fazer logout:", erro);
        alert("Ocorreu um erro ao tentar sair");
      }
    }
  }
};
</script>

<style scoped>
@import 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap';

#header {
  background-color: #5a9deb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 30px;
  gap: 15px;
  font-family: 'Montserrat';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
.navbar {
  padding: 0.5rem 1rem;
}
#header img {
  height: 50px;
  width: auto;
}

#header h1 {
  margin: 0;
  color: white;
  font-size: 1.5em;
  flex-grow: 1;
  text-align: center;
}

.botao-sair {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.botao-sair:hover {
  background-color: #cc0000;
}

.logout-icon {
  font-size: 14px;
  margin-right: 5px;
}
</style>