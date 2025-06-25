<template>
  <div class="container-prescricao-enf">
    <h1>Prescrição</h1>

    <div class="selecionar-paciente">
      <div class="form-group">
        <label>Paciente:</label>
        <div class="search-container">
          <select v-model="pacienteSelecionadoPrescricao" @change="buscarPrescricoesPorPrescricao" required>
            <option value="" disabled>Selecione pelo prontuário de prescrição</option>
            <option v-for="doc in documentosPrescricoes" :key="doc.cpf" :value="doc.cpf">
              {{ doc.nome }} - CPF: {{ doc.cpf }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group" v-if="prescricoes.length > 0">
        <label>Filtrar Prescrição por ID:</label>
        <select v-model="prescricaoSelecionadaId">
          <option value="">Mostrar Todas as Prescrições</option>
          <option v-for="presc in prescricoes" :key="presc.id" :value="presc.id">
            {{ presc.id }} - Data: {{ formatarDataPrescricao(presc.data) }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="carregando" class="loading">Carregando...</div>

    <div v-else>
      <div v-if="pacienteAtual" class="prescricoes-container">
        <h2>Prescrições de {{ pacienteAtual.nome }}</h2>

        <table class="tabela-prescricao">
          <thead>
            <tr>
              <th>#</th>
              <th>DATA</th>
              <th>MEDICAMENTO</th>
              <th>DOSAGEM</th>
              <th>FREQUÊNCIA</th>
              <th>OBSERVAÇÕES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="prescricoesExibidas.length === 0">
              <td colspan="6">Nenhuma prescrição encontrada para este paciente ou para o filtro selecionado.</td>
            </tr>
            <tr v-for="(prescricao, index) in prescricoesExibidas" :key="prescricao.id">
              <td>{{ index + 1 }}</td>
              <td>{{ formatarDataPrescricao(prescricao.data) }}</td>
              <td>{{ prescricao.medicamento }}</td>
              <td>{{ prescricao.dosagem }}</td>
              <td>{{ prescricao.frequencia }}</td>
              <td>{{ prescricao.observacoes }}</td>
            </tr>
          </tbody>
        </table>

        <div class="gerar-pdf-container">
          <button @click="gerarPDF" class="btn-pdf">
            Gerar PDF ({{ prescricaoSelecionadaId ? 'Prescrição Selecionada' : 'Todas as Prescrições' }})
          </button>
        </div>
      </div>

      <div v-else class="selecione-paciente">
        Selecione um paciente para visualizar as prescrições.
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { jsPDF } from "jspdf";

export default {
  name: "TelaPrescricaoEnf",
  setup() {
    const pacientes = ref([]);
    const documentosPrescricoes = ref([]);
    const pacienteSelecionado = ref("");
    const pacienteSelecionadoPrescricao = ref("");
    const pacienteAtual = ref(null);
    const prescricoes = ref([]);
    const termoBusca = ref("");
    const carregando = ref(false);
    const prescricaoSelecionadaId = ref("");

    const prescricoesExibidas = computed(() => {
      if (!prescricaoSelecionadaId.value) return prescricoes.value;
      return prescricoes.value.filter(presc => presc.id === prescricaoSelecionadaId.value);
    });

    function formatarDataPrescricao(dataISO) {
      try {
        const data = typeof dataISO.toDate === 'function' ? dataISO.toDate() : new Date(dataISO);
        return data.toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      } catch {
        return 'Data inválida';
      }
    }

    async function buscarTodosPacientes() {
      const q = query(collection(db, "pacientes"));
      const snap = await getDocs(q);
      const prescSnap = await getDocs(collection(db, "prescricoes"));

      pacientes.value = snap.docs.map(doc => {
        const data = doc.data();
        const prontuario = prescSnap.docs.find(d => d.id.includes(doc.id));
        return prontuario ? { cpf: doc.id, nome: data.nome, prontuarioPrescricaoId: prontuario.id } : null;
      }).filter(Boolean);
    }

    async function buscarDocumentosPrescricoes() {
      const snap = await getDocs(collection(db, "prescricoes"));
      documentosPrescricoes.value = snap.docs.map(doc => {
        const data = doc.data();
        const lista = data.lista || [];
        return {
          cpf: doc.id,
          nome: lista[0]?.pacienteNome || "Desconhecido",
          lista
        };
      });
    }

    async function buscarPrescricoesPorPrescricao() {
      const docItem = documentosPrescricoes.value.find(p => p.cpf === pacienteSelecionadoPrescricao.value);
      if (docItem) {
        pacienteAtual.value = { nome: docItem.nome, cpf: docItem.cpf };
        prescricoes.value = docItem.lista.map((presc, idx) => ({ id: idx.toString(), ...presc }));
      }
    }

    async function buscarPrescricoes() {
      if (!pacienteSelecionado.value) return;
      carregando.value = true;
      prescricoes.value = [];
      prescricaoSelecionadaId.value = "";

      const docPaciente = pacientes.value.find(p => p.prontuarioPrescricaoId === pacienteSelecionado.value);
      if (docPaciente) pacienteAtual.value = { nome: docPaciente.nome, cpf: docPaciente.cpf };

      const q = query(collection(db, "prescricoes", pacienteSelecionado.value, "prescricoes"), orderBy("data", "desc"));
      const snap = await getDocs(q);
      prescricoes.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      carregando.value = false;
    }

    function gerarPDF() {
      if (!pacienteAtual.value || prescricoes.value.length === 0) {
        alert("Nenhum paciente ou prescrição encontrada para gerar o PDF.");
        return;
      }

      const doc = new jsPDF();

      // --- Document Header ---
      doc.setFontSize(18);
      doc.text(`Prescrição - ${pacienteAtual.value.nome}`, 15, 15);
      doc.setFontSize(12);
      doc.text(`CPF: ${pacienteAtual.value.cpf}`, 15, 25);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 15, 30);

      let y = 45; // Starting Y position for the first row of headers

      // Set font size for column headers
      const headerFontSize = 10;
      doc.setFontSize(headerFontSize);

      // Define X positions for the main headers and data
      // These values need careful tuning based on expected content length
      const colX = {
        index: 15,       // #
        data: 35,        // DATA
        medicamento: 85, // MEDICAMENTO
        dosagem: 130,    // DOSAGEM
        frequencia: 165, // FREQUÊNCIA
        // For OBSERVAÇÕES header and data, we'll use a fixed X
        observacoes_start: 35 // Start X for "OBSERVAÇÕES" header and "Obs: " data
      };

      const prescricoesParaPDF = prescricaoSelecionadaId.value
        ? prescricoes.value.filter(p => p.id === prescricaoSelecionadaId.value)
        : prescricoes.value;

      if (prescricoesParaPDF.length === 0) {
        alert("Nenhuma prescrição encontrada para gerar o PDF (verifique a seleção).");
        return;
      }

      // Loop through each prescription to draw its content
      prescricoesParaPDF.forEach((prescricao, index) => {
        const contentFontSize = 9; // Font size for content
        doc.setFontSize(contentFontSize);
        const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor; // Height for one line of text

        // --- Calculate height needed for this specific entry (including potential multi-line obs) ---
        // Base height for the main data row (assuming no wrapping in #, DATA, MED, DOS, FREQ)
        let neededHeight = lineHeight; 

        // If observations exist, calculate how many lines they might take
        let obsLines = 0;
        if (prescricao.observacoes && prescricao.observacoes.length > 0) {
            const obsText = `Obs: ${prescricao.observacoes}`;
            const maxObsWidth = 195 - colX.observacoes_start; // Available width for observation text
            const tempLines = doc.splitTextToSize(obsText, maxObsWidth);
            obsLines = tempLines.length;
            
            // Add height for "OBSERVAÇÕES" header (1 line) + obs data lines + spacing
            neededHeight += lineHeight + (obsLines * lineHeight) + 5; // 5 for extra padding
        } else {
            // If no observations, still add some padding for consistent spacing
            neededHeight += lineHeight + 5; // A line for the "OBSERVAÇÕES" header + padding
        }


        // --- Page Break Check ---
        // Check if current content + next entry will exceed page bottom
        if (y + neededHeight > 280) { // Approximate page end (A4 is ~297mm height)
          doc.addPage();
          y = 20; // Reset Y for new page
        }

        // --- Draw Headers for Current Entry ---
        // Headers for the first line
        doc.setFontSize(headerFontSize);
        doc.text("#", colX.index, y);
        doc.text("DATA", colX.data, y);
        doc.text("MEDICAMENTO", colX.medicamento, y);
        doc.text("DOSAGEM", colX.dosagem, y);
        doc.text("FREQUÊNCIA", colX.frequencia, y);
        
        y += 7; // Move Y down for the data of the first line (slightly less than full lineHeight)

        // --- Draw Data for Current Entry (First Line) ---
        doc.setFontSize(contentFontSize); // Switch to content font size
        doc.text((index + 1).toString(), colX.index, y);
        doc.text(formatarDataPrescricao(prescricao.data), colX.data, y);
        doc.text(prescricao.medicamento, colX.medicamento, y);
        doc.text(prescricao.dosagem, colX.dosagem, y);
        doc.text(prescricao.frequencia, colX.frequencia, y);
        
        y += 10; // Move Y down for the "OBSERVAÇÕES" header (more space)

        // --- Draw "OBSERVAÇÕES" Header ---
        doc.setFontSize(headerFontSize); // Switch back to header font size for "OBSERVAÇÕES"
        doc.text("OBSERVAÇÕES", colX.observacoes_start, y); 
        
        y += 7; // Move Y down for the actual observation data

        // --- Draw Observation Data ---
        doc.setFontSize(contentFontSize); // Switch back to content font size
        if (prescricao.observacoes && prescricao.observacoes.length > 0) {
          const obsText = `Obs: ${prescricao.observacoes}`;
          const maxObsWidth = 195 - colX.observacoes_start; // Max width for observations text
          const splitObs = doc.splitTextToSize(obsText, maxObsWidth);
          
          splitObs.forEach(line => {
            // Check for page break for individual observation lines if they're very long
            if (y > 280) { // If current line overflows
                doc.addPage();
                y = 20; // Reset Y for new page
                // No headers needed for mid-observation breaks, just continue text
            }
            doc.text(line, colX.observacoes_start, y);
            y += lineHeight; // Move down for the next line of observation
          });
        } else {
            doc.text("Nenhuma observação.", colX.observacoes_start, y); // Indicate if no obs
            y += lineHeight;
        }

        y += 10; // Add extra space after each complete prescription entry
      });

      const fileName = prescricaoSelecionadaId.value
        ? `prescricao_${pacienteAtual.value.nome}_${prescricaoSelecionadaId.value}.pdf`
        : `prescricoes_todas_${pacienteAtual.value.nome}.pdf`;

      doc.save(fileName);
    }

    onMounted(async () => {
      await buscarTodosPacientes();
      await buscarDocumentosPrescricoes();
    });

    return {
      pacientes,
      documentosPrescricoes,
      pacienteSelecionado,
      pacienteSelecionadoPrescricao,
      pacienteAtual,
      prescricoes,
      termoBusca,
      carregando,
      prescricaoSelecionadaId,
      prescricoesExibidas,
      formatarDataPrescricao,
      buscarTodosPacientes,
      buscarDocumentosPrescricoes,
      buscarPrescricoesPorPrescricao,
      buscarPrescricoes,
      gerarPDF,
    };
  },
};
</script>

<style scoped>
.container-prescricao-enf {
  max-width: 800px;
  margin: 80px auto 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.selecionar-paciente {
  margin-bottom: 30px;
}

.search-container {
  position: relative;
  /* Mantido display flex para alinhar select e input de busca */
  display: flex; /* Adicionado novamente para alinhar o select e o input */
  gap: 10px; /* Espaçamento entre o select e o input */
}

select {
  flex: 1; /* Permite que o select ocupe o espaço disponível */
  padding: 10px;
  margin-bottom: 5px; /* Ajuste se necessário para espaçamento */
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.search-input { /* Este estilo agora se aplica ao input de busca de paciente */
  flex: 1; /* Permite que o input ocupe o espaço disponível */
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group {
  margin-bottom: 18px; /* Espaçamento entre os comboboxes */
}

.tabela-prescricao {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.tabela-prescricao th,
.tabela-prescricao td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.tabela-prescricao th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.tabela-prescricao tr:nth-child(even) {
  background-color: #f9f9f9;
}

.gerar-pdf-container {
  text-align: right;
  margin-top: 20px;
}

.btn-pdf {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-pdf:hover {
  background-color: #c0392b;
}

.loading, .selecione-paciente {
  text-align: center;
  padding: 20px;
  color: #666;
}

h1, h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}
</style>