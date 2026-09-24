import { handleExplainConnection } from '../../../src/api-core/smartConnectionHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    const { noteA, noteB, sharedConcepts, sharedKeywords, customKeys } = body;

    if (!noteA || !noteB) {
      return new Response(JSON.stringify({ error: 'noteA and noteB are required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleExplainConnection(
      { noteA, noteB, sharedConcepts, sharedKeywords, customKeys },
      customKeys,
      context.env
    );

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Smart connection explanation failed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}
