import { createRouter } from 'sv-router';
import Dashboard from './pages/Dashboard.svelte';
import Payloads from './pages/Payloads.svelte';
import PayloadForm from './pages/PayloadForm.svelte';
import Tests from './pages/Tests.svelte';
import TestForm from './pages/TestForm.svelte';
import TestRun from './pages/TestRun.svelte';
import TestStatus from './pages/TestStatus.svelte';
import BatchStatus from './pages/BatchStatus.svelte';
import Translations from './pages/Translations.svelte';
import TranslationForm from './pages/TranslationForm.svelte';
import TranslationStatus from './pages/TranslationStatus.svelte';

export const { p, navigate, isActive, route } = createRouter({
  '/': Dashboard,
  '/payloads': Payloads,
  '/payloads/new': PayloadForm,
  '/payloads/:id/edit': PayloadForm,
  '/tests': Tests,
  '/tests/new': TestForm,
  '/tests/:id/edit': TestForm,
  '/tests/:id/run': TestRun,
  '/tests/session/:sessionId/status': TestStatus,
  '/tests/batch/:batchId/status': BatchStatus,
  '/translations': Translations,
  '/translations/new': TranslationForm,
  '/translations/:sessionId/status': TranslationStatus
});
