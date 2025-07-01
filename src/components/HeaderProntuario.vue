<template>
  <div>
    <header id="header" class="navbar navbar-expand-lg navbar-dark fixed-top">
      <div class="container-fluid">
        <router-link to="/principal" class="navbar-brand d-flex align-items-center">
          <img src="../assets/LogoProntuario.png" alt="Logo PEP" class="me-2" style="height: 40px;">
          <span class="d-none d-md-inline">PEP - Prontuário Eletrônico Personalizado</span>
        </router-link>

        <button class="navbar-toggler" type="button" @click="toggleMenu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" :class="{ 'show': menuOpen }" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item position-relative">
              <i class="fas fa-bell" title="Notificações" @click="toggleNotifications"></i>
              <span v-if="unreadCount > 0" class="notification-count">
                {{ unreadCount }}
              </span>
              <div v-if="showNotifications" class="notifications-dropdown">
                <div v-if="notifications.length">
                  <ul>
                    <li v-for="notificacao in notifications" :key="notificacao.id" class="d-flex justify-content-between align-items-start">
                      <span>{{ notificacao.mensagem }}</span>
                      <button @click="removerNotificacao(notificacao.id)" class="btn-close btn-sm ms-2" aria-label="Fechar"></button>
                    </li>
                  </ul>
                </div>
                <div v-else>
                  <p>Nenhuma notificação por enquanto.</p>
                </div>
              </div>
            </li>

            <li class="nav-item">
              <i class="fas fa-user-circle" title="Perfil" @click="abrirPerfil"></i>
            </li>

            <li class="nav-item ms-lg-3 my-2 my-lg-0">
              <button @click="fazerLogout" class="btn btn-danger w-100 w-lg-auto">
                <i class="bi bi-box-arrow-right"></i> Sair
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <div class="painel-perfil" :class="{ aberto: painelAberto }">
      <div class="cabecalho-perfil">
        <h5>Perfil do Usuário</h5>
        <button @click="fecharPerfil">X</button>
      </div>
      <!-- Foto de perfil padrão -->
<div class="foto-perfil">
        <img src="../assets/perfil.png" alt="Foto de Perfil" />
</div>
      <div class="conteudo-perfil">
        <p><strong>Nome:</strong> {{ usuario.nome }}</p>
        <p><strong>ID do Usuário:</strong> {{ usuarioId }}</p>
        <p><strong>Email:</strong> {{ usuario.email }}</p>
        <p><strong>Ocupação:</strong> {{ usuario.cargo }}</p>
        <p><strong>Registro profissional:</strong> {{ usuario.registro }}</p>
        <p><strong>Descrição:</strong> {{ usuario.descricao }}</p>
  
      </div>
      <!-- Botão para ativar o modo edição -->
<button v-if="!editandoPerfil" class="btn btn-primary w-100 mb-2" @click="editandoPerfil = true">
  Editar Perfil
</button>

<!-- Formulário de edição -->
<div v-else class="form-edicao">
  <div class="mb-2">
    <label class="form-label">Nome</label>
    <input v-model="usuario.nome" type="text" class="form-control" />
  </div>
  <div class="mb-2">
    <label class="form-label">ID do Usuário</label>
    <input v-model="usuarioId" type="email" class="form-control" disabled />
  </div>
  <div class="mb-2">
    <label class="form-label">Email</label>
    <input v-model="usuario.email" type="email" class="form-control" disabled />
  </div>
  <div class="mb-2">
    <label class="form-label">Ocupação</label>
    <input v-model="usuario.cargo" type="text" class="form-control" disabled />
  </div>
   <div class="mb-2">
    <label class="form-label">Registro Profissional</label>
    <input v-model="usuario.registro" type="text" class="form-control" disabled />
  </div>
  <div class="mb-2">
    <label class="form-label">Descrição</label>
    <input v-model="usuario.descricao" type="text" class="form-control-maior" />
    <span class="text-opcional">Opcional, não é necessário preencher</span>
  </div>

  <button class="btn btn-success w-100 mb-2" @click="salvarPerfil">
    Salvar
  </button>
  <button class="btn btn-secondary w-100 mb-3" @click="cancelarEdicao">
    Cancelar
  </button>
</div>
      <button class="btn btn-danger w-100" @click="fazerLogout">
        <i class="bi bi-box-arrow-right"></i> Sair
      </button>
    </div>
  </div>
</template>

<script>
import { auth, db } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, getDocs, where, doc, updateDoc } from 'firebase/firestore';

