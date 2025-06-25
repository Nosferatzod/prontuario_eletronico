import Vue from 'vue'
import App from './App.vue'
import router from './Routes/rotas'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueRouter from 'vue-router'

// Configuração do Vue
Vue.use(BootstrapVue)
Vue.config.productionTip = false

// Patch para evitar erros de navegação duplicada
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err
  })
}

const originalReplace = VueRouter.prototype.replace
VueRouter.prototype.replace = function replace(location) {
  return originalReplace.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err
  })
}

// Inicialização do app
let app

onAuthStateChanged(auth, () => {  // Removido o parâmetro 'user' não utilizado
  if (!app) {
    app = new Vue({
      router,
      render: h => h(App),
    }).$mount('#app')
  }
  
  // Observação: Removemos o redirecionamento automático daqui
  // para evitar conflitos com as verificações no router.beforeEach
})