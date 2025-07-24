import React from "react";
import Layout from "../../../components/Layout";
import Decrypt from "../../../pages/Decrypt";
import Encrypt from "../../../pages/Encrypt";

export default function AuthorizedIndex() {
  // if isEncryptPath = true then show Encrypt, else show Decrypt
  const isEncryptPath = JSON.parse(localStorage.getItem("isEncryptPath"));
  return <Layout>{isEncryptPath ? <Encrypt /> : <Decrypt />}</Layout>;
}
