'use client';

import { useState, useEffect } from 'react';

type Props = {
  children: React.ReactNode;
};

const NoSSR = ({ children }: Props) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? <>{children}</> : null;
};

export default NoSSR;
