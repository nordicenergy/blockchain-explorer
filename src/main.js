import Vue from 'vue'
import VueRouter from 'vue-router'
import App from "./App.vue";
import Index from "./components/Index.vue";
import Block from "./components/Block.vue";
import Transaction from "./components/Transaction.vue";
import Address from "./components/Address.vue";
import moment from 'moment';

Vue.config.productionTip = false;

Vue.use(VueRouter);

const routes = [
  { path: '/', component: Index },
  { path: '/block/:id', component: Block },
  { path: '/tx/:id', component: Transaction },
  { path: '/address/:id', component: Address },
];

const router = new VueRouter({
  routes
});

router.afterEach(() => {
  $('.alert').hide();
});

Vue.filter('datetime', function (value) {
  if (!value) return '';
  const power = value.toString().length - 13;
  return moment(value / Math.pow(10, power)).format('YYYY-MM-DD HH:mm:ss');
});

Vue.filter('cleanDecodedObject', function (decodedObject) {
  if (!decodedObject) return '';
  delete decodedObject.__length__;
  return Object.keys(decodedObject)
    .filter(key => !/^\d+$/.test(key))
    .reduce((obj, key) => {
      obj[key] = decodedObject[key];
      return obj;
    }, {});
});

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
