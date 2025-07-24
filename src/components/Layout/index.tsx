import classNames from "classnames";
import React from "react";
import Header from "../Header";

import styles from "./Layout.module.scss";

interface ILayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: ILayoutProps) {
  return (
    <div className="vh-100 d-flex flex-column overflow-hidden">
      <Header />
      <div className={classNames("d-flex flex-column overflow-hidden", styles.header)}>
        <div className={classNames(styles.header)}>
          <main className="d-flex justify-content-center">{children}</main>
        </div>
      </div>
    </div>
  );
}
