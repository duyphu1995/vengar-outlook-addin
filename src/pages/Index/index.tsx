import { BaseResource } from "@ebi/api-client";
import { useAccounts } from "@ebi/hooks";

import moment from "moment";
import React, { useContext, useEffect, useState } from "react";

import AsyncBoundary from "../../components/AsyncBoundary";
import Loading from "../../components/Loading";
import NetworkErrorMessage from "../../components/NetworkErrorMessage";
import Context from "../Secure/Context";
import Authorized from "./Authorized";
import Unauthorized from "./Unauthorized";

BaseResource.apiUrl = process.env.REACT_APP_API_URL;
function Index() {
  const currentEmail = Office.context.mailbox?.userProfile.emailAddress;
  const { accounts } = useAccounts();

  const { isLogin } = useContext(Context);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);

  useEffect(() => {
    if (!accounts || accounts.length == 0) {
      setIsAuthorized(false);
    } else {
      // get auth-tokens from localStorage
      const auth = JSON.parse(localStorage.getItem("auth-tokens"));

      // get auth-tokens from localStorage by current account
      let authDefault = auth ? auth.filter((auth) => auth.email === currentEmail) : null;

      if (authDefault.length == 0) {
        setIsAuthorized(false);
      } else {
        let currAuthAccount = authDefault[authDefault.length - 1];

        const newArrAuth = auth.filter((element) => !(element.email == currentEmail));
        newArrAuth.push(currAuthAccount);
        localStorage.setItem("auth-tokens", JSON.stringify(newArrAuth));

        setIsAuthorized(!moment().isAfter(currAuthAccount.expiration));
      }
    }
  }, [accounts]);

  useEffect(() => {
    // if current account is not authorized or token is expired, reload the page
    if (isLogin) window.location.reload();
  }, [isLogin]);

  // if isAuthorized = true then show Authorized, else show Unauthorized
  return isAuthorized ? <Authorized /> : <Unauthorized />;
}

export default function IndexWithSuspense() {
  return (
    <AsyncBoundary errorFallback={NetworkErrorMessage} loadingFallback={Loading}>
      <Index />
    </AsyncBoundary>
  );
}
