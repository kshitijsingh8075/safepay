
import React from "react";
import { Route, Switch } from "wouter";
import Home from "./pages/home";
import Scan from "./pages/scan";
import ChatSupport from "./pages/chat-support";
import Account from "./pages/account";
import FraudMap from "./pages/fraud-map";

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/scan" component={Scan} />
        <Route path="/chat-support" component={ChatSupport} />
        <Route path="/account" component={Account} />
        <Route path="/fraud-map" component={FraudMap} />
      </Switch>
    </div>
  );
}

export default App;
