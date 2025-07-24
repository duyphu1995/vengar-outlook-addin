import "./App.scss";

import React, { useState } from "react";

import { useLocation } from "react-router-dom";
import { EncryptPath } from "./consts";
import useAppSettings from "./hooks/useAppSettings";
import Index from "./pages/Index";

import Context, { Dialog } from "./pages/Secure/Context";

/**
 * The main component of the Outlook add-in
 *
 * It initializes the Context with default values and renders the Index page.
 */
function App() {
  // Set isEncryptPath to localStorage
  localStorage.setItem("isEncryptPath", JSON.stringify(useLocation().pathname === EncryptPath));

  const { userProfile } = Office.context.mailbox;

  const { setDefaultAccount } = useAppSettings();
  setDefaultAccount(userProfile?.emailAddress);

  // Initialize the Context with default values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allowForward, setAllowForward] = useState(false); // whether the user is allowed to forward the email
  const [allowCopy, setAllowCopy] = useState(false); // whether the user is allowed to copy the email
  const [allowPrint, setAllowPrint] = useState(false); // whether the user is allowed to print the email
  const [allowSave, setAllowSave] = useState(false); // whether the user is allowed to save the email
  const [completedFilesBytes, setCompletedFilesBytes] = useState<Uint8Array>(null); // the encrypted files bytes
  const [countries, setCountries] = useState<number[]>([]); // the selected countries
  const [dialog, setDialog] = useState<Dialog | null>(null); // the Dialog component
  const [enableDecryptReceipts, setEnableDecryptReceipts] = useState(false); // whether to decrypt receipts
  const [error, setError] = useState<Error | null>(null); // the error object
  const [isLogin, setIsLogin] = useState<boolean>(false); // whether the user is logged in
  const [submitting, setSubmitting] = useState(false); // whether the form is submitting
  const [sunrise, setSunrise] = useState<Date | null>(null); // the sunrise time
  const [sunset, setSunset] = useState<Date | null>(null); // the sunset time
  const [templateEB, setTemplateEB] = useState(""); // the encrypted template

  const state = {
    allowForward,
    allowCopy,
    allowPrint,
    allowSave,
    completedFilesBytes,
    countries,
    dialog,
    enableDecryptReceipts,
    error,
    isLogin,
    templateEB,
    setAllowForward,
    setAllowCopy,
    setAllowPrint,
    setAllowSave,
    setCompletedFilesBytes,
    setCountries,
    setDialog,
    setEnableDecryptReceipts,
    setError,
    setIsLogin,
    setSubmitting,
    setSunrise,
    setSunset,
    setTemplateEB,
    submitting,
    sunrise,
    sunset,
  };

  return (
    <div id="app">
      <main>
        <div className="content">
          <Context.Provider value={state}>
            {/* Provide the Context values to the children */}
            <Index />
          </Context.Provider>
        </div>
      </main>
    </div>
  );
}

export default App;
