<template>
  <div class="cadastro-container">
    <h1>Cadastro de Usuário</h1>
    <form @submit.prevent="cadastrarUsuario">
      <div class="form-group">
        <label>Nome Completo:<span>*</span></label>
        <input v-model="usuario.nome" type="text" required />
      </div>

      <div class="form-group">
        <label>CPF:<span>*</span></label>
        <input
          v-model="usuario.cpf"
          type="text"
          @input="formatarCPF"
          maxlength="14"
          required
        />
      </div>

      <div class="form-group">
        <label>E-mail:<span>*</span></label>
        <input v-model="usuario.email" type="email" required />
      </div>

      <div class="form-group">
        <label>Ocupação:<span>*</span></label>
        <select v-model="usuario.ocupacao" @change="resetRegistro" required>
          <option value="" disabled>Selecione</option>
          <option value="administrativo">Administrador</option>
          <option value="medico">Médico</option>
          <option value="enfermeiro">Enfermeiro</option>
          <option value="tecnico_enfermagem">Técnico de Enfermagem</option>
          <option value="recepcionista">Recepcionista</option>
        </select>
      </div>

      <div class="form-group" v-if="mostrarCampoRegistro">
        <label>{{ labelRegistro }}:<span>*</span></label>
        <input
          v-model="usuario.registro"
          type="text"
          required
          :placeholder="placeholderRegistro"
        />
      </div>

      <div class="form-group">
        <label>Senha:<span>*</span></label>
        <input v-model="usuario.senha" type="password" required minlength="6" />
      </div>

      <div class="form-group">
        <label>Confirmar Senha:<span>*</span></label>
        <input v-model="usuario.confirmarSenha" type="password" required />
      </div>

      <div v-if="erro" class="error-message">{{ erro }}</div>

      <div class="botoes-container">
        <button type="submit" class="botao-verde" :disabled="carregando">
          <span v-if="!carregando">Cadastrar</span>
          <span v-else class="loading">
            <span class="loading-dot">.</span>
            <span class="loading-dot">.</span>
            <span class="loading-dot">.</span>
          </span>
        </button>
        <router-link
          to="/principal"
          class="botao-sair"
          :class="{ disabled: carregando }"
          >Cancelar</router-link
        >
      </div>
    </form>
  </div>
</template>

<script>
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

