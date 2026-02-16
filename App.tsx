import React from "react";
import KidAuthGate from "./components/KidAuthGate";
import KidAppShell from "./components/KidAppShell";

const App: React.FC = () => {
  return (
    <KidAuthGate>
      {(kidCode) => <KidAppShell kidCode={kidCode} />}
    </KidAuthGate>
  );
};

export default App;
