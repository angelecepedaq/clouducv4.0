import Document, { Html, Head, Main, NextScript } from 'next/document';

// Minimal custom Document to satisfy Next.js during build.
// Keeps the app router intact while providing the legacy /_document entrypoint.
export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="es">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
