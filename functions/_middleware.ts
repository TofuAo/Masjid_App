export async function onRequest(context: any) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Don't rewrite if it's a static asset, API route, or already index.html
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|html)$/i) ||
    url.pathname === '/index.html'
  ) {
    return next();
  }

  // For SPA routes, rewrite to index.html
  const rewrittenUrl = new URL('/index.html', url.origin);
  rewrittenUrl.search = url.search;
  const rewrittenRequest = new Request(rewrittenUrl, request);
  return next(rewrittenRequest);
}

