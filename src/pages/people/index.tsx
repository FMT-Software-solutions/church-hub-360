import { Outlet } from 'react-router-dom';

export function People() {
  return (
    <div className="px-6 py-4">
      <Outlet />
    </div>
  );
}
