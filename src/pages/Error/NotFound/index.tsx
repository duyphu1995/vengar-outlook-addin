import { Location } from 'history';
import React from 'react';
import { useLocation } from 'react-router-dom';

interface FromState {
  from: Location;
}

export default function NotFound() {
  const location: Location = useLocation();

  const isFromState = (arg: unknown): arg is { from: Location } =>
    !!arg && Object.prototype.hasOwnProperty.call(arg, 'from');
  const state: FromState | null = isFromState(location.state)
    ? location.state
    : null;

  return (
    <div>
      <h1>404: Not Found</h1>
      {state ? `Route: ${state.from.pathname}` : null}
    </div>
  );
}
