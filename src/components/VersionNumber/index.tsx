import React from 'react';
import packageJson from '../../../package.json';

export default function VersionNumber() {
  return <div id='versionNumber'>Version: {packageJson.version}</div>;
}