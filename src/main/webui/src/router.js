import { createRouter, createWebHistory } from 'vue-router';
const Dashboard = () => import('@/pages/Dashboard.vue');
const Payloads = () => import('@/pages/Payloads.vue');
const PayloadForm = () => import('@/pages/PayloadForm.vue');
const Tests = () => import('@/pages/Tests.vue');
const TestForm = () => import('@/pages/TestForm.vue');
const TestRun = () => import('@/pages/TestRun.vue');
const TestStatus = () => import('@/pages/TestStatus.vue');
const BatchStatus = () => import('@/pages/BatchStatus.vue');
const Translations = () => import('@/pages/Translations.vue');
const TranslationForm = () => import('@/pages/TranslationForm.vue');
const TranslationStatus = () => import('@/pages/TranslationStatus.vue');

const routes = [
  { path: '/', component: Dashboard, meta: { title: 'Dashboard' } },
  { path: '/payloads', component: Payloads, meta: { title: 'Payloads' } },
  { path: '/payloads/new', component: PayloadForm, meta: { title: 'New Payload' } },
  { path: '/payloads/:id/edit', component: PayloadForm, props: true, meta: { title: 'Edit Payload' } },
  { path: '/tests', component: Tests, meta: { title: 'Tests' } },
  { path: '/tests/new', component: TestForm, meta: { title: 'New Test' } },
  { path: '/tests/:id/edit', component: TestForm, props: true, meta: { title: 'Edit Test' } },
  { path: '/tests/:id/run', component: TestRun, props: true, meta: { title: 'Run Test' } },
  { path: '/tests/session/:sessionId/status', component: TestStatus, props: true, meta: { title: 'Test Session Status' } },
  { path: '/tests/batch/:batchId/status', component: BatchStatus, props: true, meta: { title: 'Batch Status' } },
  { path: '/translations', component: Translations, meta: { title: 'Translations' } },
  { path: '/translations/new', component: TranslationForm, meta: { title: 'New Translation' } },
  { path: '/translations/:sessionId/status', component: TranslationStatus, props: true, meta: { title: 'Translation Status' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const baseTitle = 'TestState CMS';
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
});

export default router;
