<template>
  <div class="page-container">
    <div class="scroll-wrapper">
      <div class="triagem-card">
        <h1>Triagem</h1>
        <form @submit.prevent="salvarTriagem">
          <div class="form-section four-columns-inline">
            <div class="form-group">
              <label>CPF do paciente: <span class="required">*</span></label>
              <div class="autocomplete">
                <input
                  v-model="cpfSearch"
                  @input="filterPacientes"
                  @focus="showDropdown = true"
                  @blur="esconderDropdown"
                  placeholder="Digite nome ou CPF"
                  required
                />
                <ul v-if="showDropdown && filteredPacientes.length" class="dropdown">
                  <li
                    v-for="paciente in filteredPacientes"
                    :key="paciente.cpf"
                    @mousedown="selectPaciente(paciente)"
                  >
                    {{ paciente.nome }} - {{ formatarCPF(paciente.cpf) }}
                  </li>
                </ul>
              </div>
              <div v-if="pacienteSelecionado" class="selected-paciente">
                Selecionado: <strong>{{ pacienteSelecionado.nome }}</strong> - {{ formatarCPF(pacienteSelecionado.cpf) }}
              </div>
            </div>

            <div class="form-group">
              <label>Peso (kg): <span class="required">*</span></label>
              <input v-model="peso" type="number" step="0.1" min="0" required />
            </div>
            <div class="form-group">
              <label>Altura (cm): <span class="required">*</span></label>
              <input v-model="altura" type="number" min="0" required />
            </div>
          </div>

          <h2>Sinais Vitais</h2>

          <div class="form-section">
            <div class="form-group" v-for="(campo, index) in sinaisVitais" :key="index">
              <label>{{ campo.label }} <span v-if="campo.unidade">({{ campo.unidade }})</span></label>
              <input
                v-model="campo.model"
                :type="campo.type"
                :step="campo.step"
                :min="campo.min"
                :max="campo.max"
                :placeholder="campo.placeholder"
                :required="index === 0"
              />
            </div>
          </div>

          <div class="form-section three-columns-inline">
            <!-- Alergia -->
            <div class="form-group">
              <label>Alergia: <span class="required">*</span></label>
              <div class="radio-group">
                <label><input type="radio" v-model="alergia" value="sim" /> Sim</label>
                <label><input type="radio" v-model="alergia" value="nao" /> Não</label>
              </div>
            </div>
            <div v-if="alergia === 'sim'" class="sub-form-wrapper">
              <label>Detalhes da Alergia:</label>
              <textarea v-model="detalheAlergia" class="expansivel ampla" required placeholder="Descreva a alergia..."></textarea>
            </div>

            <!-- Medicamentos -->
            <div class="form-group">
              <label>Medicamentos: <span class="required">*</span></label>
              <div class="radio-group">
                <label><input type="radio" v-model="usoMedicamentos" value="sim" /> Sim</label>
                <label><input type="radio" v-model="usoMedicamentos" value="nao" /> Não</label>
              </div>
            </div>
            <div v-if="usoMedicamentos === 'sim'" class="sub-form-wrapper">
              <label>Quais medicamentos?</label>
              <textarea v-model="detalheMedicamentos" required placeholder="Informe os medicamentos..." class="expansivel ampla"></textarea>
            </div>

            <!-- Tabagismo -->
            <div class="form-group">
              <label>Tabagismo: <span class="required">*</span></label>
              <div class="radio-group">
                <label><input type="radio" v-model="tabagismo" value="sim" /> Sim</label>
                <label><input type="radio" v-model="tabagismo" value="nao" /> Não</label>
              </div>
            </div>
            <div v-if="tabagismo === 'sim'" class="sub-form-wrapper">
              <label>Frequência, tipo, há quanto tempo etc.:</label>
              <textarea v-model="detalheTabagismo" required placeholder="Descreva o uso..." class="expansivel ampla"></textarea>
            </div>

            <!-- Etilismo -->
            <div class="form-group">
              <label>Etilismo: <span class="required">*</span></label>
              <div class="radio-group">
                <label><input type="radio" v-model="etilismo" value="sim" /> Sim</label>
                <label><input type="radio" v-model="etilismo" value="nao" /> Não</label>
              </div>
            </div>
            <div v-if="etilismo === 'sim'" class="sub-form-wrapper">
              <label>Frequência, tipo, há quanto tempo etc.:</label>
              <textarea v-model="detalheEtilismo" required placeholder="Descreva o consumo..." class="expansivel ampla"></textarea>
            </div>
          </div>

          <div class="form-section full-width-field">
            <div class="form-group full-width">
              <label>Queixas: <span class="required">*</span></label>
              <textarea v-model="queixas" rows="6" required></textarea>
            </div>
          </div>

          <p v-if="showRequiredError" class="error-msg">*Preencha todos os campos obrigatórios</p>
          <p v-if="firebaseError" class="error-msg">{{ firebaseError }}</p>

          <div class="btns">
            <button type="submit" class="btn btn-green">Salvar</button>
            <button type="button" class="btn btn-red" @click="$router.back()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>



