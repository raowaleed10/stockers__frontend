import { http, HttpResponse } from 'msw';

// Owner API only (/api/owner/*). The real handlers come in P03. Only the owner entry imports this.
export const ownerHandlers = [http.get('/api/owner/health', () => HttpResponse.json({ ok: true }))];
