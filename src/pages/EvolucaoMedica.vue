<template>
  <div class="container">
    <h2>Evolução Médica</h2>

    <div class="form-section">
      <div class="form-row">
        <div class="form-group">
          <label>Médico:</label>
          <select v-model="evolucao.medico" required>
            <option value="">Selecione o médico</option>
            <option
              v-for="medico in medicos"
              :key="medico.id"
              :value="medico.nome"
            >
              {{ medico.nome }} - {{ medico.cpf }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Paciente:</label>
          <select
            v-model="pacienteSelecionado"
            @change="carregarDadosPaciente"
            required
          >
            <option value="">Selecione o paciente</option>
            <option
              v-for="paciente in pacientes"
              :key="paciente.id"
              :value="paciente"
            >
              {{ paciente.nome }} - {{ paciente.cpf }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Queixas:</label>
        <textarea v-model="evolucao.queixas" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label>Exame Físico:</label>
        <textarea v-model="evolucao.exameFisico" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label>Medicações de uso habitual:</label>
        <textarea v-model="evolucao.medicacoesHabitual" rows="2"></textarea>
      </div>
    </div>

    <div class="vital-signs">
      <h3>Dados Vitais</h3>

      <div class="form-row">
        <div class="form-group">
          <label>Pressão Arterial:</label>
          <input v-model="evolucao.pressaoArterial" placeholder="ex: 120x80 mmHg" />
        </div>

        <div class="form-group">
          <label>Saturação:</label>
          <input v-model="evolucao.saturacao" placeholder="ex: 98%" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Frequência Respiratória:</label>
          <input v-model="evolucao.freqRespiratoria" placeholder="ex: 16 rpm" />
        </div>

        <div class="form-group">
          <label>Temperatura:</label>
          <input v-model="evolucao.temperatura" placeholder="ex: 36.5°C" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Frequência Cardíaca:</label>
          <input v-model="evolucao.freqCardiaca" placeholder="ex: 89 bpm" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-group">
        <label>Hipótese diagnóstica (CID):</label>
        <input v-model="evolucao.hipoteseDiagnostica" placeholder="Código CID e descrição" />
      </div>

      <div class="form-group">
        <label>Conduta:</label>
        <textarea v-model="evolucao.conduta" rows="4"></textarea>
      </div>
    </div>

    <div class="button-group">
      <button class="btn-salvar" @click="salvarEvolucao">Salvar</button>
      <button type="button" class="btn-sair" @click="cancelar">Sair</button>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

export default {
  name: 'EvolucaoMedica',
  data() {
    return {
      pacientes: [],
      medicos: [],
      pacienteSelecionado: null,
      evolucao: {
        medico: '',
        queixas: '',
        exameFisico: '',
        medicacoesHabitual: '',
        pressaoArterial: '',
        saturacao: '',
        freqRespiratoria: '',
        temperatura: '',
        freqCardiaca: '',
        hipoteseDiagnostica: '',
        conduta: '',
        dataEvolucao: ''
      }
    };
  },
  async created() {
    await this.carregarPacientes();
    await this.carregarMedicos();
  },
  methods: {
    async carregarPacientes() {
      const querySnapshot = await getDocs(collection(db, 'pacientes'));
      this.pacientes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },

    async carregarMedicos() {
      const q = query(
        collection(db, 'usuarios'),
        where('ocupacao', '==', 'medico')
      );
      const querySnapshot = await getDocs(q);
      this.medicos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },

    async carregarDadosPaciente() {
      if (!this.pacienteSelecionado) return;

      const q = query(
        collection(db, 'triagens'),
        where('pacienteId', '==', this.pacienteSelecionado.id)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const triagem = querySnapshot.docs[0].data();
        this.evolucao = {
          ...this.evolucao,
          pressaoArterial: triagem.pa || '',
          saturacao: triagem.satO2 || '',
          temperatura: triagem.temperatura || ''
        };
      }
    },

    async salvarEvolucao() {
      if (!this.pacienteSelecionado) {
        alert('Selecione um paciente');
        return;
      }

      try {
        const evolucaoCompleta = {
          ...this.evolucao,
          pacienteId: this.pacienteSelecionado.id,
          pacienteNome: this.pacienteSelecionado.nome,
          dataEvolucao: new Date().toISOString()
        };

        await addDoc(collection(db, 'evolucoes'), evolucaoCompleta);
        alert('Evolução registrada com sucesso!');
        this.limparFormulario();
      } catch (error) {
        console.error('Erro ao salvar evolução:', error);
        alert('Erro ao salvar evolução: ' + error.message);
      }
    },

    cancelar() {
      this.$router.push('/principal');
    },

    limparFormulario() {
      this.evolucao = {
        medico: '',
        queixas: '',
        exameFisico: '',
        medicacoesHabitual: '',
        pressaoArterial: '',
        saturacao: '',
        freqRespiratoria: '',
        temperatura: '',
        freqCardiaca: '',
        hipoteseDiagnostica: '',
        conduta: '',
        dataEvolucao: ''
      };
      this.pacienteSelecionado = null;
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.form-section {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.vital-signs {
  background-color: #e6f7ff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

select,
input,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

textarea {
  min-height: 60px;
  resize: vertical;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-salvar {
  background-color: #4caf50;
  color: white;
}

.btn-sair {
  background-color: #f44336;
  color: white;
}

h3 {
  margin-top: 0;
  color: #1890ff;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
</style>