<script>
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default {
  name: "TelaTriagem",
  data() {
    return {
      cpfSearch: "",
      pacientes: [],
      filteredPacientes: [],
      pacienteSelecionado: null,
      showDropdown: false,
      usuario: "Usuário logado",
      peso: "",
      altura: "",
      alergia: "",
      detalheAlergia: "",
      usoMedicamentos: "",
      detalheMedicamentos: "",
      tabagismo: "",
      detalheTabagismo: "",
      etilismo: "",
      detalheEtilismo: "",
      queixas: "",
      firebaseError: "",
      showRequiredError: false,
      sinaisVitais: [
        { label: "Temperatura:", model: "", type: "number", step: "0.1", unidade: "°C" },
        { label: "Frequência respiratória:", model: "", type: "number", min: "0", unidade: "rpm" },
        { label: "Frequência cardíaca:", model: "", type: "number", min: "0", unidade: "bpm" },
        { label: "Saturação de oxigênio:", model: "", type: "number", min: "0", max: "100", unidade: "%" },
        { label: "Pressão arterial:", model: "", type: "text", placeholder: "Ex: 120/80", unidade: "mmHg" },
        { label: "Glicemia:", model: "", type: "number", min: "0", unidade: "mg/dL" }
      ]
    };
  },
  async created() {
    await this.carregarPacientes();
  },
  methods: {
    esconderDropdown() {
      setTimeout(() => {
        this.showDropdown = false;
      }, 200);
    },
    async carregarPacientes() {
      try {
        const querySnapshot = await getDocs(collection(db, "pacientes"));
        this.pacientes = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, nome: data.nome, cpf: data.cpf, ...data };
        });
      } catch (error) {
        console.error("Erro ao carregar pacientes:", error);
        this.firebaseError = "Erro ao carregar lista de pacientes";
      }
    },
    formatarCPF(cpf) {
      if (!cpf) return "";
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    },
    filterPacientes() {
      const searchText = this.cpfSearch.toLowerCase();
      this.filteredPacientes = this.pacientes.filter(paciente => {
        return (
          paciente.nome.toLowerCase().includes(searchText) ||
          paciente.cpf.includes(searchText)
        );
      });
    },
    selectPaciente(paciente) {
      this.pacienteSelecionado = paciente;
      this.cpfSearch = `${paciente.nome} - ${this.formatarCPF(paciente.cpf)}`;
      this.showDropdown = false;
    },
    async salvarTriagem() {
      this.firebaseError = "";
      this.showRequiredError = false;

      if (!this.pacienteSelecionado) {
        this.firebaseError = "Selecione um paciente válido";
        return;
      }

      if (
        !this.peso ||
        !this.altura ||
        !this.alergia ||
        !this.usoMedicamentos ||
        !this.tabagismo ||
        !this.etilismo ||
        !this.queixas
      ) {
        this.showRequiredError = true;
        return;
      }

      if (this.alergia === "sim" && !this.detalheAlergia) {
        this.showRequiredError = true;
        return;
      }
      if (this.usoMedicamentos === "sim" && !this.detalheMedicamentos) {
        this.showRequiredError = true;
        return;
      }
      if (this.tabagismo === "sim" && !this.detalheTabagismo) {
        this.showRequiredError = true;
        return;
      }
      if (this.etilismo === "sim" && !this.detalheEtilismo) {
        this.showRequiredError = true;
        return;
      }

      try {
        const triagemId = this.pacienteSelecionado.cpf;
        const sinaisVitaisObj = {};
        this.sinaisVitais.forEach(item => {
          let key = item.label.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
          sinaisVitaisObj[key] = item.model;
        });

        const triagemData = {
          paciente: {
            cpf: this.pacienteSelecionado.cpf,
            nome: this.pacienteSelecionado.nome,
            id: this.pacienteSelecionado.id
          },
          usuario: this.usuario,
          peso: parseFloat(this.peso),
          altura: parseInt(this.altura),
          sinaisVitais: sinaisVitaisObj,
          alergia: this.alergia,
          detalheAlergia: this.alergia === "sim" ? this.detalheAlergia : "",
          usoMedicamentos: this.usoMedicamentos,
          detalheMedicamentos: this.usoMedicamentos === "sim" ? this.detalheMedicamentos : "",
          tabagismo: this.tabagismo,
          detalheTabagismo: this.tabagismo === "sim" ? this.detalheTabagismo : "",
          etilismo: this.etilismo,
          detalheEtilismo: this.etilismo === "sim" ? this.detalheEtilismo : "",
          queixas: this.queixas,
          dataRegistro: new Date()
        };

        await setDoc(doc(db, "triagens", triagemId), triagemData);
        alert("Triagem salva com sucesso!");
        this.$router.push("/");
      } catch (error) {
        console.error("Erro ao salvar triagem:", error);
        this.firebaseError = "Erro ao salvar triagem. Verifique as permissões.";
      }
    }
  }
};
</script>


