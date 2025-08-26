Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;
        
        // Handle root path
        // Response 1: Serves index.html for the root path "/"
        if (path === '/') {
            return new Response(Bun.file('public/index.html'), {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Try to serve static files (CSS, JS, audio, images, etc.)
        // Response 2: Serves ANY file that exists in public/
        const filePath = `public${path}`;  // Serves a different path
        const file = Bun.file(filePath);
        
        if (await file.exists()) {
            // This is what serves your static assets!
            return new Response(file);
        }
        
        // Handle 404s properly
        return new Response('File not found', { status: 404 });
    }
});