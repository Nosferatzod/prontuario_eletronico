<template>
  <div>
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Selecionar Paciente</h3>
        <div class="search-container">
          <input
            v-model="searchTerm"
            placeholder="Buscar paciente por nome ou CPF..."
            class="search-input"
          />
        </div>
        <ul class="patient-list">
          <li
            v-for="paciente in pacientesFiltrados"
            :key="paciente.cpf"
            @click="selecionarPaciente(paciente)"
          >
            {{ paciente.nome }} - CPF: {{ paciente.cpf }}
          </li>
        </ul>
        <button @click="showModal = false" class="btn-cancel">Cancelar</button>
      </div>
    </div>

    <h1>Relatório de Enfermagem</h1>

    <div id="relatorio" class="relatorio">
      <h2>Instrumento para Registros de Enfermagem</h2>

      <p>
        PACIENTE: {{ pacienteSelecionado?.nome || '_____________________________' }} <br>
        DATA DE NASCIMENTO: {{ formatarDataNascimento(pacienteSelecionado?.dataNascimento) || '___/___/____' }}
        TURNO: ( ) DIURNO ( ) NOTURNO
      </p>

      <p>
        <strong>Percepção / Nível de Consciência / Orientação:</strong><br />
        ( ) Vígil ( ) Orientado ( ) Confuso ( ) Sonolento ( ) Torporoso
      </p>

      <p>
        <strong>Oxigenação / Padrão Respiratório:</strong><br />
        ( ) Respiração espontânea ( ) Cateter nasal ___L/min
        ( ) Máscara ___L/min ( ) TQT ar ambiente
        ( ) TQT com O2 ___L/min ( ) Outro: _______________________
      </p>

      <p>
        <strong>Nutrição:</strong><br />
        ( ) Dieta zero/jejum a partir das ____h ( ) Oral - aceitação ( )Boa ( )Moderada ( )Baixa
        ( ) Sonda nasoenteral ( ) Gastrostomia ( ) Outro: __________________
      </p>

      <p>
        <strong>Eliminações - Diurese:</strong><br />
        ( ) Espontânea em vaso ( ) Fralda ( ) SVD ____ml às ____h
        ( ) Ausente há ____h<br />
        Coloração: ( ) Fisiológica ( ) Alaranjado ( ) Hematúria ( ) Outra: _______________________
      </p>

      <p>
        <strong>Evacuação:</strong><br />
        ( ) Presente ( ) Ausente - Consistência: ( ) Consistentes ( ) Pastosas ( ) Líquidas ( ) Diarreia ( ) Hematoquezia/melena
      </p>

      <p>
        <strong>Mobilidade:</strong><br />
        ( ) Restrito ( ) Deambula sem auxílio ( ) Com auxílio __________________ ( ) Cadeira de rodas
      </p>

      <p>
        <strong>Risco de queda:</strong><br />
        ( ) Sem risco ( ) Baixo ( ) Moderado ( ) Alto ( ) Muito alto<br />
        Queda? ______ Justificar: ___________________________________
      </p>

      <p>
        <strong>Integridade da Pele:</strong><br />
        Lesão por pressão ( ) Sim ( ) Não - Local: _______________________<br />
        Outras lesões: _______________________________________
      </p>

      <p>
        <strong>Curativos:</strong><br />
        ( ) Limpo e seco ( ) Sujo - Data troca: ___/___/____ - Cobertura: _______________________
      </p>

      <p>
        <strong>Edema:</strong> ( ) Não ( ) Sim - Local: _______________________<br />
        <strong>Hematomas/Equimose:</strong> ( ) Não ( ) Sim - Local: _______________________
      </p>

      <p>
        <strong>Banho:</strong> ( ) Aspersão sem auxílio ( ) Com auxílio ( ) No leito ( ) Outro turno
      </p>

      <p>
        <strong>Higiene Oral:</strong> ( ) Escovação ( ) Bochecho ( ) Higiene de dentadura
      </p>

      <p>
        <strong>Dor:</strong> ( ) Não ( ) Sim - Local: ___________________________
      </p>

      <p>
        <strong>Conduta:</strong><br />
        ___________________________________________________________
      </p>

      <p>
        <strong>Vômito:</strong> ( ) Não ( ) Sim - Aspecto: ___________________ - Conduta: ___________________
      </p>

      <p>
        <strong>Febre:</strong> ( ) Não ( ) Sim ____ºC - Conduta: ___________________
      </p>

      <p>
        <strong>Outras intercorrências:</strong><br />
        ___________________________________________________________
      </p>

      <br /><br />
      ___________________________________<br />
      <strong>Assinatura do profissional: {{ profissionalNome }}</strong><br />
      <small>Registro: {{ profissionalRegistro }}</small>
    </div>

    <br />

    <button @click="showModal = true" class="btn-select-patient" v-if="!showModal">
      Selecionar Paciente
    </button>
    <button @click="gerarWord" :disabled="!pacienteSelecionado">Gerar Word (Editável)</button>
    <button @click="gerarPDF" :disabled="!pacienteSelecionado">Gerar PDF (Imprimir)</button>
  </div>
