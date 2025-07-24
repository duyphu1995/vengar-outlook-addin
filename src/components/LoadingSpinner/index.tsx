import React from "react";

import { Spinner } from "react-bootstrap";

export type page = "welcome" | "decrypt" | "encrypt" | "where" | "confirm";

interface LoadingSpinnerProps {
  children?: React.ReactNode;
  className?: string | undefined;
  size?: "sm" | undefined;
  page?: page;
  step?: string;
}

export default function LoadingSpinner({ children, className, size, page, step }: LoadingSpinnerProps) {
  return (
    <div
      className={
        page == "decrypt" || page == "encrypt" || page == "where"
          ? "flex-fill d-flex flex-column justify-content-center align-items-center"
          : ""
      }
      style={page && { margin: 10 }}
    >
      <Spinner className={className} animation="border" role="status" size={size}>
        <span className="visually-hidden">Loading...</span>
        {children}
      </Spinner>
      <span style={{ marginTop: 10, fontSize: 16 }}>{step}</span>
    </div>
  );
}

LoadingSpinner.defaultProps = {
  children: undefined,
  size: undefined,
};
