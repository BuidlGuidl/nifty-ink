import '../styles/globals.css';

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html data-theme="light">
      <body>{children}</body>
    </html>
  );
};

export default ScaffoldEthApp;
