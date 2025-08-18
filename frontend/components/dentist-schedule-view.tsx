"use client";

import React from 'react';

// We import the page component that already contains the full schedule implementation
// and simply wrap it so we can embed it inside other pages/components.
// NOTE: We intentionally import from the page file path. In Next.js 13+, this is
// allowed as the file just exports a React component – there is no special runtime
// behaviour when it is used programmatically.
// If you later refactor the dentist schedule page to extract the logic into its own
// component, you can update this import accordingly.
import DentistSchedulePage from '@/app/dentist/schedule/page';
import { AuthContext } from '@/context/auth-context';

interface DentistScheduleViewProps {
  dentistId: string;
}

/**
 * Wrapper around the dentist schedule page so that we can embed the exact same
 * interface inside other modules (e.g. Admin Appointments) without code
 * duplication. It forwards the given `dentistId` via the expected `params`
 * prop.
 */
export default function DentistScheduleView({ dentistId }: DentistScheduleViewProps) {
  const auth = React.useContext(AuthContext);

  // If the current user is admin, override the role to 'dentist' so the underlying
  // schedule component does not block access. We keep other auth values intact.
  const patchedAuth = React.useMemo(() => {
    if (auth.user?.role === 'admin') {
      return { ...auth, user: { ...auth.user, role: 'dentist', id: dentistId } };
    }
    return auth;
  }, [auth, dentistId]);

  return (
    <AuthContext.Provider value={patchedAuth as any}>
      <DentistSchedulePage params={{ dentistId }} />
    </AuthContext.Provider>
  );
}

