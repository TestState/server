import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import ui from '@nuxt/ui/vue-plugin';

import App from './App.vue';
import router from './router';
import './index.css';

const app = createApp(App);

app.use(router);
app.use(ui);
app.use(VueQueryPlugin);
app.mount('#app');
