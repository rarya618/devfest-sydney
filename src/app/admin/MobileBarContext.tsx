'use client';

import { createContext, useContext } from 'react';

export const MobileBarContext = createContext(false);

export function useMobileBarHidden() {
  return useContext(MobileBarContext);
}
