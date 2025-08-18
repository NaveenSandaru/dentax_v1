import React, { Suspense } from 'react';
import StudyPage from './AdminPatients';

export const dynamic = 'force-dynamic';


const Page = () => {
  return (
    <Suspense fallback={<div>Loading workspace...</div>}>
      <StudyPage />
    </Suspense>
  );
};

export default Page;