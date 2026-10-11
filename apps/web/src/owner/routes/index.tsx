import { Route, Routes } from 'react-router-dom';
import { NotFound } from '@/ui/NotFound';
import { Placeholder } from '../screens/Placeholder';

export function OwnerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
