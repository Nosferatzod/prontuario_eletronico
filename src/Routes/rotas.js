import Vue from 'vue';
import VueRouter from 'vue-router';
import { auth, db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

import TelaLogin from '@/pages/TelaLogin.vue';
import TelaCadastro from '@/pages/TelaCadastro.vue';
import CadastroPacientes from '@/pages/CadastroPacientes.vue';
import TelaPrincipal from '@/pages/TelaPrincipal.vue';
import TelaTriagem from '@/pages/TelaTriagem.vue';
import TelaPrescricaoMed from '@/pages/TelaPrescricaoMed.vue';
import TelaPrescricaoEnf from "@/pages/TelaPrescricaoEnf.vue";
import EvolucaoMedica from '@/pages/EvolucaoMedica.vue';
import RelatorioEnf from '@/pages/RelatorioEnf.vue';

Vue.use(VueRouter);

const routes = [
  { 
    path: '/', 
    name: 'Login', 
    component: TelaLogin,
    meta: { requiresAuth: false } 
  },
  { 
    path: '/cadastro', 
    name: 'Cadastro', 
    component: TelaCadastro,
    meta: { requiresAuth: true, allowedRoles: ['administrativo'] }
  },
  { 
    path: '/cadastropaciente', 
    name: 'CadastroPaciente', 
    component: CadastroPacientes,
    meta: { requiresAuth: true, allowedRoles: ['administrativo', 'recepcionista'] }
  },
  { 
    path: '/principal', 
    name: 'TelaPrincipal', 
    component: TelaPrincipal,
    meta: { requiresAuth: true }
  },
  { 
    path: '/triagem', 
    name: 'TelaTriagem', 
    component: TelaTriagem,
    meta: { requiresAuth: true, allowedRoles: ['enfermeiro' ,'administrativo'] }
  },
  { 
    path: '/atendimento/prescricao', 
    component: TelaPrescricaoMed,
    meta: { requiresAuth: true, allowedRoles: ['medico' ,'administrativo'] }
  },
  { 
    path: '/prescricaoContentEnf', 
    name: 'TelaPrescricaoEnf', 
    component: TelaPrescricaoEnf,
    meta: { requiresAuth: true, allowedRoles: ['enfermeiro', 'administrativo', 'tecnico_enfermagem'] }
  },
  { 
    path: '/relatorio', 
    name: 'RelatorioEnf', 
    component: RelatorioEnf,
    meta: { requiresAuth: true, allowedRoles: ['enfermeiro', 'administrativo', 'tecnico_enfermagem'] }
  },
  { 
    path: '/atendimento/evolucao', 
    name: 'EvolucaoMedica', 
    component: EvolucaoMedica,
    meta: { requiresAuth: true, allowedRoles: ['medico', 'administrativo'] }
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err;
  });
};

const originalReplace = VueRouter.prototype.replace;
VueRouter.prototype.replace = function replace(location) {
  return originalReplace.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err;
  });
};

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const allowedRoles = to.meta.allowedRoles;
  const currentUser = auth.currentUser;

  if (requiresAuth) {
    if (!currentUser) {
      if (from.path !== '/') next('/');
      return;
    }

    try {
      const q = query(
        collection(db, 'usuarios'),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        next('/');
        return;
      }

      const userData = querySnapshot.docs[0].data();
      const ocupacao = userData.ocupacao || userData.Ocupacao;

      if (allowedRoles && !allowedRoles.includes(ocupacao)) {
        if (from.path !== '/principal') next('/principal');
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      next('/');
    }
  } else if (to.path === '/' && currentUser) {
    if (from.path !== '/principal') next('/principal');
  } else {
    next();
  }
});

export default router;
