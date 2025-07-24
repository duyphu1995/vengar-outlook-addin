import { NetworkError } from 'rest-hooks';
import React from 'react';

export default function NetworkErrorMessage({
  error
}: {
  error: NetworkError;
}) {
  return (
    <div>
      {error.status} {error.response && error.response.statusText}
    </div>
  );
}
