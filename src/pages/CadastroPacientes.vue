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
  maxlength="16"
  placeholder="(00) 90000-0000"
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
        if (!this.validarCampos()) return;

        const cpfLimpo = this.paciente.cpf.replace(/\D/g, '');
        const docRef = doc(db, 'pacientes', cpfLimpo);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          alert('Já existe um paciente com esse CPF!');
          return;
        }

        const dataNascimento = new Date(this.paciente.dataNascimento + 'T00:00:00');

        const pacienteFormatado = {
          ...this.paciente,
          cpf: this.paciente.cpf,
          celular: this.paciente.celular,
          telefone: this.paciente.telefone || null,
          cep: this.paciente.cep || null,
          dataNascimento: dataNascimento,
          dataCadastro: new Date()
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
      const dataNasc = new Date(this.paciente.dataNascimento);
      const hoje = new Date();
      if (isNaN(dataNasc.getTime()) || dataNasc >= hoje) {
        alert('Data de nascimento inválida ou no futuro!');
        return false;
      }

      const cpfLimpo = this.paciente.cpf.replace(/\D/g, '');
      if (!this.validarCPF(cpfLimpo)) {
        alert('CPF inválido!');
        return false;
      }

      const celularLimpo = this.paciente.celular.replace(/\D/g, '');
      if (celularLimpo.length !== 11) {
        alert('Celular deve conter DDD + número!');
        return false;
      }

      if (!this.paciente.endereco.trim()) {
        alert('Endereço é obrigatório!');
        return false;
      }

      if (!this.paciente.numero.trim()) {
        alert('Número é obrigatório!');
        return false;
      }

      if (!this.paciente.bairro.trim()) {
        alert('Bairro é obrigatório!');
        return false;
      }

      if (!this.paciente.uf) {
        alert('UF é obrigatória!');
        return false;
      }

      return true;
    },

    validarCPF(cpf) {
      cpf = cpf.replace(/[^\d]+/g, '');
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
      if (value.length >= 1) formatado = '(' + value.substring(0, 2);
      if (value.length >= 3) formatado += ') ' + value.substring(2, 7);
      if (value.length >= 8) formatado += '-' + value.substring(7);

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