import { AntdRegistry } from "@ant-design/nextjs-registry";
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
      <body>
        <ApolloWrapper>
          <ThemeProvider enableSystem defaultTheme="light">
            <AntdRegistry>
              <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
            </AntdRegistry>
          </ThemeProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
