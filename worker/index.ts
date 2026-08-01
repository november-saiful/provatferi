export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const asset = await env.ASSETS.fetch(url.pathname);
    
    if (asset.status === 200) {
      return asset;
    }
    
    return env.ASSETS.fetch('/index.html');
  }
};
