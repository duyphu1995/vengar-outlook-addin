import React, { useEffect, useReducer, useState } from 'react';

import classNames from 'classnames';
import padStart from 'lodash/padStart';
import moment from 'moment';
import styles from './Counter.module.scss';

interface ICounterProps {
  timeout: number;
}

export default function Counter({ timeout }: ICounterProps) {
  const [started] = useState(new Date());
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const interval = setInterval(forceUpdate, 500);
    return function cleanup() {
      clearInterval(interval);
    };
  }, []);

  const diff = new Date().getTime() - started.getTime();
  const duration = moment.duration(timeout - diff);
  const minutes = duration.minutes() > 0 ? duration.minutes() : 0;
  const seconds = duration.seconds() > 0 ? duration.seconds() : 0;

  return (
    <span className={classNames({ [styles.expiring]: minutes < 1 })}>
      {minutes}:{padStart(seconds.toString(), 2, '0')}
    </span>
  );
}
