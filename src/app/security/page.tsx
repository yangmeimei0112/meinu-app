import { redirect } from 'next/navigation';

export default function SecurityRedirect() {
  redirect('/legal?tab=security');
}
