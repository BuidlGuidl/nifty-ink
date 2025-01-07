import Head from "next/head";
import "@rainbow-me/rainbowkit/styles.css";
import { ApolloWrapper } from "~~/apollo/ApolloWrapper";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Nifty Ink",
  description: "NFT artwork: Putting the fun in non-fungible tokens",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <Head>
        <script async defer data-domain="nifty.ink" src="https://plausible.io/js/script.js"></script>
      </Head>
      <body>
        <ApolloWrapper>
          <ThemeProvider enableSystem defaultTheme="light">
            <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
          </ThemeProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
