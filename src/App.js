import React from "react";

//components
import Chat from "./components/Chat";

import styled from "styled-components";
import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <Container>
      <Chat />
    </Container>
  );
}

export default App;

const Container = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  background-color: dimgrey;
`;