export default {
  name: "TelaCadastro",
  data() {
    return {
      usuario: {
        nome: "",
        cpf: "",
        email: "",
        ocupacao: "",
        registro: "",
        senha: "",
        confirmarSenha: "",
      },
      erro: "",
      carregando: false,
    };
  },
  computed: {
    mostrarCampoRegistro() {
      return [
        "medico",
        "enfermeiro",
        "tecnico_enfermagem",
      ].includes(this.usuario.ocupacao);
    },
    labelRegistro() {
      switch (this.usuario.ocupacao) {
        case "medico":
          return "CRM";
        case "enfermeiro":
          return "COREN";
        case "tecnico_enfermagem":
          return "Registro Técnico";
        default:
          return "Registro";
      }
    },
    placeholderRegistro() {
      switch (this.usuario.ocupacao) {
        case "medico":
          return "Ex: 123456/SP";
        case "enfermeiro":
          return "Ex: 123456/SP";
        case "tecnico_enfermagem":
          return "Ex: 123456";
        default:
          return "";
      }
    },
  },
  methods: {
    resetRegistro() {
      this.usuario.registro = "";
    },

    formatarCPF() {
      let cpf = this.usuario.cpf.replace(/\D/g, "");
      if (cpf.length > 3) cpf = cpf.replace(/^(\d{3})/, "$1.");
      if (cpf.length > 6) cpf = cpf.replace(/^(\d{3})\.(\d{3})/, "$1.$2.");
      if (cpf.length > 9)
        cpf = cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, "$1.$2.$3-");
      this.usuario.cpf = cpf.substring(0, 14);
    },

    async cadastrarUsuario() {
      this.erro = "";
      this.carregando = true;

      try {
        // Verifica senhas
        if (this.usuario.senha !== this.usuario.confirmarSenha) {
          throw new Error("As senhas não coincidem!");
        }

        if (this.usuario.senha.length < 6) {
          throw new Error("A senha deve ter no mínimo 6 caracteres!");
        }

        // Valida registro profissional quando aplicável
        if (this.mostrarCampoRegistro && !this.usuario.registro.trim()) {
          throw new Error(`O campo ${this.labelRegistro} é obrigatório!`);
        }

        // Valida CPF
        const cpfLimpo = this.usuario.cpf.replace(/\D/g, "");
        if (!this.validarCPF(cpfLimpo)) {
          throw new Error("CPF inválido!");
        }

        // Verifica se CPF já existe no Firestore (opcional mas recomendado)
        const docRef = doc(db, "usuarios", cpfLimpo);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          throw new Error("CPF já cadastrado!");
        }

        // Cria usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          this.usuario.email,
          this.usuario.senha
        );

        // Prepara dados para salvar no Firestore
        const userData = {
          nome: this.usuario.nome,
          cpf: cpfLimpo,
          email: this.usuario.email,
          ocupacao: this.usuario.ocupacao,
          uid: userCredential.user.uid,
        };

        if (this.usuario.registro) {
          userData.registro = this.usuario.registro;
        }

        await setDoc(doc(db, "usuarios", cpfLimpo), userData);

        // Redireciona para página principal após sucesso
        this.$router.push("/principal");
      } catch (error) {
        console.error("Erro no cadastro:", error);
        this.tratarErro(error.code || error.message);
      } finally {
        this.carregando = false;
      }
    },

    validarCPF(cpf) {
      cpf = cpf.replace(/[^\d]+/g, "");
      if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

      let soma = 0;
      for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
      }
      let resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(9))) return false;

      soma = 0;
      for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      return resto === parseInt(cpf.charAt(10));
    },

    tratarErro(codigo) {
      switch (codigo) {
        case "auth/email-already-in-use":
          this.erro = "Este e-mail já está cadastrado!";
          break;
        case "auth/invalid-email":
          this.erro = "E-mail inválido!";
          break;
        case "auth/weak-password":
          this.erro = "Senha muito fraca!";
          break;
        case "CPF inválido!":
          this.erro = "CPF inválido!";
          break;
        case "CPF já cadastrado!":
          this.erro = "CPF já cadastrado!";
          break;
        default:
          this.erro =
            typeof codigo === "string"
              ? codigo
              : "Erro ao cadastrar. Tente novamente.";
      }
    },
  },
};
</script>

<style scoped>
.cadastro-container {
  max-width: 500px;
  margin: 100px auto 20px;
  padding: 30px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

input, select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus, select:focus {
  color: #212529;
  background-color: #fff;
  border-color: #86b7fe; 
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
}

.error-message {
  color: #e74c3c;
  margin: 15px 0;
  text-align: center;
  font-weight: 500;
}

.botoes-container {
  display: flex;
  justify-content: space-between;
  margin-top: 25px;
}

.botao-verde {
  background-color: #42b983;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  position: relative;
  min-width: 110px;
}

.botao-verde:hover:not(:disabled) {
  background-color: #009753;
}

.botao-verde:disabled {
  background-color: #a0d9bb;
  cursor: not-allowed;
}

.botao-sair {
  background-color: #e74c3c;
  color: white;
  padding: 12px 25px;
  border-radius: 5px;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.3s;
}

.botao-sair:hover:not(.disabled) {
  background-color: #c0392b;
}

.botao-sair.disabled {
  background-color: #ee9489;
  cursor: not-allowed;
}

span {
  color: #e74c3c;
  margin-left: 3px;
}

.loading {
  display: inline-block;
}

.loading-dot {
  animation: loading 1.5s infinite;
  opacity: 0;
}

.loading-dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.5s;
}

.loading-dot:nth-child(3) {
  animation-delay: 1s;
}

@keyframes loading {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
span{
  color: white;
}
</style>