import { handleLyricBrainstorm } from '../../../src/api-core/lyricBrainstormHandler';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const body = await request.json().catch(() => ({}));
    const { 
      keyword, 
      mode, 
      toneStyle, 
      contextSnippet, 
      songTitle, 
      genre, 
      premise, 
      customKeys 
    } = body;

    if (!keyword || typeof keyword !== 'string') {
      return new Response(JSON.stringify({ error: 'keyword string is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const result = await handleLyricBrainstorm(
      {
        keyword: keyword.trim(),
        mode: mode || 'metaphor',
        toneStyle: toneStyle || 'raw',
        contextSnippet,
        songTitle,
        genre,
        premise,
      },
      customKeys,
      context.env || {}
    );

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Lyric brainstorm process failed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}
