<template>
  <div class="container d-flex justify-content-center align-items-center min-vh-100">
    <HeaderLogin/>
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
            >
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
            >
          </div>

          <div v-if="showUsuarioError || showSenhaError" class="alert alert-warning">
            Por favor, preencha todos os campos obrigatórios.
          </div>

          <div v-if="loginError" class="alert alert-danger">
            {{ loginError }}
          </div>

          <button 
            type="submit" 
            class="btn-primary w-100 mt-3"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import HeaderLogin from '@/components/HeaderLogin.vue';

export default {
  name: 'TelaLogin',
  components: {
    HeaderLogin
  },
  data() {
    return {
      usuario: '',
      senha: '',
      showUsuarioError: false,
      showSenhaError: false,
      loginError: null,
      loading: false
    };
  },
  methods: {
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
      // Resetar estados de erro
      this.showUsuarioError = false;
      this.showSenhaError = false;
      this.loginError = null;
      this.loading = true;

      // Validação básica
      if (!this.usuario) this.showUsuarioError = true;
      if (!this.senha) this.showSenhaError = true;

      if (this.showUsuarioError || this.showSenhaError) {
        this.loginError = "Por favor, preencha todos os campos obrigatórios.";
        this.loading = false;
        return;
      }

      try {
        const cpfLimpo = this.usuario.replace(/\D/g, '');
        
        // 1. Buscar usuário no Firestore pelo CPF
        const q = query(
          collection(db, 'usuarios'),
          where("cpf", "==", cpfLimpo)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw { code: 'user-not-found' };
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // 2. Fazer login com email e senha
        await signInWithEmailAndPassword(auth, userData.email, this.senha);
        
        // 3. Redirecionamento seguro para a página principal
        if (this.$route.path !== '/principal') {
          await this.$router.replace('/principal');
        }
        
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
          this.loginError = 'Senha incorreta. Por favor, tente novamente.';
          break;
        case 'auth/user-not-found':
        case 'user-not-found':
          this.loginError = 'Usuário não encontrado. Verifique seu CPF.';
          break;
        case 'auth/too-many-requests':
          this.loginError = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/invalid-email':
          this.loginError = 'E-mail inválido associado a este CPF.';
          break;
        default:
          this.loginError = 'Erro ao fazer login. Tente novamente mais tarde.';
      }
    }
  }
};
</script>

<style scoped>
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

button{
  border-radius: 10px;
  color: white;
}

.btn-primary {
  background-color: #7ED321 ;
  border: none;
  padding: 10px;
  font-weight: 500;
}

.btn-primary:hover {
  background-color: #5a9e10 ;
}

.alert {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

@media (max-width: 576px) {
  .card-body {
    padding: 1.5rem;
  }
}
</style>