<template>
  <div>
    <div v-if="!currentUser">
      <!-- Tela de Login -->
      <div class="container d-flex justify-content-center align-items-center min-vh-100">
        <div class="card login-card">
          <div class="card-body p-4 p-md-5">
            <h2 class="card-title text-center mb-4">Entrar no Sistema</h2>
            <form @submit.prevent="login">
              <div class="mb-3">
                <label for="usuario" class="form-label">CPF:</label>
                <input
                  id="usuario"
                  type="text"
                  v-model="usuario"
                  @input="formatarCPF($event)"
                  maxlength="14"
                  class="form-control"
                  :class="{ 'is-invalid': showUsuarioError }"
                  placeholder="Digite seu CPF"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="senha" class="form-label">Senha:</label>
                <input
                  id="senha"
                  type="password"
                  v-model="senha"
                  class="form-control"
                  :class="{ 'is-invalid': showSenhaError }"
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              <div v-if="showUsuarioError || showSenhaError" class="alert alert-warning">
                Por favor, preencha todos os campos obrigatórios.
              </div>
              <div v-if="loginError" class="alert alert-danger">
                {{ loginError }}
              </div>

              <button type="submit" class="btn-primary w-100 mt-3" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
                {{ loading ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Tela Principal -->
      <div class="container-fluid mt-5 pt-4">
        <nav class="navbar navbar-expand-lg navbar-light bg-light mb-3">
          <div class="container-fluid">
            <div class="navbar-collapse">
              <ul class="navbar-nav">
                <!-- Cadastros -->
                <li class="nav-item dropdown" v-if="isAdmin || isRecepcao">
                  <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggleDropdown('cadastros')">
                    Cadastros
                  <i class="fas fa-chevron-down seta" :class="{ rotacionada: dropdowns.cadastros }"></i>
                  </a>
                  <ul class="dropdown-menu" :class="{ 'show': dropdowns.cadastros }">
                    <li v-if="isAdmin">
                      <router-link to="/cadastro" class="dropdown-item">Usuários</router-link>
                    </li>
                    <li>
                      <router-link to="/cadastropaciente" class="dropdown-item">Pacientes</router-link>
                    </li>
                  </ul>
                </li>

                <!-- Enfermagem -->
                <li class="nav-item dropdown" v-if="isEnfermeiro || isTecnico || isAdmin">
                 <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggleDropdown('enfermagem')">
                  Enfermagem
                  <i class="fas fa-chevron-down seta" :class="{ rotacionada: dropdowns.enfermagem }"></i>
                  </a>
                  <ul class="dropdown-menu" :class="{ 'show': dropdowns.enfermagem }">
                    <li v-if="isEnfermeiro || isAdmin">
                      <router-link to="/triagem" class="dropdown-item">Triagem</router-link>
                    </li>
                    <li>
                      <router-link to="/relatorio" class="dropdown-item">Relatório</router-link>
                    </li>
                    <li>
                      <router-link to="/prescricaoContentEnf" class="dropdown-item">Prescrição</router-link>
                    </li>
                  </ul>
                </li>

                <!-- Médico -->
                <li class="nav-item dropdown" v-if="isMedico || isAdmin">
                 <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggleDropdown('medico')">
                    Atendimento Médico
                  <i class="fas fa-chevron-down seta" :class="{ rotacionada: dropdowns.medico }"></i>
                  </a>
                  <ul class="dropdown-menu" :class="{ 'show': dropdowns.medico }">
                    <li>
                      <router-link to="/atendimento/evolucao" class="dropdown-item">Evolução</router-link>
                    </li>
                    <li>
                      <router-link to="/atendimento/prescricao" class="dropdown-item">Prescrição</router-link>
                    </li>
                  </ul>
                </li>

              </ul>
            </div>
          </div>
        </nav>

        <!-- Área de Conteúdo -->
        <div class="row">
          <div class="col-12">
            <router-view></router-view>
<div class="text-center imagem-centralizada" v-if="$route.path === '/principal'">
  <img src="@/assets/telaprincipal.png" alt="Figura Prontuário" class="img-fluid imagem-centralizada" />
</div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default {
  name: 'TelaPrincipal',
  data() {
    return {
      currentUser: null,
      userData: null,
      usuario: '',
      senha: '',
      showUsuarioError: false,
      showSenhaError: false,
      loginError: null,
      loading: false,
      dropdowns: {
        cadastros: false,
        enfermagem: false,
        medico: false
      }
    };
  },
  computed: {
    isAdmin() {
      return this.userData?.ocupacao === 'administrativo';
    },
    isRecepcao() {
      return this.userData?.ocupacao === 'recepcionista';
    },
    isEnfermeiro() {
      return this.userData?.ocupacao === 'enfermeiro';
    },
    isMedico() {
      return this.userData?.ocupacao === 'medico';
    },
    isTecnico() {
      return this.userData?.ocupacao === 'tecnico_enfermagem';
    }
  },
  async created() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUser = user;
        const q = query(collection(db, 'usuarios'), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.userData = querySnapshot.docs[0].data();
        }
      }
    });
  },
  methods: {
    toggleDropdown(menu) {
      this.dropdowns[menu] = !this.dropdowns[menu];
      Object.keys(this.dropdowns).forEach(key => {
        if (key !== menu) this.dropdowns[key] = false;
      });
    },
    formatarCPF(event) {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.substring(0, 11);
      let formatado = '';
      if (value.length > 0) formatado = value.substring(0, 3);
      if (value.length >= 4) formatado += '.' + value.substring(3, 6);
      if (value.length >= 7) formatado += '.' + value.substring(6, 9);
      if (value.length >= 10) formatado += '-' + value.substring(9, 11);
      this.usuario = formatado;
    },
    async login() {
      this.showUsuarioError = !this.usuario;
      this.showSenhaError = !this.senha;
      this.loginError = null;

      if (this.showUsuarioError || this.showSenhaError) {
        this.loginError = "Por favor, preencha todos os campos obrigatórios.";
        return;
      }

      this.loading = true;
      try {
        const cpfLimpo = this.usuario.replace(/\D/g, '');
        const q = query(collection(db, 'usuarios'), where("cpf", "==", cpfLimpo));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          this.loginError = 'Usuário não encontrado. Verifique seu CPF.';
          this.loading = false;
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const ocupacoesAutorizadas = ['administrativo', 'recepcionista', 'enfermeiro', 'tecnico_enfermagem', 'medico'];

        if (!ocupacoesAutorizadas.includes(userData.ocupacao)) {
          this.loginError = 'Seu perfil não possui autorização para acessar o sistema.';
          this.loading = false;
          return;
        }

        await signInWithEmailAndPassword(auth, userData.email, this.senha);
        this.currentUser = auth.currentUser;
        this.userData = userData;

      } catch (error) {
        console.error('Erro no login:', error);
        this.tratarErroLogin(error);
      } finally {
        this.loading = false;
      }
    },
    tratarErroLogin(error) {
      switch (error.code) {
        case 'auth/wrong-password':
          this.loginError = 'Senha incorreta.';
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          this.loginError = 'Credenciais inválidas.';
          break;
        case 'auth/too-many-requests':
          this.loginError = 'Muitas tentativas. Tente mais tarde.';
          break;
        case 'auth/network-request-failed':
          this.loginError = 'Erro de conexão. Verifique sua internet.';
          break;
        default:
          this.loginError = 'Erro ao fazer login.';
      }
    },
    async fazerLogout() {
      try {
        await auth.signOut();
        this.currentUser = null;
        this.userData = null;
        this.usuario = '';
        this.senha = '';
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    }
  }
};
</script>

<style scoped>
.nav-link.dropdown-toggle::after {
  display: none !important;
}

.seta {
  margin-left: 6px;
  transition: transform 0.3s ease;
}

.rotacionada {
  transform: rotate(180deg);
}

.min-vh-100 {
  min-height: 100vh;
}
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.card-title {
  color: #2c3e50;
  font-weight: 600;
}
button {
  border-radius: 10px;
  color: white;
}
.btn-primary {
  background-color: #7ED321;
  border: none;
  padding: 10px;
  font-weight: 500;
}
.btn-primary:hover {
  background-color: #5a9e10;
}
.alert {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}
.img-fluid {
  max-height: 300px;
  margin-top: 130px;
  width: auto;
  padding: 0px 0px;
}
</style>
