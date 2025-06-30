<template>
  <div class="container-prescricao-med">
    <h1>Registrar Prescrição Médica</h1>

    <form @submit.prevent="salvarPrescricao">
      <div class="form-group">
        <label>Paciente:</label>
        <select v-model="prescricao.pacienteId" required @change="selecionarPaciente">
          <option value="" disabled>Selecione um paciente</option>
          <option v-for="paciente in pacientes" :key="paciente.cpf" :value="paciente.cpf">
            {{ paciente.nome }} - CPF: {{ paciente.cpf }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Medicamento:</label>
        <input v-model="prescricao.medicamento" required />
      </div>

      <div class="form-group">
        <label>Dosagem:</label>
        <input v-model="prescricao.dosagem" required />
      </div>

      <div class="form-group">
        <label>Frequência:</label>
        <input v-model="prescricao.frequencia" required />
      </div>

      <div class="form-group">
        <label>Observações:</label>
        <textarea v-model="prescricao.observacoes"></textarea>
      </div>

      <button type="submit">Salvar Prescrição</button>
    </form>

    <div v-if="erro" class="error-message">{{ erro }}</div>
    <div v-if="sucesso" class="success-message">{{ sucesso }}</div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { db } from "@/firebase";

export default {
  name: "TelaPrescricaoMed",
  setup() {
    const auth = getAuth();
    const prescricao = ref({
      pacienteId: "",
      pacienteNome: "",
      medicamento: "",
      dosagem: "",
      frequencia: "",
      observacoes: "",
      data: ""
    });

    const pacientes = ref([]);
    const erro = ref("");
    const sucesso = ref("");

    async function buscarPacientes() {
      try {
        const q = query(collection(db, "pacientes"));
        const querySnapshot = await getDocs(q);
        pacientes.value = querySnapshot.docs.map(doc => ({
          cpf: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        erro.value = "Erro ao carregar pacientes";
      }
    }

    function selecionarPaciente() {
      const pacienteSelecionado = pacientes.value.find(p => p.cpf === prescricao.value.pacienteId);
      if (pacienteSelecionado) {
        prescricao.value.pacienteNome = pacienteSelecionado.nome;
      }
    }

    async function salvarPrescricao() {
      erro.value = "";
      sucesso.value = "";
      const user = auth.currentUser;
      if (!user) {
        erro.value = "Usuário não autenticado!";
        return;
      }

      if (!prescricao.value.pacienteId) {
        erro.value = "Por favor, selecione um paciente.";
        return;
      }

      try {
        const prescricaoFormatada = {
          medicamento: prescricao.value.medicamento,
          dosagem: prescricao.value.dosagem,
          frequencia: prescricao.value.frequencia,
          observacoes: prescricao.value.observacoes,
          data: new Date().toISOString(),
          medicoId: user.uid,
          pacienteNome: prescricao.value.pacienteNome,
          notificacao: true // <-- AQUI: dentro da prescrição
        };

        const docRef = doc(db, "prescricoes", prescricao.value.pacienteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          await updateDoc(docRef, {
            lista: arrayUnion(prescricaoFormatada)
          });
        } else {
          await setDoc(docRef, {
            pacienteId: prescricao.value.pacienteId,
            pacienteNome: prescricao.value.pacienteNome,
            lista: [prescricaoFormatada]
          });
        }

        sucesso.value = "Prescrição salva com sucesso!";
        prescricao.value = {
          pacienteId: "",
          pacienteNome: "",
          medicamento: "",
          dosagem: "",
          frequencia: "",
          observacoes: "",
          data: ""
        };
      } catch (e) {
        erro.value = "Erro ao salvar prescrição: " + e.message;
        console.error(e);
      }
    }


    onMounted(() => {
      buscarPacientes();
    });

    return {
      prescricao,
      pacientes,
      salvarPrescricao,
      selecionarPaciente,
      erro,
      sucesso
    };
  }
};
</script>

<style scoped>
.container-prescricao-med {
  max-width: 600px;
  margin: 120px auto;
  padding: 25px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0,0,0,0.1);
}

h1 {
  color: #34495e;
  text-align: center;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 18px;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
}

input, textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

button {
  background-color: #42b983;
  color: white;
  padding: 12px 28px;
  font-weight: 700;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #2c8e62;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
  font-weight: 600;
}

.success-message {
  color: #27ae60;
  text-align: center;
  margin-top: 15px;
  font-weight: 600;
}
select {
  appearance: none;       /* Remove estilo padrão da seta */
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: #fff;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  padding: 10px 38px 10px 12px; /* Espaço para a seta */
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: border-color 0.3s ease;
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px 7px;
}

select:focus {
  border-color: #42b983;
  outline: none;
  box-shadow: 0 0 6px rgba(66, 185, 131, 0.5);
}

.form-group {
  margin-bottom: 18px;
  position: relative;
}

/* Se quiser, estilize o label para combinar */
label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
}
@media (max-width: 480px) {
  select {
    font-size: 14px;
    padding: 8px 30px 8px 10px;
    border-radius: 6px;
  }
}
</style>
