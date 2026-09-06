import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Custom web HTML template for Cronology.
 * Preloads Inter fonts and sets up sleek dark-mode styling with no flash of unstyled content.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <title>Cronology — TV Universe & Episode Tracker</title>
        <meta name="description" content="Rastreador avanzado de series y del Chicago Universe con IA y crossovers en orden cronológico" />
        <meta name="theme-color" content="#7c5af3" />

        {/* Preload Google Fonts Inter for instant web rendering */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              color-scheme: dark;
              background-color: #0a0a0f !important;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
            }
            html {
              background-color: #0a0a0f !important;
              color-scheme: dark !important;
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
              -webkit-text-size-adjust: 100% !important;
            }
            body {
              background-color: #0a0a0f !important;
              background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.18), rgba(10, 10, 15, 1) 70%) !important;
              background-attachment: fixed !important;
              color: #f1f5f9;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
              overflow-x: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
              min-height: 100vh !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            #root {
              background-color: #0a0a0f !important;
              min-height: 100vh !important;
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
              display: flex !important;
              flex-direction: column !important;
            }
            /* Sleek Dark Scrollbar */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #0d0e17;
            }
            ::-webkit-scrollbar-thumb {
              background: #2a2b42;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #7c5af3;
            }
            /* Smooth transitions for interactive elements */
            a, button {
              transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* ─── ELIMINAR COMPLETAMENTE BADGE Y DRAWER DE NETLIFY ─── */
            [data-netlify-badge],
            .netlify-badge,
            netlify-badge,
            a[href*="netlify.com"],
            div[class*="netlify"],
            div[id*="netlify"],
            iframe[id*="netlify"],
            iframe[src*="netlify"],
            #netlify-drawer,
            .netlify-drawer-button,
            [data-netlify-drawer],
            [id*="netlify-drawer"],
            [class*="NetlifyBadge"],
            [class*="netlify-badge"],
            [aria-label*="Netlify"],
            [title*="Netlify"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              position: absolute !important;
              left: -99999px !important;
              top: -99999px !important;
              width: 0 !important;
              height: 0 !important;
              max-width: 0 !important;
              max-height: 0 !important;
              overflow: hidden !important;
              z-index: -9999 !important;
            }
          `,
        }} />

        {/* Script para remover de inmediato cualquier elemento inyectado por Netlify */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function purgeNetlify() {
                  var selectors = [
                    '[data-netlify-badge]',
                    '.netlify-badge',
                    'netlify-badge',
                    'a[href*="netlify.com"]',
                    'div[class*="netlify"]',
                    'div[id*="netlify"]',
                    'iframe[id*="netlify"]',
                    'iframe[src*="netlify"]',
                    '#netlify-drawer',
                    '.netlify-drawer-button',
                    '[data-netlify-drawer]'
                  ];
                  selectors.forEach(function(sel) {
                    var els = document.querySelectorAll(sel);
                    for (var i = 0; i < els.length; i++) {
                      if (els[i] && els[i].parentNode) {
                        els[i].parentNode.removeChild(els[i]);
                      }
                    }
                  });
                }
                if (typeof document !== 'undefined') {
                  purgeNetlify();
                  document.addEventListener('DOMContentLoaded', purgeNetlify);
                  window.addEventListener('load', purgeNetlify);
                  if (typeof MutationObserver !== 'undefined') {
                    var obs = new MutationObserver(function() {
                      purgeNetlify();
                    });
                    obs.observe(document.documentElement, { childList: true, subtree: true });
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
