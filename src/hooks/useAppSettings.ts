import { createGlobalState } from 'react-hooks-global-state';
import { useEffect } from 'react';

const DEFAULT_ACCOUNT_KEY = 'default-account';

export interface SettingsValues {
  defaultAccount: string | null;
}

export interface SettingsMutators {
  setDefaultAccount: (u: React.SetStateAction<string | null>) => void;
}

const { useGlobalState } = createGlobalState({
  defaultAccount: localStorage.getItem(DEFAULT_ACCOUNT_KEY)
});

export interface Settings extends SettingsValues, SettingsMutators {}

export default function useAppSettings(): Settings {
  const [defaultAccount, setDefaultAccount] = useGlobalState('defaultAccount');

  useEffect(() => {
    if (defaultAccount) {
      localStorage.setItem(DEFAULT_ACCOUNT_KEY, defaultAccount);
    } else {
      localStorage.removeItem(DEFAULT_ACCOUNT_KEY);
    }
  }, [defaultAccount]);

  return {
    defaultAccount,
    setDefaultAccount
  };
}