</template>

<script>
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";
import { db, auth } from '@/firebase';
import { collection, query, getDocs, doc, getDoc, where } from 'firebase/firestore'; // Importe 'where' para buscar por email se o uid não for o ID do documento

export default {
  name: "RelatorioEnfermagem",
  data() {
    return {
      showModal: true,
      searchTerm: '',
      pacientes: [],
      pacienteSelecionado: null,
      profissionalNome: '',
      profissionalRegistro: '',
      currentUser: null
    };
  },
  computed: {
    pacientesFiltrados() {
      if (!this.searchTerm) return this.pacientes;
      const termo = this.searchTerm.toLowerCase();
      return this.pacientes.filter(paciente => {
        return paciente.nome.toLowerCase().includes(termo) ||
               paciente.cpf.includes(termo);
      });
    }
  },
  async created() {
    // Garante que o carregarDadosProfissional seja chamado após o estado de autenticação ser conhecido
    auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        await this.carregarDadosProfissional(user.uid); // Passa o UID do usuário
      } else {
        // Usuário deslogado, talvez redirecionar para o login ou limpar dados
        this.profissionalNome = '';
        this.profissionalRegistro = '';
        this.$router.replace('/'); // Redireciona para o login se não houver usuário logado
      }
    });

    await this.carregarPacientes();
  },
  methods: {
    async carregarPacientes() {
      try {
        const q = query(collection(db, "pacientes"));
        const querySnapshot = await getDocs(q);
        this.pacientes = querySnapshot.docs.map(doc => ({
          cpf: doc.id, // Supondo que o CPF é o ID do documento do paciente
          ...doc.data()
        }));
      } catch (error) {
        console.error("Erro ao carregar pacientes:", error);
      }
    },

    async carregarDadosProfissional(uid) { // Recebe o UID como parâmetro
      try {
        if (!uid) { // Garante que há um UID para buscar
          console.warn("UID do usuário não disponível para carregar dados do profissional.");
          return;
        }

        // Tenta buscar o documento do usuário usando o UID como ID do documento
        const userRef = doc(db, "usuarios", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          this.profissionalNome = userData.nome || 'Nome Não Encontrado';
          // Tenta usar 'registro' ou 'coren'/'crm', ou fallback para 'cpf'
          this.profissionalRegistro = userData.registro || userData.coren || userData.crm || userData.cpf || 'Registro Não Encontrado';
        } else {
          // Se o documento não existe com o UID, pode ser que você esteja usando o email como ID do documento
          // OU que o documento do usuário esteja em outro lugar no Firestore, ou simplesmente não exista.
          // Para robustez, você pode tentar buscar pelo email (se for um campo de índice no Firestore)
          console.warn(`Documento de usuário com UID ${uid} não encontrado. Tentando buscar por email...`);
          if (this.currentUser && this.currentUser.email) {
            const q = query(
              collection(db, 'usuarios'),
              where('email', '==', this.currentUser.email)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              this.profissionalNome = userData.nome || 'Nome Não Encontrado';
              this.profissionalRegistro = userData.registro || userData.coren || userData.crm || userData.cpf || 'Registro Não Encontrado';
            } else {
              console.warn("Usuário autenticado, mas perfil não encontrado no Firestore (nem por UID, nem por email).");
              this.profissionalNome = 'Profissional Desconhecido';
              this.profissionalRegistro = 'N/A';
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do profissional:", error);
        this.profissionalNome = 'Erro ao Carregar';
        this.profissionalRegistro = 'Erro';
      }
    },

    selecionarPaciente(paciente) {
      this.pacienteSelecionado = paciente;
      this.showModal = false;
    },

    formatarDataNascimento(dataISO) {
      if (!dataISO) return '___/___/____';
      // Garante que a data seja tratada como string para o replace
      const dataStr = dataISO.toString();
      // Verifica se já está no formato DD/MM/AAAA (se for o caso de já ter formatado antes, ou se vem de outro lugar)
      if (dataStr.includes('/')) {
        return dataStr;
      }
      // Se for formato ISO (YYYY-MM-DD), converte
      const data = new Date(dataStr);
      // Adiciona 1 dia se o fuso horário estiver causando problema de data anterior
      data.setDate(data.getDate() + 1);
      return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Força UTC para evitar problemas de fuso horário
    },

    gerarWord() {
  const pacienteNome = this.pacienteSelecionado?.nome || '_______________________________';
  const pacienteDataNasc = this.formatarDataNascimento(this.pacienteSelecionado?.dataNascimento);

  // Captura o conteúdo visual do relatório
  const relatorioContent = document.getElementById("relatorio").innerText;
  const relatorioLines = relatorioContent.split('\n').map(line => new Paragraph(line.trim()));

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Instrumento para Registros de Enfermagem",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph(" "),
          new Paragraph(
            `PACIENTE: ${pacienteNome}    DATA DE NASCIMENTO: ${pacienteDataNasc}    TURNO: ( ) DIURNO ( ) NOTURNO`
          ),
          new Paragraph(" "),
          // Adiciona o conteúdo do HTML dinamicamente
          ...relatorioLines // <-- Já inclui a assinatura do profissional no final
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    const nomeArquivo = this.pacienteSelecionado
      ? `Relatorio_Enfermagem_${this.pacienteSelecionado.nome}.docx`
      : "Relatorio_Enfermagem.docx";
    saveAs(blob, nomeArquivo);
  });
},

    gerarPDF() {
      const element = document.getElementById("relatorio");
      const opt = {
        margin: 5,
        filename: `Relatorio_Enfermagem_${this.pacienteSelecionado.nome}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf().set(opt).from(element).save();
    }
  }
};
</script>

<style scoped>
/* Estilos base do Design System */
body {
  background-color: #F5F5F5;
  font-family: 'Roboto', sans-serif;
  color: #4A4A4A;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #4A4A4A;
}

h2 {
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 2rem;
}

/* Estilos para o modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.search-container {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.patient-list {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
}

.patient-list li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.patient-list li:hover {
  background-color: #f5f5f5;
}

.btn-cancel {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-select-patient {
  background-color: #4A90E2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  margin: 5px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button[disabled]:hover {
  background-color: #cccccc;
}

/* Estilos para o relatório */
.relatorio {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  background: white;
  font-family: 'Open Sans', sans-serif;
  font-size: 16px;
  color: #4A4A4A;
  border: 1px solid #E0E0E0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  line-height: 1.5;
  margin: 0 auto;
}

.relatorio p {
  margin-bottom: 1rem;
}

.relatorio strong {
  font-weight: bold;
}
</style>