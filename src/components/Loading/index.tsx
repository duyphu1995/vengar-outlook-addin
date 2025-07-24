import LoadingSpinner from '../../components/LoadingSpinner';
import { LogoWithText } from '../../assets/index';
import React from 'react';
import strings from '../../strings';
import styles from './Loading.module.scss';

export default function Loading() {
  return (
    <div className="flex-fill d-flex flex-column justify-content-center align-items-center">
      <img src={LogoWithText} alt="EB Control logo" className={styles.logo} />
      <LoadingSpinner className="my-4" />
      <div>{strings.pageIndexLoading}...</div>
    </div>
  );
}
