import { redirect } from 'next/navigation';

export default function UserTermsRedirect() {
  redirect('/legal?tab=terms');
}
