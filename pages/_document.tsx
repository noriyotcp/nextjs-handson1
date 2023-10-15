import { Html, Head, Main, NextScript } from "next/document";

export default function Index() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href={
            "https://fonts.googleapis.com/css2" +
            "?family=Noto+Sans+JP:wght@400;500;700" +
            "&display=swap"
          }
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