export default {
  name: 'HeaderProntuario',
  data() {
    return {
      menuOpen: false,
      showNotifications: false,
      painelAberto: false,
      notifications: [],
      notificacoesLidas: false,
      usuario: {
        nome: '',
        usuarioId: '',
        email: '',
        cargo: '',
        registro: '',
        descricao: ''
      },
      unsubListeners: [],
      editandoPerfil: false,
      usuarioId: ''
    };
  },
  computed: {
    unreadCount() {
      return this.notificacoesLidas ? 0 : this.notifications.length;
    }
  },
  created() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.buscarDadosUsuario(user.uid);
        this.escutarNovosDocumentos(); // Escutar realtime
      }
    });
  },
  beforeUnmount() {
    this.unsubListeners.forEach(unsub => unsub());
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications) this.marcarNotificacoesComoLidas();
    },
    marcarNotificacoesComoLidas() {
      this.notificacoesLidas = true;
    },
    abrirPerfil() {
      this.painelAberto = true;
    },
    fecharPerfil() {
      this.painelAberto = false;
    },
    removerNotificacao(id) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    },
    async buscarDadosUsuario(uid) {
      try {
        const usuariosRef = collection(db, 'usuarios');
        const q = query(usuariosRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0];
          const data = docRef.data();

          this.usuario = {
          nome: data.nome || '',
          usuarioId: data.usuarioId || '',
          email: data.email || ''  ,
          cargo: data.ocupacao || '',
          registro: data.registro || '',
          descricao: data.descricao || ''
          
      };
    this.usuarioId = docRef.id;
        } else {
          console.warn('Nenhum usuário encontrado com UID:', uid);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    },
      async salvarPerfil() {
    try {
      const userRef = doc(db, 'usuarios', this.usuarioId);

      await updateDoc(userRef, {
        nome: this.usuario.nome,
        descricao: this.usuario.descricao // descrição é opcional
        // email está desativado, mas poderia ser adicionado aqui também
      });

      this.editandoPerfil = false;
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil.');
    }
  },

  cancelarEdicao() {
    this.editandoPerfil = false;
    this.buscarDadosUsuario(auth.currentUser.uid); // Recarrega dados antigos
  },
    async fazerLogout() {
      try {
        await signOut(auth);
        this.$router.push('/');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao sair. Tente novamente.');
      }
    },
    
    escutarNovosDocumentos() {
      const prescricoesRef = collection(db, 'prescricoes');  

      const unsubPrescricoes = onSnapshot(prescricoesRef, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          const docId = change.doc.id;
          const data = change.doc.data();
          const lista = data.lista || [];

          lista.forEach((item, index) => {
            if (item.notificacao === true) {
              this.notifications.unshift({
                id: `${docId}-${index}`,
                mensagem: `Prescrição para ${data.pacienteNome || 'Paciente desconhecido'}: ${item.medicamento}`
              });
            }
          });
        });
      });

      this.unsubListeners.push(unsubPrescricoes);
    }
  }
};
</script>

<style scoped>
.painel-perfil {
  /* já possui outras propriedades */
  overflow-y: auto; /* habilita rolagem vertical */
  max-height: 100vh; /* garante que não ultrapasse a tela */
}

/* Header */
#header {
  background-color: #5a9deb;
  font-family: 'Montserrat';
  padding: 0.5rem 1rem;
}

#header img {
  height: 40px;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.navbar-nav i {
  font-size: 28px;
  color: white;
  cursor: pointer;
  transition: color 0.3s;
}

.navbar-nav i:hover {
  color: #b6d9ff;
}

/* Notificações */
.notifications-dropdown {
  position: absolute;
  top: 60px;
  right: 0;
  width: 300px;
  max-height: 300px;/*Limita a altura*/
  overflow-y:auto;/* Habilita a rolagem vertical*/
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 15px;
  z-index: 1000;
}

.notifications-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notifications-dropdown li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  position: relative; /* Adicionado para posicionamento do botão */
}

.notifications-dropdown li:last-child {
  border-bottom: none;
}

/* Estilo do botão de fechar */
.notifications-dropdown .btn-close {
  background: none;
  border: none;
  font-size: 12px;
  color: #999;
}

.notifications-dropdown .btn-close:hover {
  color: #ff0000;
}

.notification-count {
  position: absolute;
  top: -2px;
  right: -5px;
  background-color: red;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* Painel Perfil */
.painel-perfil {
  position: fixed;
  top: 0;
  right: -350px;
  width: 300px;
  height: 100%;
  background-color: rgb(227, 237, 252);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  padding: 20px;
  z-index: 2000;
  transition: right 0.3s ease;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  overflow-y: auto; /* <- adicionado */
  max-height: 100vh; /* <- adicionado */
}
.painel-perfil.aberto {
  right: 0;
}

.foto-perfil {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.foto-perfil img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: black;
  padding: 8px;
}

.cabecalho-perfil {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cabecalho-perfil h5 {
  margin: 0;
}

.cabecalho-perfil button {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.conteudo-perfil p {
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.conteudo-perfil strong {
  color: #000;
}
.form-edicao input {
  font-size: 14px;
}
.text-opcional {
  font-size: 12px;
  color: #50aaff;
  margin-top: 12px;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.btn-danger:hover {
  background-color: #cc0000;
}
.form-edicao {
  margin-bottom: 1rem;
}

.form-edicao label {
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
  color: #333;
}

.form-control-maior {
  padding: 1rem;
  margin-top: 0.20rem;
  border-radius: 0.50rem;
  border: 1px solid #ccc;
}


/* Responsivo */
@media (max-width: 991.98px) {
  .navbar-collapse {
    padding: 1rem;
    background-color: #5a9deb;
    margin-top: 0.5rem;
    border-radius: 0.25rem;
  }
}

@media (max-width: 991.98px) {
  .navbar-collapse {
    padding: 1rem;
    background-color: #5a9deb;
    margin-top: 0.5rem;
    border-radius: 0.25rem;
  }
  .notifications-dropdown {
    width: 300px !important; /* ou 280px se quiser ainda menor */
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    top: 60px;
    max-height: 250px;
  }
  .navbar-nav {
    flex-direction: row !important;
    justify-content: flex-end;
    gap: 15px;
  }

  .navbar-nav .nav-item {
    margin: 0;
  }

  .navbar-nav .nav-item i {
    font-size: 24px;
  }
}

</style>  