<style scoped>
.page-container {
  padding-top: 80px;
  background-color: #f0f2f5;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.scroll-wrapper {
  width: 100%;
  max-width: 1000px;
  padding: 20px;
  box-sizing: border-box;
}

.page-container {
  padding: 40px 20px;
  box-sizing: border-box;
  background-color: #f0f2f5;
  width: 100%;
  display: flex;
  justify-content: center;
}

.triagem-card {
  background: white;
  padding: 30px 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
}
.page-container {
  padding-top: 80px;
  box-sizing: border-box;
  background-color: #f0f2f5;
  width: 100%;
  display: flex;
  justify-content: center;
}

.triagem-card {
  background: white;
  padding: 30px 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
  margin-bottom: 20px;
}

h1, h2 {
  text-align: center;
  color: #0f2b53;
  margin-bottom: 20px;
}

.form-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: space-between;
}

.form-group {
  flex: 1 1 calc(33.333% - 13.333px);
  max-width: calc(33.333% - 13.333px);
  display: flex;
  flex-direction: column;
  margin: 0;
}

.form-section.four-columns-inline .form-group,
.form-section.three-columns-inline .form-group {
  flex: 1 1 calc(25% - 15px);
  max-width: calc(25% - 15px);
}

.form-section.full-width-field .form-group.full-width {
  flex: 1 1 100%;
}

.sub-form-group {
  margin-top: 10px;
}

input, textarea, select {
  padding: 12px 15px;
  border-radius: 5px;
  border: 1px solid #dcdcdc;
  /* width: 100%;  */
  box-sizing: border-box;
}

input:focus, select:focus, textarea:focus {
  color: #212529;
  background-color: #fff;
  border-color: #86b7fe; 
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px 15px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  white-space: normal;
  overflow-wrap: break-word;
}
textarea.expansivel {
  min-height: 120px;
  width: 100%;
  resize: vertical;
}
textarea.expansivel.ampla {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  min-height: 150px;
  height: auto;
  resize: vertical;
  font-size: 1rem;
  padding: 14px;
  line-height: 1.6;
  box-sizing: border-box;
  display: block;
}


@media (max-width: 768px) {
  textarea.expansivel.ampla {
    min-height: 140px;
    font-size: 0.95rem;
  }
}

.required {
  color: red;
}
.large-textarea {
  min-height: 100px;
}
.error-msg {
  color: red;
  margin-top: 5px;
  text-align: center;
}

.btns {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.btn {
  padding: 12px 25px;
  border-radius: 5px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-green {
  background-color: #4CAF50;
  color: white;
}

.btn-green:hover {
  background-color: #45a049;
}

.btn-red {
  background-color: #f44336;
  color: white;
}

.btn-red:hover {
  background-color: #da190b;
}

.radio-group {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Estilos para o autocomplete */
.autocomplete {
  position: relative;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  z-index: 1000;
  list-style: none;
  padding: 0;
  margin: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dropdown li {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.sub-form-wrapper {
  flex: 1 1 100%;
  max-width: 100%;
  margin-top: 10px;
}

.sub-form-wrapper textarea {
  width: 100%;
  min-height: 150px;
  resize: vertical;
  padding: 12px;
  font-size: 1rem;
  box-sizing: border-box;
}

.dropdown li:hover {
  background-color: #f5f5f5;
}

.selected-paciente {
  margin-top: 8px;
  font-size: 0.9em;
  color: #555;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

@media (max-width: 992px) {
  .form-section.four-columns-inline .form-group,
  .form-group,
  .form-section.three-columns-inline .form-group {
    flex: 1 1 calc(50% - 10px);
    max-width: calc(50% - 10px);
  }
  .page-container {
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .triagem-card {
    padding: 20px 25px;
  }
  .form-section .form-group,
  .form-section.four-columns-inline .form-group,
  .form-section.three-columns-inline .form-group {
    flex: 1 1 100%;
    max-width: 100%;
  }
}
</style>