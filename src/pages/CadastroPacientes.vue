<template>
  <div class="container">
    <h2>Cadastro de Paciente</h2>
    <form @submit.prevent="salvarPaciente">
      <div class="form-group">
        <label>Nome Completo:</label>
        <input v-model="paciente.nome" required />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Data de Nascimento:</label>
          <input v-model="paciente.dataNascimento" type="date" required />
        </div>

        <div class="form-group">
          <label>CPF:</label>
          <input
            v-model="paciente.cpf"
            @input="formatarCPF"
            maxlength="14"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Celular:</label>
          <input
            v-model="paciente.celular"
            @input="formatarCelular"
            maxlength="15"
            required
          />
        </div>

        <div class="form-group">
          <label>Telefone:</label>
          <input
            v-model="paciente.telefone"
            @input="formatarTelefone"
            maxlength="14"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Endereço (Logradouro):</label>
        <input v-model="paciente.endereco" required />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Número:</label>
          <input v-model="paciente.numero" required />
        </div>

        <div class="form-group">
          <label>Bairro:</label>
          <input v-model="paciente.bairro" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>UF:</label>
          <select v-model="paciente.uf" required>
            <option value="">Selecione</option>
            <option v-for="uf in ufs" :key="uf" :value="uf">{{ uf }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>CEP:</label>
          <input
            v-model="paciente.cep"
            @input="formatarCEP"
            maxlength="9"
          />
        </div>
      </div>

      <div class="button-group">
        <button type="submit" class="salvar">Salvar</button>
        <button type="button" class="cancelar" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script>
import { db } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      paciente: {
        nome: '',
        dataNascimento: '',
        cpf: '',
        celular: '',
        telefone: '',
        endereco: '',
        numero: '',
        bairro: '',
        uf: '',
        cep: ''
      },
      ufs: [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ]
    };
  },
  methods: {
    async salvarPaciente() {
      try {
        // Validação básica antes de salvar
        if (!this.validarCampos()) {
          return;
        }

        const cpfLimpo = this.paciente.cpf.replace(/\D/g, '');

        // Verifica se paciente já existe
        const docRef = doc(db, 'pacientes', cpfLimpo);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          alert('Já existe um paciente com esse CPF!');
          return;
        }

        // Formata os dados antes de salvar
        const pacienteFormatado = {
          ...this.paciente,
          cpf: this.paciente.cpf,
          celular: this.paciente.celular,
          telefone: this.paciente.telefone || null, // Salva como null se vazio
          cep: this.paciente.cep || null,
          dataCadastro: new Date().toISOString()
        };

        await setDoc(docRef, pacienteFormatado);

        alert('Paciente cadastrado com sucesso!');
        this.$router.push('/principal');
      } catch (error) {
        console.error('Erro ao cadastrar paciente:', error);
        alert('Erro ao cadastrar paciente: ' + error.message);
      }
    },

    validarCampos() {
      // Valida data de nascimento (deve ser no passado)
      const dataNasc = new Date(this.paciente.dataNascimento);
      const hoje = new Date();
      if (dataNasc >= hoje) {
        alert('Data de nascimento deve ser no passado!');
        return false;
      }

      // Valida CPF (11 dígitos)
      const cpfLimpo = this.paciente.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        alert('CPF deve conter 11 dígitos!');
        return false;
      }

      // Valida celular (pelo menos 11 dígitos)
      const celularLimpo = this.paciente.celular.replace(/\D/g, '');
      if (celularLimpo.length < 11) {
        alert('Celular deve conter DDD + número!');
        return false;
      }

      // Valida endereço
      if (!this.paciente.endereco.trim()) {
        alert('Endereço é obrigatório!');
        return false;
      }

      // Valida número
      if (!this.paciente.numero.trim()) {
        alert('Número é obrigatório!');
        return false;
      }

      // Valida bairro
      if (!this.paciente.bairro.trim()) {
        alert('Bairro é obrigatório!');
        return false;
      }

      // Valida UF
      if (!this.paciente.uf) {
        alert('UF é obrigatória!');
        return false;
      }

      return true;
    },

    cancelar() {
      this.$router.push('/principal');
    },

    formatarCPF(event) {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.substring(0, 11);

      let formatado = '';
      if (value.length > 0) formatado = value.substring(0, 3);
      if (value.length >= 4) formatado += '.' + value.substring(3, 6);
      if (value.length >= 7) formatado += '.' + value.substring(6, 9);
      if (value.length >= 10) formatado += '-' + value.substring(9, 11);

      this.paciente.cpf = formatado;
    },

    formatarCelular(event) {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.substring(0, 11);

      let formatado = '';
      if (value.length > 0) formatado = '(' + value.substring(0, 2);
      if (value.length >= 3) formatado += ') ' + value.substring(2, 3);
      if (value.length >= 4) formatado += ' ' + value.substring(3, 7);
      if (value.length >= 8) formatado += '-' + value.substring(7, 11);

      this.paciente.celular = formatado;
    },

    formatarTelefone(event) {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length > 10) value = value.substring(0, 10);

      let formatado = '';
      if (value.length > 0) formatado = '(' + value.substring(0, 2);
      if (value.length >= 3) formatado += ') ' + value.substring(2, 6);
      if (value.length >= 7) formatado += '-' + value.substring(6, 10);

      this.paciente.telefone = formatado;
    },

    formatarCEP(event) {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length > 8) value = value.substring(0, 8);

      let formatado = '';
      if (value.length > 0) formatado = value.substring(0, 5);
      if (value.length >= 6) formatado += '-' + value.substring(5, 8);

      this.paciente.cep = formatado;
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 120px auto 40px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

label:after {
  content: " *";
  color: red;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

input:focus, select:focus {
  color: #212529;
  background-color: #fff;
  border-color: #86b7fe; 
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.salvar {
  background-color: #4CAF50;
  color: white;
}

.salvar:hover {
  background-color: #009753;
}

.cancelar {
  background-color: #f44336;
  color: white;
}

.cancelar:hover {
  background-color: #c0392b;
}
</style>