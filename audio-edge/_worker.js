const FIREBASE_ORIGIN = 'https://hitobito-audio.web.app';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, FIREBASE_ORIGIN);
    const headers = new Headers(request.headers);
    headers.set('x-hitobito-audio-edge', 'firebase-origin');

    const upstream = await fetch(new Request(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'follow'
    }));

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set('x-hitobito-audio-origin', 'firebase');
    responseHeaders.set('x-hitobito-audio-edge', 'cloudflare-pages');
    responseHeaders.set('x-hitobito-audio-release', '1');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  }
};
